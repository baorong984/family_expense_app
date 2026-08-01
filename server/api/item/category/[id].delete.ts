/*
 * @Author: Maicro-bao baorong@airia.cn
 * @Date: 2026-04-26 15:30:45
 * @LastEditors: Maicro-bao baorong@airia.cn
 * @LastEditTime: 2026-04-27 09:52:09
 * @FilePath: \family_expense_app\server\api\item\category\[id].delete.ts
 * @Description:
 * Copyright (c) 2026 by maicro, All Rights Reserved.
 */
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, query, remove } from "~/server/utils/db";

/**
 * 删除物品分类
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const categoryId = parseInt(event.context.params?.id || "0");
  if (!categoryId) {
    return errorResponse("分类ID无效", 400);
  }

  const existing = await queryOne<any>(
    "SELECT * FROM item_categories WHERE id = ?",
    [categoryId],
  );
  if (!existing) {
    return errorResponse("分类不存在", 404);
  }

  // 检查是否有子分类
  const children = await query<any>(
    "SELECT id FROM item_categories WHERE parent_id = ?",
    [categoryId],
  );
  if (children.length > 0) {
    return errorResponse("该分类下有子分类，无法删除", 400);
  }

  // 检查是否有物品使用该分类
  const items = await queryOne<any>(
    "SELECT COUNT(*) as count FROM items WHERE category_id = ?",
    [categoryId],
  );
  if (items.count > 0) {
    return errorResponse("该分类下有物品，无法删除", 400);
  }

  await remove("DELETE FROM item_categories WHERE id = ?", [categoryId]);

  return successResponse(null, "分类删除成功");
});
