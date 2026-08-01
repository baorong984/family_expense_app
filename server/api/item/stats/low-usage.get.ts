import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";

/**
 * 获取低使用率物品（使用天数超过180天但日均成本超过100元）
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const items = await query<any>(
      `SELECT 
        i.id,
        i.name,
        i.purchase_amount,
        i.purchase_date,
        i.start_use_date,
        i.end_use_date,
        DATEDIFF(COALESCE(i.end_use_date, CURDATE()), i.start_use_date) + 1 as usage_days,
        i.purchase_amount / (DATEDIFF(COALESCE(i.end_use_date, CURDATE()), i.start_use_date) + 1) as cpd,
        c.name as category_name
       FROM items i
       LEFT JOIN item_categories c ON i.category_id = c.id
       WHERE i.user_id = ? 
         AND i.start_use_date IS NOT NULL 
         AND i.purchase_amount > 0
         AND i.status = 'in_use'
         AND DATEDIFF(COALESCE(i.end_use_date, CURDATE()), i.start_use_date) + 1 > 180
         AND i.purchase_amount / (DATEDIFF(COALESCE(i.end_use_date, CURDATE()), i.start_use_date) + 1) > 100
       ORDER BY cpd DESC
       LIMIT 20`,
      [user.id]
    );

    return successResponse(items);
  } catch (error: any) {
    return errorResponse(error.message || "获取低使用率物品失败", 500);
  }
});
