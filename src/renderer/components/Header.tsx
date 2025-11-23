import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeSemester, setActiveSemester] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadSettings();
    
    // Set up interval to check for semester changes
    const interval = setInterval(() => {
      loadSettings();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const response = await window.electronAPI.settings.get();
      if (response.success && response.data) {
        setActiveSemester(response.data.active_semester);
        setAcademicYear(response.data.academic_year || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Welcome back!</h2>
        <p className="text-sm text-gray-600">Tubman University Registrar</p>
      </div>
      <div className="flex items-center space-x-6">
        {activeSemester && (
          <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: '#f0f9f5', borderColor: 'var(--dark-spruce)', border: '1px solid' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--dark-spruce)' }}>Active Semester</p>
            <p className="text-sm font-bold" style={{ color: 'var(--hunter-green)' }}>{activeSemester}</p>
            {academicYear && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--dark-spruce)' }}>{academicYear}</p>
            )}
          </div>
        )}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <span className="text-2xl">👤</span>
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
              >
                <span>⚙️</span>
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 rounded-b-lg flex items-center gap-2"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
