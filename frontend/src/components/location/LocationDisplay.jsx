import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * LocationDisplay Component
 * 
 * Displays location information in a consistent format
 * 
 * Props:
 * - location: object with { city, region, country, countryCode }
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - showIcon: boolean (default: true)
 */
function LocationDisplay({ location, size = 'md', showIcon = true }) {
  if (!location) return null;

  // Don't show if all fields are empty
  if (!location.city && !location.region && !location.country) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Format location string based on available data
  const formatLocation = () => {
    const parts = [];
    
    if (location.city) {
      parts.push(location.city);
    }
    
    if (location.region) {
      parts.push(location.region);
    }
    
    if (location.country) {
      parts.push(location.country);
    }

    return parts.join(', ');
  };

  return (
    <div className="flex items-center space-x-1 text-olive">
      {showIcon && <MapPin className={iconSizeClasses[size]} />}
      <span className={`${sizeClasses[size]} font-medium`}>
        {formatLocation()}
      </span>
    </div>
  );
}

export default LocationDisplay;