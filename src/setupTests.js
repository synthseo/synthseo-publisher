/**
 * Jest test setup
 */

// Add custom jest matchers
import '@testing-library/jest-dom';

// Mock WordPress globals
global.wp = {
    element: {
        createElement: jest.fn(),
        render: jest.fn(),
    },
    data: {
        select: jest.fn(),
        dispatch: jest.fn(),
    },
    api: {
        loadPromise: Promise.resolve(),
    },
    apiFetch: jest.fn(() => Promise.resolve({})),
};

// Mock WordPress localization
global.synthseoAdmin = {
    apiUrl: 'http://localhost/wp-json',
    nonce: 'test-nonce',
    apiKey: 'test-api-key',
};

// Mock window.location
delete window.location;
window.location = {
    href: 'http://localhost',
    pathname: '/wp-admin/',
    search: '',
    hash: '',
};