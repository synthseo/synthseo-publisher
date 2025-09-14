/**
 * Main Admin Application Component
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TabPanel } from '@wordpress/components';
import { AdminProvider } from '../contexts/AdminContext';
import { Container } from './layout/Container';
import { SettingsPanel } from './features/admin/SettingsPanel';
import { StatusDashboard } from './features/admin/StatusDashboard';
import { DebugLog } from './features/admin/DebugLog';

const AdminApp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('AdminApp mounted');
        // Add a marker class to show React is loaded
        const root = document.getElementById('synthseo-admin-root');
        if (root) {
            root.classList.add('synthseo-admin-loaded');
        }
    }, []);

    const tabs = [
        {
            name: 'settings',
            title: __('Settings', 'synthseo-publisher'),
            className: 'synthseo-tab-settings',
        },
        {
            name: 'status',
            title: __('Status', 'synthseo-publisher'),
            className: 'synthseo-tab-status',
        },
        {
            name: 'debug',
            title: __('Debug', 'synthseo-publisher'),
            className: 'synthseo-tab-debug',
        },
    ];

    return (
        <AdminProvider>
            <div className="synthseo-admin-app">
                <Container>
                    {error && (
                        <div className="notice notice-error">
                            <p>{error}</p>
                        </div>
                    )}
                    
                    <TabPanel
                        className="synthseo-admin-tabs"
                        activeClass="is-active"
                        tabs={tabs}
                        initialTabName="settings"
                    >
                        {(tab) => {
                            switch (tab.name) {
                                case 'settings':
                                    return <SettingsPanel />;
                                case 'status':
                                    return <StatusDashboard />;
                                case 'debug':
                                    return <DebugLog />;
                                default:
                                    return null;
                            }
                        }}
                    </TabPanel>
                </Container>
            </div>
        </AdminProvider>
    );
};

export default AdminApp;