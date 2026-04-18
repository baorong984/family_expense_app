// 用户类型
export interface User {
  id: number;
  username: string;
  email: string | null;
  is_admin: number;
  status: number;
  created_at: string;
  updated_at: string;
  member_id?: number; // 成员登录时的成员ID
}

// 成员类型
export interface Member {
  id: number;
  name: string;
  avatar: string | null;
  password: string | null;
  color: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  expense_count?: number;
}

// 分类类型
export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  is_system: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

// 消费记录类型
export interface Expense {
  id: number;
  amount: number;
  expense_date: string;
  expense_time: string | null;
  category_id: number;
  category_name?: string;
  member_id: number | null;
  member_name?: string;
  member_color?: string;
  description: string | null;
  remarks: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// 预算类型
export interface Budget {
  id: number;
  year: number;
  month: number;
  total_amount: number;
  category_id: number | null;
  category_name?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// 分类预算
export interface CategoryBudget {
  category_id: number;
  category_name: string;
  budget_amount: number;
  spent_amount?: number;
}

// 预算执行进度
export interface BudgetProgress {
  category_id: number;
  category_name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  is_over_budget: boolean;
}

// AI识别结果
export interface RecognizeResult {
  amount: number | null;
  category: string | null;
  subcategory: string | null;
  date: string | null;
  time: string | null;
  members: string[];
  description: string | null;
  confidence: number;
}

// AI分类推荐
export interface CategoryRecommendation {
  category: string;
  subcategory: string;
  confidence: number;
}

// AI分类推荐结果
export interface ClassifyResult {
  recommendations: CategoryRecommendation[];
}

// AI分析结果
export interface AnalysisResult {
  monthOverMonth: {
    currentMonth: number;
    lastMonth: number;
    change: number;
    changeRate: number;
  } | null;
  anomalies: Array<{
    type: string;
    category: string;
    amount: number;
    budget: number;
    message: string;
  }>;
  suggestions: string[];
  prediction: {
    nextMonth: number;
    trend: string;
  } | null;
}

// 统计汇总
export interface StatisticsSummary {
  total_amount: number;
  total_count: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
  category_summary: Array<{
    category_id: number;
    category_name: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  member_summary: Array<{
    member_id: number;
    member_name: string;
    member_color: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

// 趋势数据
export interface TrendData {
  date: string;
  amount: number;
  count: number;
}

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code: number;
}

// 分页参数
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

// 消费记录筛选
export interface ExpenseFilters {
  start_date?: string;
  end_date?: string;
  category_id?: number;
  member_id?: number;
  keyword?: string;
}

// 图片识别结果
export interface ImageRecognizeResult {
  ocr_text: string;
  extracted_info: RecognizeResult;
}

// =====================================================
// 人情模块类型定义
// =====================================================

// 人情记录类型
export interface Gift {
  id: number;
  expense_id: number | null;
  gift_type: "outgoing" | "incoming";
  payment_type: "cash" | "item";
  amount: number | null;
  item_name: string | null;
  item_value: number | null;
  related_person: string;
  occasion: string;
  expense_date: string;
  expense_time: string | null;
  remarks: string | null;
  is_returned: number;
  return_gift_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  // 关联数据
  category_name?: string;
  member_name?: string;
  return_gift?: Gift;
}

// 人情记录筛选
export interface GiftFilters {
  gift_type?: "outgoing" | "incoming";
  start_date?: string;
  end_date?: string;
  related_person?: string;
  occasion?: string;
}

// 人情统计类型
export interface GiftStatistics {
  outgoing: {
    total_amount: number;
    total_count: number;
    cash_amount: number;
    item_count: number;
  };
  incoming: {
    total_amount: number;
    total_count: number;
    cash_amount: number;
    item_count: number;
  };
  net_outgoing: number;
  occasion_breakdown: Array<{
    occasion: string;
    outgoing_amount: number;
    outgoing_count: number;
    incoming_amount: number;
    incoming_count: number;
  }>;
  person_breakdown: Array<{
    related_person: string;
    outgoing_amount: number;
    outgoing_count: number;
    incoming_amount: number;
    incoming_count: number;
    net_amount: number;
  }>;
}

// 人情记录表单
export interface GiftForm {
  id?: number;
  gift_type: "outgoing" | "incoming";
  payment_type: "cash" | "item";
  amount?: number;
  item_name?: string;
  item_value?: number;
  related_person: string;
  occasion: string;
  expense_date: string;
  expense_time?: string;
  is_returned?: number;
  remarks?: string;
}

// =====================================================
// 油费/充电费管理模块类型定义
// =====================================================

/** 车辆信息类型 */
export interface Vehicle {
  id: number;
  plate_number: string;
  brand_model: string;
  vehicle_type: "fuel" | "electric";
  initial_mileage: number;
  current_mileage: number;
  is_active: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** 车辆类型选项 */
export const VEHICLE_TYPE_OPTIONS = [
  { label: "燃油车", value: "fuel" as const },
  { label: "纯电动", value: "electric" as const },
];

/** 加油/充电记录类型 */
export interface VehicleFuelRecord {
  id: number;
  vehicle_id: number;
  record_type: "fuel" | "charge";
  record_date: string;
  record_time: string | null;
  amount: number;
  current_mileage: number;
  last_mileage: number | null;
  mileage_diff: number | null;
  cost_per_km: number | null;
  remarks: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  /** 关联数据 - 车辆信息 */
  vehicle?: Vehicle;
}

/** 记录类型选项 */
export const RECORD_TYPE_OPTIONS = [
  { label: "加油", value: "fuel" as const },
  { label: "充电", value: "charge" as const },
];

/** 车辆表单 */
export interface VehicleForm {
  id?: number;
  plate_number: string;
  brand_model: string;
  vehicle_type: "fuel" | "electric";
  initial_mileage: number;
  current_mileage?: number;
  is_active?: number;
}

/** 加油/充电记录表单 */
export interface VehicleFuelRecordForm {
  id?: number;
  vehicle_id: number | null;
  record_type: "fuel" | "charge";
  record_date: string;
  record_time?: string | null;
  amount: number;
  current_mileage: number;
  remarks?: string | null;
}

/** 加油/充电记录筛选条件 */
export interface VehicleFuelRecordFilters {
  vehicle_id?: number;
  record_type?: "fuel" | "charge";
  start_date?: string;
  end_date?: string;
}

/** 车辆统计概览 */
export interface VehicleStatisticsOverview {
  total_vehicles: number;
  active_vehicles: number;
  total_fuel_records: number;
  total_charge_records: number;
  total_fuel_amount: number;
  total_charge_amount: number;
  total_amount: number;
  total_mileage: number;
  avg_cost_per_km: number;
}

/** 月度趋势数据 */
export interface VehicleMonthlyTrend {
  month: string;
  year: number;
  month_num: number;
  fuel_count: number;
  charge_count: number;
  fuel_amount: number;
  charge_amount: number;
  total_amount: number;
  total_mileage: number;
  avg_cost_per_km: number;
}
