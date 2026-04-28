import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, insert } from "~/server/utils/db";

/**
 * 日期转换器：支持 ISO 格式和 YYYY-MM-DD 格式
 */
const dateString = z
  .string()
  .transform((val) => {
    if (!val || val === "") return null;
    // 如果是 ISO 格式，转换为 YYYY-MM-DD
    if (val.includes("T")) {
      return val.split("T")[0];
    }
    return val;
  })
  .nullable()
  .optional();

const schema = z.object({
  name: z
    .string()
    .min(1, "物品名称不能为空")
    .max(100, "物品名称不能超过100个字符"),
  category_id: z.number().int().positive().nullable().optional(),
  status: z
    .enum(["wish", "purchased", "in_use", "repair", "idle", "retired"])
    .default("purchased"),
  purchase_date: dateString,
  purchase_amount: z.coerce.number().positive().nullable().optional(),
  purchase_channel: z.string().max(100).nullable().optional(),
  brand: z.string().max(50).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  serial_number: z.string().max(100).nullable().optional(),
  warranty_end_date: dateString,
  expected_lifespan: z.number().int().positive().nullable().optional(),
  storage_location: z.string().max(100).nullable().optional(),
  start_use_date: dateString,
  emoji: z.string().max(10).nullable().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

/**
 * 创建物品
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const body = await readBody(event);
  const result = schema.safeParse(body);

  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400);
  }

  const data = result.data;

  if (data.category_id) {
    const categoryExists = await queryOne<any>(
      "SELECT id FROM item_categories WHERE id = ?",
      [data.category_id],
    );
    if (!categoryExists) {
      return errorResponse("分类不存在", 400);
    }
  }

  const insertId = await insert(
    `INSERT INTO items (
      user_id, name, category_id, status,
      purchase_date, purchase_amount, purchase_channel,
      brand, model, serial_number,
      warranty_end_date, expected_lifespan, storage_location,
      start_use_date, emoji, images, tags, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      data.name,
      data.category_id || null,
      data.status,
      data.purchase_date || null,
      data.purchase_amount || null,
      data.purchase_channel || null,
      data.brand || null,
      data.model || null,
      data.serial_number || null,
      data.warranty_end_date || null,
      data.expected_lifespan || null,
      data.storage_location || null,
      data.start_use_date || null,
      data.emoji || null,
      data.images ? JSON.stringify(data.images) : null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.notes || null,
    ],
  );

  if (data.purchase_date && data.purchase_amount) {
    await insert(
      `INSERT INTO item_events (item_id, event_type, event_date, title, description, amount)
       VALUES (?, 'purchase', ?, '购入', ?, ?)`,
      [
        insertId,
        data.purchase_date,
        `${data.name} - 购入`,
        data.purchase_amount,
      ],
    );
  }

  if (data.start_use_date) {
    await insert(
      `INSERT INTO item_events (item_id, event_type, event_date, title, description)
       VALUES (?, 'start_use', ?, '开始使用', ?)`,
      [insertId, data.start_use_date, `${data.name} - 开始使用`],
    );
  }

  return successResponse({ id: insertId }, "物品创建成功");
});
