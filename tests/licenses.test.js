/**
 * License visibility Phase 0 (adapters/licenses.php + the System page's
 * Licenses card). Read-only by design: the suite proves classification,
 * worst-first ordering, the health check, copy-report coverage and the
 * manage_options gate — never any activation path (none exists).
 *
 * The minimal-dev-fixtures mu-plugin registers a synthetic provider behind the
 * REST-exposed minimal_test_license option covering all five states, so no
 * real vendor's options are ever written. The baseline rows (AnalyticsWP,
 * Elementor Pro, Gravity Forms as "missing") come from real installed
 * fixtures; per the live-testing rule the suite finds rows by content,
 * never by position, and tolerates extra real rows.
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'licenses' );
	const { browser, page, errors } = await launch();
	await page.context().grantPermissions( [ 'clipboard-read', 'clipboard-write' ] );
	await login( page );

	// Write-then-verify with retries (REST settings writes can race the
	// app's parallel boot requests — site-kit suite rule).
	const setOpt = async ( v ) => {
		for ( let attempt = 1; attempt <= 5; attempt++ ) {
			const stored = await page.evaluate( async ( val ) => {
				const h = { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce };
				await fetch( window.MINIMAL.restUrl + 'wp/v2/settings', {
					method: 'POST', headers: h, credentials: 'same-origin',
					body: JSON.stringify( { minimal_test_license: val } ),
				} );
				const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/settings?_cb=' + Math.random(), {
					headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
				} );
				return ( await r.json() ).minimal_test_license;
			}, v );
			if ( stored === v ) return true;
			await page.waitForTimeout( 800 );
		}
		return false;
	};

	const openSystem = async () => {
		await page.goto( BASE + '/minimal-admin/system', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-sys-check', { timeout: 20000 } );
	};

	// The license manager lives on Extensions → Licenses now; inactive
	// components render collapsed, so expand them for the off-row checks.
	const openLicenses = async () => {
		await page.goto( BASE + '/minimal-admin/extensions', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '[data-xtab="licenses"]', { timeout: 20000 } );
		await page.click( '[data-xtab="licenses"]' );
		await page.waitForSelector( '#minimal-sys-licenses .minimal-lic-item', { timeout: 20000 } );
		const off = await page.$( '#minimal-lic-off-toggle' );
		if ( off && await page.$eval( '#minimal-lic-off-toggle', ( el ) => el.getAttribute( 'aria-expanded' ) !== 'true' ) ) {
			await page.click( '#minimal-lic-off-toggle' );
			await page.waitForTimeout( 250 );
		}
	};

	try {
		/* ===== Baseline: real fixtures classify as missing ===== */
		await openLicenses();
		let text = await page.$eval( '#minimal-sys-licenses', ( el ) => el.textContent );
		t.check( 'card lists a real paid component', /Elementor Pro/.test( text ) );
		const offRow = await page.evaluate( () => {
			const el = [ ...document.querySelectorAll( '#minimal-sys-licenses .minimal-lic-item' ) ]
				.find( ( r ) => r.textContent.includes( 'AnalyticsWP' ) );
			// With a Turn on button the meta shortens to "not active"; the
			// long explanation only shows when Minimal can't offer the button
			// (tests/license-turnon.test.js covers the button itself).
			return el ? {
				off: el.classList.contains( 'off' ),
				note: /not active/.test( el.textContent ),
				affordance: !! el.querySelector( '[data-lic="turnon"]' ) || /activate the plugin/.test( el.textContent ),
			} : null;
		} );
		t.check( 'inactive components are dimmed and explained', offRow && offRow.off && offRow.note && offRow.affordance, JSON.stringify( offRow ) );
		t.check( 'unlicensed dev components read "No license"', /No license/.test( text ) );
		t.check( 'card states its read-only posture', /not a live lookup/.test( text ) );
		await openSystem();
		const healthBase = await page.$$eval( '.minimal-sys-check', ( els ) =>
			els.map( ( e ) => e.textContent ).find( ( s ) => /Licenses/.test( s ) ) || '' );
		t.check( 'Licenses health check present (warn: missing only)', /missing/.test( healthBase ) );
		t.check( 'Licenses health check is the clickable doorway', !! ( await page.$( '.minimal-sys-check[data-sysgoto="licenses"]' ) ) );

		/* ===== REST endpoint shape + summary ===== */
		const rest = await page.evaluate( async () => {
			const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/licenses', {
				headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
			} );
			return { status: r.status, body: await r.json() };
		} );
		t.check( 'REST endpoint answers for admin', rest.status === 200 );
		t.check( 'summary carries all five state counters',
			[ 'valid', 'expired', 'invalid', 'missing', 'unknown' ].every( ( k ) => k in rest.body.summary ) );
		t.check( 'items carry name + state + source',
			rest.body.items.length > 0 && rest.body.items.every( ( i ) => i.name && i.state && i.source ) );

		/* ===== Fixture provider: all five states render ===== */
		if ( ! await setOpt( true ) ) throw new Error( 'could not enable minimal_test_license' );
		await openLicenses();
		text = await page.$eval( '#minimal-sys-licenses', ( el ) => el.textContent );
		t.check( 'fixture rows render', /Fixture Valid Pro/.test( text ) && /Fixture Unknown Theme/.test( text ) );
		const pill = async ( name ) => page.evaluate( ( n ) => {
			const row = [ ...document.querySelectorAll( '#minimal-sys-licenses .minimal-sys-ext-item' ) ]
				.find( ( el ) => el.textContent.includes( n ) );
			const p = row && row.querySelector( '.minimal-lic-pill' );
			return p ? { cls: p.className, label: p.textContent } : null;
		}, name );
		const pValid = await pill( 'Fixture Valid Pro' );
		const pExpired = await pill( 'Fixture Expired Pro' );
		const pInvalid = await pill( 'Fixture Invalid Pro' );
		const pMissing = await pill( 'Fixture Missing Pro' );
		const pUnknown = await pill( 'Fixture Unknown Theme' );
		t.check( 'valid pill', pValid && /valid/.test( pValid.cls ) && pValid.label === 'Valid' );
		t.check( 'expired pill', pExpired && /expired/.test( pExpired.cls ) && pExpired.label === 'Expired' );
		t.check( 'invalid pill', pInvalid && /invalid/.test( pInvalid.cls ) && pInvalid.label === 'Invalid' );
		t.check( 'missing pill', pMissing && /missing/.test( pMissing.cls ) && pMissing.label === 'No license' );
		t.check( 'unknown pill', pUnknown && /unknown/.test( pUnknown.cls ) && pUnknown.label === 'Unknown' );
		t.check( 'meta line: renews date', new RegExp( 'renews 2030-01-01' ).test( text ) );
		t.check( 'meta line: expired date', /expired 2024-01-01/.test( text ) );
		t.check( 'meta line: staleness admitted', /may be stale/.test( text ) );
		t.check( 'theme rows are badged', await page.evaluate( () => {
			const row = [ ...document.querySelectorAll( '#minimal-sys-licenses .minimal-sys-ext-item' ) ]
				.find( ( el ) => el.textContent.includes( 'Fixture Unknown Theme' ) );
			return row && /theme/.test( row.querySelector( '.minimal-sys-ext-parent' )?.textContent || '' );
		} ) );

		/* ===== Grouped ordering: attention first, inactive collapsed last ===== */
		const groupOrder = await page.$$eval( '#minimal-sys-licenses .minimal-sys-ext-label, #minimal-sys-licenses .minimal-lic-off-toggle', ( els ) =>
			els.map( ( e ) => e.textContent.trim() ) );
		t.check( 'groups order attention → valid → none → inactive',
			/Needs attention/.test( groupOrder[ 0 ] ) && /Inactive components/.test( groupOrder[ groupOrder.length - 1 ] ),
			groupOrder.join( ' | ' ) );

		/* ===== Health check goes red with expired/invalid present ===== */
		await openSystem();
		const healthBad = await page.$$eval( '.minimal-sys-check', ( els ) => {
			const el = els.find( ( e ) => /Licenses/.test( e.textContent ) );
			return el ? { cls: el.className, text: el.textContent } : null;
		} );
		t.check( 'health check fails on expired + invalid', healthBad && /fail/.test( healthBad.cls ) && /expired/.test( healthBad.text ) );

		/* ===== Copy report carries the section ===== */
		await page.click( '#minimal-sys-copy' );
		await page.waitForTimeout( 400 );
		const report = await page.evaluate( () => navigator.clipboard.readText() );
		t.check( 'report has a Licenses section', /## Licenses \(stored state, not live\)/.test( report ) );
		t.check( 'report line carries state + expiry', /- Fixture Expired Pro: expired \(expires 2024-01-01\)/.test( report ) );
		t.check( 'report lists the license reader integration', /License reader minimal-fixture-licenses/.test( report ) );

		/* ===== Integrations card lists the reader ===== */
		const intText = await page.$eval( '#minimal-sys-integrations', ( el ) => el.textContent );
		t.check( 'Integrations card has License readers', /License readers/.test( intText ) && /Minimal License Fixture/.test( intText ) );

		/* ===== manage_options gate ===== */
		const ctx2 = await browser.newContext( { ignoreHTTPSErrors: true } );
		const p2 = await ctx2.newPage();
		await p2.goto( BASE + '/wp-login.php', { waitUntil: 'domcontentloaded' } );
		await p2.fill( '#user_login', 'minimal-editor' );
		await p2.fill( '#user_pass', 'minimal-editor-pass-1' );
		await Promise.all( [ p2.waitForNavigation( { waitUntil: 'domcontentloaded' } ), p2.click( '#wp-submit' ) ] );
		await p2.goto( BASE + '/minimal-admin/overview', { waitUntil: 'domcontentloaded' } );
		await p2.waitForFunction( () => window.MINIMAL && window.MINIMAL.nonce, null, { timeout: 15000 } );
		const editorStatus = await p2.evaluate( async () => {
			const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/licenses', {
				headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
			} );
			return r.status;
		} );
		t.check( 'editors get 403 from the endpoint', editorStatus === 403, String( editorStatus ) );
		await ctx2.close();

	} finally {
		await setOpt( false ).catch( () => {} );
	}
	await t.done( browser, errors );
} )();
