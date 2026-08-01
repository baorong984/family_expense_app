<template>
  <div class="emoji-picker">
    <el-input
      v-model="searchKeyword"
      placeholder="搜索emoji..."
      clearable
      class="search-input"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <div class="selected-emoji" v-if="modelValue">
      <span class="emoji-preview">{{ modelValue }}</span>
      <el-button text type="danger" size="small" @click="clearEmoji"
        >清除</el-button
      >
    </div>

    <div class="category-tabs">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="category-tab"
        :class="{ active: activeCategory === category.name }"
        @click="activeCategory = category.name"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span class="category-name">{{ category.name }}</span>
      </div>
    </div>

    <div class="emoji-grid">
      <div
        v-for="emoji in currentEmojis"
        :key="emoji.emoji"
        class="emoji-item"
        :title="emoji.name"
        @click="selectEmoji(emoji.emoji)"
      >
        {{ emoji.emoji }}
      </div>
    </div>

    <div v-if="currentEmojis.length === 0" class="no-result">
      <el-empty description="没有找到匹配的emoji" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import { EMOJI_LIBRARY, search_emoji, type EmojiItem } from "~/utils/emoji";

interface Props {
  modelValue: string | null;
}

interface Emits {
  (e: "update:modelValue", value: string | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchKeyword = ref("");
const activeCategory = ref(EMOJI_LIBRARY[0].name);

/**
 * 根据搜索关键词过滤分类
 */
const filteredCategories = computed(() => {
  if (!searchKeyword.value) {
    return EMOJI_LIBRARY;
  }
  return EMOJI_LIBRARY.filter((category) => {
    return category.emojis.some(
      (emoji) =>
        emoji.name.includes(searchKeyword.value) ||
        emoji.keywords.some((k) =>
          k.toLowerCase().includes(searchKeyword.value.toLowerCase()),
        ),
    );
  });
});

/**
 * 当前显示的emoji列表
 */
const currentEmojis = computed((): EmojiItem[] => {
  if (searchKeyword.value) {
    return search_emoji(searchKeyword.value);
  }

  const category = EMOJI_LIBRARY.find(
    (cat) => cat.name === activeCategory.value,
  );
  return category ? category.emojis : [];
});

/**
 * 选择emoji
 */
const selectEmoji = (emoji: string) => {
  emit("update:modelValue", emoji);
};

/**
 * 清除emoji
 */
const clearEmoji = () => {
  emit("update:modelValue", null);
};
</script>

<style scoped lang="scss">
.emoji-picker {
  .search-input {
    margin-bottom: 12px;
  }

  .selected-emoji {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 12px;

    .emoji-preview {
      font-size: 36px;
      line-height: 1;
    }
  }

  .category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
    max-height: 150px;
    overflow-y: auto;

    .category-tab {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      background: #f5f7fa;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 12px;

      &:hover {
        background: #e4e7ed;
      }

      &.active {
        background: $primary;
        color: white;
      }

      .category-icon {
        font-size: 14px;
      }

      .category-name {
        white-space: nowrap;
      }
    }
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    gap: 6px;
    max-height: 250px;
    overflow-y: auto;
    padding: 8px;
    background: #fafafa;
    border-radius: 6px;

    .emoji-item {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      cursor: pointer;
      padding: 6px;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #e4e7ed;
        transform: scale(1.1);
      }
    }
  }

  .no-result {
    padding: 15px;
    text-align: center;
  }
}
</style>
