import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Custom hook for monitoring API connection status
 */
export const useApiStatus = (apiUrl, apiKey) => {
  const [status, setStatus] = useState({
    connected: false,
    checking: false,
    lastCheck: null,
    error: null,
    latency: null,
    version: null,
  });
  const [autoCheck, setAutoCheck] = useState(false);
  const [checkInterval, setCheckInterval] = useState(60000); // 1 minute default

  const checkConnection = useCallback(async () => {
    if (!apiUrl || !apiKey) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: 'Missing API URL or Key',
      }));
      return false;
    }

    setStatus(prev => ({ ...prev, checking: true, error: null }));
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${apiUrl}/status`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        
        setStatus({
          connected: true,
          checking: false,
          lastCheck: new Date().toISOString(),
          error: null,
          latency,
          version: data.version || 'Unknown',
        });
        
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setStatus({
        connected: false,
        checking: false,
        lastCheck: new Date().toISOString(),
        error: error.message,
        latency: null,
        version: null,
      });
      
      return false;
    }
  }, [apiUrl, apiKey]);

  // Auto-check connection
  useEffect(() => {
    if (autoCheck && apiUrl && apiKey) {
      // Initial check
      checkConnection();
      
      // Set up interval
      const intervalId = setInterval(checkConnection, checkInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [autoCheck, checkInterval, checkConnection, apiUrl, apiKey]);

  const enableAutoCheck = (interval = 60000) => {
    setCheckInterval(interval);
    setAutoCheck(true);
  };

  const disableAutoCheck = () => {
    setAutoCheck(false);
  };

  const getStatusColor = () => {
    if (status.checking) return 'blue';
    if (status.connected) return 'green';
    if (status.error) return 'red';
    return 'gray';
  };

  const getStatusText = () => {
    if (status.checking) return 'Checking...';
    if (status.connected) return 'Connected';
    if (status.error) return 'Disconnected';
    return 'Unknown';
  };

  return {
    ...status,
    checkConnection,
    enableAutoCheck,
    disableAutoCheck,
    getStatusColor,
    getStatusText,
    isHealthy: status.connected && !status.error,
  };
};