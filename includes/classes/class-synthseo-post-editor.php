<?php
/**
 * SynthSEO Post Editor Integration
 * 
 * Handles post editor meta boxes and SEO information display
 * 
 * @package SynthSEO_Publisher
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class SynthSEO_Post_Editor {
    
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_editor_scripts'));
        
        // Ensure meta box works in both classic and block editor
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
        
        // Register meta fields for REST API
        add_action('init', array($this, 'register_meta_fields'));
    }
    
    /**
     * Add meta boxes to post editor
     */
    public function add_meta_boxes() {
        global $post;
        if (!$post) {
            return;
        }
        
        // Check if this post has SynthSEO data OR if we're in demo mode
        $has_synthseo_data = get_post_meta($post->ID, 'synthseo_post_id', true);
        $demo_mode = true; // Temporarily show for all posts to demo the feature
        
        if ($has_synthseo_data || $demo_mode) {
            add_meta_box(
                'synthseo-info',
                'SynthSEO Information',
                array($this, 'render_seo_meta_box'),
                'post',
                'side',
                'high'
            );
            
            // Ensure meta box is compatible with Gutenberg
            add_filter('is_protected_meta', array($this, 'protect_synthseo_meta'), 10, 2);
        }
    }
    
    /**
     * Register meta fields for REST API access
     */
    public function register_meta_fields() {
        // Register SynthSEO meta fields
        register_post_meta('post', '_synthseo_meta_title', array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_post_meta('post', '_synthseo_meta_description', array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_post_meta('post', '_synthseo_focus_keyword', array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_post_meta('post', '_synthseo_slug', array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_post_meta('post', '_synthseo_canonical_url', array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
    }
    
    /**
     * Render the SEO information meta box
     */
    public function render_seo_meta_box($post) {
        // Render React root element for the SEO meta box
        ?>
        <div id="synthseo-editor-root" data-post-id="<?php echo esc_attr($post->ID); ?>">
            <div style="padding: 20px; text-align: center; color: #666;">
                Loading SEO data...
            </div>
        </div>
        <?php
        return;
        
        // Get SEO metadata
        $meta_description = get_post_meta($post->ID, '_meta_description', true);
        $meta_keywords = get_post_meta($post->ID, '_meta_keywords', true);
        $og_title = get_post_meta($post->ID, '_og_title', true);
        $og_description = get_post_meta($post->ID, '_og_description', true);
        $twitter_title = get_post_meta($post->ID, '_twitter_title', true);
        $twitter_description = get_post_meta($post->ID, '_twitter_description', true);
        
        // Get enhanced SynthSEO data (simulating what would come from API)
        $seo_metrics = $this->get_seo_metrics($post->ID);
        $content_metrics = $this->get_content_metrics($post);
        $target_keywords = $this->get_target_keywords($post->ID);
        
        // Calculate SEO score based on available data
        $seo_score = $this->calculate_seo_score($post, array(
            'meta_description' => $meta_description,
            'meta_keywords' => $meta_keywords,
            'og_title' => $og_title,
            'og_description' => $og_description,
            'twitter_title' => $twitter_title,
            'twitter_description' => $twitter_description
        ));
        
        ?>
        <?php if ($is_demo): ?>
        <div class="synthseo-demo-notice">
            <span class="synthseo-demo-icon">⚡</span>
            <div class="synthseo-demo-text">
                <strong>Demo Preview</strong>
                <span>Live data from SynthSEO platform</span>
            </div>
        </div>
        <?php endif; ?>
            
        <!-- SEO Score Overview -->
        <div class="synthseo-score-overview">
            <div class="synthseo-score-main">
                <div class="synthseo-score-circle <?php echo esc_attr($this->get_score_class($seo_metrics['seo_score'])); ?>">
                    <span class="synthseo-score-number"><?php echo esc_html($seo_metrics['seo_score']); ?></span>
                </div>
                <div class="synthseo-score-info">
                    <div class="synthseo-score-title">SEO Score</div>
                    <div class="synthseo-score-status"><?php echo esc_html($this->get_score_status($seo_metrics['seo_score'])); ?></div>
                </div>
            </div>
        </div>
        
        <!-- Key Metrics -->
        <div class="synthseo-key-metrics">
            <div class="synthseo-metric-row">
                <span class="synthseo-metric-icon">📊</span>
                <span class="synthseo-metric-label">Quality</span>
                <span class="synthseo-metric-value"><?php echo esc_html($seo_metrics['overall_quality']); ?>%</span>
            </div>
            <div class="synthseo-metric-row">
                <span class="synthseo-metric-icon">📖</span>
                <span class="synthseo-metric-label">Readability</span>
                <span class="synthseo-metric-value"><?php echo esc_html($seo_metrics['readability']); ?>%</span>
            </div>
            <div class="synthseo-metric-row">
                <span class="synthseo-metric-icon">⚙️</span>
                <span class="synthseo-metric-label">Technical</span>
                <span class="synthseo-metric-value"><?php echo esc_html($seo_metrics['technical']); ?>%</span>
            </div>
        </div>
        
        <!-- Content Stats -->
        <div class="synthseo-content-stats">
            <div class="synthseo-stat-item">
                <span class="synthseo-stat-number"><?php echo esc_html(number_format($content_metrics['word_count'])); ?></span>
                <span class="synthseo-stat-label">Words</span>
            </div>
            <div class="synthseo-stat-item">
                <span class="synthseo-stat-number"><?php echo esc_html($content_metrics['read_time']); ?></span>
                <span class="synthseo-stat-label">Min Read</span>
            </div>
            <div class="synthseo-stat-item">
                <span class="synthseo-stat-number"><?php echo esc_html($content_metrics['section_count']); ?></span>
                <span class="synthseo-stat-label">Sections</span>
            </div>
        </div>
            
        <!-- Keyword Strategy -->
        <?php if (!empty($target_keywords['primary'])): ?>
        <div class="synthseo-keyword-strategy">
            <div class="synthseo-section-header">
                <span class="synthseo-section-icon">🎯</span>
                <span class="synthseo-section-title">Keyword Strategy</span>
            </div>
            
            <!-- Hub Alignment -->
            <div class="synthseo-hub-alignment">
                <div class="synthseo-hub-title">Hub Alignment</div>
                <div class="synthseo-hub-description">
                    <?php echo esc_html($target_keywords['hub_description'] ?? 'Synthesizes all prior topics into advanced, bespoke consulting solutions.'); ?>
                </div>
            </div>
            
            <!-- Primary Keyword -->
            <div class="synthseo-primary-keyword-card">
                <div class="synthseo-keyword-header">
                    <span class="synthseo-keyword-badge">HUB KEYWORD</span>
                    <span class="synthseo-keyword-strength">High Strength</span>
                </div>
                <div class="synthseo-keyword-name"><?php echo esc_html($target_keywords['primary']['keyword']); ?></div>
                <div class="synthseo-keyword-metrics">
                    <div class="synthseo-metric-item">
                        <span class="synthseo-metric-label">VOLUME</span>
                        <span class="synthseo-metric-value"><?php echo esc_html($target_keywords['primary']['search_volume'] ?? '0'); ?></span>
                    </div>
                    <div class="synthseo-metric-item">
                        <span class="synthseo-metric-label">COMPETITION</span>
                        <span class="synthseo-metric-value"><?php echo esc_html($target_keywords['primary']['competition'] ?? 'N/A'); ?></span>
                    </div>
                    <div class="synthseo-metric-item">
                        <span class="synthseo-metric-label">TREND</span>
                        <span class="synthseo-metric-value"><?php echo esc_html($target_keywords['primary']['trend'] ?? 'Stable'); ?></span>
                    </div>
                </div>
            </div>
            
            
            <!-- Sub-Spoke Details -->
            <?php if (!empty($target_keywords['sub_spokes'])): ?>
            <div class="synthseo-sub-spokes">
                <div class="synthseo-sub-spoke-title">Sub-Spoke Details</div>
                <?php foreach (array_slice($target_keywords['sub_spokes'], 0, 2) as $sub_spoke): ?>
                <div class="synthseo-sub-spoke-item">
                    <div class="synthseo-sub-spoke-header">
                        <span class="synthseo-sub-spoke-badge"><?php echo esc_html($sub_spoke['category'] ?? 'Advanced Cloud Consulting Spoke'); ?></span>
                        <span class="synthseo-sub-spoke-strength"><?php echo esc_html($sub_spoke['strength'] ?? 'Medium Strength'); ?></span>
                    </div>
                    <div class="synthseo-sub-spoke-name"><?php echo esc_html($sub_spoke['keyword']); ?></div>
                    <div class="synthseo-sub-spoke-description"><?php echo esc_html($sub_spoke['description']); ?></div>
                    <div class="synthseo-sub-spoke-metrics">
                        <div class="synthseo-metric">
                            <span class="synthseo-metric-label">VOLUME</span>
                            <span class="synthseo-metric-value"><?php echo esc_html($sub_spoke['volume'] ?? '25'); ?></span>
                        </div>
                        <div class="synthseo-metric">
                            <span class="synthseo-metric-label">COMPETITION</span>
                            <span class="synthseo-metric-value"><?php echo esc_html($sub_spoke['competition'] ?? 'Low'); ?></span>
                        </div>
                        <div class="synthseo-metric">
                            <span class="synthseo-metric-label">CPC RANGE</span>
                            <span class="synthseo-metric-value"><?php echo esc_html($sub_spoke['cpc_range'] ?? 'N/A'); ?></span>
                        </div>
                        <div class="synthseo-metric">
                            <span class="synthseo-metric-label">TREND</span>
                            <span class="synthseo-metric-value"><?php echo esc_html($sub_spoke['trend'] ?? 'Stable'); ?></span>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
        <?php endif; ?>
            
        <!-- Quick Actions -->
        <div class="synthseo-actions">
            <a href="<?php echo esc_url(get_permalink($post->ID)); ?>" class="synthseo-action-btn synthseo-btn-primary" target="_blank">
                <span class="synthseo-btn-icon">👁️</span>
                View Post
            </a>
            <button type="button" class="synthseo-action-btn synthseo-btn-secondary" onclick="synthseoRefreshSEOData(<?php echo esc_js($post->ID); ?>)">
                <span class="synthseo-btn-icon">🔄</span>
                Refresh Data
            </button>
        </div>
        
        <!-- Post Info -->
        <div class="synthseo-post-info">
            <div class="synthseo-info-row">
                <span class="synthseo-info-label">ID:</span>
                <code class="synthseo-info-value"><?php echo esc_html($synthseo_id); ?></code>
            </div>
            <?php if ($post_language): ?>
            <div class="synthseo-info-row">
                <span class="synthseo-info-label">Language:</span>
                <span class="synthseo-language-tag"><?php echo esc_html(strtoupper($post_language)); ?></span>
            </div>
            <?php endif; ?>
            <div class="synthseo-info-row">
                <span class="synthseo-info-label">Published:</span>
                <span class="synthseo-info-value"><?php echo get_the_date('M j, Y', $post->ID); ?></span>
            </div>
        </div>
        <?php
    }

    /**
     * Enqueue inline styles for the meta box
     */
    public function enqueue_meta_box_styles() {
        $custom_css = '
        /* Modern Meta Box Styles */
        #synthseo-info .inside {
            padding: 0 !important;
            margin: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        /* Force collapse behavior */
        #synthseo-info.closed .inside {
            display: none !important;
        }
        
        /* Demo Notice */
        .synthseo-demo-notice {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0 0 16px 0;
            border-radius: 8px;
        }
        
        .synthseo-demo-icon {
            font-size: 16px;
            filter: brightness(1.2);
        }
        
        .synthseo-demo-text strong {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .synthseo-demo-text span {
            font-size: 11px;
            opacity: 0.9;
        }
        
        /* SEO Score Overview */
        .synthseo-score-overview {
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        
        .synthseo-score-main {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .synthseo-score-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
            color: white;
            position: relative;
        }
        
        .synthseo-score-circle.excellent {
            background: linear-gradient(135deg, #10b981, #059669);
            box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);
        }
        
        .synthseo-score-circle.good {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.3);
        }
        
        .synthseo-score-circle.needs-improvement {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3);
        }
        
        .synthseo-score-info {
            flex: 1;
        }
        
        .synthseo-score-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 2px;
        }
        
        .synthseo-score-status {
            font-size: 12px;
            color: #6b7280;
        }
        
        /* Key Metrics */
        .synthseo-key-metrics {
            background: white;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid #e5e7eb;
        }
        
        .synthseo-metric-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .synthseo-metric-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .synthseo-metric-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
        }
        
        .synthseo-metric-label {
            flex: 1;
            font-size: 13px;
            color: #374151;
            font-weight: 500;
        }
        
        .synthseo-metric-value {
            font-size: 13px;
            font-weight: 600;
            color: #059669;
            background: #d1fae5;
            padding: 2px 8px;
            border-radius: 12px;
        }
        
        /* Content Stats */
        .synthseo-content-stats {
            display: flex;
            gap: 1px;
            margin-bottom: 16px;
            border-radius: 8px;
            overflow: hidden;
            background: #e5e7eb;
        }
        
        .synthseo-stat-item {
            flex: 1;
            background: white;
            padding: 12px 8px;
            text-align: center;
        }
        
        .synthseo-stat-number {
            display: block;
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 2px;
        }
        
        .synthseo-stat-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        
        /* Primary Keyword */
        .synthseo-primary-keyword {
            background: white;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid #e5e7eb;
        }
        
        .synthseo-keyword-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .synthseo-keyword-icon {
            font-size: 16px;
        }
        
        .synthseo-keyword-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
        }
        
        .synthseo-keyword-name {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .synthseo-keyword-stats {
            display: flex;
            gap: 8px;
        }
        
        .synthseo-difficulty {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .synthseo-difficulty-low {
            background: #d1fae5;
            color: #059669;
        }
        
        .synthseo-search-volume {
            color: #6b7280;
            font-size: 11px;
            padding: 3px 8px;
            background: #f3f4f6;
            border-radius: 12px;
        }
        
        /* Keyword Strategy */
        .synthseo-keyword-strategy {
            background: white;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid #e5e7eb;
        }
        
        .synthseo-section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .synthseo-section-icon {
            font-size: 16px;
        }
        
        .synthseo-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
        }
        
        /* Hub Alignment */
        .synthseo-hub-alignment {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
        }
        
        .synthseo-hub-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }
        
        .synthseo-hub-description {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        /* Primary Keyword Card */
        .synthseo-primary-keyword-card {
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .synthseo-keyword-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .synthseo-keyword-badge {
            background: #dbeafe;
            color: #1e40af;
            font-size: 9px;
            font-weight: 600;
            padding: 3px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .synthseo-keyword-strength {
            font-size: 10px;
            color: #059669;
            font-weight: 500;
        }
        
        .synthseo-keyword-name {
            font-size: 15px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
            text-align: center;
        }
        
        .synthseo-keyword-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        
        .synthseo-metric-item {
            text-align: center;
        }
        
        .synthseo-metric-item .synthseo-metric-label {
            display: block;
            font-size: 8px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .synthseo-metric-item .synthseo-metric-value {
            display: block;
            font-size: 11px;
            color: #374151;
            font-weight: 600;
        }
        
        /* Spoke Keywords */
        .synthseo-spoke-keywords {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .synthseo-spoke-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #10b981;
            border-radius: 6px;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            opacity: 0.7;
            transform: translateY(10px);
            transition: all 0.3s ease;
        }
        
        .synthseo-spoke-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        
        .synthseo-spoke-badge {
            background: #ecfdf5;
            color: #059669;
            font-size: 8px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .synthseo-spoke-name {
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 6px;
        }
        
        .synthseo-spoke-volume {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #6b7280;
        }
        
        .synthseo-volume-icon {
            font-size: 12px;
        }
        
        .synthseo-spoke-difficulty {
            font-size: 8px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 10px;
            text-transform: lowercase;
        }
        
        .synthseo-difficulty-low {
            background: #d1fae5;
            color: #059669;
        }
        
        .synthseo-difficulty-medium {
            background: #fef3c7;
            color: #d97706;
        }
        
        .synthseo-difficulty-high {
            background: #fee2e2;
            color: #dc2626;
        }
        
        /* Sub-Spoke Details */
        .synthseo-sub-spokes {
            margin-top: 16px;
        }
        
        .synthseo-sub-spoke-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
        }
        
        .synthseo-sub-spoke-item {
            background: #f8fafc;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            border-left: 3px solid #3b82f6;
        }
        
        .synthseo-sub-spoke-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .synthseo-sub-spoke-badge {
            background: #dbeafe;
            color: #1e40af;
            font-size: 9px;
            font-weight: 500;
            padding: 3px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .synthseo-sub-spoke-strength {
            font-size: 10px;
            color: #059669;
            font-weight: 500;
        }
        
        .synthseo-sub-spoke-name {
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 6px;
        }
        
        .synthseo-sub-spoke-description {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
            margin-bottom: 10px;
        }
        
        .synthseo-sub-spoke-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }
        
        .synthseo-sub-spoke-metrics .synthseo-metric {
            text-align: center;
        }
        
        .synthseo-sub-spoke-metrics .synthseo-metric-label {
            display: block;
            font-size: 8px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .synthseo-sub-spoke-metrics .synthseo-metric-value {
            display: block;
            font-size: 10px;
            color: #374151;
            font-weight: 600;
        }
        
        /* Actions */
        .synthseo-actions {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .synthseo-action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .synthseo-btn-primary {
            background: #3b82f6;
            color: white;
        }
        
        .synthseo-btn-primary:hover {
            background: #2563eb;
            color: white;
            text-decoration: none;
        }
        
        .synthseo-btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        
        .synthseo-btn-secondary:hover {
            background: #e5e7eb;
        }
        
        .synthseo-btn-icon {
            font-size: 14px;
        }
        
        /* Post Info */
        .synthseo-post-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 16px;
        }
        
        .synthseo-info-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .synthseo-info-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .synthseo-info-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
        }
        
        .synthseo-info-value {
            font-size: 12px;
            color: #334155;
            font-weight: 500;
        }
        
        .synthseo-info-value code {
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #475569;
        }
        
        .synthseo-language-tag {
            background: #3b82f6;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        ';

        wp_add_inline_style('synthseo-editor-styles', $custom_css);
    }
    
    /**
     * Calculate SEO score based on available metadata
     */
    private function calculate_seo_score($post, $seo_data) {
        $score = 0;
        $max_score = 100;
        
        // Title score (20 points)
        $title = $post->post_title;
        if (!empty($title)) {
            $title_length = strlen($title);
            if ($title_length >= 30 && $title_length <= 60) {
                $score += 20;
            } elseif ($title_length >= 20 && $title_length <= 70) {
                $score += 15;
            } elseif (!empty($title)) {
                $score += 10;
            }
        }
        
        // Meta description score (25 points)
        if (!empty($seo_data['meta_description'])) {
            $desc_length = strlen($seo_data['meta_description']);
            if ($desc_length >= 120 && $desc_length <= 160) {
                $score += 25;
            } elseif ($desc_length >= 100 && $desc_length <= 180) {
                $score += 20;
            } else {
                $score += 15;
            }
        }
        
        // Content length score (15 points)
        $content_length = strlen(wp_strip_all_tags($post->post_content));
        if ($content_length >= 300) {
            $score += 15;
        } elseif ($content_length >= 150) {
            $score += 10;
        } elseif ($content_length >= 50) {
            $score += 5;
        }
        
        // Keywords score (10 points)
        if (!empty($seo_data['meta_keywords'])) {
            $score += 10;
        }
        
        // Social media optimization (20 points)
        $social_score = 0;
        if (!empty($seo_data['og_title'])) $social_score += 5;
        if (!empty($seo_data['og_description'])) $social_score += 5;
        if (!empty($seo_data['twitter_title'])) $social_score += 5;
        if (!empty($seo_data['twitter_description'])) $social_score += 5;
        $score += $social_score;
        
        // Featured image (10 points)
        if (has_post_thumbnail($post->ID)) {
            $score += 10;
        }
        
        return min($score, $max_score);
    }
    
    /**
     * Get CSS class for score display
     */
    private function get_score_class($score) {
        if ($score >= 80) {
            return 'excellent';
        } elseif ($score >= 60) {
            return 'good';
        } else {
            return 'needs-improvement';
        }
    }
    
    /**
     * Get status text for score
     */
    private function get_score_status($score) {
        if ($score >= 80) {
            return 'Excellent SEO';
        } elseif ($score >= 60) {
            return 'Good SEO';
        } else {
            return 'Needs Improvement';
        }
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
     * Enqueue scripts for the post editor
     */
    public function enqueue_editor_scripts($hook) {
        if ($hook !== 'post.php' && $hook !== 'post-new.php') {
            return;
        }

        // Enqueue base styles for editor
        wp_enqueue_style(
            'synthseo-editor-styles',
            SYNTHSEO_PUBLISHER_URL . 'assets/editor.css',
            array(),
            SYNTHSEO_VERSION
        );

        // Add inline styles for meta box
        $this->enqueue_meta_box_styles();
        
        // Check if React build exists
        $editor_build = $this->get_build_file('editor');
        
        if ($editor_build) {
            // Load React bundle
            $asset_file = $this->get_asset_file('editor');
            
            wp_enqueue_script(
                'synthseo-editor-react',
                SYNTHSEO_PUBLISHER_URL . 'build/' . $editor_build,
                $asset_file['dependencies'],
                $asset_file['version'],
                true
            );
            
            // Check for CSS file
            $css_file = str_replace('.js', '.css', $editor_build);
            if (file_exists(SYNTHSEO_PUBLISHER_PATH . 'build/' . $css_file)) {
                wp_enqueue_style(
                    'synthseo-editor-react',
                    SYNTHSEO_PUBLISHER_URL . 'build/' . $css_file,
                    array('wp-components'),
                    $asset_file['version']
                );
            }
            
            // Pass data to React
            global $post;
            wp_localize_script('synthseo-editor-react', 'synthseoEditor', array(
                'nonce' => wp_create_nonce('wp_rest'),
                'apiUrl' => rest_url('synthseo/v2/'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'postId' => $post ? $post->ID : null,
                'restUrl' => rest_url(),
                'restNonce' => wp_create_nonce('wp_rest')
            ));
        } else {
            // React build not found - log error
            error_log('SynthSEO: React build files not found. Please run npm run build.');
        }
    }
    
    /**
     * Enqueue block editor assets
     */
    public function enqueue_block_editor_assets() {
        // Check if React build exists for block editor
        $editor_build = $this->get_build_file('editor');
        
        if ($editor_build) {
            $asset_file = $this->get_asset_file('editor');
            
            wp_enqueue_script(
                'synthseo-block-editor',
                SYNTHSEO_PUBLISHER_URL . 'build/' . $editor_build,
                array_merge($asset_file['dependencies'], array('wp-blocks', 'wp-dom-ready', 'wp-edit-post')),
                $asset_file['version'],
                true
            );
            
            wp_localize_script('synthseo-block-editor', 'synthseo_editor', array(
                'nonce' => wp_create_nonce('synthseo_editor'),
                'ajax_url' => admin_url('admin-ajax.php'),
                'restUrl' => rest_url(),
                'restNonce' => wp_create_nonce('wp_rest')
            ));
        }
    }
    
    /**
     * Get SEO metrics (from stored SynthSEO data or simulated)
     */
    private function get_seo_metrics($post_id) {
        // Try to get stored SynthSEO metrics first
        $stored_metrics = get_post_meta($post_id, 'synthseo_seo_metrics', true);
        if (!empty($stored_metrics) && is_array($stored_metrics)) {
            return $stored_metrics;
        }
        
        // Fallback: simulate based on available data
        $meta_description = get_post_meta($post_id, '_meta_description', true);
        $meta_keywords = get_post_meta($post_id, '_meta_keywords', true);
        $og_data = get_post_meta($post_id, '_og_title', true);
        $twitter_data = get_post_meta($post_id, '_twitter_title', true);
        
        $post = get_post($post_id);
        $content_length = strlen(wp_strip_all_tags($post->post_content));
        $has_featured_image = has_post_thumbnail($post_id);
        
        $overall_quality = 77;
        $readability = 78;
        $technical = 90;
        
        // Calculate SEO score based on available elements
        $seo_score = 60; // Base score
        if (!empty($meta_description)) $seo_score += 10;
        if (!empty($meta_keywords)) $seo_score += 5;
        if (!empty($og_data)) $seo_score += 8;
        if (!empty($twitter_data)) $seo_score += 7;
        if ($has_featured_image) $seo_score += 5;
        if ($content_length > 500) $seo_score += 5;
        
        return array(
            'overall_quality' => $overall_quality,
            'readability' => $readability,
            'seo_score' => min($seo_score, 100),
            'technical' => $technical
        );
    }
    
    /**
     * Get content metrics (from stored data or calculated)
     */
    private function get_content_metrics($post) {
        // Try to get stored content metrics first
        $stored_metrics = get_post_meta($post->ID, 'synthseo_content_metrics', true);
        if (!empty($stored_metrics) && is_array($stored_metrics)) {
            return $stored_metrics;
        }
        
        // Fallback: calculate from content
        $content = wp_strip_all_tags($post->post_content);
        $word_count = str_word_count($content);
        $read_time = max(1, round($word_count / 200)); // Average reading speed
        
        // Count sections (h2, h3 tags)
        $section_count = substr_count($post->post_content, '<h2') + 
                        substr_count($post->post_content, '<h3');
        
        return array(
            'word_count' => $word_count,
            'read_time' => $read_time,
            'section_count' => max(1, $section_count)
        );
    }
    
    /**
     * Get target keywords (from stored SynthSEO data or simulated)
     */
    private function get_target_keywords($post_id) {
        // Try to get stored keyword strategy first (enhanced hub/spoke data)
        $stored_strategy = get_post_meta($post_id, 'synthseo_keyword_strategy', true);
        if (!empty($stored_strategy) && is_array($stored_strategy)) {
            return $stored_strategy;
        }
        
        // Fallback to legacy target keywords
        $stored_keywords = get_post_meta($post_id, 'synthseo_target_keywords', true);
        if (!empty($stored_keywords) && is_array($stored_keywords)) {
            return $stored_keywords;
        }
        
        // Fallback: simulate from available data
        $meta_keywords = get_post_meta($post_id, '_meta_keywords', true);
        $post = get_post($post_id);
        
        // Extract keywords from title and content for simulation
        $title_words = explode(' ', strtolower($post->post_title));
        $common_words = array('the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were');
        $keywords = array_diff($title_words, $common_words);
        
        if (!empty($meta_keywords)) {
            $focus_keywords = array_map('trim', explode(',', $meta_keywords));
        } else {
            $focus_keywords = array_slice($keywords, 0, 3);
        }
        
        // Simulate primary keyword from post title or meta keywords
        $title_words = explode(' ', strtolower($post->post_title));
        $relevant_words = array_filter($title_words, function($word) {
            return strlen($word) > 4 && !in_array($word, array('with', 'from', 'this', 'that', 'will', 'can'));
        });
        
        $primary_keyword = !empty($focus_keywords) ? $focus_keywords[0] : 
                          (!empty($relevant_words) ? implode(' ', array_slice($relevant_words, 0, 2)) : 'mendalami');
        
        return array(
            'primary' => array(
                'keyword' => $primary_keyword,
                'difficulty' => 'Low',
                'search_volume' => '0',
                'competition' => 'N/A',
                'cpc_range' => 'N/A',
                'trend' => 'Stable'
            ),
            'hub_description' => 'Synthesizes all prior topics into advanced, bespoke consulting solutions.',
            'spokes' => array(
                array(
                    'keyword' => 'multi-cloud integration',
                    'volume' => '25',
                    'difficulty' => 'low'
                ),
                array(
                    'keyword' => 'hybrid-cloud automation',
                    'volume' => '15',
                    'difficulty' => 'low'
                ),
                array(
                    'keyword' => 'cloud governance',
                    'volume' => '18',
                    'difficulty' => 'medium'
                ),
                array(
                    'keyword' => 'infrastructure optimization',
                    'volume' => '32',
                    'difficulty' => 'low'
                )
            ),
            'sub_spokes' => array(
                array(
                    'category' => 'Advanced Cloud Consulting Spoke',
                    'strength' => 'Medium Strength',
                    'keyword' => 'multi-cloud integration',
                    'description' => 'Integration challenges and solutions for multi-cloud environments',
                    'volume' => '25',
                    'competition' => 'Low',
                    'cpc_range' => 'N/A',
                    'trend' => 'Stable'
                ),
                array(
                    'category' => 'Advanced Cloud Consulting Spoke',
                    'strength' => 'Medium Strength',
                    'keyword' => 'hybrid-cloud automation',
                    'description' => 'Automation strategies for hybrid infrastructures',
                    'volume' => '15',
                    'competition' => 'Low',
                    'cpc_range' => 'N/A',
                    'trend' => 'Stable'
                )
            ),
            // Legacy support for existing integrations
            'focus' => array_slice($focus_keywords, 0, 3),
            'related' => array(
                'cloud orchestration',
                'DevOps integration', 
                'policy-driven management',
                'cloud automation',
                'enterprise solutions'
            )
        );
    }
    
    /**
     * Protect SynthSEO meta from showing in Gutenberg meta fields
     */
    public function protect_synthseo_meta($protected, $meta_key) {
        $synthseo_meta_keys = array(
            'synthseo_post_id',
            'synthseo_metadata',
            'synthseo_content_metrics',
            'synthseo_seo_metrics',
            'synthseo_target_keywords'
        );
        
        if (in_array($meta_key, $synthseo_meta_keys)) {
            return true;
        }
        
        return $protected;
    }
}