/**
 * SynthSEO Publisher Admin Interface
 * 
 * React-based admin interface for WordPress plugin
 * Uses WordPress components and globals directly
 */

// Use WordPress globals directly
const { createElement, render, useState, useEffect, Fragment } = window.wp.element;
const { __ } = window.wp.i18n;
const { Button, Card, CardBody, CardHeader, TextControl, ToggleControl, TabPanel } = window.wp.components;

// Simple Admin App Component
const AdminApp = ({ initialTab = 'settings' }) => {
    const [settings, setSettings] = useState({
        apiKey: window.synthseoAdmin?.settings?.apiKey || '',
        rateLimit: window.synthseoAdmin?.settings?.rateLimit || 100,
        enableLogging: window.synthseoAdmin?.settings?.enableLogging || false,
    });
    
    const [copySuccess, setCopySuccess] = useState(false);
    const [copyUrlSuccess, setCopyUrlSuccess] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);
    
    // Debug tab states
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    
    const handleCopyApiKey = () => {
        const textArea = document.createElement('textarea');
        textArea.value = settings.apiKey;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        
        document.body.removeChild(textArea);
    };
    
    const loadPosts = async () => {
        setLoadingPosts(true);
        try {
            // Load ALL posts including drafts, pending, private, etc. with ALL fields
            // status=any gets all statuses, or we can specify: draft,publish,pending,private,future
            const response = await fetch(
                window.synthseoAdmin.apiUrl.replace('synthseo/v2/', 'wp/v2/') + 
                'posts?per_page=100&context=edit&status=draft,publish,pending,private,future,trash', 
                {
                    headers: {
                        'X-WP-Nonce': window.synthseoAdmin.nonce,
                    }
                }
            );
            const data = await response.json();
            console.log('Loaded posts with full data (including drafts):', data);
            console.log('Post statuses found:', [...new Set(data.map(p => p.status))]);
            setPosts(data);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoadingPosts(false);
        }
    };
    
    // Load posts when debug tab is selected
    useEffect(() => {
        if (initialTab === 'debug') {
            loadPosts();
        }
    }, [initialTab]);
    
    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        
        try {
            const response = await fetch(window.synthseoAdmin.apiUrl + 'status', {
                method: 'GET',
                headers: {
                    'X-API-Key': settings.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setTestResult({
                    success: true,
                    message: __('Connection successful!', 'synthseo-publisher'),
                    data: data
                });
            } else {
                setTestResult({
                    success: false,
                    message: data.message || __('Connection failed', 'synthseo-publisher')
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: error.message || __('Network error', 'synthseo-publisher')
            });
        } finally {
            setTesting(false);
        }
    };
    
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
            name: 'docs',
            title: __('Documentation', 'synthseo-publisher'),
            className: 'synthseo-tab-docs',
        },
    ];
    
    // Add debug tab if we're in debug mode
    if (window.synthseoAdmin?.debugMode || initialTab === 'debug') {
        tabs.push({
            name: 'debug',
            title: __('Debug', 'synthseo-publisher'),
            className: 'synthseo-tab-debug',
        });
    }
    
    return createElement('div', { className: 'synthseo-admin-app' },
        createElement(TabPanel, {
            className: 'synthseo-admin-tabs',
            activeClass: 'is-active',
            tabs: tabs,
            initialTabName: initialTab
        }, (tab) => {
            if (tab.name === 'settings') {
                return createElement('div', { className: 'synthseo-settings-panel' },
                    createElement(Card, { className: 'synthseo-card' },
                        createElement(CardHeader, null, 
                            createElement('h2', null, __('API Configuration', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            // API Base URL Field
                            createElement('div', { className: 'synthseo-field', style: { marginBottom: '20px' } },
                                createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: 'bold' } }, 
                                    __('API Base URL', 'synthseo-publisher')
                                ),
                                createElement('div', { style: { display: 'flex', gap: '10px' } },
                                    createElement('input', {
                                        type: 'text',
                                        value: window.location.origin,
                                        readOnly: true,
                                        style: {
                                            flex: 1,
                                            padding: '8px',
                                            fontFamily: 'monospace',
                                            backgroundColor: '#f0f0f1'
                                        }
                                    }),
                                    createElement(Button, {
                                        variant: copyUrlSuccess ? 'primary' : 'secondary',
                                        onClick: () => {
                                            const textArea = document.createElement('textarea');
                                            textArea.value = window.location.origin;
                                            textArea.style.position = 'fixed';
                                            textArea.style.left = '-999999px';
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            try {
                                                document.execCommand('copy');
                                                setCopyUrlSuccess(true);
                                                setTimeout(() => setCopyUrlSuccess(false), 2000);
                                            } catch (err) {
                                                console.error('Failed to copy:', err);
                                            }
                                            document.body.removeChild(textArea);
                                        }
                                    }, copyUrlSuccess ? __('Copied!', 'synthseo-publisher') : __('Copy', 'synthseo-publisher'))
                                ),
                                createElement('p', { className: 'description', style: { marginTop: '8px' } },
                                    __('Your WordPress site URL for SaaS integration. API endpoints: /wp-json/synthseo/v2/*', 'synthseo-publisher')
                                )
                            ),
                            
                            // API Key Field
                            createElement('div', { className: 'synthseo-field', style: { marginBottom: '20px' } },
                                createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: 'bold' } }, 
                                    __('API Key', 'synthseo-publisher')
                                ),
                                createElement('div', { style: { display: 'flex', gap: '10px' } },
                                    createElement('input', {
                                        type: 'text',
                                        value: settings.apiKey,
                                        readOnly: true,
                                        style: {
                                            flex: 1,
                                            padding: '8px',
                                            fontFamily: 'monospace',
                                            backgroundColor: '#f0f0f1'
                                        }
                                    }),
                                    createElement(Button, {
                                        variant: copySuccess ? 'primary' : 'secondary',
                                        onClick: handleCopyApiKey
                                    }, copySuccess ? __('Copied!', 'synthseo-publisher') : __('Copy', 'synthseo-publisher'))
                                ),
                                createElement('p', { className: 'description', style: { marginTop: '8px' } },
                                    __('Use this key to authenticate API requests from your SynthSEO platform.', 'synthseo-publisher')
                                )
                            ),
                            
                            // Rate Limit Field
                            createElement('div', { className: 'synthseo-field', style: { marginBottom: '20px' } },
                                createElement(TextControl, {
                                    label: __('Rate Limit', 'synthseo-publisher'),
                                    value: settings.rateLimit,
                                    onChange: (value) => setSettings({ ...settings, rateLimit: parseInt(value) || 100 }),
                                    type: 'number',
                                    min: 10,
                                    max: 1000,
                                    help: __('Maximum API requests per minute', 'synthseo-publisher')
                                })
                            ),
                            
                            // Debug Logging Toggle
                            createElement('div', { className: 'synthseo-field', style: { marginBottom: '20px' } },
                                createElement(ToggleControl, {
                                    label: __('Enable Debug Logging', 'synthseo-publisher'),
                                    checked: settings.enableLogging,
                                    onChange: (value) => setSettings({ ...settings, enableLogging: value }),
                                    help: __('Log API requests for troubleshooting', 'synthseo-publisher')
                                })
                            ),
                            
                            // Save Button
                            createElement(Button, {
                                variant: 'primary',
                                onClick: async () => {
                                    try {
                                        const response = await fetch(window.synthseoAdmin.ajaxUrl, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/x-www-form-urlencoded',
                                            },
                                            body: new URLSearchParams({
                                                action: 'synthseo_save_settings',
                                                nonce: window.synthseoAdmin.nonce,
                                                synthseo_rate_limit: settings.rateLimit,
                                                synthseo_enable_logging: settings.enableLogging ? '1' : '0'
                                            })
                                        });
                                        
                                        const result = await response.json();
                                        if (result.success) {
                                            alert(__('Settings saved successfully!', 'synthseo-publisher'));
                                        } else {
                                            alert(__('Failed to save settings', 'synthseo-publisher'));
                                        }
                                    } catch (error) {
                                        console.error('Save error:', error);
                                        alert(__('Error saving settings', 'synthseo-publisher'));
                                    }
                                }
                            }, __('Save Settings', 'synthseo-publisher'))
                        )
                    )
                );
            } else if (tab.name === 'status') {
                return createElement('div', null,
                    createElement(Card, { style: { marginBottom: '20px' } },
                        createElement(CardHeader, null,
                            createElement('h2', null, __('Connection Test', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            createElement('p', { style: { marginBottom: '10px' } }, 
                                __('API Endpoint:', 'synthseo-publisher')
                            ),
                            createElement('code', { 
                                style: { 
                                    display: 'block', 
                                    padding: '10px', 
                                    backgroundColor: '#f0f0f1', 
                                    marginBottom: '20px',
                                    fontSize: '12px'
                                } 
                            }, window.synthseoAdmin?.apiUrl || 'Not configured'),
                            
                            createElement(Button, {
                                variant: 'primary',
                                onClick: testConnection,
                                disabled: testing
                            }, testing ? __('Testing...', 'synthseo-publisher') : __('Test Connection', 'synthseo-publisher')),
                            
                            testResult && createElement('div', {
                                style: {
                                    marginTop: '20px',
                                    padding: '10px',
                                    backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
                                    border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
                                    borderRadius: '4px',
                                    color: testResult.success ? '#155724' : '#721c24'
                                }
                            },
                                createElement('strong', null, testResult.message),
                                testResult.data && createElement('div', { style: { marginTop: '10px' } },
                                    createElement('p', null, 'Version: ', testResult.data.version),
                                    createElement('p', null, 'WordPress: ', testResult.data.wordpress_version)
                                )
                            )
                        )
                    ),
                    
                    createElement(Card, null,
                        createElement(CardHeader, null,
                            createElement('h2', null, __('System Status', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            createElement('table', { style: { width: '100%' } },
                                createElement('tbody', null,
                                    createElement('tr', null,
                                        createElement('td', { style: { padding: '8px 0' } }, 
                                            createElement('strong', null, __('Plugin Version:', 'synthseo-publisher'))
                                        ),
                                        createElement('td', null, window.synthseoAdmin?.version || 'Unknown')
                                    ),
                                    createElement('tr', null,
                                        createElement('td', { style: { padding: '8px 0' } }, 
                                            createElement('strong', null, __('API Key Status:', 'synthseo-publisher'))
                                        ),
                                        createElement('td', null, 
                                            settings.apiKey ? 
                                                createElement('span', { style: { color: '#28a745' } }, '✓ ', __('Configured', 'synthseo-publisher')) :
                                                createElement('span', { style: { color: '#dc3545' } }, '✗ ', __('Not configured', 'synthseo-publisher'))
                                        )
                                    ),
                                    createElement('tr', null,
                                        createElement('td', { style: { padding: '8px 0' } }, 
                                            createElement('strong', null, __('Rate Limit:', 'synthseo-publisher'))
                                        ),
                                        createElement('td', null, settings.rateLimit + ' requests/minute')
                                    ),
                                    createElement('tr', null,
                                        createElement('td', { style: { padding: '8px 0' } }, 
                                            createElement('strong', null, __('Debug Logging:', 'synthseo-publisher'))
                                        ),
                                        createElement('td', null, 
                                            settings.enableLogging ? __('Enabled', 'synthseo-publisher') : __('Disabled', 'synthseo-publisher')
                                        )
                                    )
                                )
                            )
                        )
                    )
                );
            } else if (tab.name === 'debug') {
                // Debug Tab  
                return createElement('div', null,
                    createElement(Card, { style: { marginBottom: '20px' } },
                        createElement(CardHeader, null,
                            createElement('h2', null, __('Debug Information', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            createElement('h3', { style: { marginBottom: '15px' } }, __('Configuration', 'synthseo-publisher')),
                            createElement('pre', { 
                                style: { 
                                    backgroundColor: '#f0f0f1', 
                                    padding: '15px', 
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '12px'
                                } 
                            },
                                JSON.stringify({
                                    pluginVersion: window.synthseoAdmin?.version || 'Unknown',
                                    apiUrl: window.synthseoAdmin?.apiUrl,
                                    adminUrl: window.synthseoAdmin?.adminUrl,
                                    pluginUrl: window.synthseoAdmin?.pluginUrl,
                                    currentPage: window.synthseoAdmin?.currentPage,
                                    settings: settings,
                                    wpVersion: window.synthseoAdmin?.wordpress_version
                                }, null, 2)
                            ),
                            
                            createElement('h3', { style: { marginTop: '30px', marginBottom: '15px' } }, __('WordPress Dependencies', 'synthseo-publisher')),
                            createElement('pre', { 
                                style: { 
                                    backgroundColor: '#f0f0f1', 
                                    padding: '15px', 
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '12px'
                                } 
                            },
                                JSON.stringify({
                                    'wp.element': typeof window.wp?.element !== 'undefined',
                                    'wp.components': typeof window.wp?.components !== 'undefined',
                                    'wp.i18n': typeof window.wp?.i18n !== 'undefined',
                                    'wp.apiFetch': typeof window.wp?.apiFetch !== 'undefined',
                                    'React': typeof window.React !== 'undefined',
                                    'ReactDOM': typeof window.ReactDOM !== 'undefined'
                                }, null, 2)
                            ),
                            
                            createElement('h3', { style: { marginTop: '30px', marginBottom: '15px' } }, __('Console Logs', 'synthseo-publisher')),
                            createElement('p', { style: { color: '#666', marginBottom: '10px' } }, 
                                __('Open browser console to view detailed debug logs.', 'synthseo-publisher')
                            ),
                            createElement(Button, {
                                variant: 'secondary',
                                onClick: () => {
                                    console.log('=== SynthSEO Debug Info ===');
                                    console.log('Plugin Config:', window.synthseoAdmin);
                                    console.log('Current Settings:', settings);
                                    console.log('WordPress Packages:', {
                                        element: window.wp?.element,
                                        components: window.wp?.components,
                                        i18n: window.wp?.i18n
                                    });
                                    alert(__('Debug information logged to console', 'synthseo-publisher'));
                                }
                            }, __('Log Debug Info to Console', 'synthseo-publisher'))
                        )
                    ),
                    
                    // Posts List with Complete Data
                    createElement(Card, { style: { marginTop: '20px' } },
                        createElement(CardHeader, null,
                            createElement('h2', null, __('All Posts - Complete Database Schema', 'synthseo-publisher')),
                            createElement(Button, {
                                variant: 'secondary',
                                onClick: loadPosts,
                                disabled: loadingPosts
                            }, loadingPosts ? __('Loading...', 'synthseo-publisher') : __('Load All Posts', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            loadingPosts ? 
                                createElement('p', null, __('Loading all posts from database...', 'synthseo-publisher')) :
                                posts.length === 0 ?
                                    createElement('div', null,
                                        createElement('p', null, __('No posts loaded yet. Click "Load All Posts" to fetch data.', 'synthseo-publisher')),
                                        createElement('p', { style: { marginTop: '10px', color: '#666' } }, 
                                            __('This will load ALL posts with ALL attributes from the WordPress database.', 'synthseo-publisher'))
                                    ) :
                                    createElement('div', null,
                                        createElement('div', { 
                                            style: { 
                                                marginBottom: '20px',
                                                padding: '10px',
                                                backgroundColor: '#e7f3ff',
                                                border: '1px solid #0073aa',
                                                borderRadius: '4px'
                                            }
                                        },
                                            createElement('strong', null, 'Total Posts Found: ' + posts.length),
                                            createElement('div', { style: { marginTop: '8px' } },
                                                (() => {
                                                    const statusCounts = posts.reduce((acc, post) => {
                                                        acc[post.status] = (acc[post.status] || 0) + 1;
                                                        return acc;
                                                    }, {});
                                                    return Object.entries(statusCounts).map(([status, count]) => 
                                                        createElement('span', { 
                                                            key: status,
                                                            style: { 
                                                                marginRight: '15px',
                                                                padding: '2px 8px',
                                                                backgroundColor: status === 'publish' ? '#d4edda' : 
                                                                               status === 'draft' ? '#fff3cd' :
                                                                               status === 'pending' ? '#cce5ff' :
                                                                               status === 'private' ? '#f8d7da' :
                                                                               status === 'trash' ? '#e0e0e0' : '#f0f0f0',
                                                                borderRadius: '3px',
                                                                fontSize: '12px',
                                                                display: 'inline-block',
                                                                marginBottom: '4px'
                                                            }
                                                        }, `${status}: ${count}`)
                                                    );
                                                })()
                                            ),
                                            createElement('p', { style: { margin: '5px 0 0 0', fontSize: '12px' } },
                                                'Showing complete data structure for all posts including drafts, published, pending, private, and trashed posts.'
                                            )
                                        ),
                                        posts.map((post, index) => 
                                            createElement('div', { 
                                                key: post.id,
                                                style: { 
                                                    marginBottom: '30px',
                                                    padding: '20px',
                                                    backgroundColor: '#fff',
                                                    border: '2px solid #ddd',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }
                                            },
                                                createElement('div', { 
                                                    style: { 
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '15px',
                                                        paddingBottom: '10px',
                                                        borderBottom: '2px solid #f0f0f0'
                                                    }
                                                },
                                                    createElement('h3', { style: { margin: '0', color: '#23282d' } },
                                                        `[${index + 1}] Post ID: ${post.id}`
                                                    ),
                                                    createElement('div', null,
                                                        createElement('span', { 
                                                            style: { 
                                                                padding: '4px 12px',
                                                                backgroundColor: post.status === 'publish' ? '#00a32a' : 
                                                                               post.status === 'draft' ? '#f0b849' : '#dc3232',
                                                                color: '#fff',
                                                                borderRadius: '3px',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                marginRight: '10px'
                                                            }
                                                        }, post.status.toUpperCase()),
                                                        createElement('span', { 
                                                            style: { 
                                                                padding: '4px 12px',
                                                                backgroundColor: '#e0e0e0',
                                                                borderRadius: '3px',
                                                                fontSize: '12px'
                                                            }
                                                        }, `Type: ${post.type}`)
                                                    )
                                                ),
                                                
                                                // Quick Info
                                                createElement('div', { 
                                                    style: { 
                                                        marginBottom: '15px',
                                                        padding: '10px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '3px'
                                                    }
                                                },
                                                    createElement('div', { style: { marginBottom: '5px' } },
                                                        createElement('strong', null, 'Title: '),
                                                        createElement('span', null, 
                                                            post.title?.rendered || post.title?.raw || 'No title'
                                                        )
                                                    ),
                                                    createElement('div', { style: { marginBottom: '5px' } },
                                                        createElement('strong', null, 'Slug: '),
                                                        createElement('code', { 
                                                            style: { 
                                                                backgroundColor: '#fff',
                                                                padding: '2px 6px',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '2px'
                                                            }
                                                        }, post.slug)
                                                    ),
                                                    createElement('div', { style: { marginBottom: '5px' } },
                                                        createElement('strong', null, 'Date: '),
                                                        createElement('span', null, new Date(post.date).toLocaleString())
                                                    ),
                                                    createElement('div', null,
                                                        createElement('strong', null, 'Link: '),
                                                        createElement('a', { 
                                                            href: post.link,
                                                            target: '_blank',
                                                            style: { color: '#0073aa' }
                                                        }, post.link)
                                                    )
                                                ),
                                                
                                                // Complete Data Structure
                                                createElement('div', null,
                                                    createElement('h4', { 
                                                        style: { 
                                                            margin: '15px 0 10px 0',
                                                            padding: '5px',
                                                            backgroundColor: '#23282d',
                                                            color: '#fff',
                                                            fontSize: '14px'
                                                        }
                                                    }, 'Complete Post Data Structure (All Attributes)'),
                                                    createElement('pre', { 
                                                        style: { 
                                                            padding: '15px',
                                                            backgroundColor: '#282c34',
                                                            color: '#abb2bf',
                                                            border: '1px solid #000',
                                                            borderRadius: '3px',
                                                            fontSize: '12px',
                                                            overflow: 'auto',
                                                            maxHeight: '400px',
                                                            lineHeight: '1.4'
                                                        }
                                                    },
                                                        JSON.stringify(post, null, 2)
                                                    )
                                                ),
                                                
                                                // Metadata Section
                                                post.meta && Object.keys(post.meta).length > 0 && 
                                                createElement('div', { style: { marginTop: '15px' } },
                                                    createElement('h4', { 
                                                        style: { 
                                                            margin: '15px 0 10px 0',
                                                            padding: '5px',
                                                            backgroundColor: '#0073aa',
                                                            color: '#fff',
                                                            fontSize: '14px'
                                                        }
                                                    }, 'Post Metadata (Custom Fields)'),
                                                    createElement('pre', { 
                                                        style: { 
                                                            padding: '15px',
                                                            backgroundColor: '#f4f4f4',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '3px',
                                                            fontSize: '12px',
                                                            overflow: 'auto',
                                                            maxHeight: '300px'
                                                        }
                                                    },
                                                        JSON.stringify(post.meta, null, 2)
                                                    )
                                                )
                                            )
                                        )
                                    )
                        )
                    )
                );
            } else {
                // Documentation Tab
                return createElement('div', null,
                    createElement(Card, { style: { marginBottom: '20px' } },
                        createElement(CardHeader, null,
                            createElement('h2', null, __('API Documentation', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            createElement('h3', { style: { marginBottom: '15px' } }, __('Getting Started', 'synthseo-publisher')),
                            createElement('p', { style: { marginBottom: '10px' } }, 
                                __('Configure your SynthSEO platform with the following connection details:', 'synthseo-publisher')
                            ),
                            createElement('table', { style: { width: '100%', marginBottom: '20px' } },
                                createElement('tbody', null,
                                    createElement('tr', null,
                                        createElement('td', { style: { padding: '8px 0', fontWeight: 'bold' } }, __('API Base URL:', 'synthseo-publisher')),
                                        createElement('td', null, 
                                            createElement('code', { style: { backgroundColor: '#f0f0f1', padding: '4px 8px' } }, 
                                                window.location.origin
                                            )
                                        )
                                    ),
                                    createElement('tr', null,
                                        createElement('td', { style: { padding: '8px 0', fontWeight: 'bold' } }, __('API Key:', 'synthseo-publisher')),
                                        createElement('td', null, 
                                            createElement('code', { style: { backgroundColor: '#f0f0f1', padding: '4px 8px' } }, 
                                                settings.apiKey || __('Not configured', 'synthseo-publisher')
                                            )
                                        )
                                    )
                                )
                            ),
                            
                            createElement('h3', { style: { marginTop: '30px', marginBottom: '15px' } }, 
                                __('Available Endpoints', 'synthseo-publisher')
                            ),
                            createElement('div', { style: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px' } },
                                createElement('div', { style: { marginBottom: '15px' } },
                                    createElement('h4', { style: { margin: '0 0 5px 0' } }, 'GET /wp-json/synthseo/v2/status'),
                                    createElement('p', { style: { margin: '0', color: '#666' } }, 
                                        __('Check API connection and plugin status', 'synthseo-publisher')
                                    )
                                ),
                                createElement('div', { style: { marginBottom: '15px' } },
                                    createElement('h4', { style: { margin: '0 0 5px 0' } }, 'POST /wp-json/synthseo/v2/publish'),
                                    createElement('p', { style: { margin: '0', color: '#666' } }, 
                                        __('Publish a single article with SEO metadata', 'synthseo-publisher')
                                    )
                                ),
                                createElement('div', { style: { marginBottom: '15px' } },
                                    createElement('h4', { style: { margin: '0 0 5px 0' } }, 'POST /wp-json/synthseo/v2/batch'),
                                    createElement('p', { style: { margin: '0', color: '#666' } }, 
                                        __('Publish multiple articles in a single request', 'synthseo-publisher')
                                    )
                                ),
                                createElement('div', { style: { marginBottom: '15px' } },
                                    createElement('h4', { style: { margin: '0 0 5px 0' } }, 'PUT /wp-json/synthseo/v2/update/{id}'),
                                    createElement('p', { style: { margin: '0', color: '#666' } }, 
                                        __('Update an existing article', 'synthseo-publisher')
                                    )
                                ),
                                createElement('div', null,
                                    createElement('h4', { style: { margin: '0 0 5px 0' } }, 'DELETE /wp-json/synthseo/v2/delete/{id}'),
                                    createElement('p', { style: { margin: '0', color: '#666' } }, 
                                        __('Delete an article', 'synthseo-publisher')
                                    )
                                )
                            )
                        )
                    ),
                    
                    createElement(Card, null,
                        createElement(CardHeader, null,
                            createElement('h2', null, __('Request Headers', 'synthseo-publisher'))
                        ),
                        createElement(CardBody, null,
                            createElement('p', { style: { marginBottom: '15px' } }, 
                                __('All API requests must include the following headers:', 'synthseo-publisher')
                            ),
                            createElement('pre', { 
                                style: { 
                                    backgroundColor: '#2d2d2d', 
                                    color: '#f8f8f2',
                                    padding: '15px', 
                                    borderRadius: '4px',
                                    overflow: 'auto'
                                } 
                            },
                                'X-API-Key: ' + (settings.apiKey || 'YOUR_API_KEY') + '\\n' +
                                'Content-Type: application/json'
                            ),
                            
                            createElement('h3', { style: { marginTop: '30px', marginBottom: '15px' } }, 
                                __('Example Request', 'synthseo-publisher')
                            ),
                            createElement('pre', { 
                                style: { 
                                    backgroundColor: '#2d2d2d', 
                                    color: '#f8f8f2',
                                    padding: '15px', 
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '13px'
                                } 
                            },
                                JSON.stringify({
                                    title: "Sample Article Title",
                                    content: "Article content with HTML markup...",
                                    excerpt: "Brief article summary",
                                    meta_description: "SEO meta description",
                                    keywords: ["keyword1", "keyword2"],
                                    author: "Author Name",
                                    featured_image: "/path/to/local/image.jpg"
                                }, null, 2)
                            )
                        )
                    )
                );
            }
        })
    );
};

// Mount the app when DOM is ready
const mountApp = () => {
    const root = document.getElementById('synthseo-admin-root');
    
    if (root && window.wp && window.wp.element) {
        try {
            // Get initial tab from data attribute if present
            const initialTab = root.getAttribute('data-initial-tab') || 'settings';
            
            // Pass initial tab as prop
            render(createElement(AdminApp, { initialTab }), root);
        } catch (error) {
            root.innerHTML = '<div class="notice notice-error"><p>Error loading admin interface: ' + error.message + '</p></div>';
        }
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}