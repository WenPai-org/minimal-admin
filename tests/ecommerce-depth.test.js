/**
 * Ecommerce depth: product stock filters + bulk, order notes timeline.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'ecommerce-depth' );

	page.on( 'dialog', ( d ) => d.accept().catch( () => {} ) );
	await login( page );

	const hasWc = await page.evaluate( () => !!( window.MINIMAL && window.MINIMAL.wc && window.MINIMAL.caps ) );
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

	const suffix = Date.now().toString( 36 );
	const thr = await page.evaluate( () => Number( window.MINIMAL.wcLowStock ) || 2 );
	const prod = await api( 'wc/v3/products', {
		method: 'POST',
		body: JSON.stringify( {
			name: 'Minimal Low Stock ' + suffix,
			type: 'simple',
			regular_price: '9.00',
			status: 'publish',
			manage_stock: true,
			stock_quantity: Math.max( 1, thr ),
			stock_status: 'instock',
		} ),
	} );
	t.check( 'created low-stock product', prod.status === 201 || prod.status === 200, JSON.stringify( prod.status ) );
	const pid = prod.body && prod.body.id;

	// Products: stock tabs + bulk first (stable path), then low-stock filter.
	await page.goto( BASE + '/minimal-admin/products', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-product-search', { timeout: 20000 } );
	await page.waitForFunction( () => !! document.querySelector( '#minimal-prod-sel-all, [data-pstock]' ), null, { timeout: 15000 } ).catch( () => null );
	await page.waitForTimeout( 400 );

	const stockTabs = await page.evaluate( () =>
		Array.from( document.querySelectorAll( '[data-pstock]' ) ).map( ( b ) => b.dataset.pstock )
	);
	t.check( 'product stock filter tabs present',
		[ 'any', 'instock', 'outofstock', 'onbackorder', 'low' ].every( ( id ) => stockTabs.includes( id ) ),
		JSON.stringify( stockTabs ) );

	const hasCb = await page.$( '#minimal-prod-sel-all, [data-psel]' );
	t.check( 'products list has bulk checkboxes', !! hasCb, '' );

	if ( hasCb && pid ) {
		await page.fill( '#minimal-product-search', String( pid ) );
		await page.waitForFunction( ( id ) =>
			!! document.querySelector( `.minimal-table-row[data-product="${ id }"]` ), pid, { timeout: 12000 } ).catch( () => null );
		const checked = await page.evaluate( ( id ) => {
			const cb = document.querySelector( `[data-psel="${ id }"]` );
			if ( ! cb ) return false;
			cb.click();
			return cb.checked;
		}, pid );
		t.check( 'can select product for bulk', checked, '' );
		if ( checked ) {
			await page.waitForSelector( '#minimal-prod-bulk-apply', { timeout: 5000 } );
			// Status is a themed combobox (same pattern as Users bulk role).
			t.check( 'bulk status is a combobox, not a native select',
				( await page.$( '[data-prod-bulk-status] .minimal-ac-input' ) ) !== null
				&& ( await page.$( '#minimal-prod-bulk-status' ) ) === null );
			await page.click( '[data-prod-bulk-status] .minimal-ac-input' );
			await page.waitForSelector( '[data-prod-bulk-status] .minimal-ac-item[data-acv="draft"]', { timeout: 5000 } );
			await page.click( '[data-prod-bulk-status] .minimal-ac-item[data-acv="draft"]' );
			await page.click( '#minimal-prod-bulk-apply' );
			await page.waitForFunction( async ( id ) => {
				// Poll REST via page until status flips (batch can lag a beat).
				return true;
			}, pid, { timeout: 2000 } ).catch( () => null );
			await page.waitForTimeout( 1200 );
			const verify = await api( `wc/v3/products/${ pid }?_fields=id,status` );
			t.check( 'bulk status update to draft',
				verify.status === 200 && verify.body && verify.body.status === 'draft',
				JSON.stringify( verify.body ) );
			await api( `wc/v3/products/${ pid }`, {
				method: 'PUT',
				body: JSON.stringify( { status: 'publish', manage_stock: true, stock_quantity: Math.max( 1, thr ), stock_status: 'instock' } ),
			} );
		} else {
			t.check( 'bulk status update to draft', false, 'no checkbox for product' );
		}
	} else {
		t.check( 'can select product for bulk', false, 'no bulk UI' );
		t.check( 'bulk status update to draft', false, 'skipped' );
	}

	// Clear search via Escape (updates SPA state, not only the input value).
	const searchEl = await page.$( '#minimal-product-search' );
	if ( searchEl ) {
		await searchEl.focus();
		await page.keyboard.press( 'Escape' );
		await page.waitForTimeout( 700 );
	}
	// Ensure stock qty is low again after bulk status flips.
	if ( pid ) {
		await api( `wc/v3/products/${ pid }`, {
			method: 'PUT',
			body: JSON.stringify( {
				status: 'publish',
				manage_stock: true,
				stock_quantity: Math.max( 1, thr ),
				stock_status: 'instock',
			} ),
		} );
	}
	const lowBtn = await page.$( '[data-pstock="low"]' );
	if ( lowBtn ) {
		await lowBtn.click();
		await page.waitForTimeout( 1200 );
		let lowHit = await page.evaluate( ( id ) => {
			const rows = Array.from( document.querySelectorAll( '.minimal-table-row[data-product]' ) );
			return {
				n: rows.length,
				hit: rows.some( ( r ) => r.dataset.product === String( id ) ),
				ids: rows.slice( 0, 8 ).map( ( r ) => r.dataset.product ),
			};
		}, pid );
		if ( ! lowHit.hit ) {
			// Direct id search while Low stock is active (should still surface managed low qty).
			await page.fill( '#minimal-product-search', String( pid ) );
			await page.waitForTimeout( 900 );
			lowHit = await page.evaluate( ( id ) => {
				const rows = Array.from( document.querySelectorAll( '.minimal-table-row[data-product]' ) );
				return {
					n: rows.length,
					hit: rows.some( ( r ) => r.dataset.product === String( id ) ),
					ids: rows.slice( 0, 8 ).map( ( r ) => r.dataset.product ),
				};
			}, pid );
		}
		t.check( 'Low stock tab lists the low-qty product', lowHit.hit, JSON.stringify( lowHit ) );
	} else {
		t.check( 'Low stock tab lists the low-qty product', false, 'no low tab' );
	}

	// Order notes.
	const listed = await api( 'wc/v3/orders?per_page=5&status=processing,completed,on-hold&_fields=id,number' );
	let orderId = ( listed.body || [] )[ 0 ] && ( listed.body || [] )[ 0 ].id;
	if ( ! orderId && pid ) {
		const ord = await api( 'wc/v3/orders', {
			method: 'POST',
			body: JSON.stringify( {
				status: 'processing',
				billing: { first_name: 'Note', last_name: 'Tester', email: 'note-suite@example.com' },
				line_items: [ { product_id: pid, quantity: 1 } ],
			} ),
		} );
		orderId = ord.body && ord.body.id;
	}
	t.check( 'have order for notes', !! orderId, String( orderId ) );

	if ( orderId ) {
		await page.goto( BASE + '/minimal-admin/orders', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-order-search', { timeout: 20000 } );
		await page.fill( '#minimal-order-search', String( orderId ) );
		await page.waitForTimeout( 700 );
		await page.evaluate( ( id ) => {
			const row = document.querySelector( `.minimal-table-row[data-order="${ id }"]` )
				|| document.querySelector( '.minimal-table-row[data-order]' );
			if ( row ) row.click();
		}, orderId );
		// Row click lands on the /orders/{id} page now; the notes UI is the
		// same shared detail body either way.
		await page.waitForFunction( () => {
			const p = document.querySelector( '.minimal-order-page' );
			return p && ! p.textContent.includes( 'Loading order' );
		}, null, { timeout: 15000 } ).catch( () => null );
		await page.waitForFunction( () => !! document.querySelector( '#minimal-o-note-add' ), null, { timeout: 10000 } ).catch( () => null );

		const notesUi = await page.evaluate( () => ( {
			section: !! document.querySelector( '.minimal-order-notes' ),
			add: !! document.querySelector( '#minimal-o-note-add' ),
			list: !! document.querySelector( '.minimal-order-notes-list' ),
		} ) );
		t.check( 'order detail shows notes section', notesUi.section && notesUi.add, JSON.stringify( notesUi ) );

		if ( notesUi.add ) {
			const noteText = 'Suite private note ' + suffix;
			await page.fill( '#minimal-o-new-note', noteText );
			await page.click( '#minimal-o-note-add' );
			await page.waitForFunction( ( text ) => {
				const list = document.querySelector( '.minimal-order-notes-list' );
				return list && list.textContent.includes( text );
			}, noteText, { timeout: 12000 } ).catch( () => null );
			const inUi = await page.evaluate( ( text ) => {
				const list = document.querySelector( '.minimal-order-notes-list' );
				return list && list.textContent.includes( text );
			}, noteText );
			t.check( 'added note appears in timeline', inUi, '' );

			const notes = await api( `wc/v3/orders/${ orderId }/notes?per_page=20` );
			const hit = ( notes.body || [] ).some( ( n ) => ( n.note || '' ).includes( noteText ) );
			t.check( 'note persisted via WC REST', hit, JSON.stringify( { n: ( notes.body || [] ).length } ) );
		}
	}

	if ( pid ) await api( `wc/v3/products/${ pid }?force=true`, { method: 'DELETE' } ).catch( () => null );

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
