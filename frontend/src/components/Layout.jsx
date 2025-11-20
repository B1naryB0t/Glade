import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UserSearch from '../components/users/UserSearch';
import NotificationBell from './NotificationBell';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.username}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
      <nav className="bg-white shadow-md border-b-4 border-coral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-coral to-burgundy bg-clip-text text-transparent hover:scale-105 transition-transform">
                Glade
              </Link>
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                <Link
                  to="/"
                  className="text-burgundy hover:text-coral px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Home
                </Link>
              </div>
              <div className="flex-1 max-w-md mx-4">
  <UserSearch />
</div>

            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <NotificationBell />
                  <span className="text-sm text-burgundy font-medium hidden sm:block">
                    Hey, {user.username}!
                  </span>
                  <button
                    onClick={handleProfileClick}
                    className="text-burgundy hover:text-coral px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Profile
                  </button>
                  <Link
                    to="/settings"
                    className="text-burgundy hover:text-coral px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-coral to-coral-dark text-white px-5 py-2 rounded-full text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}

export default Layout;