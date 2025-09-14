import { useState, useCallback } from '@wordpress/element';
import { useApi } from './useApi';

/**
 * Custom hook for publishing content via API
 */
export const usePublisher = () => {
  const api = useApi();
  const [publishing, setPublishing] = useState(false);
  const [publishQueue, setPublishQueue] = useState([]);
  const [publishResults, setPublishResults] = useState([]);

  const publishPost = useCallback(async (postData) => {
    setPublishing(true);
    
    try {
      const response = await api.post('/synthseo/v2/publish', {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        status: postData.status || 'draft',
        author: postData.author,
        categories: postData.categories || [],
        tags: postData.tags || [],
        featured_image: postData.featuredImage,
        meta: {
          meta_title: postData.metaTitle,
          meta_description: postData.metaDescription,
          focus_keyword: postData.focusKeyword,
          schema_type: postData.schemaType,
          canonical_url: postData.canonicalUrl,
        },
      });
      
      if (response.success) {
        setPublishResults(prev => [...prev, {
          id: response.data.id,
          status: 'success',
          message: 'Post published successfully',
          timestamp: new Date().toISOString(),
        }]);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Publishing failed');
      }
    } catch (error) {
      setPublishResults(prev => [...prev, {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }]);
      
      throw error;
    } finally {
      setPublishing(false);
    }
  }, [api]);

  const batchPublish = useCallback(async (posts) => {
    setPublishing(true);
    const results = [];
    
    try {
      const response = await api.post('/synthseo/v2/batch', {
        posts: posts.map(post => ({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: post.status || 'draft',
          author: post.author,
          categories: post.categories || [],
          tags: post.tags || [],
          featured_image: post.featuredImage,
          meta: {
            meta_title: post.metaTitle,
            meta_description: post.metaDescription,
            focus_keyword: post.focusKeyword,
            schema_type: post.schemaType,
            canonical_url: post.canonicalUrl,
          },
        })),
      });
      
      if (response.success) {
        response.data.results.forEach(result => {
          results.push({
            id: result.id,
            status: result.success ? 'success' : 'error',
            message: result.message,
            timestamp: new Date().toISOString(),
          });
        });
        
        setPublishResults(prev => [...prev, ...results]);
        return response.data.results;
      } else {
        throw new Error(response.message || 'Batch publishing failed');
      }
    } catch (error) {
      setPublishResults(prev => [...prev, {
        status: 'error',
        message: `Batch error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }]);
      
      throw error;
    } finally {
      setPublishing(false);
    }
  }, [api]);

  const updatePost = useCallback(async (postId, postData) => {
    setPublishing(true);
    
    try {
      const response = await api.put(`/synthseo/v2/posts/${postId}`, {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        status: postData.status,
        meta: {
          meta_title: postData.metaTitle,
          meta_description: postData.metaDescription,
          focus_keyword: postData.focusKeyword,
          schema_type: postData.schemaType,
        },
      });
      
      if (response.success) {
        setPublishResults(prev => [...prev, {
          id: postId,
          status: 'success',
          message: 'Post updated successfully',
          timestamp: new Date().toISOString(),
        }]);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      setPublishResults(prev => [...prev, {
        id: postId,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }]);
      
      throw error;
    } finally {
      setPublishing(false);
    }
  }, [api]);

  const deletePost = useCallback(async (postId) => {
    try {
      const response = await api.delete(`/synthseo/v2/posts/${postId}`);
      
      if (response.success) {
        setPublishResults(prev => [...prev, {
          id: postId,
          status: 'success',
          message: 'Post deleted successfully',
          timestamp: new Date().toISOString(),
        }]);
        
        return true;
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      setPublishResults(prev => [...prev, {
        id: postId,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }]);
      
      throw error;
    }
  }, [api]);

  const addToQueue = useCallback((post) => {
    setPublishQueue(prev => [...prev, {
      ...post,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    }]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setPublishQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processQueue = useCallback(async () => {
    if (publishQueue.length === 0) return;
    
    const posts = [...publishQueue];
    setPublishQueue([]);
    
    return batchPublish(posts);
  }, [publishQueue, batchPublish]);

  const clearResults = useCallback(() => {
    setPublishResults([]);
  }, []);

  return {
    publishing,
    publishQueue,
    publishResults,
    publishPost,
    batchPublish,
    updatePost,
    deletePost,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearResults,
  };
};