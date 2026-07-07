# 🏫 叛逆校园 - 8090班级互动小游戏

## 📖 部署与使用教程

---

## 一、本地运行（5分钟）

### 1. 环境要求
- **Node.js** >= 18.0（推荐 20+）
- **npm** 或 **pnpm**

### 2. 启动步骤

```bash
# 进入项目目录
cd school-rebellion-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 即可开始玩！

### 3. 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接部署到任何静态服务器。

---

## 二、免费H5部署（Vercel / Cloudflare Pages）

### 方案A：Vercel（推荐，最简单）

1. 将项目推送到 GitHub 仓库
2. 打开 [vercel.com](https://vercel.com) 注册/登录
3. 点击 **New Project** → 导入你的 GitHub 仓库
4. 框架自动识别 Vite，无需修改配置
5. 点击 **Deploy**，1分钟后获得公开网址

```
免费额度：无限站点、100GB带宽/月
```

### 方案B：Cloudflare Pages

1. 将项目推送到 GitHub
2. 打开 [pages.cloudflare.com](https://pages.cloudflare.com)
3. 连接 GitHub → 选择仓库
4. 构建命令：`npm run build`
5. 构建输出目录：`dist`
6. 点击部署

```
免费额度：无限站点、无限带宽
```

---

## 三、微信小程序部署

### 前置准备
- 注册微信小程序账号（个人：30元/年认证费）
- 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 步骤

> ⚠️ 注意：当前版本为纯H5版本。微信小程序版本需要使用 uni-app 或 Taro 框架进行适配编译。
> 如需小程序版本，请告知，我可以使用 uni-app 重构项目以支持小程序端。

**小程序适配方案（后续迭代）：**
1. 使用 uni-app CLI 初始化项目
2. 将现有 Vue 组件迁移到 uni-app pages 目录
3. 替换 `localStorage` 为 `uni.storage`
4. 使用微信开发者工具导入编译后的 `dist/dev/mp-weixin` 目录
5. 开通微信云开发（免费额度 5GB 存储 + 2GB 数据库）
6. 上传代码 → 提交审核 → 1-3天通过

---

## 四、功能验证清单

| 序号 | 验证项 | 预期结果 |
|------|--------|----------|
| 1 | 打开首页 | 显示"叛逆校园"标题，复古黑板风格 |
| 2 | 输入名字进入 | 自动生成40名AI同学、班级、课表 |
| 3 | 教室页面 | 显示黑板、讲台、5×8课桌椅布局 |
| 4 | 课表页面 | 显示12节课的完整课表，当前时段高亮 |
| 5 | 课堂答题 | 点击答题→显示题目→选择答案→显示结果 |
| 6 | 答题积分 | 答对加分，连续答对触发连击 |
| 7 | 班级群聊 | 课间可聊天，AI自动回复 |
| 8 | 上课禁言 | 上课状态时输入框禁用 |
| 9 | 排行榜 | 学霸榜TOP10，摸鱼榜 |
| 10 | 个人中心 | 显示积分、排名、设置项 |
| 11 | 数据持久化 | 刷新页面数据不丢失 |
| 12 | 无报错 | 所有页面无白屏、无报错 |

---

## 五、项目结构

```
school-rebellion-game/
├── index.html              # 入口HTML
├── package.json            # 依赖配置
├── vite.config.js          # Vite配置
├── public/                 # 静态资源
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件
│   ├── router.js           # 路由配置
│   ├── styles/
│   │   └── global.css      # 全局样式（复古黑板风格）
│   ├── store/
│   │   └── game.js         # Pinia状态管理（核心逻辑）
│   ├── data/
│   │   └── gameData.js     # 游戏数据（学生/老师/题库/课表）
│   ├── utils/
│   │   └── sound.js        # Web Audio音效系统
│   └── pages/
│       ├── Home.vue        # 首页（新生报到/快捷入口）
│       ├── Classroom.vue   # 教室主场景
│       ├── Schedule.vue    # 今日课表
│       ├── Quiz.vue        # 课堂答题游戏
│       ├── Chat.vue        # 班级群聊
│       ├── Ranking.vue     # 排行榜（学霸榜/摸鱼榜）
│       └── Profile.vue     # 个人中心
└── dist/                   # 构建输出
```

---

## 六、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4+ | 前端框架 |
| Vite | 5.4+ | 构建工具 |
| Pinia | 2.1+ | 状态管理 |
| Vue Router | 4.3+ | 路由 |
| Web Audio API | 原生 | 音效合成 |
| localStorage | 原生 | 数据持久化 |

---

## 七、常见问题

**Q: 刷新后数据丢失？**
A: 数据存储在浏览器 localStorage 中，24小时内有效。请勿使用无痕模式。

**Q: 如何重新开始？**
A: 个人中心 → 重置游戏，或首页点击"重新开始"。

**Q: AI同学不发言？**
A: AI发言是概率触发的，每8秒有40%概率随机发言。上课期间AI也不会发言。

**Q: 如何添加更多题目？**
A: 编辑 `src/data/gameData.js` 中的 `QUESTION_BANK` 数组。

---

## 八、后续扩展建议

1. **小程序适配** - 使用 uni-app 重构实现微信小程序端
2. **云同步** - 接入微信云开发/LeanCloud 实现跨设备数据同步
3. **多班级** - 支持创建/加入不同班级
4. **真人联机** - WebSocket 实现多人在线实时互动
5. **更多题型** - 填空题、判断题、限时抢答
6. **装扮系统** - 校服、文具、桌面装饰
7. **班级活动** - 运动会、文艺汇演、考试周事件
