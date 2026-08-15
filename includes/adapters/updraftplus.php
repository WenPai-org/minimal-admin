<?php
/**
 * Bundled adapter: UpdraftPlus backups.
 *
 * Answers "is my site backed up?" without leaving Minimal: a read-only
 * Backups surface over UpdraftPlus_Backup_History, a status endpoint that
 * feeds the System health check, and a Back-up-now action that schedules
 * UpdraftPlus's OWN cron event (`updraft_backupnow_backup_all`) and lets
 * its resumption machinery do the work — Minimal never runs the backup
 * in-request. Restores stay in wp-admin; that's surgery, not daily work.
 *
 * @package minimal-admin
 */

defined( 'ABSPATH' ) || exit;

function minimal_admin_updraftplus_active() {
	// UpdraftPlus free has no multisite awareness: its get_table_prefix()
	// returns the BASE prefix and its backup walks a bare SHOW TABLES, so a
	// "back up everything" started from any subsite dumps wp_users, wp_usermeta
	// and every neighbouring subsite's tables to the network owner's remote
	// storage. The plugin says so itself, in an error-level notice on its own
	// screen that Minimal does not reproduce. Same rule as every sibling here.
	if ( ! Minimal_Admin::network_owner() ) {
		return false;
	}
	return class_exists( 'UpdraftPlus_Options' ) && class_exists( 'UpdraftPlus_Backup_History' );
}

/** Newest-first backup sets from UpdraftPlus's history option. */
function minimal_admin_updraft_history() {
	$history = UpdraftPlus_Backup_History::get_history();
	if ( ! is_array( $history ) ) {
		return array();
	}
	krsort( $history, SORT_NUMERIC );
	$items = array();
	foreach ( $history as $ts => $set ) {
		if ( ! is_array( $set ) ) {
			continue;
		}
		$entities = array();
		foreach ( array( 'db' => 'Database', 'plugins' => 'Plugins', 'themes' => 'Themes', 'uploads' => 'Uploads', 'others' => 'Others', 'wpcore' => 'Core', 'more' => 'More' ) as $key => $label ) {
			if ( ! empty( $set[ $key ] ) ) {
				$entities[] = $label;
			}
		}
		$bytes = 0;
		foreach ( $set as $key => $value ) {
			if ( is_numeric( $value ) && '-size' === substr( (string) $key, -5 ) ) {
				$bytes += (int) $value;
			}
		}
		$service = isset( $set['service'] ) ? implode( ', ', array_diff( (array) $set['service'], array( 'none', '' ) ) ) : '';
		$items[] = array(
			'id'         => (int) $ts,
			'date'       => gmdate( 'Y-m-d\TH:i:s\Z', (int) $ts ),
			'components' => $entities ? implode( ' · ', $entities ) : '—',
			'size'       => $bytes ? size_format( $bytes ) : '—',
			'where'      => $service ? $service : 'local',
			'label'      => isset( $set['label'] ) ? (string) $set['label'] : '',
		);
	}
	return $items;
}

/** Is a backup currently running or resuming? (their own cron events) */
function minimal_admin_updraft_running() {
	foreach ( (array) _get_cron_array() as $hooks ) {
		foreach ( array( 'updraft_backup_resume', 'updraft_backupnow_backup_all', 'updraft_backupnow_backup', 'updraft_backupnow_backup_database' ) as $hook ) {
			if ( ! empty( $hooks[ $hook ] ) ) {
				return true;
			}
		}
	}
	return false;
}

/** { time, success } of the last finished backup, or null. */
function minimal_admin_updraft_last() {
	$last = UpdraftPlus_Options::get_updraft_option( 'updraft_last_backup', array() );
	if ( empty( $last['backup_time'] ) ) {
		return null;
	}
	return array(
		'time'    => (int) $last['backup_time'],
		'success' => ! empty( $last['success'] ),
	);
}

/** Server-built model for the surface status card (distinct from /updraft/status). */
function minimal_admin_updraft_status_model() {
	$last    = minimal_admin_updraft_last();
	$running = minimal_admin_updraft_running();
	$history = minimal_admin_updraft_history();
	$count   = count( $history );

	if ( $running ) {
		$last_value = __( 'Running now…', 'minimal-admin' );
		$last_hint  = __( 'UpdraftPlus is building or resuming a set', 'minimal-admin' );
	} elseif ( $last ) {
	$last_value = sprintf(
		/* translators: %s: human-readable time since the last backup. */
		__( '%s ago', 'minimal-admin' ),
		human_time_diff( $last['time'] )
	);
		$last_hint  = $last['success'] ? __( 'Completed successfully', 'minimal-admin' ) : __( 'Finished with errors — check UpdraftPlus', 'minimal-admin' );
	} else {
		$last_value = 'Never';
		$last_hint  = __( 'No finished backup recorded yet', 'minimal-admin' );
	}

	return array(
		'rows'    => array(
			array(
				'label' => __( 'Last backup', 'minimal-admin' ),
				'value' => $last_value,
				'hint'  => $last_hint,
			),
			array(
				'label' => __( 'Sets kept', 'minimal-admin' ),
				'value' => (string) $count,
				'hint'  => $count
					? __( 'Newest first in the list below (retention may prune older sets)', 'minimal-admin' )
					: __( 'Nothing on disk yet', 'minimal-admin' ),
			),
			array(
				'label' => __( 'Status', 'minimal-admin' ),
				'value' => $running ? 'Running' : 'Idle',
				'hint'  => __( 'Jobs run through UpdraftPlus\'s own cron machinery', 'minimal-admin' ),
			),
		),
		'actions' => array(
			array(
				'label'   => __( 'Back up everything now', 'minimal-admin' ),
				'route'   => 'minimal-admin/v1/updraft/backup-now',
				'method'  => 'POST',
				'body'    => array( 'what' => 'all' ),
				'confirm' => __( 'Start a full backup now? UpdraftPlus will run it in the background.', 'minimal-admin' ),
			),
			array(
				'label'  => __( 'Database only', 'minimal-admin' ),
				'route'  => 'minimal-admin/v1/updraft/backup-now',
				'method' => 'POST',
				'body'   => array( 'what' => 'db' ),
			),
			array(
				'label' => __( 'Open UpdraftPlus ↗', 'minimal-admin' ),
				'href'  => admin_url( 'options-general.php?page=updraftplus' ),
			),
		),
	);
}

add_filter( 'minimal_admin_surfaces', function ( $surfaces ) {
	if ( ! minimal_admin_updraftplus_active() ) {
		return $surfaces;
	}
	$surfaces['updraftplus'] = array(
		'label'      => __( 'Backups', 'minimal-admin' ),
		'sub'        => 'UpdraftPlus',
		'icon'       => 'database',
		'cap'        => 'manage_options',
		'family'     => 'backups',
		'status'     => array( 'route' => 'minimal-admin/v1/updraft/card' ),
		'collection' => array(
			'route'     => 'minimal-admin/v1/updraft/backups',
			'pageQuery' => 'per_page=25&page={page}',
			'itemsKey'  => 'items',
			'totalKey'  => 'total',
			'columns'   => array(
				array( 'key' => 'components', 'label' => __( 'Backup', 'minimal-admin' ), 'format' => 'title' ),
				array( 'key' => 'size', 'label' => __( 'Size', 'minimal-admin' ), 'format' => 'text' ),
				array( 'key' => 'where', 'label' => __( 'Stored', 'minimal-admin' ), 'format' => 'pill' ),
				array( 'key' => 'date', 'label' => __( 'Date', 'minimal-admin' ), 'format' => 'ago', 'utc' => true ),
			),
		),
	);
	return $surfaces;
} );

add_action( 'rest_api_init', function () {
	if ( ! minimal_admin_updraftplus_active() ) {
		return;
	}
	$perm = function () {
		// Network-shared archives (see minimal_admin_updraftplus_active).
		return current_user_can( 'manage_options' ) && Minimal_Admin::network_owner();
	};

	register_rest_route( 'minimal-admin/v1', '/updraft/backups', array(
		'methods'             => 'GET',
		'permission_callback' => $perm,
		'callback'            => function ( WP_REST_Request $request ) {
			$per_page = min( 100, max( 1, (int) $request->get_param( 'per_page' ) ?: 25 ) );
			$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
			$all      = minimal_admin_updraft_history();
			return rest_ensure_response( array(
				'items' => array_slice( $all, ( $page - 1 ) * $per_page, $per_page ),
				'total' => count( $all ),
			) );
		},
	) );

	// Machine-readable status (System health + suite + poll completion).
	register_rest_route( 'minimal-admin/v1', '/updraft/status', array(
		'methods'             => 'GET',
		'permission_callback' => $perm,
		'callback'            => function () {
			return rest_ensure_response( array(
				'last'    => minimal_admin_updraft_last(),
				'running' => minimal_admin_updraft_running(),
				'history' => count( minimal_admin_updraft_history() ),
			) );
		},
	) );

	// Surface status card (rows + actions) — same shape as Disembark/Duplicator.
	register_rest_route( 'minimal-admin/v1', '/updraft/card', array(
		'methods'             => 'GET',
		'permission_callback' => $perm,
		'callback'            => function () {
			return rest_ensure_response( minimal_admin_updraft_status_model() );
		},
	) );

	register_rest_route( 'minimal-admin/v1', '/updraft/backup-now', array(
		'methods'             => 'POST',
		'permission_callback' => $perm,
		'callback'            => function ( WP_REST_Request $request ) {
			$what  = sanitize_key( (string) $request->get_param( 'what' ) );
			$event = 'db' === $what ? 'updraft_backupnow_backup_database' : 'updraft_backupnow_backup_all';
			// Same options their own Backup Now dialog passes; nocloud=0
			// means "send to configured remote storage, if any".
			$options = array(
				'nocloud'     => 0,
				'use_nonce'   => false,
				'always_keep' => false,
			);
			wp_schedule_single_event( time() - 1, $event, array( $options ) );
			// Kick cron immediately so the job starts without waiting for
			// the next visitor; UpdraftPlus resumes itself from there.
			spawn_cron();
			$message = 'db' === $what
				? __( 'Database backup started — UpdraftPlus is running it in the background.', 'minimal-admin' )
				: __( 'Full backup started — UpdraftPlus is running it in the background.', 'minimal-admin' );
			return rest_ensure_response( array(
				'started' => true,
				'what'    => 'db' === $what ? 'db' : 'all',
				'message' => $message,
			) );
		},
	) );
} );
