/**
 * Task Types Unit Tests
 * TDD tests for Task type definitions
 */

import { describe, it, expect } from 'vitest';
import type { Task, ReminderConfig, DailyReport, TaskPriority } from '../../src/types/index.js';

describe('Task Types', () => {
  describe('Task', () => {
    it('should have required fields', () => {
      const task: Task = {
        id: 'task_001',
        title: 'Test Task',
        due: {
          timestamp: '1717929600',
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
        creator: {
          id: 'user_001',
          name: 'Test User',
        },
        member: {
          id: 'user_001',
          name: 'Test User',
        },
        origin: {
          platform_i18n_name: 'Lark',
        },
        created_at: '2026-06-09T00:00:00Z',
        updated_at: '2026-06-09T00:00:00Z',
      };

      expect(task.id).toBe('task_001');
      expect(task.title).toBe('Test Task');
      expect(task.completion.is_completed).toBe(false);
    });

    it('should support optional fields', () => {
      const task: Task = {
        id: 'task_002',
        title: 'Task with optional fields',
        due: {
          timestamp: '1717929600',
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
        creator: {
          id: 'user_001',
          name: 'Test User',
        },
        member: {
          id: 'user_001',
          name: 'Test User',
        },
        origin: {
          platform_i18n_name: 'Lark',
        },
        created_at: '2026-06-09T00:00:00Z',
        updated_at: '2026-06-09T00:00:00Z',
        description: 'This is a description',
        summary: 'AI generated summary',
        priority: 'P0',
        tags: ['urgent', 'work'],
      };

      expect(task.description).toBe('This is a description');
      expect(task.summary).toBe('AI generated summary');
      expect(task.priority).toBe('P0');
      expect(task.tags).toContain('urgent');
    });
  });

  describe('TaskPriority', () => {
    it('should support P0 priority', () => {
      const task: Task = {
        id: 'task_003',
        title: 'Urgent Task',
        priority: 'P0',
        due: {
          timestamp: '1717929600',
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
        creator: {
          id: 'user_001',
          name: 'Test User',
        },
        member: {
          id: 'user_001',
          name: 'Test User',
        },
        origin: {
          platform_i18n_name: 'Lark',
        },
        created_at: '2026-06-09T00:00:00Z',
        updated_at: '2026-06-09T00:00:00Z',
      };

      expect(task.priority).toBe('P0');
    });

    it('should support P1 priority', () => {
      const task: Task = {
        id: 'task_004',
        title: 'Important Task',
        priority: 'P1',
        due: {
          timestamp: '1717929600',
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
        creator: {
          id: 'user_001',
          name: 'Test User',
        },
        member: {
          id: 'user_001',
          name: 'Test User',
        },
        origin: {
          platform_i18n_name: 'Lark',
        },
        created_at: '2026-06-09T00:00:00Z',
        updated_at: '2026-06-09T00:00:00Z',
      };

      expect(task.priority).toBe('P1');
    });

    it('should support P2 priority', () => {
      const task: Task = {
        id: 'task_005',
        title: 'Normal Task',
        priority: 'P2',
        due: {
          timestamp: '1717929600',
          is_all_day: false,
        },
        completion: {
          is_completed: false,
        },
        creator: {
          id: 'user_001',
          name: 'Test User',
        },
        member: {
          id: 'user_001',
          name: 'Test User',
        },
        origin: {
          platform_i18n_name: 'Lark',
        },
        created_at: '2026-06-09T00:00:00Z',
        updated_at: '2026-06-09T00:00:00Z',
      };

      expect(task.priority).toBe('P2');
    });
  });

  describe('ReminderConfig', () => {
    it('should have default values', () => {
      const config: ReminderConfig = {
        enabled: true,
        beforeHours: 2,
        repeatInterval: 60,
        maxPerDay: 10,
      };

      expect(config.enabled).toBe(true);
      expect(config.beforeHours).toBe(2);
      expect(config.repeatInterval).toBe(60);
      expect(config.maxPerDay).toBe(10);
    });
  });

  describe('DailyReport', () => {
    it('should contain task statistics', () => {
      const report: DailyReport = {
        date: '2026-06-09',
        totalTasks: 10,
        completedTasks: 5,
        overdueTasks: 2,
        upcomingTasks: [],
        riskTasks: [],
        summary: 'Good progress today',
      };

      expect(report.date).toBe('2026-06-09');
      expect(report.totalTasks).toBe(10);
      expect(report.completedTasks).toBe(5);
      expect(report.overdueTasks).toBe(2);
    });
  });
});