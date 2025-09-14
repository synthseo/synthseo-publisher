/**
 * Input component tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input Component', () => {
    it('renders with label', () => {
        render(<Input label="Email" name="email" />);
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('handles value changes', () => {
        const handleChange = jest.fn();
        render(<Input label="Name" name="name" onChange={handleChange} />);
        
        const input = screen.getByLabelText('Name');
        fireEvent.change(input, { target: { value: 'John Doe' } });
        
        expect(handleChange).toHaveBeenCalled();
        expect(handleChange.mock.calls[0][0].target.value).toBe('John Doe');
    });

    it('shows error message', () => {
        render(<Input label="Email" name="email" error="Invalid email" />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toHaveClass('border-red-500');
    });

    it('shows help text', () => {
        render(<Input label="Password" name="password" helpText="Must be 8+ characters" />);
        expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
    });

    it('disables input when disabled', () => {
        render(<Input label="Field" name="field" disabled />);
        expect(screen.getByLabelText('Field')).toBeDisabled();
    });

    it('marks required fields', () => {
        render(<Input label="Required Field" name="required" required />);
        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('supports different input types', () => {
        const { rerender } = render(<Input label="Email" name="email" type="email" />);
        expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
        
        rerender(<Input label="Password" name="password" type="password" />);
        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });
});