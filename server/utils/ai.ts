import OpenAI from "openai";
import type { RecognizeResult, ClassifyResult, AnalysisResult } from "~/types";

let openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openai) {
    const config = useRuntimeConfig();
    openai = new OpenAI({
      apiKey: config.scnetApiKey,
      baseURL: config.scnetApiUrl,
    });
  }
  return openai;
}

// 从AI响应中提取JSON（处理markdown代码块）
export function extractJSON(content: string): string {
  // 移除markdown代码块标记
  let json = content.trim();

  // 处理 ```json ... ``` 格式
  if (json.startsWith("```")) {
    json = json.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
  }

  // 找到第一个 { 和最后一个 }
  const start = json.indexOf("{");
  const end = json.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    json = json.substring(start, end + 1);
  }

  return json;
}

const RECOGNIZE_SYSTEM_PROMPT = `你是一个专业的消费信息提取助手。你的任务是从用户的消费描述中提取关键信息。

提取规则：
1. 金额：识别数字金额
   - 支持"30块"、"30元"、"30"、"两百"、"200"等格式
   - 中文数字转换：两百=200，三百=300，一千=1000
   - 必须返回数字类型，不能是字符串
2. 日期：识别时间表达，如"今天"、"昨天"、"前天"、"上周一"、"5月1日"等，转换为YYYY-MM-DD格式
3. 时间：识别时间表达，如"中午"→12:00、"晚上"→18:00、"12:30"等，转换为HH:MM格式
4. 分类：根据消费内容推断分类，返回分类ID和名称
5. 成员：识别消费参与人员，返回成员ID和名称

成员识别规则：
- "我"、"自己" → 当前用户
- "老婆"、"媳妇"、"妻子" → 对应成员
- "老公"、"丈夫" → 对应成员
- "孩子"、"儿子"、"女儿" → 需用户确认

输出格式：纯JSON（不要包含markdown代码块）

示例输入："中午和老婆吃火锅花了200"
示例输出：
{
  "amount": 200,
  "category": "餐饮",
  "subcategory": "火锅",
  "category_id": 10,
  "date": "2026-05-23",
  "time": "12:00",
  "members": ["BoBo"],
  "member_ids": [2],
  "description": "和老婆吃火锅",
  "confidence": 0.9,
  "suggestions": [
    {"category_id": 10, "category_name": "餐饮", "subcategory_name": "火锅", "confidence": 0.9}
  ]
}

注意事项：
- 如果信息缺失，对应字段返回null
- 如果无法确定分类，提供多个suggestions
- 置信度基于提取准确性，范围0-1
- 金额必须是有效数字，不能为负数
- 重要：必须识别金额，如"花了200"、"200元"、"200块"都应识别为金额200`;

const CLASSIFY_SYSTEM_PROMPT = `你是一个专业的消费分类助手。你的任务是根据消费描述推荐合适的分类。

分类原则：
1. 根据消费内容的主关键词判断分类
2. 考虑消费金额对分类的影响（如小额可能是零食，大额可能是正餐）
3. 参考常见的消费分类模式
4. 考虑消费场景（堂食、外卖、打包等）

输出格式：纯JSON（不要包含markdown代码块）
推荐数量：2-3个最可能的分类
排序方式：按置信度从高到低
约束条件：
- 所有推荐分类必须在现有分类体系中
- 所有推荐分类的置信度之和不超过1
- 如果只有一个可能分类，只返回一个

现有分类体系：
- 餐饮：火锅、烧烤、外卖、正餐、零食、饮料、其他餐饮
- 交通：打车、地铁、公交、加油、停车、其他交通
- 购物：超市、网购、服装、电子产品、家居用品、其他购物
- 娱乐：电影、KTV、游戏、旅游、其他娱乐
- 医疗：看病、买药、体检、其他医疗
- 教育：培训、书籍、课程、其他教育
- 居住：房租、水电、物业、其他居住
- 其他：其他消费

直接返回JSON，格式如：
{"recommendations": [{"category": "餐饮", "subcategory": "火锅", "confidence": 0.9}]}`;

const ANALYZE_SYSTEM_PROMPT = `你是一个专业的消费分析助手。你的任务是分析用户的消费数据，提供洞察和建议。

分析任务：

1. 同比分析：
   - 对比本月和去年同月的消费总额
   - 计算变化金额和变化率
   - 如果数据不足，设置has_data为false并说明原因

2. 异常检测（重要：同类异常必须合并）：
   - 识别超出平均值30%的消费
   - 识别超出预算的消费
   - 识别异常大额消费
   - **合并规则**：同一分类的多个异常必须合并为一条记录，用列表形式展示
   - 例如：餐饮有3笔大额消费，应合并为一条，description中列出每笔详情
   - 合并后的amount为该分类异常消费的总金额

3. 节省建议：
   - 基于消费习惯生成具体建议
   - 重点关注超支和高消费分类
   - 提供可操作的建议
   - 保持积极的语调

4. 趋势预测：
   - 基于最近3个月的消费数据
   - 预测下个月的消费金额
   - 判断消费趋势（上升/下降/稳定/未知）

输出格式：纯JSON（不要包含markdown代码块），必须严格按以下结构返回：

{
  "analysis_date": "分析日期，格式YYYY-MM-DD",
  "month": "分析月份，格式YYYY-MM",
  "total_spent": 总消费金额（数字），
  "budget_total": 预算总额（数字，必须使用用户传入的预算值，不要修改），
  "budget_remaining": 剩余预算（数字，计算公式：budget_total - total_spent），
  "budget_usage_rate": 预算使用率（数字，百分比，计算公式：total_spent / budget_total * 100），
  "year_over_year": {
    "has_data": 布尔值，是否有同比数据，
    "reason": "数据不足时的原因说明",
    "current_month": 本月消费（数字，可选，可为null），
    "last_year_month": 去年同月消费（数字，可选，可为null），
    "change": 变化金额（数字，可选，可为null），
    "change_rate": 变化率（数字，可选，可为null）
  },
  "category_breakdown": [
    {
      "category": "分类名称",
      "amount": 该分类总金额（数字），
      "percentage": 占比（数字，如18.41表示18.41%），
      "transaction_count": 交易笔数（数字）
    }
  ],
  "anomalies": [
    {
      "type": "大额消费或超出平均值30%",
      "amount": 该分类异常消费总金额（数字），
      "category": "分类名称",
      "subcategory": "子分类名称（可选，可为null）",
      "member": "消费成员（可选，可为null）",
      "description": "合并说明：列出该分类下所有异常消费的详情，格式如'共3笔：火锅259元（5月10日）、正餐249元（5月12日）、外卖160元（5月15日）'",
      "date": null
    }
  ],
  "saving_suggestions": [
    {
      "category": "分类名称",
      "suggestion": "具体建议内容",
      "potential_saving": 可节省金额（数字）
    }
  ],
  "trend_prediction": {
    "has_enough_data": 布尔值，是否有足够数据预测，
    "reason": "数据不足时的原因说明（可选）",
    "predicted_amount": 预测金额（数字或null），
    "trend": "上升/下降/稳定/未知",
    "confidence": 置信度（数字0-1，或null）
  }
}

分析原则：
- 基于数据说话，避免主观臆断
- 建议要具体可操作，避免空泛
- 关注用户的财务健康
- 保持客观中立的态度

重要规则：
- budget_total 必须使用用户传入的预算值，绝对不要修改这个值
- budget_remaining = budget_total - total_spent
- budget_usage_rate = (total_spent / budget_total) * 100，如果budget_total为0则设为0
- 如果数据不足（少于1个月），year_over_year.has_data设为false
- 预测基于最近3个月的数据，数据不足时trend设为"未知"
- **异常检测必须合并同类项**：同一分类的多笔异常消费合并为一条记录，不要重复列出`;

export async function recognizeExpense(text: string, context?: { members?: { id: number; name: string }[]; categories?: { id: number; name: string; parent_id: number | null }[] }): Promise<RecognizeResult> {
  const client = getOpenAI();
  const config = useRuntimeConfig();

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);

  let userContent = `当前日期: ${today}\n当前时间: ${now}\n用户输入: ${text}`;
  
  if (context?.members && context.members.length > 0) {
    userContent += `\n\n家庭成员列表：\n${context.members.map(m => `- ID: ${m.id}, 名称: ${m.name}`).join('\n')}`;
  }
  
  if (context?.categories && context.categories.length > 0) {
    const parentCategories = context.categories.filter(c => c.parent_id === null);
    const subCategories = context.categories.filter(c => c.parent_id !== null);
    
    userContent += `\n\n分类体系：`;
    for (const parent of parentCategories) {
      const children = subCategories.filter(c => c.parent_id === parent.id);
      if (children.length > 0) {
        userContent += `\n- ${parent.name}（ID: ${parent.id}）：${children.map(c => `${c.name}(ID: ${c.id})`).join('、')}`;
      } else {
        userContent += `\n- ${parent.name}（ID: ${parent.id}）`;
      }
    }
  }

  const response = await client.chat.completions.create({
    model: config.scnetModel,
    messages: [
      { role: "system", content: RECOGNIZE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("AI识别响应:", content);
  const json = extractJSON(content);
  console.log("提取的JSON:", json);

  try {
    const result = JSON.parse(json) as RecognizeResult;
    return {
      amount: result.amount ?? null,
      category: result.category ?? null,
      subcategory: result.subcategory ?? null,
      category_id: result.category_id ?? null,
      date: result.date ?? null,
      time: result.time ?? null,
      members: result.members ?? [],
      member_ids: result.member_ids ?? [],
      description: result.description ?? text,
      confidence: result.confidence ?? 0,
      suggestions: result.suggestions ?? [],
    };
  } catch (e) {
    console.error("JSON parse error:", e, "Content:", content);
    return {
      amount: null,
      category: null,
      subcategory: null,
      category_id: null,
      date: null,
      time: null,
      members: [],
      member_ids: [],
      description: text,
      confidence: 0,
      suggestions: [],
    };
  }
}

export async function classifyExpense(
  description: string,
  amount: number,
): Promise<ClassifyResult> {
  const client = getOpenAI();
  const config = useRuntimeConfig();

  const response = await client.chat.completions.create({
    model: config.scnetModel,
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `消费描述：${description}\n消费金额：${amount}元`,
      },
    ],
    temperature: 0.1,
    max_tokens: 512,
  });

  const content =
    response.choices[0]?.message?.content || '{"recommendations":[]}';
  const json = extractJSON(content);

  try {
    return JSON.parse(json) as ClassifyResult;
  } catch (e) {
    console.error("JSON parse error:", e, "Content:", content);
    return { recommendations: [] };
  }
}

export async function analyzeExpense(
  data: any[],
  timeRange: { start: string; end: string },
  budget: { total: number; categories: Record<string, number> },
): Promise<AnalysisResult> {
  const client = getOpenAI();
  const config = useRuntimeConfig();

  const response = await client.chat.completions.create({
    model: config.scnetModel,
    messages: [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `消费数据：${JSON.stringify(data)}\n\n时间范围：${timeRange.start} 至 ${timeRange.end}\n\n预算设置：${JSON.stringify(budget)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("AI Response length:", content.length, "First 500 chars:", content.substring(0, 500));
  const json = extractJSON(content);

  try {
    const result = JSON.parse(json) as AnalysisResult;
    console.log("AI Analysis parsed successfully");
    return result;
  } catch (e) {
    console.error("JSON parse error:", e);
    console.error("Extracted JSON (first 1000 chars):", json.substring(0, 1000));
    console.error("Original content (first 1000 chars):", content.substring(0, 1000));
    return {
      analysis_date: timeRange.start,
      month: timeRange.start.substring(0, 7),
      total_spent: 0,
      budget_total: budget.total,
      budget_remaining: budget.total,
      budget_usage_rate: 0,
      year_over_year: {
        has_data: false,
        reason: "解析AI响应失败",
      },
      category_breakdown: [],
      anomalies: [],
      saving_suggestions: [],
      trend_prediction: {
        has_enough_data: false,
        reason: "解析AI响应失败",
        predicted_amount: null,
        trend: "未知",
        confidence: null,
      },
    };
  }
}
