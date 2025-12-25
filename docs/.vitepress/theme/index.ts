
import { h, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ThemePicker from '../components/ThemePicker.vue'
import ColorTool from '../components/ColorTool.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(ThemePicker)
    })
  },
  enhanceApp({ app }) {
    app.component('ColorTool', ColorTool)
  },
  setup() {
    const route = useRoute()
    
    // Function to add captions
    const addCaptions = () => {
      document.querySelectorAll('.vp-doc img').forEach(img => {
        // Skip if already has caption or no alt text
        if (img.nextElementSibling?.classList.contains('img-caption') || !img.alt) return
        
        const caption = document.createElement('div')
        caption.className = 'img-caption'
        caption.textContent = img.alt
        img.insertAdjacentElement('afterend', caption)
      })
    }

    onMounted(() => {
      addCaptions()
    })

    watch(
      () => route.path,
      () => nextTick(addCaptions)
    )
  }
}
