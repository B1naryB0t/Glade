import React, { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';

/**
 * LocationPicker Component
 * 
 * A simple location picker that allows users to select a city/region
 * Uses browser geolocation and Nominatim (OpenStreetMap) for geocoding
 * 
 * Props:
 * - onLocationSelect: callback function when location is selected
 * - initialLocation: optional initial location object { city, region, country }
 */
function LocationPicker({ onLocationSelect, initialLocation = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search for locations using Nominatim API
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `limit=5&` +
        `addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();
      
      // Format the results to extract city, region, country
      const formattedResults = data.map(result => ({
        displayName: result.display_name,
        city: result.address.city || result.address.town || result.address.village || '',
        region: result.address.state || result.address.province || '',
        country: result.address.country || '',
        countryCode: result.address.country_code?.toUpperCase() || '',
        lat: result.lat,
        lon: result.lon
      }));

      setSearchResults(formattedResults);
    } catch (err) {
      console.error('Location search error:', err);
      setError('Failed to search locations. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle location selection
  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Clear selected location
  const handleClearLocation = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
  };

  // Get current location using browser geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&` +
            `lat=${latitude}&` +
            `lon=${longitude}&` +
            `addressdetails=1`
          );

          if (!response.ok) {
            throw new Error('Failed to get location details');
          }

          const data = await response.json();
          
          const location = {
            displayName: data.display_name,
            city: data.address.city || data.address.town || data.address.village || '',
            region: data.address.state || data.address.province || '',
            country: data.address.country || '',
            countryCode: data.address.country_code?.toUpperCase() || '',
            lat: latitude,
            lon: longitude
          };

          handleSelectLocation(location);
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setError('Failed to get location details. Please search manually.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please search manually.');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="relative">
      {/* Selected Location Display */}
      {selectedLocation && !isOpen ? (
        <div className="flex items-center justify-between bg-coral-light border-2 border-coral rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-coral" />
            <span className="text-sm text-burgundy font-medium">
              {selectedLocation.city && `${selectedLocation.city}, `}
              {selectedLocation.region && `${selectedLocation.region}, `}
              {selectedLocation.country}
            </span>
          </div>
          <button
  type="button"
  onClick={handleClearLocation}
  className="text-coral hover:text-burgundy transition-colors"
            aria-label="Clear location"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
  type="button"
  onClick={() => setIsOpen(true)}
  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-coral rounded-lg text-burgundy hover:bg-coral-light transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Add Location</span>
        </button>
      )}

      {/* Location Picker Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border-2 border-coral z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-burgundy">Select Location</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-burgundy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Location Button */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-coral to-coral-dark text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isLoading ? 'Getting location...' : 'Use Current Location'}
              </span>
            </button>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search for a city or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-coral border-t-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full px-4 py-3 text-left hover:bg-coral-light transition-colors"
                  >
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-coral mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-burgundy">
                          {result.city && `${result.city}, `}
                          {result.region && `${result.region}, `}
                          {result.country}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {result.displayName}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 3 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No locations found</p>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Type at least 3 characters to search
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;