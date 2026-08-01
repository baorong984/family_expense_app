<template>
  <div class="mobile-nav">
    <div
      v-for="item in navItems"
      :key="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      @click="navigateTo(item.path)"
    >
      <el-icon :size="22">
        <component :is="item.icon" />
      </el-icon>
      <span class="label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Edit,
  List,
  DataAnalysis,
  Present,
  Wallet,
  User,
  Van,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const navItems = computed(() => {
  const items = [
    { path: "/expense/create", icon: Edit, label: "记账" },
    { path: "/expense/history", icon: List, label: "记录" },
    { path: "/gift", icon: Present, label: "人情" },
    { path: "/vehicle/fuel", icon: Van, label: "车辆" },
    { path: "/statistics", icon: DataAnalysis, label: "统计" },
  ];

  if (userStore.isAdmin) {
    items.push({ path: "/budget", icon: Wallet, label: "预算" });
    items.push({ path: "/member", icon: User, label: "成员" });
  }

  return items;
});

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + "/");
};

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style lang="scss" scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: $bottom-nav-height;
  background: var(--ac-bg-bar, #FAF8ED);
  border-top: 3px solid var(--ac-border, #E8DFCC);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: $safe-area-inset-bottom;
  z-index: $z-fixed;
  box-shadow: 0 -4px 0 var(--ac-shadow);
  transition: background $transition-base, border-color $transition-base;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  cursor: pointer;
  transition: all $transition-fast;
  border-radius: 16px;
  min-width: 56px;

  .el-icon {
    color: var(--ac-text-secondary, #7B5E43);
    transition: transform $transition-fast, color $transition-fast;
  }

  .label {
    font-size: 11px;
    font-family: $font-display;
    font-weight: 700;
    margin-top: 2px;
    color: var(--ac-text-secondary, #7B5E43);
    transition: color $transition-fast;
  }

  &.active {
    background: #59C990;
    border: 2px solid #3B9264;
    box-shadow: 0 3px 0 #3B9264;
    transform: translateY(-2px);

    .el-icon {
      color: #FFFFFF;
    }

    .label {
      color: #FFFFFF;
      font-weight: 800;
    }
  }

  &:active {
    transform: translateY(2px);
  }
}
</style>
