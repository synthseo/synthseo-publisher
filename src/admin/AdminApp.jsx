/**
 * Main Admin Application Component
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AdminProvider, useAdmin } from '../store/AdminContext';
import { Container } from '../components/layout/Container';
import { Tabs } from '../components/data/Tabs';
import { ConnectionTester } from '../components/features/admin/ConnectionTester';
import { ApiKeyManager } from '../components/features/admin/ApiKeyManager';
import { SettingsForm } from '../components/features/admin/SettingsForm';
import { StatusDashboard } from '../components/features/admin/StatusDashboard';
import { DebugLog } from '../components/features/admin/DebugLog';

const AdminContent = () => {
    const {
        settings,
        apiStatus,
        stats,
        debugLogs,
        loading,
        saveSettings,
        testApiConnection,
        generateApiKey,
        clearDebugLogs,
        exportDebugLogs,
    } = useAdmin();
    
    const tabs = [
        {
            label: __('Dashboard', 'synthseo-publisher'),
            content: (
                <StatusDashboard 
                    apiUrl={settings.apiUrl}
                    apiKey={settings.apiKey}
                />
            ),
        },
        {
            label: __('Settings', 'synthseo-publisher'),
            content: (
                <div className="space-y-6">
                    <ConnectionTester
                        apiUrl={settings.apiUrl}
                        apiKey={settings.apiKey}
                        onTest={testApiConnection}
                    />
                    <ApiKeyManager
                        currentKey={settings.apiKey}
                        onKeyChange={(key) => saveSettings({ ...settings, apiKey: key })}
                        onSave={(key) => saveSettings({ ...settings, apiKey: key })}
                    />
                    <SettingsForm
                        settings={settings}
                        onSave={saveSettings}
                    />
                </div>
            ),
        },
        {
            label: __('Debug', 'synthseo-publisher'),
            badge: debugLogs.length || null,
            content: (
                <DebugLog
                    logs={debugLogs}
                    onClear={clearDebugLogs}
                    onExport={exportDebugLogs}
                />
            ),
        },
    ];
    
    return (
        <div className="synthseo-admin-wrap">
            <Container maxWidth="7xl" padding={false}>
                <div className="bg-white shadow-sm rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {__('SynthSEO Publisher', 'synthseo-publisher')}
                        </h1>
                    </div>
                    <Tabs tabs={tabs} />
                </div>
            </Container>
        </div>
    );
};

const AdminApp = () => {
    return (
        <AdminProvider>
            <AdminContent />
        </AdminProvider>
    );
};

export default AdminApp;