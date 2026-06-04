/**
 * Authentication Context
 * → see DECISIONS.md #5 (Frontend Authentication State)
 * 
 * Manages login state across the app using React Context + localStorage
 * Provides: current user, login function, logout function, loading state
 * 
 * Usage:
 *   const { user, login, logout, loading } = useAuth()
 * 
 * Flow:
 *   1. On app load, check if token exists in localStorage
 *   2. If yes, verify token with backend (GET /api/auth/me)
 *   3. If valid, set user; if expired, clear localStorage
 *   4. On login: call POST /api/auth/login, store token, redirect
 *   5. On logout: delete token, clear user
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  email: string
  account_type: 'user' | 'space_owner'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, accountType: string) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setLoading(false)
          return
        }

        // Verify token with backend
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          // Token expired or invalid
          localStorage.removeItem('auth_token')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [apiUrl])

  const login = async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      localStorage.setItem('auth_token', data.token)
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string, accountType: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, account_type: accountType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Registration failed')
      }

      // After successful registration, log in automatically
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
