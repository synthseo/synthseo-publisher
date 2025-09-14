<?php
/**
 * SynthSEO API Handler
 * 
 * Handles REST API endpoint registration and routing
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_API_Handler {
    
    private $namespace = 'synthseo/v2';
    private $security;
    private $content_publisher;
    private $media_handler;
    
    public function __construct($security, $content_publisher, $media_handler) {
        $this->security = $security;
        $this->content_publisher = $content_publisher;
        $this->media_handler = $media_handler;
        
        add_action('rest_api_init', array($this, 'register_endpoints'));
    }
    
    /**
     * Register all REST API endpoints
     */
    public function register_endpoints() {
        // Health check endpoint
        register_rest_route($this->namespace, '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_status_check'),
            'permission_callback' => array($this->security, 'verify_request'),
        ));
        
        // Schema endpoint - returns dynamic schema of available fields
        register_rest_route($this->namespace, '/schema', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_post_schema'),
            'permission_callback' => array($this->security, 'verify_request'),
        ));
        
        // Publish single post
        register_rest_route($this->namespace, '/publish', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_publish_post'),
            'permission_callback' => array($this->security, 'verify_request'),
        ));
        
        // Update existing post
        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'handle_update_post'),
            'permission_callback' => array($this->security, 'verify_request'),
            'args' => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                )
            )
        ));
        
        // Get posts (for SaaS to verify what's published)
        register_rest_route($this->namespace, '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_posts'),
            'permission_callback' => array($this->security, 'verify_request'),
            'args' => array(
                'per_page' => array(
                    'default' => 10,
                    'sanitize_callback' => 'absint',
                ),
                'page' => array(
                    'default' => 1,
                    'sanitize_callback' => 'absint',
                ),
                'status' => array(
                    'default' => 'publish',
                    'sanitize_callback' => 'sanitize_text_field',
                )
            ),
        ));
        
        // Media upload
        register_rest_route($this->namespace, '/media', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_media_upload'),
            'permission_callback' => array($this->security, 'verify_request'),
        ));
        
        // Bulk operations (Phase 2)
        register_rest_route($this->namespace, '/batch', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_batch_operations'),
            'permission_callback' => array($this->security, 'verify_request'),
        ));
        
        // Legacy v1 endpoints (backward compatibility only - not shown to customers)
        $this->register_legacy_endpoints();
    }
    
    /**
     * Handle health check requests
     */
    public function handle_status_check($request) {
        $status = array(
            'status' => 'ok',
            'version' => SYNTHSEO_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'timestamp' => current_time('c'),
            'endpoints' => array(
                'publish' => rest_url($this->namespace . '/publish'),
                'batch' => rest_url($this->namespace . '/batch'),
                'media' => rest_url($this->namespace . '/media'),
                'schema' => rest_url($this->namespace . '/schema')
            )
        );
        
        return rest_ensure_response($status);
    }
    
    /**
     * Get dynamic post schema based on installed theme and plugins
     */
    public function get_post_schema($request) {
        global $wpdb;
        
        // Get current theme info
        $theme = wp_get_theme();
        $active_plugins = get_option('active_plugins', array());
        
        // Detect available post types
        $post_types = get_post_types(array('public' => true), 'objects');
        
        // Detect custom fields from various sources
        $custom_fields = array();
        
        // Check for Advanced Custom Fields
        if (class_exists('ACF')) {
            $acf_groups = acf_get_field_groups();
            foreach ($acf_groups as $group) {
                $fields = acf_get_fields($group['ID']);
                foreach ($fields as $field) {
                    $custom_fields['acf'][] = array(
                        'name' => $field['name'],
                        'label' => $field['label'],
                        'type' => $field['type'],
                        'required' => $field['required'] ?? false
                    );
                }
            }
        }
        
        // Check for Custom Field Suite
        if (function_exists('CFS')) {
            $cfs = CFS();
            if (method_exists($cfs, 'find_field_groups')) {
                $cfs_field_groups = $cfs->find_field_groups();
                foreach ($cfs_field_groups as $group_id) {
                    if (isset($cfs->api) && method_exists($cfs->api, 'get_field_group')) {
                        $group = $cfs->api->get_field_group($group_id);
                        if ($group && isset($group['fields'])) {
                            foreach ($group['fields'] as $field) {
                                $custom_fields['cfs'][] = array(
                                    'name' => $field['name'],
                                    'label' => $field['label'],
                                    'type' => $field['type']
                                );
                            }
                        }
                    }
                }
            }
        }
        
        // Check for Meta Box plugin
        if (function_exists('rwmb_meta')) {
            $meta_boxes = apply_filters('rwmb_meta_boxes', array());
            foreach ($meta_boxes as $meta_box) {
                if (isset($meta_box['fields'])) {
                    foreach ($meta_box['fields'] as $field) {
                        $custom_fields['metabox'][] = array(
                            'name' => $field['id'],
                            'label' => isset($field['name']) ? $field['name'] : $field['id'],
                            'type' => $field['type']
                        );
                    }
                }
            }
        }
        
        // Check for installed SEO plugins
        $seo_plugins = array(
            'yoast' => defined('WPSEO_VERSION'),
            'aioseo' => defined('AIOSEO_VERSION'),
            'rankmath' => defined('RANK_MATH_VERSION'),
            'seopress' => defined('SEOPRESS_VERSION')
        );
        
        // Build SEO fields based on detected plugins
        $seo_fields = array();
        if ($seo_plugins['yoast']) {
            $seo_fields['yoast'] = array(
                '_yoast_wpseo_title' => 'SEO Title',
                '_yoast_wpseo_metadesc' => 'Meta Description',
                '_yoast_wpseo_focuskw' => 'Focus Keyword',
                '_yoast_wpseo_opengraph-title' => 'Open Graph Title',
                '_yoast_wpseo_opengraph-description' => 'Open Graph Description',
                '_yoast_wpseo_twitter-title' => 'Twitter Title',
                '_yoast_wpseo_twitter-description' => 'Twitter Description'
            );
        }
        
        if ($seo_plugins['aioseo']) {
            $seo_fields['aioseo'] = array(
                '_aioseo_title' => 'SEO Title',
                '_aioseo_description' => 'Meta Description',
                '_aioseo_keywords' => 'Keywords',
                '_aioseo_og_title' => 'Open Graph Title',
                '_aioseo_og_description' => 'Open Graph Description',
                '_aioseo_twitter_title' => 'Twitter Title',
                '_aioseo_twitter_description' => 'Twitter Description'
            );
        }
        
        if ($seo_plugins['rankmath']) {
            $seo_fields['rankmath'] = array(
                'rank_math_title' => 'SEO Title',
                'rank_math_description' => 'Meta Description',
                'rank_math_focus_keyword' => 'Focus Keyword',
                'rank_math_facebook_title' => 'Facebook Title',
                'rank_math_facebook_description' => 'Facebook Description',
                'rank_math_twitter_title' => 'Twitter Title',
                'rank_math_twitter_description' => 'Twitter Description'
            );
        }
        
        // Get public meta keys currently in use
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $meta_keys = $wpdb->get_col("
            SELECT DISTINCT meta_key 
            FROM {$wpdb->postmeta} 
            WHERE meta_key NOT LIKE '\_%' 
            ORDER BY meta_key
            LIMIT 100
        ");
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        
        // Get available taxonomies
        $taxonomies = get_taxonomies(array('public' => true), 'objects');
        
        // Build the dynamic schema response
        $schema = array(
            'theme' => array(
                'name' => $theme->get('Name'),
                'version' => $theme->get('Version'),
                'text_domain' => $theme->get('TextDomain'),
                'template' => $theme->get_template(),
                'stylesheet' => $theme->get_stylesheet()
            ),
            'plugins' => array(
                'active_count' => count($active_plugins),
                'seo_plugins' => $seo_plugins,
                'custom_field_plugins' => array(
                    'acf' => class_exists('ACF'),
                    'cfs' => function_exists('CFS'),
                    'metabox' => function_exists('rwmb_meta'),
                    'pods' => function_exists('pods'),
                    'toolset' => defined('TYPES_VERSION')
                )
            ),
            'post_types' => array(),
            'taxonomies' => array(),
            'custom_fields' => $custom_fields,
            'seo_fields' => $seo_fields,
            'meta_keys' => $meta_keys,
            'required_fields' => array(
                'title' => array(
                    'type' => 'string',
                    'description' => 'Post title',
                    'required' => true,
                    'max_length' => 255
                ),
                'content' => array(
                    'type' => 'string',
                    'description' => 'Post content in HTML format',
                    'required' => true
                )
            ),
            'optional_fields' => array(
                'status' => array(
                    'type' => 'string',
                    'options' => array('draft', 'publish', 'pending', 'private', 'future'),
                    'default' => 'draft',
                    'description' => 'Post publication status'
                ),
                'excerpt' => array(
                    'type' => 'string',
                    'description' => 'Post excerpt or summary'
                ),
                'author_id' => array(
                    'type' => 'integer',
                    'description' => 'WordPress user ID of the author',
                    'default' => 1
                ),
                'featured_image_url' => array(
                    'type' => 'string',
                    'format' => 'url',
                    'description' => 'URL of featured image to download and attach'
                ),
                'featured_image_id' => array(
                    'type' => 'integer',
                    'description' => 'Media library ID of existing image'
                ),
                'categories' => array(
                    'type' => 'array',
                    'items' => array('type' => 'string|integer'),
                    'description' => 'Array of category names or IDs'
                ),
                'tags' => array(
                    'type' => 'array',
                    'items' => array('type' => 'string|integer'),
                    'description' => 'Array of tag names or IDs'
                ),
                'target_language' => array(
                    'type' => 'string',
                    'pattern' => '^[a-z]{2}-[A-Z]{2}$',
                    'examples' => array('en-US', 'es-ES', 'fr-FR', 'de-DE'),
                    'description' => 'Language code for the post'
                ),
                'post_id' => array(
                    'type' => 'string',
                    'description' => 'External post ID for tracking'
                ),
                'metadata' => array(
                    'type' => 'object',
                    'description' => 'Custom metadata object'
                ),
                'seo' => array(
                    'type' => 'object',
                    'description' => 'SEO metadata (structure depends on installed SEO plugin)',
                    'properties' => array(
                        'title' => array('type' => 'string', 'max_length' => 60),
                        'description' => array('type' => 'string', 'max_length' => 160),
                        'keywords' => array('type' => 'string'),
                        'focus_keyword' => array('type' => 'string'),
                        'social' => array(
                            'type' => 'object',
                            'properties' => array(
                                'og_title' => array('type' => 'string'),
                                'og_description' => array('type' => 'string'),
                                'twitter_title' => array('type' => 'string'),
                                'twitter_description' => array('type' => 'string')
                            )
                        )
                    )
                )
            )
        );
        
        // Add post type details
        foreach ($post_types as $post_type) {
            $schema['post_types'][$post_type->name] = array(
                'label' => $post_type->label,
                'description' => $post_type->description,
                'supports' => get_all_post_type_supports($post_type->name),
                'taxonomies' => get_object_taxonomies($post_type->name),
                'public' => $post_type->public,
                'hierarchical' => $post_type->hierarchical
            );
        }
        
        // Add taxonomy details
        foreach ($taxonomies as $taxonomy) {
            $schema['taxonomies'][$taxonomy->name] = array(
                'label' => $taxonomy->label,
                'description' => $taxonomy->description,
                'hierarchical' => $taxonomy->hierarchical,
                'post_types' => $taxonomy->object_type
            );
        }
        
        // Add page templates if available
        $page_templates = wp_get_theme()->get_page_templates();
        if (!empty($page_templates)) {
            $schema['page_templates'] = $page_templates;
        }
        
        // Add post formats if supported
        if (current_theme_supports('post-formats')) {
            $post_formats = get_theme_support('post-formats');
            $schema['post_formats'] = is_array($post_formats) ? $post_formats[0] : array();
        }
        
        // Add sample payload
        $schema['example_payload'] = array(
            'title' => 'Sample Blog Post Title',
            'content' => '<p>This is the blog post content in HTML format...</p>',
            'status' => 'publish',
            'excerpt' => 'A brief summary of the post',
            'categories' => array('Technology', 'WordPress'),
            'tags' => array('seo', 'optimization'),
            'target_language' => 'en-US',
            'seo' => array(
                'title' => 'SEO Optimized Title',
                'description' => 'Meta description for search engines',
                'keywords' => 'wordpress, seo, optimization',
                'social' => array(
                    'og_title' => 'Social Media Title',
                    'og_description' => 'Description for social sharing'
                )
            )
        );
        
        return rest_ensure_response($schema);
    }
    
    /**
     * Handle single post publishing
     */
    public function handle_publish_post($request) {
        return $this->content_publisher->create_post($request);
    }
    
    /**
     * Handle post updates
     */
    public function handle_update_post($request) {
        return $this->content_publisher->update_post($request);
    }
    
    /**
     * Handle get posts requests
     */
    public function handle_get_posts($request) {
        return $this->content_publisher->get_posts($request);
    }
    
    /**
     * Handle media uploads
     */
    public function handle_media_upload($request) {
        return $this->media_handler->upload_media($request);
    }
    
    /**
     * Handle batch operations (Phase 2 feature)
     */
    public function handle_batch_operations($request) {
        // TODO: Implement in Phase 2
        return new WP_Error(
            'not_implemented',
            'Batch operations will be implemented in Phase 2',
            array('status' => 501)
        );
    }
    
    /**
     * Register legacy v1 endpoints for backward compatibility
     * Note: These endpoints are maintained for existing integrations but not exposed in the admin UI
     */
    private function register_legacy_endpoints() {
        $legacy_namespace = 'synthseo/v1';
        
        // Legacy publish endpoint
        register_rest_route($legacy_namespace, '/publish', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_publish_post'),
            'permission_callback' => array($this->security, 'verify_legacy_request'),
        ));
        
        // Legacy update endpoint
        register_rest_route($legacy_namespace, '/update/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'handle_update_post'),
            'permission_callback' => array($this->security, 'verify_legacy_request'),
            'args' => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                )
            )
        ));
    }
}