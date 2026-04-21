import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update } from "~/server/utils/db";

const itemSchema = z.object({
  id: z.number().int().positive(),
  parent_id: z.number().int().positive().nullable(),
  sort_order: z.number().int().min(0),
});

const schema = z.object({
  items: z.array(itemSchema).min(1, "排序数据不能为空"),
});

/**
 * 批量更新分类排序
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);

  const result = schema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400);
  }

  const { items } = result.data;

  for (const item of items) {
    const existing = await queryOne<any>(
      "SELECT id, is_system, parent_id FROM categories WHERE id = ?",
      [item.id],
    );
    if (!existing) {
      return errorResponse(`分类ID ${item.id} 不存在`, 404);
    }

    if (existing.is_system === 1) {
      await update(
        "UPDATE categories SET sort_order = ? WHERE id = ?",
        [item.sort_order, item.id],
      );
    } else {
      if (item.parent_id !== null) {
        const parentExists = await queryOne<any>(
          "SELECT id FROM categories WHERE id = ?",
          [item.parent_id],
        );
        if (!parentExists) {
          return errorResponse(`父分类ID ${item.parent_id} 不存在`, 400);
        }
      }

      await update(
        "UPDATE categories SET parent_id = ?, sort_order = ? WHERE id = ?",
        [item.parent_id, item.sort_order, item.id],
      );
    }
  }

  return successResponse(null, "排序更新成功");
});
