<?php
/**
 * SynthSEO Content Publisher
 * 
 * Handles WordPress post creation, updating, and retrieval
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Content_Publisher {
    
    /**
     * Create a new WordPress post
     */
    public function create_post($request) {
        try {
            $params = $request->get_json_params();
            
            // Validate required fields
            $validation_result = $this->validate_post_data($params);
            if (is_wp_error($validation_result)) {
                return $validation_result;
            }
            
            // Prepare post data with proper sanitization
            $post_data = $this->prepare_post_data($params);
            
            // Create the post within a transaction-like operation
            remove_filter('content_save_pre', 'wp_filter_post_kses');
            $post_id = wp_insert_post($post_data, true);
            add_filter('content_save_pre', 'wp_filter_post_kses');
            
            if (is_wp_error($post_id)) {
                throw new Exception($post_id->get_error_message());
            }
            
            // Handle categories and tags
            $this->handle_taxonomies($post_id, $params);
            
            // Handle SEO metadata
            $this->handle_seo_metadata($post_id, $params);
            
            // Log the successful creation
            $this->log_operation('post_created', $post_id, $params);
            
            return rest_ensure_response(array(
                'success' => true,
                'post_id' => $post_id,
                'message' => 'Post created successfully',
                'url' => get_permalink($post_id),
                'edit_url' => get_edit_post_link($post_id, 'raw')
            ));
            
        } catch (Exception $e) {
            $this->log_operation('post_creation_failed', null, $params, $e->getMessage());
            
            return new WP_Error(
                'post_creation_error',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }
    
    /**
     * Update an existing WordPress post
     */
    public function update_post($request) {
        try {
            $post_id = $request['id'];
            $params = $request->get_json_params();
            
            // Check if post exists
            $post = get_post($post_id);
            if (!$post) {
                return new WP_Error(
                    'post_not_found', 
                    'Post not found', 
                    array('status' => 404)
                );
            }
            
            // Validate the update data
            $validation_result = $this->validate_post_data($params, $post_id);
            if (is_wp_error($validation_result)) {
                return $validation_result;
            }
            
            // Prepare update data
            $post_data = $this->prepare_post_data($params, $post_id);
            
            // Update the post
            remove_filter('content_save_pre', 'wp_filter_post_kses');
            $updated_post_id = wp_update_post($post_data, true);
            add_filter('content_save_pre', 'wp_filter_post_kses');
            
            if (is_wp_error($updated_post_id)) {
                throw new Exception($updated_post_id->get_error_message());
            }
            
            // Handle categories and tags
            $this->handle_taxonomies($post_id, $params);
            
            // Handle SEO metadata
            $this->handle_seo_metadata($post_id, $params);
            
            // Log the successful update
            $this->log_operation('post_updated', $post_id, $params);
            
            return rest_ensure_response(array(
                'success' => true,
                'post_id' => $post_id,
                'message' => 'Post updated successfully',
                'url' => get_permalink($post_id),
                'edit_url' => get_edit_post_link($post_id, 'raw')
            ));
            
        } catch (Exception $e) {
            $this->log_operation('post_update_failed', $post_id, $params, $e->getMessage());
            
            return new WP_Error(
                'post_update_error',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }
    
    /**
     * Get posts with filtering
     */
    public function get_posts($request) {
        $params = $request->get_params();
        
        $args = array(
            'post_type' => 'post',
            'posts_per_page' => $params['per_page'],
            'paged' => $params['page'],
            'post_status' => $params['status'],
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        // Add search filter if provided
        if (!empty($params['search'])) {
            $args['s'] = sanitize_text_field($params['search']);
        }
        
        $query = new WP_Query($args);
        $posts = array();
        
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post = get_post();
                
                $posts[] = array(
                    'id' => $post->ID,
                    'title' => get_the_title(),
                    'slug' => $post->post_name,
                    'status' => $post->post_status,
                    'date' => get_the_date('c'),
                    'modified' => get_the_modified_date('c'),
                    'url' => get_permalink(),
                    'edit_url' => get_edit_post_link($post->ID, 'raw'),
                    'synthseo_id' => get_post_meta($post->ID, 'synthseo_post_id', true)
                );
            }
        }
        
        wp_reset_postdata();
        
        return rest_ensure_response(array(
            'posts' => $posts,
            'total_posts' => $query->found_posts,
            'total_pages' => $query->max_num_pages,
            'current_page' => $params['page'],
            'posts_per_page' => $params['per_page']
        ));
    }
    
    /**
     * Validate post data
     */
    private function validate_post_data($params, $post_id = null) {
        // Required fields for new posts
        if (!$post_id && (empty($params['title']) || empty($params['content']))) {
            return new WP_Error(
                'missing_required_fields',
                'Title and content are required for new posts',
                array('status' => 400)
            );
        }
        
        // Validate status if provided
        if (!empty($params['status'])) {
            $valid_statuses = array('publish', 'draft', 'private', 'pending');
            if (!in_array($params['status'], $valid_statuses)) {
                return new WP_Error(
                    'invalid_status',
                    'Invalid post status. Must be one of: ' . implode(', ', $valid_statuses),
                    array('status' => 400)
                );
            }
        }
        
        // Validate author if provided
        if (!empty($params['author_id'])) {
            $author = get_user_by('id', $params['author_id']);
            if (!$author) {
                return new WP_Error(
                    'invalid_author',
                    'Invalid author ID',
                    array('status' => 400)
                );
            }
        }
        
        return true;
    }
    
    /**
     * Prepare post data for WordPress
     */
    private function prepare_post_data($params, $post_id = null) {
        $language = $params['target_language'] ?? 'en-US';
        
        $post_data = array(
            'post_title' => !empty($params['title']) ? 
                htmlspecialchars_decode(sanitize_text_field($params['title']), ENT_QUOTES) : '',
            'post_content' => !empty($params['content']) ? 
                wp_kses_post($params['content']) : '',
            'post_status' => $params['status'] ?? 'draft',
            'post_type' => 'post',
            'post_excerpt' => !empty($params['excerpt']) ? 
                wp_kses_post($params['excerpt']) : '',
            'post_author' => $params['author_id'] ?? 1,
            'meta_input' => array(
                'synthseo_post_id' => sanitize_text_field($params['post_id'] ?? ''),
                'synthseo_metadata' => $params['metadata'] ?? array(),
                'post_language' => $language,
                '_wp_page_template' => 'default',
                // Store enhanced SynthSEO data for post editor
                'synthseo_content_metrics' => $params['content_metrics'] ?? array(),
                'synthseo_seo_metrics' => $params['seo_metrics'] ?? array(),
                'synthseo_target_keywords' => $params['target_keywords'] ?? array(),
                'synthseo_keyword_strategy' => $params['keyword_strategy'] ?? array()
            )
        );
        
        // If updating, add the post ID
        if ($post_id) {
            $post_data['ID'] = $post_id;
        }
        
        return $post_data;
    }
    
    /**
     * Handle categories and tags
     */
    private function handle_taxonomies($post_id, $params) {
        // Handle categories
        if (!empty($params['categories'])) {
            $category_ids = array();
            foreach ($params['categories'] as $category) {
                if (is_numeric($category)) {
                    $category_ids[] = intval($category);
                } else {
                    // Create category if it doesn't exist
                    $term = term_exists($category, 'category');
                    if (!$term) {
                        $term = wp_insert_term($category, 'category');
                    }
                    if (!is_wp_error($term)) {
                        $category_ids[] = $term['term_id'];
                    }
                }
            }
            wp_set_post_categories($post_id, $category_ids);
        }
        
        // Handle tags
        if (!empty($params['tags'])) {
            $tags = array();
            foreach ($params['tags'] as $tag) {
                if (is_numeric($tag)) {
                    $term = get_term($tag, 'post_tag');
                    if (!is_wp_error($term)) {
                        $tags[] = $term->name;
                    }
                } else {
                    $tags[] = sanitize_text_field($tag);
                }
            }
            wp_set_post_tags($post_id, $tags);
        }
    }
    
    /**
     * Handle SEO metadata
     */
    private function handle_seo_metadata($post_id, $params) {
        if (empty($params['seo'])) {
            return;
        }
        
        $seo_data = $params['seo'];
        
        // Check if Yoast SEO is installed
        $has_yoast = defined('WPSEO_VERSION');
        
        // Basic meta description and keywords
        if (!empty($seo_data['description'])) {
            update_post_meta($post_id, '_meta_description', sanitize_text_field($seo_data['description']));
            
            // Also save to Yoast if available
            if ($has_yoast) {
                update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($seo_data['description']));
            }
        }
        
        if (!empty($seo_data['keywords'])) {
            update_post_meta($post_id, '_meta_keywords', sanitize_text_field($seo_data['keywords']));
        }
        
        // Handle social metadata
        if (!empty($seo_data['social'])) {
            $this->handle_social_metadata($post_id, $seo_data['social'], $has_yoast);
        }
        
        // Generate schema markup
        $this->generate_schema_markup($post_id, $seo_data);
    }
    
    /**
     * Handle social media metadata
     */
    private function handle_social_metadata($post_id, $social_data, $has_yoast = false) {
        // Open Graph
        if (!empty($social_data['og_title'])) {
            update_post_meta($post_id, '_og_title', sanitize_text_field($social_data['og_title']));
            if ($has_yoast) {
                update_post_meta($post_id, '_yoast_wpseo_opengraph-title', sanitize_text_field($social_data['og_title']));
            }
        }
        
        if (!empty($social_data['og_description'])) {
            update_post_meta($post_id, '_og_description', sanitize_text_field($social_data['og_description']));
            if ($has_yoast) {
                update_post_meta($post_id, '_yoast_wpseo_opengraph-description', sanitize_text_field($social_data['og_description']));
            }
        }
        
        // Twitter Cards
        if (!empty($social_data['twitter_title'])) {
            update_post_meta($post_id, '_twitter_title', sanitize_text_field($social_data['twitter_title']));
            if ($has_yoast) {
                update_post_meta($post_id, '_yoast_wpseo_twitter-title', sanitize_text_field($social_data['twitter_title']));
            }
        }
        
        if (!empty($social_data['twitter_description'])) {
            update_post_meta($post_id, '_twitter_description', sanitize_text_field($social_data['twitter_description']));
            if ($has_yoast) {
                update_post_meta($post_id, '_yoast_wpseo_twitter-description', sanitize_text_field($social_data['twitter_description']));
            }
        }
    }
    
    /**
     * Generate schema markup
     */
    private function generate_schema_markup($post_id, $seo_data) {
        $post = get_post($post_id);
        
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $post->post_title,
            'description' => !empty($seo_data['description']) ? 
                $seo_data['description'] : wp_strip_all_tags(get_the_excerpt($post)),
            'datePublished' => get_the_date('c', $post_id),
            'dateModified' => get_the_modified_date('c', $post_id),
            'author' => array(
                '@type' => 'Person',
                'name' => get_the_author_meta('display_name', $post->post_author)
            ),
            'publisher' => array(
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'logo' => array(
                    '@type' => 'ImageObject',
                    'url' => get_site_icon_url() ?: get_bloginfo('url') . '/favicon.ico'
                )
            ),
            'mainEntityOfPage' => array(
                '@type' => 'WebPage',
                '@id' => get_permalink($post_id)
            )
        );
        
        // Add featured image if available
        if (has_post_thumbnail($post_id)) {
            $featured_image = wp_get_attachment_image_src(get_post_thumbnail_id($post_id), 'large');
            if ($featured_image) {
                $schema['image'] = array(
                    '@type' => 'ImageObject',
                    'url' => $featured_image[0],
                    'width' => $featured_image[1],
                    'height' => $featured_image[2]
                );
            }
        }
        
        // Store schema as post meta
        update_post_meta($post_id, '_article_schema', wp_json_encode($schema));
    }
    
    /**
     * Log operations for debugging
     */
    private function log_operation($action, $post_id = null, $params = null, $error = null) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $log_data = array(
            'action' => $action,
            'post_id' => $post_id,
            'timestamp' => current_time('c'),
            'params_summary' => array(
                'title' => $params['title'] ?? null,
                'status' => $params['status'] ?? null,
                'synthseo_id' => $params['post_id'] ?? null
            )
        );
        
        if ($error) {
            $log_data['error'] = $error;
        }
        
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('SynthSEO Publisher: ' . wp_json_encode($log_data));
        }
    }
}