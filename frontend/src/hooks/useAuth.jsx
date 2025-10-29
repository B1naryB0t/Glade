// frontend/src/hooks/useAuth.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('auth_token'))
  const queryClient = useQueryClient()

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('auth_token', token)
    } else {
      delete apiClient.defaults.headers.common['Authorization']
      localStorage.removeItem('auth_token')
    }
  }, [token])

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!token,
    retry: false,
    onError: () => {
      setToken(null)
    }
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.invalidateQueries(['currentUser'])
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setToken(data.access_token)
      queryClient.invalidateQueries(['currentUser'])
    }
  })

  // Logout
  const logout = () => {
    setToken(null)
    queryClient.clear()
  }

  const value = {
    user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isAuthenticated: !!token && !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
