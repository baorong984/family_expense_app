import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update } from "~/server/utils/db";

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

/**
 * 退役类型转换器：允许空字符串
 */
const retireTypeString = z
  .string()
  .transform((val) => {
    if (!val || val === "") return null;
    return val as "sold" | "gifted" | "discarded" | "lost";
  })
  .nullable()
  .optional();

const schema = z.object({
  name: z
    .string()
    .min(1, "物品名称不能为空")
    .max(100, "物品名称不能超过100个字符")
    .optional(),
  category_id: z.number().int().positive().nullable().optional(),
  status: z
    .enum(["wish", "purchased", "in_use", "repair", "idle", "retired"])
    .optional(),
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
  end_use_date: dateString,
  retire_reason: z.string().max(255).nullable().optional(),
  retire_type: retireTypeString,
  retire_amount: z.coerce.number().positive().nullable().optional(),
  emoji: z.string().max(10).nullable().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

/**
 * 更新物品
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const itemId = parseInt(event.context.params?.id || "0");
  if (!itemId) {
    return errorResponse("物品ID无效", 400);
  }

  const existing = await queryOne<any>(
    "SELECT * FROM items WHERE id = ? AND user_id = ?",
    [itemId, user.id],
  );
  if (!existing) {
    return errorResponse("物品不存在", 404);
  }

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

  const updates: string[] = [];
  const params: any[] = [];

  const fieldMappings: Record<string, string> = {
    name: "name",
    category_id: "category_id",
    status: "status",
    purchase_date: "purchase_date",
    purchase_amount: "purchase_amount",
    purchase_channel: "purchase_channel",
    brand: "brand",
    model: "model",
    serial_number: "serial_number",
    warranty_end_date: "warranty_end_date",
    expected_lifespan: "expected_lifespan",
    storage_location: "storage_location",
    start_use_date: "start_use_date",
    end_use_date: "end_use_date",
    retire_reason: "retire_reason",
    retire_type: "retire_type",
    retire_amount: "retire_amount",
    emoji: "emoji",
    notes: "notes",
  };

  for (const [key, dbField] of Object.entries(fieldMappings)) {
    if (data[key as keyof typeof data] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(data[key as keyof typeof data]);
    }
  }

  if (data.images !== undefined) {
    updates.push("images = ?");
    params.push(data.images ? JSON.stringify(data.images) : null);
  }

  if (data.tags !== undefined) {
    updates.push("tags = ?");
    params.push(data.tags ? JSON.stringify(data.tags) : null);
  }

  if (updates.length === 0) {
    return successResponse(null, "没有需要更新的内容");
  }

  params.push(itemId, user.id);
  await update(
    `UPDATE items SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
    params,
  );

  return successResponse(null, "物品更新成功");
});
