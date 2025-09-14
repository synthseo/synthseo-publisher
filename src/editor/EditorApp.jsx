/**
 * Main Editor Application Component
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { EditorProvider, useEditor } from '../store/EditorContext';
import { Stack } from '../components/layout/Stack';
import { SEOMetaBox } from '../components/features/editor/SEOMetaBox';
import { KeywordAnalyzer } from '../components/features/editor/KeywordAnalyzer';
import { SchemaViewer } from '../components/features/editor/SchemaViewer';
import { SEOSuggestions } from '../components/features/editor/SEOSuggestions';

const EditorContent = ({ postId }) => {
    const {
        seoData,
        postData,
        seoScore,
        seoSuggestions,
        keywords,
        loading,
        saveSeoData,
        analyzeSeo,
        updateSeoField,
        generateSchema,
    } = useEditor();
    
    useEffect(() => {
        // Analyze SEO when content changes
        const debounceTimer = setTimeout(() => {
            analyzeSeo();
        }, 1000);
        
        return () => clearTimeout(debounceTimer);
    }, [postData.content, seoData.focusKeyword]);
    
    return (
        <div className="synthseo-editor-wrap">
            <Stack direction="vertical" spacing={4}>
                <SEOMetaBox
                    postId={postId}
                    postTitle={postData.title}
                    postContent={postData.content}
                    initialData={seoData}
                    onUpdate={saveSeoData}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <KeywordAnalyzer
                        content={postData.content}
                        focusKeyword={seoData.focusKeyword}
                        onKeywordChange={(keyword) => updateSeoField('focusKeyword', keyword)}
                    />
                    
                    <SEOSuggestions
                        postData={{
                            ...postData,
                            metaDescription: seoData.metaDescription,
                        }}
                        focusKeyword={seoData.focusKeyword}
                        onSuggestionApply={(field, value) => updateSeoField(field, value)}
                    />
                </div>
                
                <SchemaViewer
                    postData={{
                        ...postData,
                        ...seoData,
                    }}
                    schemaType={seoData.schemaType}
                    onSchemaUpdate={(type) => updateSeoField('schemaType', type)}
                />
            </Stack>
        </div>
    );
};

const EditorApp = () => {
    // Get post ID from WordPress
    const postId = window.wp?.data?.select('core/editor')?.getCurrentPostId() || null;
    
    if (!postId) {
        return (
            <div className="synthseo-editor-wrap">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        {__('SEO settings will appear when editing a post.', 'synthseo-publisher')}
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <EditorProvider postId={postId}>
            <EditorContent postId={postId} />
        </EditorProvider>
    );
};

export default EditorApp;