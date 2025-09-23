// frontend/src/hooks/useLocation.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext()

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('prompt')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      }

      setLocation(locationData)
      setPermissionStatus('granted')
      localStorage.setItem('user_location', JSON.stringify(locationData))
      return true

    } catch (error) {
      console.error('Location error:', error)
      setPermissionStatus('denied')
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Location access denied by user')
          break
        case error.POSITION_UNAVAILABLE:
          setError('Location information unavailable')
          break
        case error.TIMEOUT:
          setError('Location request timed out')
          break
        default:
          setError('An unknown error occurred')
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Load cached location on mount
  useEffect(() => {
    const cached = localStorage.getItem('user_location')
    if (cached) {
      try {
        const locationData = JSON.parse(cached)
        // Only use if less than 1 hour old
        if (Date.now() - locationData.timestamp < 3600000) {
          setLocation(locationData)
          setPermissionStatus('granted')
        }
      } catch (e) {
        console.error('Failed to parse cached location:', e)
      }
    }
  }, [])

  const clearLocation = () => {
    setLocation(null)
    setPermissionStatus('prompt')
    localStorage.removeItem('user_location')
  }

  const value = {
    location,
    permissionStatus,
    isLoading,
    error,
    requestLocation,
    clearLocation,
    hasLocation: !!location
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
