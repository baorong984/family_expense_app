import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update } from "~/server/utils/db";

const schema = z.object({
  name: z
    .string()
    .min(1, "分类名称不能为空")
    .max(50, "分类名称不能超过50个字符")
    .optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    return errorResponse("分类ID不能为空", 400);
  }

  const categoryId = parseInt(id);

  const existing = await queryOne<any>(
    "SELECT * FROM categories WHERE id = ?",
    [categoryId],
  );
  if (!existing) {
    return errorResponse("分类不存在", 404);
  }

  if (existing.is_system === 1) {
    return errorResponse("系统预设分类不能修改", 403);
  }

  const body = await readBody(event);

  const result = schema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400);
  }

  const { name, parent_id, sort_order } = result.data;

  if (parent_id !== undefined && parent_id !== null) {
    const parentExists = await queryOne<any>(
      "SELECT id, parent_id FROM categories WHERE id = ?",
      [parent_id],
    );
    if (!parentExists) {
      return errorResponse("父分类不存在", 400);
    }
    if (parent_id === categoryId) {
      return errorResponse("不能将父分类设为自己", 400);
    }
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name);
  }
  if (parent_id !== undefined) {
    updates.push("parent_id = ?");
    params.push(parent_id);
  }
  if (sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(sort_order);
  }

  if (updates.length === 0) {
    return errorResponse("没有需要更新的字段", 400);
  }

  params.push(categoryId);
  await update(
    `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`,
    params,
  );

  return successResponse(
    {
      id: categoryId,
      name: name || existing.name,
      parent_id: parent_id !== undefined ? parent_id : existing.parent_id,
      sort_order: sort_order !== undefined ? sort_order : existing.sort_order,
    },
    "更新成功",
  );
});
