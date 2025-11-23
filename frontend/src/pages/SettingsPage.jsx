import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function SettingsPage() {
  const navigate = useNavigate();

  // State
  const [settings, setSettings] = useState({
    email: "",
    username: "",
    display_name: "",
    bio: "",
    location: { city: "", region: "" },
    profile_visibility: "public",
    default_post_privacy: "public",
    location_privacy_radius: 1000, // meters
    location_fuzzing_radius: 100, // meters - the fuzzing offset
    email_notifications: true,
    browser_notifications: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        console.log("Loading user settings");

        const userSettings = await api.getUserSettings();
        console.log("User settings loaded:", userSettings);

        setSettings({
          email: userSettings.email || "",
          username: userSettings.username || "",
          display_name: userSettings.display_name || "",
          bio: userSettings.bio || "",
          location: userSettings.location || { city: "", region: "" },
          profile_visibility: userSettings.profile_visibility || "public",
          default_post_privacy: userSettings.default_post_privacy || "public",
          location_privacy_radius: userSettings.location_privacy_radius || 1000,
          location_fuzzing_radius: userSettings.location_fuzzing_radius || 100,
          email_notifications: userSettings.email_notifications ?? true,
          browser_notifications: userSettings.browser_notifications ?? false,
        });

        setError("");
      } catch (error) {
        console.error("Failed to load settings:", error);
        setError("Failed to load your settings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle setting changes
  const handleChange = (field, value) => {
    setSettings((prevSettings) => {
      // Handle nested location object
      if (field.startsWith("location.")) {
        const locationField = field.split(".")[1];
        return {
          ...prevSettings,
          location: {
            ...prevSettings.location,
            [locationField]: value,
          },
        };
      }

      // Handle regular fields
      return {
        ...prevSettings,
        [field]: value,
      };
    });
  };

  // Handle form submission
  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("Saving settings:", settings);

      await api.updateUserSettings(settings);

      setSuccessMessage("Settings saved successfully!");
      setError("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Typically you would use a geocoding service here
            // For this demo, we'll just set some default values
            setSettings((prev) => ({
              ...prev,
              location: {
                city: "Charlotte", // This would normally come from geocoding API
                region: "North Carolina", // This would normally come from geocoding API
              },
            }));
          } catch (err) {
            console.error("Error getting location:", err);
            setError("Could not determine your current location.");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting position:", error);
          setLoading(false);
          setError(
            "Failed to get your current location. Please enter it manually.",
          );
        },
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            Account Settings
          </h1>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-[#7A3644] text-[#7A3644]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "privacy"
                    ? "border-[#7A3644] text-[#7A3644]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Privacy & Location
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "notifications"
                    ? "border-[#7A3644] text-[#7A3644]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Notifications
              </button>
            </nav>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-6 pt-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setError("")}
                      className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={settings.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                  placeholder="Your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                  placeholder="Tell us about yourself"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Briefly describe yourself or your interests
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-sm text-[#7A3644] hover:text-[#5f2a35]"
                  >
                    Use my current location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={settings.location?.city || ""}
                      onChange={(e) =>
                        handleChange("location.city", e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={settings.location?.region || ""}
                      onChange={(e) =>
                        handleChange("location.region", e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                      placeholder="State/Province/Region"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Profile Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.profile_visibility}
                  onChange={(e) =>
                    handleChange("profile_visibility", e.target.value)
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Who can view your profile information
                </p>
              </div>

              {/* Default Post Privacy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Post Privacy
                </label>
                <select
                  value={settings.default_post_privacy}
                  onChange={(e) =>
                    handleChange("default_post_privacy", e.target.value)
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7A3644] focus:border-[#7A3644] sm:text-sm"
                >
                  <option value="public">Public</option>
                  <option value="local">Local</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Default privacy setting for your new posts
                </p>
              </div>

              {/* Location Fuzzing Radius */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 mb-3">
                      Location Privacy Settings
                    </h3>

                    <div className="space-y-4">
                      {/* Fuzzing Radius */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location Fuzzing:{" "}
                          {formatDistance(settings.location_fuzzing_radius)}
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="50"
                            max="500"
                            step="50"
                            value={settings.location_fuzzing_radius}
                            onChange={(e) =>
                              handleChange(
                                "location_fuzzing_radius",
                                parseInt(e.target.value),
                              )
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7A3644]"
                          />
                          <span className="text-sm text-gray-600 w-20 text-right font-medium">
                            {formatDistance(settings.location_fuzzing_radius)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-600">
                          Your exact location will be randomly offset by up to
                          this distance. Higher values provide more privacy but
                          less precise location sharing.
                        </p>
                      </div>

                      {/* Privacy Level Indicator */}
                      <div className="flex items-center justify-between pt-2 border-t border-yellow-200">
                        <span className="text-xs font-medium text-gray-700">
                          Privacy Level:
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            settings.location_fuzzing_radius < 150
                              ? "bg-orange-100 text-orange-800"
                              : settings.location_fuzzing_radius < 300
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {settings.location_fuzzing_radius < 150
                            ? "Low Privacy"
                            : settings.location_fuzzing_radius < 300
                              ? "Medium Privacy"
                              : "High Privacy"}
                        </span>
                      </div>

                      {/* Visibility Radius */}
                      <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Local Post Visibility:{" "}
                          {formatDistance(settings.location_privacy_radius)}
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="500"
                            max="10000"
                            step="500"
                            value={settings.location_privacy_radius}
                            onChange={(e) =>
                              handleChange(
                                "location_privacy_radius",
                                parseInt(e.target.value),
                              )
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7A3644]"
                          />
                          <span className="text-sm text-gray-600 w-20 text-right font-medium">
                            {formatDistance(settings.location_privacy_radius)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-600">
                          How close others need to be to see your "Local" posts.
                          Larger radius means more people can see your local
                          posts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </h3>
                  <p className="text-xs text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) =>
                        handleChange("email_notifications", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A3644]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A3644]"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Browser Notifications
                  </h3>
                  <p className="text-xs text-gray-500">
                    Receive notifications in your browser
                  </p>
                </div>
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.browser_notifications}
                      onChange={(e) =>
                        handleChange("browser_notifications", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A3644]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A3644]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A3644]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#7A3644] text-white rounded-md hover:bg-[#5f2a35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A3644] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
