/**
 * Wave 9 of the product page: the Variations card on a variable product.
 * Generate from attributes, edit per variation, remove, all saved through the
 * variations batch route by the page's own Save button.
 *
 * Fixture: one variable product using the standing "Size" store attribute.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'product-variations' );

	page.on( 'dialog', ( d ) => d.accept().catch( () => {} ) );
	await login( page );

	const hasWc = await page.evaluate( () => !!( window.MINIMAL && window.MINIMAL.wc && window.MINIMAL.caps && window.MINIMAL.caps.products ) );
	if ( ! hasWc ) {
		t.check( 'WooCommerce available', false, 'skip' );
		await t.done( browser, errors );
		return;
	}
	t.check( 'WooCommerce available', true, '' );

	const api = ( path, opts ) => page.evaluate( async ( a ) => {
		const r = await fetch( window.MINIMAL.restUrl + a.path, Object.assign( {
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
			credentials: 'same-origin',
		}, a.opts || {} ) );
		const text = await r.text();
		let body = null;
		try { body = JSON.parse( text ); } catch ( e ) { body = text; }
		return { status: r.status, body };
	}, { path, opts } );

	const save = async () => {
		await page.click( '#minimal-product-save' );
		await page.waitForFunction( () => {
			const b = document.querySelector( '#minimal-product-save' );
			return b && ! b.disabled && /Save/.test( b.textContent );
		}, null, { timeout: 25000 } ).catch( () => null );
		await page.waitForTimeout( 900 );
	};

	const suffix = Date.now();
	let id = null;
	try {
		const defs = await api( 'wc/v3/products/attributes?_fields=id,name' );
		const attr = ( defs.body || [] )[ 0 ];
		t.check( 'the store has a global attribute to vary by', !! attr, JSON.stringify( defs.body ) );
		if ( ! attr ) {
			await t.done( browser, errors );
			return;
		}

		const made = await api( 'wc/v3/products', {
			method: 'POST',
			body: JSON.stringify( { name: 'Variation fixture ' + suffix, type: 'variable', status: 'publish' } ),
		} );
		id = made.body && made.body.id;
		// A global attribute cannot be assigned in the request that creates the
		// product; a second request is how it sticks (wave 8's finding).
		await api( `wc/v3/products/${ id }`, {
			method: 'PUT',
			body: JSON.stringify( { attributes: [
				{ id: attr.id, visible: true, variation: true, options: [ 'Small', 'Large' ] },
			] } ),
		} );
		t.check( 'fixture variable product created', !! id, String( made.status ) );
		if ( ! id ) {
			await t.done( browser, errors );
			return;
		}

		await page.goto( BASE + '/minimal-admin/products/' + id, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-p-variations', { timeout: 20000 } );

		const card = await page.evaluate( () => ( {
			titles: Array.from( document.querySelectorAll( '.minimal-order-panel .minimal-side-title' ) ).map( ( e ) => e.textContent.trim() ),
			empty: /No variations yet/.test( ( document.querySelector( '#minimal-p-variations' ) || {} ).textContent || '' ),
			gen: !! document.querySelector( '#minimal-p-var-gen' ),
			add: !! document.querySelector( '#minimal-p-var-add' ),
		} ) );
		t.check( 'Variations card is on the variable product', card.titles.includes( 'Variations' ), JSON.stringify( card.titles ) );
		t.check( 'a variation-less product says so and offers both buttons',
			card.empty && card.gen && card.add, JSON.stringify( card ) );

		// Generate every combination the attribute allows.
		await page.click( '#minimal-p-var-gen' );
		await page.waitForSelector( '.minimal-pvar-row', { timeout: 10000 } );
		const rows = await page.evaluate( () => document.querySelectorAll( '.minimal-pvar-row' ).length );
		t.check( 'generating builds one row per attribute value', rows === 2, String( rows ) );

		// Price them, then save through the page's own button.
		await page.fill( '[data-pvarreg="0"]', '19.00' );
		await page.fill( '[data-pvarreg="1"]', '24.00' );
		await page.fill( '[data-pvarsku="0"]', 'VAR-S-' + suffix );
		await save();

		const saved = await api( `wc/v3/products/${ id }/variations?per_page=100&_fields=id,sku,regular_price,attributes` );
		const list = saved.body || [];
		t.check( 'both variations saved', list.length === 2, JSON.stringify( list.map( ( v ) => v.regular_price ) ) );
		t.check( 'variation prices saved',
			list.some( ( v ) => String( v.regular_price ) === '19.00' )
			&& list.some( ( v ) => String( v.regular_price ) === '24.00' ),
			JSON.stringify( list.map( ( v ) => v.regular_price ) ) );
		t.check( 'variation SKU saved',
			list.some( ( v ) => v.sku === 'VAR-S-' + suffix ), JSON.stringify( list.map( ( v ) => v.sku ) ) );
		t.check( 'each variation carries its attribute value',
			list.every( ( v ) => ( v.attributes || [] ).some( ( a ) => /Small|Large/.test( a.option || '' ) ) ),
			JSON.stringify( list.map( ( v ) => v.attributes ) ) );

		// Saving twice must not duplicate: created rows come back with ids.
		await save();
		const again = await api( `wc/v3/products/${ id }/variations?per_page=100&_fields=id` );
		t.check( 'saving twice does not duplicate the variations',
			( again.body || [] ).length === 2, String( ( again.body || [] ).length ) );

		// Generating again finds nothing missing.
		await page.click( '#minimal-p-var-gen' );
		await page.waitForTimeout( 400 );
		const afterGen = await page.evaluate( () => document.querySelectorAll( '.minimal-pvar-row' ).length );
		t.check( 'generating again adds no duplicates', afterGen === 2, String( afterGen ) );

		// Reload and edit an existing variation.
		await page.goto( BASE + '/minimal-admin/products/' + id, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-pvar-row', { timeout: 20000 } );
		const repop = await page.evaluate( () => ( {
			rows: document.querySelectorAll( '.minimal-pvar-row' ).length,
			prices: Array.from( document.querySelectorAll( '[data-pvarreg]' ) ).map( ( i ) => i.value ),
			// The axis is a combobox, so the machine value is on the dataset.
			axisPicked: Array.from( document.querySelectorAll( '[data-pvaraxis] .minimal-ac-input' ) ).map( ( s ) => s.dataset.acValue ),
			nativeSelects: document.querySelectorAll( '#minimal-p-variations select' ).length,
		} ) );
		t.check( 'variations repopulate with their prices and values',
			repop.rows === 2 && repop.prices.includes( '19.00' )
			&& repop.axisPicked.filter( Boolean ).length === 2, JSON.stringify( repop ) );
		t.check( 'variation rows use Minimal comboboxes, not native selects',
			repop.nativeSelects === 0, String( repop.nativeSelects ) );

		await page.fill( '[data-pvarreg="0"]', '21.50' );
		await save();
		const edited = await api( `wc/v3/products/${ id }/variations?per_page=100&_fields=id,regular_price` );
		t.check( 'editing an existing variation updates it',
			( edited.body || [] ).some( ( v ) => String( v.regular_price ) === '21.50' )
			&& ( edited.body || [] ).length === 2,
			JSON.stringify( ( edited.body || [] ).map( ( v ) => v.regular_price ) ) );

		// Remove one and save: it goes from the server too.
		await page.click( '[data-pvarx="0"]' );
		await page.waitForTimeout( 300 );
		await save();
		const removed = await api( `wc/v3/products/${ id }/variations?per_page=100&_fields=id` );
		t.check( 'removing a variation deletes it on save',
			( removed.body || [] ).length === 1, String( ( removed.body || [] ).length ) );

		// A simple product has no Variations card at all.
		await api( `wc/v3/products/${ id }`, { method: 'PUT', body: JSON.stringify( { type: 'simple' } ) } );
		await page.goto( BASE + '/minimal-admin/products/' + id, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-p-name', { timeout: 20000 } );
		t.check( 'a simple product has no Variations card',
			! ( await page.$( '#minimal-p-variations' ) ), '' );
	} finally {
		if ( id ) await api( `wc/v3/products/${ id }?force=true`, { method: 'DELETE' } ).catch( () => null );
	}

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
