import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Alert } from '../../../ui/Alert';
import { List } from '../../../data/List';
import { Badge } from '../../../ui/Badge';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';

const SEOSuggestions = ({ 
  postData = {},
  focusKeyword = '',
  onSuggestionApply 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    analyzeSEO();
  }, [postData, focusKeyword]);

  const analyzeSEO = async () => {
    setAnalyzing(true);
    
    try {
      // Simulate SEO analysis
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newSuggestions = [];
      
      // Title checks
      if (postData.title) {
        if (postData.title.length < 30) {
          newSuggestions.push({
            id: 'title-short',
            type: 'error',
            category: 'title',
            priority: 'high',
            text: __('Title is too short', 'synthseo-publisher'),
            detail: __('Your title should be at least 30 characters for better SEO.', 'synthseo-publisher'),
            action: () => {
              // Suggest improvement
              if (onSuggestionApply) {
                onSuggestionApply('title', postData.title + ' - Complete Guide');
              }
            },
          });
        }
        
        if (focusKeyword && !postData.title.toLowerCase().includes(focusKeyword.toLowerCase())) {
          newSuggestions.push({
            id: 'title-keyword',
            type: 'warning',
            category: 'title',
            priority: 'high',
            text: __('Focus keyword missing in title', 'synthseo-publisher'),
            detail: __('Including your focus keyword in the title helps with rankings.', 'synthseo-publisher'),
            action: () => {
              if (onSuggestionApply) {
                onSuggestionApply('title', `${focusKeyword} - ${postData.title}`);
              }
            },
          });
        }
      } else {
        newSuggestions.push({
          id: 'title-missing',
          type: 'error',
          category: 'title',
          priority: 'critical',
          text: __('Missing title', 'synthseo-publisher'),
          detail: __('Every post needs a compelling title for SEO.', 'synthseo-publisher'),
        });
      }
      
      // Meta description checks
      if (postData.metaDescription) {
        if (postData.metaDescription.length < 120) {
          newSuggestions.push({
            id: 'desc-short',
            type: 'warning',
            category: 'meta',
            priority: 'medium',
            text: __('Meta description too short', 'synthseo-publisher'),
            detail: __('Aim for 150-160 characters to maximize your search snippet.', 'synthseo-publisher'),
          });
        }
        
        if (focusKeyword && !postData.metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) {
          newSuggestions.push({
            id: 'desc-keyword',
            type: 'info',
            category: 'meta',
            priority: 'medium',
            text: __('Focus keyword missing in description', 'synthseo-publisher'),
            detail: __('Including your keyword in the meta description can improve CTR.', 'synthseo-publisher'),
          });
        }
      } else {
        newSuggestions.push({
          id: 'desc-missing',
          type: 'error',
          category: 'meta',
          priority: 'high',
          text: __('Missing meta description', 'synthseo-publisher'),
          detail: __('A compelling meta description improves click-through rates.', 'synthseo-publisher'),
        });
      }
      
      // Content checks
      const wordCount = (postData.content || '').split(/\s+/).filter(word => word.length > 0).length;
      
      if (wordCount < 300) {
        newSuggestions.push({
          id: 'content-short',
          type: 'warning',
          category: 'content',
          priority: 'high',
          text: __('Content is too short', 'synthseo-publisher'),
          detail: __(`Your content has ${wordCount} words. Aim for at least 300 words.`, 'synthseo-publisher'),
        });
      }
      
      // Heading checks
      const hasH1 = /<h1/i.test(postData.content || '');
      const hasH2 = /<h2/i.test(postData.content || '');
      
      if (!hasH2) {
        newSuggestions.push({
          id: 'headings-missing',
          type: 'info',
          category: 'structure',
          priority: 'medium',
          text: __('No subheadings found', 'synthseo-publisher'),
          detail: __('Use H2 tags to structure your content and improve readability.', 'synthseo-publisher'),
        });
      }
      
      // Image checks
      const hasImages = /<img/i.test(postData.content || '');
      const hasAltText = /alt=["'][^"']+["']/i.test(postData.content || '');
      
      if (!hasImages) {
        newSuggestions.push({
          id: 'images-missing',
          type: 'info',
          category: 'media',
          priority: 'low',
          text: __('No images found', 'synthseo-publisher'),
          detail: __('Adding relevant images can improve engagement and SEO.', 'synthseo-publisher'),
        });
      } else if (!hasAltText) {
        newSuggestions.push({
          id: 'alt-missing',
          type: 'warning',
          category: 'media',
          priority: 'medium',
          text: __('Missing image alt text', 'synthseo-publisher'),
          detail: __('Alt text helps with accessibility and image SEO.', 'synthseo-publisher'),
        });
      }
      
      // Internal/External links
      const hasLinks = /<a\s+href/i.test(postData.content || '');
      
      if (!hasLinks) {
        newSuggestions.push({
          id: 'links-missing',
          type: 'info',
          category: 'links',
          priority: 'low',
          text: __('No links found', 'synthseo-publisher'),
          detail: __('Add internal and external links to provide value and context.', 'synthseo-publisher'),
        });
      }
      
      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      newSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySuggestion = (suggestion) => {
    if (suggestion.action) {
      suggestion.action();
      setAppliedSuggestions(prev => [...prev, suggestion.id]);
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'default',
    };
    
    return (
      <Badge variant={variants[priority]} size="sm">
        {priority}
      </Badge>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      title: '📝',
      meta: '🏷️',
      content: '📄',
      structure: '🏗️',
      media: '🖼️',
      links: '🔗',
    };
    
    return icons[category] || '💡';
  };

  const renderSuggestion = (suggestion) => {
    const isApplied = appliedSuggestions.includes(suggestion.id);
    
    return (
      <Alert
        type={suggestion.type}
        dismissible
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
              <span className="font-medium">{suggestion.text}</span>
              {getPriorityBadge(suggestion.priority)}
            </div>
            <p className="text-sm mt-1 opacity-90">
              {suggestion.detail}
            </p>
          </div>
          {suggestion.action && !isApplied && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApplySuggestion(suggestion)}
              className="ml-4"
            >
              {__('Apply', 'synthseo-publisher')}
            </Button>
          )}
          {isApplied && (
            <Badge variant="success" size="sm" className="ml-4">
              {__('Applied', 'synthseo-publisher')}
            </Badge>
          )}
        </div>
      </Alert>
    );
  };

  const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
  const highCount = suggestions.filter(s => s.priority === 'high').length;

  return (
    <Card
      title={__('SEO Suggestions', 'synthseo-publisher')}
      headerActions={
        <div className="flex items-center space-x-2">
          {criticalCount > 0 && (
            <Badge variant="error" size="sm">
              {criticalCount} {__('critical', 'synthseo-publisher')}
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="warning" size="sm">
              {highCount} {__('high', 'synthseo-publisher')}
            </Badge>
          )}
          <Badge variant="default" size="sm">
            {suggestions.length} {__('total', 'synthseo-publisher')}
          </Badge>
        </div>
      }
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-3">
        {suggestions.length > 0 ? (
          suggestions.map(suggestion => (
            <div key={suggestion.id}>
              {renderSuggestion(suggestion)}
            </div>
          ))
        ) : (
          <Alert type="success">
            {__('Great job! Your content is well-optimized for SEO.', 'synthseo-publisher')}
          </Alert>
        )}
        
        {suggestions.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeSEO}
              loading={analyzing}
              className="w-full"
            >
              {__('Refresh Suggestions', 'synthseo-publisher')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SEOSuggestions;