/**
 * Everest Forms adapter — forms family (entries + forms). Entries read
 * from evf_entries via prefix-scoped SQL with labels from the form's
 * post_content field map at runtime, UTC date_created stamps, search
 * over answer meta, Received/Spam/Trash status filter, and trash/spam/
 * restore/delete through EVF_Admin_Entries (their prior-status meta and
 * hooks fire). Caps mirror their view/delete entries model.
 *
 * Fixtures: the standing "Minimal EVF Fixture" form + minimal_test_seed_everest
 * (upsert by email into their entry tables).
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'everest-forms' );
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

	const restTotal = ( status = 'publish' ) => page.evaluate( async ( st ) => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/everest/entries?status=' + st + '&_cb=' + Math.random(), {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
		} );
		return ( await r.json() ).total;
	}, status );

	try {
		// Active fixture for this suite (family convention: many forms providers).
		await page.evaluate( async () => {
			const h = { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce };
			const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/plugins/everest-forms/everest-forms', {
				method: 'PUT', headers: h, credentials: 'same-origin',
				body: JSON.stringify( { status: 'active' } ),
			} );
			return r.ok;
		} );

		t.check( 'entry seeder armed', await setOpt( 'minimal_test_seed_everest', '1' ) );

		await page.goto( BASE + '/minimal-admin/everest-forms', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );

		/* ===== Entries list ===== */
		const body = await page.$eval( '#minimal-view', ( el ) => el.textContent );
		t.check( 'seeded entries render with answer summaries', body.includes( 'Dana Tester' ) && body.includes( 'dana@example.com' ) );
		t.check( 'form column names the form', body.includes( 'Minimal EVF Fixture' ) );
		const tabs = await page.$$eval( '[data-stab]', ( els ) => els.map( ( e ) => e.textContent.trim() ) );
		t.check( 'form tabs render', tabs[ 0 ] === 'All entries' && tabs.includes( 'Minimal EVF Fixture' ), tabs.join( ' · ' ) );
		const filters = await page.$$eval( '[data-sfilter]', ( els ) => els.map( ( e ) => e.textContent.trim() ) );
		t.check( 'status filter renders Received/Spam/Trash', filters.includes( 'Received' ) && filters.includes( 'Spam' ) && filters.includes( 'Trash' ), filters.join( ' · ' ) );

		/* ===== Search over answer meta ===== */
		await page.fill( '#minimal-surface-search', 'popup' );
		await page.waitForFunction( () => {
			const rows = document.querySelectorAll( '.minimal-table-row' );
			return rows.length === 1 && rows[ 0 ].textContent.includes( 'Miguel' );
		}, { timeout: 20000 } );
		t.check( 'search filters entries', true );
		await page.fill( '#minimal-surface-search', '' );
		await page.waitForFunction( () => document.querySelectorAll( '.minimal-table-row' ).length >= 3, { timeout: 20000 } );

		/* ===== Detail: labels from their form field map ===== */
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-table-row' ) ].find( ( r ) => r.textContent.includes( 'Priya' ) ).click();
		} );
		// Wait for the action buttons — '.minimal-modal' alone matches the loading state.
		await page.waitForSelector( '.minimal-modal [data-saction]', { timeout: 15000 } );
		const modal = await page.$eval( '.minimal-modal', ( el ) => el.textContent );
		t.check( 'answers wear their field labels', modal.includes( 'Message' ) && modal.includes( 'The thank-you page 404s after submitting.' ) );
		t.check( 'entry renders as a contact card', !! ( await page.$( '.minimal-modal.entry' ) ) );
		t.check( 'card links out to Everest Forms', await page.$$eval( '.minimal-modal a[href]', ( els ) =>
			els.some( ( a ) => /page=evf-entries/.test( a.href ) ) ) );

		/* ===== Trash through their update_status (prior status preserved) ===== */
		page.once( 'dialog', ( d ) => d.accept() );
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-modal [data-saction]' ) ].find( ( b ) => b.textContent.includes( 'Trash entry' ) ).click();
		} );
		await page.waitForFunction( () => ! document.querySelector( '.minimal-modal' ), { timeout: 15000 } );
		t.check( 'trash left two received entries', ( await restTotal( 'publish' ) ) === 2 );
		t.check( 'trash bucket has the entry', ( await restTotal( 'trash' ) ) >= 1 );

		/* ===== Trash filter + permanent delete ===== */
		await page.click( '[data-sfilter="trash"]' );
		await page.waitForFunction( () => {
			const rows = [ ...document.querySelectorAll( '.minimal-table-row' ) ];
			return rows.some( ( r ) => r.textContent.includes( 'Priya' ) );
		}, { timeout: 20000 } );
		t.check( 'trash filter lists the trashed entry', true );

		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-table-row' ) ].find( ( r ) => r.textContent.includes( 'Priya' ) ).click();
		} );
		await page.waitForSelector( '.minimal-modal [data-saction]', { timeout: 15000 } );
		page.once( 'dialog', ( d ) => d.accept() );
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-modal [data-saction]' ) ].find( ( b ) => b.textContent.includes( 'Delete permanently' ) ).click();
		} );
		await page.waitForFunction( () => ! document.querySelector( '.minimal-modal' ), { timeout: 15000 } );
		t.check( 'permanent delete removed the entry', ( await restTotal( 'trash' ) ) === 0 );

		/* ===== Forms view ===== */
		await page.click( '[data-sview="manage"]' );
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );
		const formRow = await page.evaluate( () => {
			const row = [ ...document.querySelectorAll( '.minimal-table-row' ) ].find( ( r ) => r.textContent.includes( 'Minimal EVF Fixture' ) );
			return row ? row.textContent.replace( /\s+/g, ' ' ).trim() : '';
		} );
		t.check( 'forms view lists the form with a live count', /Minimal EVF Fixture/.test( formRow ) && /[12]/.test( formRow ), formRow || '(no row)' );
		await page.evaluate( () => {
			[ ...document.querySelectorAll( '.minimal-table-row' ) ].find( ( r ) => r.textContent.includes( 'Minimal EVF Fixture' ) ).click();
		} );
		await page.waitForSelector( '.minimal-modal a[href]', { timeout: 15000 } );
		t.check( 'form row links into Everest\'s builder', await page.$$eval( '.minimal-modal a[href]', ( els ) =>
			els.some( ( a ) => /page=evf-builder&tab=fields&form_id=\d+/.test( a.href ) ) ) );
	} finally {
		await setOpt( 'minimal_test_seed_everest', '1' ).catch( () => {} ); // restore the deleted row
	}

	await t.done( browser, errors );
} )();
