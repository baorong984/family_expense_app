import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, remove } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    return errorResponse("记录ID不能为空", 400);
  }

  // 检查记录是否存在
  const existing = await queryOne("SELECT id FROM expenses WHERE id = ?", [
    id,
  ]);
  if (!existing) {
    return errorResponse("记录不存在", 404);
  }

  // 权限校验：仅管理员可以删除记录
  if (user.is_admin !== 1) {
    return errorResponse("无权删除此记录，仅管理员可删除", 403);
  }

  await remove("DELETE FROM expenses WHERE id = ?", [id]);

  return successResponse(null, "删除成功");
});
