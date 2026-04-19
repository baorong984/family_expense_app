import { defineStore } from "pinia";
import type {
  Vehicle,
  VehicleFuelRecord,
  VehicleForm,
  VehicleFuelRecordForm,
  VehicleFuelRecordFilters,
  VehicleStatisticsOverview,
  VehicleMonthlyTrend,
  Pagination,
  ApiResponse,
} from "~/types";

interface VehicleState {
  vehicles: Vehicle[];
  fuelRecords: VehicleFuelRecord[];
  statistics: VehicleStatisticsOverview | null;
  monthlyTrends: VehicleMonthlyTrend[];
  loading: boolean;
  pagination: Pagination;
  filters: VehicleFuelRecordFilters;
}

export const useVehicleStore = defineStore("vehicle", {
  state: (): VehicleState => ({
    vehicles: [],
    fuelRecords: [],
    statistics: null,
    monthlyTrends: [],
    loading: false,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
    filters: {},
  }),

  getters: {
    /** 获取启用的车辆列表 */
    activeVehicles: (state) => state.vehicles.filter((v) => v.is_active === 1),

    /** 按ID获取车辆信息 */
    getVehicleById: (state) => (id: number) =>
      state.vehicles.find((v) => v.id === id),

    /** 获取加油记录 */
    fuelRecordsOnly: (state) =>
      state.fuelRecords.filter((r) => r.record_type === "fuel"),

    /** 获取充电记录 */
    chargeRecordsOnly: (state) =>
      state.fuelRecords.filter((r) => r.record_type === "charge"),

    /** 计算总花费 */
    totalAmount: (state) =>
      state.fuelRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),

    /** 计算加油总金额 */
    totalFuelAmount: (state) =>
      state.fuelRecords
        .filter((r) => r.record_type === "fuel")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),

    /** 计算充电总金额 */
    totalChargeAmount: (state) =>
      state.fuelRecords
        .filter((r) => r.record_type === "charge")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
  },

  actions: {
    /** 获取车辆列表 */
    async fetchVehicles() {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<Vehicle[]> = await api.get("/api/vehicle");

        if (res.success) {
          this.vehicles = (Array.isArray(res.data) ? res.data : []).map(
            (v) => ({
              ...v,
              base_mileage:
                v.base_mileage !== null
                  ? parseFloat(String(v.base_mileage))
                  : 0,
            }),
          );
        } else {
          throw new Error(res.message || "获取车辆列表失败");
        }
      } catch (error) {
        console.error("获取车辆列表失败:", error);
        this.vehicles = [];
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 创建车辆 */
    async createVehicle(data: VehicleForm) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<Vehicle> = await api.post("/api/vehicle", data);

        if (res.success) {
          await this.fetchVehicles();
          return res.data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("创建车辆失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 更新车辆 */
    async updateVehicle(id: number, data: Partial<VehicleForm>) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<Vehicle> = await api.put(
          `/api/vehicle/${id}`,
          data,
        );

        if (res.success) {
          await this.fetchVehicles();
          return res.data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("更新车辆失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 删除车辆 */
    async deleteVehicle(id: number) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse = await api.delete(`/api/vehicle/${id}`);

        if (res.success) {
          await this.fetchVehicles();
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("删除车辆失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 获取加油/充电记录列表 */
    async fetchFuelRecords(
      filters?: VehicleFuelRecordFilters,
      page: number = 1,
      pageSize: number = 20,
    ) {
      this.loading = true;
      try {
        const api = useApi();
        const params: any = { page, page_size: pageSize, ...filters };

        const res: ApiResponse<{
          list: VehicleFuelRecord[];
          total: number;
          page: number;
          pageSize: number;
        }> = await api.get("/api/vehicle/fuel", { params });

        if (res.success) {
          const list = Array.isArray(res.data?.list) ? res.data.list : [];
          this.fuelRecords = list.map((record) => ({
            ...record,
            amount:
              record.amount !== null ? parseFloat(String(record.amount)) : 0,
            current_mileage:
              record.current_mileage !== null
                ? parseFloat(String(record.current_mileage))
                : 0,
            last_mileage:
              record.last_mileage !== null
                ? parseFloat(String(record.last_mileage))
                : null,
            mileage_diff:
              record.mileage_diff !== null
                ? parseFloat(String(record.mileage_diff))
                : null,
            cost_per_km:
              record.cost_per_km !== null
                ? parseFloat(String(record.cost_per_km))
                : null,
          }));
          this.pagination = {
            page: res.data?.page || page,
            pageSize: res.data?.pageSize || pageSize,
            total: res.data?.total || 0,
          };
          this.filters = filters || {};
        } else {
          throw new Error(res.message || "获取加油/充电记录失败");
        }
      } catch (error) {
        console.error("获取加油/充电记录失败:", error);
        this.fuelRecords = [];
        this.pagination = { page, pageSize, total: 0 };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 创建加油/充电记录 */
    async createFuelRecord(data: VehicleFuelRecordForm) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<VehicleFuelRecord> = await api.post(
          "/api/vehicle/fuel",
          data,
        );

        if (res.success) {
          await this.fetchFuelRecords(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
          return res.data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("创建加油/充电记录失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 更新加油/充电记录 */
    async updateFuelRecord(id: number, data: Partial<VehicleFuelRecordForm>) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<VehicleFuelRecord> = await api.put(
          `/api/vehicle/fuel/${id}`,
          data,
        );

        if (res.success) {
          await this.fetchFuelRecords(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
          return res.data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("更新加油/充电记录失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 删除加油/充电记录 */
    async deleteFuelRecord(id: number) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse = await api.delete(`/api/vehicle/fuel/${id}`);

        if (res.success) {
          await this.fetchFuelRecords(
            this.filters || {},
            this.pagination.page,
            this.pagination.pageSize,
          );
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("删除加油/充电记录失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 获取统计概览 */
    async fetchStatistics(startDate?: string, endDate?: string) {
      this.loading = true;
      try {
        const api = useApi();
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const res: ApiResponse<VehicleStatisticsOverview> = await api.get(
          "/api/vehicle/statistics/overview",
          { params },
        );

        if (res.success) {
          const data = res.data;
          // 确保数值类型正确转换
          data.total_fuel_amount =
            parseFloat(String(data.total_fuel_amount)) || 0;
          data.total_charge_amount =
            parseFloat(String(data.total_charge_amount)) || 0;
          data.total_amount = parseFloat(String(data.total_amount)) || 0;
          data.total_mileage = parseFloat(String(data.total_mileage)) || 0;
          data.avg_cost_per_km = parseFloat(String(data.avg_cost_per_km)) || 0;
          this.statistics = data;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("获取统计概览失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 获取月度趋势数据 */
    async fetchMonthlyTrends(year: number) {
      this.loading = true;
      try {
        const api = useApi();
        const res: ApiResponse<VehicleMonthlyTrend[]> = await api.get(
          "/api/vehicle/statistics/monthly-trends",
          {
            params: { year },
          },
        );

        if (res.success) {
          this.monthlyTrends = Array.isArray(res.data)
            ? res.data.map((trend) => ({
                ...trend,
                fuel_amount: parseFloat(String(trend.fuel_amount)) || 0,
                charge_amount: parseFloat(String(trend.charge_amount)) || 0,
                total_amount: parseFloat(String(trend.total_amount)) || 0,
                total_mileage: parseFloat(String(trend.total_mileage)) || 0,
                avg_cost_per_km: parseFloat(String(trend.avg_cost_per_km)) || 0,
              }))
            : [];
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error("获取月度趋势数据失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** 重置筛选条件 */
    resetFilters() {
      this.filters = {};
    },
  },
});
