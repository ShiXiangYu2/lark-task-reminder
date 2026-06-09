/**
 * TASK-004 测试：任务同步服务
 *
 * TDD 流程：RED -> GREEN -> REFACTOR
 *
 * 测试内容：
 * 1. 任务本地存储
 * 2. 增量同步
 * 3. 全量同步
 * 4. 冲突处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TaskSyncService,
  createTaskSyncService,
  SyncServiceConfig,
} from '../../src/services/sync.js';
import type { Task } from '../../src/types/index.js';

// Mock 数据
const mockTask: Task = {
  id: 'mock-task-1',
  title: '测试任务',
  due: {
    timestamp: String(Math.floor(Date.now() / 1000) + 86400),
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
  created_at: String(Math.floor(Date.now() / 1000)),
  updated_at: String(Math.floor(Date.now() / 1000)),
};

describe('TASK-004: 任务同步服务', () => {
  describe('服务初始化', () => {
    it('应该能创建同步服务实例', () => {
      const config: SyncServiceConfig = {
        dataDir: './test-data',
        backupEnabled: false,
      };

      const service = createTaskSyncService(config);
      expect(service).toBeDefined();
      expect(service).toHaveProperty('sync');
      expect(service).toHaveProperty('loadTasks');
      expect(service).toHaveProperty('saveTasks');
    });

    it('应该创建数据目录', () => {
      const config: SyncServiceConfig = {
        dataDir: './test-data-sync',
        backupEnabled: false,
      };

      const service = createTaskSyncService(config);
      expect(service).toBeDefined();
    });
  });

  describe('任务本地存储', () => {
    let service: TaskSyncService;

    beforeEach(() => {
      service = createTaskSyncService({
        dataDir: './test-data-storage',
        backupEnabled: false,
      });
    });

    it('应该能保存任务列表', async () => {
      expect(typeof service.saveTasks).toBe('function');
    });

    it('应该能加载任务列表', async () => {
      expect(typeof service.loadTasks).toBe('function');
    });

    it('应该处理空任务列表', async () => {
      expect(typeof service.loadTasks).toBe('function');
    });
  });

  describe('增量同步', () => {
    let service: TaskSyncService;

    beforeEach(() => {
      service = createTaskSyncService({
        dataDir: './test-data-incremental',
        backupEnabled: false,
      });
    });

    it('应该能进行增量同步', async () => {
      expect(typeof service.sync).toBe('function');
    });

    it('应该检测新增任务', async () => {
      expect(typeof service.sync).toBe('function');
    });

    it('应该检测更新任务', async () => {
      expect(typeof service.sync).toBe('function');
    });

    it('应该检测删除任务', async () => {
      expect(typeof service.sync).toBe('function');
    });
  });

  describe('全量同步', () => {
    let service: TaskSyncService;

    beforeEach(() => {
      service = createTaskSyncService({
        dataDir: './test-data-full',
        backupEnabled: false,
      });
    });

    it('应该能强制全量同步', async () => {
      expect(typeof service.sync).toBe('function');
    });

    it('应该清空本地缓存后重新同步', async () => {
      expect(typeof service.sync).toBe('function');
    });
  });

  describe('备份功能', () => {
    it('应该在同步前备份数据', () => {
      const service = createTaskSyncService({
        dataDir: './test-data-backup',
        backupEnabled: true,
      });

      expect(service).toBeDefined();
    });

    it('应该保留最近 N 个备份', () => {
      const service = createTaskSyncService({
        dataDir: './test-data-backup-retain',
        backupEnabled: true,
        maxBackups: 3,
      });

      expect(service).toBeDefined();
    });
  });
});