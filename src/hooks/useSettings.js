import { useState, useEffect } from '@wordpress/element';
import { useApi } from './useApi';

/**
 * Custom hook for managing plugin settings
 */
export const useSettings = () => {
  const api = useApi();
  const [settings, setSettings] = useState({
    apiUrl: '',
    apiKey: '',
    defaultPostStatus: 'draft',
    defaultAuthor: '',
    autoPublish: false,
    enableSeoFields: true,
    enableSchemaMarkup: true,
    enableDebugMode: false,
    rateLimit: '10',
    timeout: '30',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/synthseo/v2/settings');
      
      if (response.success && response.data) {
        setSettings(response.data);
        setOriginalSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings = settings) => {
    try {
      const response = await api.post('/synthseo/v2/settings', newSettings);
      
      if (response.success) {
        setSettings(newSettings);
        setOriginalSettings(newSettings);
        setHasChanges(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const validateSettings = () => {
    const errors = {};
    
    if (!settings.apiUrl) {
      errors.apiUrl = 'API URL is required';
    } else if (!/^https?:\/\/.+/.test(settings.apiUrl)) {
      errors.apiUrl = 'Please enter a valid URL';
    }
    
    if (!settings.apiKey) {
      errors.apiKey = 'API Key is required';
    } else if (settings.apiKey.length < 16) {
      errors.apiKey = 'API Key must be at least 16 characters';
    }
    
    const rateLimit = parseInt(settings.rateLimit);
    if (isNaN(rateLimit) || rateLimit < 1 || rateLimit > 100) {
      errors.rateLimit = 'Rate limit must be between 1 and 100';
    }
    
    const timeout = parseInt(settings.timeout);
    if (isNaN(timeout) || timeout < 5 || timeout > 300) {
      errors.timeout = 'Timeout must be between 5 and 300 seconds';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  return {
    settings,
    loading: api.loading,
    error: api.error,
    hasChanges,
    loadSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    validateSettings,
  };
};