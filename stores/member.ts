import { defineStore } from 'pinia'
import type { Member } from '~/types'

interface MemberState {
  members: Member[]
  loading: boolean
  lastFetchTime: number | null
}

export const useMemberStore = defineStore('member', {
  state: (): MemberState => ({
    members: [],
    loading: false,
    lastFetchTime: null,
  }),

  getters: {
    memberOptions: (state) =>
      state.members.map(m => ({ label: m.name, value: m.id })),

    getMemberById: (state) => (id: number) =>
      state.members.find(m => m.id === id),

    getMemberName: (state) => (id: number | null) => {
      if (!id) return ''
      const member = state.members.find(m => m.id === id)
      return member?.name || ''
    },

    getMemberColor: (state) => (id: number | null) => {
      if (!id) return '#4ECDC4'
      const member = state.members.find(m => m.id === id)
      return member?.color || '#4ECDC4'
    },
  },

  actions: {
    async fetchMembers(force = false) {
      if (!force && this.lastFetchTime && Date.now() - this.lastFetchTime < 5 * 60 * 1000) {
        return; // Cache valid for 5 minutes
      }
      this.loading = true
      try {
        const api = useApi()
        const res = await api.get('/api/member')
        if (res.success) {
          this.members = res.data.members
          this.lastFetchTime = Date.now()
        }
      } finally {
        this.loading = false
      }
    },

    async createMember(data: { name: string; avatar?: string; password?: string; color?: string }) {
      const api = useApi()
      const res = await api.post('/api/member', data)

      if (res.success) {
        await this.fetchMembers()
        return res.data
      } else {
        throw new Error(res.message)
      }
    },

    async updateMember(id: number, data: { name?: string; avatar?: string; color?: string }) {
      const api = useApi()
      const res = await api.put(`/api/member/${id}`, data)

      if (res.success) {
        await this.fetchMembers()
        return res.data
      } else {
        throw new Error(res.message)
      }
    },

    async deleteMember(id: number) {
      const api = useApi()
      const res = await api.delete(`/api/member/${id}`)

      if (res.success) {
        await this.fetchMembers()
      } else {
        throw new Error(res.message)
      }
    },
  },
})
