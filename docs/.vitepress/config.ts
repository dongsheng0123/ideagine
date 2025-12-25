
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "IDEAGINE",
  description: "创意工具集",
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
