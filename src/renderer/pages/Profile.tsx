import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

type ProfileTab = 'info' | 'username' | 'password' | 'security';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  
  // Name update form
  const [newUsername, setNewUsername] = useState('');
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newUsername.trim() === '') {
      setError('Username cannot be empty');
      return;
    }

    if (newUsername === user.username) {
      setError('New username is the same as current username');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await window.electronAPI.user.updateUser(user.id, {
        username: newUsername.trim(),
      });

      if (response.success && response.data) {
        setUser(response.data);
        setSuccess('Username updated successfully!');
      } else {
        setError(response.message || 'Failed to update username');
      }
    } catch (err) {
      setError('Error updating username');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First verify current password by attempting login
      const loginResponse = await window.electronAPI.user.login(user.username, currentPassword);
      
      if (!loginResponse.success) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }

      // Now update the password
      const response = await window.electronAPI.user.updateUser(user.id, {
        password: newPassword,
      });

      if (response.success) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading user information...</p>
      </div>
    );
  }

  // Tab component
  const Tab = ({ id, label, icon }: { id: ProfileTab; label: string; icon: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setError(null);
        setSuccess(null);
      }}
      className={`flex-1 px-4 py-3 font-medium text-sm rounded-t-lg transition-all ${
        activeTab === id
          ? 'text-white shadow-md'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
      }`}
      style={activeTab === id ? { backgroundColor: 'var(--dark-spruce)' } : {}}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <Tab id="info" label="Account Info" icon="👤" />
          <Tab id="username" label="Update Username" icon="✏️" />
          <Tab id="password" label="Change Password" icon="🔐" />
          <Tab id="security" label="Security Tips" icon="🔒" />
        </div>

        <div className="p-6">
          {/* Account Information Tab */}
          {activeTab === 'info' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-sm text-gray-600">Username</p>
                    <p className="font-medium text-gray-900">{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Username Tab */}
          {activeTab === 'username' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Username</h2>
              <p className="text-sm text-gray-600 mb-4">
                Change your display name. This will be shown throughout the application.
              </p>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tu-green"
                    placeholder="Enter new username"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--dark-spruce)' }}
                >
                  {loading ? 'Updating...' : 'Update Username'}
                </button>
              </form>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
              <p className="text-sm text-gray-600 mb-4">
                Update your password to keep your account secure. Password must be at least 6 characters long.
              </p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tu-green"
                    placeholder="Enter current password"
                    required
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
                    placeholder="Enter new password"
                    required
                    minLength={6}
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
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--amber-honey)' }}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tips Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Security Best Practices</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">🔒</span>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Password Security</h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Use a strong password with a mix of letters, numbers, and symbols</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Don't share your password with anyone</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Change your password regularly for better security</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>⚠️</span>
                        <span className="font-semibold">Make sure to remember your new password - there's no recovery option</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-3">Account Safety</h3>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Always log out when you finish working</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Don't leave your computer unattended while logged in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Report any suspicious activity to the system administrator</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
