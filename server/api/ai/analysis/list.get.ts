import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";

/**
 * 获取AI分析记录列表
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const queryStr = getQuery(event);
  const page = parseInt(queryStr.page as string) || 1;
  const pageSize = parseInt(queryStr.page_size as string) || 10;

  try {
    const offset = (page - 1) * pageSize;

    const records = await query<any>(
      `SELECT 
        id,
        start_date,
        end_date,
        analysis_data,
        created_by,
        created_at
       FROM ai_analysis_records
       ORDER BY created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
    );

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM ai_analysis_records`,
    );

    const total = countResult[0]?.total || 0;

    return successResponse({
      list: records.map((r) => ({
        ...r,
        analysis_data:
          typeof r.analysis_data === "string"
            ? JSON.parse(r.analysis_data)
            : r.analysis_data,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error("获取AI分析记录列表失败:", error);
    return errorResponse(error.message || "获取失败", 500);
  }
});
