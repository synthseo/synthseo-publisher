import { useState, useEffect, useCallback } from '@wordpress/element';
import { useApi } from './useApi';

/**
 * Custom hook for managing SEO data for posts
 */
export const useSeoData = (postId) => {
  const api = useApi();
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
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Load SEO data when post ID changes
  useEffect(() => {
    if (postId) {
      loadSeoData();
    }
  }, [postId]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(seoData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [seoData, originalData]);

  const loadSeoData = async () => {
    if (!postId) return;
    
    try {
      const response = await api.get(`/synthseo/v2/posts/${postId}/seo`);
      
      if (response.success && response.data) {
        setSeoData(response.data);
        setOriginalData(response.data);
      }
    } catch (error) {
      console.error('Failed to load SEO data:', error);
    }
  };

  const saveSeoData = async (data = seoData) => {
    if (!postId) return false;
    
    try {
      const response = await api.post(`/synthseo/v2/posts/${postId}/seo`, data);
      
      if (response.success) {
        setSeoData(data);
        setOriginalData(data);
        setHasChanges(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to save SEO data:', error);
      throw error;
    }
  };

  const updateField = useCallback((field, value) => {
    setSeoData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetChanges = () => {
    if (originalData) {
      setSeoData(originalData);
      setHasChanges(false);
    }
  };

  const generateMetaTitle = (postTitle) => {
    if (!postTitle) return '';
    
    // Limit to 60 characters
    if (postTitle.length <= 60) {
      return postTitle;
    }
    
    // Truncate and add ellipsis
    return postTitle.substring(0, 57) + '...';
  };

  const generateMetaDescription = (content) => {
    if (!content) return '';
    
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    
    // Get first 160 characters
    if (text.length <= 160) {
      return text;
    }
    
    // Find last complete word before 160 chars
    const truncated = text.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return truncated.substring(0, lastSpace) + '...';
  };

  const analyzeSeoScore = () => {
    let score = 0;
    const issues = [];
    
    // Check meta title
    if (seoData.metaTitle) {
      score += 20;
      if (seoData.metaTitle.length >= 50 && seoData.metaTitle.length <= 60) {
        score += 10;
      } else {
        issues.push('Meta title length is not optimal');
      }
    } else {
      issues.push('Meta title is missing');
    }
    
    // Check meta description
    if (seoData.metaDescription) {
      score += 20;
      if (seoData.metaDescription.length >= 150 && seoData.metaDescription.length <= 160) {
        score += 10;
      } else {
        issues.push('Meta description length is not optimal');
      }
    } else {
      issues.push('Meta description is missing');
    }
    
    // Check focus keyword
    if (seoData.focusKeyword) {
      score += 15;
      
      // Check if keyword is in title
      if (seoData.metaTitle && seoData.metaTitle.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
        score += 10;
      } else {
        issues.push('Focus keyword not in title');
      }
      
      // Check if keyword is in description
      if (seoData.metaDescription && seoData.metaDescription.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
        score += 5;
      } else {
        issues.push('Focus keyword not in description');
      }
    } else {
      issues.push('No focus keyword set');
    }
    
    // Check slug
    if (seoData.slug) {
      score += 10;
    }
    
    return {
      score: Math.min(score, 100),
      issues,
    };
  };

  return {
    seoData,
    loading: api.loading,
    error: api.error,
    hasChanges,
    loadSeoData,
    saveSeoData,
    updateField,
    resetChanges,
    generateMetaTitle,
    generateMetaDescription,
    analyzeSeoScore,
  };
};