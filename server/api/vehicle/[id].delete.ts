/*
 * @Author: Maicro-bao baorong@airia.cn
 * @Date: 2026-04-18 16:57:17
 * @LastEditors: Maicro-bao baorong@airia.cn
 * @LastEditTime: 2026-04-18 17:29:19
 * @FilePath: \family_expense_app\server\api\vehicle\[id].delete.ts
 * @Description:
 * Copyright (c) 2026 by maicro, All Rights Reserved.
 */
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, remove } from "~/server/utils/db";

/** 删除车辆 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  try {
    const vehicleId = getRouterParam(event, "id");

    if (!vehicleId || isNaN(Number(vehicleId))) {
      return errorResponse("无效的车辆ID", 400);
    }

    /** 检查车辆是否存在 */
    const existingVehicle = await queryOne(
      `SELECT * FROM vehicles WHERE id = ?`,
      [Number(vehicleId)],
    );

    if (!existingVehicle) {
      return errorResponse("车辆不存在", 404);
    }

    /** 检查是否有关联的加油/充电记录 */
    const recordCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM vehicle_fuel_records WHERE vehicle_id = ?`,
      [Number(vehicleId)],
    );

    if (recordCount && recordCount.count > 0) {
      return errorResponse(
        `该车辆下有 ${recordCount.count} 条加油/充电记录，无法删除`,
        400,
      );
    }

    /** 执行软删除（设置 is_active = 0） */
    await remove(
      `UPDATE vehicles SET is_active = 0, updated_at = NOW() WHERE id = ?`,
      [Number(vehicleId)],
    );

    return successResponse(null, "删除成功");
  } catch (error: any) {
    console.error("删除车辆失败:", error);
    return errorResponse(error.message || "删除失败", 500);
  }
});
