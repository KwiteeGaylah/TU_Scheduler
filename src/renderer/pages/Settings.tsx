import { useState, useEffect } from 'react';

interface Settings {
  id: number;
  active_semester: string;
  academic_year: string;
  updated_at: string;
}

type TabType = 'semester' | 'backup' | 'appearance' | 'about';

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('semester');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadTheme();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.settings.get();
      
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setError(response.message || 'Failed to load settings');
      }
    } catch (err) {
      setError('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  };

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;
    
    if (newTheme === 'dark') {
      // Apply dark mode styles to root
      root.classList.add('dark');
      body.style.backgroundColor = '#1a202c';
      body.style.color = '#f7fafc';
      
      // Apply dark mode to all major containers
      const containers = document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100');
      containers.forEach(el => {
        (el as HTMLElement).style.backgroundColor = '#2d3748';
        (el as HTMLElement).style.color = '#f7fafc';
      });
    } else {
      // Remove dark mode
      root.classList.remove('dark');
      body.style.backgroundColor = '#f3f4f6';
      body.style.color = '#213547';
      
      // Remove dark mode from all containers
      const containers = document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100');
      containers.forEach(el => {
        (el as HTMLElement).style.removeProperty('background-color');
        (el as HTMLElement).style.removeProperty('color');
      });
    }
  };

  const handleSemesterChange = async (semester: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await window.electronAPI.settings.updateSemester(semester);
      
      if (response.success && response.data) {
        setSettings(response.data);
        setSuccess(`✅ Switched to ${semester} successfully! Navigate to other pages to see the updated data.`);
      } else {
        setError(response.message || 'Failed to update semester');
      }
    } catch (err) {
      setError('Error updating semester');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setError(null);
      setSuccess(null);
      setBackupLoading(true);
      
      const response = await window.electronAPI.backup.createBackup();
      
      if (response.success && response.data?.backupPath) {
        setSuccess(`Backup saved successfully to:\n${response.data.backupPath}`);
      } else {
        setError(response.message || 'Failed to create backup');
      }
    } catch (err) {
      setError('Error creating backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!confirm('⚠️ WARNING: Restoring will replace ALL current data.\n\nA backup of your current database will be created automatically.\n\nContinue?')) {
        return;
      }

      console.log('Starting backup restore...');
      const response = await window.electronAPI.backup.restoreBackup('');
      console.log('Backup restore response:', response);
      
      if (response.success) {
        setSuccess('✅ Backup restored successfully! Refreshing data...');
        
        // Reload the page after 1 second to ensure all data is fresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(response.message || 'Failed to restore backup');
      }
    } catch (err) {
      console.error('Error in handleRestoreBackup:', err);
      setError('Error restoring backup');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    setSuccess(`Theme changed to ${newTheme} mode successfully!`);
    
    // Clear success after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const Tab = ({ tab, label, icon }: { tab: TabType; label: string; icon: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setError(null);
        setSuccess(null);
      }}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
        activeTab === tab
          ? 'bg-blue-600 text-white rounded-t-lg'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-t-lg'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="whitespace-pre-line">{success}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <Tab tab="semester" label="Semester" icon="📅" />
        <Tab tab="backup" label="Backup & Restore" icon="💾" />
        <Tab tab="appearance" label="Appearance" icon="🎨" />
        <Tab tab="about" label="About" icon="ℹ️" />
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow-lg p-6">
        {settings && (
          <>
            {/* Semester Tab */}
            {activeTab === 'semester' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Semester Management</h2>
                  <p className="text-gray-600">
                    Switch between Semester 1 and Semester 2. Data is isolated per semester.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Active Semester
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleSemesterChange('Semester 1')}
                      className={`flex-1 px-8 py-4 rounded-lg font-semibold transition-all ${
                        settings.active_semester === 'Semester 1'
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">📚</div>
                      Semester 1
                    </button>
                    <button
                      onClick={() => handleSemesterChange('Semester 2')}
                      className={`flex-1 px-8 py-4 rounded-lg font-semibold transition-all ${
                        settings.active_semester === 'Semester 2'
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">📖</div>
                      Semester 2
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-500">Currently active: </span>
                    <span className="text-sm font-bold text-blue-600">{settings.active_semester}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">Important Information</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Courses and schedules are <strong>semester-specific</strong></li>
                        <li>• Instructors, rooms, and sections are <strong>shared</strong> across semesters</li>
                        <li>• After switching, navigate to Courses or Schedules to see the new semester's data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup & Restore Tab */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Backup & Restore</h2>
                  <p className="text-gray-600">
                    Protect your data by creating backups and restore when needed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">💾</div>
                      <h3 className="text-lg font-semibold text-gray-800">Create Backup</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-4 text-center">
                      Save your database to a location of your choice
                    </p>
                    <button
                      onClick={handleCreateBackup}
                      disabled={backupLoading}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {backupLoading ? '⏳ Creating Backup...' : '📥 Save Backup As...'}
                    </button>
                  </div>

                  <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">📂</div>
                      <h3 className="text-lg font-semibold text-gray-800">Restore Backup</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-4 text-center">
                      Replace current data with a backup file
                    </p>
                    <button
                      onClick={handleRestoreBackup}
                      className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-md"
                    >
                      📤 Choose Backup File...
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-900 mb-2">Important Notes</h3>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• <strong>Backup regularly</strong> to prevent data loss</li>
                        <li>• Choose a safe location like an external drive or cloud storage</li>
                        <li>• Restoring will <strong>replace all current data</strong></li>
                        <li>• A safety backup is created automatically before restoring</li>
                        <li>• The page will <strong>reload automatically</strong> after a successful restore</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Appearance Settings</h2>
                  <p className="text-gray-600">
                    Customize how the application looks.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme Mode
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex-1 px-8 py-6 rounded-lg font-semibold transition-all ${
                        theme === 'light'
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-3xl mb-2">☀️</div>
                      <div>Light Mode</div>
                      <div className="text-xs mt-1 opacity-75">Bright and clear</div>
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex-1 px-8 py-6 rounded-lg font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-3xl mb-2">🌙</div>
                      <div>Dark Mode</div>
                      <div className="text-xs mt-1 opacity-75">Easy on the eyes</div>
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-500">Current theme: </span>
                    <span className="text-sm font-bold text-blue-600 capitalize">{theme} Mode</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Theme changes apply immediately across the application.
                        Your preference is saved automatically and will persist when you restart.
                        Dark mode works best in low-light environments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎓</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">TU Scheduler</h2>
                  <p className="text-gray-600">Class Scheduling & Timetable Management System</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Version</span>
                      <span className="text-sm font-semibold text-gray-800">1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Active Semester</span>
                      <span className="text-sm font-semibold text-blue-600">{settings.active_semester}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {new Date(settings.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Developer</span>
                      <span className="text-sm font-semibold text-gray-800">Kwitee D. Gaylah</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Email</span>
                      <a href="mailto:techdefensenet@gmail.com" className="text-sm font-semibold text-blue-600 hover:underline">
                        techdefensenet@gmail.com
                      </a>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Institution</span>
                      <span className="text-sm font-semibold text-gray-800">Tubman University</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Platform</span>
                      <span className="text-sm font-semibold text-gray-800">Windows Desktop</span>
                    </div>
                  </div>
                </div>

                <div className="border border-blue-300 rounded-lg p-6" style={{ backgroundColor: '#e8f2ff' }}>
                  <h3 className="font-bold mb-3" style={{ color: '#0f172a' }}>Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div style={{ color: '#1e293b' }}>✓ Semester-based schedule management</div>
                    <div style={{ color: '#1e293b' }}>✓ Conflict detection & resolution</div>
                    <div style={{ color: '#1e293b' }}>✓ Course & instructor management</div>
                    <div style={{ color: '#1e293b' }}>✓ Room & section management</div>
                    <div style={{ color: '#1e293b' }}>✓ Excel & PDF export</div>
                    <div style={{ color: '#1e293b' }}>✓ CSV import capabilities</div>
                    <div style={{ color: '#1e293b' }}>✓ Backup & restore functionality</div>
                    <div style={{ color: '#1e293b' }}>✓ Offline operation</div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>© 2025 Tubman University. All rights reserved.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
