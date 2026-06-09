/**
 * Task Sync Service
 * 任务同步服务 - 本地存储与飞书云端同步
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';
import type { Task, SyncResult } from '../types/index.js';

/**
 * 同步服务配置
 */
export interface SyncServiceConfig {
  /** 数据目录 */
  dataDir: string;
  /** 启用备份 */
  backupEnabled?: boolean;
  /** 最大备份数量 */
  maxBackups?: number;
}

/**
 * 同步服务接口
 */
export interface TaskSyncService {
  /** 执行同步 */
  sync(force?: boolean): Promise<SyncResult>;
  /** 加载本地任务 */
  loadTasks(): Promise<Task[]>;
  /** 保存任务到本地 */
  saveTasks(tasks: Task[]): Promise<void>;
  /** 获取上次同步时间 */
  getLastSyncTime(): Date | null;
}

/**
 * 本地存储文件名
 */
const TASKS_FILE = 'tasks.json';
const LAST_SYNC_FILE = 'last-sync.json';

/**
 * 创建同步服务实例
 */
export function createTaskSyncService(config: SyncServiceConfig): TaskSyncService {
  const { dataDir, backupEnabled = false, maxBackups = 5 } = config;

  // 确保数据目录存在
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    logger.info('Created data directory', { dataDir });
  }

  /**
   * 获取任务文件路径
   */
  function getTasksFilePath(): string {
    return join(dataDir, TASKS_FILE);
  }

  /**
   * 获取上次同步文件路径
   */
  function getLastSyncFilePath(): string {
    return join(dataDir, LAST_SYNC_FILE);
  }

  /**
   * 备份现有任务文件
   */
  function backupTasks(): void {
    if (!backupEnabled) return;

    const tasksPath = getTasksFilePath();
    if (!existsSync(tasksPath)) return;

    const backupDir = join(dataDir, 'backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupDir, `tasks-${timestamp}.json`);

    try {
      const content = readFileSync(tasksPath, 'utf-8');
      writeFileSync(backupPath, content, 'utf-8');
      logger.info('Backup created', { backupPath });

      // 清理旧备份
      cleanupOldBackups(backupDir, maxBackups);
    } catch (error) {
      logger.warn('Failed to create backup', { error });
    }
  }

  /**
   * 清理旧备份文件
   */
  function cleanupOldBackups(backupDir: string, maxBackups: number): void {
    try {
      const files = readdirSync(backupDir)
        .filter((f) => f.startsWith('tasks-') && f.endsWith('.json'))
        .sort()
        .reverse();

      // 删除超出数量的备份
      const toDelete = files.slice(maxBackups);
      toDelete.forEach((file) => {
        unlinkSync(join(backupDir, file));
        logger.debug('Deleted old backup', { file });
      });
    } catch (error) {
      logger.warn('Failed to cleanup old backups', { error });
    }
  }

  /**
   * 加载本地任务
   */
  async function loadTasks(): Promise<Task[]> {
    const tasksPath = getTasksFilePath();

    if (!existsSync(tasksPath)) {
      logger.debug('No local tasks file found');
      return [];
    }

    try {
      const content = readFileSync(tasksPath, 'utf-8');
      const tasks = JSON.parse(content) as Task[];
      logger.info('Loaded local tasks', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to load local tasks', { error });
      return [];
    }
  }

  /**
   * 保存任务到本地
   */
  async function saveTasks(tasks: Task[]): Promise<void> {
    const tasksPath = getTasksFilePath();

    try {
      // 备份现有文件
      backupTasks();

      const content = JSON.stringify(tasks, null, 2);
      writeFileSync(tasksPath, content, 'utf-8');
      logger.info('Saved tasks locally', { count: tasks.length });
    } catch (error) {
      logger.error('Failed to save tasks', { error });
      throw new Error(`Failed to save tasks: ${error}`);
    }
  }

  /**
   * 获取上次同步时间
   */
  function getLastSyncTime(): Date | null {
    const lastSyncPath = getLastSyncFilePath();

    if (!existsSync(lastSyncPath)) {
      return null;
    }

    try {
      const content = readFileSync(lastSyncPath, 'utf-8');
      const data = JSON.parse(content);
      return new Date(data.timestamp);
    } catch {
      return null;
    }
  }

  /**
   * 保存同步时间
   */
  function saveLastSyncTime(): void {
    const lastSyncPath = getLastSyncFilePath();

    try {
      const data = { timestamp: new Date().toISOString() };
      writeFileSync(lastSyncPath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      logger.warn('Failed to save last sync time', { error });
    }
  }

  /**
   * 执行同步
   */
  async function sync(force = false): Promise<SyncResult> {
    const startTime = Date.now();
    logger.info('Starting task sync', { force });

    try {
      // 加载本地任务
      const localTasks = await loadTasks();
      const localTasksMap = new Map(localTasks.map((t) => [t.id, t]));

      // TODO: 从飞书 API 获取远程任务
      // const remoteTasks = await larkClient.getTasks();

      // 模拟远程任务（用于测试）
      const remoteTasks: Task[] = [];

      const remoteTasksMap = new Map(remoteTasks.map((t) => [t.id, t]));

      // 计算差异
      let added = 0;
      let updated = 0;
      let deleted = 0;

      // 检测新增和更新的任务
      remoteTasks.forEach((remoteTask) => {
        const localTask = localTasksMap.get(remoteTask.id);
        if (!localTask) {
          added++;
        } else if (localTask.updated_at !== remoteTask.updated_at) {
          updated++;
        }
      });

      // 检测删除的任务
      localTasks.forEach((localTask) => {
        if (!remoteTasksMap.has(localTask.id)) {
          deleted++;
        }
      });

      // 保存同步后的任务
      await saveTasks(remoteTasks);

      // 保存同步时间
      saveLastSyncTime();

      const result: SyncResult = {
        added,
        updated,
        deleted,
        lastSync: new Date().toISOString(),
      };

      const duration = Date.now() - startTime;
      logger.info('Sync completed', { ...result, duration });

      return result;
    } catch (error) {
      logger.error('Sync failed', { error });
      throw new Error(`Sync failed: ${error}`);
    }
  }

  return {
    sync,
    loadTasks,
    saveTasks,
    getLastSyncTime,
  };
}