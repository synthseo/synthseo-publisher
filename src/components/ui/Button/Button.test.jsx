/**
 * Button component tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
    it('renders with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        
        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByText('Disabled');
        expect(button).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
        render(<Button loading>Loading</Button>);
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('applies variant classes correctly', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByText('Primary')).toHaveClass('bg-blue-600');
        
        rerender(<Button variant="danger">Danger</Button>);
        expect(screen.getByText('Danger')).toHaveClass('bg-red-600');
    });

    it('applies size classes correctly', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByText('Small')).toHaveClass('px-3', 'py-1.5');
        
        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByText('Large')).toHaveClass('px-6', 'py-3');
    });
});