/**
 * Plugin name cleanup — collision-aware display names. Add-on families
 * ("Admin Columns Pro - Gravity Forms add-on") put the identity AFTER the
 * separator, so the one-segment tagline cut collapsed the whole family to
 * the brand. When two installed plugins clean to the same name, both keep a
 * second segment; non-colliding names keep the aggressive tagline strip.
 *
 * Fixtures are disposable header-only plugins written straight into
 * wp-content/plugins (path resolved relative to this file, never hardcoded)
 * and removed in finally. They stay inactive the whole run.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { BASE, launch, login, reporter } = require( './helpers' );

const PLUGINS_DIR = path.resolve( __dirname, '..', '..' );
const FIXTURES = [
	[ 'minimal-fix-collide-base', 'Acme Suite Pro' ],
	[ 'minimal-fix-collide-a', 'Acme Suite Pro - Alpha Add-on' ],
	[ 'minimal-fix-collide-b', 'Acme Suite Pro - Beta Add-on (Extra)' ],
	[ 'minimal-fix-solo', 'Acme Solo: Best Tagline Ever' ],
];

function writeFixtures() {
	FIXTURES.forEach( ( [ slug, name ] ) => {
		const dir = path.join( PLUGINS_DIR, slug );
		fs.mkdirSync( dir, { recursive: true } );
		fs.writeFileSync( path.join( dir, slug + '.php' ), `<?php\n/**\n * Plugin Name: ${ name }\n * Description: Disposable name-cleanup fixture for the Minimal suite.\n * Version: 1.0\n */\n` );
	} );
}

function removeFixtures() {
	FIXTURES.forEach( ( [ slug ] ) => {
		fs.rmSync( path.join( PLUGINS_DIR, slug ), { recursive: true, force: true } );
	} );
}

( async () => {
	const { browser, page, errors } = await launch();
	const t = reporter( 'plugin-names' );
	writeFixtures();
	try {
		await login( page );

		await page.goto( `${ BASE }/minimal-admin/extensions`, { waitUntil: 'domcontentloaded' } );
		await page.waitForSelector( '.minimal-plugin', { timeout: 15000 } );

		const cardName = ( file ) => page.evaluate( ( f ) => {
			const card = document.querySelector( `.minimal-plugin[data-plugin="${ f }"]` );
			return card ? card.querySelector( '.minimal-plugin-name' ).textContent.trim() : null;
		}, file );

		t.check( 'colliding add-on keeps its second segment',
			await cardName( 'minimal-fix-collide-a/minimal-fix-collide-a' ) === 'Acme Suite Pro – Alpha Add-on',
			String( await cardName( 'minimal-fix-collide-a/minimal-fix-collide-a' ) ) );
		t.check( 'second segment still drops the parenthetical',
			await cardName( 'minimal-fix-collide-b/minimal-fix-collide-b' ) === 'Acme Suite Pro – Beta Add-on',
			String( await cardName( 'minimal-fix-collide-b/minimal-fix-collide-b' ) ) );
		t.check( 'the base plugin keeps its short brand name',
			await cardName( 'minimal-fix-collide-base/minimal-fix-collide-base' ) === 'Acme Suite Pro',
			String( await cardName( 'minimal-fix-collide-base/minimal-fix-collide-base' ) ) );
		t.check( 'non-colliding names still strip the tagline',
			await cardName( 'minimal-fix-solo/minimal-fix-solo' ) === 'Acme Solo',
			String( await cardName( 'minimal-fix-solo/minimal-fix-solo' ) ) );

		// The disambiguated name is what search matches against.
		await page.type( '#minimal-ext-search', 'beta add-on' );
		await page.waitForFunction( () => {
			const cards = document.querySelectorAll( '.minimal-plugin' );
			return cards.length === 1 && cards[ 0 ].dataset.plugin === 'minimal-fix-collide-b/minimal-fix-collide-b';
		}, null, { timeout: 5000 } );
		t.check( 'search finds the add-on by its disambiguated suffix', true, '' );

		await t.done( browser, errors );
	} finally {
		removeFixtures();
	}
} )().catch( ( e ) => {
	console.error( e );
	removeFixtures();
	process.exit( 1 );
} );
