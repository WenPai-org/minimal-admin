/**
 * System page Integrations card (Minimal_Admin_Surfaces::integrations()).
 *
 * The live registry of everything hooked into Minimal: surfaces, editor panels,
 * design sources, cache purgers, page builders, block-form descriptors and
 * data-hook listeners, each attributed to the plugin that registered it
 * (Reflection on the filter callbacks) and validated against the documented
 * descriptor contract. The minimal-dev-fixtures mu-plugin registers a
 * deliberately malformed surface behind the REST-exposed
 * minimal_test_bad_surface option to prove problems get flagged.
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'integrations' );
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
					body: JSON.stringify( { minimal_test_bad_surface: val } ),
				} );
				const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/settings?_cb=' + Math.random(), {
					headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
				} );
				return ( await r.json() ).minimal_test_bad_surface;
			}, v );
			if ( stored === v ) return true;
			await page.waitForTimeout( 800 );
		}
		return false;
	};

	const openSystem = async () => {
		await page.goto( BASE + '/minimal-admin/system', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-sys-integrations', { timeout: 20000 } );
	};

	try {
		/* ===== Clean registry baseline ===== */
		await openSystem();
		const card = () => page.$eval( '#minimal-sys-integrations', ( el ) => el.textContent );
		let text = await card();
		t.check( 'card lists a bundled surface with owner', /Forms/.test( text ) && /Minimal Admin/.test( text ) );
		t.check( 'card lists editor panels', /Editor panels/.test( text ) && /SEO/.test( text ) );
		t.check( 'card lists design sources', /Design sources/.test( text ) && /Stackable/.test( text ) );
		t.check( 'card attributes block forms to Anchor Blocks', /Block inspector forms/.test( text ) && /Anchor Blocks/.test( text ) );
		t.check( 'card lists hook listeners', /Hook listeners/.test( text ) && /minimal_admin_traffic/.test( text ) );
		const baselineProblems = await page.$$eval( '.minimal-sys-int-problem', ( els ) => els.length );
		t.check( 'bundled registry validates clean', baselineProblems === 0, String( baselineProblems ) );

		/* ===== Malformed descriptor gets flagged ===== */
		if ( ! await setOpt( true ) ) throw new Error( 'could not enable minimal_test_bad_surface' );
		await openSystem();
		text = await card();
		const problems = await page.$$eval( '.minimal-sys-int-problem', ( els ) => els.map( ( e ) => e.textContent ) );
		t.check( 'malformed fixture surface appears', /Bad Fixture/.test( text ) );
		t.check( 'unknown top-level key flagged', problems.some( ( p ) => p.includes( 'unknown key "ikon"' ) ), problems.join( ' | ' ) );
		t.check( 'missing route flagged', problems.some( ( p ) => p.includes( 'missing route' ) ) );
		t.check( 'column without key flagged', problems.some( ( p ) => p.includes( 'column without a key' ) ) );
		t.check( 'problem count shown in the card head', /\d+ problems?/.test( text ) );

		/* ===== Copy report carries the section ===== */
		await page.click( '#minimal-sys-copy' );
		await page.waitForTimeout( 400 );
		const clip = await page.evaluate( () => navigator.clipboard.readText() );
		t.check( 'copy report includes Integrations with problems',
			/## Integrations/.test( clip ) && /minimal-bad-fixture/.test( clip ) && /PROBLEMS:/.test( clip ) );

		/* ===== Cleanup restores a clean registry ===== */
		await setOpt( false );
		await openSystem();
		const after = await page.$$eval( '.minimal-sys-int-problem', ( els ) => els.length );
		t.check( 'registry clean again after disabling the fixture', after === 0, String( after ) );
	} finally {
		await setOpt( false );
	}

	await t.done( browser, errors );
} )();
