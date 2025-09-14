import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { List } from '../../../data/List';
import { Badge } from '../../../ui/Badge';
import { Tooltip } from '../../../data/Tooltip';
import { Alert } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import { Input } from '../../../forms/Input';

const KeywordAnalyzer = ({ 
  content = '', 
  focusKeyword = '',
  onKeywordChange 
}) => {
  const [keywords, setKeywords] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [keywordDensity, setKeywordDensity] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (content && focusKeyword) {
      analyzeKeywords();
    }
  }, [content, focusKeyword]);

  const analyzeKeywords = async () => {
    setAnalyzing(true);
    
    try {
      // Simulate keyword analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract words from content
      const words = content.toLowerCase().match(/\b[\w']+\b/g) || [];
      const wordCount = words.length;
      
      // Count keyword occurrences
      const keywordCounts = {};
      const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over'];
      
      words.forEach(word => {
        if (!stopWords.includes(word) && word.length > 3) {
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        }
      });
      
      // Calculate density
      const densityData = {};
      Object.keys(keywordCounts).forEach(word => {
        densityData[word] = {
          count: keywordCounts[word],
          density: ((keywordCounts[word] / wordCount) * 100).toFixed(2),
        };
      });
      
      // Sort by count and get top keywords
      const topKeywords = Object.entries(densityData)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([word, data]) => ({
          word,
          ...data,
        }));
      
      setKeywords(topKeywords);
      setKeywordDensity(densityData);
      
      // Generate suggestions
      generateSuggestions(densityData, focusKeyword, wordCount);
    } catch (error) {
      console.error('Keyword analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSuggestions = (densityData, keyword, wordCount) => {
    const newSuggestions = [];
    
    if (!keyword) {
      newSuggestions.push({
        type: 'warning',
        text: __('No focus keyword set. Add one to get targeted suggestions.', 'synthseo-publisher'),
      });
    } else {
      const keywordData = densityData[keyword.toLowerCase()];
      
      if (!keywordData) {
        newSuggestions.push({
          type: 'error',
          text: __('Focus keyword not found in content. Add it to improve SEO.', 'synthseo-publisher'),
        });
      } else {
        const density = parseFloat(keywordData.density);
        
        if (density < 0.5) {
          newSuggestions.push({
            type: 'warning',
            text: __('Keyword density is too low. Try to use your focus keyword more often.', 'synthseo-publisher'),
          });
        } else if (density > 2.5) {
          newSuggestions.push({
            type: 'warning',
            text: __('Keyword density is too high. This might be seen as keyword stuffing.', 'synthseo-publisher'),
          });
        } else {
          newSuggestions.push({
            type: 'success',
            text: __('Keyword density is optimal!', 'synthseo-publisher'),
          });
        }
      }
    }
    
    if (wordCount < 300) {
      newSuggestions.push({
        type: 'info',
        text: __('Content is quite short. Consider adding more valuable content.', 'synthseo-publisher'),
      });
    }
    
    setSuggestions(newSuggestions);
  };

  const handleAddKeyword = () => {
    if (newKeyword && onKeywordChange) {
      onKeywordChange(newKeyword);
      setNewKeyword('');
    }
  };

  const getDensityBadge = (density) => {
    const value = parseFloat(density);
    let variant = 'default';
    
    if (value >= 0.5 && value <= 2.5) {
      variant = 'success';
    } else if (value > 2.5) {
      variant = 'warning';
    }
    
    return (
      <Badge variant={variant} size="sm">
        {density}%
      </Badge>
    );
  };

  const renderKeywordItem = (item) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <span className="font-medium text-gray-900">{item.word}</span>
        <Tooltip content={`${item.count} occurrences`}>
          <Badge variant="default" size="sm" icon="dot">
            {item.count}x
          </Badge>
        </Tooltip>
      </div>
      <div className="flex items-center space-x-2">
        {getDensityBadge(item.density)}
        {item.word === focusKeyword?.toLowerCase() && (
          <Badge variant="primary" size="sm">
            {__('Focus', 'synthseo-publisher')}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card
      title={__('Keyword Analysis', 'synthseo-publisher')}
      headerActions={
        analyzing && (
          <Badge variant="info">
            {__('Analyzing...', 'synthseo-publisher')}
          </Badge>
        )
      }
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-4">
        {/* Focus Keyword Input */}
        <div className="flex space-x-2">
          <Input
            placeholder={__('Add focus keyword...', 'synthseo-publisher')}
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            size="sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddKeyword}
            disabled={!newKeyword}
          >
            {__('Set', 'synthseo-publisher')}
          </Button>
        </div>

        {/* Current Focus Keyword */}
        {focusKeyword && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {__('Focus Keyword:', 'synthseo-publisher')}
              </span>
              <Badge variant="primary">
                {focusKeyword}
              </Badge>
            </div>
            {keywordDensity[focusKeyword.toLowerCase()] && (
              <div className="mt-2 text-sm text-blue-700">
                {__('Density:', 'synthseo-publisher')} {keywordDensity[focusKeyword.toLowerCase()].density}% 
                ({keywordDensity[focusKeyword.toLowerCase()].count} {__('occurrences', 'synthseo-publisher')})
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
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

        {/* Top Keywords List */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {__('Top Keywords', 'synthseo-publisher')}
          </h4>
          {keywords.length > 0 ? (
            <List
              items={keywords}
              renderItem={renderKeywordItem}
              divided
              bordered
              hover
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              {content ? (
                <p>{__('Analyzing content...', 'synthseo-publisher')}</p>
              ) : (
                <p>{__('Add content to see keyword analysis', 'synthseo-publisher')}</p>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        {content && (
          <Button
            variant="ghost"
            size="sm"
            onClick={analyzeKeywords}
            loading={analyzing}
            disabled={analyzing}
            className="w-full"
          >
            {__('Refresh Analysis', 'synthseo-publisher')}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default KeywordAnalyzer;