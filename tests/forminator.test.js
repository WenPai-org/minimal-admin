/**
 * Forminator adapter — forms family (entries + forms). Entries read from
 * frmt_form_entry via prefix-scoped SQL with answers hydrated through
 * Forminator's own entry model, labels from its form models at runtime
 * (its field model resolves properties via __get with no __isset — the
 * adapter reads them directly), search over answer meta, and permanent
 * delete through Forminator_API::delete_entry (no entry trash exists;
 * the confirm says so).
 *
 * Fixtures: the standing "Feedback Form" + minimal_test_seed_forminator
 * (upsert by email through Forminator's own add_form_entry).
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'forminator' );
	const { browser, page, errors } = await launch();
	await login( page );

	const setOpt = async ( name, v ) => {
		for ( let attempt = 1; attempt <= 5; attempt++ ) {
			const stored = await page.evaluate( async ( a ) => {
				const h = { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce };
				await fetch( window.MINIMAL.restUrl + 'wp/v2/settings', {
					method: 'POST', headers: h, credentials: 'same-origin',
					body: JSON.stringify( { [ a.name ]: a.v } ),
				} );
				const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/settings?_cb=' + Math.random(), {
					headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
				} );
				return ( await r.json() )[ a.name ];
			}, { name, v } );
			if ( stored === v || ( v === '1' && stored === '' ) ) return true;
			await page.waitForTimeout( 800 );
		}
		return false;
	};

	const restTotal = () => page.evaluate( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/forminator/entries?_cb=' + Math.random(), {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
		} );
		return ( await r.json() ).total;
	} );

	try {
		t.check( 'entry seeder armed', await setOpt( 'minimal_test_seed_forminator', '1' ) );

		await page.goto( BASE + '/minimal-admin/forminator', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );

		/* ===== Entries list ===== */
		const body = await page.$eval( '#minimal-view', ( el ) => el.textContent );
		t.check( 'seeded entries render with answer summaries', body.includes( 'Dana Tester' ) && body.includes( 'dana@example.com' ) );
		t.check( 'form column names the form', body.includes( 'Feedback Form' ) );
		const tabs = await page.$$eval( '[data-stab]', ( els ) => els.map( ( e ) => e.textContent.trim() ) );
		t.check( 'form tabs render', tabs[ 0 ] === 'All entries' && tabs.includes( 'Feedback Form' ), tabs.join( ' · ' ) );

		/* ===== Search over answer meta ===== */
		await page.fill( '#minimal-surface-search', 'popup' );
		await page.waitForFunction( () => {
			const rows = document.querySelectorAll( '.minimal-table-row' );
			return rows.length === 1 && rows[ 0 ].textContent.includes( 'Miguel' );
		}, { timeout: 20000 } );
		t.check( 'search filters entries', true );
		await page.fill( '#minimal-surface-search', '' );
		await page.waitForFunction( () => document.querySelectorAll( '.minimal-table-row' ).length >= 3, { timeout: 20000 } );

		/* ===== Detail: labels through their form model ===== */
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-table-row' ) ].find( ( r ) => r.textContent.includes( 'Priya' ) ).click();
		} );
		// Wait for the action buttons — '.minimal-modal' alone matches the
		// loading state (the duplicator-suite lesson).
		await page.waitForSelector( '.minimal-modal [data-saction]', { timeout: 15000 } );
		const modal = await page.$eval( '.minimal-modal', ( el ) => el.textContent );
		t.check( 'answers wear their field labels', modal.includes( 'Feedback' ) && modal.includes( 'The thank-you page 404s after submitting.' ) );
		t.check( 'entry renders as a contact card', !! ( await page.$( '.minimal-modal.entry' ) ) );
		t.check( 'card links out to Forminator', await page.$$eval( '.minimal-modal a[href]', ( els ) =>
			els.some( ( a ) => /page=forminator-entries/.test( a.href ) ) ) );

		/* ===== Permanent delete through their own API ===== */
		page.once( 'dialog', ( d ) => d.accept() );
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-modal [data-saction]' ) ].find( ( b ) => b.textContent.includes( 'Delete permanently' ) ).click();
		} );
		await page.waitForFunction( () => ! document.querySelector( '.minimal-modal' ), { timeout: 15000 } );
		t.check( 'delete removed the entry (their cleanup ran)', ( await restTotal() ) === 2 );

		/* ===== Forms view ===== */
		await page.click( '[data-sview="manage"]' );
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );
		const formsBody = await page.$eval( '#minimal-view', ( el ) => el.textContent );
		t.check( 'forms view lists the form with a live count', formsBody.includes( 'Feedback Form' ) && formsBody.includes( '2' ) );
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-table-row' ) ].find( ( r ) => r.textContent.includes( 'Feedback Form' ) ).click();
		} );
		await page.waitForSelector( '.minimal-modal a[href]', { timeout: 15000 } );
		t.check( 'form row links into Forminator\'s editor', await page.$$eval( '.minimal-modal a[href]', ( els ) =>
			els.some( ( a ) => /forminator-cform-wizard&id=\d+/.test( a.href ) ) ) );
	} finally {
		await setOpt( 'minimal_test_seed_forminator', '1' ).catch( () => {} ); // restore the deleted row
	}

	await t.done( browser, errors );
} )();
