import { NavLink } from 'react-router-dom';
// @ts-ignore
import TU_Logo from '../assets/TU_Logo.png';

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/schedules', label: 'Schedules', icon: '📅' },
    { path: '/courses', label: 'Courses', icon: '📚' },
    { path: '/instructors', label: 'Instructors', icon: '👨‍🏫' },
    { path: '/rooms', label: 'Rooms', icon: '🏫' },
    { path: '/sections', label: 'Sections', icon: '📖' },
    { path: '/users', label: 'Recovery Key', icon: '🔑' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside 
      className={`shadow-md transition-all duration-300 ${
        collapsed ? 'w-0 overflow-hidden' : 'w-64'
      }`}
      style={{ backgroundColor: 'var(--dark-spruce)' }}
    >
      <div className="p-6 border-b border-tu-green-light">
        <div className="flex items-center justify-center mb-3">
          <img 
            src={TU_Logo} 
            alt="Tubman University" 
            className="h-20 w-auto object-contain"
          />
        </div>
        <h1 className="text-lg font-bold text-center" style={{ color: 'var(--amber-honey)' }}>
          TU Scheduler
        </h1>
        <p className="text-sm text-gray-300 text-center">Class Management System</p>
      </div>
      <nav className="mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-200 hover:bg-tu-green-light transition-colors ${
                isActive ? 'bg-tu-gold text-white border-r-4' : ''
              }`
            }
            style={({ isActive }) => isActive ? { borderColor: 'var(--amber-honey)' } : {}}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
