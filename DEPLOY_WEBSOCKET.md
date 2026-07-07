# WebSocket 多人联机部署指南

## 架构说明

- **前端**: Vue 3 SPA，通过 `src/services/websocket.js` 连接 WebSocket 服务
- **后端**: Node.js WebSocket 服务，位于 `cloudfunctions/websocket-server/`
- **部署平台**: 腾讯云 CloudBase（云函数 + 静态托管）

## 快速部署

### 1. 部署 WebSocket 云函数

在 CloudBase 控制台 → 云函数 → 新建云函数：

- **函数名称**: `websocket-server`
- **运行环境**: Node.js 18.15
- **超时时间**: 60 秒
- **代码**: 上传 `cloudfunctions/websocket-server/` 目录

或在项目根目录执行：
```bash
tcb fn deploy websocket-server --envId yangliuqing-d5grq63943e36590b
```

### 2. 配置 WebSocket 地址

云函数部署后会生成一个访问地址，格式为：
```
wss://<env-id>.run.tcloudbase.com
```

在 CloudBase 控制台 → 静态网站托管 → 部署时设置环境变量：
```
VITE_WS_URL=wss://yangliuqing-d5grq63943e36590b.run.tcloudbase.com
```

### 3. 重新构建前端

```bash
VITE_WS_URL=wss://yangliuqing-d5grq63943e36590b.run.tcloudbase.com npm run build
```

### 4. 部署静态文件

将 `dist/` 目录上传到 CloudBase 静态托管。

## 本地开发

```bash
# 启动 WebSocket 服务
cd cloudfunctions/websocket-server
npm install
node index.js

# 启动前端（另一个终端）
npm run dev
```

本地开发时 WebSocket 连接地址默认为 `wss://localhost:9000`（HTTPS 需配置本地证书）或使用 `ws://localhost:9000`。

## 配置说明

- `vite.config.js` 中 `VITE_WS_URL` 环境变量控制 WebSocket 连接地址
- 云函数默认监听 9000 端口
- 最大房间数无限制（内存存储，自动清理）
- 每个房间最多 8 名玩家 + 40 个 AI 学生
- 空房间 5 分钟后自动销毁
