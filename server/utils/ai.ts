import OpenAI from 'openai'
import type { RecognizeResult, ClassifyResult, AnalysisResult } from '~/types'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    const config = useRuntimeConfig()
    openai = new OpenAI({
      apiKey: config.scnetApiKey,
      baseURL: config.scnetApiUrl,
    })
  }
  return openai
}

// 从AI响应中提取JSON（处理markdown代码块）
function extractJSON(content: string): string {
  // 移除markdown代码块标记
  let json = content.trim()
  
  // 处理 ```json ... ``` 格式
  if (json.startsWith('```')) {
    json = json.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
  }
  
  // 找到第一个 { 和最后一个 }
  const start = json.indexOf('{')
  const end = json.lastIndexOf('}')
  
  if (start !== -1 && end !== -1 && end > start) {
    json = json.substring(start, end + 1)
  }
  
  return json
}

const RECOGNIZE_SYSTEM_PROMPT = `你是一个专业的消费信息提取助手。你的任务是从用户的消费描述中提取关键信息。

提取规则：
1. 金额：识别数字金额，支持"30块"、"30元"、"30"等格式
2. 日期：识别时间表达，如"今天"、"昨天"、"1月15日"等，转换为YYYY-MM-DD格式，使用当前日期作为基准
3. 时间：识别时间表达，如"中午"、"12:30"等，转换为HH:MM格式
4. 类别：根据消费内容推断消费大类（餐饮、交通、购物、娱乐、医疗、教育、居住、其他）
5. 子类别：根据消费内容推断具体子类别（火锅、打车、超市、电影等）
6. 成员：识别消费参与人员，如"和老婆一起"、"和同事"等，提取为成员名称数组
7. 描述：保留原始描述或生成简洁描述

输出格式：纯JSON（不要包含markdown代码块）
置信度：基于提取的准确性，返回0-1之间的数值

注意事项：
- 如果信息缺失，对应字段返回null
- 如果日期时间未明确，使用当前日期时间
- 置信度低于0.8时，需要用户确认
- 金额必须是有效数字，不能为负数

直接返回JSON，格式如：
{"amount": 30, "category": "餐饮", "subcategory": "火锅", "date": "2025-01-15", "time": "12:30", "members": [], "description": "午饭火锅", "confidence": 0.9}`

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
{"recommendations": [{"category": "餐饮", "subcategory": "火锅", "confidence": 0.9}]}`

const ANALYZE_SYSTEM_PROMPT = `你是一个专业的消费分析助手。你的任务是分析用户的消费数据，提供洞察和建议。

分析任务：

1. 同比分析：
   - 对比本月和上月的消费总额
   - 计算变化金额和变化率
   - 分析主要变化的分类

2. 异常检测：
   - 识别超出平均值30%的消费
   - 识别超出预算的消费
   - 识别异常大额消费
   - 为每个异常生成说明

3. 节省建议：
   - 基于消费习惯生成具体建议
   - 重点关注超支和高消费分类
   - 提供可操作的建议（如"减少外卖频率，多在家做饭"）
   - 保持积极的语调

4. 趋势预测：
   - 基于最近3个月的消费数据
   - 预测下个月的消费金额
   - 判断消费趋势（上升/下降/稳定）
   - 基于消费习惯和历史数据，确保预测准确率不低于70%

输出格式：纯JSON（不要包含markdown代码块）
分析原则：
- 基于数据说话，避免主观臆断
- 建议要具体可操作，避免空泛
- 关注用户的财务健康
- 保持客观中立的态度

注意事项：
- 如果数据不足（少于1个月），跳过对比分析
- 如果没有预算数据，跳过预算相关的异常检测
- 预测基于最近3个月的数据，数据不足时返回趋势为"未知"

直接返回JSON。`

export async function recognizeExpense(text: string): Promise<RecognizeResult> {
  const client = getOpenAI()
  const config = useRuntimeConfig()
  
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toTimeString().slice(0, 5)
  
  const response = await client.chat.completions.create({
    model: config.scnetModel,
    messages: [
      { role: 'system', content: RECOGNIZE_SYSTEM_PROMPT },
      { role: 'user', content: `当前日期: ${today}\n当前时间: ${now}\n用户输入: ${text}` }
    ],
    temperature: 0.1,
    max_tokens: 1024,
  })
  
  const content = response.choices[0]?.message?.content || '{}'
  const json = extractJSON(content)
  
  try {
    return JSON.parse(json) as RecognizeResult
  } catch (e) {
    console.error('JSON parse error:', e, 'Content:', content)
    return {
      amount: null,
      category: null,
      subcategory: null,
      date: null,
      time: null,
      members: [],
      description: text,
      confidence: 0,
    }
  }
}

export async function classifyExpense(description: string, amount: number): Promise<ClassifyResult> {
  const client = getOpenAI()
  const config = useRuntimeConfig()
  
  const response = await client.chat.completions.create({
    model: config.scnetModel,
    messages: [
      { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
      { role: 'user', content: `消费描述：${description}\n消费金额：${amount}元` }
    ],
    temperature: 0.1,
    max_tokens: 512,
  })
  
  const content = response.choices[0]?.message?.content || '{"recommendations":[]}'
  const json = extractJSON(content)
  
  try {
    return JSON.parse(json) as ClassifyResult
  } catch (e) {
    console.error('JSON parse error:', e, 'Content:', content)
    return { recommendations: [] }
  }
}

export async function analyzeExpense(
  data: any[],
  timeRange: { start: string; end: string },
  budget: { total: number; categories: Record<string, number> }
): Promise<AnalysisResult> {
  const client = getOpenAI()
  const config = useRuntimeConfig()
  
  const response = await client.chat.completions.create({
    model: config.scnetModel,
    messages: [
      { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
      { role: 'user', content: `消费数据：${JSON.stringify(data)}\n\n时间范围：${timeRange.start} 至 ${timeRange.end}\n\n预算设置：${JSON.stringify(budget)}` }
    ],
    temperature: 0.2,
    max_tokens: 2048,
  })
  
  const content = response.choices[0]?.message?.content || '{}'
  const json = extractJSON(content)
  
  try {
    return JSON.parse(json) as AnalysisResult
  } catch (e) {
    console.error('JSON parse error:', e, 'Content:', content)
    return {
      monthOverMonth: null,
      anomalies: [],
      suggestions: [],
      prediction: null,
    }
  }
}
