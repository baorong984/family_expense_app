import { z } from "zod";
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, update, insert } from "~/server/utils/db";

const schema = z.object({
  status: z.enum(["wish", "purchased", "in_use", "repair", "idle", "retired"]),
  event_date: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * 更新物品状态
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const itemId = parseInt(event.context.params?.id || "0");
  if (!itemId) {
    return errorResponse("物品ID无效", 400);
  }

  const existing = await queryOne<any>(
    "SELECT * FROM items WHERE id = ? AND user_id = ?",
    [itemId, user.id]
  );
  if (!existing) {
    return errorResponse("物品不存在", 404);
  }

  const body = await readBody(event);
  const result = schema.safeParse(body);

  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400);
  }

  const { status, event_date, notes } = result.data;

  // 验证状态流转是否合法
  const validTransitions: Record<string, string[]> = {
    wish: ["purchased"],
    purchased: ["in_use", "idle", "retired"],
    in_use: ["repair", "idle", "retired"],
    repair: ["in_use", "idle", "retired"],
    idle: ["in_use", "repair", "retired"],
    retired: [],
  };

  if (!validTransitions[existing.status].includes(status)) {
    return errorResponse(
      `不能从"${existing.status}"状态变更为"${status}"状态`,
      400
    );
  }

  // 更新物品状态
  const updateData: any = { status };
  if (status === "in_use" && !existing.start_use_date) {
    updateData.start_use_date = event_date || new Date().toISOString().split("T")[0];
  }
  if (status === "retired") {
    updateData.end_use_date = event_date || new Date().toISOString().split("T")[0];
  }

  const updates: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(updateData)) {
    updates.push(`${key} = ?`);
    params.push(value);
  }

  params.push(itemId, user.id);
  await update(
    `UPDATE items SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
    params
  );

  // 创建状态变更事件
  const eventTypeMap: Record<string, string> = {
    purchased: "purchase",
    in_use: "start_use",
    repair: "repair",
    idle: "idle",
    retired: "retire",
  };

  const eventType = eventTypeMap[status];
  if (eventType) {
    await insert(
      `INSERT INTO item_events (item_id, event_type, event_date, title, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        itemId,
        eventType,
        event_date || new Date().toISOString().split("T")[0],
        getStatusTitle(status),
        notes || `状态从"${existing.status}"变更为"${status}"`,
      ]
    );
  }

  return successResponse(null, "状态更新成功");
});

/**
 * 获取状态标题
 */
function getStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    wish: "想买",
    purchased: "购入",
    in_use: "开始使用",
    repair: "维修",
    idle: "闲置",
    retired: "退役",
  };
  return titles[status] || status;
}
