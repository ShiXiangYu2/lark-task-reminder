/**
 * TASK-007 测试：提醒服务
 *
 * TDD 流程：RED -> GREEN -> REFACTOR
 *
 * 测试内容：
 * 1. 提醒检查逻辑
 * 2. 重复提醒间隔
 * 3. 每日提醒限制
 * 4. 通知生成
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReminderService,
  createReminderService,
  ReminderServiceConfig,
} from '../../src/services/reminder.js';
import type { Task } from '../../src/types/index.js';

// 创建测试任务
function createTestTask(overrides: Partial<Task> = {}): Task {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'test-' + Math.random().toString(36).substring(2, 9),
    title: '测试任务',
    due: {
      timestamp: String(now + 86400),
      is_all_day: true,
    },
    completion: {
      is_completed: false,
    },
    creator: {
      id: 'user-1',
      name: '测试用户',
    },
    member: {
      id: 'user-1',
      name: '测试用户',
    },
    origin: {
      platform_i18n_name: 'lark',
    },
    created_at: String(now),
    updated_at: String(now),
    ...overrides,
  };
}

describe('TASK-007: 提醒服务', () => {
  describe('服务初始化', () => {
    it('应该能创建提醒服务实例', () => {
      const config: ReminderServiceConfig = {
        enabled: true,
        beforeHours: 2,
        repeatInterval: 60,
        maxPerDay: 10,
      };

      const service = createReminderService(config);
      expect(service).toBeDefined();
      expect(service).toHaveProperty('checkReminders');
      expect(service).toHaveProperty('shouldRemind');
    });

    it('应该在禁用时跳过提醒检查', () => {
      const service = createReminderService({ enabled: false });
      const tasks = [createTestTask()];

      const result = service.checkReminders(tasks);
      expect(result).toHaveLength(0);
    });
  });

  describe('提醒检查逻辑', () => {
    let service: ReminderService;

    beforeEach(() => {
      service = createReminderService({
        enabled: true,
        beforeHours: 2,
        repeatInterval: 60,
        maxPerDay: 10,
      });
    });

    it('应该检测2小时内的任务需要提醒', () => {
      const now = Math.floor(Date.now() / 1000);
      const urgentTask = createTestTask({
        id: 'urgent',
        due: { timestamp: String(now + 3600), is_all_day: false }, // 1小时后
      });

      const result = service.checkReminders([urgentTask]);

      expect(result.some((r) => r.taskId === 'urgent')).toBe(true);
    });

    it('应该不提醒已完成的任务', () => {
      const now = Math.floor(Date.now() / 1000);
      const completedTask = createTestTask({
        id: 'completed',
        due: { timestamp: String(now + 3600), is_all_day: false },
        completion: { is_completed: true, completed_at: String(now) },
      });

      const result = service.checkReminders([completedTask]);

      expect(result).toHaveLength(0);
    });

    it('应该不提醒已超期的任务', () => {
      const now = Math.floor(Date.now() / 1000);
      const overdueTask = createTestTask({
        id: 'overdue',
        due: { timestamp: String(now - 3600), is_all_day: false },
      });

      const result = service.checkReminders([overdueTask]);

      expect(result).toHaveLength(0);
    });
  });

  describe('重复提醒间隔', () => {
    it('应该在重复间隔内跳过提醒', () => {
      const service = createReminderService({
        enabled: true,
        beforeHours: 2,
        repeatInterval: 60, // 60分钟
        maxPerDay: 10,
      });

      const now = Math.floor(Date.now() / 1000);
      const task = createTestTask({
        id: 'task-to-check',
        due: { timestamp: String(now + 3600), is_all_day: false },
      });

      // 第一次检查
      const firstCheck = service.checkReminders([task]);
      expect(firstCheck).toHaveLength(1);

      // 30分钟后再次检查（仍在间隔内）
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 30 * 60 * 1000));

      const secondCheck = service.checkReminders([task]);
      expect(secondCheck).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('每日提醒限制', () => {
    it('应该限制每日提醒数量', () => {
      const service = createReminderService({
        enabled: true,
        beforeHours: 2,
        repeatInterval: 60,
        maxPerDay: 2, // 限制2个
      });

      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 't1', due: { timestamp: String(now + 3600), is_all_day: false } }),
        createTestTask({ id: 't2', due: { timestamp: String(now + 5400), is_all_day: false } }),
        createTestTask({ id: 't3', due: { timestamp: String(now + 7200), is_all_day: false } }),
      ];

      const result = service.checkReminders(tasks);

      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('通知生成', () => {
    let service: ReminderService;

    beforeEach(() => {
      service = createReminderService({
        enabled: true,
        beforeHours: 2,
        repeatInterval: 60,
        maxPerDay: 10,
      });
    });

    it('应该能生成通知内容', () => {
      const now = Math.floor(Date.now() / 1000);
      const task = createTestTask({
        id: 'notify-task',
        title: '重要会议',
        priority: 'P0',
        due: { timestamp: String(now + 3600), is_all_day: false },
      });

      const result = service.checkReminders([task]);

      expect(result[0]).toHaveProperty('taskId', 'notify-task');
      expect(result[0]).toHaveProperty('message');
      expect(result[0].message).toContain('重要会议');
    });

    it('应该包含优先级信息', () => {
      const now = Math.floor(Date.now() / 1000);
      const task = createTestTask({
        id: 'p0-task',
        priority: 'P0',
        due: { timestamp: String(now + 3600), is_all_day: false },
      });

      const result = service.checkReminders([task]);

      expect(result[0].message).toContain('P0');
    });
  });
});