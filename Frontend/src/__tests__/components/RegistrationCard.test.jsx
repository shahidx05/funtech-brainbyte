import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import RegistrationCard from '../../components/RegistrationCard';

vi.mock('axios');

describe('RegistrationCard Component Tests', () => {
  it('should render registration form elements properly', () => {
    render(<RegistrationCard onRegisterSuccess={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Alex Morgan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/alex.m@college.edu/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/CS2026091/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Proceed to Rules/i })
    ).toBeInTheDocument();
  });

  it('should submit registration and trigger onRegisterSuccess callback on API success', async () => {
    const mockOnSuccess = vi.fn();
    const mockResponse = {
      data: {
        success: true,
        data: {
          participant: { name: 'Test User', email: 'test@college.edu' },
          token: 'sample_mock_jwt_token',
        },
      },
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(<RegistrationCard onRegisterSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Alex Morgan/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText(/alex.m@college.edu/i), {
      target: { value: 'test@college.edu' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Proceed to Rules/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/register', {
        name: 'Test User',
        email: 'test@college.edu',
        rollNumber: undefined,
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(
        mockResponse.data.data.participant,
        mockResponse.data.data.token
      );
    });
  });

  it('should display error message when registration fails', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'You have already attempted this quiz.',
        },
      },
    });

    render(<RegistrationCard onRegisterSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Alex Morgan/i), {
      target: { value: 'Already User' },
    });
    fireEvent.change(screen.getByPlaceholderText(/alex.m@college.edu/i), {
      target: { value: 'already@college.edu' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Proceed to Rules/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/You have already attempted this quiz/i)
      ).toBeInTheDocument();
    });
  });
});
