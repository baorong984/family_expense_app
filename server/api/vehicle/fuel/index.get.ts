import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query, queryOne } from '~/server/utils/db'
import type { VehicleFuelRecord } from '~/types'

/** 获取加油/充电记录列表 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const queryParams = getQuery(event)
  
  const page = parseInt(queryParams.page as string) || 1
  const pageSize = parseInt(queryParams.page_size as string) || parseInt(queryParams.pageSize as string) || 20
  const vehicleId = queryParams.vehicle_id as string
  const recordType = queryParams.record_type as string
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string

  /** 将ISO格式日期转换为YYYY-MM-DD格式 */
  const formatSQLDate = (isoDate: string) => {
    const dateObj = new Date(isoDate)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = startDateInput ? formatSQLDate(startDateInput) : ''
  const endDate = endDateInput ? formatSQLDate(endDateInput) : ''

  /** 构建查询条件 */
  let whereClause = 'WHERE 1=1'
  const params: any[] = []
  
  if (vehicleId && !isNaN(Number(vehicleId))) {
    whereClause += ' AND r.vehicle_id = ?'
    params.push(Number(vehicleId))
  }
  if (recordType && ['fuel', 'charge'].includes(recordType)) {
    whereClause += ' AND r.record_type = ?'
    params.push(recordType)
  }
  if (startDate) {
    whereClause += ' AND r.record_date >= ?'
    params.push(startDate)
  }
  if (endDate) {
    whereClause += ' AND r.record_date <= ?'
    params.push(endDate)
  }
  
  /** 查询总数 */
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM vehicle_fuel_records r ${whereClause}`,
    params
  )
  const total = countResult?.total || 0
  
  /** 查询列表 */
  const offset = Math.max(0, (page - 1) * pageSize)
  const limit = Math.max(1, pageSize)
  
  const list = await query<VehicleFuelRecord>(
    `SELECT r.*, 
            v.plate_number,
            v.brand_model,
            v.vehicle_type
     FROM vehicle_fuel_records r
     LEFT JOIN vehicles v ON r.vehicle_id = v.id
     ${whereClause}
     ORDER BY r.record_date DESC, r.record_time DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  )
  
  return successResponse({
    list: list || [],
    total,
    page,
    pageSize,
  })
})
