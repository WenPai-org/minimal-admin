/**
 * Media grid: type badge (IMG / VID / …) top-left, multi-select checkbox
 * top-right — opposite corners so hover/select never covers the kind label.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const t = reporter( 'media-check-badge' );
	const { browser, page, errors } = await launch();
	await login( page );

	try {
		await page.goto( BASE + '/minimal-admin/media', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-media-card', { timeout: 15000 } );

		// Hover first card so the checkbox appears; select two items.
		const cards = page.locator( '.minimal-media-card' );
		await cards.first().hover();
		await page.waitForSelector( '.minimal-media-card .minimal-media-check', { timeout: 5000 } );

		const layout = await page.evaluate( () => {
			const card = document.querySelector( '.minimal-media-card' );
			if ( ! card ) return { err: 'no-card' };
			const check = card.querySelector( '.minimal-media-check' );
			const badge = card.querySelector( '.minimal-media-badge' );
			if ( ! check || ! badge ) return { err: 'missing-nodes' };
			// Force checkbox visible for geometry (opacity:0 still has a box).
			check.style.opacity = '1';
			const cr = check.getBoundingClientRect();
			const br = badge.getBoundingClientRect();
			const cardR = card.getBoundingClientRect();
			// Rects overlap if none of the separating-axis gaps hold.
			const gap = 2;
			const separate = cr.right + gap <= br.left
				|| br.right + gap <= cr.left
				|| cr.bottom + gap <= br.top
				|| br.bottom + gap <= cr.top;
			return {
				check: { left: cr.left - cardR.left, right: cr.right - cardR.left, top: cr.top - cardR.top },
				badge: { left: br.left - cardR.left, right: br.right - cardR.left, top: br.top - cardR.top },
				cardW: cardR.width,
				separate,
				badgeText: badge.textContent.trim(),
			};
		} );

		t.check( 'card has checkbox + badge', ! layout.err, JSON.stringify( layout ) );
		t.check( 'badge sits in the left half', layout.badge && layout.badge.left < layout.cardW / 2, JSON.stringify( layout.badge ) );
		t.check( 'checkbox sits in the right half', layout.check && layout.check.left > layout.cardW / 2, JSON.stringify( layout.check ) );
		t.check( 'checkbox and badge do not overlap', layout.separate === true, JSON.stringify( layout ) );

		// Select two and re-check geometry under selected state (opacity forced on).
		await page.locator( '.minimal-media-card .minimal-media-cb' ).nth( 0 ).check( { force: true } );
		await page.locator( '.minimal-media-card .minimal-media-cb' ).nth( 1 ).check( { force: true } );
		await page.waitForSelector( '.minimal-media-card.sel', { timeout: 5000 } );

		const selected = await page.evaluate( () => {
			const card = document.querySelector( '.minimal-media-card.sel' );
			const check = card && card.querySelector( '.minimal-media-check' );
			const badge = card && card.querySelector( '.minimal-media-badge' );
			if ( ! check || ! badge ) return { err: 'missing' };
			const cr = check.getBoundingClientRect();
			const br = badge.getBoundingClientRect();
			const gap = 2;
			const separate = cr.right + gap <= br.left
				|| br.right + gap <= cr.left
				|| cr.bottom + gap <= br.top
				|| br.bottom + gap <= cr.top;
			return { separate, badge: badge.textContent.trim() };
		} );
		t.check( 'selected state still keeps them apart', selected.separate === true, JSON.stringify( selected ) );

		await t.done( browser, errors );
	} catch ( e ) {
		console.error( e );
		await t.done( browser, errors.concat( [ String( e ) ] ) );
		process.exit( 1 );
	}
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
