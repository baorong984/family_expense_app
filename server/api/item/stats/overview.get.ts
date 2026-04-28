import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, query } from "~/server/utils/db";

/**
 * 获取资产总览统计
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    // 物品总数
    const totalItems = await queryOne<any>(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ?",
      [user.id],
    );

    // 资产总价值
    const totalValue = await queryOne<any>(
      "SELECT COALESCE(SUM(purchase_amount), 0) as total FROM items WHERE user_id = ? AND status != 'retired'",
      [user.id],
    );

    // 平均使用天数
    const avgUsageDays = await queryOne<any>(
      `SELECT COALESCE(AVG(DATEDIFF(COALESCE(end_use_date, CURDATE()), start_use_date) + 1), 0) as avg_days
       FROM items 
       WHERE user_id = ? AND start_use_date IS NOT NULL`,
      [user.id],
    );

    // 平均日均成本
    const avgCpd = await queryOne<any>(
      `SELECT COALESCE(AVG(purchase_amount / (DATEDIFF(COALESCE(end_use_date, CURDATE()), start_use_date) + 1)), 0) as avg_cpd
       FROM items 
       WHERE user_id = ? AND start_use_date IS NOT NULL AND purchase_amount > 0`,
      [user.id],
    );

    // 使用中的物品数量
    const inUseCount = await queryOne<any>(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'in_use'",
      [user.id],
    );

    return successResponse({
      overview: {
        total_items: Number(totalItems?.count || 0),
        total_value: Number(totalValue?.total || 0),
        avg_usage_days: Math.round(Number(avgUsageDays?.avg_days || 0)),
        avg_cpd: Number(avgCpd?.avg_cpd || 0),
        in_use_count: Number(inUseCount?.count || 0),
      },
      category_stats: [],
    });
  } catch (error: any) {
    return errorResponse(error.message || "获取资产总览失败", 500);
  }
});
