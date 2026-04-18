/*
 * @Author: Maicro-bao baorong@airia.cn
 * @Date: 2026-04-18 16:56:07
 * @LastEditors: Maicro-bao baorong@airia.cn
 * @LastEditTime: 2026-04-18 18:50:59
 * @FilePath: \family_expense_app\server\api\vehicle\index.get.ts
 * @Description:
 * Copyright (c) 2026 by maicro, All Rights Reserved.
 */
import { requireAuth } from "~/server/utils/auth";
import { successResponse, errorResponse } from "~/server/utils/response";
import { query } from "~/server/utils/db";
import type { Vehicle } from "~/types";

/** 获取车辆列表 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);

  try {
    /** 查询所有车辆（包括停用的） */
    const list = await query<Vehicle>(
      `SELECT * FROM vehicles 
       ORDER BY is_active DESC, created_at DESC`,
    );

    return successResponse(list || []);
  } catch (error: any) {
    console.error("获取车辆列表失败:", error);
    return errorResponse(error.message || "获取车辆列表失败", 500);
  }
});
