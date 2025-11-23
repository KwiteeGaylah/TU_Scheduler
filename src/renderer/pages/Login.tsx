import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
// @ts-ignore
import TU_Logo from '../assets/TU_Logo.png';
// @ts-ignore
import computer_science_logo from '../assets/computer_science_logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    if (!recoveryKey.trim()) {
      setRecoveryError('Please enter your recovery key');
      return;
    }

    if (newPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match');
      return;
    }

    setRecoveryLoading(true);

    try {
      const response = await window.electronAPI.backup.resetPasswordWithKey(recoveryKey.trim(), newPassword);
      
      if (response.success) {
        setRecoverySuccess('Password reset successfully! You can now log in with your new password.');
        setRecoveryKey('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Switch back to login form after 3 seconds
        setTimeout(() => {
          setShowRecovery(false);
          setRecoverySuccess(null);
        }, 3000);
      } else {
        setRecoveryError(response.message || 'Invalid recovery key or reset failed');
      }
    } catch (err) {
      setRecoveryError('Error resetting password');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--carbon-black)' }}>
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
        {/* University and Department Logos */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <img 
            src={TU_Logo} 
            alt="Tubman University" 
            className="h-24 w-auto object-contain"
          />
          <img 
            src={computer_science_logo} 
            alt="Computer Science Department" 
            className="h-24 w-auto object-contain"
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--dark-spruce)' }}>
            TU Scheduler
          </h1>
          <p className="text-gray-600 mt-1 text-sm">Class Scheduling & Timetable Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            style={{ backgroundColor: 'var(--dark-spruce)' }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'var(--hunter-green)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--dark-spruce)')}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {!showRecovery && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--amber-honey)' }}
            >
              🔑 Forgot Password? Use Recovery Key
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm border-t pt-4" style={{ color: 'var(--hunter-green)' }}>
          <p className="italic font-medium">"Empowering minds through innovation and excellence in computer science education."</p>
          <p className="text-xs text-gray-500 mt-2">- Department of Computer Science & Engineering</p>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showRecovery && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--dark-spruce)' }}>
                <span className="text-3xl">🔑</span>
                Password Recovery
              </h2>
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryError(null);
                  setRecoverySuccess(null);
                  setRecoveryKey('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {recoveryError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❌</span>
                  <span>{recoveryError}</span>
                </div>
              </div>
            )}

            {recoverySuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span>{recoverySuccess}</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Enter your recovery key</strong> to reset your password. If you don't have a recovery key, 
                you'll need to restore from a backup or reinstall the application.
              </p>
            </div>

            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recovery Key
                </label>
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tu-green font-mono text-sm"
                  placeholder="Enter your 32-character recovery key"
                  required
                  disabled={recoveryLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tu-green"
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  minLength={6}
                  disabled={recoveryLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tu-green"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  disabled={recoveryLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--dark-spruce)' }}
                >
                  {recoveryLoading ? 'Resetting...' : '🔓 Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryError(null);
                    setRecoverySuccess(null);
                    setRecoveryKey('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={recoveryLoading}
                  className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
