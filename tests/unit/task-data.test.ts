/**
 * TASK-002 测试：类型定义与数据模型
 *
 * TDD 流程：RED -> GREEN -> REFACTOR
 *
 * 测试内容：
 * 1. 任务数据模型创建和验证
 * 2. 任务序列化/反序列化
 * 3. 数据模型辅助函数
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Task,
  TaskPriority,
  TaskDue,
  TaskCompletion,
  createTask,
  validateTask,
  TaskStatus,
} from '../../src/types/index.js';

describe('TASK-002: 类型定义与数据模型', () => {
  describe('Task 创建和验证', () => {
    let mockTask: Task;

    beforeEach(() => {
      mockTask = {
        id: 'task-123',
        title: '测试任务',
        description: '这是一个测试任务',
        priority: 'P1',
        due: {
          timestamp: String(Math.floor(Date.now() / 1000) + 86400), // 1天后
          is_all_day: false,
        },
        completion: {
          is_completed: false,
          completed_at: undefined,
        },
        origin: {
          platform: 'lark',
          task_id: 'lark-task-123',
        },
        members: [],
        tags: ['开发', '测试'],
        extra: {},
      };
    });

    it('应该能创建一个完整的任务', () => {
      const task = createTask({
        title: '新任务',
        priority: 'P0',
        dueAt: new Date(Date.now() + 86400000),
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('新任务');
      expect(task.priority).toBe('P0');
      expect(task.completion.is_completed).toBe(false);
    });

    it('应该验证任务字段的合法性', () => {
      const result = validateTask(mockTask);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝无效的任务标题', () => {
      const invalidTask = { ...mockTask, title: '' };
      const result = validateTask(invalidTask as Task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title: 标题不能为空');
    });

    it('应该拒绝超过长度的标题', () => {
      const longTitle = 'a'.repeat(501);
      const invalidTask = { ...mockTask, title: longTitle };
      const result = validateTask(invalidTask as Task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title: 标题长度不能超过500字符');
    });

    it('应该拒绝无效的优先级', () => {
      const invalidTask = { ...mockTask, priority: 'P5' as TaskPriority };
      const result = validateTask(invalidTask as Task);
      expect(result.valid).toBe(false);
    });

    it('应该拒绝过期的截止时间', () => {
      const invalidTask = {
        ...mockTask,
        due: {
          timestamp: String(Math.floor(Date.now() / 1000) - 86400),
          is_all_day: true,
        },
      };
      const result = validateTask(invalidTask as Task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('due: 截止时间不能早于当前时间');
    });
  });

  describe('TaskPriority 枚举', () => {
    it('应该支持 P0 优先级', () => {
      const task = createTask({
        title: 'P0 任务',
        priority: 'P0',
      });
      expect(task.priority).toBe('P0');
    });

    it('应该支持 P1 优先级', () => {
      const task = createTask({
        title: 'P1 任务',
        priority: 'P1',
      });
      expect(task.priority).toBe('P1');
    });

    it('应该支持 P2 优先级', () => {
      const task = createTask({
        title: 'P2 任务',
        priority: 'P2',
      });
      expect(task.priority).toBe('P2');
    });
  });

  describe('TaskStatus 辅助函数', () => {
    it('应该正确判断未完成状态', () => {
      const task: Task = {
        id: 'test-1',
        title: '测试',
        due: {
          timestamp: String(Math.floor(Date.now() / 1000) + 86400),
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
      };

      expect(TaskStatus.isPending(task)).toBe(true);
      expect(TaskStatus.isCompleted(task)).toBe(false);
    });

    it('应该正确判断已完成状态', () => {
      const task: Task = {
        id: 'test-2',
        title: '测试',
        due: {
          timestamp: String(Math.floor(Date.now() / 1000) + 86400),
          is_all_day: false,
        },
        completion: {
          is_completed: true,
          completed_at: String(Math.floor(Date.now() / 1000)),
        },
      };

      expect(TaskStatus.isCompleted(task)).toBe(true);
      expect(TaskStatus.isPending(task)).toBe(false);
    });

    it('应该正确判断超期状态', () => {
      const overdueTask: Task = {
        id: 'test-3',
        title: '测试',
        due: {
          timestamp: String(Math.floor(Date.now() / 1000) - 86400),
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
      };

      expect(TaskStatus.isOverdue(overdueTask)).toBe(true);
    });
  });
});