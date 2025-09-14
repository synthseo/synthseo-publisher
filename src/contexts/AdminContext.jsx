/**
 * Admin Context Provider
 */

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
    const [settings, setSettings] = useState({
        apiKey: window.synthseoAdmin?.settings?.apiKey || '',
        rateLimit: window.synthseoAdmin?.settings?.rateLimit || 100,
        enableLogging: window.synthseoAdmin?.settings?.enableLogging || false,
    });
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Set up WordPress API
    useEffect(() => {
        if (window.synthseoAdmin?.nonce) {
            apiFetch.use(apiFetch.createNonceMiddleware(window.synthseoAdmin.nonce));
            apiFetch.use(apiFetch.createRootURLMiddleware(window.synthseoAdmin.apiUrl));
        }
    }, []);

    const updateSettings = async (newSettings) => {
        setSaving(true);
        setMessage(null);
        
        try {
            const response = await apiFetch({
                path: '/synthseo/v2/settings',
                method: 'POST',
                data: newSettings,
            });
            
            setSettings(newSettings);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            
            return response;
        } catch (error) {
            console.error('Failed to save settings:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const generateApiKey = async () => {
        try {
            const response = await fetch(window.synthseoAdmin.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'synthseo_generate_key',
                    nonce: window.synthseoAdmin.nonce,
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    apiKey: data.data.api_key,
                }));
                return data.data.api_key;
            } else {
                throw new Error(data.data || 'Failed to generate API key');
            }
        } catch (error) {
            console.error('Failed to generate API key:', error);
            setMessage({ type: 'error', text: error.message });
            throw error;
        }
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            const response = await apiFetch({
                path: '/synthseo/v2/status',
                headers: {
                    'X-API-Key': settings.apiKey,
                },
            });
            
            setMessage({ type: 'success', text: 'Connection successful!' });
            return response;
        } catch (error) {
            console.error('Connection test failed:', error);
            setMessage({ type: 'error', text: error.message || 'Connection failed' });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const clearMessage = () => setMessage(null);

    const value = {
        settings,
        setSettings,
        updateSettings,
        generateApiKey,
        testConnection,
        loading,
        saving,
        message,
        clearMessage,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};