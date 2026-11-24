import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PawPrint,
  PlusCircle,
  Activity,
  BarChart3,
  Trash2,
  Settings,
  HelpCircle,
  Menu
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'All Animals', path: '/animals', icon: PawPrint },
    { name: 'Add Animal', path: '/add-animal', icon: PlusCircle },
    { name: 'Animal Health', path: '/health', icon: Activity },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'Deleted Animals', path: '/deleted', icon: Trash2 },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <NavLink to="/" className="brand-wrapper">
          <div className="brand-icon">
            <PawPrint size={20} color="#fff" />
          </div>
          {!collapsed && <span>Agri Farm</span>}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon"
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          aria-label="Toggle Navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      <ul className="nav-list">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>

      {!collapsed && (
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            Agri Farm Sunny v1.0
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--fresh-green)', fontWeight: 500 }}>
            Standalone Enterprise .JS Production
          </div>
        </div>
      )}
    </aside>
  );
}