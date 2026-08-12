/**
 * Multisite (network) coverage — runs against a Cove subdomain-multisite lab,
 * NOT the single-site minimaladmin dev site, so it stands apart from the shared
 * harness (which assumes one site + one admin). SKIPs cleanly (exit 0) when the
 * lab is unreachable, the way the CDN-dependent design suites do — the lab is a
 * disposable fixture (`cove add minimalms --multisite=subdomain`), not a standing
 * dependency.
 *
 * What it pins (the v0.28.0 multisite contract):
 *   - /minimal-admin/ boots on the main site AND a subsite created before the
 *     plugin was network-activated (the rewrite self-heal).
 *   - The whole role matrix renders with ZERO console/page errors.
 *   - A network-activated plugin shows as "Network active" with no switch.
 *   - A subsite admin sees the whole site's user list (not a one-row "list"),
 *     can add an existing network account and remove a member, and gets no
 *     role/removal controls against a network administrator's row.
 *   - The System Debug card (network-shared logs) is super-admin only.
 *   - A user with no role on a site is denied that site's Minimal entirely.
 *
 * Env overrides (defaults match the documented lab):
 *   MINIMAL_MS_URL         https://minimalms.localhost
 *   MINIMAL_MS_STORE       https://store.minimalms.localhost   (WooCommerce subsite)
 *   MINIMAL_MS_BLOG        https://blog.minimalms.localhost     (pre-activation subsite)
 *   MINIMAL_MS_SUPER_USER  admin
 *   MINIMAL_MS_SUPER_PASS  (required to run; else SKIP)
 */
const { chromium } = require( 'playwright-core' );

const MAIN  = process.env.MINIMAL_MS_URL   || 'https://minimalms.localhost';
const STORE = process.env.MINIMAL_MS_STORE || 'https://store.minimalms.localhost';
const BLOG  = process.env.MINIMAL_MS_BLOG  || 'https://blog.minimalms.localhost';
const SUPER_USER = process.env.MINIMAL_MS_SUPER_USER || 'admin';
const SUPER_PASS = process.env.MINIMAL_MS_SUPER_PASS || '';
const CHROME = process.env.MINIMAL_TEST_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Subsite role accounts seeded by the lab (see project_minimal_multisite_lab).
const SUBSITE_ADMIN = { user: 'minimalsiteadmin', pass: 'minimalms-siteadmin-pass-1' };
const BLOG_EDITOR   = { user: 'minimaleditor', pass: 'minimalms-editor-pass-1' };

const results = [];
function check( label, ok, detail = '' ) {
	results.push( ok );
	console.log( `${ ok ? 'PASS' : 'FAIL' }  ${ label }${ detail ? ' — ' + detail : '' }` );
}

async function reachable( url ) {
	try {
		const r = await fetch( url, { method: 'GET' } );
		return r.status > 0;
	} catch ( e ) {
		return false;
	}
}

async function ctxFor( browser ) {
	const ctx = await browser.newContext( { ignoreHTTPSErrors: true } );
	const page = await ctx.newPage();
	const errors = [];
	page.on( 'pageerror', ( e ) => errors.push( 'pageerror: ' + e.message ) );
	page.on( 'console', ( m ) => {
		if ( m.type() === 'error' && ! /Failed to load resource/.test( m.text() ) ) {
			errors.push( 'console: ' + m.text().slice( 0, 160 ) );
		}
	} );
	return { ctx, page, errors };
}

async function loginApp( page, site, user, pass ) {
	const dest = site + '/minimal-admin/overview';
	await page.goto( site + '/wp-login.php?redirect_to=' + encodeURIComponent( dest ), { waitUntil: 'domcontentloaded' } );
	await page.fill( '#user_login', user );
	await page.fill( '#user_pass', pass );
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'domcontentloaded', timeout: 60000 } ),
		page.click( '#wp-submit' ),
	] );
}

async function gotoRoute( page, site, route ) {
	await page.goto( site + '/minimal-admin/' + route, { waitUntil: 'domcontentloaded' } );
	await page.waitForFunction( () => window.MINIMAL && window.MINIMAL.nonce, null, { timeout: 20000 } ).catch( () => {} );
	await page.waitForTimeout( 2500 );
}

( async () => {
	if ( ! SUPER_PASS ) {
		console.log( 'SKIP multisite: set MINIMAL_MS_SUPER_PASS (super-admin password for the lab).' );
		process.exit( 0 );
	}
	if ( ! ( await reachable( MAIN + '/minimal-admin/' ) ) ) {
		console.log( `SKIP multisite: lab ${ MAIN } unreachable (cove add minimalms --multisite=subdomain to create it).` );
		process.exit( 0 );
	}

	const browser = await chromium.launch( {
		executablePath: CHROME,
		args: [ '--ignore-certificate-errors', '--disable-http2', '--disable-features=MacAppCodeSignClone' ],
	} );
	const allErrors = [];

	try {
		// 1) Super admin on the MAIN site: app boots, multisite flag set.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'overview' );
			const boot = await page.evaluate( () => ( {
				booted: !! window.MINIMAL,
				multisite: !! ( window.MINIMAL && window.MINIMAL.multisite ),
				networkUrl: !! ( window.MINIMAL && window.MINIMAL.site && window.MINIMAL.site.networkAdminUrl ),
			} ) );
			check( 'super admin boots Minimal on the main site', boot.booted );
			check( 'boot payload carries the multisite flag', boot.multisite );
			check( 'super admin gets a Network Admin link-out', boot.networkUrl );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 2) The rewrite self-heal: a subsite that existed before network
		//    activation still boots at /minimal-admin/ (route present, no 404).
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, BLOG, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, BLOG, 'overview' );
			const booted = await page.evaluate( () => !! window.MINIMAL );
			check( 'pre-activation subsite serves /minimal-admin/ (rewrite healed)', booted );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 3) Subsite admin on the STORE subsite: full degraded walk, no errors.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, STORE, SUBSITE_ADMIN.user, SUBSITE_ADMIN.pass );
			await gotoRoute( page, STORE, 'overview' );
			const boot = await page.evaluate( () => ( {
				booted: !! window.MINIMAL,
				caps: window.MINIMAL ? window.MINIMAL.caps : {},
			} ) );
			check( 'subsite admin boots Minimal', boot.booted );
			check( 'subsite admin lacks network-only caps (install/core/editCss)',
				boot.booted && ! boot.caps.install && ! boot.caps.core && ! boot.caps.editCss );

			// Extensions: network-activated plugin reads as locked-active.
			await gotoRoute( page, STORE, 'extensions' );
			const ext = await page.evaluate( () => {
				const cards = [ ...document.querySelectorAll( '.minimal-plugin' ) ].map( ( c ) => ( {
					name: c.querySelector( '.minimal-plugin-name' )?.textContent.trim(),
					label: c.querySelector( '.minimal-state-label' )?.textContent.trim(),
					hasSwitch: !! c.querySelector( '.minimal-switch' ),
				} ) );
				const minimal = cards.find( ( c ) => /Minimal Admin/.test( c.name || '' ) );
				return { minimal };
			} );
			check( 'network-activated Minimal shows a "Network active" label', ext.minimal && ext.minimal.label === 'Network active', JSON.stringify( ext.minimal ) );
			check( 'network-activated Minimal has no toggle switch', ext.minimal && ! ext.minimal.hasSwitch );

			// System: the Debug card (network-shared logs) is hidden.
			await gotoRoute( page, STORE, 'system' );
			const sys = await page.evaluate( () => ( {
				debugCard: !! document.querySelector( '#minimal-sys-debug' ),
				logRows: document.querySelectorAll( '.minimal-sys-logrow' ).length,
			} ) );
			check( 'subsite admin sees no Debug card (network-shared logs)', ! sys.debugCard && sys.logRows === 0 );

			allErrors.push( ...errors );
			await ctx.close();
		}

		// 4) Users flow as the subsite admin: full list, add-existing, remove,
		//    super-admin row is off limits.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, STORE, SUBSITE_ADMIN.user, SUBSITE_ADMIN.pass );
			await gotoRoute( page, STORE, 'users' );
			await page.waitForSelector( '[data-user]', { timeout: 15000 } );

			const rows0 = await page.evaluate( () => [ ...document.querySelectorAll( '[data-user]' ) ].length );
			check( 'subsite admin sees the whole site user list (not one row)', rows0 >= 2, `${ rows0 } rows` );
			check( 'Add existing user control is present', !! ( await page.$( '#minimal-add-existing-user' ) ) );

			// Add BLOG_EDITOR (a network account with no role on store) by email.
			await page.click( '#minimal-add-existing-user' );
			await page.waitForSelector( '#minimal-uae-who' );
			await page.fill( '#minimal-uae-who', 'editor@minimalms.localhost' );
			await page.click( '#minimal-uae-add' );
			await page.waitForTimeout( 2500 );
			const rows1 = await page.evaluate( () => [ ...document.querySelectorAll( '[data-user]' ) ].map( ( r ) => r.dataset.uname ) );
			check( 'adding an existing account attaches it to the site', rows1.includes( BLOG_EDITOR.user ), rows1.join( ',' ) );

			// Row menu on a normal user offers role + remove; the super-admin
			// row offers neither (only Copy email).
			const menuFor = async ( name ) => {
				await page.reload( { waitUntil: 'domcontentloaded' } );
				await page.waitForSelector( '[data-user]' );
				await page.waitForTimeout( 1000 );
				const box = await page.evaluate( ( n ) => {
					const r = [ ...document.querySelectorAll( '[data-user]' ) ].find( ( x ) => x.dataset.uname === n );
					if ( ! r ) return null;
					const b = r.getBoundingClientRect();
					return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
				}, name );
				if ( ! box ) return [];
				await page.mouse.click( box.x, box.y, { button: 'right' } );
				await page.waitForTimeout( 500 );
				return page.evaluate( () => [ ...document.querySelectorAll( '.minimal-new-menu button, .minimal-menu button, [class*="minimal"][class*="menu"] button' ) ]
					.map( ( b ) => b.textContent.trim() ).filter( ( t ) => t && t.length < 45 ) );
			};
			const normalMenu = await menuFor( BLOG_EDITOR.user );
			check( 'normal user row offers a role change', normalMenu.some( ( e ) => /Editor|Author|Administrator/.test( e ) ), normalMenu.join( ' | ' ) );
			check( 'normal user row offers Remove from this site', normalMenu.some( ( e ) => /Remove from this site/.test( e ) ) );

			const superMenu = await menuFor( SUPER_USER );
			check( 'network-admin row offers NO role controls', ! superMenu.some( ( e ) => /^(Editor|Author|Administrator|Contributor|Subscriber)/.test( e ) ), superMenu.join( ' | ' ) );
			check( 'network-admin row offers NO Remove', ! superMenu.some( ( e ) => /Remove from this site/.test( e ) ) );

			// Clean up: remove the account we added, back to lab baseline.
			await page.evaluate( async ( name ) => {
				const row = [ ...document.querySelectorAll( '[data-user]' ) ].find( ( x ) => x.dataset.uname === name );
				if ( ! row ) return;
				await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/users/' + row.dataset.user + '/remove', {
					method: 'POST', headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
				} ).catch( () => {} );
			}, BLOG_EDITOR.user );

			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5) Site switcher: the compact menu carries an autofocused inline
		//    finder, keeps its result set short, and a REAL click navigates.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'overview' );

			const boot = await page.evaluate( () => ( {
				sites: ( window.MINIMAL.sites || [] ).map( ( s ) => s.name ),
				current: ( window.MINIMAL.sites || [] ).filter( ( s ) => s.current ).length,
				hasBtn: !! document.querySelector( '#minimal-site-switch' ),
			} ) );
			check( 'switcher lists more than one site', boot.sites.length > 1, boot.sites.join( ', ' ) );
			check( 'exactly one site is marked current', boot.current === 1 );
			check( 'switcher control renders in the sidebar', boot.hasBtn );

			// Open with a real mouse click — a synthetic .click() would pass
			// even on an unhittable control.
			const btnBox = await page.evaluate( () => {
				const r = document.querySelector( '#minimal-site-switch' ).getBoundingClientRect();
				return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
			} );
			await page.mouse.click( btnBox.x, btnBox.y );
			await page.waitForTimeout( 400 );
			const menu = await page.evaluate( () => {
				const m = document.querySelector( '.minimal-ctx-menu' );
				if ( ! m ) return null;
				const kids = [ ...m.children ];
				return {
					count: kids.length,
					firstIsHeading: kids[ 0 ] && kids[ 0 ].classList.contains( 'minimal-new-menu-label' ),
					firstBorder: kids[ 0 ] && getComputedStyle( kids[ 0 ] ).borderTopWidth,
					search: !! m.querySelector( '#minimal-site-switch-q' ),
					focused: document.activeElement === m.querySelector( '#minimal-site-switch-q' ),
					results: m.querySelectorAll( '#minimal-site-switch-results button' ).length,
					hasNetwork: kids.some( ( el ) => /Network Admin/.test( el.textContent ) ),
				};
			} );
			check( 'switcher opens a menu', !! menu );
			check( 'inline site search is autofocused', menu && menu.search && menu.focused );
			check( 'switcher shows no more than five sites', menu && menu.results > 0 && menu.results <= 5, menu && menu.results );
			check( 'super admin gets a Network Admin entry', menu && menu.hasNetwork );
			// Regression: a heading that OPENS a menu draws no separator.
			check( 'no stranded divider above the leading heading',
				menu && menu.firstIsHeading && menu.firstBorder === '0px', menu && menu.firstBorder );

			// Real navigation to another site's Minimal.
			const target = await page.evaluate( () => {
				const m = document.querySelector( '.minimal-ctx-menu' );
				const btn = [ ...m.querySelectorAll( 'button' ) ].find( ( x ) => ! x.classList.contains( 'is-on' ) );
				if ( ! btn ) return null;
				const r = btn.getBoundingClientRect();
				return { x: r.x + r.width / 2, y: r.y + r.height / 2, name: btn.textContent.trim() };
			} );
			if ( target ) {
				await page.mouse.click( target.x, target.y );
				await page.waitForTimeout( 4000 );
				const landed = await page.evaluate( () => ( {
					url: location.href,
					name: window.MINIMAL && window.MINIMAL.site ? window.MINIMAL.site.name : '',
				} ) );
				check( 'clicking a site opens that site\'s Minimal', /\/minimal-admin\/?$/.test( landed.url ) && landed.name === target.name,
					`${ landed.url } (${ landed.name })` );
			} else {
				check( 'a non-current site was offered to click', false );
			}
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5b) Scale: the boot list stays capped, while the inline finder fuzzy
		//     searches the full membership and returns no more than five rows.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'overview' );
			const cap = await page.evaluate( () => ( {
				shown: ( window.MINIMAL.sites || [] ).length,
				total: window.MINIMAL.sitesTotal || 0,
				names: ( window.MINIMAL.sites || [] ).map( ( s ) => s.name ),
			} ) );
			check( 'boot payload caps the switcher list', cap.shown <= 8, `${ cap.shown } shown of ${ cap.total }` );
			if ( cap.total > cap.shown ) {
				const btnBox = await page.evaluate( () => {
					const r = document.querySelector( '#minimal-site-switch' ).getBoundingClientRect();
					return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
				} );
				await page.mouse.click( btnBox.x, btnBox.y );
				await page.waitForSelector( '#minimal-site-switch-q', { timeout: 8000 } );
				check( 'the remote fixture is outside the boot cap', ! cap.names.some( ( n ) => /Team 10/i.test( n ) ), cap.names.join( ', ' ) );
				// Ordered-subsequence search proves this is fuzzy ("tm10" is
				// not a literal substring) and reaches beyond the boot payload.
				await page.keyboard.type( 'tm10' );
				await page.waitForTimeout( 1200 );
				const typed = await page.evaluate( () => {
					const input = document.querySelector( '#minimal-site-switch-q' );
					const rows = [ ...document.querySelectorAll( '#minimal-site-switch-results button' ) ];
					return {
						value: input.value,
						caret: input.selectionStart,
						focused: document.activeElement === input,
						names: rows.map( ( row ) => row.textContent.trim() ),
					};
				} );
				check( 'inline search keeps every keystroke', typed.value === 'tm10', JSON.stringify( typed.value ) );
				check( 'inline search keeps focus and caret', typed.focused && typed.caret === 4 );
				check( 'fuzzy search reaches a site outside the boot cap', typed.names.some( ( n ) => /Team 10/i.test( n ) ), typed.names.join( ', ' ) );
				check( 'fuzzy results stay compact', typed.names.length > 0 && typed.names.length <= 5, `${ typed.names.length } rows` );
				await page.keyboard.press( 'ArrowDown' );
				const selected = await page.evaluate( () => {
					const button = document.querySelector( '#minimal-site-switch-results button[aria-selected="true"]' );
					return button ? button.textContent.trim() : '';
				} );
				check( 'arrow keys select a switcher result', /Team 10/i.test( selected ), selected );
				await page.keyboard.press( 'Escape' );
				check( 'Escape closes the switcher', ! await page.$( '.minimal-site-switch-menu' ) );
			} else {
				check( 'lab has enough sites to exercise the cap', false, `${ cap.total } total` );
			}
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5c) Network group: the Sites surface, its guards, and the fact that
		//     it does not exist for a site administrator.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'network-sites' );
			await page.waitForSelector( '#minimal-view [data-sitem]', { timeout: 15000 } );
			const sites = await page.evaluate( () => ( {
				navGroup: !! document.querySelector( '#minimal-navgrp-network:not([hidden])' ),
				navItems: [ ...document.querySelectorAll( '#minimal-navgrp-network .minimal-nav-btn' ) ].map( ( b ) => b.textContent.trim() ),
				rows: document.querySelectorAll( '#minimal-view [data-sitem]' ).length,
				tabs: [ ...document.querySelectorAll( '#minimal-view .minimal-tab' ) ].map( ( t ) => t.textContent.trim() ),
				status: !! document.querySelector( '#minimal-view' ).textContent.match( /Subdomain network|Subdirectory network/ ),
			} ) );
			check( 'Network nav group renders for a super admin', sites.navGroup && sites.navItems.includes( 'Sites' ), sites.navItems.join( ', ' ) );
			check( 'Sites lists the network', sites.rows > 1, `${ sites.rows } rows` );
			check( 'Sites offers status tabs', sites.tabs.some( ( t ) => /Archived/.test( t ) ) && sites.tabs.some( ( t ) => /Spam/.test( t ) ), sites.tabs.join( ' | ' ) );
			check( 'Sites shows the network status card', sites.status );
			// The topbar badge is a frame for its content: a surface with
			// nothing to say there must not leave an empty capsule.
			const badge = await page.evaluate( () => {
				const el = document.querySelector( '#minimal-sub' );
				const b = el.getBoundingClientRect();
				return { text: el.textContent.trim(), visible: b.width > 0 && b.height > 0 };
			} );
			check( 'the title badge names the scope', badge.text === 'Network' && badge.visible, JSON.stringify( badge ) );

			// Row verbs: an ordinary site offers the lifecycle; the MAIN site
			// never offers archive, spam or delete (its row menu is read-only).
			const rowMenu = async ( match ) => {
				await page.evaluate( () => document.querySelectorAll( '.minimal-ctx-menu' ).forEach( ( m ) => m.remove() ) );
				const ok = await page.evaluate( ( mm ) => {
					const row = [ ...document.querySelectorAll( '#minimal-view [data-sitem]' ) ].find( ( r ) => new RegExp( mm ).test( r.textContent ) );
					if ( ! row ) return false;
					const more = row.querySelector( '.minimal-row-more' );
					if ( ! more ) return false;
					more.click();
					return true;
				}, match );
				if ( ! ok ) return null;
				await page.waitForTimeout( 500 );
				return page.evaluate( () => [ ...document.querySelectorAll( '.minimal-ctx-menu > *' ) ].map( ( b ) => b.textContent.trim() ) );
			};
			const mainName = await page.evaluate( () => {
				const s = ( window.MINIMAL.sites || [] ).find( ( x ) => x.id === 1 );
				return s ? s.name : '';
			} );
			const ordinary = await rowMenu( 'Team' );
			check( 'an ordinary site offers the lifecycle verbs',
				ordinary && ordinary.some( ( e ) => /Archive site/.test( e ) ) && ordinary.some( ( e ) => /Delete site/.test( e ) ),
				( ordinary || [] ).join( ' | ' ) );
			// A href that is nothing but a placeholder carries a WHOLE URL, so
			// it must not be percent-encoded into a relative path.
			const hrefs = await page.evaluate( () =>
				[ ...document.querySelectorAll( '.minimal-ctx-menu a' ) ].map( ( a ) => a.getAttribute( 'href' ) ) );
			check( 'whole-URL row links resolve to real addresses',
				hrefs.length >= 2 && hrefs.every( ( h ) => /^https?:\/\/[^%]+$/.test( h ) ),
				hrefs.join( ' | ' ) );
			check( 'the site link points at that site\'s own Minimal',
				hrefs.some( ( h ) => /^https?:\/\/[^/]+(?:\/[^/]+)*\/minimal-admin\/$/.test( h ) ), hrefs.join( ' | ' ) );
			if ( mainName ) {
				const main = await rowMenu( mainName.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) );
				check( 'the main site offers NO archive, spam or delete',
					main && ! main.some( ( e ) => /(Archive site|Mark as spam|Delete site)/.test( e ) ),
					( main || [] ).join( ' | ' ) );
			}
			await page.keyboard.press( 'Escape' );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5c2) Network users: the list, and the two guards that matter — a
		//      network administrator is never offered "make one", and the
		//      person doing the looking can never revoke their own status.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'network-users' );
			await page.waitForSelector( '#minimal-view [data-sitem]', { timeout: 15000 } );
			const nu = await page.evaluate( () => ( {
				navItems: [ ...document.querySelectorAll( '#minimal-navgrp-network .minimal-nav-btn' ) ].map( ( b ) => b.textContent.trim() ),
				rows: document.querySelectorAll( '#minimal-view [data-sitem]' ).length,
				supers: [ ...document.querySelectorAll( '#minimal-view [data-sitem]' ) ].filter( ( r ) => /network admin/.test( r.textContent ) ).length,
				tabs: [ ...document.querySelectorAll( '#minimal-view .minimal-tab' ) ].map( ( t ) => t.textContent.trim() ),
			} ) );
			check( 'Network group carries a users surface', nu.navItems.some( ( n ) => /users/i.test( n ) ), nu.navItems.join( ', ' ) );
			check( 'network users lists every account', nu.rows > 1, `${ nu.rows } rows` );
			check( 'network administrators are marked', nu.supers >= 1 );
			check( 'network users offers an admins tab', nu.tabs.some( ( t ) => /admin/i.test( t ) ), nu.tabs.join( ' | ' ) );

			const rowMenu = async ( pick ) => {
				await page.evaluate( () => document.querySelectorAll( '.minimal-ctx-menu' ).forEach( ( m ) => m.remove() ) );
				const ok = await page.evaluate( ( wantSuper ) => {
					const rows = [ ...document.querySelectorAll( '#minimal-view [data-sitem]' ) ];
					const row = rows.find( ( r ) => /network admin/.test( r.textContent ) === wantSuper );
					if ( ! row ) return false;
					const more = row.querySelector( '.minimal-row-more' );
					if ( ! more ) return false;
					more.click();
					return true;
				}, pick );
				if ( ! ok ) return null;
				await page.waitForTimeout( 500 );
				return page.evaluate( () => [ ...document.querySelectorAll( '.minimal-ctx-menu > *' ) ].map( ( b ) => b.textContent.trim() ) );
			};
			const member = await rowMenu( false );
			check( 'an ordinary account can be promoted', member && member.some( ( e ) => /Make network administrator/.test( e ) ), ( member || [] ).join( ' | ' ) );
			// The other half of the href rule: a placeholder INSIDE a URL is
			// still substituted as a value, not left raw.
			const userHref = await page.evaluate( () => {
				const a = [ ...document.querySelectorAll( '.minimal-ctx-menu a' ) ].find( ( x ) => /Network Admin/.test( x.textContent ) );
				return a ? a.getAttribute( 'href' ) : '';
			} );
			check( 'a placeholder inside a URL still fills in', /user_id=\d+$/.test( userHref ), userHref );
			const superRow = await rowMenu( true );
			check( 'a network administrator is not offered promotion again',
				superRow && ! superRow.some( ( e ) => /Make network administrator/.test( e ) ), ( superRow || [] ).join( ' | ' ) );
			check( 'the only network administrator cannot be demoted here',
				superRow && ! superRow.some( ( e ) => /Remove network administrator/.test( e ) ), ( superRow || [] ).join( ' | ' ) );

			// The server refuses a self-revoke even when asked directly.
			const direct = await page.evaluate( async () => {
				const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/network/users/' + window.MINIMAL.user.id + '/super', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
					credentials: 'same-origin',
					body: JSON.stringify( { on: false } ),
				} );
				const j = await r.json();
				return { status: r.status, code: j.code };
			} );
			check( 'the server refuses a self-revoke', direct.status === 400 && direct.code === 'cannot_revoke_self', JSON.stringify( direct ) );
			await page.keyboard.press( 'Escape' );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5c3) Network activation from Extensions: a separate switch from this
		//      site's own, and Minimal never offers to pull itself out from under
		//      the person using it.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'extensions' );
			await page.waitForSelector( '.minimal-plugin', { timeout: 15000 } );
			const caps = await page.evaluate( () => ( {
				plugins: !! window.MINIMAL.caps.networkPlugins,
				themes: !! window.MINIMAL.caps.networkThemes,
			} ) );
			check( 'super admin gets network activation capabilities', caps.plugins && caps.themes );

			const cardMenu = async ( name ) => {
				await page.evaluate( () => document.querySelectorAll( '.minimal-ctx-menu' ).forEach( ( m ) => m.remove() ) );
				const pt = await page.evaluate( ( n ) => {
					const card = [ ...document.querySelectorAll( '.minimal-plugin' ) ].find( ( c ) => ( c.querySelector( '.minimal-plugin-name' )?.textContent || '' ).includes( n ) );
					if ( ! card ) return null;
					const b = card.getBoundingClientRect();
					return { x: b.x + b.width / 2, y: b.y + 40 };
				}, name );
				if ( ! pt ) return null;
				await page.mouse.click( pt.x, pt.y, { button: 'right' } );
				await page.waitForTimeout( 450 );
				return page.evaluate( () => [ ...document.querySelectorAll( '.minimal-ctx-menu > *' ) ].map( ( b ) => b.textContent.trim() ) );
			};
			const perSite = await cardMenu( 'WooCommerce' );
			check( 'a per-site plugin can be activated network-wide',
				perSite && perSite.some( ( e ) => /Activate for the whole network/.test( e ) ), ( perSite || [] ).join( ' | ' ) );
			await page.keyboard.press( 'Escape' );
			const self = await cardMenu( 'Minimal Admin' );
			check( 'Minimal never offers to deactivate ITSELF network-wide',
				self && ! self.some( ( e ) => /Deactivate across the network/.test( e ) ), ( self || [] ).join( ' | ' ) );
			await page.keyboard.press( 'Escape' );

			// The server refuses it too, not just the menu.
			const direct = await page.evaluate( async () => {
				const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/network/plugins/activate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
					credentials: 'same-origin',
					body: JSON.stringify( { plugin: 'minimal-admin/minimal-admin.php', on: false } ),
				} );
				return { status: r.status, code: ( await r.json() ).code };
			} );
			check( 'the server refuses a network self-deactivation', direct.status === 400 && direct.code === 'self', JSON.stringify( direct ) );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5c4) Network settings: a settings-only surface (no list), a real
		//      save round trip, and the refusal to write anything outside its
		//      own spec.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'network-settings' );
			await page.waitForTimeout( 2500 );
			const ns = await page.evaluate( () => ( {
				tabs: [ ...document.querySelectorAll( '#minimal-view [data-ssettab]' ) ].map( ( t ) => t.textContent.trim() ),
				controls: document.querySelectorAll( '#minimal-view input, #minimal-view select, #minimal-view textarea, #minimal-view .minimal-switch' ).length,
				broke: /Something went wrong/.test( document.querySelector( '#minimal-view' ).textContent ),
			} ) );
			check( 'network settings renders as its own page', ! ns.broke && ns.controls > 0, `${ ns.controls } controls` );
			const emptyBadge = await page.evaluate( () => {
				const el = document.querySelector( '#minimal-sub' );
				const b = el.getBoundingClientRect();
				return { text: el.textContent.trim(), visible: b.width > 0 && b.height > 0 };
			} );
			check( 'a surface with no badge text shows no empty pill', ! emptyBadge.text && ! emptyBadge.visible, JSON.stringify( emptyBadge ) );
			check( 'network settings offers its sections', ns.tabs.length >= 3, ns.tabs.join( ' | ' ) );

			// Round trip through the endpoint the form posts to, then restore.
			const trip = await page.evaluate( async () => {
				const post = async ( value ) => {
					const r = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/network/settings/registration', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
						credentials: 'same-origin',
						body: JSON.stringify( { values: { registration: value } } ),
					} );
					return ( await r.json() ).values;
				};
				const before = ( await ( await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/network/settings/registration', {
					headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
				} ) ).json() ).values.registration;
				const saved = await post( 'user' );
				// An unknown key must be ignored rather than written anywhere.
				const r2 = await fetch( window.MINIMAL.restUrl + 'minimal-admin/v1/network/settings/registration', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
					credentials: 'same-origin',
					body: JSON.stringify( { values: { registration: 'not-a-real-value', siteurl: 'http://evil.test' } } ),
				} );
				const after = ( await r2.json() ).values.registration;
				await post( before );
				return { saved: saved.registration, afterBogus: after, restored: before };
			} );
			check( 'a network setting saves', trip.saved === 'user', JSON.stringify( trip ) );
			check( 'an out-of-vocabulary value is refused', trip.afterBogus === 'user', JSON.stringify( trip ) );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 5d) THE AUTHORIZATION MATRIX. A site administrator holds
		//     manage_options on their own subsite, which is the realistic
		//     attacker on a network: every network route must refuse them,
		//     and nothing may change as a result. This is the durable form of
		//     the Phase 3 security audit — extend it whenever a network route
		//     is added, or the route ships unproven.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, STORE, SUBSITE_ADMIN.user, SUBSITE_ADMIN.pass );
			await gotoRoute( page, STORE, 'overview' );
			const denied = await page.evaluate( async () => {
				const call = async ( method, path, body ) => {
					const r = await fetch( window.MINIMAL.restUrl + path, {
						method,
						headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.MINIMAL.nonce },
						credentials: 'same-origin',
						body: body ? JSON.stringify( body ) : undefined,
					} );
					return { path: method + ' ' + path.replace( 'minimal-admin/v1/network/', '' ), status: r.status };
				};
				const me = window.MINIMAL.user.id;
				const probes = await Promise.all( [
					call( 'GET', 'minimal-admin/v1/network/sites' ),
					call( 'POST', 'minimal-admin/v1/network/sites', { address: 'pwned', title: 'P', email: 'admin@minimalms.localhost' } ),
					call( 'POST', 'minimal-admin/v1/network/sites/3/flag', { flag: 'archived', on: true } ),
					call( 'DELETE', 'minimal-admin/v1/network/sites/3' ),
					call( 'GET', 'minimal-admin/v1/network/status' ),
					call( 'GET', 'minimal-admin/v1/network/users' ),
					call( 'GET', 'minimal-admin/v1/network/users/status' ),
					call( 'POST', 'minimal-admin/v1/network/users/' + me + '/super', { on: true } ),
					call( 'POST', 'minimal-admin/v1/network/plugins/activate', { plugin: 'woocommerce/woocommerce.php', on: true } ),
					call( 'POST', 'minimal-admin/v1/network/themes/enable', { theme: 'twentytwentyfour', on: true } ),
					call( 'GET', 'minimal-admin/v1/network/settings/registration' ),
					call( 'POST', 'minimal-admin/v1/network/settings/registration', { values: { registration: 'all' } } ),
					call( 'POST', 'minimal-admin/v1/network/settings/sites', { values: { admin_email: 'attacker@evil.test' } } ),
				] );
				const grp = document.querySelector( '#minimal-navgrp-network' );
				return { navHidden: ! grp || grp.hidden, probes };
			} );
			check( 'site administrator sees no Network group', denied.navHidden );
			const allowed = denied.probes.filter( ( p ) => p.status < 400 );
			check( 'EVERY network route refuses a site administrator',
				allowed.length === 0,
				allowed.length ? allowed.map( ( p ) => `${ p.path } → ${ p.status }` ).join( '; ' ) : `${ denied.probes.length } routes refused` );
			// The refusals above are the point of the check, not app errors,
			// so this context's console output stays out of the error gate.
			await ctx.close();
		}

		// 5e) The control for 5d: the same reads MUST work for the network
		//     administrator. A permission wall that also blocks the person it
		//     exists for is a regression, not a fix.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, MAIN, SUPER_USER, SUPER_PASS );
			await gotoRoute( page, MAIN, 'overview' );
			const allowed = await page.evaluate( async () => {
				const get = async ( path ) => {
					const r = await fetch( window.MINIMAL.restUrl + path, {
						headers: { 'X-WP-Nonce': window.MINIMAL.nonce }, credentials: 'same-origin',
					} );
					return { path, status: r.status };
				};
				return Promise.all( [
					get( 'minimal-admin/v1/network/sites' ),
					get( 'minimal-admin/v1/network/status' ),
					get( 'minimal-admin/v1/network/users' ),
					get( 'minimal-admin/v1/network/users/status' ),
					get( 'minimal-admin/v1/network/settings/registration' ),
					get( 'minimal-admin/v1/my-sites' ),
				] );
			} );
			const blocked = allowed.filter( ( p ) => p.status >= 400 );
			check( 'the network administrator is not over-blocked',
				blocked.length === 0,
				blocked.length ? blocked.map( ( p ) => `${ p.path } → ${ p.status }` ).join( '; ' ) : `${ allowed.length } routes allowed` );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 6) The switcher HIDES for a user who belongs to only one site —
		//    a menu with nothing to switch to is worse than no control.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, STORE, SUBSITE_ADMIN.user, SUBSITE_ADMIN.pass );
			await gotoRoute( page, STORE, 'overview' );
			const one = await page.evaluate( () => ( {
				sites: ( window.MINIMAL.sites || [] ).length,
				hasBtn: !! document.querySelector( '#minimal-site-switch' ),
			} ) );
			check( 'single-site member gets no switcher', one.sites === 0 && ! one.hasBtn );
			allErrors.push( ...errors );
			await ctx.close();
		}

		// 7) Cross-site denial: the blog editor has no role on store.
		{
			const { ctx, page, errors } = await ctxFor( browser );
			await loginApp( page, STORE, BLOG_EDITOR.user, BLOG_EDITOR.pass );
			await page.goto( STORE + '/minimal-admin/', { waitUntil: 'domcontentloaded' } );
			await page.waitForTimeout( 2500 );
			const denied = await page.evaluate( () => ( {
				booted: !! window.MINIMAL,
				text: document.body ? document.body.innerText.slice( 0, 120 ) : '',
			} ) );
			check( 'user with no role on the site is denied Minimal there', ! denied.booted, denied.text.replace( /\n+/g, ' ' ) );
			// A clean 403 here is expected — do NOT fold this context's errors
			// into the zero-error gate (the denial fetch logs a 403).
			await ctx.close();
		}
	} catch ( e ) {
		check( 'suite ran without throwing', false, e.message.split( '\n' )[ 0 ] );
	}

	check( 'No console/page errors across the walk', allErrors.length === 0, [ ...new Set( allErrors ) ].slice( 0, 8 ).join( ' | ' ) );
	const failed = results.filter( ( r ) => ! r ).length;
	console.log( `\nmultisite: ${ results.length - failed }/${ results.length } passed` );
	await Promise.race( [ browser.close(), new Promise( ( r ) => setTimeout( r, 5000 ) ) ] );
	process.exit( failed ? 1 : 0 );
} )();
