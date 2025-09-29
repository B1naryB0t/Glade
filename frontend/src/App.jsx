// frontend/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

function App() {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				Loading...
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Routes>
				<Route
					path="/login"
					element={!user ? <LoginPage /> : <Navigate to="/" />}
				/>
				<Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
					<Route index element={<HomePage />} />
				</Route>
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</div>
	);
}

export default App;
