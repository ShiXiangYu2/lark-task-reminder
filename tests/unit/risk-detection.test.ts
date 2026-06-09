/**
 * TASK-006 测试：风险检测引擎
 *
 * TDD 流程：RED -> GREEN -> REFACTOR
 *
 * 测试内容：
 * 1. 超期任务检测
 * 2. 紧急任务检测
 * 3. 高风险任务识别
 * 4. 风险报告生成
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RiskDetectionService,
  createRiskDetectionService,
  RiskConfig,
} from '../../src/core/risk.js';
import type { Task, RiskReport } from '../../src/types/index.js';

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

describe('TASK-006: 风险检测引擎', () => {
  describe('超期任务检测', () => {
    let service: RiskDetectionService;

    beforeEach(() => {
      service = createRiskDetectionService();
    });

    it('应该能检测超期任务', () => {
      const now = Math.floor(Date.now() / 1000);
      const overdueTask = createTestTask({
        id: 'overdue',
        due: { timestamp: String(now - 86400), is_all_day: true },
      });

      const report = service.detect([overdueTask]);

      expect(report.overdue).toHaveLength(1);
      expect(report.overdue[0].id).toBe('overdue');
    });

    it('应该不将已完成任务标记为超期', () => {
      const now = Math.floor(Date.now() / 1000);
      const completedTask = createTestTask({
        id: 'completed-overdue',
        due: { timestamp: String(now - 86400), is_all_day: true },
        completion: { is_completed: true, completed_at: String(now) },
      });

      const report = service.detect([completedTask]);

      expect(report.overdue).toHaveLength(0);
    });

    it('应该能处理多个超期任务', () => {
      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 'o1', due: { timestamp: String(now - 86400 * 2), is_all_day: true } }),
        createTestTask({ id: 'o2', due: { timestamp: String(now - 86400), is_all_day: true } }),
        createTestTask({ id: 'normal', due: { timestamp: String(now + 86400), is_all_day: true } }),
      ];

      const report = service.detect(tasks);

      expect(report.overdue).toHaveLength(2);
    });
  });

  describe('紧急任务检测', () => {
    let service: RiskDetectionService;

    beforeEach(() => {
      service = createRiskDetectionService({ urgencyThreshold: 7200 }); // 2小时
    });

    it('应该能检测2小时内的紧急任务', () => {
      const now = Math.floor(Date.now() / 1000);
      const urgentTask = createTestTask({
        id: 'urgent',
        due: { timestamp: String(now + 3600), is_all_day: false }, // 1小时后
      });

      const report = service.detect([urgentTask]);

      expect(report.urgent).toHaveLength(1);
      expect(report.urgent[0].id).toBe('urgent');
    });

    it('应该不将超期任务标记为紧急', () => {
      const now = Math.floor(Date.now() / 1000);
      const overdueTask = createTestTask({
        id: 'overdue-urgent',
        due: { timestamp: String(now - 3600), is_all_day: false },
      });

      const report = service.detect([overdueTask]);

      expect(report.urgent).toHaveLength(0);
      expect(report.overdue).toHaveLength(1);
    });
  });

  describe('高风险任务识别', () => {
    let service: RiskDetectionService;

    beforeEach(() => {
      service = createRiskDetectionService({
        riskFactors: {
          noDue:10,
          highPriority: 20,
          overdue: 30,
          longDuration: 15,
        },
      });
    });

    it('应该能识别没有截止时间的任务', () => {
      const now = Math.floor(Date.now() / 1000);
      const noDueTask = createTestTask({
        id: 'no-due',
        due: { timestamp: String(now + 86400 * 30), is_all_day: true }, // 30天后
      });
      delete (noDueTask as any).due;

      const report = service.detect([noDueTask]);

      expect(report.atRisk).toHaveLength(1);
    });

    it('应该能识别高优先级任务', () => {
      const p0Task = createTestTask({ id: 'p0', priority: 'P0' });

      const report = service.detect([p0Task]);

      expect(report.atRisk.some((t) => t.id === 'p0')).toBe(true);
    });
  });

  describe('风险报告生成', () => {
    let service: RiskDetectionService;

    beforeEach(() => {
      service = createRiskDetectionService();
    });

    it('应该生成完整的风险报告', () => {
      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 'overdue', due: { timestamp: String(now - 86400), is_all_day: true } }),
        createTestTask({ id: 'urgent', due: { timestamp: String(now + 3600), is_all_day: false } }),
        createTestTask({ id: 'normal', due: { timestamp: String(now + 86400 * 7), is_all_day: true } }),
      ];

      const report = service.detect(tasks);

      expect(report).toHaveProperty('overdue');
      expect(report).toHaveProperty('urgent');
      expect(report).toHaveProperty('atRisk');
      expect(report.overdue.length + report.urgent.length + report.atRisk.length).toBeGreaterThan(0);
    });

    it('应该能生成风险摘要', () => {
      const now = Math.floor(Date.now() / 1000);
      const tasks = [
        createTestTask({ id: 'o1', due: { timestamp: String(now - 86400), is_all_day: true } }),
        createTestTask({ id: 'u1', due: { timestamp: String(now + 3600), is_all_day: false } }),
      ];

      const report = service.detect(tasks);
      const summary = service.generateSummary(report);

      expect(summary).toContain('超期');
      expect(summary).toContain('紧急');
    });
  });

  describe('配置选项', () => {
    it('应该能配置紧急阈值', () => {
      const service = createRiskDetectionService({ urgencyThreshold: 3600 }); // 1小时

      expect(service).toBeDefined();
      expect(typeof service.detect).toBe('function');
    });

    it('应该能配置风险因素权重', () => {
      const service = createRiskDetectionService({
        riskFactors: {
          noDue: 20,
          highPriority: 30,
          overdue: 40,
          longDuration: 25,
        },
      });

      expect(service).toBeDefined();
    });
  });
});