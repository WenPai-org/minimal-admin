/**
 * Per-user color schemes (user meta minimal_admin_appearance).
 * Shape: { scheme, custom: { dark: {slots}, light: {slots} } }.
 * Legacy { accent, custom: '#hex' } migrates on read/write.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'appearance' );
	await login( page );

	const rest = ( path, opts ) => page.evaluate( async ( [ p, o ] ) => {
		const r = await fetch( window.MINIMAL.restUrl + p, Object.assign( {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce, 'Content-Type': 'application/json' },
			credentials: 'same-origin',
		}, o || {} ) );
		return { status: r.status, body: await r.json().catch( () => null ) };
	}, [ path, opts ] );

	// Reset.
	await rest( 'minimal-admin/v1/me/appearance', {
		method: 'POST', body: JSON.stringify( { scheme: 'minimal' } ),
	} );

	await page.goto( `${ BASE }/minimal-admin/`, { waitUntil: 'domcontentloaded' } );
	await page.waitForFunction( () => window.MINIMAL && window.MINIMAL.user, { timeout: 15000 } );

	const boot = await page.evaluate( () => ( {
		appearance: window.MINIMAL.user.appearance,
		slots: window.MINIMAL.appearanceSlots,
		scheme: document.documentElement.getAttribute( 'data-scheme' ),
	} ) );
	t.check( 'boot carries appearance.scheme', !! boot.appearance && typeof boot.appearance.scheme === 'string', JSON.stringify( boot.appearance ) );
	t.check( 'default scheme is minimal', boot.appearance.scheme === 'minimal', JSON.stringify( boot.appearance ) );
	t.check( 'boot exposes appearanceSlots', Array.isArray( boot.slots ) && boot.slots.length >= 10, String( boot.slots && boot.slots.length ) );
	t.check( 'data-scheme is minimal', boot.scheme === 'minimal', boot.scheme );

	const got = await rest( 'minimal-admin/v1/me/appearance' );
	t.check( 'GET me/appearance 200', got.status === 200, String( got.status ) );
	t.check( 'GET has scheme + custom.dark/light',
		got.body && got.body.scheme === 'minimal'
		&& got.body.custom && got.body.custom.dark && got.body.custom.light
		&& got.body.custom.dark.accent,
		JSON.stringify( got.body ) );

	const ocean = await rest( 'minimal-admin/v1/me/appearance', {
		method: 'POST', body: JSON.stringify( { scheme: 'ocean' } ),
	} );
	t.check( 'POST ocean saves', ocean.body && ocean.body.scheme === 'ocean', JSON.stringify( ocean.body ) );

	// Legacy accent body still migrates.
	const legacy = await rest( 'minimal-admin/v1/me/appearance', {
		method: 'POST', body: JSON.stringify( { accent: 'forest' } ),
	} );
	t.check( 'legacy accent migrates to scheme', legacy.body && legacy.body.scheme === 'forest', JSON.stringify( legacy.body ) );

	// Custom full tokens.
	const custom = await rest( 'minimal-admin/v1/me/appearance', {
		method: 'POST',
		body: JSON.stringify( {
			scheme: 'custom',
			custom: {
				dark: { bg: '#111122', accent: '#ff5500', text: '#eeeeff' },
				light: { bg: '#fafafa', accent: '#cc4400' },
			},
		} ),
	} );
	t.check( 'POST custom scheme', custom.body && custom.body.scheme === 'custom', JSON.stringify( custom.body && custom.body.scheme ) );
	t.check( 'custom dark merges accents onto base',
		custom.body && custom.body.custom.dark.accent === '#ff5500'
		&& custom.body.custom.dark.bg === '#111122'
		&& !! custom.body.custom.dark.panel, // filled from base
		JSON.stringify( custom.body && custom.body.custom && custom.body.custom.dark ) );

	// Profile UI.
	await page.goto( `${ BASE }/minimal-admin/`, { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-user-area', { timeout: 15000 } );
	await page.click( '#minimal-user-area' );
	await page.waitForSelector( '.minimal-scheme-swatch[data-scheme="teal"]', { timeout: 15000 } );
	t.check( 'profile shows scheme swatches', !! ( await page.$( '.minimal-scheme-swatch[data-scheme="teal"]' ) ) );
	t.check( 'profile shows theme mode switches',
		!! ( await page.$( '[data-theme-pref="system"]' ) )
		&& !! ( await page.$( '[data-theme-pref="light"]' ) )
		&& !! ( await page.$( '[data-theme-pref="dark"]' ) ) );

	const beforeMode = await page.evaluate( () => localStorage.getItem( 'minimal-theme' ) );
	await page.click( '[data-theme-pref="light"]' );
	await page.waitForFunction(
		() => document.documentElement.getAttribute( 'data-theme' ) === 'light',
		{ timeout: 5000 }
	);
	t.check( 'Light theme switch works', await page.evaluate( () =>
		document.documentElement.getAttribute( 'data-theme' ) === 'light' ) );

	await page.click( '.minimal-scheme-swatch[data-scheme="teal"]' );
	await page.waitForFunction( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/me/appearance', {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
		} );
		const j = await r.json().catch( () => null );
		return j && j.scheme === 'teal';
	}, { timeout: 10000 } );
	t.check( 'teal swatch sets data-scheme', await page.evaluate( () =>
		document.documentElement.getAttribute( 'data-scheme' ) ) === 'teal' );

	// Custom expands slot editors.
	await page.click( '.minimal-scheme-swatch[data-scheme="custom"]' );
	await page.waitForSelector( '[data-scheme-slot="accent"]', { timeout: 10000 } );
	t.check( 'custom scheme shows slot editors', !! ( await page.$( '[data-scheme-slot="bg"]' ) )
		&& !! ( await page.$( '[data-scheme-slot="accent"]' ) ) );

	// Named scheme after custom — wait past the 180ms debounce so meta persists.
	await page.click( '.minimal-scheme-swatch[data-scheme="dusk"]' );
	await page.waitForTimeout( 400 );
	await page.waitForFunction( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/me/appearance', {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
		} );
		const j = await r.json().catch( () => null );
		return j && j.scheme === 'dusk';
	}, { timeout: 10000 } );

	await page.goto( `${ BASE }/minimal-admin/`, { waitUntil: 'domcontentloaded' } );
	await page.waitForFunction( () => window.MINIMAL && window.MINIMAL.user, { timeout: 15000 } );
	const after = await page.evaluate( () => ( {
		boot: window.MINIMAL.user.appearance,
		attr: document.documentElement.getAttribute( 'data-scheme' ),
	} ) );
	t.check( 'reload boot still dusk', after.boot && after.boot.scheme === 'dusk', JSON.stringify( after.boot ) );
	t.check( 'reload data-scheme still dusk', after.attr === 'dusk', after.attr );

	const bad = await rest( 'minimal-admin/v1/me/appearance', {
		method: 'POST', body: JSON.stringify( { scheme: 'not-real' } ),
	} );
	t.check( 'invalid scheme falls back to minimal', bad.body && bad.body.scheme === 'minimal', JSON.stringify( bad.body ) );

	// Restore theme + scheme.
	const restore = beforeMode === 'light' || beforeMode === 'dark' || beforeMode === 'system' ? beforeMode : 'system';
	await page.evaluate( ( m ) => localStorage.setItem( 'minimal-theme', m ), restore );
	await rest( 'minimal-admin/v1/me/appearance', {
		method: 'POST', body: JSON.stringify( { scheme: 'minimal' } ),
	} );

	await t.done( browser, errors );
} )().catch( ( e ) => { console.error( e ); process.exit( 1 ); } );
