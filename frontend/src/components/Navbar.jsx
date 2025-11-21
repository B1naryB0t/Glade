// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UserSearch from "./users/UserSearch";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-[#BBCC42]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#85993D]">Glade</span>
          </Link>

          {/* Search */}
          {isAuthenticated && (
            <div className="flex-1 max-w-lg mx-8">
              <UserSearch />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-gray-700 hover:text-[#85993D] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to={`/profile/${user?.username}`}
                  className="flex items-center text-gray-700 hover:text-[#85993D] px-3 py-2 rounded-md text-sm font-medium"
                >
                  <div className="w-8 h-8 bg-[#BBCC42] rounded-full flex items-center justify-center mr-2">
                    <span className="text-[#7A3644] text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="text-gray-700 hover:text-[#85993D] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#7A3644] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#5a2633]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-[#85993D] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#85993D] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#6b7a31]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
