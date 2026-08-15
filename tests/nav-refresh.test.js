/**
 * Nav re-click refresh (v0.23.0) + the wide email preview modal.
 *
 * Clicking the sidebar item for the route you're already on soft-reloads the
 * list in place (chrome kept, rows dimmed) so a long-open tab can pull rows
 * someone else just added. The lit FAMILY item counts as "current" while on
 * any of that family's surfaces — its data-nav points at the preferred
 * provider, and without the family match a re-click mid-FluentSMTP jumped to
 * Gravity SMTP instead of refreshing (the probe that found it).
 *
 * Also pins the .minimal-modal.mail width: an HTML email body preview renders
 * in the extra-wide modal instead of clipping real message layouts at 720px.
 */
const { BASE, launch, login, createPost, deletePost, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'nav-refresh' );
	await login( page );
	let postId = null;

	try {
		// --- Content: re-click refreshes in place -------------------------------
		await page.goto( BASE + '/minimal-admin/content', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );

		const hint = await page.evaluate( () => {
			const b = document.querySelector( '.minimal-nav-btn.active[data-nav="content"]' );
			return b ? b.title : null;
		} );
		t.check( 'Active nav item hints the refresh', hint === 'Click again to refresh', String( hint ) );

		const title = 'Nav refresh suite ' + Date.now();
		postId = await createPost( page, { title, content: '<p>probe</p>', status: 'draft' } );
		t.check( 'Fresh post not yet in the stale list',
			! ( await page.evaluate( ( x ) => document.body.innerText.includes( x ), title ) ), '' );

		// Delay the list fetch so the busy window is deterministic, and prove
		// the toolbar node survives the reload (soft, not a cold shell).
		await page.evaluate( () => {
			const bar = document.querySelector( '#minimal-view .minimal-toolbar' );
			if ( bar ) bar._minimalProbe = true;
		} );
		await page.route( '**/wp/v2/posts*', async ( route ) => {
			await new Promise( ( r ) => setTimeout( r, 700 ) );
			await route.continue().catch( () => {} );
		} );
		await page.click( '.minimal-nav-btn[data-nav="content"]' );
		await page.waitForSelector( '#minimal-view .minimal-busy', { timeout: 5000 } );
		const midWindow = await page.evaluate( () => {
			const bar = document.querySelector( '#minimal-view .minimal-toolbar' );
			return { probe: !! ( bar && bar._minimalProbe ), cold: !! document.querySelector( '#minimal-view .minimal-loading' ) };
		} );
		t.check( 'Chrome survives the reload (no cold shell)', midWindow.probe && ! midWindow.cold, JSON.stringify( midWindow ) );
		await page.unroute( '**/wp/v2/posts*' );

		await page.waitForFunction( ( x ) => document.body.innerText.includes( x ), title, { timeout: 20000 } );
		t.check( 'Fresh post appears after re-click', true, '' );
		t.check( 'Route unchanged (no navigation)',
			await page.evaluate( () => location.pathname === '/minimal-admin/content' ), '' );

		// A picked filter survives the refresh (state, not a reset).
		await page.waitForFunction( () => ! document.querySelector( '#minimal-view .minimal-busy' ), null, { timeout: 15000 } );
		const hasTab = await page.$( '.minimal-tab[data-filter="posts"]' );
		if ( hasTab ) {
			await page.click( '.minimal-tab[data-filter="posts"]' );
		} else {
			await page.click( '[data-typecombo] .minimal-ac-input' );
			await page.waitForSelector( '[data-typecombo] .minimal-ac-item[data-acv="posts"]', { timeout: 5000 } );
			await page.click( '[data-typecombo] .minimal-ac-item[data-acv="posts"]' );
		}
		await page.waitForFunction( () => ! document.querySelector( '#minimal-view .minimal-busy' ), null, { timeout: 15000 } );
		await page.click( '.minimal-nav-btn[data-nav="content"]' );
		await page.waitForFunction( () => ! document.querySelector( '#minimal-view .minimal-busy' ), null, { timeout: 15000 } );
		await page.waitForTimeout( 250 );
		const filterKept = await page.evaluate( () => {
			const tab = document.querySelector( '.minimal-tab[data-filter="posts"]' );
			if ( tab ) return tab.classList.contains( 'active' );
			const combo = document.querySelector( '[data-typecombo] .minimal-ac-input' );
			return !! combo && /post/i.test( combo.placeholder || combo.value || '' );
		} );
		t.check( 'Type filter survives the refresh', filterKept, '' );

		// --- Surface family item: re-click refreshes the CURRENT provider ------
		await page.goto( BASE + '/minimal-admin/fluent-smtp', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );
		let listFetches = 0;
		page.on( 'request', ( r ) => { if ( r.url().includes( 'fluent-smtp/emails' ) ) listFetches++; } );
		await page.click( '.minimal-nav-btn.active' );
		await page.waitForFunction( () => ! document.querySelector( '#minimal-view .minimal-busy' ), null, { timeout: 15000 } );
		await page.waitForTimeout( 400 );
		t.check( 'Family re-click stays on the current provider',
			await page.evaluate( () => location.pathname === '/minimal-admin/fluent-smtp' ), '' );
		t.check( 'Family re-click refetches the list', listFetches >= 1, `fetches=${ listFetches }` );

		// --- Wide email preview modal ------------------------------------------
		await page.waitForSelector( '.minimal-table-row', { timeout: 20000 } );
		await page.click( '.minimal-table-row' );
		await page.waitForSelector( '.minimal-modal .minimal-modal-actions', { timeout: 15000 } );
		const modal = await page.evaluate( () => {
			const m = document.querySelector( '.minimal-modal' );
			return {
				mail: m.classList.contains( 'mail' ),
				w: m.offsetWidth,
				frame: !! m.querySelector( '.minimal-detail-frame' ),
			};
		} );
		t.check( 'HTML email detail gets the mail modal', modal.mail && modal.frame, JSON.stringify( modal ) );
		// 900px (the large-media-modal width) — 1080 read as too big.
		t.check( 'Mail modal is wider than the 720px dialog', modal.w >= 850 && modal.w <= 940, `w=${ modal.w }` );
		await page.keyboard.press( 'Escape' );
	} finally {
		if ( postId ) await deletePost( page, postId ).catch( () => {} );
	}

	await t.done( browser, errors );
} )().catch( ( e ) => { console.error( e ); process.exit( 1 ); } );
