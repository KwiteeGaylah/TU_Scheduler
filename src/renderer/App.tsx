import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Instructors from './pages/Instructors';
import Rooms from './pages/Rooms';
import Sections from './pages/Sections';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Layout from './components/Layout';

function App() {
  const { user } = useAuthStore();

  // Load and apply theme on app startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/instructors" element={<Instructors />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/sections" element={<Sections />} />
                  <Route path="/schedules" element={<Schedules />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users" element={<Users />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
