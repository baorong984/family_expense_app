import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, insert } from "~/server/utils/db";

/** 车辆信息验证schema */
const vehicleSchema = z.object({
  plate_number: z
    .string()
    .min(1, "车牌号不能为空")
    .max(20, "车牌号长度不能超过20个字符"),
  brand_model: z
    .string()
    .min(1, "品牌型号不能为空")
    .max(100, "品牌型号长度不能超过100个字符"),
  vehicle_type: z.enum(["fuel", "electric"], {
    errorMap: () => ({ message: "车辆类型必须是燃油车或纯电动" }),
  }),
  base_mileage: z.number().min(0, "基准里程数不能为负数"),
  is_active: z.number().default(1),
});

/** 创建车辆 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const body = await readBody(event);

    /** 验证数据 */
    const validatedData = vehicleSchema.parse(body);
    const userId = user.id;

    /** 检查车牌号是否已存在 */
    const existingVehicle = await queryOne(
      `SELECT id FROM vehicles WHERE plate_number = ?`,
      [validatedData.plate_number],
    );

    if (existingVehicle) {
      return errorResponse("该车牌号已存在，请使用其他车牌号", 400);
    }

    /** 插入车辆记录 */
    const vehicleId = await insert(
      `INSERT INTO vehicles (
        plate_number, brand_model, vehicle_type,
        base_mileage, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        validatedData.plate_number.trim(),
        validatedData.brand_model.trim(),
        validatedData.vehicle_type,
        validatedData.base_mileage,
        validatedData.is_active || 1,
        userId,
      ],
    );

    if (!vehicleId) {
      return errorResponse("创建车辆失败", 500);
    }

    /** 查询刚创建的记录 */
    const vehicle = await queryOne(`SELECT * FROM vehicles WHERE id = ?`, [
      vehicleId,
    ]);

    if (!vehicle) {
      return errorResponse("创建成功但查询失败", 500);
    }

    return successResponse(vehicle, "创建成功");
  } catch (error: any) {
    console.error("创建车辆失败:", error);

    if (error.name === "ZodError") {
      return errorResponse(error.errors[0]?.message || "参数验证失败", 400);
    }

    return errorResponse(error.message || "创建失败", 500);
  }
});
