<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { processImage, type ColorResult } from '../utils/color-analysis'

// State (try to recover from sessionStorage)
const fileInput = ref<HTMLInputElement | null>(null)
const imageSrc = ref<string | null>(null)
const colorCount = ref(4)
const results = ref<ColorResult[] | null>(null)
const isProcessing = ref(false)
const imgElement = ref<HTMLImageElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)

// Persistence keys
const STORAGE_KEY_IMG = 'ideagine-color-tool-img'
const STORAGE_KEY_RESULTS = 'ideagine-color-tool-results'
const STORAGE_KEY_COUNT = 'ideagine-color-tool-count'

onMounted(() => {
  // Restore state
  const savedImg = sessionStorage.getItem(STORAGE_KEY_IMG)
  const savedResults = sessionStorage.getItem(STORAGE_KEY_RESULTS)
  const savedCount = sessionStorage.getItem(STORAGE_KEY_COUNT)

  if (savedImg) imageSrc.value = savedImg
  if (savedResults) results.value = JSON.parse(savedResults)
  if (savedCount) colorCount.value = parseInt(savedCount)
})

const saveState = () => {
  if (imageSrc.value) sessionStorage.setItem(STORAGE_KEY_IMG, imageSrc.value)
  else sessionStorage.removeItem(STORAGE_KEY_IMG)
  
  if (results.value) sessionStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results.value))
  else sessionStorage.removeItem(STORAGE_KEY_RESULTS)
  
  sessionStorage.setItem(STORAGE_KEY_COUNT, colorCount.value.toString())
}

const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  
  const file = files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target?.result as string
    results.value = null // Reset results on new image
    saveState()
  }
  reader.readAsDataURL(file)
}

const triggerUpload = () => {
  if (fileInput.value) {
    fileInput.value.value = '' // Reset to allow re-selecting same file
    fileInput.value.click()
  }
}

const clearImage = () => {
  imageSrc.value = null
  results.value = null
  if (fileInput.value) fileInput.value.value = ''
  saveState()
}

const extractColors = async () => {
  if (colorCount.value >= 8) {
    alert('建议主题色总数不超过8种')
    return
  }

  if (!imgElement.value || !canvasElement.value) return
  
  isProcessing.value = true
  saveState() // Save count before processing

  // Small delay to allow UI to update (render blocking CPU task)
  setTimeout(() => {
    try {
      results.value = processImage(imgElement.value!, canvasElement.value!, colorCount.value)
      saveState() // Save results
    } catch (e) {
      console.error(e)
    } finally {
      isProcessing.value = false
    }
  }, 50)
}
</script>

<template>
  <div class="color-tool">
    <!-- Hidden Input (Always present) -->
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      class="hidden-input"
      @change="handleFileChange"
    >

    <!-- Upload Area -->
    <div class="upload-area" v-if="!imageSrc" @click="triggerUpload">
      <div class="upload-content">
        <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="upload-text">点击上传图片</p>
        <p class="hint">支持 JPG, PNG, WebP</p>
      </div>
    </div>

    <!-- Image Preview & Controls -->
    <div v-else class="preview-section">
      <div class="thumbnail-container">
        <img 
          ref="imgElement" 
          :src="imageSrc" 
          alt="Preview" 
          class="thumbnail"
        >
        <button class="change-btn" @click="clearImage" title="关闭预览">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="controls">
        <div class="control-group">
          <label>颜色数量：</label>
          <input 
            type="number" 
            v-model="colorCount" 
            min="3" 
            max="12" 
            class="count-input"
          >
        </div>

        <button 
          class="vp-button primary extract-btn" 
          @click="extractColors"
          :disabled="isProcessing"
        >
          {{ isProcessing ? '正在分析...' : '提取主题色' }}
        </button>
      </div>
    </div>
    
    <!-- Hidden Canvas for processing -->
    <canvas ref="canvasElement" style="display: none;"></canvas>

    <!-- Results -->
    <div v-if="results" class="results-section">
      <div v-for="(color, index) in results" :key="index" class="color-card">
        <div class="color-swatch" :style="{ backgroundColor: color.hex }"></div>
        <div class="color-info">
          <div class="color-details-main">
             <div class="color-hex">{{ color.hex }}</div>
          </div>
          <div class="color-details-sub">
            <div class="color-rgb">rgb({{ Math.round(color.rgb.r) }}, {{ Math.round(color.rgb.g) }}, {{ Math.round(color.rgb.b) }})</div>
            <div class="color-perc">{{ color.percentage }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-tool {
  margin-top: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.upload-area {
  border: 2px dashed var(--vp-c-divider);
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  background-color: var(--vp-c-bg-alt);
  transition: all 0.2s;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.upload-icon {
  color: var(--vp-c-text-3);
  margin-bottom: 16px;
  display: inline-block;
}

.upload-text {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.hidden-input {
  display: none;
}

.hint {
  margin-top: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.vp-button {
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  cursor: pointer;
  border-radius: 20px;
  padding: 0 24px;
  height: 38px;
  line-height: 36px;
  font-size: 14px;
}

.vp-button.primary {
  background-color: var(--vp-c-brand-1);
  color: #fff;
}

.vp-button.primary:hover {
  background-color: var(--vp-c-brand-2);
}

.vp-button.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  padding: 24px;
}

.thumbnail {
  max-height: 220px;
  max-width: 100%;
  object-fit: contain;
  display: block;
  border-radius: 4px;
  box-shadow: var(--vp-shadow-2);
}

.change-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.change-btn:hover {
  background: rgba(0,0,0,0.8);
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.count-input {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  border-radius: 6px;
  padding: 6px 10px;
  width: 70px;
  text-align: center;
  font-family: inherit;
}

.extract-btn {
  min-width: 180px;
}

.results-section {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.color-card {
  display: flex;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  gap: 16px;
  transition: transform 0.2s;
}

.color-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
}

.color-swatch {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.color-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-details-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.color-details-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
}

.color-hex {
  font-family: var(--vp-font-family-mono);
  font-weight: bold;
  color: var(--vp-c-text-1);
  font-size: 16px;
}

.color-rgb {
  opacity: 0.8;
}

.color-perc {
  font-weight: 600;
}
</style>
