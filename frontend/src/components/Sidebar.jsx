// frontend/src/components/Sidebar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, MapPin, Users, Calendar, Hash, TrendingUp } from 'lucide-react'

const navigation = [
  { name: 'Home Feed', href: '/', icon: Home },
  { name: 'Local Community', href: '/local', icon: MapPin },
  { name: 'Following', href: '/following', icon: Users },
  { name: 'Local Events', href: '/events', icon: Calendar },
  { name: 'Topics', href: '/topics', icon: Hash },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
]

function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-16">
      <div className="p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Privacy Notice */}
        <div className="mt-8 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Privacy First</h3>
          <p className="text-xs text-blue-600 mt-1">
            Your location is kept private and only used to show you relevant local content.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
