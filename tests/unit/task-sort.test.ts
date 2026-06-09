/**
 * TASK-005 测试：智能排序算法
 *
 * TDD 流程：RED -> GREEN -> REFACTOR
 *
 * 测试内容：
 * 1. 按优先级排序
 * 2. 按截止时间排序
 * 3. 综合评分排序
 * 4. 排序选项配置
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TaskSortService,
  createTaskSortService,
  SortOptions,
  SortField,
} from '../../src/core/sort.js';
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

describe('TASK-005: 智能排序算法', () => {
  describe('按优先级排序', () => {
    let sortService: TaskSortService;

    beforeEach(() => {
      sortService = createTaskSortService();
    });

    it('应该按优先级 P0 > P1 > P2 排序', () => {
      const tasks = [
        createTestTask({ id: 'p2', priority: 'P2', title: 'P2任务' }),
        createTestTask({ id: 'p0', priority: 'P0', title: 'P0任务' }),
        createTestTask({ id: 'p1', priority: 'P1', title: 'P1任务' }),
      ];

      const sorted = sortService.sort(tasks, {
        field: 'priority',
        order: 'asc',
      });

      expect(sorted[0].id).toBe('p0');
      expect(sorted[1].id).toBe('p1');
      expect(sorted[2].id).toBe('p2');
    });

    it('应该支持降序排列', () => {
      const tasks = [
        createTestTask({ id: 'p2', priority: 'P2', title: 'P2任务' }),
        createTestTask({ id: 'p0', priority: 'P0', title: 'P0任务' }),
        createTestTask({ id: 'p1', priority: 'P1', title: 'P1任务' }),
      ];

      const sorted = sortService.sort(tasks, {
        field: 'priority',
        order: 'desc',
      });

      expect(sorted[0].id).toBe('p2');
      expect(sorted[1].id).toBe('p1');
      expect(sorted[2].id).toBe('p0');
    });

    it('应该将无优先级的任务放在最后', () => {
      const tasks = [
        createTestTask({ id: 'no-priority', priority: undefined }),
        createTestTask({ id: 'p0', priority: 'P0' }),
      ];

      const sorted = sortService.sort(tasks, {
        field: 'priority',
        order: 'asc',
      });

      expect(sorted[0].id).toBe('p0');
      expect(sorted[1].id).toBe('no-priority');
    });
  });

  describe('按截止时间排序', () => {
    let sortService: TaskSortService;

    beforeEach(() => {
      sortService = createTaskSortService();
    });

    it('应该按截止时间升序排列（最近截止在前）', () => {
      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 'later', due: { timestamp: String(now + 86400 * 3), is_all_day: true } }),
        createTestTask({ id: 'soon', due: { timestamp: String(now + 86400), is_all_day: true } }),
        createTestTask({ id: 'middle', due: { timestamp: String(now + 86400 * 2), is_all_day: true } }),
      ];

      const sorted = sortService.sort(tasks, {
        field: 'due',
        order: 'asc',
      });

      expect(sorted[0].id).toBe('soon');
      expect(sorted[1].id).toBe('middle');
      expect(sorted[2].id).toBe('later');
    });

    it('应该将已超期任务排在最前', () => {
      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 'future', due: { timestamp: String(now + 86400), is_all_day: true } }),
        createTestTask({ id: 'overdue', due: { timestamp: String(now - 86400), is_all_day: true } }),
      ];

      const sorted = sortService.sort(tasks, {
        field: 'due',
        order: 'asc',
      });

      expect(sorted[0].id).toBe('overdue');
      expect(sorted[1].id).toBe('future');
    });
  });

  describe('综合评分排序', () => {
    let sortService: TaskSortService;

    beforeEach(() => {
      sortService = createTaskSortService();
    });

    it('应该按综合评分排序', () => {
      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 'low', priority: 'P2', due: { timestamp: String(now + 86400 * 3), is_all_day: true } }),
        createTestTask({ id: 'high', priority: 'P0', due: { timestamp: String(now + 86400 * 3), is_all_day: true } }),
      ];

      const sorted = sortService.sort(tasks, {
        field: 'score',
        order: 'desc',
      });

      // P0 (得分 60) 应该排在 P2 (得分 6) 前面
      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('low');
    });

    it('应该考虑紧急程度加权', () => {
      const now = Math.floor(Date.now() / 1000);
      // p2-soon: 1小时后截止，在紧急阈值(2小时)内
      // p1-future: 7天后截止，超出紧急阈值
      const tasks: Task[] = [
        {
          id: 'p1-future',
          title: 'P1 未来任务',
          priority: 'P1',
          due: { timestamp: String(now + 86400 * 7), is_all_day: true },
          completion: { is_completed: false },
          creator: { id: 'u1', name: 'U1' },
          member: { id: 'u1', name: 'U1' },
          origin: { platform_i18n_name: 'lark' },
          created_at: String(now),
          updated_at: String(now),
        },
        {
          id: 'p2-soon',
          title: 'P2 紧急任务',
          priority: 'P2',
          due: { timestamp: String(now + 3600), is_all_day: false }, // 1小时后
          completion: { is_completed: false },
          creator: { id: 'u1', name: 'U1' },
          member: { id: 'u1', name: 'U1' },
          origin: { platform_i18n_name: 'lark' },
          created_at: String(now),
          updated_at: String(now),
        },
      ];

      // P2 但1小时后截止 vs P1 但7天后截止
      const sorted = sortService.sort(tasks, {
        field: 'score',
        order: 'desc',
      });

      // P2 紧急任务应该排在前面
      expect(sorted[0].id).toBe('p2-soon');
    });
  });

  describe('排序选项配置', () => {
    it('应该能配置自定义排序规则', () => {
      const service = createTaskSortService({
        priorityWeights: { P0: 100, P1: 50, P2: 10 },
        urgencyThreshold: 7200, // 2小时
      });

      expect(service).toBeDefined();
      expect(typeof service.sort).toBe('function');
    });

    it('应该能设置是否将已完成任务排在最后', () => {
      const service = createTaskSortService({
        completedAtBottom: true,
      });

      expect(service).toBeDefined();
    });
  });

  describe('边界情况', () => {
    let sortService: TaskSortService;

    beforeEach(() => {
      sortService = createTaskSortService();
    });

    it('应该处理空任务列表', () => {
      const sorted = sortService.sort([], { field: 'priority', order: 'asc' });
      expect(sorted).toHaveLength(0);
    });

    it('应该处理单个任务', () => {
      const task = createTestTask({ id: 'single' });
      const sorted = sortService.sort([task], { field: 'priority', order: 'asc' });
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('single');
    });

    it('不应该修改原数组', () => {
      const tasks = [
        createTestTask({ id: 'first' }),
        createTestTask({ id: 'second' }),
      ];
      const original = [...tasks];

      sortService.sort(tasks, { field: 'priority', order: 'asc' });

      expect(tasks[0].id).toBe(original[0].id);
      expect(tasks[1].id).toBe(original[1].id);
    });
  });
});