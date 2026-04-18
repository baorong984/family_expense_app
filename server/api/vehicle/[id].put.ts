import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update } from "~/server/utils/db";

/** 车辆信息验证schema */
const vehicleSchema = z.object({
  plate_number: z
    .string()
    .min(1, "车牌号不能为空")
    .max(20, "车牌号长度不能超过20个字符")
    .optional(),
  brand_model: z
    .string()
    .min(1, "品牌型号不能为空")
    .max(100, "品牌型号长度不能超过100个字符")
    .optional(),
  vehicle_type: z.enum(["fuel", "electric"]).optional(),
  initial_mileage: z.number().min(0, "初始里程数不能为负数").optional(),
  current_mileage: z.number().min(0, "当前里程数不能为负数").optional(),
  is_active: z.number().optional(),
});

/** 更新车辆信息 */
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

    const body = await readBody(event);

    /** 验证数据 */
    const validatedData = vehicleSchema.parse(body);

    /** 如果更新了车牌号，检查是否与其他车辆重复 */
    if (
      validatedData.plate_number &&
      validatedData.plate_number !== existingVehicle.plate_number
    ) {
      const duplicateVehicle = await queryOne(
        `SELECT id FROM vehicles WHERE plate_number = ? AND id != ?`,
        [validatedData.plate_number.trim(), Number(vehicleId)],
      );

      if (duplicateVehicle) {
        return errorResponse("该车牌号已被其他车辆使用", 400);
      }
    }

    /** 构建更新字段 */
    const updateFields: string[] = [];
    const params: any[] = [];

    if (validatedData.plate_number !== undefined) {
      updateFields.push("plate_number = ?");
      params.push(validatedData.plate_number.trim());
    }
    if (validatedData.brand_model !== undefined) {
      updateFields.push("brand_model = ?");
      params.push(validatedData.brand_model.trim());
    }
    if (validatedData.vehicle_type !== undefined) {
      updateFields.push("vehicle_type = ?");
      params.push(validatedData.vehicle_type);
    }
    if (validatedData.initial_mileage !== undefined) {
      updateFields.push("initial_mileage = ?");
      params.push(validatedData.initial_mileage);
    }
    if (validatedData.current_mileage !== undefined) {
      updateFields.push("current_mileage = ?");
      params.push(validatedData.current_mileage);
    }
    if (validatedData.is_active !== undefined) {
      updateFields.push("is_active = ?");
      params.push(validatedData.is_active);
    }

    if (updateFields.length === 0) {
      return errorResponse("没有需要更新的字段", 400);
    }

    params.push(Number(vehicleId));

    /** 执行更新 */
    await update(
      `UPDATE vehicles SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params,
    );

    /** 查询更新后的记录 */
    const updatedVehicle = await queryOne(
      `SELECT * FROM vehicles WHERE id = ?`,
      [Number(vehicleId)],
    );

    return successResponse(updatedVehicle, "更新成功");
  } catch (error: any) {
    console.error("更新车辆失败:", error);

    if (error.name === "ZodError") {
      return errorResponse(error.errors[0]?.message || "参数验证失败", 400);
    }

    return errorResponse(error.message || "更新失败", 500);
  }
});
