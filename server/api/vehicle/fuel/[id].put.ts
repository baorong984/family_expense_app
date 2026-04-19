import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update, query, insert } from "~/server/utils/db";

/** 加油/充电记录验证schema */
const fuelRecordSchema = z.object({
  vehicle_id: z.number().min(1, "请选择车辆").optional(),
  record_type: z.enum(["fuel", "charge"]).optional(),
  record_date: z.string().min(1, "日期不能为空").optional(),
  record_time: z.string().nullable().optional(),
  amount: z.number().positive("金额必须大于0").optional(),
  current_mileage: z.number().min(0, "里程数不能为负数").optional(),
  remarks: z.string().nullable().optional(),
});

/**
 * 查找交通分类的ID
 * @returns 交通分类ID
 */
async function getTransportCategoryId(): Promise<number | null> {
  const category = await queryOne<{ id: number }>(
    `SELECT id FROM categories WHERE name = '交通' AND parent_id IS NULL LIMIT 1`,
  );
  return category?.id || null;
}

/**
 * 创建消费记录
 * @param amount - 金额
 * @param expenseDate - 日期
 * @param expenseTime - 时间
 * @param description - 描述
 * @param userId - 用户ID
 * @returns 消费记录ID
 */
async function createExpenseRecord(
  amount: number,
  expenseDate: string,
  expenseTime: string | null,
  description: string,
  userId: number,
): Promise<number | null> {
  const categoryId = await getTransportCategoryId();
  if (!categoryId) {
    console.error("未找到交通分类");
    return null;
  }

  const expenseId = await insert(
    `INSERT INTO expenses (amount, expense_date, expense_time, category_id, description, remarks, created_by)
     VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    [amount, expenseDate, expenseTime, categoryId, description, userId],
  );

  return expenseId || null;
}

/**
 * 更新消费记录
 * @param expenseId - 消费记录ID
 * @param amount - 金额
 * @param expenseDate - 日期
 * @param expenseTime - 时间
 * @param description - 描述
 */
async function updateExpenseRecord(
  expenseId: number,
  amount: number,
  expenseDate: string,
  expenseTime: string | null,
  description: string,
): Promise<void> {
  await update(
    `UPDATE expenses SET amount = ?, expense_date = ?, expense_time = ?, description = ?, updated_at = NOW() WHERE id = ?`,
    [amount, expenseDate, expenseTime, description, expenseId],
  );
}

/** 更新加油/充电记录 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const recordId = getRouterParam(event, "id");

    if (!recordId || isNaN(Number(recordId))) {
      return errorResponse("无效的记录ID", 400);
    }

    /** 检查记录是否存在 */
    const existingRecord = await queryOne<{
      id: number;
      vehicle_id: number;
      expense_id: number | null;
      record_type: string;
      record_date: string;
      record_time: string | null;
      amount: number;
      current_mileage: number;
    }>(
      `SELECT id, vehicle_id, expense_id, record_type, record_date, record_time, amount, current_mileage FROM vehicle_fuel_records WHERE id = ?`,
      [Number(recordId)],
    );

    if (!existingRecord) {
      return errorResponse("记录不存在", 404);
    }

    const body = await readBody(event);

    /** 验证数据 */
    const validatedData = fuelRecordSchema.parse(body);

    /** 如果更新了车辆，检查车辆是否存在且启用 */
    let vehicle = null;
    if (
      validatedData.vehicle_id !== undefined &&
      validatedData.vehicle_id !== existingRecord.vehicle_id
    ) {
      vehicle = await queryOne<{
        id: number;
        plate_number: string;
        brand_model: string;
        vehicle_type: string;
        initial_mileage: number;
      }>(
        `SELECT id, plate_number, brand_model, vehicle_type, initial_mileage FROM vehicles WHERE id = ? AND is_active = 1`,
        [validatedData.vehicle_id],
      );

      if (!vehicle) {
        return errorResponse("所选车辆不存在或已停用", 400);
      }
    }

    /** 处理日期时间 */
    let recordDate = existingRecord.record_date;
    let recordTime = existingRecord.record_time;

    if (validatedData.record_date !== undefined) {
      const dateObj = new Date(validatedData.record_date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      recordDate = `${year}-${month}-${day}`;
    }

    if (validatedData.record_time !== undefined) {
      recordTime = validatedData.record_time || null;
    }

    const currentVehicleId =
      validatedData.vehicle_id !== undefined
        ? validatedData.vehicle_id
        : existingRecord.vehicle_id;
    const currentMileage =
      validatedData.current_mileage !== undefined
        ? validatedData.current_mileage
        : existingRecord.current_mileage;

    /** 获取该车辆上一次的里程数（排除当前记录） */
    const lastRecord = await queryOne<{
      id: number;
      current_mileage: number;
    }>(
      `SELECT id, current_mileage FROM vehicle_fuel_records 
       WHERE vehicle_id = ? AND id != ? 
       AND (record_date < ? OR (record_date = ? AND (record_time IS NULL OR record_time <= ?)))
       ORDER BY record_date DESC, record_time DESC 
       LIMIT 1`,
      [
        currentVehicleId,
        Number(recordId),
        recordDate,
        recordDate,
        recordTime || "23:59:59",
      ],
    );

    /** 获取车辆信息（用于获取初始里程数） */
    if (!vehicle) {
      vehicle = await queryOne<{
        id: number;
        plate_number: string;
        brand_model: string;
        vehicle_type: string;
        initial_mileage: number;
      }>(`SELECT id, plate_number, brand_model, vehicle_type, initial_mileage FROM vehicles WHERE id = ?`, [
        currentVehicleId,
      ]);
    }

    const lastMileage = lastRecord
      ? parseFloat(String(lastRecord.current_mileage))
      : vehicle?.initial_mileage || 0;

    /** 计算本次行驶里程和每公里成本 */
    const mileageDiff = currentMileage - lastMileage;
    const amount =
      validatedData.amount !== undefined
        ? validatedData.amount
        : existingRecord.amount;
    const costPerKm = mileageDiff > 0 ? amount / mileageDiff : null;

    /** 构建更新字段 */
    const updateFields: string[] = [];
    const params: any[] = [];

    updateFields.push("last_mileage = ?");
    params.push(lastMileage);
    updateFields.push("mileage_diff = ?");
    params.push(mileageDiff > 0 ? mileageDiff : null);
    updateFields.push("cost_per_km = ?");
    params.push(costPerKm);

    if (validatedData.vehicle_id !== undefined) {
      updateFields.push("vehicle_id = ?");
      params.push(validatedData.vehicle_id);
    }
    if (validatedData.record_type !== undefined) {
      updateFields.push("record_type = ?");
      params.push(validatedData.record_type);
    }
    if (validatedData.record_date !== undefined) {
      updateFields.push("record_date = ?");
      params.push(recordDate);
    }
    if (validatedData.record_time !== undefined) {
      updateFields.push("record_time = ?");
      params.push(recordTime);
    }
    if (validatedData.amount !== undefined) {
      updateFields.push("amount = ?");
      params.push(validatedData.amount);
    }
    if (validatedData.current_mileage !== undefined) {
      updateFields.push("current_mileage = ?");
      params.push(validatedData.current_mileage);
    }
    if (validatedData.remarks !== undefined) {
      updateFields.push("remarks = ?");
      params.push(validatedData.remarks || null);
    }

    params.push(Number(recordId));

    /** 执行更新 */
    await update(
      `UPDATE vehicle_fuel_records SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params,
    );

    /** 同步更新消费记录 */
    const recordType = validatedData.record_type || existingRecord.record_type;
    const recordTypeText = recordType === "fuel" ? "加油" : "充电";
    const description = `${recordTypeText} - ${vehicle?.plate_number || ""} (${vehicle?.brand_model || ""})`;

    if (existingRecord.expense_id) {
      /** 更新已有的消费记录 */
      await updateExpenseRecord(
        existingRecord.expense_id,
        amount,
        recordDate,
        recordTime,
        description,
      );
    } else {
      /** 创建新的消费记录 */
      const expenseId = await createExpenseRecord(
        amount,
        recordDate,
        recordTime,
        description,
        user.id,
      );
      if (expenseId) {
        await update(
          `UPDATE vehicle_fuel_records SET expense_id = ? WHERE id = ?`,
          [expenseId, Number(recordId)],
        );
      }
    }

    /** 查询更新后的记录（包含车辆信息） */
    const updatedRecord = await queryOne(
      `SELECT r.*, v.plate_number, v.brand_model, v.vehicle_type
       FROM vehicle_fuel_records r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.id = ?`,
      [Number(recordId)],
    );

    if (!updatedRecord) {
      return errorResponse("更新成功但查询失败", 500);
    }

    /** 同步更新车辆的基准里程数（如果里程数有变化） */
    if (validatedData.current_mileage !== undefined) {
      await update(
        `UPDATE vehicles SET base_mileage = ?, updated_at = NOW() WHERE id = ?`,
        [validatedData.current_mileage, currentVehicleId],
      );
    }

    return successResponse(updatedRecord, "更新成功");
  } catch (error: any) {
    console.error("更新加油/充电记录失败:", error);

    if (error.name === "ZodError") {
      return errorResponse(error.errors[0]?.message || "参数验证失败", 400);
    }

    return errorResponse(error.message || "更新失败", 500);
  }
});
