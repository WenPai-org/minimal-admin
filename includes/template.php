<?php
/**
 * Minimal Admin app shell. Rendered standalone at /minimal-admin/ — no theme, no wp-admin chrome.
 *
 * @var array $boot Boot payload prepared in Minimal_Admin::maybe_render_app().
 *
 * @package minimal-admin
 */

defined( 'ABSPATH' ) || exit;
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr( get_bloginfo( 'language' ) ); ?>" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Minimal Admin — <?php echo esc_html( get_bloginfo( 'name' ) ); ?></title>
<?php
// The site icon (settable from Minimal's own Settings → General), when one exists.
if ( has_site_icon() ) {
	wp_site_icon();
}
?>
<?php
// Self-busting asset versions: version + file mtime, so every edit or update
// invalidates the browser cache without a constant bump (stale app.js after
// an update repeatedly masked real fixes during development).
$minimal_asset_ver = function ( $rel ) {
	$mtime = @filemtime( MINIMAL_ADMIN_DIR . $rel );
	return MINIMAL_ADMIN_VERSION . ( $mtime ? '.' . $mtime : '' );
};
?>
<link rel="stylesheet" href="<?php echo esc_url( MINIMAL_ADMIN_URL . 'assets/css/app.css?ver=' . $minimal_asset_ver( 'assets/css/app.css' ) ); ?>">
<script>
// Apply the theme before first paint to avoid a flash. Default is System
// (follow the OS live). Explicit light/dark wins when the user locked one.
try {
	var stored = localStorage.getItem( 'minimal-theme' );
	// First visit: persist System so the default is an explicit preference.
	if ( ! stored ) {
		localStorage.setItem( 'minimal-theme', 'system' );
		stored = 'system';
	}
	var follow = stored === 'system';
	if ( follow && window.matchMedia ) {
		var mq = window.matchMedia( '(prefers-color-scheme: light)' );
		document.documentElement.setAttribute( 'data-theme', mq.matches ? 'light' : 'dark' );
		mq.addEventListener( 'change', function ( e ) {
			if ( localStorage.getItem( 'minimal-theme' ) === 'system' ) {
				document.documentElement.setAttribute( 'data-theme', e.matches ? 'light' : 'dark' );
				document.dispatchEvent( new CustomEvent( 'minimal-theme-change' ) );
			}
		} );
	} else if ( stored === 'light' || stored === 'dark' ) {
		document.documentElement.setAttribute( 'data-theme', stored );
	}
} catch ( e ) {}
window.MINIMAL = <?php echo wp_json_encode( $boot, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>;
// Color scheme from user meta (boot.user.appearance) — apply before paint.
(function () {
	try {
		var ap = ( window.MINIMAL && window.MINIMAL.user && window.MINIMAL.user.appearance ) || { scheme: 'minimal' };
		var root = document.documentElement;
		// Legacy { accent } → scheme id.
		var scheme = ap.scheme || ( ap.accent && ap.accent !== 'custom' ? ap.accent : ( ap.accent === 'custom' ? 'custom' : 'minimal' ) );
		root.setAttribute( 'data-scheme', scheme );
		root.removeAttribute( 'data-accent' );
		var slots = ['bg','bg2','panel','panel2','hover','border','border2','text','text2','text3','accent','accent2','accentFg'];
		var cssMap = { bg:'--bg', bg2:'--bg2', panel:'--panel', panel2:'--panel2', hover:'--hover', border:'--border', border2:'--border2', text:'--text', text2:'--text2', text3:'--text3', accent:'--accent', accent2:'--accent2', accentFg:'--accent-fg' };
		function clearInline() {
			slots.forEach( function ( k ) { root.style.removeProperty( cssMap[ k ] ); } );
			root.style.removeProperty( '--accent-soft' );
		}
		if ( scheme !== 'custom' ) {
			clearInline();
			return;
		}
		var mode = root.getAttribute( 'data-theme' ) || 'dark';
		var tokens = ( ap.custom && ap.custom[ mode ] ) || {};
		// Legacy custom hex string.
		if ( typeof ap.custom === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test( ap.custom ) ) {
			tokens = { accent: ap.custom, accent2: ap.custom };
		}
		var softA = mode === 'light' ? 0.10 : 0.15;
		slots.forEach( function ( k ) {
			if ( tokens[ k ] ) root.style.setProperty( cssMap[ k ], tokens[ k ] );
		} );
		if ( tokens.accent ) {
			var hex = String( tokens.accent ).replace( /^#/, '' );
			if ( hex.length === 3 ) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
			if ( /^[0-9a-fA-F]{6}$/.test( hex ) ) {
				var r = parseInt( hex.slice( 0, 2 ), 16 ), g = parseInt( hex.slice( 2, 4 ), 16 ), b = parseInt( hex.slice( 4, 6 ), 16 );
				root.style.setProperty( '--accent-soft', 'rgba(' + r + ',' + g + ',' + b + ',' + softA + ')' );
			}
		}
	} catch ( e2 ) {}
})();
</script>
</head>
<body>
<div id="minimal-app"><div class="minimal-boot-spinner"></div></div>
<script src="<?php echo esc_url( MINIMAL_ADMIN_URL . 'assets/js/app.js?ver=' . $minimal_asset_ver( 'assets/js/app.js' ) ); ?>"></script>
<?php
/**
 * Fires at the end of Minimal's app document — the ONLY hook inside it. Minimal
 * deliberately never fires wp_head/wp_footer (a random plugin injecting into
 * the SPA is exactly what this document avoids); developer tooling that knows
 * about Minimal can attach here. The bundled Query Monitor adapter uses it.
 */
do_action( 'minimal_admin_template_footer' );
?>
</body>
</html>
