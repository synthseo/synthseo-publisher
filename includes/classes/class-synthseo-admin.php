<?php
/**
 * SynthSEO Admin Interface
 * 
 * Handles WordPress admin interface and settings
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Admin {
    
    private $security;
    
    public function __construct($security) {
        $this->security = $security;
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // AJAX handlers
        add_action('wp_ajax_synthseo_generate_key', array($this, 'ajax_generate_api_key'));
        add_action('wp_ajax_synthseo_save_settings', array($this, 'ajax_save_settings'));
    }
    
    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        // Check capabilities first
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Main settings page
        add_menu_page(
            'SynthSEO Publisher',
            'SynthSEO',
            'manage_options',
            'synthseo',
            array($this, 'render_settings_page'),
            'dashicons-admin-generic',
            80
        );
        
        // Status/monitoring submenu
        add_submenu_page(
            'synthseo',
            'Status & Monitoring',
            'Status',
            'manage_options',
            'synthseo-status',
            array($this, 'render_status_page')
        );
        
        // Debug submenu (only show in development mode)
        if (defined('WP_DEBUG') && WP_DEBUG && defined('SYNTHSEO_DEVELOPMENT') && SYNTHSEO_DEVELOPMENT) {
            add_submenu_page(
                'synthseo',
                'Debug Information',
                'Debug',
                'manage_options',
                'synthseo-debug',
                array($this, 'render_debug_page')
            );
        }
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('synthseo_settings', 'synthseo_api_key', array(
            'sanitize_callback' => array($this, 'sanitize_api_key')
        ));
        
        register_setting('synthseo_settings', 'synthseo_rate_limit', array(
            'default' => 100,
            'sanitize_callback' => 'absint'
        ));
        
        register_setting('synthseo_settings', 'synthseo_enable_logging', array(
            'default' => false,
            'sanitize_callback' => 'rest_sanitize_boolean'
        ));
    }
    
    /**
     * Get the correct build file name (handles hashed filenames in production)
     */
    private function get_build_file($name) {
        $build_dir = SYNTHSEO_PUBLISHER_PATH . 'build/';
        
        // First check for non-hashed file (development)
        if (file_exists($build_dir . $name . '.js')) {
            return $name . '.js';
        }
        
        // Check for hashed files (production)
        $files = glob($build_dir . $name . '.*.js');
        if (!empty($files)) {
            return basename($files[0]);
        }
        
        return false;
    }
    
    /**
     * Get the asset file for a build
     */
    private function get_asset_file($name) {
        $build_dir = SYNTHSEO_PUBLISHER_PATH . 'build/';
        
        // Check for non-hashed asset file
        if (file_exists($build_dir . $name . '.asset.php')) {
            return include($build_dir . $name . '.asset.php');
        }
        
        // Check for hashed asset files
        $files = glob($build_dir . $name . '.*.asset.php');
        if (!empty($files)) {
            return include($files[0]);
        }
        
        return array('dependencies' => array(), 'version' => SYNTHSEO_VERSION);
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our admin pages
        if (strpos($hook, 'synthseo') === false && strpos($hook, 'toplevel_page_synthseo') === false) {
            return;
        }
        
        // Load React bundle (required, no fallback)
        $admin_build = $this->get_build_file('admin');
        
        if (!$admin_build) {
            // If build doesn't exist, show error in admin
            add_action('admin_notices', function() {
                ?>
                <div class="notice notice-error">
                    <p><?php esc_html_e('SynthSEO Publisher: React build files not found. Please run npm run build.', 'synthseo'); ?></p>
                </div>
                <?php
            });
            return;
        }
        
        // Load React bundle
        $asset_file = $this->get_asset_file('admin');
        
        // Enqueue WordPress packages (these are core scripts from WordPress 5.0+)
        // Note: wp-element is the WordPress React wrapper introduced with Gutenberg
        if (wp_script_is('wp-element', 'registered')) {
            wp_enqueue_script('wp-element');
        }
        if (wp_script_is('wp-components', 'registered')) {
            wp_enqueue_script('wp-components');
        }
        if (wp_script_is('wp-i18n', 'registered')) {
            wp_enqueue_script('wp-i18n');
        }
        if (wp_script_is('wp-api-fetch', 'registered')) {
            wp_enqueue_script('wp-api-fetch');
        }
        
        wp_enqueue_script(
            'synthseo-admin-react',
            SYNTHSEO_PUBLISHER_URL . 'build/' . $admin_build,
            array('wp-element', 'wp-components', 'wp-i18n', 'wp-api-fetch'),
            $asset_file['version'],
            true
        );
        
        // Ensure WordPress styles are loaded
        wp_enqueue_style('wp-components');
        
        // Check for CSS file
        $css_file = str_replace('.js', '.css', $admin_build);
        if (file_exists(SYNTHSEO_PUBLISHER_PATH . 'build/' . $css_file)) {
            wp_enqueue_style(
                'synthseo-admin-react',
                SYNTHSEO_PUBLISHER_URL . 'build/' . $css_file,
                array('wp-components'),
                $asset_file['version']
            );
        }
        
        // Pass data to React
        wp_localize_script('synthseo-admin-react', 'synthseoAdmin', array(
            'nonce' => wp_create_nonce('wp_rest'),
            'apiUrl' => rest_url('synthseo/v2/'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'adminUrl' => admin_url(),
            'pluginUrl' => SYNTHSEO_PUBLISHER_URL,
            'currentPage' => $hook,
            'settings' => array(
                'apiKey' => get_option('synthseo_api_key', ''),
                'rateLimit' => get_option('synthseo_rate_limit', 100),
                'enableLogging' => get_option('synthseo_enable_logging', false)
            ),
            'version' => SYNTHSEO_VERSION,
            'debugMode' => defined('WP_DEBUG') && WP_DEBUG && defined('SYNTHSEO_DEVELOPMENT') && SYNTHSEO_DEVELOPMENT
        ));
        
    }
    
    /**
     * Render main settings page
     */
    public function render_settings_page() {
        // Security check
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'synthseo'));
        }
        
        // Handle form submissions
        if (isset($_POST['submit']) && check_admin_referer('synthseo_settings_nonce')) {
            $this->handle_settings_form();
        }
        
        // Generate API key if it doesn't exist
        if (!get_option('synthseo_api_key')) {
            update_option('synthseo_api_key', $this->security->generate_api_key());
        }
        
        // Always use React version - no jQuery fallback
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('SynthSEO Publisher Settings', 'synthseo'); ?></h1>
            <div id="synthseo-admin-root">
                <div style="padding: 20px; background: #f0f0f1; border-left: 4px solid #72aee6; margin: 20px 0;">
                    <p><strong><?php echo esc_html__('Loading React interface...', 'synthseo'); ?></strong></p>
                    <p><?php echo esc_html__('If this message persists, please ensure JavaScript is enabled and try refreshing the page.', 'synthseo'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render status page
     */
    public function render_status_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('SynthSEO Status & Monitoring', 'synthseo'); ?></h1>
            <div id="synthseo-admin-root" data-initial-tab="status">
                <div style="padding: 20px; background: #f0f0f1; border-left: 4px solid #72aee6; margin: 20px 0;">
                    <p><strong><?php echo esc_html__('Loading status dashboard...', 'synthseo'); ?></strong></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render debug page
     */
    public function render_debug_page() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'synthseo'));
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('SynthSEO Debug Information', 'synthseo'); ?></h1>
            <div id="synthseo-admin-root" data-initial-tab="debug">
                <div style="padding: 20px; background: #f0f0f1; border-left: 4px solid #72aee6; margin: 20px 0;">
                    <p><strong><?php echo esc_html__('Loading debug information...', 'synthseo'); ?></strong></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Handle settings form submission
     */
    private function handle_settings_form() {
        // Verify nonce
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'])), 'synthseo_settings_nonce')) {
            add_settings_error('synthseo_settings', 'invalid_nonce', __('Security check failed', 'synthseo'));
            return;
        }
        
        // Update settings
        if (isset($_POST['synthseo_api_key'])) {
            update_option('synthseo_api_key', sanitize_text_field(wp_unslash($_POST['synthseo_api_key'])));
        }
        
        if (isset($_POST['synthseo_rate_limit'])) {
            update_option('synthseo_rate_limit', absint(wp_unslash($_POST['synthseo_rate_limit'])));
        }
        
        update_option('synthseo_enable_logging', isset($_POST['synthseo_enable_logging']));
        
        add_settings_error('synthseo_settings', 'settings_updated', __('Settings saved.', 'synthseo'), 'updated');
    }
    
    /**
     * AJAX handler for generating new API key
     */
    public function ajax_generate_api_key() {
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
     * AJAX handler for saving settings
     */
    public function ajax_save_settings() {
        // Check nonce and permissions
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'wp_rest') || !current_user_can('manage_options')) {
            wp_die(json_encode(array('success' => false, 'data' => 'Unauthorized')));
        }
        
        // Update settings
        if (isset($_POST['synthseo_rate_limit'])) {
            update_option('synthseo_rate_limit', absint(wp_unslash($_POST['synthseo_rate_limit'])));
        }
        
        if (isset($_POST['synthseo_enable_logging'])) {
            $enable_logging = sanitize_text_field(wp_unslash($_POST['synthseo_enable_logging']));
            update_option('synthseo_enable_logging', $enable_logging === '1');
        }
        
        wp_die(json_encode(array(
            'success' => true,
            'data' => array('message' => 'Settings saved successfully')
        )));
    }
    
    /**
     * Sanitize API key
     */
    public function sanitize_api_key($value) {
        return preg_replace('/[^a-zA-Z0-9]/', '', $value);
    }
}