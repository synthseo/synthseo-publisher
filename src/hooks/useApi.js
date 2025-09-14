import { useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Custom hook for API requests with loading, error, and data states
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch({
        path,
        ...options,
      });
      
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((path, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    
    return request(fullPath, {
      method: 'GET',
    });
  }, [request]);

  const post = useCallback((path, data = {}) => {
    return request(path, {
      method: 'POST',
      data,
    });
  }, [request]);

  const put = useCallback((path, data = {}) => {
    return request(path, {
      method: 'PUT',
      data,
    });
  }, [request]);

  const del = useCallback((path) => {
    return request(path, {
      method: 'DELETE',
    });
  }, [request]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    delete: del,
    request,
    reset,
  };
};