/**
 * Products surface — WooCommerce catalog list/detail via wc/v3.
 * Fences product out of Content; daily fields edit in a modal; deep link to WC.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'products' );

	page.on( 'dialog', ( d ) => d.accept().catch( () => {} ) );

	await login( page );

	const hasWc = await page.evaluate( () => !!( window.MINIMAL && window.MINIMAL.wc && window.MINIMAL.caps && window.MINIMAL.caps.products ) );
	if ( ! hasWc ) {
		t.check( 'WooCommerce products available', false, 'wc/products cap missing — skip' );
		await t.done( browser, errors );
		return;
	}
	t.check( 'WooCommerce products available', true, '' );

	// Cap + route wiring from boot.
	const boot = await page.evaluate( () => ( {
		products: !!( window.MINIMAL.caps && window.MINIMAL.caps.products ),
		wc: !! window.MINIMAL.wc,
	} ) );
	t.check( 'boot caps.products is true', boot.products && boot.wc, JSON.stringify( boot ) );

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

	// Ensure a simple product we can edit.
	const suffix = Date.now().toString( 36 );
	const created = await api( 'wc/v3/products', {
		method: 'POST',
		body: JSON.stringify( {
			name: 'Minimal Products Suite ' + suffix,
			type: 'simple',
			regular_price: '24.00',
			status: 'publish',
			sku: 'minimal-suite-' + suffix,
			manage_stock: true,
			stock_quantity: 7,
			stock_status: 'instock',
			short_description: 'Suite short desc',
		} ),
	} );
	t.check( 'created fixture product',
		created.status === 201 || created.status === 200,
		JSON.stringify( created.status ) );
	const productId = created.body && created.body.id;
	t.check( 'have product id', !! productId, String( productId ) );

	// Content must NOT list product as a type tab (fenced in HIDDEN_TYPES).
	await page.goto( BASE + '/minimal-admin/content', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-view', { timeout: 20000 } );
	// Types load async; wait until the SPA has a types cache or finished first paint.
	await page.waitForFunction( () => {
		// After loadTypes the combobox or tabs include at least Posts/All.
		const html = document.body.innerHTML;
		return html.includes( 'data-filter' ) || html.includes( 'data-typecombo' ) || html.includes( 'minimal-type-select' );
	}, null, { timeout: 12000 } ).catch( () => null );
	await page.waitForTimeout( 600 );
	const contentFence = await page.evaluate( async () => {
		// Authoritative check: the types REST response still includes product,
		// but Minimal's content filter must drop it. Mirror the client filter.
		const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/types?context=edit', {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce },
			credentials: 'same-origin',
		} );
		const types = await r.json();
		const productInRest = !!( types && types.product );
		const domHasProduct = !! document.querySelector( '[data-filter="products"], [data-filter="product"]' )
			|| Array.from( document.querySelectorAll( '.minimal-tab, .minimal-ac-item' ) )
				.some( ( el ) => /^(products|product)$/i.test( ( el.textContent || '' ).trim() ) );
		return { productInRest, domHasProduct };
	} );
	t.check( 'product CPT still in REST types (show_in_rest)', contentFence.productInRest, JSON.stringify( contentFence ) );
	t.check( 'Content has no Products type tab', ! contentFence.domHasProduct, JSON.stringify( contentFence ) );

	// Products surface loads.
	await page.goto( BASE + '/minimal-admin/products', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-product-search, .minimal-table-row, .minimal-empty, .minimal-loading', { timeout: 20000 } );
	await page.waitForFunction( () => {
		return !! document.querySelector( '#minimal-product-search' )
			|| !! document.querySelector( '.minimal-table-row[data-product]' )
			|| ( document.querySelector( '.minimal-empty' ) && ! document.querySelector( '.minimal-loading' ) );
	}, null, { timeout: 15000 } ).catch( () => null );

	const hasSearch = await page.$( '#minimal-product-search' );
	t.check( 'products toolbar has search field', !! hasSearch, '' );
	t.check( 'Products nav route renders',
		!! hasSearch || !!( await page.$( '.minimal-table-row[data-product]' ) ),
		'' );

	// Search by SKU.
	if ( hasSearch && productId ) {
		await page.fill( '#minimal-product-search', 'minimal-suite-' + suffix );
		await page.waitForTimeout( 700 );
		await page.waitForFunction( ( id ) => {
			const rows = document.querySelectorAll( '.minimal-table-row[data-product]' );
			return rows.length >= 1 && Array.from( rows ).some( ( r ) => r.dataset.product === String( id ) );
		}, productId, { timeout: 12000 } ).catch( () => null );
		const found = await page.evaluate( ( id ) => {
			const rows = Array.from( document.querySelectorAll( '.minimal-table-row[data-product]' ) );
			return { n: rows.length, hit: rows.some( ( r ) => r.dataset.product === String( id ) ) };
		}, productId );
		t.check( 'search by SKU finds the product', found.hit && found.n >= 1, JSON.stringify( found ) );

		// Also search by exact id.
		await page.fill( '#minimal-product-search', String( productId ) );
		await page.waitForTimeout( 700 );
		await page.waitForFunction( ( id ) => {
			const rows = document.querySelectorAll( '.minimal-table-row[data-product]' );
			return rows.length === 1 && rows[ 0 ].dataset.product === String( id );
		}, productId, { timeout: 10000 } ).catch( () => null );
		const byId = await page.evaluate( ( id ) => {
			const rows = Array.from( document.querySelectorAll( '.minimal-table-row[data-product]' ) );
			return { n: rows.length, hit: rows.some( ( r ) => r.dataset.product === String( id ) ) };
		}, productId );
		t.check( 'search by product id finds the product', byId.hit, JSON.stringify( byId ) );
	}

	// The row itself now navigates to /products/{id}; the eye button is the
	// quick view this suite covers (see product-page.test.js for the page).
	const clicked = await page.evaluate( ( id ) => {
		const row = document.querySelector( `.minimal-table-row[data-product="${ id }"]` )
			|| document.querySelector( '.minimal-table-row[data-product]' );
		const eye = row && row.querySelector( '[data-pqv]' );
		if ( ! eye ) return false;
		eye.click();
		return true;
	}, productId );
	t.check( 'opened product quick view', clicked, '' );

	if ( clicked ) {
		await page.waitForFunction( () => {
			const m = document.querySelector( '.minimal-modal.wide, .minimal-modal' );
			return m && ! m.textContent.includes( 'Loading product' );
		}, null, { timeout: 15000 } ).catch( () => null );
		await page.waitForTimeout( 300 );

		const ui = await page.evaluate( () => {
			const modal = document.querySelector( '.minimal-modal' );
			const text = modal ? modal.textContent : '';
			return {
				open: !! modal,
				hasName: !! document.querySelector( '#minimal-p-name' ),
				hasSku: !! document.querySelector( '#minimal-p-sku' ),
				hasRegular: !! document.querySelector( '#minimal-p-regular' ),
				hasStock: !! document.querySelector( '#minimal-p-stock' ),
				hasSave: !! document.querySelector( '#minimal-product-save' ),
				hasWcEdit: /Edit in WooCommerce/.test( text ),
				hasView: /View product/.test( text ),
			};
		} );
		t.check( 'product modal is wide management UI',
			ui.open && ui.hasName && ui.hasSku && ui.hasSave && ui.hasWcEdit,
			JSON.stringify( ui ) );
		t.check( 'product modal has price and stock fields',
			ui.hasRegular && ui.hasStock, JSON.stringify( ui ) );

		// Save a field change.
		if ( ui.hasSave && ui.hasName ) {
			const newName = 'Minimal Products Suite Renamed ' + suffix;
			await page.fill( '#minimal-p-name', newName );
			if ( ui.hasRegular ) await page.fill( '#minimal-p-regular', '29.50' );
			await page.click( '#minimal-product-save' );
			await page.waitForFunction( () => {
				const btn = document.querySelector( '#minimal-product-save' );
				// After save the modal re-renders with a fresh Save button (not disabled).
				return btn && ! btn.disabled && btn.textContent.includes( 'Save' );
			}, null, { timeout: 15000 } ).catch( () => null );
			await page.waitForTimeout( 400 );

			const verify = await api( `wc/v3/products/${ productId }?_fields=id,name,regular_price,sku` );
			t.check( 'product name saved via modal',
				verify.status === 200 && verify.body && verify.body.name === newName,
				JSON.stringify( verify.body && { name: verify.body.name } ) );
			t.check( 'product price saved via modal',
				verify.status === 200 && verify.body && String( verify.body.regular_price ) === '29.50',
				JSON.stringify( verify.body && { price: verify.body.regular_price } ) );
		}
	}

	// Cleanup fixture product.
	if ( productId ) {
		await api( `wc/v3/products/${ productId }?force=true`, { method: 'DELETE' } ).catch( () => null );
	}

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
