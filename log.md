# 项目更新日志

## v1.2.0 - Android App 生产环境部署（2026-06-16）

### 新增功能
- 支持 Android App 端生产环境部署，通过 Capacitor Server 模式加载远程页面
- Web 端和 App 端共享同一套服务端 API，统一访问入口

### 修复问题
- **Sass 弃用警告**：将 `darken()` 替换为 `color.adjust()`，消除 Dart Sass 3.0 兼容性警告
  - 涉及文件：`assets/styles/global.scss`
  - 添加 `@use 'sass:color'` 导入
  - 替换 3 处 `darken($success/danger/warning, 10%)` 为 `color.adjust(..., $lightness: -10%)`

- **Android HTTP 明文流量限制**：Android 9+ 默认禁止非 HTTPS 请求导致 App 登录失败
  - 涉及文件：`android/app/src/main/AndroidManifest.xml`
  - 添加 `android:usesCleartextTraffic="true"`
  - 添加 `android:networkSecurityConfig="@xml/network_security_config"`
  - 新建：`android/app/src/main/res/xml/network_security_config.xml`

- **App 跨域请求失败**：Capacitor SSG 模式下 WebView fetch 跨域被拦截
  - **根本解决方案**：改用 Capacitor Server 模式（`server.url`），App 直接从服务器加载页面，所有 API 请求自动同源
  - 涉及文件：
    - `capacitor.config.ts` — 添加 `server: { url, cleartext }` 配置
    - `composables/useApi.ts` — 从 `$fetch` 改为原生 `fetch`，支持同源检测自动切换相对路径
    - `server/middleware/cors.ts` — 移除与 credentials 冲突的配置，添加生产域名白名单

- **API 地址端口缺失**：`.env.production` 中 `NUXT_PUBLIC_API_BASE_URL` 缺少端口号
  - 修改前：`http://your_server_ip`
  - 修改后：`http://your_server_ip:3000`

### 构建流程变更

**之前**（SSG 本地模式）：
```bash
npm run build:prod    # 构建 Nitro 服务端（不生成 index.html）
npx cap sync android   # 失败！缺少 index.html
```

**现在**（Server 远程模式）：
```bash
npm run generate:prod   # 生成静态文件（含 index.html）
npx cap sync android     # 同步到 Android 项目
cd android && ./gradlew assembleDebug  # 构建 APK
```

> 注意：Server 模式下 App 不再使用本地静态文件，而是直接从 `http://your_server_ip:3000` 加载页面。

### 部署要求
- 云服务器安全组需开放 **TCP 3000** 端口
- 服务器上运行 Nuxt 服务（推荐 PM2）：`pm2 start .output/server/index.mjs --name family-expense`
- MySQL 数据库已初始化，包含默认 admin 用户

---

## v1.1.0 - 成员专属色功能（2026-04-13）

详见 [database/README.md](./database/README.md)
