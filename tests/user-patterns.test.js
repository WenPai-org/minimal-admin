/**
 * Synced patterns (wp_block) across their three surfaces:
 *
 * 1. Slash menu / ⌘/ picker — "Your patterns" entries. A SYNCED pattern
 *    inserts as a live reference (<!-- wp:block {"ref":N} /--> island, real
 *    preview via render-blocks); an UNSYNCED one inserts a detached copy of
 *    its markup as islands (the registry-pattern landing).
 * 2. Content — wp_block is allowlisted past the viewable gate as a
 *    "Patterns" entry in the type switcher; rows manage with the standard
 *    machinery, minus the front-end view/preview links (patterns are not
 *    publicly queryable).
 * 3. Editor — /minimal-admin/editor/blocks/{id} opens the markup natively with
 *    a synced-edit note and a slimmed sidebar (no featured image), plus a
 *    "+ New → Pattern" entry.
 *
 * Fixtures are suite-created over REST and deleted in finally.
 *
 * Run: MINIMAL_TEST_PASS=... node user-patterns.test.js
 */
const { BASE, launch, login, createPost, deletePost, openEditor, freshParagraph, reporter } = require( './helpers' );

const restJson = ( page, route, opts = {} ) => page.evaluate( async ( a ) => {
	const r = await fetch( window.MINIMAL.restUrl + a.route, {
		method: a.method || 'GET',
		headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
		body: a.body ? JSON.stringify( a.body ) : undefined,
	} );
	return { ok: r.ok, data: await r.json() };
}, { route, ...opts } );

( async () => {
	const t = reporter( 'user-patterns' );
	const { browser, page, errors } = await launch();
	let postId = null;
	let syncedId = null;
	let unsyncedId = null;

	try {
		await login( page );

		// Fixtures: one synced + one unsynced pattern, one target post.
		const synced = await restJson( page, 'wp/v2/blocks', { method: 'POST', body: {
			title: 'Zesty Promo Banner', status: 'publish',
			content: '<!-- wp:paragraph -->\n<p>Synced promo copy.</p>\n<!-- /wp:paragraph -->',
		} } );
		syncedId = synced.data.id;
		// Sync status WRITES ride meta; the top-level response field is read-only.
		const unsynced = await restJson( page, 'wp/v2/blocks', { method: 'POST', body: {
			title: 'Zesty Detached Footer', status: 'publish',
			content: '<!-- wp:paragraph -->\n<p>Detached footer copy.</p>\n<!-- /wp:paragraph -->',
			meta: { wp_pattern_sync_status: 'unsynced' },
		} } );
		unsyncedId = unsynced.data.id;
		t.check( 'pattern fixtures created', !! syncedId && !! unsyncedId );
		t.check( 'sync status stored', unsynced.data.wp_pattern_sync_status === 'unsynced'
			&& synced.data.wp_pattern_sync_status !== 'unsynced' );

		postId = await createPost( page, {
			title: 'User pattern insert test',
			content: '<!-- wp:paragraph -->\n<p>Host post.</p>\n<!-- /wp:paragraph -->',
		} );

		const rawContent = () => page.evaluate( async ( pid ) => {
			const r = await fetch( window.MINIMAL.restUrl + 'wp/v2/posts/' + pid + '?context=edit&_fields=content', {
				headers: { 'X-WP-Nonce': window.MINIMAL.nonce },
			} );
			return ( await r.json() ).content.raw;
		}, postId );

		/* ===== 1. Insertion ===== */
		await openEditor( page, postId );

		// Search-only entries only enter the menu on a keyup AFTER the async
		// list lands (applyQuery reads items per keyup) — so the poll must
		// jiggle the last char REPEATEDLY, not once (rule-40 gotcha, made
		// worse under load when the fetch takes seconds).
		const slashFind = async ( query, label ) => {
			await freshParagraph( page );
			await page.keyboard.type( query, { delay: 30 } );
			for ( let i = 0; i < 20; i++ ) {
				await page.waitForTimeout( 300 );
				const hit = await page.$$eval( '.minimal-slash-item', ( els, l ) =>
					els.some( ( e ) => e.textContent.includes( l ) ), label ).catch( () => false );
				if ( hit ) return true;
				if ( i % 3 === 2 ) {
					const last = query.slice( -1 );
					await page.keyboard.press( 'Backspace' );
					await page.keyboard.type( last, { delay: 30 } );
				}
			}
			return false;
		};

		// Synced: search-only slash entry → wp:block ref island.
		let found = await slashFind( '/zesty promo', 'Zesty Promo Banner' );
		t.check( 'synced pattern surfaces in the slash menu', found );
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector( '.minimal-block-island[data-block="core/block"]', { timeout: 15000 } );
		const refPreview = await page.waitForFunction( () => {
			const p = document.querySelector( '.minimal-block-island[data-block="core/block"] .minimal-island-preview' );
			return p && p.textContent.includes( 'Synced promo copy.' );
		}, null, { timeout: 15000 } ).then( () => true ).catch( () => false );
		t.check( 'ref island renders the referenced pattern', refPreview );
		t.check( 'no inspector opened for the quiet ref insert',
			await page.evaluate( () => ! document.querySelector( '.minimal-inspector' ) ) );

		// Unsynced: detached copy as islands/prose, never a ref.
		found = await slashFind( '/zesty detached', 'Zesty Detached Footer' );
		t.check( 'unsynced pattern surfaces in the slash menu', found );
		await page.keyboard.press( 'Enter' );
		const copyLanded = await page.waitForFunction( () =>
			document.querySelector( '#minimal-editor-body' ).textContent.includes( 'Detached footer copy.' ),
		null, { timeout: 15000 } ).then( () => true ).catch( () => false );
		t.check( 'unsynced pattern lands as a detached copy', copyLanded );

		// Saved markup: exactly one ref, plus the copied paragraph.
		await page.keyboard.press( 'Meta+s' );
		await page.waitForTimeout( 2500 );
		const raw = await rawContent();
		t.check( 'saved markup carries the synced REFERENCE',
			raw.includes( `<!-- wp:block {"ref":${ syncedId }} /-->` ), raw.slice( 0, 300 ) );
		t.check( 'saved markup carries the detached COPY, not a second ref',
			raw.includes( 'Detached footer copy.' ) && ! raw.includes( `"ref":${ unsyncedId }` ) );

		/* ===== 2. Content surface ===== */
		await page.goto( BASE + '/minimal-admin/content', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-table-row, .minimal-empty', { timeout: 15000 } );
		// The type control renders AFTER the types fetch lands — wait for a
		// control that could carry the Patterns entry, not just the rows.
		await page.waitForFunction( () =>
			document.querySelector( '[data-typecombo]' )
			|| [ ...document.querySelectorAll( '.minimal-tab[data-filter]' ) ].some( ( b ) => /Patterns/.test( b.textContent ) ),
		null, { timeout: 15000 } );
		// The switcher is pills (few types) or a combobox (>6 types) — handle both.
		const swapped = await page.evaluate( () => {
			const combo = document.querySelector( '[data-typecombo]' );
			if ( combo ) {
				const inp = combo.querySelector( '.minimal-ac-input' );
				if ( inp ) { inp.focus(); inp.click(); return 'combo'; }
			}
			const pill = [ ...document.querySelectorAll( '.minimal-tab[data-filter]' ) ].find( ( b ) => /Patterns/.test( b.textContent ) );
			if ( pill ) { pill.click(); return 'pill'; }
			return null;
		} );
		if ( swapped === 'combo' ) {
			await page.waitForSelector( '.minimal-ac-item[data-acv="blocks"]', { timeout: 8000 } );
			await page.click( '.minimal-ac-item[data-acv="blocks"]' );
		}
		t.check( 'Patterns entry exists in the content switcher', !! swapped, String( swapped ) );
		const rowSel = `.minimal-table-row[data-id="${ syncedId }"]`;
		await page.waitForSelector( rowSel, { timeout: 15000 } );
		t.check( 'pattern row lists under Patterns', true );
		await page.hover( rowSel );
		await page.click( `${ rowSel } .minimal-row-more` );
		await page.waitForSelector( '.minimal-row-menu', { timeout: 5000 } );
		const menu = await page.evaluate( () => ( {
			labels: [ ...document.querySelectorAll( '.minimal-row-menu button, .minimal-row-menu a' ) ].map( ( e ) => e.textContent.trim() ),
		} ) );
		t.check( 'row menu has no dead front-end view link',
			! menu.labels.some( ( l ) => /View on site|Preview draft/.test( l ) ), menu.labels.join( ' | ' ) );
		await page.keyboard.press( 'Escape' );

		/* ===== 3. Editor surface ===== */
		await page.goto( BASE + '/minimal-admin/editor/blocks/' + syncedId, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-editor-body', { timeout: 15000 } );
		await page.waitForTimeout( 800 );
		const ed = await page.evaluate( () => ( {
			note: !! document.querySelector( '.minimal-pattern-note' ),
			body: document.querySelector( '#minimal-editor-body' ).textContent,
			thumbCard: [ ...document.querySelectorAll( '.minimal-side-title' ) ].some( ( e ) => /Featured image/.test( e.textContent ) ),
			viewLink: !! document.querySelector( '.minimal-side-viewlink' ),
		} ) );
		t.check( 'editor opens the pattern markup natively', ed.body.includes( 'Synced promo copy.' ) );
		t.check( 'synced-edit note shows', ed.note );
		t.check( 'sidebar is slimmed (no featured image card)', ! ed.thumbCard );
		t.check( 'no dead front-end view link in the sidebar', ! ed.viewLink );

		// Unsynced pattern editor: no synced note.
		await page.goto( BASE + '/minimal-admin/editor/blocks/' + unsyncedId, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '#minimal-editor-body', { timeout: 15000 } );
		await page.waitForTimeout( 800 );
		t.check( 'unsynced pattern shows no synced note',
			await page.evaluate( () => ! document.querySelector( '.minimal-pattern-note' ) ) );

		// + New menu offers Pattern.
		const newBtnOk = await page.evaluate( () => {
			const btn = document.querySelector( '#minimal-new-btn' ) || [ ...document.querySelectorAll( 'button' ) ].find( ( b ) => /\+\s*New/.test( b.textContent ) );
			if ( btn ) btn.click();
			const menu = document.querySelector( '#minimal-new-menu' );
			return !! ( menu && menu.querySelector( '[data-newtype="blocks"]' ) );
		} );
		t.check( '+ New menu offers Pattern', newBtnOk );
	} finally {
		await deletePost( page, postId );
		for ( const bid of [ syncedId, unsyncedId ] ) {
			if ( bid ) {
				await page.evaluate( async ( id ) => {
					await fetch( window.MINIMAL.restUrl + 'wp/v2/blocks/' + id + '?force=true', {
						method: 'DELETE', headers: { 'X-WP-Nonce': window.MINIMAL.nonce },
					} ).catch( () => {} );
				}, bid ).catch( () => {} );
			}
		}
	}

	await t.done( browser, errors );
} )();
