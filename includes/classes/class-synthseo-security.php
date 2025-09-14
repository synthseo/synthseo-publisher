<?php
/**
 * SynthSEO Security
 * 
 * Handles authentication, authorization, and security features
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Security {
    
    private $rate_limit_table;
    
    public function __construct() {
        global $wpdb;
        $this->rate_limit_table = $wpdb->prefix . 'synthseo_rate_limits';
    }
    
    /**
     * Verify API request (v2 endpoints)
     */
    public function verify_request($request) {
        // Check rate limiting first
        if (!$this->check_rate_limit($request)) {
            return new WP_Error(
                'rate_limit_exceeded',
                'Rate limit exceeded. Please try again later.',
                array('status' => 429)
            );
        }
        
        // Get authentication token
        $auth_token = $this->get_auth_token($request);
        if (!$auth_token) {
            return new WP_Error(
                'missing_authentication',
                'Authentication token required',
                array('status' => 401)
            );
        }
        
        // Verify the token
        $client_id = $this->verify_auth_token($auth_token);
        if (!$client_id) {
            return new WP_Error(
                'invalid_authentication',
                'Invalid authentication token',
                array('status' => 401)
            );
        }
        
        // Log the request
        $this->log_request($request, $client_id);
        
        return true;
    }
    
    /**
     * Verify legacy API request (v1 endpoints for backward compatibility)
     */
    public function verify_legacy_request($request) {
        // Check rate limiting
        if (!$this->check_rate_limit($request)) {
            return new WP_Error(
                'rate_limit_exceeded',
                'Rate limit exceeded. Please try again later.',
                array('status' => 429)
            );
        }
        
        // Get legacy API key
        $api_key = $request->get_header('X-Api-Key');
        if (!$api_key) {
            return false;
        }
        
        // Verify against stored API key
        $stored_api_key = get_option('synthseo_api_key');
        if (!$stored_api_key || !hash_equals($stored_api_key, $api_key)) {
            return false;
        }
        
        // Log the legacy request
        $this->log_request($request, 'legacy');
        
        return true;
    }
    
    /**
     * Get authentication token from request
     */
    private function get_auth_token($request) {
        // Try Authorization header first (Bearer token)
        $auth_header = $request->get_header('Authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            return substr($auth_header, 7);
        }
        
        // Fallback to X-Auth-Token header
        $token = $request->get_header('X-Auth-Token');
        if ($token) {
            return $token;
        }
        
        // Fallback to legacy X-Api-Key for gradual migration
        $api_key = $request->get_header('X-Api-Key');
        if ($api_key) {
            return $api_key;
        }
        
        return null;
    }
    
    /**
     * Verify authentication token
     * TODO: Implement proper JWT verification in Phase 1.2
     */
    private function verify_auth_token($token) {
        // For now, check against stored API key (legacy support)
        $stored_api_key = get_option('synthseo_api_key');
        if ($stored_api_key && hash_equals($stored_api_key, $token)) {
            return 'legacy_client';
        }
        
        // TODO: Add JWT token verification here
        // This is a placeholder for Phase 1.2 JWT implementation
        
        return false;
    }
    
    /**
     * Check rate limiting
     */
    private function check_rate_limit($request) {
        global $wpdb;
        
        // Get client identifier (IP for now, will use client_id from JWT later)
        $client_id = $this->get_client_identifier($request);
        
        // Get current window start (per minute)
        $window_start = gmdate('Y-m-d H:i:00');
        
        // Check current count
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $current_count = $wpdb->get_var($wpdb->prepare(
            "SELECT request_count FROM {$this->rate_limit_table} 
             WHERE client_id = %s AND window_start = %s",
            $client_id,
            $window_start
        ));
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        
        // Rate limit: 100 requests per minute
        $rate_limit = apply_filters('synthseo_rate_limit', 100);
        
        if ($current_count && $current_count >= $rate_limit) {
            return false;
        }
        
        // Update or insert count
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query($wpdb->prepare(
            "INSERT INTO {$this->rate_limit_table} (client_id, request_count, window_start) 
             VALUES (%s, 1, %s) 
             ON DUPLICATE KEY UPDATE request_count = request_count + 1",
            $client_id,
            $window_start
        ));
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        
        return true;
    }
    
    /**
     * Get client identifier for rate limiting
     */
    private function get_client_identifier($request) {
        // Use IP address for now
        $ip = $this->get_client_ip();
        
        // TODO: Use client_id from JWT token when implemented
        
        return 'ip_' . $ip;
    }
    
    /**
     * Get client IP address
     */
    private function get_client_ip() {
        // Check for various headers that might contain the real IP
        $headers = array(
            'HTTP_CF_CONNECTING_IP',     // CloudFlare
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        );
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = sanitize_text_field(wp_unslash($_SERVER[$header]));
                // Handle comma-separated IPs (from proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '0.0.0.0';
    }
    
    /**
     * Log API requests for monitoring
     */
    private function log_request($request, $client_id) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $log_data = array(
            'timestamp' => current_time('c'),
            'client_id' => $client_id,
            'method' => $request->get_method(),
            'endpoint' => $request->get_route(),
            'ip' => $this->get_client_ip(),
            'user_agent' => $request->get_header('User-Agent')
        );
        
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('SynthSEO API Request: ' . wp_json_encode($log_data));
        }
    }
    
    /**
     * Generate new API key
     */
    public function generate_api_key() {
        return wp_generate_password(32, false);
    }
    
    /**
     * Hash API key for storage
     */
    public function hash_api_key($api_key) {
        return wp_hash_password($api_key);
    }
    
    /**
     * Verify hashed API key
     */
    public function verify_api_key($api_key, $hash) {
        return wp_check_password($api_key, $hash);
    }
    
    /**
     * Clean up old rate limit records
     */
    public function cleanup_rate_limits() {
        global $wpdb;
        
        // Delete records older than 24 hours
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$this->rate_limit_table} 
             WHERE window_start < %s",
            gmdate('Y-m-d H:i:s', strtotime('-24 hours'))
        ));
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
    }
    
    /**
     * Validate request data for security
     */
    public function validate_request_data($data) {
        // Basic validation to prevent common attacks
        
        // Check for excessively large payloads
        $max_size = apply_filters('synthseo_max_request_size', 10 * 1024 * 1024); // 10MB default
        if (strlen(wp_json_encode($data)) > $max_size) {
            return new WP_Error(
                'request_too_large',
                'Request payload too large',
                array('status' => 413)
            );
        }
        
        // Check for suspicious patterns in content
        if (!empty($data['content'])) {
            if ($this->contains_suspicious_content($data['content'])) {
                return new WP_Error(
                    'suspicious_content',
                    'Content contains suspicious patterns',
                    array('status' => 400)
                );
            }
        }
        
        return true;
    }
    
    /**
     * Check for suspicious content patterns
     */
    private function contains_suspicious_content($content) {
        // Check for common attack patterns
        $suspicious_patterns = array(
            '/<script[^>]*>.*?<\/script>/is',
            '/javascript:/i',
            '/vbscript:/i',
            '/onload\s*=/i',
            '/onerror\s*=/i',
            '/onclick\s*=/i',
            '/<iframe[^>]*>/i',
            '/<object[^>]*>/i',
            '/<embed[^>]*>/i'
        );
        
        foreach ($suspicious_patterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }
        
        return false;
    }
}