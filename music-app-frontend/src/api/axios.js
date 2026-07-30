import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auto-logout on 401: token invalid or account deleted
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Only clear if we actually had a token (avoid redirect loop on login page)
            if (localStorage.getItem('token')) {
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api