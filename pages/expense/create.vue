<template>
  <div class="expense-create-page">
    <div class="page-header">
      <h2>记账</h2>
      <div class="header-actions">
        <el-button @click="downloadTemplate">
          <el-icon><Download /></el-icon> 下载模板
        </el-button>
        <el-upload
          :show-file-list="false"
          :before-upload="handleExcelImport"
          accept=".xlsx,.xls"
        >
          <el-button type="success">
            <el-icon><Upload /></el-icon> 导入Excel
          </el-button>
        </el-upload>
        <el-button @click="goToHistory">历史记录</el-button>
      </div>
    </div>

    <!-- 输入方式选择 -->
    <el-card class="input-mode-card">
      <el-radio-group v-model="inputMode" @change="handleModeChange">
        <el-radio-button value="form">
          <el-icon><Edit /></el-icon> 录入
        </el-radio-button>
        <el-radio-button value="chat">
          <el-icon><ChatDotRound /></el-icon> AI对话
        </el-radio-button>
        <el-radio-button value="text">
          <el-icon><Promotion /></el-icon> 快捷
        </el-radio-button>
        <el-radio-button value="voice">
          <el-icon><Microphone /></el-icon> 语音
        </el-radio-button>
        <el-radio-button value="image">
          <el-icon><Picture /></el-icon> 图片
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 录入模式 -->
    <el-card v-if="inputMode === 'form'" class="form-input-card">
      <el-form :model="expenseForm" label-width="80px" class="expense-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="金额" required>
              <el-input
                v-model="amountInput"
                placeholder="输入金额或表达式"
                @input="handleAmountExpression"
              >
                <template #prefix>¥</template>
                <template #suffix v-if="amountExpressionResult !== null">
                  <span class="result">= {{ Number(amountExpressionResult).toFixed(2) }}</span>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成员">
              <el-select v-model="expenseForm.member_id" placeholder="选择成员" clearable style="width: 100%">
                <el-option
                  v-for="member in memberStore.members"
                  :key="member.id"
                  :label="member.name"
                  :value="member.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期" required>
              <el-date-picker
                v-model="expenseForm.expense_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时间">
              <el-time-picker
                v-model="expenseForm.expense_time"
                placeholder="选择时间"
                value-format="HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="分类" required>
          <el-cascader
            v-model="expenseForm.category_id"
            :options="categoryCascaderData"
            :props="{ value: 'id', label: 'name', children: 'children', emitPath: false }"
            placeholder="选择分类"
            clearable
            filterable
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="expenseForm.description" type="textarea" :rows="2" placeholder="消费备注（可选）" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveExpense" :loading="saving">保存记录</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- AI对话模式 - 左右布局 -->
    <div v-if="inputMode === 'chat'" class="chat-layout">
      <!-- 左侧：对话框 -->
      <el-card class="chat-left-panel">
        <template #header>
          <div class="chat-header">
            <span>AI记账助手</span>
            <el-button link type="primary" size="small" @click="clearChatHistory">
              清空对话
            </el-button>
          </div>
        </template>

        <!-- 对话历史 -->
        <div class="chat-history" ref="chatHistoryRef">
          <div class="chat-welcome" v-if="chatHistory.length === 0">
            <el-icon :size="48" color="#409EFF"><ChatDotRound /></el-icon>
            <h3>你好！我是AI记账助手</h3>
            <p>你可以这样告诉我：</p>
            <div class="example-list">
              <el-tag
                v-for="example in chatExamples"
                :key="example"
                class="example-tag"
                @click="sendQuickMessage(example)"
              >
                {{ example }}
              </el-tag>
            </div>
          </div>

          <div
            v-for="(msg, index) in chatHistory"
            :key="index"
            class="chat-message"
            :class="msg.role"
          >
            <div class="message-avatar">
              <el-avatar v-if="msg.role === 'user'" :size="32">
                {{ userStore.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <el-avatar v-else :size="32" class="ai-avatar">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <!-- 如果是AI消息且包含识别结果 -->
              <div v-if="msg.role === 'assistant' && msg.result" class="message-result">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item label="金额">
                    <span class="amount">¥{{ msg.result.amount ? Number(msg.result.amount).toFixed(2) : '0.00' }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="分类">
                    {{ msg.result.category }} / {{ msg.result.subcategory }}
                  </el-descriptions-item>
                  <el-descriptions-item label="日期">{{ msg.result.date }}</el-descriptions-item>
                  <el-descriptions-item label="置信度">
                    <el-progress
                      :percentage="(msg.result.confidence || 0) * 100"
                      :stroke-width="6"
                      :show-text="false"
                    />
                  </el-descriptions-item>
                </el-descriptions>
                <div class="result-actions">
                  <el-button type="primary" size="small" @click="applyChatResult(msg.result)">
                    确认并保存
                  </el-button>
                  <el-button size="small" @click="editChatResult(msg.result)">
                    修改后保存
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- AI思考中 -->
          <div v-if="chatThinking" class="chat-message assistant thinking">
            <div class="message-avatar">
              <el-avatar :size="32" class="ai-avatar">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text">
                <el-icon class="is-loading"><Loading /></el-icon>
                正在分析...
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="chat-input-area">
          <el-input
            v-model="chatInput"
            type="textarea"
            :rows="2"
            placeholder="描述你的消费，如：今天午饭花了30块，吃的火锅"
            @keyup.enter.ctrl="sendChatMessage"
          />
          <div class="chat-input-actions">
            <span class="tip">Ctrl + Enter 发送</span>
            <el-button type="primary" :loading="chatThinking" @click="sendChatMessage">
              发送
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 右侧：编辑表单 -->
      <el-card v-if="isEditing" class="chat-right-panel">
        <template #header>
          <div class="edit-header">
            <span>编辑消费记录</span>
            <el-button link type="info" size="small" @click="isEditing = false">
              关闭
            </el-button>
          </div>
        </template>

        <el-form :model="expenseForm" label-width="80px" class="chat-edit-form">
          <el-form-item label="金额" required>
            <el-input
              v-model="amountInput"
              placeholder="输入金额或表达式"
              @input="handleAmountExpression"
            >
              <template #prefix>¥</template>
              <template #suffix v-if="amountExpressionResult !== null">
                <span class="result">= {{ Number(amountExpressionResult).toFixed(2) }}</span>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="日期" required>
            <el-date-picker
              v-model="expenseForm.expense_date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="时间">
            <el-time-picker
              v-model="expenseForm.expense_time"
              placeholder="选择时间"
              value-format="HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="分类" required>
            <el-cascader
              v-model="expenseForm.category_id"
              :options="categoryCascaderData"
              :props="{ value: 'id', label: 'name', children: 'children', emitPath: false }"
              placeholder="选择分类"
              clearable
              filterable
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="成员">
            <el-select v-model="expenseForm.member_id" placeholder="选择成员" clearable style="width: 100%">
              <el-option
                v-for="member in memberStore.members"
                :key="member.id"
                :label="member.name"
                :value="member.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="expenseForm.description" type="textarea" :rows="2" placeholder="消费备注（可选）" />
          </el-form-item>

          <!-- AI推荐分类 -->
          <div v-if="recommendations.length > 0" class="ai-recommend">
            <span class="label">AI推荐分类：</span>
            <div class="recommend-list">
              <div
                v-for="(rec, index) in recommendations"
                :key="index"
                class="recommend-item"
                :class="{ active: selectedRecommendIndex === index }"
                @click="selectRecommend(index)"
              >
                <span class="name">{{ rec.subcategory }}</span>
                <span class="confidence">{{ (Number(rec.confidence ?? 0) * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <el-form-item>
            <el-button type="primary" @click="saveExpense" :loading="saving">保存记录</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 快捷记账模式 -->
    <el-card v-if="inputMode === 'text'" class="quick-input-card">
      <!-- 表达式输入 -->
      <div class="expression-input">
        <el-input
          v-model="expressionInput"
          size="large"
          placeholder="输入金额或表达式，如：30+20、100*0.8、50/2"
          @input="handleExpressionInput"
        >
          <template #prefix>
            <span class="currency">¥</span>
          </template>
          <template #suffix v-if="expressionResult !== null">
            <span class="result">= {{ expressionResult.toFixed(2) }}</span>
          </template>
        </el-input>
      </div>
      
      <!-- 快捷金额按钮 -->
      <div class="quick-amounts">
        <el-button 
          v-for="amount in quickAmounts" 
          :key="amount"
          size="small"
          @click="setQuickAmount(amount)"
        >
          ¥{{ amount }}
        </el-button>
      </div>
      
      <!-- 描述输入 -->
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="2"
        placeholder="消费描述（可选），如：午饭火锅"
        class="description-input"
      />
      
      <!-- 快捷分类 -->
      <div class="quick-categories">
        <span class="label">快捷分类：</span>
        <template v-if="quickCategories.length > 0">
          <div class="category-buttons">
            <el-button
              v-for="cat in quickCategories"
              :key="cat.id"
              size="small"
              :type="quickCategoryId === cat.id ? 'primary' : 'default'"
              @click="quickCategoryId = cat.id"
            >
              {{ cat.icon }} {{ cat.name }}
            </el-button>
          </div>
        </template>
        <span v-else class="empty-tip">加载分类中...</span>
      </div>
      
      <div class="input-actions">
        <el-button @click="clearQuickInput">清空</el-button>
        <el-button type="primary" @click="quickSave" :loading="saving">
          保存
        </el-button>
      </div>
    </el-card>
    
    <!-- 语音输入模式 -->
    <el-card v-if="inputMode === 'voice'" class="input-card voice-card">
      <div class="voice-area">
        <el-button
          :type="isListening ? 'danger' : 'primary'"
          size="large"
          circle
          :disabled="!isSpeechSupported"
          @click="toggleListening"
        >
          <el-icon :size="32"><Microphone /></el-icon>
        </el-button>
        <p>{{ isListening ? '正在录音，请说话...' : '点击开始录音' }}</p>
        <div v-if="speechTranscript" class="transcript">
          <p>识别结果：</p>
          <p>{{ speechTranscript }}</p>
          <el-button type="primary" size="small" @click="recognizeFromSpeech" :loading="recognizing">
            AI识别
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 图片输入模式 -->
    <el-card v-if="inputMode === 'image'" class="input-card image-card">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleImageChange"
        :show-file-list="false"
        accept="image/*"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽图片到此处，或<em>点击上传</em>
        </div>
      </el-upload>
      <div v-if="previewImage" class="image-preview">
        <img :src="previewImage" alt="预览" />
        <el-button type="primary" @click="recognizeFromImage" :loading="recognizing">
          识别图片
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Edit, Microphone, Picture, UploadFilled, ChatDotRound, Loading, Promotion, Download, Upload } from '@element-plus/icons-vue'
import type { RecognizeResult, CategoryRecommendation, Category } from '~/types'
import { categoryTreeToCascaderData } from '~/utils/tree'
import { formatDate } from '~/utils/format'

definePageMeta({
  middleware: ['auth'],
})

const router = useRouter()
const userStore = useUserStore()
const { recognizeExpense, recognizeImage } = useAI()
const { isListening, transcript: speechTranscript, isSupported: isSpeechSupported, toggleListening, clearTranscript } = useSpeechRecognition()
const categoryStore = useCategoryStore()
const memberStore = useMemberStore()
const api = useApi()

// 输入模式
const inputMode = ref<'chat' | 'text' | 'form' | 'voice' | 'image'>('form')
const inputText = ref('')
const previewImage = ref('')
const selectedFile = ref<File | null>(null)

// 快捷记账
const expressionInput = ref('')
const expressionResult = ref<number | null>(null)
const quickAmounts = [10, 20, 30, 50, 100, 200]
const quickCategoryId = ref<number | null>(null)

// 快捷分类图标映射
const categoryIcons: Record<string, string> = {
  '火锅': '🍲',
  '外卖': '🍱',
  '打车': '🚕',
  '超市': '🛒',
  '电影': '🎬',
  '其他': '📦',
  '网购': '🛍️',
  '地铁': '🚇',
  '公交': '🚌',
  '正餐': '🍽️',
  '零食': '🍪',
  '饮料': '🥤',
  '烧烤': '🍖',
  '加油': '⛽',
  '停车': '🅿️',
  '医疗': '💊',
  '教育': '📚',
  '房租': '🏠',
  '水电': '💡',
  '物业': '🏢',
  '看病': '🏥',
  '买药': '💊',
  '体检': '🩺',
  '培训': '📖',
  '书籍': '📚',
  '课程': '🎓',
  '旅游': '✈️',
  '游戏': '🎮',
  'KTV': '🎤',
  '服装': '👔',
  '电子产品': '📱',
  '家居用品': '🛋️',
}

// 分类关键词映射（用于自动匹配）
const categoryKeywords: Record<string, string[]> = {
  '火锅': ['火锅', '锅底', '涮', '麻辣', '鸳鸯'],
  '外卖': ['外卖', '美团', '饿了么', '配送'],
  '打车': ['打车', '滴滴', '出租', '快车', '专车'],
  '超市': ['超市', '买菜', '蔬菜', '水果', '日用品'],
  '电影': ['电影', '影院', '购票', '观影'],
  '网购': ['网购', '淘宝', '京东', '拼多多', '快递'],
  '地铁': ['地铁', '城铁', '轨道'],
  '公交': ['公交', '巴士'],
  '正餐': ['正餐', '饭店', '餐厅', '聚餐', '宴请'],
  '零食': ['零食', '小吃', '点心', '薯片'],
  '饮料': ['饮料', '奶茶', '咖啡', '果汁', '可乐'],
  '烧烤': ['烧烤', '烤肉', '撸串'],
  '加油': ['加油', '汽油', '柴油', '油费'],
  '停车': ['停车', '车位', '停车费'],
  '房租': ['房租', '租房', '住房'],
  '水电': ['水费', '电费', '水电'],
  '物业': ['物业', '物业费'],
  '看病': ['看病', '医院', '门诊', '挂号'],
  '买药': ['买药', '药房', '药品'],
  '体检': ['体检', '检查'],
  '培训': ['培训', '补习', '辅导'],
  '书籍': ['书', '书店', '购书'],
  '课程': ['课程', '网课', '在线课'],
  '旅游': ['旅游', '旅行', '景点', '门票'],
  '游戏': ['游戏', '充值', '皮肤'],
  'KTV': ['KTV', '唱歌', 'ktv'],
  '服装': ['衣服', '鞋', '服装', '裤子'],
  '电子产品': ['手机', '电脑', '平板', '耳机'],
}

// 动态获取快捷分类（从分类 store 的树形结构中获取所有子分类）
const quickCategories = computed(() => {
  const tree = categoryStore.tree || []
  const subCategories: Category[] = []

  // 从树形结构中提取所有子分类
  tree.forEach(parent => {
    if (parent.children && parent.children.length > 0) {
      parent.children.forEach(child => {
        subCategories.push(child)
      })
    }
  })

  // 如果没有数据，返回空数组
  if (subCategories.length === 0) {
    return []
  }

  // 按 sort_order 排序
  const sorted = [...subCategories].sort((a, b) => {
    return (a.sort_order || 0) - (b.sort_order || 0)
  })

  // 返回前 12 个分类（避免太多）
  return sorted.slice(0, 12).map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: categoryIcons[cat.name] || '📌',
  }))
})

// 根据描述自动匹配分类
const autoMatchCategory = (description: string): number | null => {
  if (!description.trim()) return null

  const text = description.toLowerCase()
  const tree = categoryStore.tree || []

  // 遍历关键词映射，找到匹配的分类
  for (const [catName, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // 从树形结构中查找分类
        for (const parent of tree) {
          if (parent.children) {
            const found = parent.children.find(c => c.name === catName)
            if (found) {
              return found.id
            }
          }
        }
      }
    }
  }

  return null
}

// 监听描述输入，自动匹配分类
watch(inputText, (newText) => {
  if (inputMode.value === 'text' && newText.trim()) {
    const matchedId = autoMatchCategory(newText)
    if (matchedId) {
      quickCategoryId.value = matchedId
    }
  }
})

// AI对话
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  result?: RecognizeResult
}
const chatHistory = ref<ChatMessage[]>([])
const chatInput = ref('')
const chatThinking = ref(false)
const chatHistoryRef = ref<HTMLElement>()
const chatExamples = [
  '今天午饭花了30块',
  '打车去公司25元',
  '超市买菜花了156',
  '看电影两张票80',
  '昨天晚饭AA制每人50',
]

// 状态
const recognizing = ref(false)
const saving = ref(false)
const recognizeResult = ref<RecognizeResult | null>(null)
const recommendations = ref<CategoryRecommendation[]>([])
const selectedRecommendIndex = ref<number | null>(null)
const isEditing = ref(false)

// 表单
const expenseForm = reactive({
  amount: 0,
  expense_date: formatDate(new Date()),
  expense_time: null as string | null,
  category_id: null as number | null,
  member_id: null as number | null,
  description: '',
})

// 金额表达式输入
const amountInput = ref('')
const amountExpressionResult = ref<number | null>(null)

// ==================== 持久化处理 ====================
const STORAGE_KEY = 'expense-create-form'

// 保存表单到 localStorage
const saveFormToStorage = () => {
  if (typeof window === 'undefined') return
  try {
    const data = {
      inputMode: inputMode.value,
      expenseForm: { ...expenseForm },
      amountInput: amountInput.value,
      expressionInput: expressionInput.value,
      inputText: inputText.value,
      quickCategoryId: quickCategoryId.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // ignore
  }
}

// 从 localStorage 恢复表单
const restoreFormFromStorage = () => {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      if (data.inputMode) inputMode.value = data.inputMode
      if (data.expenseForm) {
        Object.assign(expenseForm, data.expenseForm)
      }
      if (data.amountInput) amountInput.value = data.amountInput
      if (data.expressionInput) expressionInput.value = data.expressionInput
      if (data.inputText) inputText.value = data.inputText
      if (data.quickCategoryId !== undefined) quickCategoryId.value = data.quickCategoryId
      return true
    }
  } catch (e) {
    // ignore
  }
  return false
}

// 清除 localStorage
const clearFormStorage = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    // ignore
  }
}

// 监听表单变化，自动保存
watch(
  [() => inputMode.value, () => expenseForm.amount, () => expenseForm.expense_date,
   () => expenseForm.category_id, () => expenseForm.member_id, () => expenseForm.description,
   () => amountInput.value, () => expressionInput.value, () => inputText.value],
  () => {
    saveFormToStorage()
  },
  { deep: true }
)

// 分类级联数据
const categoryCascaderData = computed(() => {
  return categoryTreeToCascaderData(categoryStore.tree)
})

// 初始化
onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    memberStore.fetchMembers(),
  ])

  // 恢复持久化的表单内容
  const restored = restoreFormFromStorage()

  // 如果当前用户是成员（非管理员），且表单中没有设置 member_id，则默认选择当前登录成员
  if (!restored || !expenseForm.member_id) {
    if (userStore.user && !userStore.isAdmin) {
      // 检查当前用户 ID 是否在成员列表中
      const currentUserAsMember = memberStore.members.find(m => m.id === userStore.user.id)
      if (currentUserAsMember) {
        expenseForm.member_id = currentUserAsMember.id
      }
    }
  }
})

// ==================== 表达式计算 ====================

// 计算表达式
const evaluateExpression = (expr: string): number | null => {
  if (!expr.trim()) return null
  
  try {
    // 清理表达式，只保留数字、运算符、括号、小数点
    const cleaned = expr.replace(/[^0-9+\-*/().]/g, '')
    if (!cleaned) return null
    
    // 使用 Function 安全计算（比 eval 稍安全）
    const result = new Function('return ' + cleaned)()
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result) && result >= 0) {
      return Math.round(result * 100) / 100
    }
    return null
  } catch {
    return null
  }
}

// 处理表达式输入
const handleExpressionInput = () => {
  expressionResult.value = evaluateExpression(expressionInput.value)
}

// 处理金额表达式
const handleAmountExpression = () => {
  amountExpressionResult.value = evaluateExpression(amountInput.value)
  if (amountExpressionResult.value !== null) {
    expenseForm.amount = amountExpressionResult.value
  }
}

// 设置快捷金额
const setQuickAmount = (amount: number) => {
  expressionInput.value = amount.toString()
  expressionResult.value = amount
}

// ==================== AI对话模式 ====================

// 发送对话消息
const sendChatMessage = async () => {
  if (!chatInput.value.trim() || chatThinking.value) return
  
  const userMessage = chatInput.value.trim()
  chatHistory.value.push({ role: 'user', content: userMessage })
  chatInput.value = ''
  
  // 滚动到底部
  await nextTick()
  scrollChatToBottom()
  
  chatThinking.value = true
  
  try {
    const res = await recognizeExpense(userMessage)
    
    if (res.success) {
      const result = res.data
      
      // 生成回复内容
      let replyContent = ''
      if (result.amount) {
        replyContent = `好的，我识别到以下信息：\n\n**金额**: ¥${Number(result.amount).toFixed(2)}`
        if (result.category) {
          replyContent += `\n**分类**: ${result.category}`
          if (result.subcategory) {
            replyContent += ` → ${result.subcategory}`
          }
        }
        if (result.date) {
          replyContent += `\n**日期**: ${result.date}`
        }
        replyContent += '\n\n请确认是否正确，或告诉我需要修改的地方。'
      } else {
        replyContent = '我没有从您的描述中识别到金额信息，请再详细描述一下，比如：\n- "午饭花了30块"\n- "打车25元"\n- "超市购物156元"'
      }
      
      chatHistory.value.push({ 
        role: 'assistant', 
        content: replyContent,
        result: result.amount ? result : undefined
      })
    } else {
      chatHistory.value.push({ 
        role: 'assistant', 
        content: '抱歉，识别失败了，请再试一次或换种方式描述。' 
      })
    }
  } catch (error: any) {
    chatHistory.value.push({ 
      role: 'assistant', 
      content: '抱歉，出现了一些问题，请稍后再试。' 
    })
  } finally {
    chatThinking.value = false
    await nextTick()
    scrollChatToBottom()
  }
}

// 发送快捷示例消息
const sendQuickMessage = (message: string) => {
  chatInput.value = message
  sendChatMessage()
}

// 清空对话历史
const clearChatHistory = () => {
  chatHistory.value = []
}

// 滚动到底部
const scrollChatToBottom = () => {
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
  }
}

// 格式化消息内容
const formatMessage = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

// 应用对话结果
const applyChatResult = async (result: RecognizeResult) => {
  fillFormFromResult(result)

  // 如果没有找到分类，尝试获取分类推荐
  if (!expenseForm.category_id && result.amount) {
    await fetchClassifications(result.description || '', result.amount)

    // 自动选择置信度最高的分类推荐
    if (recommendations.value.length > 0) {
      selectRecommend(0)
    }
  }

  // 检查是否可以保存
  if (!expenseForm.category_id) {
    ElMessage.warning('未能识别分类，请手动选择分类后保存')
    // 切换到编辑模式让用户手动选择
    amountInput.value = result.amount?.toString() || ''
    isEditing.value = true
    return
  }

  // 直接保存
  await saveExpense()
}

// 编辑对话结果
const editChatResult = async (result: RecognizeResult) => {
  fillFormFromResult(result)
  amountInput.value = result.amount?.toString() || ''

  // 获取分类推荐供用户选择
  if (result.amount) {
    await fetchClassifications(result.description || '', result.amount)

    // 如果当前没有分类且有推荐，自动选择第一个
    if (!expenseForm.category_id && recommendations.value.length > 0) {
      selectRecommend(0)
    }
  }

  isEditing.value = true
}

// ==================== 快捷记账 ====================

const clearQuickInput = () => {
  expressionInput.value = ''
  expressionResult.value = null
  inputText.value = ''
  quickCategoryId.value = null
}

const quickSave = async () => {
  const amount = expressionResult.value || parseFloat(expressionInput.value)
  
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入有效金额')
    return
  }
  
  expenseForm.amount = amount
  expenseForm.description = inputText.value
  expenseForm.category_id = quickCategoryId.value
  expenseForm.expense_date = formatDate(new Date())
  
  if (!expenseForm.category_id) {
    ElMessage.warning('请选择分类')
    return
  }
  
  await saveExpense()
}

// ==================== 语音和图片 ====================

const handleModeChange = () => {
  clearInput()
  recognizeResult.value = null
  recommendations.value = []
  isEditing.value = false
}

const clearInput = () => {
  inputText.value = ''
  previewImage.value = ''
  selectedFile.value = null
  clearTranscript()
}

const recognizeFromSpeech = async () => {
  if (!speechTranscript.value) {
    ElMessage.warning('请先进行语音输入')
    return
  }
  
  inputText.value = speechTranscript.value
  await recognizeText()
}

const recognizeText = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入消费信息')
    return
  }
  
  recognizing.value = true
  try {
    const res = await recognizeExpense(inputText.value)
    if (res.success) {
      recognizeResult.value = res.data
      fillFormFromResult(res.data)
      amountInput.value = res.data.amount?.toString() || ''
      
      if (res.data.amount) {
        await fetchClassifications(inputText.value, res.data.amount)
      }
    } else {
      ElMessage.error(res.message || 'AI识别失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'AI识别失败')
  } finally {
    recognizing.value = false
  }
}

const handleImageChange = (file: any) => {
  selectedFile.value = file.raw
  previewImage.value = URL.createObjectURL(file.raw)
}

const recognizeFromImage = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  
  recognizing.value = true
  try {
    const res = await recognizeImage(selectedFile.value)
    if (res.success) {
      recognizeResult.value = res.data.extracted_info
      fillFormFromResult(res.data.extracted_info)
      amountInput.value = res.data.extracted_info.amount?.toString() || ''
      
      if (res.data.extracted_info.amount) {
        await fetchClassifications(
          res.data.ocr_text || res.data.extracted_info.description || '',
          res.data.extracted_info.amount
        )
      }
    } else {
      ElMessage.error(res.message || '图片识别失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '图片识别失败')
  } finally {
    recognizing.value = false
  }
}

// ==================== 通用方法 ====================

const fetchClassifications = async (description: string, amount: number) => {
  try {
    const res = await api.post('/api/ai/classify', { description, amount })
    
    if (res.success && res.data.recommendations) {
      recommendations.value = res.data.recommendations
    }
  } catch (error) {
    console.error('获取分类推荐失败:', error)
  }
}

const fillFormFromResult = (result: RecognizeResult) => {
  expenseForm.amount = result.amount || 0

  if (result.date) {
    expenseForm.expense_date = result.date
  }

  if (result.time) {
    expenseForm.expense_time = result.time
  }

  expenseForm.description = result.description || ''

  if (result.members && result.members.length > 0) {
    const memberName = result.members[0]
    const member = memberStore.members.find(m =>
      m.name === memberName ||
      m.name.includes(memberName) ||
      memberName.includes(m.name)
    )
    if (member) {
      expenseForm.member_id = member.id
    }
  }

  // 匹配分类
  if (result.subcategory) {
    let category: Category | undefined

    // 1. 精确匹配：子分类名 + 父分类名
    if (result.category) {
      category = categoryStore.categories.find(c =>
        c.name === result.subcategory &&
        categoryStore.getCategoryById(c.parent_id || 0)?.name === result.category
      )
    }

    // 2. 精确匹配：子分类名（仅子分类）
    if (!category) {
      category = categoryStore.categories.find(c =>
        c.name === result.subcategory && c.parent_id !== null
      )
    }

    // 3. 模糊匹配：子分类名包含
    if (!category) {
      category = categoryStore.categories.find(c =>
        c.parent_id !== null &&
        (c.name.includes(result.subcategory!) || result.subcategory!.includes(c.name))
      )
    }

    if (category) {
      expenseForm.category_id = category.id
    }
  }
}

const selectRecommend = (index: number) => {
  selectedRecommendIndex.value = index
  const rec = recommendations.value[index]

  // 尝试多种匹配方式
  let category = categoryStore.categories.find(c =>
    c.name === rec.subcategory && c.parent_id !== null
  )

  // 精确匹配失败，尝试包含匹配
  if (!category) {
    category = categoryStore.categories.find(c =>
      c.name.includes(rec.subcategory) || rec.subcategory.includes(c.name)
    )
  }

  // 仍然失败，尝试父分类 + 子分类匹配
  if (!category && rec.category) {
    category = categoryStore.categories.find(c =>
      c.name === rec.subcategory &&
      categoryStore.getCategoryById(c.parent_id || 0)?.name === rec.category
    )
  }

  if (category) {
    expenseForm.category_id = category.id
  }
}

const saveExpense = async () => {
  // 从表达式计算金额
  if (amountInput.value && amountExpressionResult.value !== null) {
    expenseForm.amount = amountExpressionResult.value
  }

  if (!expenseForm.amount || expenseForm.amount <= 0) {
    ElMessage.warning('请输入金额')
    return
  }

  if (!expenseForm.expense_date) {
    ElMessage.warning('请选择日期')
    return
  }

  if (!expenseForm.category_id) {
    ElMessage.warning('请选择分类')
    return
  }

  saving.value = true
  try {
    const res = await api.post('/api/expense', expenseForm)

    if (res.success) {
      ElMessage.success('保存成功')
      // 清除持久化存储
      clearFormStorage()
      // 重置表单
      resetForm()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  expenseForm.amount = 0
  expenseForm.expense_date = formatDate(new Date())
  expenseForm.expense_time = null
  expenseForm.category_id = null
  expenseForm.member_id = null
  expenseForm.description = ''
  recognizeResult.value = null
  recommendations.value = []
  selectedRecommendIndex.value = null
  isEditing.value = false
  amountInput.value = ''
  amountExpressionResult.value = null
  clearInput()
}

const goToHistory = () => {
  router.push('/expense/history')
}

// ==================== Excel 模板和导入 ====================

// 下载 Excel 模板
const downloadTemplate = async () => {
  const XLSX = await import('xlsx').then(m => m.default || m)

  // 创建模板数据
  const templateData = [
    ['金额*', '日期*', '时间', '分类*', '成员', '备注'],
    [100, '2026-04-09', '12:30:00', '餐饮', '张三', '午饭'],
    [50.5, '2026-04-09', '', '交通', '', '打车'],
    ['', '', '', '', '', ''],
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(templateData)

  // 设置列宽
  ws['!cols'] = [
    { wch: 12 },  // 金额
    { wch: 15 },  // 日期
    { wch: 12 },  // 时间
    { wch: 15 },  // 分类
    { wch: 10 },  // 成员
    { wch: 30 },  // 备注
  ]

  XLSX.utils.book_append_sheet(wb, ws, '消费记录模板')

  // 下载文件
  XLSX.writeFile(wb, '消费记录导入模板.xlsx')
}

// 导入 Excel
const handleExcelImport = async (file: File) => {
  const XLSX = await import('xlsx').then(m => m.default || m)

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // 跳过标题行
    const rows = jsonData.slice(1).filter(row => row[0] !== undefined && row[0] !== '')

    if (rows.length === 0) {
      ElMessage.warning('Excel 文件中没有有效数据')
      return false
    }

    // 解析并导入数据
    const importResults: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel 行号（从2开始，1是标题）

      try {
        const amount = parseFloat(row[0])
        const date = String(row[1] || '')
        const time = row[2] ? String(row[2]) : null
        const categoryName = String(row[3] || '')
        const memberName = row[4] ? String(row[4]) : null
        const description = row[5] ? String(row[5]) : null

        // 验证必填字段
        if (isNaN(amount) || amount <= 0) {
          importResults.errors.push(`第${rowNum}行：金额无效`)
          importResults.failed++
          continue
        }
        if (!date) {
          importResults.errors.push(`第${rowNum}行：日期不能为空`)
          importResults.failed++
          continue
        }
        if (!categoryName) {
          importResults.errors.push(`第${rowNum}行：分类不能为空`)
          importResults.failed++
          continue
        }

        // 查找分类
        const category = categoryStore.categories.find(c => c.name === categoryName)
        if (!category) {
          importResults.errors.push(`第${rowNum}行：分类"${categoryName}"不存在`)
          importResults.failed++
          continue
        }

        // 查找成员
        let memberId: number | null = null
        if (memberName) {
          const member = memberStore.members.find(m => m.name === memberName)
          if (member) {
            memberId = member.id
          }
        }

        // 提交记录
        const res = await api.post('/api/expense', {
          amount,
          expense_date: date,
          expense_time: time,
          category_id: category.id,
          member_id: memberId,
          description,
        })

        if (res.success) {
          importResults.success++
        } else {
          importResults.errors.push(`第${rowNum}行：${res.message}`)
          importResults.failed++
        }
      } catch (e: any) {
        importResults.errors.push(`第${rowNum}行：${e.message || '处理失败'}`)
        importResults.failed++
      }
    }

    // 显示导入结果
    if (importResults.success > 0) {
      ElMessage.success(`导入成功 ${importResults.success} 条记录`)
    }
    if (importResults.failed > 0) {
      ElMessage.warning(`${importResults.failed} 条记录导入失败`)
      console.log('导入错误详情：', importResults.errors)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  }

  return false // 阻止 el-upload 的默认上传行为
}
</script>

<style lang="scss" scoped>
.expense-create-page {
  max-width: 800px;
  margin: 0 auto;
}

.input-mode-card {
  margin-bottom: $spacing-md;
  
  :deep(.el-card__body) {
    display: flex;
    justify-content: center;
  }
}

// 对话模式样式 - 左右布局
.chat-layout {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  .chat-left-panel {
    flex: 1;
    min-width: 400px;

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .chat-right-panel {
    width: 380px;
    flex-shrink: 0;

    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-edit-form {
      .result {
        color: $success-color;
        font-weight: 600;
      }
    }

    .ai-recommend {
      margin-bottom: $spacing-md;
      padding: $spacing-sm;
      background: $bg-input;
      border-radius: $border-radius;

      .label {
        display: block;
        margin-bottom: $spacing-sm;
        font-size: 12px;
        color: $text-secondary;
      }

      .recommend-list {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
      }

      .recommend-item {
        padding: $spacing-xs $spacing-sm;
        border: 2px solid $border-color;
        border-radius: $border-radius;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: $spacing-xs;

        &:hover {
          border-color: $neon-blue;
        }

        &.active {
          border-color: $neon-blue;
          background: rgba($neon-blue, 0.1);
        }

        .name {
          font-weight: 500;
        }

        .confidence {
          font-size: 12px;
          color: $text-secondary;
        }
      }
    }
  }
}

.chat-history {
  height: 400px;
  overflow-y: auto;
  padding: $spacing-md;
  background: $bg-input;
  border-radius: $border-radius;
  margin-bottom: $spacing-md;
}

.chat-welcome {
  text-align: center;
  padding: $spacing-xl;
  
  h3 {
    margin: $spacing-md 0;
    color: $text-primary;
  }
  
  p {
    color: $text-secondary;
    margin-bottom: $spacing-md;
  }
  
  .example-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    justify-content: center;
    
    .example-tag {
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

.chat-message {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  
  &.user {
    .message-content {
      background: $gradient-primary;
      color: white;
      border-radius: $border-radius $border-radius 0 $border-radius;
    }
  }
  
  &.assistant {
    .message-content {
      background: white;
      border-radius: $border-radius $border-radius $border-radius 0;
    }
    
    .ai-avatar {
      background: $success-color;
    }
  }
  
  &.thinking {
    .message-text {
      color: $text-secondary;
      
      .el-icon {
        margin-right: $spacing-sm;
      }
    }
  }
}

.message-content {
  max-width: 80%;
  padding: $spacing-md;
  box-shadow: $shadow-card;
  
  .message-text {
    line-height: 1.6;
  }
  
  .message-result {
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $border-color;
    
    .amount {
      color: $danger-color;
      font-weight: 600;
      font-size: 16px;
    }
    
    .result-actions {
      margin-top: $spacing-md;
      display: flex;
      gap: $spacing-sm;
    }
  }
}

.chat-input-area {
  .chat-input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-sm;
    
    .tip {
      font-size: 12px;
      color: $text-muted;
    }
  }
}

// 快捷记账样式
.quick-input-card,
.form-input-card {
  margin-bottom: $spacing-md;
  
  .expression-input {
    margin-bottom: $spacing-md;
    
    .currency {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }
    
    .result {
      color: $success-color;
      font-weight: 600;
    }
  }
  
  .quick-amounts {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    flex-wrap: wrap;
  }
  
  .description-input {
    margin-bottom: $spacing-md;
  }

  .quick-categories {
    margin-bottom: $spacing-lg;

    .label {
      display: block;
      margin-bottom: $spacing-sm;
      font-size: 12px;
      color: $text-secondary;
    }

    .category-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-xs;
    }

    .empty-tip {
      color: $text-muted;
      font-size: 12px;
    }
  }

  .input-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}

// 录入表单样式
.expense-form {
  .result {
    color: $success-color;
    font-weight: 600;
  }
}

// 语音和图片模式
.voice-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;
  
  p {
    margin-top: $spacing-md;
    color: $text-secondary;
  }
  
  .transcript {
    margin-top: $spacing-lg;
    padding: $spacing-md;
    background: $bg-input;
    border-radius: $border-radius;
    width: 100%;
    text-align: center;
  }
}

.image-preview {
  margin-top: $spacing-md;
  text-align: center;
  
  img {
    max-width: 100%;
    max-height: 300px;
    border-radius: $border-radius;
  }
  
  .el-button {
    margin-top: $spacing-md;
  }
}
</style>