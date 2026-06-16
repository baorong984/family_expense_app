import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.family.expense',
  appName: 'family-expense-app',
  webDir: '.output/public',
  // 生产环境从服务器加载页面，所有 API 请求自动同源，无跨域问题
  server: {
    url: 'http://139.196.175.70:3000',
    cleartext: true,
  },
};

export default config;
