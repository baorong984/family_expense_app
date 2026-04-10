import { defineStore } from 'pinia'
import type { User } from '~/types'

interface UserState {
  token: string
  user: User | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    user: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.is_admin === 1,
    username: (state) => state.user?.username || '',
  },

  actions: {
    async login(username: string, password: string) {
      const api = useApi()
      const res = await api.post('/api/auth/login', { username, password })

      if (res.success) {
        this.token = res.data.token
        this.user = res.data.user
        this.saveToStorage()
      } else {
        throw new Error(res.message)
      }
    },

    async logout() {
      try {
        const api = useApi()
        await api.post('/api/auth/logout')
      } catch (e) {
        // ignore
      }
      this.token = ''
      this.user = null
      this.clearStorage()
    },

    async fetchUser() {
      if (!this.token) return

      try {
        const api = useApi()
        const res = await api.get('/api/auth/me')
        if (res.success) {
          this.user = res.data
          this.saveToStorage()
        }
      } catch (e) {
        this.token = ''
        this.user = null
        this.clearStorage()
      }
    },

    async changePassword(oldPassword: string, newPassword: string) {
      const api = useApi()
      const res = await api.put('/api/auth/password', {
        old_password: oldPassword,
        new_password: newPassword,
      })

      if (!res.success) {
        throw new Error(res.message)
      }
    },

    setToken(token: string) {
      this.token = token
      this.saveToStorage()
    },

    setUser(user: User) {
      this.user = user
      this.saveToStorage()
    },

    saveToStorage() {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem('user-store', JSON.stringify({
          token: this.token,
          user: this.user,
        }))
      } catch (e) {
        // ignore
      }
    },

    clearStorage() {
      if (typeof window === 'undefined') return
      try {
        localStorage.removeItem('user-store')
      } catch (e) {
        // ignore
      }
    },

    restoreFromStorage() {
      if (typeof window === 'undefined') return
      try {
        const stored = localStorage.getItem('user-store')
        if (stored) {
          const data = JSON.parse(stored)
          this.token = data.token || ''
          this.user = data.user || null
        }
      } catch (e) {
        // ignore
      }
    },
  },
})
