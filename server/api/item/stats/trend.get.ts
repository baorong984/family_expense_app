import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";

/**
 * 获取CPD趋势数据（最近30天）
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const trendData = await query<any>(
      `SELECT 
        DATE_FORMAT(d.date, '%Y-%m-%d') as date,
        COALESCE(AVG(i.purchase_amount / DATEDIFF(d.date, i.start_use_date) + 1), 0) as avg_cpd
       FROM (
         SELECT CURDATE() - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY as date
         FROM (SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
         CROSS JOIN (SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
         CROSS JOIN (SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) c
       ) d
       LEFT JOIN items i ON i.user_id = ? 
         AND i.start_use_date <= d.date 
         AND (i.end_use_date IS NULL OR i.end_use_date >= d.date)
         AND i.purchase_amount > 0
       WHERE d.date >= CURDATE() - INTERVAL 30 DAY
       GROUP BY d.date
       ORDER BY d.date ASC`,
      [user.id]
    );

    return successResponse(trendData);
  } catch (error: any) {
    return errorResponse(error.message || "获取趋势数据失败", 500);
  }
});
