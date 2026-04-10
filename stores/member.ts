import { defineStore } from 'pinia'
import type { Member } from '~/types'

interface MemberState {
  members: Member[]
  loading: boolean
}

export const useMemberStore = defineStore('member', {
  state: (): MemberState => ({
    members: [],
    loading: false,
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
  },

  actions: {
    async fetchMembers() {
      this.loading = true
      try {
        const api = useApi()
        const res = await api.get('/api/member')
        if (res.success) {
          this.members = res.data.members
        }
      } finally {
        this.loading = false
      }
    },

    async createMember(data: { name: string; avatar?: string; password?: string }) {
      const api = useApi()
      const res = await api.post('/api/member', data)

      if (res.success) {
        await this.fetchMembers()
        return res.data
      } else {
        throw new Error(res.message)
      }
    },

    async updateMember(id: number, data: { name?: string; avatar?: string }) {
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
