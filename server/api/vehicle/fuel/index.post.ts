import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, insert, update, query } from "~/server/utils/db";

/** 加油/充电记录验证schema */
const fuelRecordSchema = z.object({
  vehicle_id: z.number().min(1, "请选择车辆"),
  record_type: z.enum(["fuel", "charge"], {
    errorMap: () => ({ message: "记录类型必须是加油或充电" }),
  }),
  record_date: z.string().min(1, "日期不能为空"),
  record_time: z.string().nullable().optional(),
  amount: z.number().positive("金额必须大于0"),
  current_mileage: z.number().min(0, "里程数不能为负数"),
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

/** 创建加油/充电记录 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const body = await readBody(event);

    /** 验证数据 */
    const validatedData = fuelRecordSchema.parse(body);
    const userId = user.id;

    /** 检查车辆是否存在且启用 */
    const vehicle = await queryOne<{
      id: number;
      plate_number: string;
      brand_model: string;
      vehicle_type: string;
      base_mileage: number;
    }>(
      `SELECT id, plate_number, brand_model, vehicle_type, base_mileage FROM vehicles WHERE id = ? AND is_active = 1`,
      [validatedData.vehicle_id],
    );

    if (!vehicle) {
      return errorResponse("所选车辆不存在或已停用", 400);
    }

    /** 处理日期时间 */
    const dateObj = new Date(validatedData.record_date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const recordDate = `${year}-${month}-${day}`;
    const recordTime = validatedData.record_time || null;

    /** 获取该车辆上一次的里程数 */
    const lastRecord = await queryOne<{
      id: number;
      current_mileage: number;
    }>(
      `SELECT id, current_mileage FROM vehicle_fuel_records 
       WHERE vehicle_id = ? AND (record_date < ? OR (record_date = ? AND (record_time IS NULL OR record_time <= ?)))
       ORDER BY record_date DESC, record_time DESC 
       LIMIT 1`,
      [
        validatedData.vehicle_id,
        recordDate,
        recordDate,
        recordTime || "23:59:59",
      ],
    );

    const lastMileage = lastRecord
      ? parseFloat(String(lastRecord.current_mileage))
      : vehicle.base_mileage;

    /** 计算本次行驶里程和每公里成本 */
    const mileageDiff = validatedData.current_mileage - lastMileage;
    const costPerKm =
      mileageDiff > 0 ? validatedData.amount / mileageDiff : null;

    /** 构建消费记录描述 */
    const recordTypeText =
      validatedData.record_type === "fuel" ? "加油" : "充电";
    const description = `${recordTypeText} - ${vehicle.plate_number} (${vehicle.brand_model})`;

    /** 创建消费记录 */
    const expenseId = await createExpenseRecord(
      validatedData.amount,
      recordDate,
      recordTime,
      description,
      userId,
    );

    /** 插入加油/充电记录 */
    const recordId = await insert(
      `INSERT INTO vehicle_fuel_records (
        vehicle_id, expense_id, record_type, record_date, record_time,
        amount, current_mileage, last_mileage,
        mileage_diff, cost_per_km, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.vehicle_id,
        expenseId,
        validatedData.record_type,
        recordDate,
        recordTime,
        validatedData.amount,
        validatedData.current_mileage,
        lastMileage,
        mileageDiff > 0 ? mileageDiff : null,
        costPerKm,
        validatedData.remarks || null,
        userId,
      ],
    );

    if (!recordId) {
      return errorResponse("创建加油/充电记录失败", 500);
    }

    /** 查询刚创建的记录（包含车辆信息） */
    const record = await queryOne(
      `SELECT r.*, v.plate_number, v.brand_model, v.vehicle_type
       FROM vehicle_fuel_records r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.id = ?`,
      [recordId],
    );

    if (!record) {
      return errorResponse("创建成功但查询失败", 500);
    }

    /** 同步更新车辆的基准里程数 */
    await update(
      `UPDATE vehicles SET base_mileage = ?, updated_at = NOW() WHERE id = ?`,
      [validatedData.current_mileage, validatedData.vehicle_id],
    );

    return successResponse(record, "创建成功");
  } catch (error: any) {
    console.error("创建加油/充电记录失败:", error);

    if (error.name === "ZodError") {
      return errorResponse(error.errors[0]?.message || "参数验证失败", 400);
    }

    return errorResponse(error.message || "创建失败", 500);
  }
});
