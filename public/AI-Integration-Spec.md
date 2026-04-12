# AI识别接入方案

## 概述

本文档详细说明家庭消费记账系统中AI功能的接入方案，包括智能识别、AI自动分类、消费分析三个核心功能的实现细节。

## SCNet平台API基础信息

### API端点
```
REST API: https://api.scnet.cn/api/llm/v1
```

### 认证方式
- 使用API Key进行认证
- API Key通过HTTP Header传递：`Authorization: Bearer YOUR_API_KEY`
- 需在SCNet平台的"模型API-API Keys"页面创建API Key

### 接口规范
- **兼容OpenAI接口规范**
- 使用OpenAI SDK或直接HTTP调用
- 主要端点：`/chat/completions`

### 支持的模型
需要在SCNet平台的模型列表中查看，常见的包括：
- `DeepSeek-R1-Distill-Qwen-7B`: 推荐模型，性价比高
- `gpt-3.5-turbo`: 快速、经济的文本生成
- `gpt-4`: 强大的文本生成和分析
- 其他模型（请查看SCNet模型列表）

### 定价策略
- 按Token使用量计费
- 具体价格请参考SCNet平台定价页面
- **优势**：中国大陆可直接访问，无需代理

### 获取API Key
1. 登录SCNet平台
2. 进入"模型API-API Keys"页面
3. 点击"创建API Key"
4. 输入名称并创建
5. 复制API Key（仅显示一次，请妥善保管）

### 查看模型列表
1. 登录SCNet平台
2. 进入"模型API"页面
3. 查看可用的模型列表
4. 选择合适的模型名称

## 智能识别功能接入方案

### 功能说明
解析用户的自然语言输入（文字、语音、图片），提取消费信息。

### 实现方案

#### 1. 文字识别（智能识别功能）
**API调用**：
```
POST https://api.scnet.cn/api/llm/v1/chat/completions
```

**请求头**：
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**请求体**：
```json
{
  "model": "DeepSeek-R1-Distill-Qwen-7B",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的消费信息提取助手。你的任务是从用户的消费描述中提取关键信息。\n\n提取规则：\n1. 金额：识别数字金额，支持\"30块\"、\"30元\"、\"30\"等格式\n2. 日期：识别时间表达，如\"今天\"、\"昨天\"、\"1月15日\"等，转换为YYYY-MM-DD格式\n3. 时间：识别时间表达，如\"中午\"、\"12:30\"等，转换为HH:MM格式\n4. 类别：根据消费内容推断消费大类（餐饮、交通、购物、娱乐、医疗、教育、居住、其他）\n5. 子类别：根据消费内容推断具体子类别（火锅、打车、超市、电影等）\n6. 成员：识别消费参与人员，如\"和老婆一起\"、\"和同事\"等\n7. 描述：保留原始描述或生成简洁描述\n\n输出格式：JSON\n置信度：基于提取的准确性，返回0-1之间的数值\n\n注意事项：\n- 如果信息缺失，对应字段返回null\n- 如果日期时间未明确，使用当前日期时间\n- 置信度低于0.8时，需要用户确认\n- 金额必须是有效数字，不能为负数\n\n请只返回JSON格式的结果，不要包含任何其他文字说明。"
    },
    {
      "role": "user",
      "content": "今天中午吃了30块火锅，和老婆一起"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 2048,
  "response_format": { "type": "json_object" }
}
```

**响应体**：
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "DeepSeek-R1-Distill-Qwen-7B",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\n  \"amount\": 30,\n  \"category\": \"餐饮\",\n  \"subcategory\": \"火锅\",\n  \"date\": \"2025-01-15\",\n  \"time\": \"12:30\",\n  \"members\": [\"用户本人\", \"妻子\"],\n  \"description\": \"今天中午吃了30块火锅，和老婆一起\",\n  \"confidence\": 0.95\n}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 80,
    "total_tokens": 230
  }
}
```

#### 2. 语音识别
**方案选择**：使用浏览器原生Web Speech API（免费）

**优势**：
- 无需调用第三方API
- 浏览器原生支持
- 实时转录

**工作流程**：
1. 前端使用Web Speech API录制音频
2. 实时将语音转换为文本
3. 使用识别出的文本调用智能识别功能

**实现示例**：
```javascript
const recognition = new webkitSpeechRecognition() || new SpeechRecognition()
recognition.lang = 'zh-CN'
recognition.continuous = false
recognition.interimResults = false

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  // 使用识别出的文本调用智能识别功能
  recognizeExpense(transcript)
}

recognition.start()
```

#### 3. 图片识别
**方案选择**：使用OCR技术提取图片中的文字

**选项A：使用Tesseract.js（前端）**
- 开源免费
- 纯前端实现
- 支持中英文识别

**选项B：使用SCNet多模态模型（如果支持）**
- 需要确认SCNet是否支持多模态
- 使用GPT-4 Vision或类似模型

**工作流程（使用Tesseract.js）**：
1. 前端上传图片（支持拖拽、点击上传、拍照）
2. 使用Tesseract.js识别图片中的文字
3. 将识别出的文字作为输入调用智能识别功能

**实现示例**：
```javascript
import Tesseract from 'tesseract.js'

async function recognizeImage(imageFile) {
  const result = await Tesseract.recognize(imageFile, 'chi_sim+eng')
  const text = result.data.text
  // 使用识别出的文本调用智能识别功能
  recognizeExpense(text)
}
```

## AI自动分类功能接入方案

### 功能说明
根据消费描述推荐可能的分类。

### 实现方案

**API调用**：
```
POST https://api.scnet.cn/api/llm/v1/chat/completions
```

**请求头**：
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**请求体**：
```json
{
  "model": "DeepSeek-R1-Distill-Qwen-7B",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的消费分类助手。你的任务是根据消费描述推荐合适的分类。\n\n分类原则：\n1. 根据消费内容的主关键词判断分类\n2. 考虑消费金额对分类的影响（如小额可能是零食，大额可能是正餐）\n3. 参考常见的消费分类模式\n4. 考虑消费场景（堂食、外卖、打包等）\n\n输出格式：JSON\n推荐数量：2-3个最可能的分类\n排序方式：按置信度从高到低\n约束条件：\n- 所有推荐分类必须在现有分类体系中\n- 所有推荐分类的置信度之和不超过1\n- 如果只有一个可能分类，只返回一个\n\n现有分类体系：\n- 餐饮：火锅、烧烤、外卖、正餐、零食、饮料、其他餐饮\n- 交通：打车、地铁、公交、加油、停车、其他交通\n- 购物：超市、网购、服装、电子产品、家居用品、其他购物\n- 娱乐：电影、KTV、游戏、旅游、其他娱乐\n- 医疗：看病、买药、体检、其他医疗\n- 教育：培训、书籍、课程、其他教育\n- 居住：房租、水电、物业、其他居住\n- 其他：其他消费\n\n请只返回JSON格式的结果，不要包含任何其他文字说明。"
    },
    {
      "role": "user",
      "content": "消费描述：今天中午吃了30块火锅\n消费金额：30元"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 1024,
  "response_format": { "type": "json_object" }
}
```

**响应体**：
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "DeepSeek-R1-Distill-Qwen-7B",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\n  \"recommendations\": [\n    {\n      \"category\": \"餐饮\",\n      \"subcategory\": \"火锅\",\n      \"confidence\": 0.9\n    },\n    {\n      \"category\": \"餐饮\",\n      \"subcategory\": \"外卖\",\n      \"confidence\": 0.7\n    }\n  ]\n}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 200,
    "completion_tokens": 60,
    "total_tokens": 260
  }
}
```

## 消费分析功能接入方案

### 功能说明
分析消费数据，提供洞察和建议（同比分析、异常检测、节省建议、趋势预测）。

### 实现方案

**API调用**：
```
POST https://api.scnet.cn/api/llm/v1/chat/completions
```

**请求头**：
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**请求体**：
```json
{
  "model": "DeepSeek-R1-Distill-Qwen-7B",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的消费分析助手。你的任务是分析用户的消费数据，提供洞察和建议。\n\n分析任务：\n\n1. 同比分析：\n   - 对比本月和上月的消费总额\n   - 计算变化金额和变化率\n   - 分析主要变化的分类\n\n2. 异常检测：\n   - 识别超出平均值30%的消费\n   - 识别超出预算的消费\n   - 识别异常大额消费\n   - 为每个异常生成说明\n\n3. 节省建议：\n   - 基于消费习惯生成具体建议\n   - 重点关注超支和高消费分类\n   - 提供可操作的建议（如\"减少外卖频率，多在家做饭\"）\n   - 保持积极的语调\n\n4. 趋势预测：\n   - 基于最近3个月的消费数据\n   - 预测下个月的消费金额\n   - 判断消费趋势（上升/下降/稳定）\n   - 基于消费习惯和历史数据，确保预测准确率不低于70%\n\n输出格式：JSON\n分析原则：\n- 基于数据说话，避免主观臆断\n- 建议要具体可操作，避免空泛\n- 关注用户的财务健康\n- 保持客观中立的态度\n\n注意事项：\n- 如果数据不足（少于1个月），跳过对比分析\n- 如果没有预算数据，跳过预算相关的异常检测\n- 预测基于最近3个月的数据，数据不足时返回趋势为\"未知\"\n\n请只返回JSON格式的结果，不要包含任何其他文字说明。"
    },
    {
      "role": "user",
      "content": "消费数据：[{\"date\":\"2025-01-15\",\"amount\":30,\"category\":\"餐饮\",\"subcategory\":\"火锅\",\"member\":\"张三\"},{\"date\":\"2025-01-16\",\"amount\":50,\"category\":\"交通\",\"subcategory\":\"打车\",\"member\":\"张三\"}]\n\n时间范围：2025-01-01 至 2025-01-31\n筛选条件：分类=全部, 成员=全部\n\n预算设置：{\"total\":5000,\"categories\":{\"餐饮\":2000,\"交通\":1000,\"购物\":1000,\"其他\":1000}}"
    }
  ],
  "temperature": 0.2,
  "max_tokens": 2048,
  "response_format": { "type": "json_object" }
}
```

**响应体**：
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "DeepSeek-R1-Distill-Qwen-7B",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\n  \"monthOverMonth\": {\n    \"currentMonth\": 5000,\n    \"lastMonth\": 4500,\n    \"change\": 500,\n    \"changeRate\": 0.111\n  },\n  \"anomalies\": [\n    {\n      \"type\": \"超支\",\n      \"category\": \"餐饮\",\n      \"amount\": 2000,\n      \"budget\": 1500,\n      \"message\": \"餐饮支出超出预算500元\"\n    }\n  ],\n  \"suggestions\": [\n    \"本月餐饮支出比上月增加20%，建议减少外卖频率，多在家做饭\",\n    \"交通支出稳定，继续保持\"\n  ],\n  \"prediction\": {\n    \"nextMonth\": 5200,\n    \"trend\": \"上升\"\n  }\n}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 300,
    "completion_tokens\": 150,
    "total_tokens": 450
  }
}
```

## Nuxt.js集成方案

### 1. 项目配置

#### 安装依赖
```bash
npm install openai
npm install tesseract.js
```

#### 环境变量配置
在 `.env` 文件中添加：
```
SCNET_API_KEY=your_scnet_api_key
SCNET_API_URL=https://api.scnet.cn/api/llm/v1
SCNET_MODEL=DeepSeek-R1-Distill-Qwen-7B
```

### 2. 服务端API实现

#### 创建AI服务（`server/services/ai.service.ts`）
```typescript
import OpenAI from 'openai'

export class AIService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.SCNET_API_KEY,
      baseURL: process.env.SCNET_API_URL
    })
  }

  // 智能识别
  async recognizeExpense(text: string) {
    const systemPrompt = `你是一个专业的消费信息提取助手。你的任务是从用户的消费描述中提取关键信息。

提取规则：
1. 金额：识别数字金额，支持"30块"、"30元"、"30"等格式
2. 日期：识别时间表达，如"今天"、"昨天"、"1月15日"等，转换为YYYY-MM-DD格式
3. 时间：识别时间表达，如"中午"、"12:30"等，转换为HH:MM格式
4. 类别：根据消费内容推断消费大类（餐饮、交通、购物、娱乐、医疗、教育、居住、其他）
5. 子类别：根据消费内容推断具体子类别（火锅、打车、超市、电影等）
6. 成员：识别消费参与人员，如"和老婆一起"、"和同事"等
7. 描述：保留原始描述或生成简洁描述

输出格式：JSON
置信度：基于提取的准确性，返回0-1之间的数值

注意事项：
- 如果信息缺失，对应字段返回null
- 如果日期时间未明确，使用当前日期时间
- 置信度低于0.8时，需要用户确认
- 金额必须是有效数字，不能为负数

请只返回JSON格式的结果，不要包含任何其他文字说明。`

    const response = await this.client.chat.completions.create({
      model: process.env.SCNET_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    return JSON.parse(content || '{}')
  }

  // AI自动分类
  async classifyExpense(description: string, amount: number, categories: any[]) {
    const systemPrompt = `你是一个专业的消费分类助手。你的任务是根据消费描述推荐合适的分类。

分类原则：
1. 根据消费内容的主关键词判断分类
2. 考虑消费金额对分类的影响（如小额可能是零食，大额可能是正餐）
3. 参考常见的消费分类模式
4. 考虑消费场景（堂食、外卖、打包等）

输出格式：JSON
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

请只返回JSON格式的结果，不要包含任何其他文字说明。`

    const response = await this.client.chat.completions.create({
      model: process.env.SCNET_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `消费描述：${description}\n消费金额：${amount}元` }
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    return JSON.parse(content || '{}')
  }

  // 消费分析
  async analyzeExpense(data: any[], timeRange: any, filters: any, budget: any) {
    const systemPrompt = `你是一个专业的消费分析助手。你的任务是分析用户的消费数据，提供洞察和建议。

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

输出格式：JSON
分析原则：
- 基于数据说话，避免主观臆断
- 建议要具体可操作，避免空泛
- 关注用户的财务健康
- 保持客观中立的态度

注意事项：
- 如果数据不足（少于1个月），跳过对比分析
- 如果没有预算数据，跳过预算相关的异常检测
- 预测基于最近3个月的数据，数据不足时返回趋势为"未知"

请只返回JSON格式的结果，不要包含任何其他文字说明。`

    const response = await this.client.chat.completions.create({
      model: process.env.SCNET_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `消费数据：${JSON.stringify(data)}\n\n时间范围：${timeRange.start} 至 ${timeRange.end}\n筛选条件：分类=${filters.category}, 成员=${filters.member}\n\n预算设置：${JSON.stringify(budget)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    return JSON.parse(content || '{}')
  }

  // 图片识别（OCR文字提取）
  async recognizeImageText(imageBuffer: Buffer) {
    const Tesseract = require('tesseract.js')
    const result = await Tesseract.recognize(imageBuffer, 'chi_sim+eng')
    return result.data.text
  }
}
```

#### 创建API路由（`server/api/ai/recognize.post.ts`）
```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const aiService = new AIService()

  try {
    const result = await aiService.recognizeExpense(body.text)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('AI识别失败:', error)
    return {
      success: false,
      message: 'AI识别失败',
      code: 500
    }
  }
})
```

#### 创建分类API路由（`server/api/ai/classify.post.ts`）
```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const aiService = new AIService()

  try {
    const result = await aiService.classifyExpense(body.description, body.amount, body.categories)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('AI分类失败:', error)
    return {
      success: false,
      message: 'AI分类失败',
      code: 500
    }
  }
})
```

#### 创建分析API路由（`server/api/ai/analyze.post.ts`）
```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const aiService = new AIService()

  try {
    const result = await aiService.analyzeExpense(body.data, body.timeRange, body.filters, body.budget)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('AI分析失败:', error)
    return {
      success: false,
      message: 'AI分析失败',
      code: 500
    }
  }
})
```

#### 创建图片识别API路由（`server/api/ai/image-recognize.post.ts`）
```typescript
export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const file = formData.get('image') as File

  if (!file) {
    return {
      success: false,
      message: '请上传图片',
      code: 400
    }
  }

  const aiService = new AIService()

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const text = await aiService.recognizeImageText(buffer)

    // 使用识别出的文本调用智能识别功能
    const result = await aiService.recognizeExpense(text)

    return {
      success: true,
      data: {
        ocrText: text,
        extractedInfo: result
      }
    }
  } catch (error) {
    console.error('图片识别失败:', error)
    return {
      success: false,
      message: '图片识别失败',
      code: 500
    }
  }
})
```

### 3. 前端调用

#### 使用Composable（`composables/useAI.ts`）
```typescript
export const useAI = () => {
  const recognizeExpense = async (text: string) => {
    return await $fetch('/api/ai/recognize', {
      method: 'POST',
      body: { text }
    })
  }

  const classifyExpense = async (description: string, amount: number, categories: any[]) => {
    return await $fetch('/api/ai/classify', {
      method: 'POST',
      body: { description, amount, categories }
    })
  }

  const analyzeExpense = async (data: any[], timeRange: any, filters: any, budget: any) => {
    return await $fetch('/api/ai/analyze', {
      method: 'POST',
      body: { data, timeRange, filters, budget }
    })
  }

  const recognizeImage = async (imageFile: File) => {
    const formData = new FormData()
    formData.append('image', imageFile)

    return await $fetch('/api/ai/image-recognize', {
      method: 'POST',
      body: formData
    })
  }

  return {
    recognizeExpense,
    classifyExpense,
    analyzeExpense,
    recognizeImage
  }
}
```

### 4. 语音识别（前端实现）

#### 创建语音识别Composable（`composables/useSpeechRecognition.ts`）
```typescript
export const useSpeechRecognition = () => {
  const isListening = ref(false)
  const transcript = ref('')
  const recognition = ref<any>(null)

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition.value = new SpeechRecognition()
    recognition.value.lang = 'zh-CN'
    recognition.value.continuous = false
    recognition.value.interimResults = false

    recognition.value.onresult = (event: any) => {
      transcript.value = event.results[0][0].transcript
    }

    recognition.value.onend = () => {
      isListening.value = false
    }

    recognition.value.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      isListening.value = false
    }

    recognition.value.start()
    isListening.value = true
  }

  const stopListening = () => {
    if (recognition.value) {
      recognition.value.stop()
      isListening.value = false
    }
  }

  return {
    isListening,
    transcript,
    startListening,
    stopListening
  }
}
```

## 错误处理

### 常见错误类型

#### 1. API Key错误
```
错误码：401
错误信息：API key not valid
处理方案：检查API Key是否正确配置
```

#### 2. 配额超限
```
错误码：429
错误信息：Quota exceeded
处理方案：升级付费版本或等待配额重置
```

#### 3. 请求超时
```
错误码：504
错误信息：Request timeout
处理方案：增加超时时间或重试请求
```

#### 4. 解析错误
```
错误码：500
错误信息：Failed to parse JSON response
处理方案：检查AI返回的格式，增加重试逻辑
```

### 错误处理策略

1. **重试机制**：对于临时性错误（超时、配额），自动重试3次
2. **降级方案**：AI识别失败时，使用手动输入
3. **错误提示**：向用户显示友好的错误信息
4. **日志记录**：记录所有AI调用的错误信息

## 性能优化

### 1. 缓存策略
- 对相同输入的结果进行缓存（TTL: 1小时）
- 使用Redis或内存缓存

### 2. 批量处理
- 消费分析功能可以批量处理多条记录
- 减少API调用次数

### 3. 流式响应
- 使用streamGenerateContent实现流式响应
- 提升用户体验

### 4. 请求合并
- 智能识别和自动分类可以合并为一个请求
- 减少网络延迟

## 成本控制

### 1. 使用监控
- 记录每次API调用的Token消耗
- 设置每日调用上限

### 2. 优化Prompt
- 使用简洁的提示词
- 减少不必要的输入

### 3. 选择合适的模型
- 简单任务使用轻量模型
- 复杂任务使用强大模型

### 4. 批量处理
- 合并多个小请求为一个大请求

## 安全性

### 1. API Key保护
- 不要在前端暴露API Key
- 使用服务端代理API调用

### 2. 数据验证
- 验证所有输入数据
- 防止注入攻击

### 3. 访问控制
- 限制API调用频率
- 实现用户级别的配额管理

### 4. 数据隐私
- 不在日志中记录敏感信息
- 使用HTTPS传输数据

## 测试策略

### 1. 单元测试
- 测试AI服务的每个方法
- Mock API响应

### 2. 集成测试
- 测试完整的API调用流程
- 使用测试API Key

### 3. 性能测试
- 测试API响应时间
- 压力测试并发请求

### 4. 边界测试
- 测试各种边界情况
- 空输入、超长输入、特殊字符

## 待确认事项

1. **API Key获取**：登录SCNet平台，在"模型API-API Keys"页面创建API Key
2. **模型选择**：在SCNet模型列表中选择合适的模型（推荐gpt-3.5-turbo或gpt-4）
3. **成本预算**：根据SCNet平台的定价策略，评估预期的API调用成本
4. **多模态支持**：确认SCNet是否支持多模态模型（如果需要更强大的图片识别能力）
5. **数据保留**：AI调用的数据是否需要保留用于分析

## 优势总结

使用SCNet平台的优势：
1. **中国大陆可直接访问**，无需代理配置
2. **兼容OpenAI接口规范**，使用成熟的OpenAI SDK
3. **按需计费**，根据实际使用量付费
4. **稳定性高**，国内访问速度快
5. **易于集成**，标准化的API接口

## 下一步行动

1. 注册SCNet平台账号
2. 创建API Key
3. 查看模型列表，选择合适的模型
4. 配置项目环境变量
5. 测试API调用
6. 集成到Nuxt.js项目