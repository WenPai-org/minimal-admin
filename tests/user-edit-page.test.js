/**
 * GH #8: full-page user editor at /minimal-admin/users/{id}.
 *
 * Admins edit another user's identity AND Minimal experience (color scheme,
 * default-admin, toolbar) from one deep-linkable page. The critical
 * property: appearance edits save to the TARGET user's meta and never
 * repaint the admin's own session — proven by a second browser context
 * logging in as the target and seeing the scheme applied.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const t = reporter( 'user-edit-page' );
	const { browser, page, errors } = await launch();
	await login( page );

	const rest = ( route, opts ) => page.evaluate( async ( a ) => {
		const r = await fetch( window.MINIMAL.restUrl + a.route, Object.assign( {
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
			credentials: 'same-origin',
		}, a.opts || {} ) );
		if ( ! r.ok ) throw new Error( 'HTTP ' + r.status );
		return r.json();
	}, { route, opts } );

	// Target: the minimal-editor role-test account.
	const targets = await rest( 'wp/v2/users?search=minimal-editor&context=edit' );
	const target = targets.find( ( x ) => x.username === 'minimal-editor' ) || targets[ 0 ];
	t.check( 'target user resolved', !! target, JSON.stringify( ( targets || [] ).map( ( x ) => x.username ) ) );
	const uid = target.id;
	const origAppearance = await rest( `minimal-admin/v1/users/${ uid }/appearance` );
	const origName = target.name;

	try {
		// Users list row click deep-links to the page.
		await page.goto( BASE + '/minimal-admin/users', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-view', { timeout: 15000 } );
		await page.waitForSelector( `[data-user="${ uid }"]`, { timeout: 15000 } );
		await page.click( `[data-user="${ uid }"]` );
		await page.waitForFunction( ( id ) => location.pathname.includes( '/minimal-admin/users/' + id ), uid, { timeout: 10000 } )
			.catch( () => {} );
		const deepLinked = await page.evaluate( () => location.pathname );
		t.check( 'users list opens the edit page', deepLinked.includes( '/minimal-admin/users/' + uid ), deepLinked );

		// Direct deep link renders all cards.
		await page.goto( `${ BASE }/minimal-admin/users/${ uid }`, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-ue-name', { timeout: 15000 } );
		const cards = await page.evaluate( () => ( {
			name: document.querySelector( '#minimal-ue-name' ).value,
			swatches: document.querySelectorAll( '#minimal-ue-appearance .minimal-scheme-swatch' ).length,
			sessions: !! Array.from( document.querySelectorAll( '.minimal-panel-title' ) ).find( ( el ) => /Sessions/.test( el.textContent ) ),
			danger: !! document.querySelector( '#minimal-ue-delete' ),
			topTitle: document.querySelector( '#minimal-title' ).textContent,
		} ) );
		t.check( 'account card populated', cards.name === origName, cards.name );
		t.check( 'scheme swatches render (9 presets + custom)', cards.swatches === 10, String( cards.swatches ) );
		t.check( 'sessions card renders', cards.sessions );
		t.check( 'danger zone renders', cards.danger );
		t.check( 'topbar says Edit user', /Edit user/.test( cards.topTitle ), cards.topTitle );

		// "← Users" head link returns to the list (the order-page pattern).
		await page.click( '#minimal-ue-back' );
		await page.waitForFunction( () => /\/minimal-admin\/users\/?$/.test( location.pathname ), null, { timeout: 8000 } );
		t.check( 'back link returns to Users', true );
		await page.goto( `${ BASE }/minimal-admin/users/${ uid }`, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-ue-name', { timeout: 15000 } );

		// Scheme pick saves to the TARGET, not this session.
		const myScheme = await page.evaluate( () => document.documentElement.getAttribute( 'data-scheme' ) );
		await page.click( '#minimal-ue-appearance .minimal-scheme-swatch[data-scheme="ocean"]' );
		await page.waitForTimeout( 1200 );
		const savedAp = await rest( `minimal-admin/v1/users/${ uid }/appearance` );
		t.check( 'target scheme saved as ocean', savedAp.scheme === 'ocean', savedAp.scheme );
		const myAfter = await page.evaluate( () => document.documentElement.getAttribute( 'data-scheme' ) );
		t.check( 'admin session scheme untouched', myAfter === myScheme, `${ myScheme } -> ${ myAfter }` );

		// Toolbar toggle round-trips core's string meta.
		const tbBefore = ( target.meta && target.meta.show_admin_bar_front ) !== 'false';
		await page.click( '#minimal-ue-toolbar' );
		await page.waitForTimeout( 1200 );
		const afterMeta = await rest( `wp/v2/users/${ uid }?context=edit&_fields=meta` );
		t.check( 'toolbar meta flipped', ( afterMeta.meta.show_admin_bar_front !== 'false' ) === ! tbBefore, JSON.stringify( afterMeta.meta.show_admin_bar_front ) );
		await page.click( '#minimal-ue-toolbar' );
		await page.waitForTimeout( 900 );

		// Display-name save.
		await page.fill( '#minimal-ue-name', 'Minimal Editor Probe' );
		await page.click( '[data-ue-save]' );
		await page.waitForTimeout( 1800 );
		const renamed = await rest( `wp/v2/users/${ uid }?context=edit&_fields=name,roles` );
		t.check( 'display name saved', renamed.name === 'Minimal Editor Probe', renamed.name );
		t.check( 'role untouched by save', ( renamed.roles || [] )[ 0 ] === 'editor', JSON.stringify( renamed.roles ) );

		// The white-label proof: the target sees the scheme on THEIR login.
		const ctx2 = await browser.newContext( { ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } } );
		const p2 = await ctx2.newPage();
		await p2.goto( BASE + '/wp-login.php', { waitUntil: 'domcontentloaded' } );
		await p2.fill( '#user_login', 'minimal-editor' );
		await p2.fill( '#user_pass', 'minimal-editor-pass-1' );
		await Promise.all( [ p2.waitForNavigation( { waitUntil: 'domcontentloaded' } ), p2.click( '#wp-submit' ) ] );
		await p2.goto( BASE + '/minimal-admin/overview', { waitUntil: 'domcontentloaded' } );
		await p2.waitForFunction( () => window.MINIMAL && window.MINIMAL.nonce, null, { timeout: 15000 } );
		await p2.waitForTimeout( 800 );
		const theirScheme = await p2.evaluate( () => document.documentElement.getAttribute( 'data-scheme' ) );
		t.check( 'target session wears the admin-set scheme', theirScheme === 'ocean', theirScheme );
		await ctx2.close();
	} finally {
		// Restore everything.
		await rest( `minimal-admin/v1/users/${ uid }/appearance`, { method: 'POST', body: JSON.stringify( origAppearance ) } ).catch( () => {} );
		await rest( `wp/v2/users/${ uid }`, { method: 'POST', body: JSON.stringify( { name: origName } ) } ).catch( () => {} );
	}

	await t.done( browser, errors );
} )();
