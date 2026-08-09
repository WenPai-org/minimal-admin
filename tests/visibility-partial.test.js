/**
 * Partial site visibility — the WooCommerce store-pages-only coming-soon
 * shape. A provider flagged `partial` must NOT claim the whole site is dark:
 * state becomes 'partial', the chip reads "Partly hidden", and the banner /
 * popover / Settings → Visibility all soften their copy while still naming
 * the provider. Armed via the mu-fixture provider (minimal_test_visibility =
 * 'partial') so no real plugin mode is left enabled.
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'visibility-partial' );
	const { browser, page, errors } = await launch();
	await login( page );

	const setOpt = ( k, v ) => page.evaluate( async ( [ key, val ] ) => {
		const h = { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce };
		await fetch( window.MINIMAL.restUrl + 'wp/v2/settings', { method: 'POST', headers: h, credentials: 'same-origin', body: JSON.stringify( { [ key ]: val } ) } );
	}, [ k, v ] );
	const visibility = () => page.evaluate( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/visibility?_cb=' + Math.random(), { headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin' } );
		return r.json();
	} );

	await page.goto( BASE + '/minimal-admin/', { waitUntil: 'domcontentloaded' } );
	await page.waitForFunction( () => window.MINIMAL, null, { timeout: 20000 } );

	try {
		// Baseline: nothing else hiding the site (rule: seed, don't assume).
		await setOpt( 'minimal_admin_maintenance', false );
		await setOpt( 'blog_public', 1 );
		await setOpt( 'minimal_test_visibility', 'partial' );

		const v = await visibility();
		t.check( 'server state is partial', v.state === 'partial', v.state );
		t.check( 'provider carries the partial flag', ( v.providers || [] ).some( ( p ) => p.partial ) );

		// Fresh boot picks the state up for chip + banner.
		await page.goto( BASE + '/minimal-admin/overview', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-stats', { timeout: 20000 } );
		t.check( 'chip reads Partly hidden', await page.evaluate( () => {
			const c = document.querySelector( '#minimal-vis-chip' );
			return c && ! c.hidden && /Partly hidden/.test( c.textContent );
		} ) );
		t.check( 'banner says part of the site is hidden', await page.evaluate( () => {
			const b = document.querySelector( '.minimal-vis-banner' );
			return b && /Part of your site is hidden/.test( b.textContent );
		} ) );
		t.check( 'banner names the provider and its note', await page.evaluate( () => {
			const b = document.querySelector( '.minimal-vis-banner' );
			return b && /Minimal Visibility Fixture/.test( b.textContent ) && /only fixture pages are hidden/i.test( b.textContent );
		} ) );

		// Chip popover: softened title, provider link-out.
		await page.click( '#minimal-vis-chip' );
		await page.waitForSelector( '#minimal-vis-pop', { timeout: 5000 } );
		t.check( 'popover title softens to partial copy', await page.$eval( '.minimal-vis-pop-title', ( e ) => /Part of the site is hidden/.test( e.textContent ) ) );
		// Since the toggle writers landed the fixture provider renders as a
		// turn-off switch here, not a link-out (visibility-toggle.test.js
		// drives the switch itself).
		t.check( 'popover offers a control for the provider', await page.evaluate( () =>
			!! document.querySelector( '#minimal-vis-pop .minimal-switch[aria-label="Minimal Visibility Fixture"]' )
			|| Array.from( document.querySelectorAll( '#minimal-vis-pop a' ) ).some( ( a ) => /Minimal Visibility Fixture/.test( a.textContent ) ) ) );

		// Settings → Visibility lists third-party limiters with a link.
		await page.goto( BASE + '/minimal-admin/settings', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-settings-nav-item', { timeout: 20000 } );
		await page.evaluate( () => { [ ...document.querySelectorAll( '.minimal-settings-nav-item' ) ].find( ( b ) => b.textContent.trim() === 'Visibility' ).click(); } );
		await page.waitForSelector( '[data-setting="minimal_admin_maintenance"]', { timeout: 8000 } );
		t.check( 'Settings Visibility shows Also limiting visibility', await page.evaluate( () =>
			/Also limiting visibility/.test( document.querySelector( '.minimal-settings-body' ).textContent ) ) );
		t.check( 'Settings row names the provider with an Open link', await page.evaluate( () => {
			const body = document.querySelector( '.minimal-settings-body' );
			return /Minimal Visibility Fixture/.test( body.textContent )
				&& Array.from( body.querySelectorAll( 'a' ) ).some( ( a ) => /Open/.test( a.textContent ) );
		} ) );

		// Disarm → public again.
		await setOpt( 'minimal_test_visibility', '' );
		const after = await visibility();
		t.check( 'disarming returns the site to public', after.state === 'public', after.state );
	} finally {
		await setOpt( 'minimal_test_visibility', '' ).catch( () => {} );
		await setOpt( 'blog_public', 1 ).catch( () => {} );
		await setOpt( 'minimal_admin_maintenance', false ).catch( () => {} );
	}

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
