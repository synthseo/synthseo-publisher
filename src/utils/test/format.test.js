/**
 * Unit tests for formatting utilities
 */

import { formatDate, formatBytes, formatNumber, truncateText } from '../format';

describe('Format Utilities', () => {
    describe('formatDate', () => {
        it('should format dates correctly', () => {
            const date = new Date('2025-08-31T10:30:00');
            expect(formatDate(date)).toMatch(/Aug 31, 2025/);
        });

        it('should handle invalid dates', () => {
            expect(formatDate('invalid')).toBe('Invalid Date');
            expect(formatDate(null)).toBe('Invalid Date');
        });
    });

    describe('formatBytes', () => {
        it('should format bytes to human readable sizes', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1048576)).toBe('1 MB');
            expect(formatBytes(1073741824)).toBe('1 GB');
        });

        it('should handle decimals correctly', () => {
            expect(formatBytes(1536)).toBe('1.5 KB');
            expect(formatBytes(1536, 0)).toBe('2 KB');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with commas', () => {
            expect(formatNumber(1000)).toBe('1,000');
            expect(formatNumber(1000000)).toBe('1,000,000');
            expect(formatNumber(123.456)).toBe('123.456');
        });

        it('should handle edge cases', () => {
            expect(formatNumber(0)).toBe('0');
            expect(formatNumber(-1000)).toBe('-1,000');
            expect(formatNumber(null)).toBe('0');
        });
    });

    describe('truncateText', () => {
        it('should truncate long text', () => {
            const longText = 'This is a very long text that needs to be truncated';
            expect(truncateText(longText, 20)).toBe('This is a very long...');
        });

        it('should not truncate short text', () => {
            const shortText = 'Short text';
            expect(truncateText(shortText, 20)).toBe('Short text');
        });

        it('should handle edge cases', () => {
            expect(truncateText('', 10)).toBe('');
            expect(truncateText(null, 10)).toBe('');
        });
    });
});