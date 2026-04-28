import { defineStore } from "pinia";

export type ItemStatus =
  | "wish"
  | "purchased"
  | "in_use"
  | "repair"
  | "idle"
  | "retired";

export interface ItemCategory {
  id: number;
  name: string;
  icon: string | null;
  parent_id: number | null;
  sort_order: number;
  children?: ItemCategory[];
}

export interface ItemEvent {
  id: number;
  item_id: number;
  event_type:
    | "purchase"
    | "start_use"
    | "repair"
    | "accessory"
    | "idle"
    | "retire"
    | "note";
  event_date: string;
  title: string | null;
  description: string | null;
  amount: number | null;
  images: string[];
  created_at: string;
}

export interface Item {
  id: number;
  user_id: number;
  name: string;
  category_id: number | null;
  category_name?: string;
  category_icon?: string;
  status: ItemStatus;
  purchase_date: string | null;
  purchase_amount: number | null;
  purchase_channel: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  warranty_end_date: string | null;
  expected_lifespan: number | null;
  storage_location: string | null;
  start_use_date: string | null;
  end_use_date: string | null;
  retire_reason: string | null;
  retire_type: "sold" | "gifted" | "discarded" | "lost" | null;
  retire_amount: number | null;
  emoji: string | null;
  images: string[];
  tags: string[];
  notes: string | null;
  cpd: number | null;
  usage_days: number | null;
  events?: ItemEvent[];
  created_at: string;
  updated_at: string;
}

export interface ItemStats {
  total_items: number;
  total_value: number;
  in_use_count: number;
  idle_count: number;
  retired_count: number;
  wish_count: number;
  avg_usage_days: number;
  avg_cpd: number;
}

export interface CategoryStats {
  category_id: number;
  category_name: string;
  category_icon: string | null;
  item_count: number;
  total_value: number;
  avg_cpd: number;
}

interface ItemState {
  items: Item[];
  categories: ItemCategory[];
  categoryTree: ItemCategory[];
  current_item: Item | null;
  stats: ItemStats | null;
  category_stats: CategoryStats[];
  loading: boolean;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export const useItemStore = defineStore("item", {
  state: (): ItemState => ({
    items: [],
    categories: [],
    categoryTree: [],
    current_item: null,
    stats: null,
    category_stats: [],
    loading: false,
    pagination: {
      page: 1,
      page_size: 20,
      total: 0,
      total_pages: 0,
    },
  }),

  getters: {
    statusText:
      () =>
      (status: ItemStatus): string => {
        const texts: Record<ItemStatus, string> = {
          wish: "想买",
          purchased: "购入",
          in_use: "使用中",
          repair: "维修",
          idle: "闲置",
          retired: "退役",
        };
        return texts[status] || status;
      },

    statusColor:
      () =>
      (status: ItemStatus): string => {
        const colors: Record<ItemStatus, string> = {
          wish: "#909399",
          purchased: "#409EFF",
          in_use: "#67C23A",
          repair: "#E6A23C",
          idle: "#F56C6C",
          retired: "#909399",
        };
        return colors[status] || "#909399";
      },

    getCategoryById:
      (state) =>
      (id: number): ItemCategory | undefined => {
        const findCategory = (
          categories: ItemCategory[],
        ): ItemCategory | undefined => {
          for (const cat of categories) {
            if (cat.id === id) return cat;
            if (cat.children) {
              const found = findCategory(cat.children);
              if (found) return found;
            }
          }
          return undefined;
        };
        return findCategory(state.categoryTree);
      },

    getCategoryName:
      (state) =>
      (id: number | null): string => {
        if (!id) return "";
        const findCategoryName = (
          categories: ItemCategory[],
          targetId: number,
        ): string => {
          for (const cat of categories) {
            if (cat.id === targetId) return cat.name;
            if (cat.children) {
              const name = findCategoryName(cat.children, targetId);
              if (name) return `${cat.name} / ${name}`;
            }
          }
          return "";
        };
        return findCategoryName(state.categoryTree, id);
      },
  },

  actions: {
    /**
     * 获取物品列表
     */
    async fetchItems(params?: {
      status?: ItemStatus;
      category_id?: number;
      search?: string;
      page?: number;
      page_size?: number;
      sort_by?: string;
      sort_order?: string;
    }) {
      this.loading = true;
      try {
        const api = useApi();
        const res = await api.get("/api/item", { params });

        if (res.success) {
          this.items = res.data.items;
          this.pagination = res.data.pagination;
        } else {
          throw new Error(res.message);
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * 获取物品详情
     */
    async fetchItem(id: number) {
      this.loading = true;
      try {
        const api = useApi();
        const res = await api.get(`/api/item/${id}`);

        if (res.success) {
          this.current_item = res.data.item;
          return res.data.item;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("[Item Store] fetchItem 异常:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 创建物品
     */
    async createItem(data: Partial<Item>) {
      const api = useApi();
      const res = await api.post("/api/item", data);

      if (res.success) {
        return res.data;
      } else {
        throw new Error(res.message);
      }
    },

    /**
     * 更新物品
     */
    async updateItem(id: number, data: Partial<Item>) {
      const api = useApi();
      const res = await api.put(`/api/item/${id}`, data);

      if (res.success) {
        return res.data;
      } else {
        throw new Error(res.message);
      }
    },

    /**
     * 删除物品
     */
    async deleteItem(id: number) {
      const api = useApi();
      const res = await api.delete(`/api/item/${id}`);

      if (!res.success) {
        throw new Error(res.message);
      }
    },

    /**
     * 添加物品事件
     */
    async addItemEvent(itemId: number, data: Partial<ItemEvent>) {
      const api = useApi();
      const res = await api.post(`/api/item/${itemId}/events`, data);

      if (res.success) {
        return res.data;
      } else {
        throw new Error(res.message);
      }
    },

    /**
     * 获取物品分类
     */
    async fetchCategories() {
      const api = useApi();
      const res = await api.get("/api/item/category");

      if (res.success) {
        this.categoryTree = res.data.categories;
        this.flattenCategories(res.data.categories);
      } else {
        throw new Error(res.message);
      }
    },

    /**
     * 扁平化分类
     */
    flattenCategories(tree: ItemCategory[]) {
      const result: ItemCategory[] = [];
      const flatten = (categories: ItemCategory[]) => {
        categories.forEach((cat) => {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            flatten(cat.children);
          }
        });
      };
      flatten(tree);
      this.categories = result;
    },

    /**
     * 获取资产统计
     */
    async fetchStats() {
      const api = useApi();
      const res = await api.get("/api/item/stats/overview");

      if (res.success) {
        this.stats = res.data.overview;
        this.category_stats = res.data.category_stats;
        return res.data;
      } else {
        throw new Error(res.message);
      }
    },

    /**
     * 清空当前物品
     */
    clearCurrentItem() {
      this.current_item = null;
    },
  },
});
