// 用户类型
export interface User {
  id: number
  username: string
  email: string | null
  is_admin: number
  status: number
  created_at: string
  updated_at: string
}

// 成员类型
export interface Member {
  id: number
  name: string
  avatar: string | null
  password: string | null
  color: string
  created_by: number
  created_at: string
  updated_at: string
  expense_count?: number
}

// 分类类型
export interface Category {
  id: number
  name: string
  parent_id: number | null
  is_system: number
  sort_order: number
  created_at: string
  updated_at: string
  children?: Category[]
}

// 消费记录类型
export interface Expense {
  id: number
  amount: number
  expense_date: string
  expense_time: string | null
  category_id: number
  category_name?: string
  member_id: number | null
  member_name?: string
  member_color?: string
  description: string | null
  remarks: string | null
  created_by: number
  created_at: string
  updated_at: string
}

// 预算类型
export interface Budget {
  id: number
  year: number
  month: number
  total_amount: number
  category_id: number | null
  category_name?: string
  created_by: number
  created_at: string
  updated_at: string
}

// 分类预算
export interface CategoryBudget {
  category_id: number
  category_name: string
  budget_amount: number
  spent_amount?: number
}

// 预算执行进度
export interface BudgetProgress {
  category_id: number
  category_name: string
  budget: number
  spent: number
  remaining: number
  percentage: number
  is_over_budget: boolean
}

// AI识别结果
export interface RecognizeResult {
  amount: number | null
  category: string | null
  subcategory: string | null
  date: string | null
  time: string | null
  members: string[]
  description: string | null
  confidence: number
}

// AI分类推荐
export interface CategoryRecommendation {
  category: string
  subcategory: string
  confidence: number
}

// AI分类推荐结果
export interface ClassifyResult {
  recommendations: CategoryRecommendation[]
}

// AI分析结果
export interface AnalysisResult {
  monthOverMonth: {
    currentMonth: number
    lastMonth: number
    change: number
    changeRate: number
  } | null
  anomalies: Array<{
    type: string
    category: string
    amount: number
    budget: number
    message: string
  }>
  suggestions: string[]
  prediction: {
    nextMonth: number
    trend: string
  } | null
}

// 统计汇总
export interface StatisticsSummary {
  total_amount: number
  total_count: number
  avg_amount: number
  max_amount: number
  min_amount: number
  category_summary: Array<{
    category_id: number
    category_name: string
    amount: number
    count: number
    percentage: number
  }>
  member_summary: Array<{
    member_id: number
    member_name: string
    member_color: string
    amount: number
    count: number
    percentage: number
  }>
}

// 趋势数据
export interface TrendData {
  date: string
  amount: number
  count: number
}

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  code: number
}

// 分页参数
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

// 消费记录筛选
export interface ExpenseFilters {
  start_date?: string
  end_date?: string
  category_id?: number
  member_id?: number
  keyword?: string
}

// 图片识别结果
export interface ImageRecognizeResult {
  ocr_text: string
  extracted_info: RecognizeResult
}
