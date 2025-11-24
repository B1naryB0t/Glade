// frontend/src/App.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import FollowRequestsPage from "./pages/FollowRequestsPage";
import NotificationsPage from "./pages/NotificationsPage";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import EmailVerificationPendingPage from "./pages/EmailVerificationPendingPage";
import SearchPage from "./pages/SearchPage";
import Loading from "./components/common/Loading";
import FederatedFeed from "./pages/FederatedFeed";
import WebFingerSearch from "./components/WebFingerSearch";
import "./index.css";
import InstancePage from "./pages/InstancePage";
import RemoteInstancesPage from "./pages/RemoteInstancesPage";
import RemoteUsersPage from "./pages/RemoteUsersPage";
import ActivityLogPage from "./pages/ActivityLogPage";

// Protected Layout - combines auth check with layout
function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is verified
  if (!user.email_verified) {
    return <EmailVerificationPendingPage />;
  }

  return <Layout />;
}

// Public Layout - redirects to home if already logged in
function PublicLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Email verification - accessible without auth */}
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        {/* Protected routes with Layout */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/federated" element={<FederatedFeed />} />
          <Route path="/discover" element={<WebFingerSearch />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route
            path="/profile/:username/followers"
            element={<FollowersPage />}
          />
          <Route
            path="/profile/:username/following"
            element={<FollowingPage />}
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/notifications/settings"
            element={<NotificationSettingsPage />}
          />
          <Route path="/follow-requests" element={<FollowRequestsPage />} />

          <Route path="/instance" element={<InstancePage />} />
          <Route
            path="/instance/remote-instances"
            element={<RemoteInstancesPage />}
          />
          <Route path="/instance/remote-users" element={<RemoteUsersPage />} />
          <Route path="/instance/activity-log" element={<ActivityLogPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
