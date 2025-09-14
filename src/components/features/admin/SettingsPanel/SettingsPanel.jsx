/**
 * Settings Panel Component
 */

import { __ } from '@wordpress/i18n';
import { useAdmin } from '../../../../contexts/AdminContext';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Alert } from '../../../ui/Alert';
import { ApiKeyManager } from '../ApiKeyManager';
import { SettingsForm } from '../SettingsForm';
import { ConnectionTester } from '../ConnectionTester';

const SettingsPanel = () => {
    const { settings, updateSettings, message, clearMessage, saving } = useAdmin();

    const handleSave = async (newSettings) => {
        try {
            await updateSettings(newSettings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return (
        <div className="synthseo-settings-panel">
            {message && (
                <Alert 
                    type={message.type} 
                    dismissible 
                    onDismiss={clearMessage}
                >
                    {message.text}
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <ApiKeyManager 
                        currentKey={settings.apiKey}
                        onKeyChange={(key) => handleSave({ ...settings, apiKey: key })}
                    />
                    
                    <SettingsForm 
                        settings={settings}
                        onSave={handleSave}
                        saving={saving}
                    />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <ConnectionTester />
                    
                    <Card title={__('API Documentation', 'synthseo-publisher')}>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">
                                    {__('Base URL', 'synthseo-publisher')}
                                </h4>
                                <code className="block p-2 bg-gray-100 rounded text-sm">
                                    {window.location.origin}/wp-json/synthseo/v2/
                                </code>
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">
                                    {__('Authentication', 'synthseo-publisher')}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    {__('Include your API key in the request header:', 'synthseo-publisher')}
                                </p>
                                <code className="block p-2 bg-gray-100 rounded text-sm">
                                    X-API-Key: {settings.apiKey || 'your-api-key'}
                                </code>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">
                                    {__('Available Endpoints', 'synthseo-publisher')}
                                </h4>
                                <ul className="space-y-1 text-sm">
                                    <li><code>GET /status</code> - {__('Check connection', 'synthseo-publisher')}</li>
                                    <li><code>GET /schema</code> - {__('Get field schema', 'synthseo-publisher')}</li>
                                    <li><code>POST /publish</code> - {__('Publish content', 'synthseo-publisher')}</li>
                                    <li><code>POST /batch</code> - {__('Batch publish', 'synthseo-publisher')}</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;