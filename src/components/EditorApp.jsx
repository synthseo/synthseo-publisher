/**
 * Editor Application Component
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { EditorProvider } from '../contexts/EditorContext';
import SEOMetaBox from './features/editor/SEOMetaBox/SEOMetaBox';

// Configure apiFetch with nonce
if (window.synthseoEditor?.restNonce) {
    apiFetch.use(apiFetch.createNonceMiddleware(window.synthseoEditor.restNonce));
    apiFetch.use(apiFetch.createRootURLMiddleware(window.synthseoEditor.restUrl));
}

const EditorApp = () => {
    const [postData, setPostData] = useState({
        id: null,
        title: '',
        content: '',
        excerpt: '',
        status: '',
        meta: {}
    });
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Debug: Log what we're trying to find
        console.log('EditorApp: Initializing');
        console.log('synthseoEditor global:', window.synthseoEditor);
        console.log('post_ID element:', document.getElementById('post_ID'));
        console.log('URL params:', new URLSearchParams(window.location.search).toString());
        
        // Get post data from WordPress global or DOM
        const postId = window.synthseoEditor?.postId || 
                      document.getElementById('post_ID')?.value ||
                      new URLSearchParams(window.location.search).get('post');
        
        console.log('EditorApp: Found post ID:', postId);
        
        if (postId) {
            loadPostData(postId);
        } else {
            // New post - get title and content from DOM
            const titleEl = document.getElementById('title') || document.querySelector('.editor-post-title__input');
            const contentEl = document.getElementById('content') || document.querySelector('.wp-editor-area');
            
            setPostData({
                id: 'new',
                title: titleEl?.value || '',
                content: contentEl?.value || '',
                excerpt: '',
                status: 'draft',
                meta: {}
            });
            setLoading(false);
        }

        // Watch for title changes
        const watchTitleChanges = () => {
            const titleEl = document.getElementById('title') || document.querySelector('.editor-post-title__input');
            if (titleEl) {
                titleEl.addEventListener('input', (e) => {
                    setPostData(prev => ({ ...prev, title: e.target.value }));
                });
            }
        };
        
        watchTitleChanges();
    }, []);

    const loadPostData = async (postId) => {
        console.log('EditorApp: Loading post data for ID:', postId);
        try {
            // Load post data via REST API
            const post = await apiFetch({
                path: `/wp/v2/posts/${postId}?context=edit`,
            });
            
            console.log('EditorApp: Loaded post data:', post);
            
            setPostData({
                id: post.id,
                title: post.title.raw || post.title.rendered || '',
                content: post.content.raw || post.content.rendered || '',
                excerpt: post.excerpt.raw || post.excerpt.rendered || '',
                status: post.status,
                meta: post.meta || {}
            });
        } catch (error) {
            console.error('Failed to load post data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSEOUpdate = async (seoData) => {
        if (!postData.id || postData.id === 'new') {
            // For new posts, store in memory until post is saved
            console.log('SEO data will be saved when post is created:', seoData);
            return;
        }

        try {
            // Save SEO metadata via REST API
            await apiFetch({
                path: `/wp/v2/posts/${postData.id}`,
                method: 'POST',
                data: {
                    meta: {
                        _synthseo_meta_title: seoData.metaTitle,
                        _synthseo_meta_description: seoData.metaDescription,
                        _synthseo_focus_keyword: seoData.focusKeyword,
                        _synthseo_slug: seoData.slug,
                        _synthseo_canonical_url: seoData.canonicalUrl,
                    }
                }
            });
        } catch (error) {
            console.error('Failed to save SEO data:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="synthseo-editor-app">
                <div className="synthseo-loading">
                    {__('Loading...', 'synthseo-publisher')}
                </div>
            </div>
        );
    }

    return (
        <EditorProvider>
            <div className="synthseo-editor-app">
                <SEOMetaBox 
                    postId={postData.id}
                    postTitle={postData.title}
                    postContent={postData.content}
                    onUpdate={handleSEOUpdate}
                    initialData={{
                        metaTitle: postData.meta._synthseo_meta_title || '',
                        metaDescription: postData.meta._synthseo_meta_description || '',
                        focusKeyword: postData.meta._synthseo_focus_keyword || '',
                        slug: postData.meta._synthseo_slug || '',
                        canonicalUrl: postData.meta._synthseo_canonical_url || '',
                    }}
                />
            </div>
        </EditorProvider>
    );
};

export default EditorApp;