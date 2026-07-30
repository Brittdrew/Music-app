import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem('user')) || null
    )
    const [token, setToken] = useState(
        localStorage.getItem('token') || null
    )

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password })
        setUser(res.data.user)
        setToken(res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('token', res.data.token)
        // Return whether onboarding is needed
        return { needsOnboarding: !res.data.user.onboarding_done }
    }

    const register = async (name, email, password, password_confirmation) => {
        const res = await api.post('/register', { name, email, password, password_confirmation })
        setUser(res.data.user)
        setToken(res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('token', res.data.token)
        // New users always need onboarding
        return { needsOnboarding: true }
    }

    const googleLogin = async (idToken) => {
        const res = await api.post('/auth/google', { id_token: idToken })
        setUser(res.data.user)
        setToken(res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('token', res.data.token)
        return { needsOnboarding: !res.data.user.onboarding_done }
    }

    const logout = async () => {
        // Clear local state immediately — don't wait for the server.
        // This ensures logout always works even if the token is expired or the account was deleted.
        setUser(null)
        setToken(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        // Best-effort server call to revoke the token
        try { await api.post('/logout') } catch (_) {}
    }

    // Update local user state (e.g. after saving preferences)
    const updateUser = (updatedUser) => {
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, googleLogin, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)