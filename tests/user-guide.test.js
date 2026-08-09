/**
 * In-app user guide — the bundled docs/user-guide.md served by
 * minimal-admin/v1/guide and rendered in a modal (escape-first guideHtml with
 * paragraphs, ordered lists, italics and the shortcuts table). Two doors:
 * the About dialog's "User guide" button and the ⌘K palette command.
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'user-guide' );

	await login( page );
	await page.goto( BASE + '/minimal-admin/overview', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '.minimal-nav-btn', { timeout: 15000 } );

	// REST endpoint serves the bundled file with the plugin version.
	const rest = await page.evaluate( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/guide', {
			credentials: 'same-origin', headers: { 'X-WP-Nonce': window.MINIMAL.nonce },
		} );
		return r.ok ? r.json() : { markdown: '' };
	} );
	t.check( 'Guide endpoint serves the bundled markdown', /# Using Minimal Admin/.test( rest.markdown ) );
	t.check( 'Guide endpoint reports the plugin version', !! rest.version );

	// Door 1: the About dialog's User guide button.
	await page.click( '#minimal-help-btn' );
	await page.waitForSelector( '#minimal-help-guide', { timeout: 10000 } );
	await page.click( '#minimal-help-guide' );
	await page.waitForSelector( '.minimal-guide h3', { timeout: 15000 } );

	const modal = await page.evaluate( () => {
		const el = document.querySelector( '.minimal-guide' );
		const title = document.querySelector( '.minimal-modal-title' );
		return {
			title: title ? title.textContent : '',
			headings: [ ...el.querySelectorAll( 'h3' ) ].map( ( h ) => h.textContent ),
			hasTable: !! el.querySelector( 'table th' ),
			tableHasCmdK: /⌘K/.test( ( el.querySelector( 'table' ) || {} ).textContent || '' ),
			hasOl: !! el.querySelector( 'ol li' ),
			hasItalic: !! el.querySelector( 'i' ),
			// The escape-first renderer must never leak raw markdown tokens.
			leaks: /\*\*|\]\(/.test( el.textContent ),
		};
	} );
	t.check( 'Modal title names the guide and version', /User guide · v\d/.test( modal.title ) );
	t.check( 'Section headings render', modal.headings.some( ( h ) => /Getting around/.test( h ) ) && modal.headings.some( ( h ) => /Safety/.test( h ) ) );
	t.check( 'Shortcuts table renders with ⌘K', modal.hasTable && modal.tableHasCmdK );
	t.check( 'Ordered list and italics render', modal.hasOl && modal.hasItalic );
	t.check( 'No raw markdown tokens leak', ! modal.leaks );

	await page.keyboard.press( 'Escape' );
	await page.waitForTimeout( 400 );

	// Door 2: the ⌘K palette command (contiguous-substring filter).
	await page.keyboard.press( 'Meta+k' );
	await page.waitForSelector( '.minimal-palette input, .minimal-cmdk input, [id*="palette"] input', { timeout: 10000 } );
	await page.keyboard.type( 'user guide', { delay: 30 } );
	await page.waitForTimeout( 500 );
	await page.keyboard.press( 'Enter' );
	await page.waitForSelector( '.minimal-guide h3', { timeout: 15000 } );
	t.check( 'Palette command opens the guide', await page.evaluate(
		() => !! document.querySelector( '.minimal-guide h3' )
	) );

	await page.keyboard.press( 'Escape' );
	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
