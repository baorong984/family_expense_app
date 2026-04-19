import { defineStore } from "pinia";
import type {
  Gift,
  GiftStatistics,
  GiftFilters,
  GiftForm,
  Pagination,
  ApiResponse,
} from "~/types";

interface GiftState {
  gifts: Gift[];
  statistics: GiftStatistics | null;
  loading: boolean;
  pagination: Pagination;
  filters: GiftFilters;
}

export const useGiftStore = defineStore("gift", {
  state: (): GiftState => ({
    gifts: [],
    statistics: null,
    loading: false,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
    filters: {},
  }),

  getters: {
    outgoingGifts: (state) =>
      state.gifts.filter((g) => g.gift_type === "outgoing"),

    incomingGifts: (state) =>
      state.gifts.filter((g) => g.gift_type === "incoming"),

    /**
     * 计算出礼总金额
     * 根据 payment_type 分类计算：cash 类型计算 amount，item 类型计算 item_value
     * 与后端 API 统计接口保持一致
     */
    totalOutgoingAmount: (state) =>
      state.gifts
        .filter((g) => g.gift_type === "outgoing")
        .reduce((sum, g) => {
          if (g.payment_type === "cash") {
            return sum + (Number(g.amount) || 0);
          } else if (g.payment_type === "item") {
            return sum + (Number(g.item_value) || 0);
          }
          return sum;
        }, 0),

    /**
     * 计算收礼总金额
     * 根据 payment_type 分类计算：cash 类型计算 amount，item 类型计算 item_value
     * 与后端 API 统计接口保持一致
     */
    totalIncomingAmount: (state) =>
      state.gifts
        .filter((g) => g.gift_type === "incoming")
        .reduce((sum, g) => {
          if (g.payment_type === "cash") {
            return sum + (Number(g.amount) || 0);
          } else if (g.payment_type === "item") {
            return sum + (Number(g.item_value) || 0);
          }
          return sum;
        }, 0),

    netOutgoing: (state) =>
      state.totalOutgoingAmount - state.totalIncomingAmount,

    getGiftById: (state) => (id: number) =>
      state.gifts.find((g) => g.id === id),
  },

  actions: {
    async fetchGifts(
      filters?: GiftFilters,
      page: number = 1,
      pageSize: number = 20,
    ) {
      this.loading = true;
      try {
        const api = useApi();
        const params: any = { page, page_size: pageSize, ...filters };

        const res: ApiResponse<{
          list: Gift[];
          total: number;
          page: number;
          pageSize: number;
        }> = await api.get("/api/gift", { params });

        if (res.success) {
          const list = Array.isArray(res.data?.list) ? res.data.list : [];
          this.gifts = list.map((gift) => ({
            ...gift,
            amount:
              gift.amount !== null ? parseFloat(String(gift.amount)) : null,
            item_value:
              gift.item_value !== null
                ? parseFloat(String(gift.item_value))
                : null,
          }));
          this.pagination = {
            page: res.data?.page || page,
            pageSize: res.data?.pageSize || pageSize,
            total: res.data?.total || 0,
          };
          this.filters = filters || {};
        } else {
          throw new Error(res.message || "获取人情记录失败");
        }
      } catch (error) {
        console.error("获取人情记录失败:", error);
        this.gifts = [];
        this.pagination = { page, pageSize, total: 0 };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createGift(data: GiftForm) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<Gift> = await api.post("/api/gift", data);

        if (res.success) {
          await this.fetchGifts(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
          return res.data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("创建人情记录失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateGift(id: number, data: Partial<GiftForm>) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<Gift> = await api.put(`/api/gift/${id}`, data);

        if (res.success) {
          await this.fetchGifts(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
          return res.data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("更新人情记录失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteGift(id: number) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse = await api.delete(`/api/gift/${id}`);

        if (res.success) {
          await this.fetchGifts(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("删除人情记录失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async markAsReturned(
      id: number,
      isReturned: boolean,
      returnGiftId?: number,
    ) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse = await api.put(`/api/gift/${id}/return`, {
          is_returned: isReturned,
          return_gift_id: returnGiftId,
        });

        if (res.success) {
          await this.fetchGifts(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("标记回礼状态失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchStatistics(startDate: string, endDate: string) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<GiftStatistics> = await api.get(
          "/api/gift/statistics",
          {
            params: { start_date: startDate, end_date: endDate },
          },
        );

        if (res.success) {
          const data = res.data;
          if (data.outgoing) {
            data.outgoing.total_amount =
              parseFloat(String(data.outgoing.total_amount)) || 0;
            data.outgoing.cash_amount =
              parseFloat(String(data.outgoing.cash_amount)) || 0;
            data.outgoing.item_amount =
              parseFloat(String(data.outgoing.item_amount)) || 0;
          }
          if (data.incoming) {
            data.incoming.total_amount =
              parseFloat(String(data.incoming.total_amount)) || 0;
            data.incoming.cash_amount =
              parseFloat(String(data.incoming.cash_amount)) || 0;
            data.incoming.item_amount =
              parseFloat(String(data.incoming.item_amount)) || 0;
          }
          data.net_outgoing = parseFloat(String(data.net_outgoing)) || 0;
          this.statistics = data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("获取人情统计失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async exportGifts(startDate: string, endDate: string, giftType?: string) {
      try {
        const api = useApi();
        const params: any = { start_date: startDate, end_date: endDate };
        if (giftType) params.gift_type = giftType;

        const response = await api.get("/api/gift/export", {
          params,
          responseType: "blob",
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `人情记录_${startDate}_${endDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("导出人情记录失败:", error);
        throw error;
      }
    },

    resetFilters() {
      this.filters = {};
    },
  },
});
