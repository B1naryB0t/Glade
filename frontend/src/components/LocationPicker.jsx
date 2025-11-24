import { useState, useEffect } from "react";
import { apiClient } from "../services/apiClient";

function LocationPicker({ onLocationChange, initialLat, initialLng, required = false }) {
  const [latitude, setLatitude] = useState(initialLat || "");
  const [longitude, setLongitude] = useState(initialLng || "");
  const [status, setStatus] = useState(initialLat && initialLng ? "obtained" : "idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (latitude && longitude) {
      onLocationChange(parseFloat(latitude), parseFloat(longitude));
    }
  }, [latitude, longitude, onLocationChange]);

  const requestBrowserLocation = () => {
    // Check if geolocation is available
    if (!("geolocation" in navigator)) {
      setStatus("denied");
      setError("Geolocation is not supported by your browser. Please use IP-based location.");
      return;
    }

    // Check if we're on HTTPS (required for geolocation in production)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setStatus("denied");
      setError("Browser location requires HTTPS. Please use IP-based location instead.");
      return;
    }

    setStatus("requesting");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        setStatus("obtained");
        setError("");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus("denied");
        
        // Handle empty error object (browser blocking)
        if (!error.code && !error.message) {
          setError("Browser location is blocked. Please enable location services in your browser/system settings, or use IP-based location.");
          return;
        }
        
        if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
          setError("Location access denied. Please allow location access in your browser settings or use IP-based location.");
        } else if (error.code === 2 || error.code === error.POSITION_UNAVAILABLE) {
          setError("Location unavailable. Please try IP-based location.");
        } else if (error.code === 3 || error.code === error.TIMEOUT) {
          setError("Location request timed out. Please try IP-based location.");
        } else {
          setError("Browser location not available. Please use IP-based location.");
        }
      },
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: false
      }
    );
  };

  const tryIpLocation = async () => {
    setStatus("requesting");
    setError("");

    try {
      const response = await apiClient.get("/auth/location/ip/");
      if (response.data.latitude && response.data.longitude) {
        setLatitude(response.data.latitude.toString());
        setLongitude(response.data.longitude.toString());
        setStatus("obtained");
        setError("");
      } else {
        throw new Error("No location data received");
      }
    } catch (err) {
      console.error("IP location error:", err);
      const errorMsg = err.response?.data?.error || err.message;
      console.log("IP location failed:", errorMsg);
      
      // Fallback to UNC Charlotte location
      setLatitude("35.305690");
      setLongitude("-80.732181");
      setStatus("obtained");
      setError(`IP-based location unavailable (${errorMsg}). Using default location: UNC Charlotte`);
    }
  };

  const validateCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    if (type === "lat") {
      return num >= -90 && num <= 90;
    } else {
      return num >= -180 && num <= 180;
    }
  };

  const isValid = latitude && longitude && 
                  validateCoordinate(latitude, "lat") && 
                  validateCoordinate(longitude, "lng");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Location {required && "*"}
        </label>
        
        {(status === "idle" || status === "obtained") && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              requestBrowserLocation();
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {status === "obtained" ? "Update Location" : "Get My Location"}
          </button>
        )}
      </div>

      {status === "requesting" && (
        <div className="text-sm text-gray-600">
          Requesting location...
        </div>
      )}

      {status === "obtained" && (
        <div className="rounded-md p-3 bg-green-50 border border-green-200">
          <div className="text-sm font-medium text-green-800">
            ✓ Location obtained
          </div>
          {error && (
            <div className="text-xs mt-1 text-yellow-600">
              {error}
            </div>
          )}
          <div className="text-xs mt-1 text-green-600">
            Lat: {parseFloat(latitude).toFixed(6)}, Lng: {parseFloat(longitude).toFixed(6)}
          </div>
        </div>
      )}

      {status === "denied" && (
        <div className="text-center space-y-3 py-4">
          {error && (
            <div className="text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          
          <button
            type="button"
            onClick={tryIpLocation}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try IP-Based Location?
          </button>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
