import React from 'react';

/**
 * LocationPrivacyControl Component
 * 
 * Allows users to control how much location detail to show
 * 
 * Props:
 * - value: current location privacy level ('none', 'country', 'region', 'city')
 * - onChange: callback when level changes
 * - hasLocation: boolean - whether user has selected a location
 */

const LOCATION_PRIVACY_OPTIONS = [
  {
    value: 'none',
    label: 'No Location',
    icon: '🚫',
    description: 'Don\'t show location'
  },
  {
    value: 'country',
    label: 'Country Only',
    icon: '🌐',
    description: 'Show only country'
  },
  {
    value: 'region',
    label: 'State/Region',
    icon: '📍',
    description: 'Show state/region'
  },
  {
    value: 'city',
    label: 'City Level',
    icon: '🏙️',
    description: 'Show full city'
  }
];

function LocationPrivacyControl({ value, onChange, hasLocation }) {
  return (
    <div className={!hasLocation ? 'opacity-50 pointer-events-none' : ''}>
      <label className="block text-sm font-medium text-burgundy mb-2">
        Location Privacy
      </label>
      
      {!hasLocation ? (
        <p className="text-xs text-olive italic">
          Select a location first to control privacy settings
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LOCATION_PRIVACY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`p-2 rounded-xl border-2 text-center transition-all duration-200 ${
                  value === option.value
                    ? 'border-lime bg-lime-light shadow-md scale-105'
                    : 'border-cream hover:border-lime hover:bg-cream-light'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="font-bold text-burgundy text-xs mb-1">
                  {option.label}
                </div>
                <p className="text-xs text-olive">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
          
          {/* Helper text */}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <span className="font-medium text-blue-900">💡 Tip: </span>
            <span className="text-blue-800">
              {value === 'none' && 'Your location won\'t be visible to anyone'}
              {value === 'country' && 'Only your country will be shown'}
              {value === 'region' && 'Your state/region will be shown'}
              {value === 'city' && 'Your full city will be visible'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default LocationPrivacyControl;