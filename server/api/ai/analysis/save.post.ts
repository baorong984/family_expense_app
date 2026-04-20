import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";

const schema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  analysis_data: z.object({
    analysis_date: z.string(),
    month: z.string(),
    total_spent: z.number(),
    budget_total: z.number(),
    budget_remaining: z.number(),
    budget_usage_rate: z.number(),
    year_over_year: z.object({
      has_data: z.boolean(),
      reason: z.string().optional(),
      current_month: z.number().nullable().optional(),
      last_year_month: z.number().nullable().optional(),
      change: z.number().nullable().optional(),
      change_rate: z.number().nullable().optional(),
    }),
    category_breakdown: z.array(
      z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
        transaction_count: z.number(),
      }),
    ),
    anomalies: z.array(
      z.object({
        type: z.string(),
        amount: z.number(),
        category: z.string(),
        subcategory: z.string().nullable().optional(),
        member: z.string().nullable().optional(),
        description: z.string(),
        date: z.string().optional(),
      }),
    ),
    saving_suggestions: z.array(
      z.object({
        category: z.string(),
        suggestion: z.string(),
        potential_saving: z.union([z.number(), z.string()]),
      }),
    ),
    trend_prediction: z.object({
      has_enough_data: z.boolean(),
      reason: z.string().optional(),
      predicted_amount: z.number().nullable(),
      trend: z.string(),
      confidence: z.number().nullable(),
    }),
  }),
});

/**
 * 保存AI分析记录
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const body = await readBody(event);

  const result = schema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400);
  }

  const { start_date, end_date, analysis_data } = result.data;

  try {
    await query(
      `INSERT INTO ai_analysis_records (start_date, end_date, analysis_data, created_by)
       VALUES (?, ?, ?, ?)`,
      [start_date, end_date, JSON.stringify(analysis_data), user.id],
    );

    return successResponse({ message: "保存成功" });
  } catch (error: any) {
    console.error("保存AI分析记录失败:", error);
    return errorResponse(error.message || "保存失败", 500);
  }
});
