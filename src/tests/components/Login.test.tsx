import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../renderer/pages/Login';

// Mock the auth store
const mockLogin = vi.fn();
vi.mock('../../renderer/store/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('TU Scheduler')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show recovery link', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
  });

  it('should handle login submission', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
    });
  });

  it('should validate required fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(usernameInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it('should show password recovery modal when clicking forgot password', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const forgotPasswordLink = screen.getByText(/forgot password\?/i);
    fireEvent.click(forgotPasswordLink);

    await waitFor(() => {
      expect(screen.getByText(/password recovery/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recovery key/i)).toBeInTheDocument();
    });
  });

  it('should handle password reset', async () => {
    global.window.electronAPI.backup.resetPasswordWithKey = vi.fn().mockResolvedValue({
      success: true,
      message: 'Password reset successfully',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Open recovery modal
    fireEvent.click(screen.getByText(/forgot password\?/i));

    await waitFor(() => {
      expect(screen.getByText(/password recovery/i)).toBeInTheDocument();
    });

    // Fill recovery form
    const recoveryKeyInput = screen.getByLabelText(/recovery key/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(recoveryKeyInput, { target: { value: 'ABCD1234EFGH5678' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit recovery form
    const resetButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(global.window.electronAPI.backup.resetPasswordWithKey).toHaveBeenCalledWith(
        'ABCD1234EFGH5678',
        'newpass123'
      );
    });
  });
});
