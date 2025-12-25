<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const presetColors = [
  { name: '靛蓝', hex: '#6366f1' },
  { name: '天蓝', hex: '#3b82f6' },
  { name: '翡翠', hex: '#10b981' },
  { name: '玫瑰', hex: '#f43f5e' },
  { name: '橙黄', hex: '#f97316' }
]

const isOpen = ref(false)
const currentColor = ref('#6366f1')

const toggle = () => isOpen.value = !isOpen.value

// Helper to adjust brightness
const adjustBrightness = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}

const applyColor = (hex: string) => {
  currentColor.value = hex
  const root = document.documentElement
  root.style.setProperty('--vp-c-brand-1', hex)
  root.style.setProperty('--vp-c-brand-2', adjustBrightness(hex, -10)) // Darker
  root.style.setProperty('--vp-c-brand-3', adjustBrightness(hex, -20)) // Even darker
  localStorage.setItem('ideagine-theme-color', hex)
}

const onColorInput = (e: Event) => {
  const hex = (e.target as HTMLInputElement).value
  applyColor(hex)
}

onMounted(() => {
  const saved = localStorage.getItem('ideagine-theme-color')
  if (saved) {
    applyColor(saved)
  }
  
  window.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('.theme-picker')) {
      isOpen.value = false
    }
  })
})
</script>

<template>
  <div class="theme-picker">
    <button class="picker-btn" @click.stop="toggle" aria-label="选择主题色">
      <span class="color-preview" :style="{ backgroundColor: currentColor }"></span>
    </button>
    
    <div v-if="isOpen" class="picker-menu" @click.stop>
      <div class="picker-header">
        <span class="picker-title">主题色</span>
        <div class="current-hex">{{ currentColor }}</div>
      </div>
      
      <!-- Native Color Input Wrapper -->
      <div class="color-input-wrapper">
        <input 
          type="color" 
          :value="currentColor" 
          @input="onColorInput"
          class="native-color-input"
        >
      </div>

      <div class="divider"></div>

      <div class="palette-grid">
        <button 
          v-for="color in presetColors" 
          :key="color.name"
          class="color-option-grid"
          :class="{ active: currentColor === color.hex }"
          @click="applyColor(color.hex)"
          :title="color.name"
        >
          <span class="swatch-grid" :style="{ backgroundColor: color.hex }"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-picker {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.picker-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: transform 0.2s;
  border: none;
  background-color: transparent;
  cursor: pointer;
}

.picker-btn:hover {
  background-color: transparent;
  transform: scale(1.1);
}

.color-preview {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.picker-menu {
  position: absolute;
  top: 100%;
  right: -6px;
  margin-top: 12px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: var(--vp-shadow-3);
  padding: 16px;
  min-width: 200px;
  z-index: 100;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.current-hex {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.color-input-wrapper {
  width: 100%;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  position: relative;
}

.native-color-input {
  width: 150%; /* Make it larger to cover borders */
  height: 150%;
  padding: 0;
  margin: -10px; /* Offset to hide browser default borders */
  border: none;
  cursor: pointer;
  background: none;
}

.divider {
  height: 1px;
  background-color: var(--vp-c-divider);
  margin: 16px 0;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.color-option-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  background: transparent;
  padding: 0;
  transition: transform 0.2s, border-color 0.2s;
}

.color-option-grid:hover {
  transform: scale(1.1);
}

.color-option-grid.active {
  border-color: var(--vp-c-text-1);
}

.swatch-grid {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}
</style>
