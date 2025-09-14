import { createContext, useContext, useState, useEffect } from '@wordpress/element';
import { select, dispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const EditorContext = createContext();

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};

export const EditorProvider = ({ children, postId }) => {
  // SEO data state
  const [seoData, setSeoData] = useState({
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    slug: '',
    canonicalUrl: '',
    schemaType: 'Article',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  });

  // Post data state
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    author: '',
    publishDate: '',
    modifiedDate: '',
    status: 'draft',
  });

  // SEO analysis state
  const [seoScore, setSeoScore] = useState(0);
  const [seoSuggestions, setSeoSuggestions] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [keywordDensity, setKeywordDensity] = useState({});

  // Loading states
  const [loading, setLoading] = useState({
    seo: false,
    analysis: false,
    save: false,
  });

  // Load SEO data on mount
  useEffect(() => {
    if (postId) {
      loadSeoData();
      subscribeToPostChanges();
    }
  }, [postId]);

  // Subscribe to WordPress editor changes
  const subscribeToPostChanges = () => {
    // Get initial post data from WordPress editor
    const editor = select('core/editor');
    if (editor) {
      const post = editor.getCurrentPost();
      if (post) {
        setPostData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          featuredImage: post.featured_media || '',
          author: post.author || '',
          publishDate: post.date || '',
          modifiedDate: post.modified || '',
          status: post.status || 'draft',
        });
      }
    }

    // Subscribe to changes
    const unsubscribe = wp.data.subscribe(() => {
      const editor = select('core/editor');
      if (editor) {
        const post = editor.getCurrentPost();
        if (post) {
          setPostData(prev => ({
            ...prev,
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            status: post.status || 'draft',
          }));
        }
      }
    });

    return unsubscribe;
  };

  // Load SEO data from post meta
  const loadSeoData = async () => {
    setLoading(prev => ({ ...prev, seo: true }));
    
    try {
      const response = await apiFetch({
        path: `/synthseo/v2/seo/${postId}`,
        method: 'GET',
      });
      
      if (response.success) {
        setSeoData(response.data);
      }
    } catch (error) {
      console.error('Failed to load SEO data:', error);
    } finally {
      setLoading(prev => ({ ...prev, seo: false }));
    }
  };

  // Save SEO data to post meta
  const saveSeoData = async (data = seoData) => {
    setLoading(prev => ({ ...prev, save: true }));
    
    try {
      const response = await apiFetch({
        path: `/synthseo/v2/seo/${postId}`,
        method: 'POST',
        data: data,
      });
      
      if (response.success) {
        setSeoData(data);
        
        // Update post meta using WordPress data
        const editor = dispatch('core/editor');
        if (editor) {
          editor.editPost({
            meta: {
              _synthseo_meta_title: data.metaTitle,
              _synthseo_meta_description: data.metaDescription,
              _synthseo_focus_keyword: data.focusKeyword,
              _synthseo_schema_type: data.schemaType,
            },
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to save SEO data:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  // Analyze SEO
  const analyzeSeo = async () => {
    setLoading(prev => ({ ...prev, analysis: true }));
    
    try {
      // Simulate SEO analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let score = 0;
      const suggestions = [];
      
      // Title analysis
      if (seoData.metaTitle) {
        score += 20;
        if (seoData.metaTitle.length >= 50 && seoData.metaTitle.length <= 60) {
          score += 10;
        } else {
          suggestions.push({
            type: 'warning',
            text: 'Meta title should be between 50-60 characters',
            priority: 'high',
          });
        }
        
        if (seoData.focusKeyword && seoData.metaTitle.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
          score += 10;
        } else if (seoData.focusKeyword) {
          suggestions.push({
            type: 'info',
            text: 'Include focus keyword in meta title',
            priority: 'medium',
          });
        }
      } else {
        suggestions.push({
          type: 'error',
          text: 'Meta title is missing',
          priority: 'critical',
        });
      }
      
      // Description analysis
      if (seoData.metaDescription) {
        score += 20;
        if (seoData.metaDescription.length >= 150 && seoData.metaDescription.length <= 160) {
          score += 10;
        } else {
          suggestions.push({
            type: 'warning',
            text: 'Meta description should be between 150-160 characters',
            priority: 'medium',
          });
        }
        
        if (seoData.focusKeyword && seoData.metaDescription.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
          score += 5;
        } else if (seoData.focusKeyword) {
          suggestions.push({
            type: 'info',
            text: 'Include focus keyword in meta description',
            priority: 'low',
          });
        }
      } else {
        suggestions.push({
          type: 'error',
          text: 'Meta description is missing',
          priority: 'high',
        });
      }
      
      // Content analysis
      const wordCount = (postData.content || '').split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount >= 300) {
        score += 15;
        if (wordCount >= 1000) {
          score += 10;
        }
      } else {
        suggestions.push({
          type: 'warning',
          text: `Content is too short (${wordCount} words). Aim for at least 300 words.`,
          priority: 'high',
        });
      }
      
      setSeoScore(Math.min(score, 100));
      setSeoSuggestions(suggestions);
      
      // Analyze keywords
      analyzeKeywords();
      
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  // Analyze keywords in content
  const analyzeKeywords = () => {
    const content = postData.content || '';
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
  };

  // Update SEO field
  const updateSeoField = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate schema markup
  const generateSchema = () => {
    const baseUrl = window.location.origin;
    const currentDate = new Date().toISOString();
    
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': seoData.schemaType || 'Article',
      'headline': seoData.metaTitle || postData.title || '',
      'description': seoData.metaDescription || postData.excerpt || '',
      'image': postData.featuredImage || `${baseUrl}/default-image.jpg`,
      'author': {
        '@type': 'Person',
        'name': postData.author || 'Author',
      },
      'datePublished': postData.publishDate || currentDate,
      'dateModified': postData.modifiedDate || currentDate,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `${baseUrl}/?p=${postId}`,
      },
    };
    
    return schemaData;
  };

  const value = {
    // State
    seoData,
    postData,
    seoScore,
    seoSuggestions,
    keywords,
    keywordDensity,
    loading,
    
    // Actions
    loadSeoData,
    saveSeoData,
    analyzeSeo,
    analyzeKeywords,
    updateSeoField,
    generateSchema,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export default EditorContext;