/**
 * Editor Context Provider
 */

import { createContext, useContext, useState, useEffect } from '@wordpress/element';

const EditorContext = createContext();

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
};

export const EditorProvider = ({ children }) => {
    const [seoData, setSeoData] = useState({
        metaDescription: '',
        keywords: [],
        focusKeyword: '',
    });

    const value = {
        seoData,
        setSeoData,
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
};