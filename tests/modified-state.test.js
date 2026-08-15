/**
 * The "Modified" state — a live post carrying unsaved edits (an autosave
 * newer than the saved copy) is named in the content list: an amber dot on
 * the row's status pill and a quiet Modified toolbar filter backed by
 * ?minimal_modified=1.
 *
 * Fixtures: two published posts; one gets a REST autosave so it enters the
 * state deterministically. Both deleted on the way out.
 */
const { BASE, launch, login, createPost, deletePost, reporter } = require( './helpers' );

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'modified-state' );

	await login( page );

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

	let idA = null;
	let idB = null;
	try {
		idA = await createPost( page, { title: 'Modified state fixture A', content: '<p>v1</p>', status: 'publish' } );
		idB = await createPost( page, { title: 'Modified state fixture B', content: '<p>clean</p>', status: 'publish' } );
		t.check( 'fixture posts created', !! idA && !! idB, `${ idA } / ${ idB }` );

		// The state test is strictly-newer — never race the create second.
		await page.waitForTimeout( 1500 );
		const auto = await api( `wp/v2/posts/${ idA }/autosaves`, {
			method: 'POST',
			body: JSON.stringify( { content: '<p>v2 sitting unsaved</p>' } ),
		} );
		t.check( 'autosave created for A', auto.status === 201 || auto.status === 200, String( auto.status ) );

		const fields = await api( `wp/v2/posts?include=${ idA },${ idB }&context=edit&_fields=id,minimal_modified` );
		const byId = {};
		( fields.body || [] ).forEach( ( p ) => { byId[ p.id ] = p.minimal_modified; } );
		t.check( 'field true for the autosaved post, false for the clean one',
			byId[ idA ] === true && byId[ idB ] === false, JSON.stringify( byId ) );

		const filtered = await api( 'wp/v2/posts?minimal_modified=1&per_page=100&context=edit&_fields=id' );
		const ids = ( filtered.body || [] ).map( ( p ) => p.id );
		t.check( 'minimal_modified=1 filters to the modified post only',
			ids.includes( idA ) && ! ids.includes( idB ), JSON.stringify( ids ) );

		// The list: amber dot on A's status pill, nothing on B's.
		await page.goto( BASE + '/minimal-admin/content', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( `.minimal-table-row[data-id="${ idA }"]`, { timeout: 20000 } );
		t.check( 'Modified mark on the autosaved row',
			!! ( await page.$( `.minimal-table-row[data-id="${ idA }"] .minimal-row-modified` ) ), '' );
		t.check( 'no mark on the clean row',
			! ( await page.$( `.minimal-table-row[data-id="${ idB }"] .minimal-status.modified, .minimal-table-row[data-id="${ idB }"] .minimal-row-modified` ) ), '' );

		// The dot rides INSIDE the one status pill: the column never stacks
		// a second pill, and the pill itself carries the explanation.
		const pill = await page.evaluate( ( id ) => {
			const row = document.querySelector( `.minimal-table-row[data-id="${ id }"]` );
			const cell = row && row.querySelector( '.minimal-row-status' );
			const st = cell && cell.querySelector( '.minimal-status' );
			const dot = st && st.querySelector( '.minimal-row-modified' );
			if ( ! st || ! dot ) return { ok: false };
			const cs = getComputedStyle( dot );
			return {
				ok: true,
				pills: cell.querySelectorAll( '.minimal-status' ).length,
				title: st.getAttribute( 'title' ) || '',
				label: ( st.textContent || '' ).trim(),
				round: cs.borderTopLeftRadius,
				width: cs.width,
				sr: !! st.querySelector( '.minimal-sr-only' ),
				oneLine: Math.round( cell.getBoundingClientRect().height ) <= 30,
			};
		}, idA );
		t.check( 'dot lives inside the status pill', pill.ok && pill.pills === 1, JSON.stringify( pill ) );
		t.check( 'pill explains the state on hover', /unsaved edits/i.test( pill.title ), pill.title );
		t.check( 'pill still reads as its status', /^Published/.test( pill.label || '' ), pill.label );
		// Chrome reports the specified 50%, not a resolved px radius.
		t.check( 'mark is a 6px round dot', pill.width === '6px' && /^(50%|3px)$/.test( pill.round ),
			`${ pill.width } / ${ pill.round }` );
		t.check( 'state has an accessible name', !! pill.sr, '' );
		t.check( 'status cell stays one line', !! pill.oneLine, JSON.stringify( pill.oneLine ) );
		t.check( 'no bespoke float tip in the content list',
			! ( await page.$( '#minimal-float-tip' ) ), '' );

		// The toolbar filter: only modified rows remain.
		await page.click( '#minimal-content-modified' );
		await page.waitForFunction( ( b ) => {
			const active = document.querySelector( '#minimal-content-modified.active' );
			const busy = document.querySelector( '#minimal-view .minimal-busy' );
			return active && ! busy && ! document.querySelector( `.minimal-table-row[data-id="${ b }"]` );
		}, idB, { timeout: 20000 } );
		t.check( 'Modified filter keeps the modified post and drops the clean one',
			!! ( await page.$( `.minimal-table-row[data-id="${ idA }"]` ) ), '' );
		const allMarked = await page.evaluate( () => {
			const rows = Array.from( document.querySelectorAll( '.minimal-table-row' ) );
			return rows.length > 0 && rows.every( ( r ) => !! r.querySelector( '.minimal-row-modified' ) );
		} );
		t.check( 'every filtered row carries the mark', allMarked, '' );

		// Toggle off restores the full list.
		await page.click( '#minimal-content-modified' );
		await page.waitForSelector( `.minimal-table-row[data-id="${ idB }"]`, { timeout: 20000 } );
		t.check( 'filter off restores the clean post', true, '' );
	} finally {
		await deletePost( page, idA );
		await deletePost( page, idB );
	}

	await t.done( browser, errors );
} )();
