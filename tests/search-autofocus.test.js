/**
 * Search autofocus — fresh list navigations put the caret in the view's
 * filter/search box so typing filters immediately (v0.21.0).
 *
 * Covers: hard-load autofocus (boot path, input appears AFTER the async
 * load), SPA-nav autofocus (focus taken from the clicked nav button),
 * once-per-navigation semantics (re-renders never re-steal), and the
 * typing-elsewhere disarm (a focused text field is never robbed).
 */
const { launch, login, reporter, BASE } = require( './helpers' );

( async () => {
	const t = reporter( 'search-autofocus' );
	const { browser, page, errors } = await launch();
	await login( page );

	const focusedId = () => page.evaluate( () => document.activeElement && document.activeElement.id );

	// 1. Hard load of Extensions: the search input only exists after the
	// plugin list loads — autofocus must survive the cold-paint shell.
	await page.goto( BASE + '/minimal-admin/extensions', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#minimal-ext-search', { timeout: 15000 } );
	await page.waitForTimeout( 400 );
	t.check( 'Extensions hard load focuses the filter box', ( await focusedId() ) === 'minimal-ext-search' );

	// 2. Typing immediately filters (no click needed).
	await page.keyboard.type( 'akismet' );
	await page.waitForTimeout( 400 );
	const filtered = await page.evaluate( () => ( {
		value: document.querySelector( '#minimal-ext-search' ).value,
		focused: document.activeElement && document.activeElement.id,
	} ) );
	t.check( 'Typing lands in the box and survives the re-render', filtered.value === 'akismet' && filtered.focused === 'minimal-ext-search' );

	// 3. Once per navigation: clicking a filter pill re-renders the grid but
	// must NOT yank focus back into the search box.
	await page.evaluate( () => { document.querySelector( '#minimal-ext-search' ).value = ''; } );
	await page.evaluate( () => {
		const s = document.querySelector( '#minimal-ext-search' );
		s.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	} );
	await page.waitForTimeout( 300 );
	await page.click( '[data-xfilter="active"]' );
	await page.waitForTimeout( 500 );
	t.check( 'Filter-pill re-render does not re-steal focus', ( await focusedId() ) !== 'minimal-ext-search' );

	// 3b. Switching Extensions tabs is a navigation too: the Themes tab must
	// hand focus to the themes filter box.
	await page.click( '[data-xtab="themes"]' );
	await page.waitForSelector( '#minimal-ext-search', { timeout: 15000 } );
	await page.waitForTimeout( 600 );
	t.check( 'Themes tab switch focuses the filter box', ( await focusedId() ) === 'minimal-ext-search' );
	await page.click( '[data-xtab="plugins"]' );
	await page.waitForSelector( '#minimal-ext-search', { timeout: 15000 } );
	await page.waitForTimeout( 600 );
	t.check( 'Back to Plugins tab focuses the filter box again', ( await focusedId() ) === 'minimal-ext-search' );

	// 4. SPA navigation: click the Content nav button. Focus sits on the
	// button at render time and must still hand off to the content search.
	await page.click( '.minimal-nav-btn[data-nav="content"]' );
	await page.waitForSelector( '#minimal-content-search', { timeout: 15000 } );
	await page.waitForTimeout( 600 );
	t.check( 'SPA nav to Content focuses its search box', ( await focusedId() ) === 'minimal-content-search' );

	// 5. SPA nav to Media covers a second list view generically.
	await page.click( '.minimal-nav-btn[data-nav="media"]' );
	await page.waitForSelector( '#minimal-media-search', { timeout: 15000 } );
	// Media's box is disabled until its list loads, so the caret arrives on
	// the post-load render rather than within a fixed slice of time. A flat
	// wait here just raced the load.
	const landed = await page.waitForFunction(
		() => document.activeElement && document.activeElement.id === 'minimal-media-search',
		null, { timeout: 15000 }
	).then( () => true ).catch( () => false );
	t.check( 'SPA nav to Media focuses its search box', landed, await focusedId() );

	// And it has to STAY: finishing the load re-renders the toolbar, which
	// destroyed the focused input and dropped the caret on <body>, so the
	// next keystroke went nowhere.
	await page.waitForTimeout( 3000 );
	t.check( 'the caret survives the post-load re-render', ( await focusedId() ) === 'minimal-media-search', await focusedId() );

	// 6. Typing-elsewhere disarm: navigate via JS with a text field already
	// focused — the armed autofocus must back off and never rob the caret.
	await page.evaluate( () => {
		const probe = document.createElement( 'input' );
		probe.id = 'minimal-test-probe';
		document.body.appendChild( probe );
	} );
	await page.focus( '#minimal-test-probe' );
	await page.evaluate( () => {
		history.pushState( null, '', '/minimal-admin/extensions' );
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
	} );
	await page.waitForSelector( '#minimal-ext-search', { timeout: 15000 } );
	await page.waitForTimeout( 600 );
	t.check( 'A focused text field is never robbed', ( await focusedId() ) === 'minimal-test-probe' );
	await page.evaluate( () => document.querySelector( '#minimal-test-probe' ).remove() );

	await t.done( browser, errors );
} )().catch( ( e ) => { console.error( e ); process.exit( 1 ); } );
