<template>
  <router-view />
  <div class="locale-switcher">
    <span class="locale-label">{{ t('app.localeLabel') }}</span>
    <button
      class="locale-btn"
      :class="{ active: locale === 'ko' }"
      @click="setLocale('ko')"
    >
      {{ t('app.korean') }}
    </button>
    <button
      class="locale-btn"
      :class="{ active: locale === 'en' }"
      @click="setLocale('en')"
    >
      {{ t('app.english') }}
    </button>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useLocale } from './i18n'

const { locale, setLocale, t } = useLocale()

watch(
  locale,
  (value) => {
    document.documentElement.lang = value
    document.title = t('app.title')
  },
  { immediate: true }
)
</script>

<style>
/* 전역 스타일 재설정 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'JetBrains Mono', 'Space Grotesk', 'Noto Sans KR', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #000000;
  background-color: #ffffff;
}

.locale-switcher {
  position: fixed;
  top: 14px;
  right: 16px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.locale-label {
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  margin-right: 2px;
}

.locale-btn {
  border: 0;
  background: transparent;
  color: #6b7280;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.locale-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.locale-btn.active {
  background: #111827;
  color: #ffffff;
}

/* 스크롤바 스타일 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #000000;
}

::-webkit-scrollbar-thumb:hover {
  background: #333333;
}

/* 전역 버튼 스타일 */
button {
  font-family: inherit;
}
</style>
