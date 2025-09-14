<?php
/**
 * SynthSEO Feature Flags
 * 
 * Manages feature toggles for gradual React rollout
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Feature_Flags {
    
    /**
     * Feature flag option key
     */
    const OPTION_KEY = 'synthseo_feature_flags';
    
    /**
     * Default feature flags
     */
    private static $defaults = array(
        'react_admin' => true,        // Use React for admin interface
        'react_editor' => true,        // Use React for post editor
        'enhanced_seo' => true,        // Enhanced SEO features
        'debug_mode' => false,         // Debug mode
        'legacy_fallback' => true,     // Fallback to jQuery if React fails
    );
    
    /**
     * Get all feature flags
     */
    public static function get_all() {
        $flags = get_option(self::OPTION_KEY, array());
        return wp_parse_args($flags, self::$defaults);
    }
    
    /**
     * Check if a feature is enabled
     */
    public static function is_enabled($feature) {
        $flags = self::get_all();
        return isset($flags[$feature]) ? (bool) $flags[$feature] : false;
    }
    
    /**
     * Enable a feature
     */
    public static function enable($feature) {
        $flags = self::get_all();
        $flags[$feature] = true;
        update_option(self::OPTION_KEY, $flags);
    }
    
    /**
     * Disable a feature
     */
    public static function disable($feature) {
        $flags = self::get_all();
        $flags[$feature] = false;
        update_option(self::OPTION_KEY, $flags);
    }
    
    /**
     * Toggle a feature
     */
    public static function toggle($feature) {
        if (self::is_enabled($feature)) {
            self::disable($feature);
        } else {
            self::enable($feature);
        }
    }
    
    /**
     * Reset to defaults
     */
    public static function reset() {
        update_option(self::OPTION_KEY, self::$defaults);
    }
    
    /**
     * Check if React admin should be used
     */
    public static function use_react_admin() {
        // Check if React build exists
        $build_dir = SYNTHSEO_PUBLISHER_PATH . 'build/';
        $has_build = !empty(glob($build_dir . 'admin.*.js'));
        
        // Use React if enabled and build exists
        return self::is_enabled('react_admin') && $has_build;
    }
    
    /**
     * Check if React editor should be used
     */
    public static function use_react_editor() {
        // Check if React build exists
        $build_dir = SYNTHSEO_PUBLISHER_PATH . 'build/';
        $has_build = !empty(glob($build_dir . 'editor.*.js'));
        
        // Use React if enabled and build exists
        return self::is_enabled('react_editor') && $has_build;
    }
    
    /**
     * Add admin UI for managing feature flags
     */
    public static function render_admin_ui() {
        $flags = self::get_all();
        ?>
        <div class="synthseo-feature-flags">
            <h3><?php esc_html_e('Feature Flags', 'synthseo'); ?></h3>
            <p><?php esc_html_e('Control which features are enabled during the migration.', 'synthseo'); ?></p>
            
            <table class="widefat">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Feature', 'synthseo'); ?></th>
                        <th><?php esc_html_e('Status', 'synthseo'); ?></th>
                        <th><?php esc_html_e('Description', 'synthseo'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($flags as $feature => $enabled) : ?>
                    <tr>
                        <td><strong><?php echo esc_html($feature); ?></strong></td>
                        <td>
                            <label class="switch">
                                <input type="checkbox" 
                                       name="synthseo_feature_flags[<?php echo esc_attr($feature); ?>]" 
                                       value="1" 
                                       <?php checked($enabled); ?> />
                                <span class="slider"></span>
                            </label>
                        </td>
                        <td><?php echo esc_html(self::get_feature_description($feature)); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
    
    /**
     * Get feature description
     */
    private static function get_feature_description($feature) {
        $descriptions = array(
            'react_admin' => 'Use React-based admin interface',
            'react_editor' => 'Use React-based post editor integration',
            'enhanced_seo' => 'Enable enhanced SEO features',
            'debug_mode' => 'Enable debug mode for troubleshooting',
            'legacy_fallback' => 'Fallback to jQuery version if React fails',
        );
        
        return isset($descriptions[$feature]) ? $descriptions[$feature] : '';
    }
}