/**
 * Order payment: manual receive (Record payment), payment method + transaction
 * ID editing, and the More-from-this-customer panel.
 *
 * Fixtures are created through wc/v3 as guest orders sharing one billing email
 * (exercises the email-search path of the related-orders fetch) and deleted at
 * the end. Needs the cheque gateway enabled (standing dev-site fixture).
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'order-payment' );

	page.on( 'dialog', ( d ) => d.accept().catch( () => {} ) );
	await login( page );

	const hasWc = await page.evaluate( () => !!( window.MINIMAL && window.MINIMAL.wc && window.MINIMAL.caps && window.MINIMAL.caps.orders ) );
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
	const email = `minimal-paytest-${ suffix }@example.com`;
	let pid = null, aId = null, bId = null;

	try {
		const prod = await api( 'wc/v3/products', {
			method: 'POST',
			body: JSON.stringify( { name: 'Minimal Pay Test ' + suffix, type: 'simple', regular_price: '15.00', status: 'publish' } ),
		} );
		pid = prod.body && prod.body.id;
		t.check( 'created product', !! pid, String( prod.status ) );

		const billing = { first_name: 'Pat', last_name: 'Paytest', email, country: 'US' };
		const a = await api( 'wc/v3/orders', {
			method: 'POST',
			body: JSON.stringify( { status: 'pending', billing, line_items: [ { product_id: pid, quantity: 1 } ] } ),
		} );
		aId = a.body && a.body.id;
		t.check( 'created pending order A', !! aId && a.body.status === 'pending', JSON.stringify( { s: a.status, st: a.body && a.body.status } ) );

		const b = await api( 'wc/v3/orders', {
			method: 'POST',
			body: JSON.stringify( { status: 'pending', set_paid: true, billing, line_items: [ { product_id: pid, quantity: 2 } ] } ),
		} );
		bId = b.body && b.body.id;
		const bStatus = b.body && b.body.status;
		t.check( 'created paid order B', !! bId && !! ( b.body && b.body.date_paid ), JSON.stringify( { s: b.status, st: bStatus } ) );

		const openOrder = async ( id ) => {
			await page.goto( BASE + '/minimal-admin/orders', { waitUntil: 'domcontentloaded' } );
			await page.waitForSelector( '#minimal-order-search', { timeout: 20000 } );
			await page.fill( '#minimal-order-search', String( id ) );
			await page.keyboard.press( 'Enter' );
			await page.waitForSelector( `.minimal-table-row[data-order="${ id }"]`, { timeout: 20000 } );
			await page.click( `.minimal-table-row[data-order="${ id }"]` );
			await page.waitForSelector( '.minimal-order-payment', { timeout: 20000 } );
			await page.waitForFunction( () => ! document.querySelector( '.minimal-order-payment .minimal-loading' ), null, { timeout: 20000 } );
		};

		// Comboboxes (rule-70): click the input to open, click the option.
		const pickCombo = async ( key, value ) => {
			await page.click( `[data-oc="${ key }"] .minimal-ac-input` );
			await page.waitForSelector( `[data-oc="${ key }"] .minimal-ac-item[data-acv="${ value }"]`, { timeout: 8000 } );
			await page.click( `[data-oc="${ key }"] .minimal-ac-item[data-acv="${ value }"]` );
		};

		// ---- Order A: unpaid → payment card offers Record payment ----
		await openOrder( aId );
		await page.click( '[data-oc="paymethod"] .minimal-ac-input' );
		await page.waitForSelector( '[data-oc="paymethod"] .minimal-ac-item', { timeout: 8000 } );
		const facts = await page.evaluate( () => ( {
			options: Array.from( document.querySelectorAll( '[data-oc="paymethod"] .minimal-ac-item' ) ).map( ( b ) => b.dataset.acv ),
			record: !! document.getElementById( 'minimal-o-recordpay' ),
			txn: !! document.getElementById( 'minimal-o-txn' ),
		} ) );
		// Close the panel with a same-value pick (Escape would close the modal).
		await page.click( '[data-oc="paymethod"] .minimal-ac-item[data-acv=""]' );
		t.check( 'payment picker offers N/A + cheque + Other', facts.options.includes( '' ) && facts.options.includes( 'cheque' ) && facts.options.includes( 'other' ), JSON.stringify( facts.options ) );
		t.check( 'unpaid order offers Record payment', facts.record && facts.txn, '' );

		// ---- Related orders panel finds B by billing email ----
		await page.waitForFunction( () => {
			const p = document.querySelector( '.minimal-order-others' );
			return p && ! p.querySelector( '.minimal-loading' );
		}, null, { timeout: 20000 } );
		const rel = await page.evaluate( () => Array.from( document.querySelectorAll( '[data-relorder]' ) ).map( ( r ) => parseInt( r.dataset.relorder, 10 ) ) );
		t.check( 'other-orders panel lists sibling order', rel.includes( bId ), JSON.stringify( rel ) );
		const viewAllLabel = await page.evaluate( () => ( document.getElementById( 'minimal-o-viewall' ) || {} ).textContent || '' );
		t.check( 'View all button carries the email', viewAllLabel.includes( email ), viewAllLabel );

		// ---- Record a check payment on A (pending → set_paid path) ----
		await pickCombo( 'paymethod', 'cheque' );
		await page.fill( '#minimal-o-txn', 'CHK-' + suffix );
		await page.click( '#minimal-o-recordpay' );
		await page.waitForFunction( () => {
			const card = document.querySelector( '.minimal-order-payment' );
			return card && /Paid /.test( card.textContent ) && ! document.getElementById( 'minimal-o-recordpay' );
		}, null, { timeout: 25000 } );
		t.check( 'card flips to Paid, Record button gone', true, '' );

		const aAfter = await api( `wc/v3/orders/${ aId }?_fields=status,payment_method,payment_method_title,transaction_id,date_paid` );
		t.check( 'A: WC recorded payment_complete', aAfter.body.status === 'processing' && !! aAfter.body.date_paid, JSON.stringify( aAfter.body ) );
		t.check( 'A: method + transaction persisted', aAfter.body.payment_method === 'cheque' && aAfter.body.transaction_id === 'CHK-' + suffix, JSON.stringify( aAfter.body ) );

		// ---- Row click swaps the modal to the sibling order ----
		await page.click( `[data-relorder="${ bId }"]` );
		await page.waitForFunction( ( num ) => {
			const el = document.querySelector( '.minimal-modal-title' );
			return el && el.textContent.includes( String( num ) );
		}, bId, { timeout: 20000 } );
		t.check( 'clicking a related order opens it', true, '' );

		// ---- B is already paid: no Record button, Paid line instead ----
		// (the card must EXIST and be done loading — a not-yet-rendered card
		// makes a bare no-loading check vacuously true while B is still loading)
		await page.waitForFunction( () => {
			const card = document.querySelector( '.minimal-order-payment' );
			return card && ! card.querySelector( '.minimal-loading' );
		}, null, { timeout: 20000 } );
		const bCard = await page.evaluate( () => ( {
			record: !! document.getElementById( 'minimal-o-recordpay' ),
			paid: /Paid /.test( ( document.querySelector( '.minimal-order-payment' ) || {} ).textContent || '' ),
		} ) );
		t.check( 'paid order shows Paid line, no Record button', ! bCard.record && bCard.paid, JSON.stringify( bCard ) );

		// ---- Save-changes path: method edits persist without touching paid state ----
		const bBefore = await api( `wc/v3/orders/${ bId }?_fields=status,date_paid` );
		await pickCombo( 'paymethod', 'other' );
		await page.waitForFunction( () => {
			const w = document.getElementById( 'minimal-o-paytitle-wrap' );
			return w && w.style.display !== 'none';
		}, null, { timeout: 8000 } );
		t.check( 'Other reveals the method-name field', true, '' );
		await page.fill( '#minimal-o-paytitle', 'Wire transfer' );
		await page.click( '#minimal-order-save' );
		let bAfter = null;
		for ( let i = 0; i < 10; i++ ) {
			bAfter = await api( `wc/v3/orders/${ bId }?_fields=status,payment_method,payment_method_title,date_paid` );
			if ( bAfter.body && bAfter.body.payment_method === 'other' ) break;
			await page.waitForTimeout( 800 );
		}
		t.check( 'B: Other method + custom title saved', bAfter.body.payment_method === 'other' && bAfter.body.payment_method_title === 'Wire transfer', JSON.stringify( bAfter.body ) );
		t.check( 'B: paid state untouched by normal save', bAfter.body.status === bBefore.body.status && !! bAfter.body.date_paid, JSON.stringify( { before: bBefore.body.status, after: bAfter.body.status } ) );

		// ---- View all: orders list pre-filtered by the customer email ----
		await page.click( '#minimal-o-viewall' );
		await page.waitForFunction( ( em ) => {
			const s = document.getElementById( 'minimal-order-search' );
			return s && s.value === em;
		}, email, { timeout: 20000 } );
		await page.waitForFunction( () => document.querySelectorAll( '.minimal-table-row[data-order]' ).length >= 2, null, { timeout: 20000 } );
		const listed = await page.evaluate( () => Array.from( document.querySelectorAll( '.minimal-table-row[data-order]' ) ).map( ( r ) => parseInt( r.dataset.order, 10 ) ) );
		t.check( 'View all filters the orders list to the customer', listed.includes( aId ) && listed.includes( bId ), JSON.stringify( listed ) );
	} finally {
		if ( aId ) await api( `wc/v3/orders/${ aId }?force=true`, { method: 'DELETE' } ).catch( () => null );
		if ( bId ) await api( `wc/v3/orders/${ bId }?force=true`, { method: 'DELETE' } ).catch( () => null );
		if ( pid ) await api( `wc/v3/products/${ pid }?force=true`, { method: 'DELETE' } ).catch( () => null );
	}

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
