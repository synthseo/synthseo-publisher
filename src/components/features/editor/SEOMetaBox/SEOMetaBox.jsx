import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { Input } from '../../../forms/Input';
import { Divider } from '../../../layout/Divider';
import { Alert } from '../../../ui/Alert';
import classNames from 'classnames';

const SEOMetaBox = ({ 
  postId, 
  postTitle = '', 
  postContent = '',
  onUpdate,
  initialData = {} 
}) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [seoData, setSeoData] = useState({
    metaTitle: initialData.metaTitle || '',
    metaDescription: initialData.metaDescription || '',
    focusKeyword: initialData.focusKeyword || '',
    slug: initialData.slug || '',
    canonicalUrl: initialData.canonicalUrl || '',
  });
  
  const [seoScore, setSeoScore] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showNotification, setShowNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const titleInputRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    // Auto-generate meta title if empty
    if (!seoData.metaTitle && postTitle) {
      setSeoData(prev => ({
        ...prev,
        metaTitle: postTitle.substring(0, 60),
      }));
    }
    
    // Title length monitoring
    const titleLength = postTitle?.length || 0;
    if (titleLength > 0 && (titleLength < 30 || titleLength > 60)) {
      setSuggestions(prev => {
        const filtered = prev.filter(s => s.id !== 'title-length');
        return [...filtered, {
          id: 'title-length',
          type: 'info',
          text: __('Title length should be between 30-60 characters for optimal SEO', 'synthseo-publisher'),
          autoHide: true
        }];
      });
    }
  }, [postTitle]);
  
  // Auto-hide suggestions after timeout
  useEffect(() => {
    const autoHideSuggestions = suggestions.filter(s => s.autoHide);
    if (autoHideSuggestions.length > 0) {
      const timeout = setTimeout(() => {
        setSuggestions(prev => prev.filter(s => !s.autoHide));
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [suggestions]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Shift + S to refresh SEO data
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleRefreshSEO();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Animation on mount
  useEffect(() => {
    animationTimeoutRef.current = setTimeout(() => {
      const metaBox = document.querySelector('.synthseo-metabox');
      if (metaBox) {
        metaBox.classList.add('synthseo-animated');
      }
    }, 200);
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handleRefreshSEO = useCallback(async () => {
    setRefreshing(true);
    setShowNotification(null);
    
    try {
      // Simulate API call to refresh SEO data from SaaS
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would fetch fresh data from the API
      setShowNotification({
        type: 'success',
        message: __('SEO data refreshed successfully!', 'synthseo-publisher')
      });
      
      // Auto-dismiss notification
      setTimeout(() => setShowNotification(null), 3000);
      
      // Trigger analyze after refresh
      await analyzeSEO();
    } catch (error) {
      setShowNotification({
        type: 'error',
        message: __('Failed to refresh SEO data', 'synthseo-publisher')
      });
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  const analyzeSEO = async () => {
    setAnalyzing(true);
    
    try {
      // Simulate SEO analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calculate mock SEO score
      let score = 0;
      const newSuggestions = [];
      
      // Check meta title
      if (seoData.metaTitle) {
        score += 20;
        if (seoData.metaTitle.length >= 50 && seoData.metaTitle.length <= 60) {
          score += 10;
        } else {
          newSuggestions.push({
            type: 'warning',
            text: __('Meta title should be between 50-60 characters', 'synthseo-publisher'),
          });
        }
      } else {
        newSuggestions.push({
          type: 'error',
          text: __('Meta title is missing', 'synthseo-publisher'),
        });
      }
      
      // Check meta description
      if (seoData.metaDescription) {
        score += 20;
        if (seoData.metaDescription.length >= 150 && seoData.metaDescription.length <= 160) {
          score += 10;
        } else {
          newSuggestions.push({
            type: 'warning',
            text: __('Meta description should be between 150-160 characters', 'synthseo-publisher'),
          });
        }
      } else {
        newSuggestions.push({
          type: 'error',
          text: __('Meta description is missing', 'synthseo-publisher'),
        });
      }
      
      // Check focus keyword
      if (seoData.focusKeyword) {
        score += 15;
        
        // Check if keyword appears in title
        if (seoData.metaTitle.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
          score += 10;
        } else {
          newSuggestions.push({
            type: 'info',
            text: __('Include focus keyword in meta title', 'synthseo-publisher'),
          });
        }
        
        // Check if keyword appears in description
        if (seoData.metaDescription.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
          score += 5;
        } else {
          newSuggestions.push({
            type: 'info',
            text: __('Include focus keyword in meta description', 'synthseo-publisher'),
          });
        }
      } else {
        newSuggestions.push({
          type: 'warning',
          text: __('No focus keyword set', 'synthseo-publisher'),
        });
      }
      
      setSeoScore(Math.min(score, 100));
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      if (onUpdate) {
        await onUpdate(seoData);
      }
      
      // Show success message
      setSuggestions([{
        type: 'success',
        text: __('SEO settings saved successfully!', 'synthseo-publisher'),
      }]);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuggestions(prev => prev.filter(s => s.type !== 'success'));
      }, 3000);
    } catch (error) {
      setSuggestions([{
        type: 'error',
        text: __('Failed to save SEO settings', 'synthseo-publisher'),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getScoreBadge = () => {
    let variant = 'error';
    let label = __('Poor', 'synthseo-publisher');
    
    if (seoScore >= 80) {
      variant = 'success';
      label = __('Good', 'synthseo-publisher');
    } else if (seoScore >= 60) {
      variant = 'warning';
      label = __('OK', 'synthseo-publisher');
    }
    
    return (
      <div className="flex items-center space-x-2">
        <Badge variant={variant}>
          {label}
        </Badge>
        <span className="text-sm text-gray-600">
          {seoScore}/100
        </span>
      </div>
    );
  };

  return (
    <div className="synthseo-metabox">
      {/* Notification */}
      {showNotification && (
        <div className={classNames(
          'notice is-dismissible synthseo-notice',
          `notice-${showNotification.type}`,
          'mb-4 p-3 rounded-md animate-slide-down'
        )}>
          <p className="m-0">{showNotification.message}</p>
          <button 
            type="button" 
            className="notice-dismiss"
            onClick={() => setShowNotification(null)}
          >
            <span className="screen-reader-text">{__('Dismiss', 'synthseo-publisher')}</span>
          </button>
        </div>
      )}
      
      <Card
        title={__('SEO Settings', 'synthseo-publisher')}
        headerActions={
          <div className="flex items-center gap-3">
            {getScoreBadge()}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefreshSEO}
              loading={refreshing}
              title={__('Refresh SEO data (Ctrl+Shift+S)', 'synthseo-publisher')}
            >
              {refreshing ? (
                <>
                  <span className="dashicons dashicons-update synthseo-spinning"></span>
                  {__('Refreshing...', 'synthseo-publisher')}
                </>
              ) : (
                <>
                  <span className="dashicons dashicons-update"></span>
                  {__('Refresh', 'synthseo-publisher')}
                </>
              )}
            </Button>
          </div>
        }
        collapsible
        defaultCollapsed={false}
        className="synthseo-info-metabox"
      >
        <div className="space-y-4">
        {/* Focus Keyword with animation */}
        <div className="synthseo-spoke-card" style={{ opacity: 0, transform: 'translateY(10px)' }}>
          <Input
            label={__('Focus Keyword', 'synthseo-publisher')}
            value={seoData.focusKeyword}
            onChange={(e) => handleChange('focusKeyword', e.target.value)}
            placeholder={__('Enter your target keyword', 'synthseo-publisher')}
            helpText={__('The main keyword you want to rank for', 'synthseo-publisher')}
          />
        </div>

        <Divider />

        {/* Meta Title with animation */}
        <div className="synthseo-spoke-card" style={{ opacity: 0, transform: 'translateY(10px) '}}>
          <Input
            label={__('Meta Title', 'synthseo-publisher')}
            value={seoData.metaTitle}
            onChange={(e) => handleChange('metaTitle', e.target.value)}
            placeholder={postTitle || __('Enter meta title', 'synthseo-publisher')}
            helpText={`${seoData.metaTitle.length}/60 ${__('characters', 'synthseo-publisher')}`}
            maxLength={60}
          />
          <div className="mt-1">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={classNames(
                  'h-full transition-all',
                  {
                    'bg-green-500': seoData.metaTitle.length >= 50 && seoData.metaTitle.length <= 60,
                    'bg-yellow-500': seoData.metaTitle.length < 50 || seoData.metaTitle.length > 60,
                    'bg-red-500': seoData.metaTitle.length === 0,
                  }
                )}
                style={{ width: `${(seoData.metaTitle.length / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meta Description with animation */}
        <div className="synthseo-spoke-card" style={{ opacity: 0, transform: 'translateY(10px)' }}>
          <Input
            label={__('Meta Description', 'synthseo-publisher')}
            value={seoData.metaDescription}
            onChange={(e) => handleChange('metaDescription', e.target.value)}
            placeholder={__('Enter meta description', 'synthseo-publisher')}
            helpText={`${seoData.metaDescription.length}/160 ${__('characters', 'synthseo-publisher')}`}
            maxLength={160}
            inputClassName="min-h-[80px]"
          />
          <div className="mt-1">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={classNames(
                  'h-full transition-all',
                  {
                    'bg-green-500': seoData.metaDescription.length >= 150 && seoData.metaDescription.length <= 160,
                    'bg-yellow-500': seoData.metaDescription.length < 150 || seoData.metaDescription.length > 160,
                    'bg-red-500': seoData.metaDescription.length === 0,
                  }
                )}
                style={{ width: `${(seoData.metaDescription.length / 160) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* URL Slug */}
        <Input
          label={__('URL Slug', 'synthseo-publisher')}
          value={seoData.slug}
          onChange={(e) => handleChange('slug', e.target.value)}
          placeholder={__('post-url-slug', 'synthseo-publisher')}
          helpText={__('The URL-friendly version of the post title', 'synthseo-publisher')}
        />

        {/* Canonical URL */}
        <Input
          label={__('Canonical URL', 'synthseo-publisher')}
          value={seoData.canonicalUrl}
          onChange={(e) => handleChange('canonicalUrl', e.target.value)}
          placeholder={__('https://example.com/post', 'synthseo-publisher')}
          helpText={__('Optional: Set a canonical URL if this content exists elsewhere', 'synthseo-publisher')}
        />

        <Divider />

        {/* SEO Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {__('SEO Suggestions', 'synthseo-publisher')}
            </h4>
            {suggestions.map((suggestion, index) => (
              <Alert
                key={index}
                type={suggestion.type}
                dismissible
              >
                {suggestion.text}
              </Alert>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3 synthseo-actions">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={loading}
            disabled={loading || analyzing}
          >
            {loading ? __('Saving...', 'synthseo-publisher') : __('Save SEO Settings', 'synthseo-publisher')}
          </Button>
          
          <Button
            variant="secondary"
            onClick={analyzeSEO}
            loading={analyzing}
            disabled={loading || analyzing}
          >
            {analyzing ? __('Analyzing...', 'synthseo-publisher') : __('Analyze SEO', 'synthseo-publisher')}
          </Button>
        </div>

        {analyzing && (
          <LoadingSpinner 
            inline 
            size="sm"
            text={__('Analyzing your content...', 'synthseo-publisher')}
          />
        )}
        </div>
      </Card>
      
      {/* Inline styles for animations */}
      <style>{`
        .synthseo-spinning {
          animation: synthseo-spin 1s linear infinite;
        }
        
        @keyframes synthseo-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .synthseo-metabox.synthseo-animated .synthseo-spoke-card {
          animation: synthseo-fade-in 0.3s ease-out forwards;
        }
        
        .synthseo-metabox.synthseo-animated .synthseo-spoke-card:nth-child(1) {
          animation-delay: 0.1s;
        }
        
        .synthseo-metabox.synthseo-animated .synthseo-spoke-card:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .synthseo-metabox.synthseo-animated .synthseo-spoke-card:nth-child(3) {
          animation-delay: 0.3s;
        }
        
        @keyframes synthseo-fade-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: synthseo-slide-down 0.3s ease-out;
        }
        
        @keyframes synthseo-slide-down {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .synthseo-score-circle {
          transition: all 0.3s ease;
        }
        
        .synthseo-score-circle.synthseo-animate-score {
          animation: synthseo-score-pulse 0.6s ease-out;
        }
        
        @keyframes synthseo-score-pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .synthseo-actions .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export { SEOMetaBox };
export default SEOMetaBox;