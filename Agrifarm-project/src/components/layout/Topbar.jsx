import React, { useState } from 'react';
import { Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ setMobileOpen }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // 👉 নিচের লাইনে আপনার ছবির URL / লিঙ্ক বসিয়ে দিন:
  const USER_IMAGE_URL = "https://cdn.imgpile.com/f/ngVbDLy_wm.png"; 

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          className="btn-icon mobile-menu-btn"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileOpen(true)}
          aria-label="Open Drawer"
        >
          <Menu size={20} />
        </button>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Farm Operations Console</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--main-bg)', padding: '4px 12px 4px 6px', borderRadius: 24 }}>
          {USER_IMAGE_URL && !imageError ? (
            <img
              src={USER_IMAGE_URL}
              alt="Profile"
              onError={() => setImageError(true)}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--primary-green)'
              }}
            />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(23, 107, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--primary-green)" />
            </div>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>CEO : Md.Jamiul Islam Sunny</span>
        </div>
      </div>
    </header>
  );
}