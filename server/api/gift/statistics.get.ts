import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";
import type { GiftStatistics } from "~/types";

/**
 * 获取人情统计数据
 * @param start_date - 开始日期（可选）
 * @param end_date - 结束日期（可选）
 * @returns 人情统计数据
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const queryParams = getQuery(event);

  const schema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  });

  try {
    const validatedData = schema.parse(queryParams);
    const { start_date, end_date } = validatedData;

    const formatSQLDate = (isoDate: string) => {
      const dateObj = new Date(isoDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDate = start_date ? formatSQLDate(start_date) : "";
    const endDate = end_date ? formatSQLDate(end_date) : "";

    const dateCondition =
      startDate && endDate ? "AND expense_date BETWEEN ? AND ?" : "";
    const dateParams = startDate && endDate ? [startDate, endDate] : [];

    const outgoingStats = await query<any>(
      `SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN payment_type = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_type = 'item' THEN COALESCE(item_value, 0) ELSE 0 END), 0) as item_amount,
        COALESCE(SUM(CASE WHEN payment_type = 'item' THEN 1 ELSE 0 END), 0) as item_count
       FROM gifts
       WHERE gift_type = 'outgoing'
       ${dateCondition}`,
      dateParams,
    );

    const outgoing = {
      total_amount:
        parseFloat(String(outgoingStats[0]?.cash_amount || 0)) +
        parseFloat(String(outgoingStats[0]?.item_amount || 0)),
      total_count: outgoingStats[0]?.total_count || 0,
      cash_amount: parseFloat(String(outgoingStats[0]?.cash_amount || 0)),
      item_amount: parseFloat(String(outgoingStats[0]?.item_amount || 0)),
      item_count: outgoingStats[0]?.item_count || 0,
    };

    const incomingStats = await query<any>(
      `SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN payment_type = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_type = 'item' THEN COALESCE(item_value, 0) ELSE 0 END), 0) as item_amount,
        COALESCE(SUM(CASE WHEN payment_type = 'item' THEN 1 ELSE 0 END), 0) as item_count
       FROM gifts
       WHERE gift_type = 'incoming'
       ${dateCondition}`,
      dateParams,
    );

    const incoming = {
      total_amount:
        parseFloat(String(incomingStats[0]?.cash_amount || 0)) +
        parseFloat(String(incomingStats[0]?.item_amount || 0)),
      total_count: incomingStats[0]?.total_count || 0,
      cash_amount: parseFloat(String(incomingStats[0]?.cash_amount || 0)),
      item_amount: parseFloat(String(incomingStats[0]?.item_amount || 0)),
      item_count: incomingStats[0]?.item_count || 0,
    };

    const net_outgoing = outgoing.total_amount - incoming.total_amount;

    const occasionBreakdown = await query<any>(
      `SELECT
        occasion,
        COALESCE(SUM(CASE WHEN gift_type = 'outgoing' AND payment_type = 'cash' THEN amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN gift_type = 'outgoing' AND payment_type = 'item' THEN COALESCE(item_value, 0) ELSE 0 END), 0) as outgoing_amount,
        COALESCE(SUM(CASE WHEN gift_type = 'outgoing' THEN 1 ELSE 0 END), 0) as outgoing_count,
        COALESCE(SUM(CASE WHEN gift_type = 'incoming' AND payment_type = 'cash' THEN amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN gift_type = 'incoming' AND payment_type = 'item' THEN COALESCE(item_value, 0) ELSE 0 END), 0) as incoming_amount,
        COALESCE(SUM(CASE WHEN gift_type = 'incoming' THEN 1 ELSE 0 END), 0) as incoming_count
       FROM gifts
       WHERE 1=1 ${dateCondition}
       GROUP BY occasion
       ORDER BY occasion`,
      dateParams,
    );

    const personBreakdown = await query<any>(
      `SELECT
        related_person,
        COALESCE(SUM(CASE WHEN gift_type = 'outgoing' AND payment_type = 'cash' THEN amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN gift_type = 'outgoing' AND payment_type = 'item' THEN COALESCE(item_value, 0) ELSE 0 END), 0) as outgoing_amount,
        COALESCE(SUM(CASE WHEN gift_type = 'outgoing' THEN 1 ELSE 0 END), 0) as outgoing_count,
        COALESCE(SUM(CASE WHEN gift_type = 'incoming' AND payment_type = 'cash' THEN amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN gift_type = 'incoming' AND payment_type = 'item' THEN COALESCE(item_value, 0) ELSE 0 END), 0) as incoming_amount,
        COALESCE(SUM(CASE WHEN gift_type = 'incoming' THEN 1 ELSE 0 END), 0) as incoming_count
       FROM gifts
       WHERE 1=1 ${dateCondition}
       GROUP BY related_person
       ORDER BY outgoing_amount DESC`,
      dateParams,
    );

    const statistics: GiftStatistics = {
      outgoing,
      incoming,
      net_outgoing,
      occasion_breakdown: occasionBreakdown.map((item) => ({
        occasion: item.occasion,
        outgoing_amount: parseFloat(item.outgoing_amount) || 0,
        outgoing_count: item.outgoing_count || 0,
        incoming_amount: parseFloat(item.incoming_amount) || 0,
        incoming_count: item.incoming_count || 0,
      })),
      person_breakdown: personBreakdown.map((item) => ({
        related_person: item.related_person,
        outgoing_amount: parseFloat(item.outgoing_amount) || 0,
        outgoing_count: item.outgoing_count || 0,
        incoming_amount: parseFloat(item.incoming_amount) || 0,
        incoming_count: item.incoming_count || 0,
        net_amount:
          (parseFloat(item.outgoing_amount) || 0) -
          (parseFloat(item.incoming_amount) || 0),
      })),
    };

    return successResponse(statistics);
  } catch (error: any) {
    console.error("获取人情统计失败:", error);
    if (error.name === "ZodError") {
      return errorResponse(error.errors[0]?.message || "参数验证失败", 400);
    }
    return errorResponse(error.message || "获取失败", 500);
  }
});
