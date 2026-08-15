/**
 * Database health checks ( /minimal-admin/database → Health ) — read-only.
 *
 * Covers: the Tables|Health switch, checks rendering with severities, the
 * copy-command remedy (Minimal never runs cleanup itself), the drill-through
 * from a check to its table, and Author gating on the route.
 *
 * Deliberately does NOT assert specific severities: this runs against a live
 * dev site whose orphan counts and indexes change as other suites and ordinary
 * use touch it. It asserts SHAPE (checks present, severities valid, commands
 * copyable), which is what the feature promises.
 *
 * Run: MINIMAL_TEST_PASS=… node db-health.test.js
 */
const { BASE, launch, login, reporter } = require( './helpers' );

( async () => {
	const t = reporter( 'db-health' );
	const { browser, page, errors } = await launch();
	await login( page );

	// --- Entry -------------------------------------------------------------
	await page.goto( BASE + '/minimal-admin/database', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '[data-dbview="health"]', { timeout: 30000 } );
	t.check( 'Table list offers a Health view', await page.$( '[data-dbview="health"]' ) !== null );
	t.check( 'Tables is the default view', await page.$( '[data-dbtable]' ) !== null );

	await page.click( '[data-dbview="health"]' );
	await page.waitForSelector( '.minimal-db-hc', { timeout: 30000 } );

	// --- Checks render -----------------------------------------------------
	const rows = await page.$$eval( '.minimal-db-hc', ( r ) => r.length );
	t.check( 'Health renders a set of checks', rows >= 6, rows + ' checks' );

	const sevs = await page.$$eval( '.minimal-db-hc-sev', ( els ) =>
		els.map( ( e ) => [ 'warn', 'ok', 'info' ].find( ( s ) => e.classList.contains( s ) ) || 'none' ) );
	t.check( 'Every check carries a valid severity', sevs.length === rows && ! sevs.includes( 'none' ),
		sevs.join( ',' ) );

	// Warn rows sort ahead of ok rows.
	const firstOk = sevs.indexOf( 'ok' );
	const lastWarn = sevs.lastIndexOf( 'warn' );
	t.check( 'Warnings sort above healthy checks', firstOk === -1 || lastWarn === -1 || lastWarn < firstOk );

	const bodyText = await page.textContent( '#minimal-view' );
	t.check( 'Core storage checks are present',
		bodyText.includes( 'Orphaned post meta' ) && bodyText.includes( 'Storage engine' ) );
	t.check( 'Health keeps the read-only claim', bodyText.includes( 'Read-only by design' ) );
	t.check( 'Summary line reports the state',
		/checks? needs? attention|Everything looks healthy/.test( bodyText ) );

	// --- Remedies are copy-only -------------------------------------------
	const cmdBtns = await page.$$( '[data-dbcmd]' );
	t.check( 'At least one check offers a command', cmdBtns.length > 0, cmdBtns.length + ' commands' );
	const cmdText = await page.$eval( '[data-dbcmd]', ( b ) => b.dataset.dbcmd );
	t.check( 'Commands are WP-CLI, not in-app writes', /^wp /.test( cmdText ), cmdText.slice( 0, 60 ) );

	// No write control anywhere in the view: the remedy is always copy.
	const writeish = await page.$$eval( '#minimal-view button', ( b ) =>
		b.map( ( x ) => x.textContent.trim().toLowerCase() )
			.filter( ( x ) => /^(run|apply|fix|clean now|delete now|optimise now|optimize now)$/.test( x ) ) );
	t.check( 'No in-app fix buttons', writeish.length === 0, writeish.join( ',' ) );

	await cmdBtns[ 0 ].click();
	await page.waitForSelector( '.minimal-toast', { timeout: 10000 } );
	t.check( 'Copying a command confirms', ( await page.textContent( '.minimal-toast' ) ).includes( 'copied' ) );

	// --- Drill-through to the table ---------------------------------------
	const goBtn = await page.$( '[data-dbgo]' );
	t.check( 'A check links to its table', goBtn !== null );
	const goTable = await goBtn.evaluate( ( b ) => b.dataset.dbgo );
	await goBtn.click();
	await page.waitForSelector( '.minimal-db-tname', { timeout: 30000 } );
	t.check( 'Drill-through opens that table', ( await page.textContent( '.minimal-db-tname' ) ) === goTable,
		'expected ' + goTable );
	await page.click( '#minimal-db-back' );
	await page.waitForSelector( '[data-dbtable]', { timeout: 20000 } );
	t.check( 'Back from a drill-through lands on the table list', await page.$( '[data-dbtable]' ) !== null );

	// --- System page doorway ----------------------------------------------
	// The System health strip carries a summary row that jumps straight here.
	await page.goto( BASE + '/minimal-admin/system', { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '.minimal-sys-check', { timeout: 30000 } );
	const hygiene = await page.$( '[data-sysgoto="dbhealth"]' );
	t.check( 'System shows a Database hygiene row', hygiene !== null );
	await hygiene.click();
	await page.waitForSelector( '.minimal-db-hc', { timeout: 30000 } );
	t.check( 'System row opens the Health view', await page.$( '.minimal-db-hc' ) !== null );

	// --- Author gating -----------------------------------------------------
	const actx = await browser.newContext( { ignoreHTTPSErrors: true } );
	const apage = await actx.newPage();
	await apage.goto( BASE + '/wp-login.php', { waitUntil: 'domcontentloaded' } );
	await apage.fill( '#user_login', 'minimal-author' );
	await apage.fill( '#user_pass', 'minimal-author-pass-1' );
	await Promise.all( [
		apage.waitForNavigation( { waitUntil: 'domcontentloaded' } ),
		apage.click( '#wp-submit' ),
	] );
	await apage.goto( BASE + '/minimal-admin/overview', { waitUntil: 'domcontentloaded' } );
	await apage.waitForFunction( () => window.MINIMAL && window.MINIMAL.nonce, null, { timeout: 20000 } );
	const status = await apage.evaluate( async () => {
		const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/db/health', {
			headers: { 'X-WP-Nonce': window.MINIMAL.nonce },
		} );
		return r.status;
	} );
	t.check( 'REST refuses an Author on health (403)', status === 403, 'got ' + status );
	await actx.close();

	await t.done( browser, errors );
} )().catch( ( e ) => {
	console.error( e );
	process.exit( 1 );
} );
