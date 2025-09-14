/**
 * Post Editor Entry Point
 * 
 * This integrates React components into the WordPress post editor
 */

import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EditorApp from './EditorApp';
import '../styles/editor.css';

// Wait for editor to be ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('synthseo-editor-root');
    
    if (container) {
        const root = createRoot(container);
        root.render(<EditorApp />);
    }
});