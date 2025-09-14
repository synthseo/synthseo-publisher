<?php
/**
 * SynthSEO Media Handler
 * 
 * Handles media uploads and processing
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Media_Handler {
    
    /**
     * Upload media file
     */
    public function upload_media($request) {
        try {
            // Verify nonce for non-REST contexts (REST API handles its own authentication)
            if (!defined('REST_REQUEST') || !REST_REQUEST) {
                if (!isset($_REQUEST['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_REQUEST['_wpnonce'])), 'synthseo_media_upload')) {
                    return new WP_Error(
                        'invalid_nonce',
                        'Security verification failed',
                        array('status' => 403)
                    );
                }
            }

            // Check if file was uploaded
            if (empty($_FILES)) {
                return new WP_Error(
                    'no_file',
                    'No file was uploaded',
                    array('status' => 400)
                );
            }

            // Validate the upload
            // phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
            $validation_result = $this->validate_upload(isset($_FILES['file']) ? $_FILES['file'] : array());
            // phpcs:enable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
            if (is_wp_error($validation_result)) {
                return $validation_result;
            }
            
            // Required WordPress functions for media handling
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            
            // Get metadata from request
            $metadata = $this->prepare_media_metadata($request);
            
            // Handle the upload
            $attachment_id = media_handle_upload('file', 0, array(
                'post_title' => $metadata['title'],
                'post_content' => $metadata['description'],
                'post_excerpt' => $metadata['caption'],
            ));
            
            if (is_wp_error($attachment_id)) {
                throw new Exception($attachment_id->get_error_message());
            }
            
            // Update additional metadata
            $this->update_media_metadata($attachment_id, $metadata);
            
            // Get attachment data for response
            $attachment_data = $this->get_attachment_data($attachment_id);
            
            // Log the successful upload
            $this->log_operation('media_uploaded', $attachment_id, $metadata);
            
            return rest_ensure_response($attachment_data);
            
        } catch (Exception $e) {
            $this->log_operation('media_upload_failed', null, $metadata ?? array(), $e->getMessage());
            
            return new WP_Error(
                'upload_error',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }
    
    /**
     * Update media metadata
     */
    public function update_media_metadata($attachment_id, $metadata) {
        // Update alt text
        if (!empty($metadata['alt_text'])) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($metadata['alt_text']));
        }
        
        // Store SynthSEO metadata
        if (!empty($metadata['synthseo_id'])) {
            update_post_meta($attachment_id, 'synthseo_media_id', sanitize_text_field($metadata['synthseo_id']));
        }
        
        // Store additional metadata
        if (!empty($metadata['metadata'])) {
            update_post_meta($attachment_id, 'synthseo_metadata', $metadata['metadata']);
        }
        
        return true;
    }
    
    /**
     * Validate file upload
     */
    private function validate_upload($file) {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return new WP_Error(
                'upload_error',
                $this->get_upload_error_message($file['error']),
                array('status' => 400)
            );
        }
        
        // Check file size
        $max_size = $this->get_max_upload_size();
        if ($file['size'] > $max_size) {
            return new WP_Error(
                'file_too_large',
                sprintf('File size exceeds maximum allowed size of %s', size_format($max_size)),
                array('status' => 413)
            );
        }
        
        // Check file type
        $allowed_types = $this->get_allowed_file_types();
        $file_type = wp_check_filetype($file['name']);
        
        if (!in_array($file_type['type'], $allowed_types)) {
            return new WP_Error(
                'invalid_file_type',
                sprintf('File type %s is not allowed', $file_type['type']),
                array('status' => 400)
            );
        }
        
        // Security check - scan file content for malicious patterns
        if ($this->is_suspicious_file($file['tmp_name'], $file_type['type'])) {
            return new WP_Error(
                'suspicious_file',
                'File content appears to be suspicious',
                array('status' => 400)
            );
        }
        
        return true;
    }
    
    /**
     * Prepare media metadata from request
     */
    private function prepare_media_metadata($request) {
        return array(
            'title' => sanitize_text_field($request->get_param('title') ?: ''),
            'description' => wp_kses_post($request->get_param('description') ?: ''),
            'caption' => wp_kses_post($request->get_param('caption') ?: ''),
            'alt_text' => sanitize_text_field($request->get_param('alt_text') ?: ''),
            'synthseo_id' => sanitize_text_field($request->get_param('media_id') ?: ''),
            'metadata' => $request->get_param('metadata') ?: array()
        );
    }
    
    /**
     * Get attachment data for API response
     */
    private function get_attachment_data($attachment_id) {
        $attachment = get_post($attachment_id);
        $attachment_url = wp_get_attachment_url($attachment_id);
        
        $data = array(
            'id' => $attachment_id,
            'title' => $attachment->post_title,
            'filename' => basename($attachment_url),
            'url' => $attachment_url,
            'alt_text' => get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
            'description' => $attachment->post_content,
            'caption' => $attachment->post_excerpt,
            'mime_type' => $attachment->post_mime_type,
            'file_size' => filesize(get_attached_file($attachment_id)),
            'upload_date' => $attachment->post_date,
            'synthseo_id' => get_post_meta($attachment_id, 'synthseo_media_id', true)
        );
        
        // Add image-specific data
        if (wp_attachment_is_image($attachment_id)) {
            $metadata = wp_get_attachment_metadata($attachment_id);
            $data['width'] = $metadata['width'] ?? 0;
            $data['height'] = $metadata['height'] ?? 0;
            
            // Add different sizes
            $data['sizes'] = array(
                'thumbnail' => wp_get_attachment_image_src($attachment_id, 'thumbnail'),
                'medium' => wp_get_attachment_image_src($attachment_id, 'medium'),
                'large' => wp_get_attachment_image_src($attachment_id, 'large'),
                'full' => wp_get_attachment_image_src($attachment_id, 'full')
            );
        }
        
        return $data;
    }
    
    /**
     * Get maximum upload size
     */
    private function get_max_upload_size() {
        // Use WordPress settings or apply filter for customization
        $wp_max = wp_max_upload_size();
        return apply_filters('synthseo_max_upload_size', $wp_max);
    }
    
    /**
     * Get allowed file types
     */
    private function get_allowed_file_types() {
        $default_types = array(
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/wav'
        );
        
        return apply_filters('synthseo_allowed_file_types', $default_types);
    }
    
    /**
     * Get upload error message
     */
    private function get_upload_error_message($error_code) {
        $error_messages = array(
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
        );
        
        return $error_messages[$error_code] ?? 'Unknown upload error';
    }
    
    /**
     * Check if file contains suspicious content
     */
    private function is_suspicious_file($file_path, $mime_type) {
        // Only check text-based files and images
        if (strpos($mime_type, 'text/') !== 0 && strpos($mime_type, 'image/') !== 0) {
            return false;
        }
        
        // Read first 1KB of file to check for suspicious patterns
        $content = file_get_contents($file_path, false, null, 0, 1024);
        if (!$content) {
            return false;
        }
        
        // Check for common malicious patterns
        $suspicious_patterns = array(
            '/<\?php/i',
            '/<script/i',
            '/eval\s*\(/i',
            '/base64_decode/i',
            '/system\s*\(/i',
            '/exec\s*\(/i',
            '/shell_exec/i',
            '/passthru/i',
            '/file_get_contents/i',
            '/fopen\s*\(/i',
            '/fwrite\s*\(/i'
        );
        
        foreach ($suspicious_patterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Clean up orphaned media files
     */
    public function cleanup_orphaned_media() {
        global $wpdb;
        
        // Find attachments that are not attached to any post and older than 24 hours
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $orphaned_attachments = $wpdb->get_results($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} 
             WHERE post_type = 'attachment' 
             AND post_parent = 0 
             AND post_date < %s 
             AND post_status = 'inherit'",
            gmdate('Y-m-d H:i:s', strtotime('-24 hours'))
        ));
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        
        foreach ($orphaned_attachments as $attachment) {
            // Check if it's used in any post content
            // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $usage_count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->posts} 
                 WHERE post_content LIKE %s 
                 AND post_status IN ('publish', 'draft', 'private')",
                '%wp-image-' . $attachment->ID . '%'
            ));
            // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            
            // If not used anywhere, delete it
            if ($usage_count == 0) {
                wp_delete_attachment($attachment->ID, true);
            }
        }
    }
    
    /**
     * Log media operations
     */
    private function log_operation($action, $attachment_id = null, $metadata = null, $error = null) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $log_data = array(
            'action' => $action,
            'attachment_id' => $attachment_id,
            'timestamp' => current_time('c'),
            'metadata_summary' => array(
                'title' => $metadata['title'] ?? null,
                // phpcs:disable WordPress.Security.NonceVerification.Missing
                'file_type' => isset($_FILES['file']['type']) ? sanitize_text_field($_FILES['file']['type']) : null,
                'file_size' => isset($_FILES['file']['size']) ? absint($_FILES['file']['size']) : null,
                // phpcs:enable WordPress.Security.NonceVerification.Missing
                'synthseo_id' => $metadata['synthseo_id'] ?? null
            )
        );
        
        if ($error) {
            $log_data['error'] = $error;
        }
        
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('SynthSEO Media: ' . wp_json_encode($log_data));
        }
    }
}