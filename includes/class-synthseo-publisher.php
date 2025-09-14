<?php
/**
 * SynthSEO Publisher v2 - Main Plugin Class
 * 
 * Modular architecture for the SynthSEO Publisher plugin
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Publisher_V2 {
    
    private $security;
    private $content_publisher;
    private $media_handler;
    private $api_handler;
    private $admin;
    private $post_editor;
    
    public function __construct() {
        // Load all required classes
        $this->load_classes();
        
        // Initialize components
        $this->init_components();
        
        // Setup hooks
        $this->setup_hooks();
        
        // Handle activation/deactivation
        register_activation_hook(SYNTHSEO_PLUGIN_DIR . 'synthseo.php', array($this, 'activate'));
        register_deactivation_hook(SYNTHSEO_PLUGIN_DIR . 'synthseo.php', array($this, 'deactivate'));
    }
    
    /**
     * Load all required classes
     */
    private function load_classes() {
        require_once SYNTHSEO_PLUGIN_DIR . 'includes/classes/class-synthseo-security.php';
        require_once SYNTHSEO_PLUGIN_DIR . 'includes/classes/class-synthseo-content-publisher.php';
        require_once SYNTHSEO_PLUGIN_DIR . 'includes/classes/class-synthseo-media-handler.php';
        require_once SYNTHSEO_PLUGIN_DIR . 'includes/classes/class-synthseo-api-handler.php';
        require_once SYNTHSEO_PLUGIN_DIR . 'includes/classes/class-synthseo-admin.php';
        require_once SYNTHSEO_PLUGIN_DIR . 'includes/classes/class-synthseo-post-editor.php';
    }
    
    /**
     * Initialize all components
     */
    private function init_components() {
        // Initialize security first (other components depend on it)
        $this->security = new SynthSEO_Security();
        
        // Initialize content and media handlers
        $this->content_publisher = new SynthSEO_Content_Publisher();
        $this->media_handler = new SynthSEO_Media_Handler();
        
        // Initialize API handler (depends on other components)
        $this->api_handler = new SynthSEO_API_Handler(
            $this->security,
            $this->content_publisher,
            $this->media_handler
        );
        
        // Initialize admin interface (only in admin)
        if (is_admin()) {
            $this->admin = new SynthSEO_Admin($this->security);
            $this->post_editor = new SynthSEO_Post_Editor();
        }
    }
    
    /**
     * Setup WordPress hooks
     */
    private function setup_hooks() {
        // Add meta tags and schema to head
        add_action('wp_head', array($this, 'output_head_metadata'), 1);
        
        // Set UTF-8 encoding
        add_action('init', array($this, 'set_charset'));
        add_action('init', array($this, 'set_mb_encoding'));
        
        // Set HTML language attribute
        add_filter('language_attributes', array($this, 'set_html_language'), 10, 2);
        
        // Cleanup tasks
        add_action('wp_scheduled_delete', array($this, 'cleanup_old_data'));
        
        // AJAX handlers for admin
        add_action('wp_ajax_synthseo_generate_key', array($this, 'ajax_generate_key'));
        
        // Version check for migrations
        add_action('plugins_loaded', array($this, 'check_version'));
    }
    
    /**
     * Output meta tags and schema in head
     */
    public function output_head_metadata() {
        global $post;
        
        if (!is_singular() || !$post) {
            return;
        }
        
        // Check if Yoast is active
        $has_yoast = defined('WPSEO_VERSION');
        
        // Only output our meta tags if Yoast is not active
        if (!$has_yoast) {
            $this->output_basic_meta_tags($post->ID);
            $this->output_og_meta_tags($post->ID);
            $this->output_twitter_meta_tags($post->ID);
        }
        
        // Always output schema markup
        $this->output_schema_markup($post->ID);
    }
    
    /**
     * Output basic meta tags
     */
    private function output_basic_meta_tags($post_id) {
        $meta_description = get_post_meta($post_id, '_meta_description', true);
        $meta_keywords = get_post_meta($post_id, '_meta_keywords', true);
        
        if ($meta_description) {
            echo '<meta name="description" content="' . esc_attr($meta_description) . '" />' . "\n";
        }
        if ($meta_keywords) {
            echo '<meta name="keywords" content="' . esc_attr($meta_keywords) . '" />' . "\n";
        }
    }
    
    /**
     * Output Open Graph meta tags
     */
    private function output_og_meta_tags($post_id) {
        $og_title = get_post_meta($post_id, '_og_title', true);
        $og_description = get_post_meta($post_id, '_og_description', true);
        
        if ($og_title) {
            echo '<meta property="og:title" content="' . esc_attr($og_title) . '" />' . "\n";
        }
        if ($og_description) {
            echo '<meta property="og:description" content="' . esc_attr($og_description) . '" />' . "\n";
        }
        
        // Always output these OG tags
        echo '<meta property="og:type" content="article" />' . "\n";
        echo '<meta property="og:url" content="' . esc_url(get_permalink($post_id)) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '" />' . "\n";
        
        // Add featured image
        if (has_post_thumbnail($post_id)) {
            $featured_image = wp_get_attachment_image_src(get_post_thumbnail_id($post_id), 'large');
            if ($featured_image) {
                echo '<meta property="og:image" content="' . esc_url($featured_image[0]) . '" />' . "\n";
                echo '<meta property="og:image:width" content="' . esc_attr($featured_image[1]) . '" />' . "\n";
                echo '<meta property="og:image:height" content="' . esc_attr($featured_image[2]) . '" />' . "\n";
            }
        }
    }
    
    /**
     * Output Twitter Card meta tags
     */
    private function output_twitter_meta_tags($post_id) {
        $twitter_title = get_post_meta($post_id, '_twitter_title', true);
        $twitter_description = get_post_meta($post_id, '_twitter_description', true);
        
        echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
        
        if ($twitter_title) {
            echo '<meta name="twitter:title" content="' . esc_attr($twitter_title) . '" />' . "\n";
        }
        if ($twitter_description) {
            echo '<meta name="twitter:description" content="' . esc_attr($twitter_description) . '" />' . "\n";
        }
        
        // Add featured image
        if (has_post_thumbnail($post_id)) {
            $featured_image = wp_get_attachment_image_src(get_post_thumbnail_id($post_id), 'large');
            if ($featured_image) {
                echo '<meta name="twitter:image" content="' . esc_url($featured_image[0]) . '" />' . "\n";
            }
        }
    }
    
    /**
     * Output schema markup
     */
    private function output_schema_markup($post_id) {
        $schema = get_post_meta($post_id, '_article_schema', true);
        if ($schema) {
            echo '<script type="application/ld+json">' . wp_json_encode(json_decode($schema)) . '</script>' . "\n";
        }
    }
    
    /**
     * Set charset for UTF-8 support
     */
    public function set_charset() {
        if (!headers_sent()) {
            header('Content-Type: text/html; charset=utf-8');
        }
    }
    
    /**
     * Set MB internal encoding
     */
    public function set_mb_encoding() {
        if (function_exists('mb_internal_encoding')) {
            mb_internal_encoding('UTF-8');
        }
    }
    
    /**
     * Set HTML language attribute based on post language
     */
    public function set_html_language($output, $doctype) {
        global $post;
        
        if ($post && is_singular()) {
            $language = get_post_meta($post->ID, 'post_language', true);
            if ($language) {
                return "lang=\"$language\"";
            }
        }
        
        return $output;
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        $this->create_database_tables();
        
        // Generate API key if it doesn't exist
        if (!get_option('synthseo_api_key')) {
            update_option('synthseo_api_key', $this->security->generate_api_key());
        }
        
        // Set default options
        add_option('synthseo_rate_limit', 100);
        add_option('synthseo_enable_logging', false);
        add_option('synthseo_version', SYNTHSEO_VERSION);
        
        // Schedule cleanup tasks
        if (!wp_next_scheduled('synthseo_cleanup')) {
            wp_schedule_event(time(), 'daily', 'synthseo_cleanup');
        }
        
        // Flush rewrite rules to ensure REST API endpoints work
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('synthseo_cleanup');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Create database tables
     */
    private function create_database_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Rate limiting table
        $rate_limit_table = $wpdb->prefix . 'synthseo_rate_limits';
        $sql = "CREATE TABLE $rate_limit_table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            client_id VARCHAR(100) NOT NULL,
            request_count INT(11) NOT NULL DEFAULT 0,
            window_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_client (client_id),
            KEY idx_window (window_start)
        ) $charset_collate;";
        
        // Optional logging table (only if logging is enabled)
        $log_table = $wpdb->prefix . 'synthseo_logs';
        $log_sql = "CREATE TABLE $log_table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            level VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            context JSON,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_level_created (level, created_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Only create log table if logging is enabled
        if (get_option('synthseo_enable_logging')) {
            dbDelta($log_sql);
        }
    }
    
    /**
     * Check version and run migrations if needed
     */
    public function check_version() {
        $installed_version = get_option('synthseo_version', '1.0.0');
        
        if (version_compare($installed_version, SYNTHSEO_VERSION, '<')) {
            $this->run_migrations($installed_version);
            update_option('synthseo_version', SYNTHSEO_VERSION);
        }
    }
    
    /**
     * Run database migrations
     */
    private function run_migrations($from_version) {
        // Migration from v1 to v2
        if (version_compare($from_version, '2.0.0', '<')) {
            // Create new tables
            $this->create_database_tables();
            
            // Migrate any existing settings if needed
            // (Current settings are compatible, no migration needed)
        }
    }
    
    /**
     * Cleanup old data
     */
    public function cleanup_old_data() {
        // Cleanup rate limit records
        $this->security->cleanup_rate_limits();
        
        // Cleanup orphaned media
        $this->media_handler->cleanup_orphaned_media();
        
        // Cleanup old log entries (if logging table exists)
        global $wpdb;
        $log_table = $wpdb->prefix . 'synthseo_logs';
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $log_table)) === $log_table) {
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}synthseo_logs WHERE created_at < %s",
                gmdate('Y-m-d H:i:s', strtotime('-7 days'))
            ));
        }
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    }
    
    /**
     * AJAX handler for generating new API key
     */
    public function ajax_generate_key() {
        // Check nonce and permissions
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'synthseo_generate_key') || !current_user_can('manage_options')) {
            wp_die(json_encode(array('success' => false, 'data' => 'Unauthorized')));
        }
        
        // Generate new API key
        $new_key = $this->security->generate_api_key();
        update_option('synthseo_api_key', $new_key);
        
        wp_die(json_encode(array(
            'success' => true,
            'data' => array('api_key' => $new_key)
        )));
    }
    
    /**
     * Get component instances (for testing or extensions)
     */
    public function get_security() {
        return $this->security;
    }
    
    public function get_content_publisher() {
        return $this->content_publisher;
    }
    
    public function get_media_handler() {
        return $this->media_handler;
    }
    
    public function get_api_handler() {
        return $this->api_handler;
    }
    
    public function get_admin() {
        return $this->admin;
    }
}