// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "../hooks/useLocation";
import { MapPin, Settings, LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";

function Navbar() {
	const { user, logout } = useAuth();
	const { hasLocation, requestLocation } = useLocation();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<nav className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<Link to="/" className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-lg">G</span>
						</div>
						<span className="text-xl font-bold text-gray-900">Glade</span>
					</Link>

					{/* Navigation Items */}
					<div className="flex items-center space-x-4">
						{/* Location Status */}
						<button
							onClick={requestLocation}
							className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${hasLocation
									? "text-green-700 bg-green-50 hover:bg-green-100"
									: "text-gray-500 hover:text-gray-700"
								}`}
						>
							<MapPin className="w-4 h-4" />
							<span>{hasLocation ? "Located" : "Enable Location"}</span>
						</button>

						{/* Notifications */}
						<NotificationBell />

						{/* User Menu */}
						<div className="flex items-center space-x-3">
							<Link
								to={`/profile/${user?.username}`}
								className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
							>
								<img
									src={
										user?.avatar_url ||
										`https://ui-avatars.com/api/?name=${user?.display_name || user?.username}`
									}
									alt={user?.display_name || user?.username}
									className="w-8 h-8 rounded-full"
								/>
								<span className="text-sm font-medium">
									{user?.display_name || user?.username}
								</span>
							</Link>

							<Link
								to="/settings"
								className="p-2 text-gray-400 hover:text-gray-500"
							>
								<Settings className="w-5 h-5" />
							</Link>

							<button
								onClick={handleLogout}
								className="p-2 text-gray-400 hover:text-red-500"
							>
								<LogOut className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
