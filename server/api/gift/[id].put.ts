import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update } from "~/server/utils/db";
import type { Gift } from "~/types";

const giftUpdateSchema = z
  .object({
    payment_type: z.enum(["cash", "item"]).optional(),
    amount: z.number().nullable().optional(),
    item_name: z.string().nullable().optional(),
    item_value: z.number().nullable().optional(),
    related_person: z.string().min(1, "关联人不能为空").optional(),
    occasion: z.string().min(1, "事由不能为空").optional(),
    expense_date: z.string().min(1, "日期不能为空").optional(),
    expense_time: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    is_returned: z.number().optional(),
    return_gift_id: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.payment_type === "cash") {
        return (
          data.amount !== null && data.amount !== undefined && data.amount > 0
        );
      }
      if (data.payment_type === "item") {
        return (
          data.item_name !== null &&
          data.item_name !== undefined &&
          data.item_name.trim() !== ""
        );
      }
      return true;
    },
    {
      message: "现金支付需要填写金额，实物支付需要填写实物名称",
    },
  );

/**
 * 查找出礼分类的ID
 * @returns 出礼分类ID
 */
async function getOutgoingCategoryId(occasion: string): Promise<number | null> {
  const parentCategory = await queryOne<{ id: number }>(
    `SELECT id FROM categories WHERE name = '出礼' AND parent_id IS NULL LIMIT 1`,
  );
  if (!parentCategory) return null;

  const subCategory = await queryOne<{ id: number }>(
    `SELECT id FROM categories WHERE name = ? AND parent_id = ? LIMIT 1`,
    [occasion, parentCategory.id],
  );
  return subCategory?.id || null;
}

/**
 * 更新关联的消费记录
 * @param expenseId - 消费记录ID
 * @param amount - 金额
 * @param expenseDate - 日期
 * @param expenseTime - 时间
 * @param description - 描述
 * @param categoryId - 分类ID
 */
async function updateExpenseRecord(
  expenseId: number,
  amount: number,
  expenseDate: string,
  expenseTime: string | null,
  description: string,
  categoryId: number | null,
): Promise<void> {
  if (categoryId) {
    await update(
      `UPDATE expenses SET amount = ?, expense_date = ?, expense_time = ?, description = ?, category_id = ?, updated_at = NOW() WHERE id = ?`,
      [amount, expenseDate, expenseTime, description, categoryId, expenseId],
    );
  } else {
    await update(
      `UPDATE expenses SET amount = ?, expense_date = ?, expense_time = ?, description = ?, updated_at = NOW() WHERE id = ?`,
      [amount, expenseDate, expenseTime, description, expenseId],
    );
  }
}

/** 更新人情记录 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const id = parseInt(getRouterParam(event, "id") || "");

  if (!id || isNaN(id)) {
    return errorResponse("无效的ID", 400);
  }

  try {
    const body = await readBody(event);

    /** 验证数据 */
    const validatedData = giftUpdateSchema.parse(body);

    /** 查询现有人情记录 */
    const existingGift = await queryOne<{
      id: number;
      expense_id: number | null;
      gift_type: string;
      payment_type: string;
      amount: number | null;
      item_value: number | null;
      related_person: string;
      occasion: string;
      expense_date: string;
      expense_time: string | null;
    }>(
      `SELECT id, expense_id, gift_type, payment_type, amount, item_value, related_person, occasion, expense_date, expense_time FROM gifts WHERE id = ?`,
      [id],
    );

    if (!existingGift) {
      return errorResponse("人情记录不存在", 404);
    }

    /** 构建更新字段 */
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (validatedData.payment_type !== undefined) {
      updateFields.push("payment_type = ?");
      updateValues.push(validatedData.payment_type);
    }
    if (validatedData.amount !== undefined) {
      updateFields.push("amount = ?");
      updateValues.push(validatedData.amount);
    }
    if (validatedData.item_name !== undefined) {
      updateFields.push("item_name = ?");
      updateValues.push(validatedData.item_name);
    }
    if (validatedData.item_value !== undefined) {
      updateFields.push("item_value = ?");
      updateValues.push(validatedData.item_value);
    }
    if (validatedData.related_person !== undefined) {
      updateFields.push("related_person = ?");
      updateValues.push(validatedData.related_person);
    }
    if (validatedData.occasion !== undefined) {
      updateFields.push("occasion = ?");
      updateValues.push(validatedData.occasion);
    }
    if (validatedData.expense_date !== undefined) {
      updateFields.push("expense_date = ?");
      const dateObj = new Date(validatedData.expense_date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      updateValues.push(`${year}-${month}-${day}`);
    }
    if (validatedData.expense_time !== undefined) {
      updateFields.push("expense_time = ?");
      updateValues.push(validatedData.expense_time);
    }
    if (validatedData.remarks !== undefined) {
      updateFields.push("remarks = ?");
      updateValues.push(validatedData.remarks);
    }
    if (validatedData.is_returned !== undefined) {
      updateFields.push("is_returned = ?");
      updateValues.push(validatedData.is_returned);
    }
    if (validatedData.return_gift_id !== undefined) {
      updateFields.push("return_gift_id = ?");
      updateValues.push(validatedData.return_gift_id);
    }

    if (updateFields.length === 0) {
      return errorResponse("没有需要更新的字段", 400);
    }

    updateValues.push(id);

    /** 更新人情记录 */
    await update(
      `UPDATE gifts SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    /** 同步更新关联的消费记录（仅限出礼记录） */
    if (existingGift.expense_id && existingGift.gift_type === "outgoing") {
      const paymentType =
        validatedData.payment_type || existingGift.payment_type;
      const amount =
        validatedData.amount !== undefined
          ? validatedData.amount
          : existingGift.amount;
      const itemValue =
        validatedData.item_value !== undefined
          ? validatedData.item_value
          : existingGift.item_value;
      const relatedPerson =
        validatedData.related_person || existingGift.related_person;
      const occasion = validatedData.occasion || existingGift.occasion;

      let expenseDate = existingGift.expense_date;
      if (validatedData.expense_date !== undefined) {
        const dateObj = new Date(validatedData.expense_date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        expenseDate = `${year}-${month}-${day}`;
      }

      const expenseTime =
        validatedData.expense_time !== undefined
          ? validatedData.expense_time
          : existingGift.expense_time;

      /** 计算金额：现金用amount，实物用item_value */
      const expenseAmount =
        paymentType === "cash" ? amount || 0 : itemValue || 0;

      /** 构建描述 */
      const description = `出礼 - ${relatedPerson} (${occasion})`;

      /** 获取分类ID */
      const categoryId = await getOutgoingCategoryId(occasion);

      await updateExpenseRecord(
        existingGift.expense_id,
        expenseAmount,
        expenseDate,
        expenseTime || null,
        description,
        categoryId,
      );
    }

    /** 查询更新后的记录 */
    const gift = await queryOne<Gift>(
      `SELECT g.*, 
              c.name as category_name,
              m.name as member_name
       FROM gifts g
       LEFT JOIN expenses e ON g.expense_id = e.id
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN members m ON e.member_id = m.id
       WHERE g.id = ?`,
      [id],
    );

    if (!gift) {
      return errorResponse("人情记录不存在", 404);
    }

    return successResponse(gift, "更新成功");
  } catch (error: any) {
    console.error("更新人情记录失败:", error);
    if (error.name === "ZodError") {
      return errorResponse(error.errors[0]?.message || "参数验证失败", 400);
    }
    return errorResponse(error.message || "更新失败", 500);
  }
});
