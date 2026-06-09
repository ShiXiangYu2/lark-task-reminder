# Lark Task Reminder Agent - 规格文档

## 文档信息

| 字段 | 值 |
|------|-----|
| 项目名称 | lark-task-reminder |
| Mission ID | MISSION-001 |
| Slug | lark-task-reminder |
| 版本 | 1.0.0 |
| 创建日期 | 2026-06-09 |
| 契约版本 | 1.0 |

---

## 1. 项目概述

### 1.1 项目定位

**lark-task-reminder** 是一个飞书任务提醒 Agent，通过飞书平台自动获取、同步和管理任务，并根据截止时间和优先级智能提醒用户。

### 1.2 核心价值

- **自动化同步**：自动从飞书获取任务，减少手动操作
- **智能提醒**：基于截止时间和优先级自动提醒
- **风险预警**：提前识别可能超期的任务
- **灵活输出**：支持飞书消息和终端输出两种方式

### 1.3 目标用户

- 个人开发者/工作者
- 需要高效管理飞书任务的团队成员
- 希望自动化任务提醒的用户

---

## 2. 功能规格

### 2.1 核心功能

#### F1: 任务同步
- 从飞书获取当前用户的任务列表
- 支持增量同步（只获取更新的任务）
- 本地文件备份任务数据
- 定时刷新任务状态

#### F2: 智能排序
- 按截止时间排序（紧急优先）
- 支持重要性标签（P0/P1/P2）
- 区分未开始/进行中/已完成任务
- 超期任务置顶显示

#### F3: 定时提醒
- **截止前提醒**：任务截止前 N 小时提醒（可配置）
- **每日汇总**：每天定时发送任务汇总报告
- **超时提醒**：任务超期后持续提醒

#### F4: 飞书通知
- 发送飞书消息到个人/群组
- 支持富文本格式
- 可配置通知频道
- 限制通知频率避免骚扰

#### F5: 终端看板
- 在终端显示任务列表
-彩色输出区分状态
- 支持交互式操作
- 本地查询无需网络

#### F6: 风险预警
- 识别接近截止时间的任务
- 识别超期任务
-识别长时间无进展的任务
- 生成风险报告

---

### 2.2 用户故事

#### US1: 查看今日任务
**作为** 一个用户
**我想要** 查看今天需要完成的任务
**以便** 我可以合理安排工作时间

**验收标准**:
- [ ] 运行命令显示今天到期的任务
- [ ] 按优先级排序显示
- [ ] 超期任务单独标注

#### US2: 设置截止提醒
**作为** 一个用户
**我想要** 在任务截止前收到提醒
**以便** 我有足够时间完成

**验收标准**:
- [ ] 可以配置提前提醒时间（如 2 小时）
- [ ] 在飞书收到提醒消息
- [ ] 支持多个任务同时提醒

#### US3: 查看任务汇总
**作为** 一个用户
**我想要** 每天早上收到任务汇总
**以便** 我了解本周工作重点

**验收标准**:
- [ ] 每天定时发送汇总
- [ ] 包含本周所有待办
- [ ] 显示可能超期的任务

#### US4: 本地任务查询
**作为** 一个开发者
**我想要** 在终端快速查询任务
**以便** 不打开飞书也能查看

**验收标准**:
- [ ] 支持按状态筛选
- [ ] 支持按截止日期筛选
- [ ] 支持按关键词搜索

---

### 2.3 数据模型

#### Task 任务
```typescript
interface Task {
  id: string; // 飞书任务ID
  title: string;                 // 任务标题
  description?: string;          // 任务描述
  due: {
    timestamp: string;          // 截止时间戳
    is_all_day: boolean;         // 是否全天
  };
  completion: {
    is_completed: boolean;      // 是否完成
    completed_at?: string;       // 完成时间
  };
  creator: {
    id: string;
    name: string;
  };
  member: {
    id: string;
    name: string;
  };
  origin: {
    platform_i18n_name: string; // 来源平台
  };
  summary?: string;              // AI生成的摘要
  priority?: 'P0' | 'P1' | 'P2'; // 优先级
  tags?: string[];              // 标签
  created_at: string;           // 创建时间
  updated_at: string;          // 更新时间
}
```

#### Reminder 提醒配置
```typescript
interface ReminderConfig {
  enabled: boolean;              // 是否启用
  beforeHours: number;          // 提前小时数
  repeatInterval: number;       // 重复间隔（分钟）
  maxPerDay: number;            // 每日最大提醒数
}
```

#### Report汇总报告
```typescript
interface DailyReport {
  date: string;                  // 报告日期
  totalTasks: number;           // 总任务数
  completedTasks: number;       // 已完成数
  overdueTasks: number;         // 超期任务数
  upcomingTasks: Task[];        // 即将到期任务
  riskTasks: Task[];            // 风险任务
  summary: string;              // AI生成的总结
}
```

---

### 2.4 命令行接口

#### 主命令
```bash
lark-task-reminder [command] [options]
```

#### 子命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `list` | 列出任务 | `lark-task-reminder list --status pending` |
| `today` | 今日任务 | `lark-task-reminder today` |
| `sync` | 同步任务 | `lark-task-reminder sync` |
| `report` | 生成报告 | `lark-task-reminder report --type daily` |
| `notify` | 发送提醒 | `lark-task-reminder notify --urgent` |
| `config` | 配置管理 | `lark-task-reminder config set reminder.beforeHours 2` |

#### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--status` | 任务状态 (pending/completed/all) | pending |
| `--limit` | 显示数量限制 | 10 |
| `--format` | 输出格式 (table/json/markdown) | table |
| `--date` | 指定日期 | 今天 |

---

### 2.5 配置项

#### config.json
```json
{
  "lark": {
    "app_id": "${LARK_APP_ID}",
    "app_secret": "${LARK_APP_SECRET}"
  },
  "reminder": {
    "enabled": true,
    "beforeHours": 2,
    "repeatInterval": 60,
    "maxPerDay": 10
  },
  "notify": {
    "channel": "direct",
    "userId": "",
    "groupId": ""
  },
  "schedule": {
    "dailyReport": "09:00",
    "checkInterval": 30
  },
  "storage": {
    "dataDir": "./data",
    "backupEnabled": true
  }
}
```

---

### 2.6 输出示例

#### 终端任务列表
```
📋 今日任务 (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 [P0] 完成项目文档 - 截止14:00 (1小时后)
🟡 [P1] 代码审查 - 截止 18:00
🟢 [P2] 更新 README - 截止 20:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  超期任务 (1)
🔴 [P0] 修复 Bug - 超期 2 天
```

#### 飞书消息格式
```
📊 任务提醒 - 14:00

⏰ 即将到期 (2)
• 完成项目文档 - 14:00
• 提交周报 - 18:00

⚠️  超期任务 (1)
• 修复 Bug - 超期 2 天

💡 建议：优先处理 "完成项目文档"
```

---

## 3. 技术规格

### 3.1 技术栈

| 组件 | 技术 | 版本要求 |
|------|------|----------|
| 运行时 | Node.js | 18+ |
| 语言 | TypeScript | 5.x |
| 飞书 SDK | @larksuiteoapi/node-sdk | latest |
| 测试框架 | Vitest | 1.x |
| CLI框架 | Commander.js | 12.x |
| 配置管理 | dotenv | 16.x |
| 日志 | pino | 8.x |

### 3.2 项目结构

```
lark-task-reminder/
├── src/
│   ├── index.ts                 # 入口文件
│   ├── cli/
│   │   ├── commands/           # 子命令
│   │   ├── options.ts # 选项定义
│   │   └── formatter.ts        # 输出格式化
│   ├── core/
│   │   ├── task-sync.ts       # 任务同步
│   │   ├── task-sort.ts        # 任务排序
│   │   ├── task-filter.ts      # 任务过滤
│   │   └── risk-detector.ts    # 风险检测
│   ├── services/
│   │   ├── lark-api.ts         # 飞书 API
│   │   ├── storage.ts          # 本地存储
│   │   ├── notifier.ts         # 通知服务
│   │   └── scheduler.ts # 定时任务
│   ├── types/
│   │   └── index.ts            # 类型定义
│   └── utils/
│       ├── logger.ts           # 日志工具
│       └── config.ts            # 配置管理
├── tests/
│   ├── unit/ # 单元测试
│   └── integration/ # 集成测试
├── config/
│   └── config.example.json     # 配置示例
├── data/ # 本地数据存储
├── SPEC.md                     # 本文档
├── package.json
└── tsconfig.json
```

### 3.3 依赖关系

```
用户输入 (CLI)
    ↓
Command Parser (Commander.js)
    ↓
Command Handler
    ↓
┌─────────────────────────────────────┐
│           Core Services              │
│  ┌───────────┐  ┌───────────┐        │
│  │ Task Sync │  │Task Sort │         │
│  └─────┬─────┘  └─────┬─────┘        │
│┌─────┴─────┐  ┌─────┴─────┐        │
│  │Risk Detect│  │Task Filter│        │
│└─────┬─────┘└─────┬─────┘        │
│ ┌─────┴─────────────┴─────┐        │
│  │      Notifier           │        │
│  └─────┬───────────────────┘        │
│┌─────┴─────┐ ┌───────────┐        │
│  │ Lark API  │  │ Storage  │         │
│  └───────────┘  └───────────┘        │
└─────────────────────────────────────┘
```

---

## 4. 验收标准

### 4.1 功能验收

| ID | 功能 | 验收条件 | 优先级 |
|----|------|----------|--------|
| AC-01 | 任务同步 | 成功从飞书获取任务列表 | P0 |
| AC-02 | 本地存储 | 任务数据正确保存到本地文件 | P0 |
| AC-03 | 列表显示 | 终端正确显示任务列表 | P0 |
| AC-04 | 智能排序 | 按截止时间和优先级正确排序 | P0 |
| AC-05 | 截止提醒 | 在截止前 N 小时发送提醒 | P1 |
| AC-06 | 飞书通知 | 成功发送飞书消息 | P1 |
| AC-07 | 风险检测 | 正确识别超期和风险任务 | P1 |
| AC-08 | 每日汇总 | 定时生成并发送汇总报告 | P2 |

### 4.2 非功能验收

| ID | 指标 | 目标值 | 优先级 |
|----|------|--------|--------|
| NF-01 | 响应时间 | CLI 命令 < 2 秒 | P1 |
| NF-02 | 测试覆盖率 | >= 80% | P1 |
| NF-03 | 错误处理 | 所有错误有明确提示 | P1 |
| NF-04 | 配置灵活性 | 所有参数可配置 | P2 |

### 4.3 边界情况

| 场景 | 预期行为 |
|------|----------|
| 无网络 | 使用本地缓存数据，提示离线模式 |
| 无任务 | 显示"暂无任务"提示 |
| 飞书 API限流 | 指数退避重试，最多重试 3 次 |
| 大量任务 (>1000) | 分页获取，支持增量同步 |
| 配置缺失 | 使用默认配置，提示用户配置 |

---

## 5. 限制与约束

### 5.1 功能限制
- 需要有效的飞书应用凭证
- 仅支持飞书企业版用户
- 不支持批量创建/修改任务（仅读取）

### 5.2 环境要求
- Node.js 18+
- 有效的飞书 App ID 和 App Secret
- 网络连接（除离线模式）

### 5.3 安全要求
- 凭证不得硬编码，必须使用环境变量
- 本地数据文件需要适当的访问控制
- 敏感信息不得输出到日志

---

## 6. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2026-06-09 | 初始版本 | Claude |

---

## 7. 附录

### 7.1 飞书任务 API 参考
- 获取任务列表: `POST /open-apis/task/v2/tasks/query`
- 获取任务详情: `GET /open-apis/task/v2/tasks/{task_id}`
- 获取子任务: `GET /open-apis/task/v2/tasks/{task_id}/subtasks`

### 7.2 状态码定义
- `pending`: 待办
- `completed`: 已完成
- `cancelled`: 已取消

### 7.3 优先级定义
- `P0`: 紧急重要
- `P1`: 重要
- `P2`: 一般