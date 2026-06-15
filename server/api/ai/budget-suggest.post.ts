import { z } from 'zod'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import { getOpenAI, extractJSON } from '~/server/utils/ai'

const schema = z.object({
  months: z.number().min(1).max(12).default(3),
})

interface BudgetSuggestion {
  category_id: number
  category_name: string
  suggested_budget: number
  avg_spent: number
  trend: 'up' | 'down' | 'stable'
  reason: string
}

interface BudgetSuggestResult {
  total_budget: number
  category_budgets: BudgetSuggestion[]
  analysis_summary: string
  tips: string[]
  confidence: number
}

const BUDGET_SUGGEST_PROMPT = `你是家庭财务顾问。根据用户过去几个月的消费数据，提供预算分析建议。

你的任务：
1. 分析各分类的消费趋势（上升/下降/稳定）
2. 识别异常消费模式
3. 提供节省建议

输出格式：纯JSON（不要包含markdown代码块）

{
  "analysis_summary": "整体分析说明（2-3句话）",
  "tips": ["节省建议1", "节省建议2", "节省建议3"],
  "confidence": 置信度(0-1)
}

注意：
- 你不需要计算预算金额，后端已经计算好了
- 专注于分析消费趋势和提供实用建议
- tips应该是具体的、可操作的建议
- confidence基于数据量和稳定性（数据越多越稳定，置信度越高）`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { months } = result.data
  
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    
    const expenses = await query<{
      category_id: number
      category_name: string
      month: string
      total_amount: number
      count: number
    }>(
      `SELECT 
        COALESCE(pc.id, c.id) as category_id,
        COALESCE(pc.name, c.name) as category_name,
        DATE_FORMAT(e.expense_date, '%Y-%m') as month,
        SUM(e.amount) as total_amount,
        COUNT(*) as count
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN categories pc ON c.parent_id = pc.id
       WHERE e.expense_date BETWEEN ? AND ?
       GROUP BY COALESCE(pc.id, c.id), COALESCE(pc.name, c.name), DATE_FORMAT(e.expense_date, '%Y-%m')
       ORDER BY category_name, month`,
      [formatDate(startDate), formatDate(endDate)]
    )
    
    if (expenses.length === 0) {
      return successResponse({
        total_budget: 0,
        category_budgets: [],
        analysis_summary: '暂无消费数据，无法生成预算建议',
        tips: ['开始记录消费，积累数据后再获取预算建议'],
        confidence: 0
      }, '暂无数据')
    }
    
    // 后端计算各分类的月均消费和趋势
    const categoryStats = new Map<number, { 
      name: string; 
      months: Map<string, number>; 
      total: number; 
      count: number 
    }>()
    
    for (const exp of expenses) {
      const catId = exp.category_id
      if (!categoryStats.has(catId)) {
        categoryStats.set(catId, { 
          name: exp.category_name, 
          months: new Map(), 
          total: 0, 
          count: 0 
        })
      }
      const stat = categoryStats.get(catId)!
      stat.months.set(exp.month, Number(exp.total_amount))
      stat.total += Number(exp.total_amount)
      stat.count += Number(exp.count)
    }
    
    // 计算月均消费和趋势
    const categoryData: {
      category_id: number
      category_name: string
      avg_spent: number
      trend: string
      months_data: { month: string; amount: number }[]
    }[] = []
    
    for (const [id, stat] of categoryStats) {
      const monthCount = stat.months.size
      const avgSpent = monthCount > 0 ? stat.total / monthCount : 0
      
      // 计算趋势
      const monthValues = Array.from(stat.months.values())
      let trend = 'stable'
      if (monthValues.length >= 2) {
        const last = monthValues[monthValues.length - 1]
        const prev = monthValues[monthValues.length - 2]
        const changeRate = prev > 0 ? (last - prev) / prev : 0
        if (changeRate > 0.1) trend = 'up'
        else if (changeRate < -0.1) trend = 'down'
      }
      
      categoryData.push({
        category_id: id,
        category_name: stat.name,
        avg_spent: Math.round(avgSpent * 100) / 100,
        trend,
        months_data: Array.from(stat.months.entries()).map(([month, amount]) => ({
          month,
          amount: Math.round(amount * 100) / 100
        }))
      })
    }
    
    console.log('传递给AI的分类数据:', JSON.stringify(categoryData, null, 2))
    
    // 后端直接计算预算建议（基于月均消费 * 1.1）
    const categoryBudgets: BudgetSuggestion[] = categoryData.map(cat => {
      const suggestedBudget = Math.ceil(cat.avg_spent * 1.1 / 10) * 10 // 向上取整到10
      return {
        category_id: cat.category_id,
        category_name: cat.category_name,
        suggested_budget: suggestedBudget,
        avg_spent: cat.avg_spent,
        trend: cat.trend as 'up' | 'down' | 'stable',
        reason: `月均消费${cat.avg_spent.toFixed(2)}元，建议预算略高于均值`
      }
    })
    
    const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.suggested_budget, 0)
    
    const client = getOpenAI()
    const config = useRuntimeConfig()
    
    const response = await client.chat.completions.create({
      model: config.scnetModel,
      messages: [
        { role: 'system', content: BUDGET_SUGGEST_PROMPT },
        {
          role: 'user',
          content: `以下是各分类的消费统计数据（已计算月均消费和趋势），请分析并提供建议：

${JSON.stringify(categoryData, null, 2)}

请根据以上数据生成分析摘要和节省建议。`
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const json = extractJSON(content)
    
    let analysisSummary = '基于历史消费数据的预算建议'
    let tips: string[] = ['建议根据实际情况调整预算']
    let confidence = 0.5
    
    try {
      const aiResult = JSON.parse(json) as BudgetSuggestResult
      analysisSummary = aiResult.analysis_summary || analysisSummary
      tips = aiResult.tips && aiResult.tips.length > 0 ? aiResult.tips : tips
      confidence = Number(aiResult.confidence) || confidence
    } catch (e) {
      console.error('JSON parse error:', e, 'Content:', content)
    }
    
    return successResponse({
      total_budget: totalBudget,
      category_budgets: categoryBudgets,
      analysis_summary: analysisSummary,
      tips: tips,
      confidence: confidence
    }, '获取预算建议成功')
  } catch (error: any) {
    console.error('获取预算建议失败:', error)
    return errorResponse('获取预算建议失败，请稍后重试', 500)
  }
})
