/**
 * Admin Dashboard Entry Point
 * 
 * This is the main entry point for the React-based admin interface
 */

import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AdminApp from './AdminApp';
import '../styles/admin.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('synthseo-admin-root');
    
    if (container) {
        const root = createRoot(container);
        root.render(<AdminApp />);
    }
});