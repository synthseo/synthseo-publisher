<?php
/*
Plugin Name: SynthSEO Publisher
Plugin URI: https://synthseo.com/wordpress-plugin/
Description: Securely receives and publishes SEO-optimized content from SynthSEO platform via REST API with comprehensive WordPress integration.
Version: 2.0.2
Author: SynthSEO Team
Author URI: https://synthseo.com
Text Domain: synthseo
Domain Path: /languages
Requires at least: 5.0
Tested up to: 6.8
Requires PHP: 7.4
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

SynthSEO Publisher is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

SynthSEO Publisher is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with SynthSEO Publisher. If not, see https://www.gnu.org/licenses/gpl-2.0.html.
*/

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SYNTHSEO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SYNTHSEO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SYNTHSEO_PUBLISHER_PATH', plugin_dir_path(__FILE__));
define('SYNTHSEO_PUBLISHER_URL', plugin_dir_url(__FILE__));
define('SYNTHSEO_VERSION', '2.0.2');

// Minimum requirements check
if (version_compare(PHP_VERSION, '7.4', '<')) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-error"><p>';
        echo '<strong>SynthSEO Publisher:</strong> This plugin requires PHP 7.4 or higher. ';
        echo 'You are running PHP ' . esc_html(PHP_VERSION) . '. Please update PHP to continue using this plugin.';
        echo '</p></div>';
    });
    return;
}

if (version_compare(get_bloginfo('version'), '5.0', '<')) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-error"><p>';
        echo '<strong>SynthSEO Publisher:</strong> This plugin requires WordPress 5.0 or higher. ';
        echo 'Please update WordPress to continue using this plugin.';
        echo '</p></div>';
    });
    return;
}

// Include the main plugin class
require_once SYNTHSEO_PLUGIN_DIR . 'includes/class-synthseo-publisher.php';

// Initialize the plugin
new SynthSEO_Publisher_V2();