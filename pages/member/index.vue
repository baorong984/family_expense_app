<template>
  <div class="member-page">
    <div class="page-header">
      <h2>成员管理</h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon> 添加成员
      </el-button>
    </div>
    
    <!-- 成员列表 -->
    <div class="member-grid">
      <el-card
        v-for="member in memberStore.members"
        :key="member.id"
        class="member-card"
      >
        <div class="avatar">
          <el-avatar :size="80" :src="member.avatar || undefined">
            {{ member.name.charAt(0) }}
          </el-avatar>
        </div>
        <div class="info">
          <h3>{{ member.name }}</h3>
          <p class="stats">
            消费记录: {{ member.expense_count || 0 }} 条
          </p>
        </div>
        <div class="actions">
          <el-button link type="primary" @click="openEditDialog(member)">
            编辑
          </el-button>
          <el-button link type="danger" @click="deleteMember(member)">
            删除
          </el-button>
        </div>
      </el-card>
      
      <!-- 添加成员卡片 -->
      <el-card class="member-card add-card" @click="openAddDialog">
        <div class="add-content">
          <el-icon :size="48"><Plus /></el-icon>
          <span>添加成员</span>
        </div>
      </el-card>
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑成员' : '添加成员'"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="memberForm" :rules="rules" label-width="80px">
        <el-form-item label="成员姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="请输入成员姓名" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="memberForm.password"
            type="password"
            placeholder="设置登录密码（至少6位，可选）"
            show-password
          />
        </el-form-item>
        <el-form-item label="头像">
          <el-input v-model="memberForm.avatar" placeholder="头像URL（可选）" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Member } from '~/types'

definePageMeta({
  middleware: ['auth'],
})

const userStore = useUserStore()

// 权限检查：只有管理员才能访问成员管理页面
onMounted(() => {
  if (!userStore.isAdmin) {
    ElMessage.error('只有管理员才能访问成员管理页面')
    navigateTo('/')
  }
})

const memberStore = useMemberStore()

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const memberForm = reactive({
  id: null as number | null,
  name: '',
  password: '',
  avatar: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入成员姓名', trigger: 'blur' },
    { max: 50, message: '成员姓名不能超过50个字符', trigger: 'blur' },
  ],
  password: [
    { min: 6, message: '密码不能少于6位', trigger: 'blur' },
  ],
}

// 初始化
onMounted(async () => {
  await memberStore.fetchMembers()
})

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  memberForm.id = null
  memberForm.name = ''
  memberForm.password = ''
  memberForm.avatar = ''
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (member: Member) => {
  isEdit.value = true
  memberForm.id = member.id
  memberForm.name = member.name
  memberForm.password = '' // 编辑时不显示密码
  memberForm.avatar = member.avatar || ''
  dialogVisible.value = true
}

const submitMember = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value && memberForm.id) {
      await memberStore.updateMember(memberForm.id, {
        name: memberForm.name,
        avatar: memberForm.avatar || undefined,
      })
    } else {
      await memberStore.createMember({
        name: memberForm.name,
        password: memberForm.password || undefined,
        avatar: memberForm.avatar || undefined,
      })
    }
    dialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    saving.value = false
  }
}

// 删除成员
const deleteMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm('确定要删除该成员吗？', '提示', {
      type: 'warning',
    })
    
    await memberStore.deleteMember(member.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.member-page {
  max-width: 1000px;
  margin: 0 auto;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.member-card {
  text-align: center;
  
  .avatar {
    margin-bottom: $spacing-md;
  }
  
  .info {
    h3 {
      font-size: 16px;
      margin-bottom: $spacing-xs;
      color: $text-primary;
    }
    
    .stats {
      font-size: 12px;
      color: $text-secondary;
    }
  }
  
  .actions {
    margin-top: $spacing-md;
  }
  
  &.add-card {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    transition: all 0.3s;
    
    &:hover {
      border-color: $primary;
      
      .add-content {
        color: $primary;
      }
    }
    
    .add-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: $text-muted;
      transition: color 0.3s;
      
      .el-icon {
        margin-bottom: $spacing-sm;
      }
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .member-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
