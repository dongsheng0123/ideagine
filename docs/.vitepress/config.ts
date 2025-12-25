
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "IDEAGINE",
  description: "创意工具集",
  head: [
    // 浏览器标签页图标 (Favicon)
    ['link', { rel: 'icon', href: '/logo.jpeg' }],
    // Open Graph (社交媒体分享卡片)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'IDEAGINE - 创意工具集' }],
    ['meta', { property: 'og:description', content: '提供在线图片主题色提取等设计工具，帮助设计师快速获取配色灵感。' }],
    ['meta', { property: 'og:image', content: '/logo.jpeg' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'IDEAGINE - 创意工具集' }],
    ['meta', { name: 'twitter:description', content: '提供在线图片主题色提取等设计工具。' }],
    ['meta', { name: 'twitter:image', content: '/logo.jpeg' }],
  ],
  cleanUrls: true,
  appearance: true, // Dark mode enabled
  themeConfig: {
    logo: '/logo.jpeg',
    nav: [
      { text: '首页', link: '/' },
      { text: '主题色提取', link: '/color' }
    ],
    socialLinks: [],
    footer: {
      copyright: '想要的功能可联系笔者——刘东升，邮箱：1623523770@qq.com'
    }
  }
})
