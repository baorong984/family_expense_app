import { z } from 'zod'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import { getOpenAI, extractJSON } from '~/server/utils/ai'

const schema = z.object({
  query_text: z.string().min(1, '请输入搜索内容'),
  limit: z.number().min(1).max(100).default(20),
})

interface SearchCondition {
  date_start: string | null
  date_end: string | null
  category: string | null
  subcategory: string | null
  member: string | null
  amount_min: number | null
  amount_max: number | null
  keywords: string[]
}

interface SearchResult {
  id: number
  amount: number
  date: string
  category: string
  subcategory: string | null
  member: string | null
  description: string
}

interface SearchResponse {
  parsed_conditions: SearchCondition
  results: SearchResult[]
  summary: {
    total_count: number
    total_amount: number
    avg_amount: number
  }
  answer: string
}

const SEARCH_PROMPT = `你是消费记录搜索助手。解析用户的自然语言查询，提取搜索条件。

支持的查询条件：
- date_start/date_end: 日期范围，格式YYYY-MM-DD
- category: 一级分类名称（如：餐饮、交通、购物、娱乐、医疗、教育、居住、其他）
- subcategory: 子分类名称（如：早餐、午餐、晚餐、地铁、公交等具体分类）
- member: 成员名称
- amount_min: 最小金额
- amount_max: 最大金额
- keywords: 关键词列表（描述中包含的词，如：火锅、奶茶、电影等）

重要规则：
1. category和subcategory必须是系统中存在的分类名，不要把普通词汇当作分类
2. 如果用户提到具体的消费内容（如"火锅"、"奶茶"、"电影"），应该放入keywords而不是category/subcategory
3. 只有明确提到分类名时才填写category/subcategory

日期识别规则：
- "今天" → 当天
- "昨天" → 当前日期-1天
- "上周" → 上周一到上周日
- "本月" → 当月1日到当月最后一天
- "上个月" → 上月1日到上月最后一天
- "5月" → 2026-05-01到2026-05-31

输出格式：纯JSON（不要包含markdown代码块）

{
  "parsed_conditions": {
    "date_start": "YYYY-MM-DD或null",
    "date_end": "YYYY-MM-DD或null",
    "category": "分类名或null",
    "subcategory": "子分类名或null",
    "member": "成员名或null",
    "amount_min": 数字或null,
    "amount_max": 数字或null,
    "keywords": ["关键词1", "关键词2"]
  },
  "query_type": "list或summary",
  "natural_answer": "自然语言回答"
}`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { query_text, limit } = result.data
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const client = getOpenAI()
    const config = useRuntimeConfig()
    
    const aiResponse = await client.chat.completions.create({
      model: config.scnetModel,
      messages: [
        { role: 'system', content: SEARCH_PROMPT },
        {
          role: 'user',
          content: `当前日期: ${today}\n用户查询: ${query_text}\n\n请解析查询条件。`
        }
      ],
      temperature: 0.1,
      max_tokens: 1024,
    })
    
    const content = aiResponse.choices[0]?.message?.content || '{}'
    const json = extractJSON(content)
    
    let conditions: SearchCondition
    try {
      const parsed = JSON.parse(json)
      conditions = {
        date_start: parsed.parsed_conditions?.date_start || null,
        date_end: parsed.parsed_conditions?.date_end || null,
        category: parsed.parsed_conditions?.category || null,
        subcategory: parsed.parsed_conditions?.subcategory || null,
        member: parsed.parsed_conditions?.member || null,
        amount_min: parsed.parsed_conditions?.amount_min || null,
        amount_max: parsed.parsed_conditions?.amount_max || null,
        keywords: parsed.parsed_conditions?.keywords || []
      }
    } catch (e) {
      conditions = {
        date_start: null,
        date_end: null,
        category: null,
        subcategory: null,
        member: null,
        amount_min: null,
        amount_max: null,
        keywords: [query_text]
      }
    }
    
    let sql = `
      SELECT 
        e.id,
        e.amount,
        e.expense_date as date,
        COALESCE(pc.name, c.name) as category,
        CASE WHEN c.parent_id IS NOT NULL THEN c.name ELSE NULL END as subcategory,
        m.name as member,
        e.description
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN members m ON e.member_id = m.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (conditions.date_start) {
      sql += ' AND e.expense_date >= ?'
      params.push(String(conditions.date_start))
    }
    if (conditions.date_end) {
      sql += ' AND e.expense_date <= ?'
      params.push(String(conditions.date_end))
    }
    if (conditions.category) {
      sql += ' AND COALESCE(pc.name, c.name) = ?'
      params.push(String(conditions.category))
    }
    if (conditions.subcategory) {
      sql += ' AND (c.name = ? OR e.description LIKE ?)'
      params.push(String(conditions.subcategory), `%${conditions.subcategory}%`)
    }
    if (conditions.member) {
      sql += ' AND m.name = ?'
      params.push(String(conditions.member))
    }
    if (conditions.amount_min !== null && conditions.amount_min !== undefined) {
      sql += ' AND e.amount >= ?'
      params.push(Number(conditions.amount_min))
    }
    if (conditions.amount_max !== null && conditions.amount_max !== undefined) {
      sql += ' AND e.amount <= ?'
      params.push(Number(conditions.amount_max))
    }
    if (conditions.keywords && conditions.keywords.length > 0) {
      const validKeywords = conditions.keywords.filter(k => k && typeof k === 'string')
      if (validKeywords.length > 0) {
        const keywordConditions = validKeywords.map(() => '(e.description LIKE ? OR c.name LIKE ? OR pc.name LIKE ?)').join(' OR ')
        sql += ` AND (${keywordConditions})`
        validKeywords.forEach(k => {
          params.push(`%${k}%`, `%${k}%`, `%${k}%`)
        })
      }
    }
    
    sql += ` ORDER BY e.expense_date DESC LIMIT ${Number(limit)}`
    
    console.log('智能搜索SQL:', sql)
    console.log('智能搜索参数:', JSON.stringify(params))
    
    const results = await query<SearchResult>(sql, params)
    
    const totalCount = results.length
    const totalAmount = results.reduce((sum, r) => sum + Number(r.amount), 0)
    const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0
    
    let answer = ''
    if (totalCount === 0) {
      answer = '没有找到符合条件的消费记录'
    } else {
      answer = `找到 ${totalCount} 条记录，共消费 ¥${totalAmount.toFixed(2)}`
    }
    
    return successResponse({
      parsed_conditions: conditions,
      results: results.map(r => ({
        ...r,
        amount: Number(r.amount)
      })),
      summary: {
        total_count: totalCount,
        total_amount: Number(totalAmount.toFixed(2)),
        avg_amount: Number(avgAmount.toFixed(2))
      },
      answer
    }, '搜索成功')
  } catch (error: any) {
    console.error('智能搜索失败:', error)
    return errorResponse('搜索失败，请稍后重试', 500)
  }
})
