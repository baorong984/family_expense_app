import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";

/**
 * 获取CPD排行榜
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
       WHERE i.user_id = ? AND i.start_use_date IS NOT NULL AND i.purchase_amount > 0
       ORDER BY cpd DESC
       LIMIT 20`,
      [user.id]
    );

    return successResponse(items);
  } catch (error: any) {
    return errorResponse(error.message || "获取CPD排行榜失败", 500);
  }
});
