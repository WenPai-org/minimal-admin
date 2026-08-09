/**
 * The "Modified" state — a live post carrying unsaved edits (an autosave
 * newer than the saved copy) is named in the content list: an amber chip on
 * the row and a quiet Modified toolbar filter backed by ?minimal_modified=1.
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

		// The list: chip on A's row, nothing on B's.
		await page.goto( BASE + '/minimal-admin/content', { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( `.minimal-table-row[data-id="${ idA }"]`, { timeout: 20000 } );
		t.check( 'Modified chip on the autosaved row',
			!! ( await page.$( `.minimal-table-row[data-id="${ idA }"] .minimal-status.modified` ) ), '' );
		t.check( 'no chip on the clean row',
			! ( await page.$( `.minimal-table-row[data-id="${ idB }"] .minimal-status.modified` ) ), '' );

		// The toolbar filter: only modified rows remain.
		await page.click( '#minimal-content-modified' );
		await page.waitForFunction( ( b ) => {
			const active = document.querySelector( '#minimal-content-modified.active' );
			const busy = document.querySelector( '#minimal-view .minimal-busy' );
			return active && ! busy && ! document.querySelector( `.minimal-table-row[data-id="${ b }"]` );
		}, idB, { timeout: 20000 } );
		t.check( 'Modified filter keeps the modified post and drops the clean one',
			!! ( await page.$( `.minimal-table-row[data-id="${ idA }"]` ) ), '' );
		const allChipped = await page.evaluate( () => {
			const rows = Array.from( document.querySelectorAll( '.minimal-table-row' ) );
			return rows.length > 0 && rows.every( ( r ) => !! r.querySelector( '.minimal-status.modified' ) );
		} );
		t.check( 'every filtered row carries the chip', allChipped, '' );

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
