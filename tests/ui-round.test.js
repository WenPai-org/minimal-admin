/**
 * Shell/overview round: clickable version badge → changelog modal (markdown
 * rendered client-side), clickable overview stat cards, entity-decoded
 * activity feed with (no title) fallback, the global nav show/hide tab, and
 * the profile modal's role combobox (verified against the SAVED role).
 */
const { BASE, launch, login, createPost, deletePost, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'ui-round' );
	await login( page );

	/* ===== Fixtures the activity feed will lead with ===== */
	const entPost = await createPost( page, { title: 'Entity probe: Let&#8217;s go for it', content: '<p>x</p>', status: 'draft' } );
	const blankPost = await createPost( page, { title: '', content: '<p>y</p>', status: 'draft' } );

	await page.goto( `${ BASE }/minimal-admin/`, { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '.minimal-activity-row', { timeout: 15000 } );

	/* ===== Activity feed reads like prose ===== */
	const feed = await page.$$eval( '.minimal-activity-text', ( els ) => els.map( ( e ) => e.textContent ).join( ' | ' ) );
	t.check( 'entities decode in the activity feed', feed.includes( 'Let’s go for it' ) && ! feed.includes( '#8217' ), feed.slice( 0, 120 ) );
	t.check( 'untitled drafts read (no title), never empty quotes', feed.includes( '(no title)' ) && ! feed.includes( '““' ) && ! feed.includes( '“”' ), '' );

	/* ===== Stat cards navigate ===== */
	const statCards = await page.$$eval( '.minimal-stat.clickable', ( els ) => els.map( ( e ) => e.dataset.goto ) );
	t.check( 'stat cards are clickable doors', statCards.length >= 3, JSON.stringify( statCards ) );
	await page.click( '.minimal-stat[data-goto="content:posts"]' );
	await page.waitForSelector( '.minimal-content-cols.minimal-table-row', { timeout: 15000 } );
	// ≤6 types → pill tabs with .active; more types (common on this fixture site)
	// collapse the type filter to a combobox whose seed/placeholder is "Posts".
	const typeLabel = await page.evaluate( () => {
		const tab = document.querySelector( '.minimal-tab.active[data-filter]' );
		if ( tab ) return tab.textContent.trim();
		const combo = document.querySelector( '[data-typecombo] .minimal-ac-input' );
		if ( ! combo ) return '';
		return ( combo.dataset.acValueLabel || combo.placeholder || combo.value || '' ).trim();
	} );
	t.check( 'Published posts card lands on the Posts tab', typeLabel === 'Posts', typeLabel );

	/* ===== Header brand: site icon (or m fallback) + site name ===== */
	// The mark is the WordPress Site Icon when set, else the gradient "m"
	// tile; the wordmark is the site name (falls back to "minimal" if unnamed).
	const brand = await page.evaluate( () => {
		const mark = document.querySelector( '.minimal-logo-mark' );
		return {
			markText: mark.textContent,
			isIcon: mark.classList.contains( 'minimal-logo-mark-icon' ),
			bg: getComputedStyle( mark ).backgroundImage,
			name: document.querySelector( '.minimal-logo-name' ).textContent,
			bootName: window.MINIMAL.site.name,
			bootIcon: window.MINIMAL.site.icon,
			// GH #5: the badge moved to the topbar actions so it can't truncate
			// the site name; assert it left the logo row AND renders up top.
			verInLogo: !! document.querySelector( '.minimal-logo #minimal-ver-btn, .minimal-logo-ver' ),
			verShown: !! document.querySelector( '.minimal-topbar-ver' ) && document.querySelector( '.minimal-topbar-ver' ).offsetWidth > 0,
		};
	} );
	const markOk = brand.bootIcon
		? ( brand.isIcon && brand.bg.includes( 'url(' ) )     // site-icon variant
		: brand.markText === 'm';                              // gradient m fallback
	t.check( 'header shows the site-icon-or-m mark + site name; version in the topbar',
		markOk && brand.name === ( brand.bootName || 'minimal' ) && brand.verShown && ! brand.verInLogo, JSON.stringify( brand ) );

	/* ===== Version badge → changelog modal (sectioned: rail + one release) ===== */
	await page.click( '#minimal-ver-btn' );
	await page.waitForSelector( '.minimal-changelog h3', { timeout: 10000 } );
	const log = await page.evaluate( () => ( {
		title: document.querySelector( '.minimal-modal-title' ).textContent,
		rail: document.querySelectorAll( '.minimal-cl-ver' ).length,
		heads: document.querySelectorAll( '.minimal-changelog h3' ).length,
		bullets: document.querySelectorAll( '.minimal-changelog li' ).length,
		// "**v…" would mean the version headings failed to render; a bare
		// "##" can legitimately appear inside code spans, so don't match it.
		raw: /\*\*v\d/.test( document.querySelector( '.minimal-changelog' ).textContent ),
	} ) );
	t.check( 'changelog modal renders the version rail + one release, no raw markdown',
		/What's new/.test( log.title ) && log.rail >= 3 && log.heads === 1 && log.bullets > 3 && ! log.raw, JSON.stringify( log ) );
	await page.keyboard.press( 'Escape' );
	await page.waitForTimeout( 300 );

	/* ===== Global nav tab ===== */
	t.check( 'nav tab exists at the left edge', !! ( await page.$( '#minimal-nav-tab' ) ), '' );
	await page.click( '#minimal-nav-tab' );
	await page.waitForTimeout( 400 );
	const navHidden = await page.evaluate( () => ( {
		cls: document.body.classList.contains( 'minimal-nav-hidden' ),
		w: document.querySelector( '.minimal-sidebar' ).offsetWidth,
	} ) );
	t.check( 'nav tab hides the sidebar', navHidden.cls && navHidden.w < 10, JSON.stringify( navHidden ) );
	await page.reload( { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-nav-tab', { timeout: 15000 } );
	t.check( 'hidden nav persists across reloads', await page.evaluate( () => document.body.classList.contains( 'minimal-nav-hidden' ) ), '' );
	await page.click( '#minimal-nav-tab' );
	await page.waitForTimeout( 400 );
	t.check( 'nav tab restores the sidebar', await page.evaluate( () => ! document.body.classList.contains( 'minimal-nav-hidden' ) && document.querySelector( '.minimal-sidebar' ).offsetWidth > 100 ), '' );

	/* ===== Role combobox on the user edit page (real save round-trip) ===== */
	await page.goto( `${ BASE }/minimal-admin/users`, { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '.minimal-user-cols.minimal-table-row', { timeout: 15000 } );
	await page.locator( '.minimal-user-cols.minimal-table-row', { hasText: 'minimal-editor' } ).first().click();
	await page.waitForSelector( '#minimal-ue-role', { timeout: 10000 } );
	t.check( 'role field is the strict combobox showing the label', await page.$eval( '#minimal-ue-role', ( i ) => i.classList.contains( 'minimal-ac-input' ) && i.value === 'Editor' ), '' );
	await page.click( '#minimal-ue-role' );
	await page.keyboard.type( 'auth' );
	await page.waitForTimeout( 250 );
	await page.keyboard.press( 'Enter' );
	await page.click( '[data-ue-save]' );
	await page.waitForTimeout( 1800 );
	const savedRole = await page.evaluate( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/users?context=edit&search=minimal-editor&_fields=id,roles', { headers: { 'X-WP-Nonce': window.MINIMAL.nonce } } );
		return ( await r.json() )[ 0 ];
	} );
	t.check( 'picked role persists over REST', savedRole && savedRole.roles.join() === 'author', JSON.stringify( savedRole ) );
	// Revert the fixture account.
	await page.evaluate( async ( uid ) => {
		await fetch( window.MINIMAL.restUrl + 'wp/v2/users/' + uid, {
			method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
			body: JSON.stringify( { roles: [ 'editor' ] } ),
		} );
	}, savedRole.id );

	await deletePost( page, entPost );
	await deletePost( page, blankPost );
	await t.done( browser, errors );
} )().catch( ( e ) => { console.error( e ); process.exit( 1 ); } );
