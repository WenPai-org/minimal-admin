/**
 * User Switching delight — "Switch to this user" in the users row menu rides
 * the plugin's own nonce URL (adapters/user-switching.php). Asserts the entry
 * exists for another user, is absent on your own row, and that clicking it
 * REALLY switches: after the navigation the session belongs to the target.
 *
 * The switched session lives only in this browser context, so no cleanup is
 * needed beyond closing the browser.
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'user-switching' );
	const { browser, page, errors } = await launch();
	await login( page );

	await page.goto( BASE + '/minimal-admin/users', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '.minimal-table-row[data-user]', { timeout: 20000 } );

	t.check( 'boot list carries switch URLs', await page.evaluate( () =>
		!! document.querySelector( '.minimal-table-row[data-uname="Minimal Author"]' ) ) );

	// Own row: no switch entry (the plugin refuses self-switch).
	await page.click( `.minimal-table-row[data-uname="admin"] .minimal-row-more` );
	await page.waitForSelector( '.minimal-ctx-menu', { timeout: 5000 } );
	t.check( 'own row menu has no Switch entry', await page.evaluate( () =>
		! Array.from( document.querySelectorAll( '.minimal-ctx-menu button' ) ).some( ( b ) => /Switch to this user/.test( b.textContent ) ) ) );
	await page.keyboard.press( 'Escape' );
	await page.evaluate( () => document.body.click() );

	// Another user's row: entry present under Access.
	await page.click( '.minimal-table-row[data-uname="Minimal Author"] .minimal-row-more' );
	await page.waitForSelector( '.minimal-ctx-menu', { timeout: 5000 } );
	const hasSwitch = await page.evaluate( () =>
		Array.from( document.querySelectorAll( '.minimal-ctx-menu button' ) ).some( ( b ) => /Switch to this user/.test( b.textContent ) ) );
	t.check( 'author row menu offers Switch to this user', hasSwitch );

	// Click it and prove the session really changes hands.
	if ( hasSwitch ) {
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'domcontentloaded', timeout: 30000 } ),
			page.evaluate( () => {
				Array.from( document.querySelectorAll( '.minimal-ctx-menu button' ) )
					.find( ( b ) => /Switch to this user/.test( b.textContent ) ).click();
			} ),
		] );
		await page.goto( BASE + '/minimal-admin/', { waitUntil: 'domcontentloaded' } );
		await page.waitForFunction( () => window.MINIMAL && window.MINIMAL.user, null, { timeout: 20000 } );
		const who = await page.evaluate( () => window.MINIMAL.user.login );
		t.check( 'after switching, Minimal boots as the target user', who === 'minimal-author', who );

		// The way home: a switched session boots with switchBack and the nav
		// wears the escape (the plugin's back-link lives in the admin bar
		// Minimal never renders). Clicking it lands back in Minimal as the admin.
		const back = await page.evaluate( () => window.MINIMAL.switchBack );
		t.check( 'switched boot carries switchBack', !! back && !! back.url && !! back.name, JSON.stringify( back ) );
		await page.waitForSelector( '.minimal-switchback', { timeout: 10000 } );
		t.check( 'nav wears the Switch back bar', await page.$eval( '.minimal-switchback', ( el ) => /Switch back to/.test( el.textContent ) ) );
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'domcontentloaded', timeout: 30000 } ),
			page.click( '.minimal-switchback' ),
		] );
		await page.waitForFunction( () => window.MINIMAL && window.MINIMAL.user, null, { timeout: 20000 } );
		const home = await page.evaluate( () => ( {
			login: window.MINIMAL.user.login,
			inMinimal: location.pathname.includes( 'minimal-admin' ),
			bar: !! document.querySelector( '.minimal-switchback' ),
		} ) );
		t.check( 'switch back lands in Minimal as the original admin', home.login === 'admin' && home.inMinimal && ! home.bar, JSON.stringify( home ) );
	} else {
		t.check( 'after switching, Minimal boots as the target user', false, 'no switch entry to click' );
	}

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
