import { defineStore } from 'pinia'
import type { Category } from '~/types'
import { buildTree } from '~/utils/tree'

interface CategoryState {
  categories: Category[]
  tree: Category[]
  loading: boolean
}

export const useCategoryStore = defineStore('category', {
  state: (): CategoryState => ({
    categories: [],
    tree: [],
    loading: false,
  }),

  getters: {
    systemCategories: (state) => {
      const systemIds = state.categories.filter(c => c.is_system === 1).map(c => c.id)
      return state.categories.filter(c => c.is_system === 1 || (c.parent_id && systemIds.includes(c.parent_id)))
    },

    customCategories: (state) => {
      const customIds = state.categories.filter(c => c.is_system === 0).map(c => c.id)
      return state.categories.filter(c => c.is_system === 0 || (c.parent_id && customIds.includes(c.parent_id)))
    },

    parentCategories: (state) => state.categories.filter(c => !c.parent_id),

    subCategories: (state) => (parentId: number) =>
      state.categories.filter(c => c.parent_id === parentId),

    getCategoryById: (state) => (id: number) =>
      state.categories.find(c => c.id === id),

    getCategoryName: (state) => (id: number) => {
      const cat = state.categories.find(c => c.id === id)
      if (!cat) return ''

      if (cat.parent_id) {
        const parent = state.categories.find(c => c.id === cat.parent_id)
        return parent ? `${parent.name} / ${cat.name}` : cat.name
      }
      return cat.name
    },
  },

  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        const api = useApi()
        const res = await api.get('/api/category')
        console.log('分类API响应:', res);

        if (res.success) {
          // API 返回的已经是树形结构，直接使用
          this.tree = res.data.categories
          console.log('分类树形数据:', this.tree);

          // 将树形结构扁平化为数组
          const flattenCategories = (tree: Category[]): Category[] => {
            const result: Category[] = []
            tree.forEach(item => {
              result.push(item)
              if (item.children && item.children.length > 0) {
                result.push(...flattenCategories(item.children))
              }
            })
            return result
          }
          this.categories = flattenCategories(res.data.categories)
          console.log('分类扁平数据:', this.categories);
        } else {
          console.error('获取分类失败:', res.message);
          throw new Error(res.message);
        }
      } catch (error) {
        console.error('获取分类异常:', error);
        this.tree = []
        this.categories = []
        throw error;
      } finally {
        this.loading = false
      }
    },

    async createCategory(data: { name: string; parent_id?: number; sort_order?: number }) {
      const api = useApi()
      const res = await api.post('/api/category', data)

      if (res.success) {
        await this.fetchCategories()
        return res.data
      } else {
        throw new Error(res.message)
      }
    },

    async updateCategory(id: number, data: { name?: string; sort_order?: number }) {
      const api = useApi()
      const res = await api.put(`/api/category/${id}`, data)

      if (res.success) {
        await this.fetchCategories()
        return res.data
      } else {
        throw new Error(res.message)
      }
    },

    async deleteCategory(id: number) {
      const api = useApi()
      const res = await api.delete(`/api/category/${id}`)

      if (res.success) {
        await this.fetchCategories()
      } else {
        throw new Error(res.message)
      }
    },
  },
})
