/**
 * Post Editor Entry Point
 */

import { render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EditorApp from './components/EditorApp';
import './styles/editor.css';

// Wait for Gutenberg to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in the block editor
    const isBlockEditor = document.body.classList.contains('block-editor-page');
    
    if (isBlockEditor) {
        console.log('SynthSEO Editor: Block editor detected');
        // For block editor, we'll use WordPress slots
        // This will be implemented later if needed
    } else {
        // Classic editor or metabox area
        const rootElement = document.getElementById('synthseo-editor-root');
        
        if (rootElement) {
            console.log('SynthSEO Editor: Mounting React app');
            
            try {
                render(
                    <EditorApp />,
                    rootElement
                );
            } catch (error) {
                console.error('SynthSEO Editor: Failed to mount React app', error);
            }
        }
    }
});