import React from 'react';

/**
 * PrivacySelector Component
 * 
 * Allows users to select who can see their post
 * 
 * Props:
 * - value: current visibility level ('public', 'followers', 'private')
 * - onChange: callback when visibility changes
 */

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    icon: '🌍',
    description: 'Anyone can see this post'
  },
  {
    value: 'followers',
    label: 'Followers',
    icon: '👥',
    description: 'Only your followers can see this'
  },
  {
    value: 'private',
    label: 'Private',
    icon: '🔒',
    description: 'Only you can see this'
  }
];

function PrivacySelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-burgundy mb-2">
        Who can see this?
      </label>
      
      <div className="grid grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
              value === option.value
                ? 'border-coral bg-coral-light shadow-md scale-105'
                : 'border-cream hover:border-coral hover:bg-cream-light'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xl">{option.icon}</span>
              <span className="font-bold text-burgundy text-sm">
                {option.label}
              </span>
            </div>
            <p className="text-xs text-olive">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PrivacySelector;