import { requireAuth } from "~/server/utils/auth";
import { successResponse } from "~/server/utils/response";
import { query, queryOne } from "~/server/utils/db";

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
 * 获取物品列表
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const queryParams = getQuery(event);
  const status = queryParams.status as string | undefined;
  const categoryId = queryParams.category_id
    ? parseInt(queryParams.category_id as string)
    : undefined;
  const search = queryParams.search as string | undefined;
  const page = parseInt(queryParams.page as string) || 1;
  const pageSize = parseInt(queryParams.page_size as string) || 20;
  const sortBy = (queryParams.sort_by as string) || "created_at";
  const sortOrder = (queryParams.sort_order as string) || "DESC";

  let whereClause = "WHERE i.user_id = ?";
  const params: any[] = [user.id];

  if (status) {
    whereClause += " AND i.status = ?";
    params.push(status);
  }

  if (categoryId) {
    whereClause += " AND i.category_id = ?";
    params.push(categoryId);
  }

  if (search) {
    whereClause += " AND (i.name LIKE ? OR i.brand LIKE ? OR i.model LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const validSortFields = [
    "created_at",
    "purchase_date",
    "purchase_amount",
    "name",
    "status",
  ];
  const validSortOrders = ["ASC", "DESC"];
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "created_at";
  const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase())
    ? sortOrder.toUpperCase()
    : "DESC";

  let total = 0;
  let items: Item[] = [];

  try {
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM items i ${whereClause}`,
      params,
    );
    total = countResult?.total || 0;

    const offset = (page - 1) * pageSize;
    items = await query<Item>(
      `SELECT i.*, c.name as category_name, c.icon as category_icon
       FROM items i
       LEFT JOIN item_categories c ON i.category_id = c.id
       ${whereClause}
       ORDER BY i.${safeSortBy} ${safeSortOrder}
       LIMIT ${pageSize} OFFSET ${offset}`,
      params,
    );
  } catch (error) {
    console.error("查询物品失败:", error);
    return successResponse({
      items: [],
      pagination: {
        page,
        page_size: pageSize,
        total: 0,
        total_pages: 0,
      },
    });
  }

  const itemsWithCpd = items.map((item) => {
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

    return {
      ...item,
      images: safeJsonParse(item.images),
      tags: safeJsonParse(item.tags),
      cpd,
      usage_days: usageDays,
    };
  });

  return successResponse({
    items: itemsWithCpd,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  });
});
