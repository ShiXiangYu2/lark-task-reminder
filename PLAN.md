# Lark Task Reminder - 技术方案

## 文档信息

| 字段 | 值 |
|------|-----|
| 项目名称 | lark-task-reminder |
| Mission ID | MISSION-001 |
| 版本 | 1.0.0 |
| 创建日期 | 2026-06-09 |
| 基于规格 | SPEC.md v1.0.0 |

---

## 1. 架构设计

### 1.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Lark Task Reminder                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ CLI      │  Commander.js 命令行解析 │
│  │ Interface │  • 子命令: list, today, sync, report │
│  └──────┬───────┘  • 选项解析 │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Command Handlers                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │   List   │ │ Today   │ │   Sync   │ │  Report  │     │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │ │
│  └───────┼────────────┼────────────┼────────────┼────────────┘ │
│ │            │            │            │                 │
│          ▼            ▼            ▼            ▼                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Core Services                          │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │ Task Sort │  │ Risk Detect  │  │ Task Filter │      │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │ │
│  │         │                 │                 │               │ │
│  │         └─────────────────┼─────────────────┘               │ │
│  │                           │                                  │ │
│  │        ┌─────────────────┼─────────────────┐ │ │
│  │         │                 ▼                 │                │ │
│  │         │     ┌──────────────────┐        │                │ │
│  │         │     │  Task Aggregator │        │                │ │
│  │         │     └────────┬─────────┘        │                │ │
│  │         │              │                   │                │ │
│  │ ┌──────┴───────────────┴───────────────────┴──────────┐    │ │
│  │  │                    Task Store │    │ │
│  │  │ (内存缓存 + 本地文件持久化)                       │    │ │
│  │  └────────────────────────────────────────────────────┘    │ │
│  │                           │                                  │ │
│  └───────────────────────────┼──────────────────────────────────┘ │
│                              │                                   │
│        ┌────────────────────┼────────────────────┐              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Lark API    │    │  Notifier    │    │  Scheduler    │     │
│  │ Service    │    │   Service    │    │   Service     │     │
│  └──────┬───────┘    └──────┬───────┘   └──────┬───────┘     │
│         │                   │                   │              │
└─────────┼───────────────────┼───────────────────┼──────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
   ┌───────────┐     ┌───────────┐      ┌───────────┐
    │  飞书 API  │      │  飞书消息  │      │ 定时任务  │
    └───────────┘      └───────────┘      └───────────┘
```

### 1.2 模块职责

| 模块 | 职责 | 关键接口 |
|------|------|----------|
| **CLI Interface** | 命令行解析和帮助信息 | `parseArgs()`, `showHelp()` |
| **Command Handlers** | 处理各子命令逻辑 | `handleList()`, `handleToday()`, `handleSync()` |
| **Task Sort** | 任务排序算法 | `sortTasks(tasks, options)` |
| **Risk Detect** | 风险任务识别 | `detectRisks(tasks)` |
| **Task Filter** | 任务过滤条件 | `filterTasks(tasks, criteria)` |
| **Task Store** | 任务数据管理 | `getTasks()`, `saveTasks()`, `syncTasks()` |
| **Lark API** | 飞书 API 封装 | `fetchTasks()`, `sendMessage()` |
| **Notifier** | 通知发送 | `sendReminder()`, `sendReport()` |
| **Scheduler** | 定时任务管理 | `scheduleReminder()`, `scheduleReport()` |

---

## 2.核心算法

### 2.1 任务排序算法

```typescript
function sortTasks(tasks: Task[], options: SortOptions): Task[] {
  return tasks.sort((a, b) => {
    // 1. 超期任务优先
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;

    // 2. 按优先级 (P0 > P1 > P2)
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2 };
    const pa = priorityOrder[a.priority || 'P2'];
    const pb = priorityOrder[b.priority || 'P2'];
    if (pa !== pb) return pa - pb;

    // 3. 按截止时间
    return a.due.timestamp - b.due.timestamp;
  });
}
```

### 2.2 风险检测算法

```typescript
function detectRisks(tasks: Task[]): RiskReport {
  const now = Date.now();
  const hourMs = 3600000;

  return {
    overdue: tasks.filter(t => t.due.timestamp < now && !t.completion.is_completed),
    urgent: tasks.filter(t => {
      const timeLeft = t.due.timestamp - now;
      return timeLeft > 0 && timeLeft <= 2 * hourMs;
    }),
    atRisk: tasks.filter(t => {
      const timeLeft = t.due.timestamp - now;
      const totalTime = t.created_at - t.due.timestamp;
      return timeLeft > 0 && timeLeft <= totalTime * 0.2; // 剩余时间 < 20%
    })
  };
}
```

---

## 3. API 设计

### 3.1 内部 API

#### TaskStore
```typescript
interface TaskStore {
  // 获取任务
  getTasks(): Promise<Task[]>;

  // 获取单个任务
  getTask(id: string): Promise<Task | null>;

  // 保存任务
  saveTasks(tasks: Task[]): Promise<void>;

  // 增量同步
  syncTasks(): Promise<SyncResult>;
}
```

#### LarkService
```typescript
interface LarkService {
  // 获取任务列表
  fetchTasks(options: QueryOptions): Promise<Task[]>;

  // 获取任务详情
  fetchTaskDetail(taskId: string): Promise<Task>;

  // 发送消息
  sendMessage(content: MessageContent): Promise<void>;

  // 发送卡片消息
  sendCardMessage(card: CardContent): Promise<void>;
}
```

### 3.2 外部 API (飞书)

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/open-apis/task/v2/tasks/query` | 查询任务列表 |
| GET | `/open-apis/task/v2/tasks/{task_id}` | 获取任务详情 |
| POST | `/open-apis/im/v1/messages` | 发送消息 |

---

## 4. 数据流设计

### 4.1 同步流程

```
┌──────────────────────────────────────────────────────────────┐
│ 任务同步流程                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Scheduler 触发同步 │
│           │                                                   │
│           ▼                                                   │
│  2. TaskStore.syncTasks()                                     │
│           │                                                   │
│           ▼                                                   │
│  3. LarkService.fetchTasks()                                  │
│           │                                                   │
│           ▼                                                   │
│  4. 对比本地缓存 (diff)                                        │
│           │                                                   │
│           ▼                                                   │
│  5.增量更新到内存和本地文件                                    │
│           │                                                   │
│           ▼                                                   │
│  6. 触发风险检测                                               │
│           │                                                   │
│           ▼                                                   │
│  7. 如有风险任务，发送提醒 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 提醒流程

```
┌──────────────────────────────────────────────────────────────┐
│                    提醒通知流程                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Scheduler 定时检查 │
│        │                                                      │
│        ▼                                                      │
│  获取即将到期的任务                                            │
│        │                                                      │
│        ▼                                                      │
│  检查是否已提醒过                                              │
│        │                                                      │
│        ├─ 已提醒 ─→ 跳过                                      │
│        │ │
│        └─ 未提醒 ─→ Notifier.sendReminder()                  │
│                       │                                       │
│                       ▼                                       │
│                 格式化提醒消息                                  │
│                       │                                       │
│                       ▼                                       │
│                 LarkService.sendCardMessage()                 │
│                       │                                       │
│                       ▼                                       │
│                 更新已提醒记录 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 数据持久化

### 5.1 本地存储

```
data/
├── tasks.json           # 任务缓存
├── reminders.json       # 提醒记录
├── config.json          # 用户配置
└── logs/
    └── app.log          # 应用日志
```

### 5.2 数据格式

#### tasks.json
```json
{
  "version": 1,
  "lastSync": "2026-06-09T10:00:00Z",
  "tasks": [
    {
      "id": "task_xxx",
      "title": "完成任务",
      "due": { "timestamp": "1717929600", "is_all_day": false },
      "completion": { "is_completed": false },
      "priority": "P1",
      "summary": "AI生成的摘要",
      "raw": { /* 原始飞书数据 */ }
    }
  ]
}
```

#### reminders.json
```json
{
  "sent": [
    {
      "taskId": "task_xxx",
      "sentAt": "2026-06-09T08:00:00Z",
      "type": "before_due"
    }
  ]
}
```

---

## 6. 错误处理

### 6.1 错误分类

| 错误类型 | 说明 | 处理策略 |
|----------|------|----------|
| `AuthError` | 认证失败 | 提示用户检查凭证 |
| `NetworkError` | 网络错误 | 指数退避重试 |
| `RateLimitError` | API限流 | 等待后重试 |
| `ParseError` | 数据解析错误 | 记录日志，跳过该项 |
| `StorageError` | 存储错误 | 提示用户检查目录权限 |

### 6.2 重试策略

```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,  // 1秒
  maxDelay: 30000,    // 30秒
  backoffMultiplier: 2,
};
```

---

## 7. 配置管理

### 7.1 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `LARK_APP_ID` | 飞书应用 ID | 是 |
| `LARK_APP_SECRET` | 飞书应用密钥 | 是 |
| `LARK_USER_ID` | 用户 ID (发送消息用) | 否 |
| `LARK_GROUP_ID` | 群组 ID | 否 |
| `DATA_DIR` | 数据存储目录 | 否 |

### 7.2 配置文件优先级

1. 环境变量
2. `config.json` (用户配置)
3. `config.example.json` (默认配置)

---

## 8. 测试策略

### 8.1 单元测试

| 模块 | 测试点 |
|------|--------|
| Task Sort | 排序算法正确性 |
| Risk Detect | 风险识别准确性 |
| Task Filter | 过滤条件正确性 |
| Formatter | 输出格式正确性 |

### 8.2 集成测试

| 测试场景 | 说明 |
|----------|------|
|完整同步流程 | 测试从飞书获取到本地存储 |
| 命令行输出 | 测试各子命令输出 |
| 通知发送 | 测试飞书消息发送 |

---

## 9. 部署方案

### 9.1 本地运行

```bash
# 安装依赖
npm install

# 配置环境变量
export LARK_APP_ID=your_app_id
export LARK_APP_SECRET=your_app_secret

# 运行
npm start
```

### 9.2 定时任务 (macOS/Linux)

```bash
# 添加 cron 任务 - 每小时同步一次
0 * * * * /path/to/lark-task-reminder/bin/sync

# 添加 cron 任务 - 每天 9 点发送汇总
0 9 * * * /path/to/lark-task-reminder/bin/report
```

---

## 10. 关键文件清单

| 文件路径 | 说明 |
|----------|------|
| `src/index.ts` | 应用入口 |
| `src/cli/commands/list.ts` | list 命令 |
| `src/cli/commands/today.ts` | today 命令 |
| `src/cli/commands/sync.ts` | sync 命令 |
| `src/cli/commands/report.ts` | report 命令 |
| `src/core/task-store.ts` | 任务存储 |
| `src/core/task-sort.ts` | 任务排序 |
| `src/core/risk-detector.ts` | 风险检测 |
| `src/services/lark-api.ts` | 飞书 API |
| `src/services/notifier.ts` | 通知服务 |
| `src/types/index.ts` | 类型定义 |
| `tests/unit/*.test.ts` | 单元测试 |
| `tests/integration/*.test.ts` | 集成测试 |