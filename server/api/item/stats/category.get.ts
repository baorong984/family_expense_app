import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";

/**
 * 获取分类统计数据
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const stats = await query<any>(
      `SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon,
        COUNT(DISTINCT i.id) as item_count,
        COALESCE(SUM(i.purchase_amount), 0) as total_value,
        COALESCE(AVG(i.purchase_amount / (DATEDIFF(COALESCE(i.end_use_date, CURDATE()), i.start_use_date) + 1)), 0) as avg_cpd
       FROM item_categories c
       LEFT JOIN item_categories child ON child.parent_id = c.id OR child.id = c.id
       LEFT JOIN items i ON (i.category_id = c.id OR i.category_id = child.id) AND i.user_id = ? AND i.status != 'retired'
       WHERE c.parent_id IS NULL
       GROUP BY c.id, c.name, c.icon
       ORDER BY total_value DESC`,
      [user.id]
    );

    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(error.message || "获取分类统计失败", 500);
  }
});
