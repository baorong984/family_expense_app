import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { queryOne, query } from "~/server/utils/db";

interface Item {
  id: number;
  user_id: number;
  name: string;
  category_id: number | null;
  status: "wish" | "purchased" | "in_use" | "repair" | "idle" | "retired";
  purchase_date: string | null;
  purchase_amount: number | null;
  purchase_channel: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  warranty_end_date: string | null;
  expected_lifespan: number | null;
  storage_location: string | null;
  start_use_date: string | null;
  end_use_date: string | null;
  retire_reason: string | null;
  retire_type: "sold" | "gifted" | "discarded" | "lost" | null;
  retire_amount: number | null;
  emoji: string | null;
  images: string | null;
  tags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon?: string;
}

interface ItemEvent {
  id: number;
  item_id: number;
  event_type:
    | "purchase"
    | "start_use"
    | "repair"
    | "accessory"
    | "idle"
    | "retire"
    | "note";
  event_date: string;
  title: string | null;
  description: string | null;
  amount: number | null;
  images: string | null;
  created_at: string;
}

/**
 * 安全解析 JSON 字符串
 */
const safeJsonParse = (str: string | null, defaultValue: any[] = []): any[] => {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

/**
 * 获取物品详情
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const itemId = parseInt(event.context.params?.id || "0");
  if (!itemId) {
    return errorResponse("物品ID无效", 400);
  }

  let item: Item | null = null;
  try {
    item = await queryOne<Item>(
      `SELECT i.*, c.name as category_name, c.icon as category_icon
       FROM items i
       LEFT JOIN item_categories c ON i.category_id = c.id
       WHERE i.id = ? AND i.user_id = ?`,
      [itemId, user.id],
    );
  } catch (error) {
    console.error("查询物品失败:", error);
    return errorResponse("查询物品失败", 500);
  }

  if (!item) {
    return errorResponse("物品不存在", 404);
  }

  let cpd: number | null = null;
  let usageDays: number | null = null;

  if (item.purchase_amount && item.start_use_date) {
    const startDate = new Date(item.start_use_date);
    const endDate = item.end_use_date
      ? new Date(item.end_use_date)
      : new Date();
    usageDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    if (usageDays > 0) {
      cpd = item.purchase_amount / usageDays;
    }
  }

  let events: ItemEvent[] = [];
  try {
    events = await query<ItemEvent>(
      "SELECT * FROM item_events WHERE item_id = ? ORDER BY event_date DESC, id DESC",
      [itemId],
    );
  } catch (error) {
    console.error("查询物品事件失败:", error);
  }

  const itemWithDetails = {
    ...item,
    images: safeJsonParse(item.images),
    tags: safeJsonParse(item.tags),
    cpd,
    usage_days: usageDays,
    events: events.map((e) => ({
      ...e,
      images: safeJsonParse(e.images),
    })),
  };

  return successResponse({ item: itemWithDetails });
});
