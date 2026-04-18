import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, remove } from "~/server/utils/db";

/** 删除加油/充电记录 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  try {
    const recordId = getRouterParam(event, "id");

    if (!recordId || isNaN(Number(recordId))) {
      return errorResponse("无效的记录ID", 400);
    }

    /** 检查记录是否存在 */
    const existingRecord = await queryOne(
      `SELECT * FROM vehicle_fuel_records WHERE id = ?`,
      [Number(recordId)],
    );

    if (!existingRecord) {
      return errorResponse("记录不存在", 404);
    }

    /** 执行删除 */
    await remove(`DELETE FROM vehicle_fuel_records WHERE id = ?`, [
      Number(recordId),
    ]);

    return successResponse(null, "删除成功");
  } catch (error: any) {
    console.error("删除加油/充电记录失败:", error);
    return errorResponse(error.message || "删除失败", 500);
  }
});
