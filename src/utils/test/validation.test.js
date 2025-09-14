/**
 * Unit tests for validation utilities
 */

import { validateApiKey, validateUrl, validatePost } from '../validation';

describe('Validation Utilities', () => {
    describe('validateApiKey', () => {
        it('should validate correct API key format', () => {
            const validKey = 'abcdef1234567890abcdef1234567890';
            expect(validateApiKey(validKey)).toBe(true);
        });

        it('should reject invalid API key formats', () => {
            expect(validateApiKey('')).toBe(false);
            expect(validateApiKey('short')).toBe(false);
            expect(validateApiKey('invalid-characters!')).toBe(false);
            expect(validateApiKey(null)).toBe(false);
        });
    });

    describe('validateUrl', () => {
        it('should validate correct URLs', () => {
            expect(validateUrl('https://example.com')).toBe(true);
            expect(validateUrl('http://localhost:3000')).toBe(true);
            expect(validateUrl('https://api.example.com/path')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(validateUrl('not-a-url')).toBe(false);
            expect(validateUrl('ftp://example.com')).toBe(false);
            expect(validateUrl('')).toBe(false);
            expect(validateUrl(null)).toBe(false);
        });
    });

    describe('validatePost', () => {
        it('should validate complete post data', () => {
            const validPost = {
                title: 'Test Post',
                content: 'Post content',
                status: 'publish'
            };
            expect(validatePost(validPost)).toBe(true);
        });

        it('should reject incomplete post data', () => {
            expect(validatePost({})).toBe(false);
            expect(validatePost({ title: 'Only Title' })).toBe(false);
            expect(validatePost({ content: 'Only Content' })).toBe(false);
            expect(validatePost(null)).toBe(false);
        });
    });
});