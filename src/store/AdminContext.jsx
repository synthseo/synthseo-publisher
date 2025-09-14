import { createContext, useContext, useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  // Settings state
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

  // API status state
  const [apiStatus, setApiStatus] = useState({
    connected: false,
    lastCheck: null,
    error: null,
    version: null,
  });

  // Dashboard stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedToday: 0,
    pendingReview: 0,
    failedPublish: 0,
    apiCalls: 0,
    apiLimit: 100,
  });

  // Debug logs
  const [debugLogs, setDebugLogs] = useState([]);

  // Loading states
  const [loading, setLoading] = useState({
    settings: false,
    apiTest: false,
    stats: false,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  // Load settings from WordPress options
  const loadSettings = async () => {
    setLoading(prev => ({ ...prev, settings: true }));
    
    try {
      const response = await apiFetch({
        path: '/synthseo/v2/settings',
        method: 'GET',
      });
      
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      addDebugLog('error', 'Failed to load settings', { error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  };

  // Save settings to WordPress options
  const saveSettings = async (newSettings) => {
    setLoading(prev => ({ ...prev, settings: true }));
    
    try {
      const response = await apiFetch({
        path: '/synthseo/v2/settings',
        method: 'POST',
        data: newSettings,
      });
      
      if (response.success) {
        setSettings(newSettings);
        addDebugLog('success', 'Settings saved successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      addDebugLog('error', 'Failed to save settings', { error: error.message });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    setLoading(prev => ({ ...prev, apiTest: true }));
    
    try {
      const response = await fetch(`${settings.apiUrl}/status`, {
        method: 'GET',
        headers: {
          'X-API-Key': settings.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiStatus({
          connected: true,
          lastCheck: new Date().toISOString(),
          error: null,
          version: data.version || 'Unknown',
        });
        addDebugLog('success', 'API connection successful', data);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setApiStatus({
        connected: false,
        lastCheck: new Date().toISOString(),
        error: error.message,
        version: null,
      });
      addDebugLog('error', 'API connection failed', { error: error.message });
      return false;
    } finally {
      setLoading(prev => ({ ...prev, apiTest: false }));
    }
  };

  // Load dashboard stats
  const loadStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    
    try {
      const response = await apiFetch({
        path: '/synthseo/v2/stats',
        method: 'GET',
      });
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      addDebugLog('error', 'Failed to load stats', { error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Generate new API key
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  // Add debug log entry
  const addDebugLog = (level, message, context = {}) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      level,
      message,
      context,
    };
    
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // Clear debug logs
  const clearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog('info', 'Debug logs cleared');
  };

  // Export debug logs
  const exportDebugLogs = () => {
    const dataStr = JSON.stringify(debugLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `synthseo-debug-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addDebugLog('info', 'Debug logs exported');
  };

  const value = {
    // State
    settings,
    apiStatus,
    stats,
    debugLogs,
    loading,
    
    // Actions
    loadSettings,
    saveSettings,
    testApiConnection,
    loadStats,
    generateApiKey,
    addDebugLog,
    clearDebugLogs,
    exportDebugLogs,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;