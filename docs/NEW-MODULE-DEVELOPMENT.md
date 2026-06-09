# 新增需求模块开发流程

基于 AutoDev Framework 的标准化开发流程，适用于在 `lark-task-reminder` 项目中新增功能模块。

---

## 目录

1. [流程概览](#流程概览)
2. [Step 1: 需求追问](#step-1-需求追问)
3. [Step 2: 规格生成](#step-2-规格生成)
4. [Step 3:任务分解](#step-3-任务分解)
5. [Step 4: GitHub Issues 创建](#step-4-github-issues-创建)
6. [Step 5: TDD 开发循环](#step-5-tdd-开发循环)
7. [Step 6: CI/CD 自动化](#step-6-cicd-自动化)
8. [Step 7: PR Review 与合并](#step-7-pr-review-与合并)
9. [快速命令参考](#快速命令参考)

---

## 流程概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    新增需求模块开发流程                            │
└─────────────────────────────────────────────────────────────────┘

用户提出需求
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 需求追问   │────▶│  规格生成   │────▶│  任务分解   │
│ grill-me    │     │ spec-kitty  │     │ spec-kitty  │
└─────────────┘    └─────────────┘     └─────────────┘
                                             │
                                             ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PR Merge│◀────│  CI/CD     │◀────│ TDD 开发   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
     │                                       │
     ▼▼
┌─────────────┐                       ┌─────────────┐
│ Issue Close │                       │  GitHub PR │
└─────────────┘                       └─────────────┘
```

---

## Step 1: 需求追问

### 目标
明确需求范围、优先级和技术约束，避免开发过程中的返工。

### 追问要点
1. **功能范围** - 这个功能具体要做什么？
2. **用户场景** - 谁会使用这个功能？在什么场景下使用？
3. **优先级** - P0/P1/P2？如何排序？
4. **技术约束** - 有特定的技术要求吗？
5. **依赖关系** - 需要依赖其他模块吗？
6. **验收标准** - 如何判断功能开发完成？

### 输出
- 明确的需求描述
- 优先级建议
- 初步的技术方案思路

### 示例对话
```
用户: 给我添加一个任务评论功能

AI:
1. 评论功能是指？
   - 在任务下添加文字评论？
   - 支持 @ 提及其他人？
   - 支持评论回复和 Thread？

2. 用户场景？
   - 个人使用还是团队协作？

3. 评论需要同步到飞书吗？

4. 优先级？
   - P0: 必须有
   - P1: 最好有
   - P2: 可以后续添加
```

---

## Step 2: 规格生成

### 2.1 生成 SPEC.md (规格文档)

```bash
# 使用 spec-kitty.specify skill 或手动创建
```

### SPEC.md 模板

```markdown
# 功能名称规格文档

## 1. 项目概述
- **功能名称**: xxx
- **核心功能**: xxx
- **目标用户**: xxx

## 2. 功能需求

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 功能1 | 描述 | P1 |
| 功能2 | 描述 | P2 |

## 3. 技术约束
- 技术栈: TypeScript + Node.js
- 运行环境: GitHub Actions
- 输出方式: xxx

## 4. 数据模型
```typescript
interface NewFeature {
  id: string;
  // ...
}
```

## 5. API 设计
| 接口 | 方法 | 描述 |
|------|------|------|
| /api/xxx | GET | 获取xxx |

## 6. 用户流程
1. 用户执行操作 A
2. 系统响应 B
3. ...
```

### 2.2 生成 PLAN.md (技术方案)

```markdown
# 技术方案

## 1. 系统架构
[架构图]

## 2. 核心模块设计
- Module A
- Module B

## 3. 数据流
[数据流图]

## 4. 关键算法
```typescript
function algorithm() {
  // ...
}
```

## 5. 错误处理
| 错误类型 | 处理方式 |
|----------|----------|
| 网络错误 | 重试3次 |
| 认证失败 | 提示登录 |
```

---

## Step 3: 任务分解

### 分解原则
1. **垂直切片** - 每个任务应该是端到端的
2. **可测试** - 每个任务都可以独立测试
3. **时间盒** - 每个任务 2-4 小时工作量

### TASKS.md 模板

```markdown
# 开发任务分解

## Phase 1: 基础模块

### Task1: 模块初始化
**类型**: AFK
**依赖**: 无

**任务内容**:
- 创建目录结构
- 添加基础类型
- 编写测试

**产出**:
- `src/feature/`
- `tests/unit/feature.test.ts`

---

### Task 2:核心功能实现
**类型**: AFK
**依赖**: Task 1

**任务内容**:
- 实现核心逻辑
- 完善测试覆盖

**产出**:
- `src/feature/core.ts`
- 单元测试
```

---

## Step 4: GitHub Issues 创建

### 4.1 创建标签（首次）

```bash
# 创建优先级标签
gh label create "P0" --description "最高优先级" --color red
gh label create "P1" --description "高优先级" --color orange
gh label create "P2" --description "中优先级" --color yellow

# 创建阶段标签
gh label create "phase-1" --description "第一阶段" --color blue
gh label create "phase-2" --description "第二阶段" --color green

# 创建类型标签
gh label create "afk" --description "自动执行任务" --color gray
gh label create "hitl" --description "需要人工介入" --color purple
```

### 4.2 创建 Issue

```bash
# 创建单个 Issue
gh issue create \
  --title "Feature: 新功能模块" \
  --body "$(cat <<'EOF'
## 功能描述
描述新功能

## 验收标准
- [ ] 标准1
- [ ] 标准2

## 技术方案
简要技术方案

## 相关文档
- SPEC.md
- PLAN.md
EOF
)" \
  --label "P1,phase-1,afk"

# 创建多个 Issue (批量)
for i in {1..3}; do
  gh issue create \
    --title "Task-$i: 任务描述" \
    --body "任务详细内容" \
    --label "P0,phase-1,afk"
done
```

### 4.3 Issue 状态流转

```
opened → in-progress → done
  │           │
  │           └── 开发中 (添加 label)
  │
  └────────────── 新建 Issue
```

---

## Step 5: TDD 开发循环

### 5.1 创建功能分支

```bash
# 基于 Issue 编号创建分支
git checkout -b feature/issue-${ISSUE_NUMBER}-feature-name

# 或使用简写
git checkout -b feature/#123-new-feature
```

### 5.2 TDD 循环

```
┌─────────────────────────────────────────────────────┐
│                    TDD 循环 │
└─────────────────────────────────────────────────────┘

 ┌─────────┐
  │  RED    │  写一个失败的测试
  │写测试 │
  └────┬────┘
       │
       ▼
 ┌─────────┐
  │  GREEN │  实现代码让测试通过
  │  实现   │
  └────┬────┘
       │
       ▼
  ┌─────────┐
  │REFACTOR │  重构代码，保持测试通过
  │  重构   │
  └────┬────┘
       │
       ▼
     (循环)
```

### 5.3 实现步骤

#### RED: 写测试
```typescript
// tests/unit/feature.test.ts
import { describe, it, expect } from 'vitest';
import { createFeatureService } from '../../src/feature/service.js';

describe('Feature Service', () => {
  it('should do something', () => {
    const service = createFeatureService();
    const result = service.doSomething();
    expect(result).toBe('expected');
  });
});
```

```bash
# 运行测试 - 应该失败
npm test
# FAIL: expected 'expected' to be 'expected'
```

#### GREEN: 实现功能
```typescript
// src/feature/service.ts
export function createFeatureService() {
  return {
    doSomething() {
      return 'expected';
    },
  };
}
```

```bash
# 运行测试 - 应该通过
npm test
# PASS: 1 test passed
```

#### REFACTOR: 重构
```bash
# 代码格式化和 lint
npm run lint -- --fix

# 再次运行测试
npm test

# 构建检查
npm run build
```

### 5.4 提交代码

```bash
# 添加文件
git add .

# 提交 (遵循 Conventional Commits)
git commit -m "$(cat <<'EOF'
feat: 实现新功能模块

- 添加 FeatureService
- 实现核心功能
- 添加单元测试

TDD 开发流程完成
EOF
)"
```

---

## Step 6: CI/CD 自动化

### 6.1 GitHub Actions 配置

项目已配置 `.github/workflows/ci.yml`：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
```

### 6.2 CI 检查项

| 检查项 | 命令 | 说明 |
|--------|------|------|
| Lint | `npm run lint` | ESLint 代码规范 |
| Test | `npm test` | Vitest 单元测试 |
| Build | `npm run build` | TypeScript 编译 |
| Security | `npm audit` | 依赖安全扫描 (非阻塞) |

### 6.3 跳过 CI

```bash
# 在提交消息中添加 [skip ci]
git commit -m "fix: 修复bug [skip ci]"
```

---

## Step 7: PR Review 与合并

### 7.1 推送分支

```bash
# 推送分支到远程
git push -u origin feature/issue-123-new-feature
```

### 7.2 创建 PR

```bash
# 使用 CLI 创建 PR
gh pr create \
  --title "feat: 新功能模块" \
  --body "$(cat <<'EOF'
## 实现内容

- 功能点1
- 功能点2

## Test plan
- [x] npm run build - 编译成功
- [x] npm run lint - 无错误
- [x] npm test - 测试通过

## 截图/演示
[如有]

关联 Issue: #123
EOF
)"
```

### 7.3 PR模板

```markdown
## 实现内容
描述实现的功能

### 已完成
- ✅ 功能点1
- ✅ 功能点2

### 使用示例
```typescript
// 示例代码
```

## Test plan
- [ ] npm run build - 编译成功
- [ ] npm run lint - 无错误
- [ ] npm test - 测试通过
- [ ] 手动测试验证

## 相关文档
- SPEC.md
- PLAN.md

## 关联 Issue
关联 Issue: #123
```

### 7.4 合并 PR

```bash
# 方式一：合并 (推荐)
gh pr merge --admin --merge

# 方式二：Squash 合并
gh pr merge --admin --squash

# 方式三：Rebase 合并
gh pr merge --admin --rebase
```

### 7.5 关闭关联 Issue

```bash
# 在合并后关闭 Issue
gh issue close 123 --comment "完成于 PR #456"
```

---

## 快速命令参考

### Git 操作
```bash
# 创建功能分支
git checkout -b feature/issue-${N}-description

# 提交代码
git add . && git commit -m "feat: 描述"

# 推送分支
git push -u origin HEAD
```

### GitHub 操作
```bash
# 创建 Issue
gh issue create --title "Title" --body "Body" --label "P1"

# 创建 PR
gh pr create --title "feat: Title" --body "Body"

# 合并 PR
gh pr merge --admin --merge

# 关闭 Issue
gh issue close ${N} --comment "完成"
```

### 开发命令
```bash
# 安装依赖
npm install

# 运行测试
npm test

# 运行测试 (watch 模式)
npm run test:watch

# 代码检查
npm run lint

# 代码格式化
npm run format

# 构建项目
npm run build

# CI 检查 (本地)
npm run ci
```

### 快速开发流程 (简化版)

```bash
# 1. 创建分支
git checkout -b feature/issue-123-new-feature

# 2. RED: 写测试
cat > tests/unit/new-feature.test.ts << 'TESTEOF'
import { describe, it, expect } from 'vitest';
describe('New Feature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
TESTEOF
npm test  # 应该失败

# 3. GREEN: 实现
cat > src/new-feature.ts << 'SRCEOF'
export function newFeature() {
  return true;
}
SRCEOF
npm test  # 应该通过

# 4. REFACTOR
npm run lint -- --fix
npm run build

# 5. 提交并推送
git add . && git commit -m "feat: 新功能模块"
git push -u origin HEAD

# 6. 创建 PR
gh pr create --title "feat: 新功能模块" --body "关联 Issue: #123"
gh pr merge --admin --merge

# 7. 关闭 Issue
gh issue close 123 --comment "完成于 PR #xxx"
```

---

## 附录

### A. 标签说明

| 标签 | 用途 | 示例 |
|------|------|------|
| P0/P1/P2 | 优先级 | P0 = 必须完成 |
| phase-1/2/3 | 开发阶段 | 按顺序开发 |
| afk | 自动执行 | AI 可自动完成 |
| hitl | 人工介入 | 需要人工操作 |
| enhancement | 功能增强 | 新功能 |
| bug | Bug修复 | 修复问题 |

### B. 分支命名规范

```
feature/issue-${N}-${description} # 功能开发
bugfix/issue-${N}-${description}    # Bug 修复
hotfix/issue-${N}-${description}     # 紧急修复
chore/issue-${N}-${description}      # 杂项工作
```

### C. Commit 消息规范

```
<type>(<scope>): <subject>

# Type
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式
refactor: 重构
test:     测试相关
chore:    杂项

# Example
feat(core): 添加任务排序功能
fix(sync): 修复同步丢失问题
```

---

## 相关文档

- [SPEC.md](../SPEC.md) - 功能规格文档
- [PLAN.md](../PLAN.md) - 技术方案
- [TASKS.md](../TASKS.md) - 任务分解
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) - CI/CD 配置