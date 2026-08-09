/**
 * Your profile ( /minimal-admin/profile ) — the self-profile promoted from the
 * user modal to a route page (2026-07-17). Covers: every self entry point
 * lands on the route (avatar, ⌘K, your own row in Users), the cards render
 * (Account / Appearance / AI Access / Sessions), a display-name save
 * round-trips over REST and syncs the sidebar, an application password is
 * created (reveal + curl copy buttons) and revoked, and the Edit-user modal
 * for ANOTHER user no longer carries the self-only sections.
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'profile' );
	const { browser, page, errors } = await launch();
	await login( page );

	const restSelf = () => page.evaluate( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/users/me?context=edit&_fields=id,name,url,description,first_name,last_name,locale,meta', {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin' } );
		return r.json();
	} );
	const original = await restSelf();

	try {
		/* ===== Avatar entry point ===== */
		await page.goto( BASE + '/minimal-admin/overview', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-user-area', { timeout: 20000 } );
		await page.click( '#minimal-user-area .minimal-user-name' );
		await page.waitForSelector( '#minimal-pf-save', { timeout: 15000 } );
		t.check( 'avatar opens /minimal-admin/profile', await page.evaluate( () => location.pathname.endsWith( '/minimal-admin/profile' ) ) );

		/* ===== Cards render ===== */
		const titles = await page.$$eval( '.minimal-profile-grid .minimal-panel-title', ( els ) => els.map( ( el ) => el.firstChild.textContent.trim() ) );
		t.check( 'Account, AI Access, Appearance and Sessions cards render',
			[ 'Account', 'AI Access', 'Appearance', 'Sessions' ].every( ( x ) => titles.some( ( y ) => y.startsWith( x ) ) ), titles.join( ' | ' ) );
		t.check( 'account fields seeded from context=edit', await page.$eval( '#minimal-pf-name', ( i ) => i.value.length > 0 ) );
		t.check( 'color scheme swatches render', await page.$$eval( '.minimal-scheme-swatch', ( els ) => els.length > 3 ) );
		t.check( 'theme mode + default-admin switches render', await page.evaluate( () =>
			document.querySelectorAll( '[data-theme-pref]' ).length === 3 && !! document.getElementById( 'minimal-default-admin' ) ) );
		t.check( 'a session row renders with the current marker', await page.evaluate( () =>
			!! document.querySelector( '[data-kill]' ) && /this session/.test( document.body.textContent ) ) );

		/* ===== Display-name save round-trip ===== */
		const probeName = 'Profile Probe ' + ( Date.now() % 100000 );
		await page.evaluate( ( n ) => { const i = document.getElementById( 'minimal-pf-name' ); i.value = n; }, probeName );
		await page.click( '#minimal-pf-save' );
		// Generous window: plugins can hang slow hooks on profile_update
		// (SearchWP's synchronous index loopbacks took 6-14s while active).
		await page.waitForFunction( ( n ) => {
			const el = document.querySelector( '.minimal-user-name' );
			return el && el.textContent.trim() === n;
		}, probeName, { timeout: 20000 } );
		t.check( 'save syncs the sidebar name', true );
		const savedName = ( await restSelf() ).name;
		t.check( 'display name persists over REST', savedName === probeName, savedName );

		/* ===== Public profile card (bio + website) round-trip ===== */
		await page.fill( '#minimal-pf-url', 'https://example.com/probe' );
		await page.fill( '#minimal-pf-bio', 'Suite bio probe.' );
		await page.evaluate( () => { [ ...document.querySelectorAll( '[data-pf-save]' ) ].pop().click(); } );
		await page.waitForTimeout( 1200 );
		const pub = await restSelf();
		t.check( 'website + bio persist over REST', pub.url === 'https://example.com/probe' && pub.description === 'Suite bio probe.',
			JSON.stringify( { url: pub.url, description: pub.description } ) );

		/* ===== Language picker + toolbar preference ===== */
		t.check( 'language combobox renders', !! await page.$( '#minimal-pf-lang' ) );
		const langCatalog = () => page.evaluate( async () => ( await ( await fetch(
			window.MINIMAL.restUrl + 'minimal-admin/v1/languages',
			{ headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin' } ) ).json() ) );
		const langsBefore = await langCatalog();
		t.check( 'language catalog loads (installed + downloadable)',
			Array.isArray( langsBefore.installed ) && langsBefore.installed.length >= 2
			&& ( ! langsBefore.canInstall || langsBefore.available.length > 50 ),
			JSON.stringify( { installed: ( langsBefore.installed || [] ).length, available: ( langsBefore.available || [] ).length, canInstall: langsBefore.canInstall } ) );
		await page.click( '#minimal-pf-lang' );
		await page.waitForSelector( '#minimal-pf-lang-ac .minimal-ac-item[data-acv="en_US"]', { timeout: 4000 } );
		await page.click( '#minimal-pf-lang-ac .minimal-ac-item[data-acv="en_US"]' );
		await page.click( '#minimal-pf-save' );
		await page.waitForFunction( async () => {
			const r = await ( await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/languages',
				{ headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin' } ) ).json();
			return r.current === 'en_US';
		}, null, { timeout: 20000, polling: 800 } );
		t.check( 'picked language persists as the raw user locale', true );
		// Restore the raw locale meta through the same endpoint.
		await page.evaluate( async ( cur ) => {
			await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/me/language', {
				method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
				credentials: 'same-origin', body: JSON.stringify( { locale: cur || '' } ) } );
		}, langsBefore.current );

		const tbBefore = await page.$eval( '#minimal-pf-toolbar', ( b ) => b.classList.contains( 'on' ) );
		await page.click( '#minimal-pf-toolbar' );
		await page.waitForTimeout( 1200 );
		const tbMeta = ( await restSelf() ).meta || {};
		t.check( 'toolbar preference flips in user meta (instant save)',
			( tbMeta.show_admin_bar_front === 'false' ) === tbBefore, JSON.stringify( tbMeta ) );
		const feBar = await page.evaluate( async () =>
			( await ( await fetch( '/', { credentials: 'same-origin' } ) ).text() ).includes( 'id="wpadminbar"' ) );
		t.check( 'the real front end honors the flipped preference', feBar === ! tbBefore, String( feBar ) );
		await page.click( '#minimal-pf-toolbar' );
		await page.waitForTimeout( 1000 );

		/* ===== App password create + revoke ===== */
		await page.fill( '#minimal-app-name', 'Profile Suite Probe' );
		await page.click( '#minimal-app-create' );
		await page.waitForSelector( '#minimal-app-secret', { timeout: 10000 } );
		t.check( 'new password reveal renders with copy buttons', await page.evaluate( () =>
			document.getElementById( 'minimal-app-secret' ).textContent.trim().length >= 20
			&& !! document.getElementById( 'minimal-app-copy-curl' ) ) );
		await page.waitForFunction( () =>
			[ ...document.querySelectorAll( '.minimal-session-ua' ) ].some( ( el ) => el.textContent.trim() === 'Profile Suite Probe' ), null, { timeout: 10000 } );
		t.check( 'created password joins the list', true );
		page.once( 'dialog', ( d ) => d.accept() );
		await page.evaluate( () => {
			const row = [ ...document.querySelectorAll( '.minimal-session-row' ) ].find( ( r ) =>
				r.textContent.includes( 'Profile Suite Probe' ) );
			row.querySelector( '[data-appdel]' ).click();
		} );
		await page.waitForFunction( () =>
			! [ ...document.querySelectorAll( '.minimal-session-ua' ) ].some( ( el ) => el.textContent.trim() === 'Profile Suite Probe' ), null, { timeout: 10000 } );
		t.check( 'revoke removes it from the list', true );

		/* ===== ⌘K entry point ===== */
		await page.goto( BASE + '/minimal-admin/media', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-view .minimal-toolbar, #minimal-view .minimal-loading', { timeout: 20000 } );
		await page.keyboard.press( 'Meta+k' );
		await page.waitForSelector( '#minimal-palette-input', { timeout: 5000 } );
		await page.keyboard.type( 'Your profile' );
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector( '#minimal-pf-save', { timeout: 15000 } );
		t.check( 'palette "Your profile" lands on the route', await page.evaluate( () => location.pathname.endsWith( '/minimal-admin/profile' ) ) );

		/* ===== Own row in Users redirects; other users keep the modal ===== */
		await page.goto( BASE + '/minimal-admin/users', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-user-cols.minimal-table-row', { timeout: 20000 } );
		await page.evaluate( ( uid ) => { document.querySelector( `[data-user="${ uid }"] .minimal-row-title` ).click(); }, original.id );
		await page.waitForSelector( '#minimal-pf-save', { timeout: 15000 } );
		t.check( 'clicking your own Users row opens the profile route', await page.evaluate( () =>
			location.pathname.endsWith( '/minimal-admin/profile' ) && ! document.querySelector( '.minimal-modal' ) ) );

		// Another user opens the FULL edit page now (GH #8), not the modal —
		// tests/user-edit-page.test.js covers that page in depth.
		await page.goto( BASE + '/minimal-admin/users', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-user-cols.minimal-table-row', { timeout: 20000 } );
		await page.locator( '.minimal-user-cols.minimal-table-row', { hasText: 'minimal-editor' } ).first().click();
		await page.waitForSelector( '#minimal-ue-name', { timeout: 10000 } );
		t.check( 'another user opens the Edit-user page', await page.evaluate( () =>
			/\/minimal-admin\/users\/\d+$/.test( location.pathname ) && ! document.querySelector( '.minimal-modal' ) ) );
		t.check( 'the page carries no self-only sections', await page.evaluate( () =>
			! document.querySelector( '#minimal-app-create' )
			&& ! document.querySelector( '[data-unhide]' )
			&& ! document.querySelector( '[data-theme-pref]' ) ) );
	} finally {
		// Restore the admin's identity fields whatever happened above.
		await page.evaluate( async ( orig ) => {
			await fetch( window.MINIMAL.restUrl + 'wp/v2/users/' + orig.id, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
				credentials: 'same-origin',
				body: JSON.stringify( {
					name: orig.name,
					url: orig.url || '',
					description: orig.description || '',
					first_name: orig.first_name || '',
					last_name: orig.last_name || '',
					meta: { show_admin_bar_front: ( orig.meta && orig.meta.show_admin_bar_front ) || 'true' },
				} ),
			} );
		}, original ).catch( () => {} );
	}

	await t.done( browser, errors );
} )();
