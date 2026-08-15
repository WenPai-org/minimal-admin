/**
 * Coupons surface — list/search/create/edit via wc/v3, fenced from Content.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'coupons' );

	page.on( 'dialog', ( d ) => d.accept().catch( () => {} ) );
	await login( page );

	const hasWc = await page.evaluate( () => !!( window.MINIMAL && window.MINIMAL.wc && window.MINIMAL.caps && window.MINIMAL.caps.coupons ) );
	if ( ! hasWc ) {
		t.check( 'WooCommerce coupons available', false, 'caps.coupons missing — skip' );
		await t.done( browser, errors );
		return;
	}
	t.check( 'WooCommerce coupons available', true, '' );

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
	const code = 'MINIMAL' + suffix.toUpperCase();
	const created = await api( 'wc/v3/coupons', {
		method: 'POST',
		body: JSON.stringify( {
			code,
			discount_type: 'percent',
			amount: '15',
			status: 'publish',
			description: 'Coupons suite',
			usage_limit: 10,
		} ),
	} );
	t.check( 'created fixture coupon', created.status === 201 || created.status === 200, JSON.stringify( created.status ) );
	const couponId = created.body && created.body.id;
	t.check( 'have coupon id', !! couponId, String( couponId ) );

	// Content fence: shop_coupon not a Content type tab.
	await page.goto( BASE + '/minimal-admin/content', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-view', { timeout: 20000 } );
	await page.waitForTimeout( 800 );
	const fenced = await page.evaluate( () => {
		const html = document.body.innerHTML;
		return /data-filter=["']shop_coupon["']/.test( html )
			|| Array.from( document.querySelectorAll( '.minimal-tab' ) )
				.some( ( el ) => /coupon/i.test( el.textContent || '' ) );
	} );
	t.check( 'Content has no Coupons type tab', ! fenced, '' );

	await page.goto( BASE + '/minimal-admin/coupons', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-coupon-search, .minimal-empty, .minimal-loading', { timeout: 20000 } );
	await page.waitForFunction( () => !! document.querySelector( '#minimal-coupon-search' ), null, { timeout: 15000 } ).catch( () => null );

	const hasSearch = await page.$( '#minimal-coupon-search' );
	const hasAdd = await page.$( '#minimal-coupon-add' );
	t.check( 'coupons toolbar has search', !! hasSearch, '' );
	t.check( 'coupons has Add coupon button', !! hasAdd, '' );

	if ( hasSearch && couponId ) {
		await page.fill( '#minimal-coupon-search', code );
		await page.waitForTimeout( 700 );
		await page.waitForFunction( ( id ) => {
			const rows = document.querySelectorAll( '.minimal-table-row[data-coupon]' );
			return Array.from( rows ).some( ( r ) => r.dataset.coupon === String( id ) );
		}, couponId, { timeout: 12000 } ).catch( () => null );
		const found = await page.evaluate( ( id ) => {
			const rows = Array.from( document.querySelectorAll( '.minimal-table-row[data-coupon]' ) );
			return { n: rows.length, hit: rows.some( ( r ) => r.dataset.coupon === String( id ) ) };
		}, couponId );
		t.check( 'search by code finds coupon', found.hit, JSON.stringify( found ) );
	}

	const clicked = await page.evaluate( ( id ) => {
		const row = document.querySelector( `.minimal-table-row[data-coupon="${ id }"]` )
			|| document.querySelector( '.minimal-table-row[data-coupon]' );
		if ( ! row ) return false;
		row.click();
		return true;
	}, couponId );
	t.check( 'clicked coupon row', clicked, '' );

	if ( clicked ) {
		await page.waitForFunction( () => {
			const m = document.querySelector( '.minimal-modal' );
			return m && ! m.textContent.includes( 'Loading coupon' );
		}, null, { timeout: 15000 } ).catch( () => null );

		const ui = await page.evaluate( () => ( {
			hasCode: !! document.querySelector( '#minimal-c-code' ),
			hasAmount: !! document.querySelector( '#minimal-c-amount' ),
			hasSave: !! document.querySelector( '#minimal-coupon-save' ),
			hasWc: /Edit in WooCommerce/.test( document.querySelector( '.minimal-modal' )?.textContent || '' ),
		} ) );
		t.check( 'coupon modal has edit fields', ui.hasCode && ui.hasAmount && ui.hasSave, JSON.stringify( ui ) );

		if ( ui.hasSave ) {
			await page.fill( '#minimal-c-amount', '20' );
			await page.click( '#minimal-coupon-save' );
			await page.waitForTimeout( 800 );
			const verify = await api( `wc/v3/coupons/${ couponId }?_fields=id,amount,code` );
			t.check( 'coupon amount saved',
				verify.status === 200 && verify.body && String( parseFloat( verify.body.amount ) ) === '20',
				JSON.stringify( verify.body ) );
		}
	}

	// Create via UI.
	await page.keyboard.press( 'Escape' );
	await page.waitForTimeout( 200 );
	if ( hasAdd ) {
		await page.click( '#minimal-coupon-add' );
		await page.waitForSelector( '#minimal-c-code', { timeout: 5000 } );
		const newCode = 'NEW' + suffix.toUpperCase();
		await page.fill( '#minimal-c-code', newCode );
		await page.fill( '#minimal-c-amount', '5' );
		await page.click( '#minimal-coupon-save' );
		// A flat wait races the POST under load; wait for the created toast
		// before verifying against the API.
		await page.waitForFunction(
			() => /Coupon created/i.test( ( document.querySelector( '.minimal-toast' ) || {} ).textContent || '' ),
			null, { timeout: 15000 } ).catch( () => null );
		const listed = await api( `wc/v3/coupons?search=${ encodeURIComponent( newCode ) }&_fields=id,code` );
		const hit = ( listed.body || [] ).find( ( c ) => ( c.code || '' ).toLowerCase() === newCode.toLowerCase() );
		t.check( 'Add coupon creates via UI', !! hit, JSON.stringify( listed.body ) );
		if ( hit ) await api( `wc/v3/coupons/${ hit.id }?force=true`, { method: 'DELETE' } ).catch( () => null );
	}

	if ( couponId ) await api( `wc/v3/coupons/${ couponId }?force=true`, { method: 'DELETE' } ).catch( () => null );

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
