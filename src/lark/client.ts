/**
 * Lark API Client
 * 封装飞书开放平台 API 调用
 */

import lark from '@larksuiteoapi/node-sdk';
import { logger } from '../utils/logger.js';
import type { Task } from '../types/index.js';

/**
 * 飞书客户端配置
 */
export interface LarkClientConfig {
  appId: string;
  appSecret: string;
}

/**
 * 飞书客户端接口
 */
export interface LarkClient {
  /** 获取任务列表 */
  getTasks(options?: GetTasksOptions): Promise<GetTasksResult>;
  /** 标记任务完成 */
  completeTask(taskId: string): Promise<Task>;
  /** 取消任务完成状态 */
  uncompleteTask(taskId: string): Promise<Task>;
  /** 获取单个任务详情 */
  getTask(taskId: string): Promise<Task>;
}

/**
 * 获取任务列表选项
 */
export interface GetTasksOptions {
  pageToken?: string;
  pageSize?: number;
  completed?: boolean;
}

/**
 * 获取任务列表结果
 */
export interface GetTasksResult {
  tasks: Task[];
  pageToken: string;
  hasMore: boolean;
}

/**
 * 创建飞书客户端实例
 */
export function createLarkClient(config: LarkClientConfig): LarkClient {
  // 验证配置
  if (!config.appId) {
    throw new Error('appId is required');
  }
  if (!config.appSecret) {
    throw new Error('appSecret is required');
  }

  // 创建飞书客户端实例 (TODO: 实际调用飞书 API 时启用)
  // const _client = new lark.Client({
  //   appId: config.appId,
  //   appSecret: config.appSecret,
  //   loggerLevel: lark.LoggerLevel.warn,
  // });

  logger.info('Lark client initialized', { appId: config.appId });

  return {
    /**
     * 获取任务列表
     */
    async getTasks(options: GetTasksOptions = {}): Promise<GetTasksResult> {
      const { pageToken, pageSize = 50, completed } = options;

      try {
        // TODO: 调用飞书任务 API
        // const response = await client.task.list({
        //   page_token: pageToken,
        //   page_size: pageSize,
        // });

        // Mock 返回空列表
        logger.debug('Fetching tasks', { pageToken, pageSize, completed });

        return {
          tasks: [],
          pageToken: '',
          hasMore: false,
        };
      } catch (error) {
        logger.error('Failed to fetch tasks', error);
        throw new Error(`Failed to fetch tasks: ${error}`);
      }
    },

    /**
     * 标记任务完成
     */
    async completeTask(taskId: string): Promise<Task> {
      try {
        // TODO: 调用飞书任务 API
        // await client.task.complete({
        //   task_id: taskId,
        // });

        logger.info('Task completed', { taskId });

        // 返回模拟任务
        return {
          id: taskId,
          title: 'Completed Task',
          due: {
            timestamp: String(Math.floor(Date.now() / 1000)),
            is_all_day: true,
          },
          completion: {
            is_completed: true,
            completed_at: String(Math.floor(Date.now() / 1000)),
          },
          creator: {
            id: 'system',
            name: 'System',
          },
          member: {
            id: 'system',
            name: 'System',
          },
          origin: {
            platform_i18n_name: 'lark',
          },
          created_at: String(Math.floor(Date.now() / 1000)),
          updated_at: String(Math.floor(Date.now() / 1000)),
        };
      } catch (error) {
        logger.error('Failed to complete task', { taskId, error });
        throw new Error(`Failed to complete task: ${error}`);
      }
    },

    /**
     * 取消任务完成状态
     */
    async uncompleteTask(taskId: string): Promise<Task> {
      try {
        // TODO: 调用飞书任务 API
        // await client.task.uncomplete({
        //   task_id: taskId,
        // });

        logger.info('Task uncompleted', { taskId });

        return {
          id: taskId,
          title: 'Uncompleted Task',
          due: {
            timestamp: String(Math.floor(Date.now() / 1000) + 86400),
            is_all_day: true,
          },
          completion: {
            is_completed: false,
          },
          creator: {
            id: 'system',
            name: 'System',
          },
          member: {
            id: 'system',
            name: 'System',
          },
          origin: {
            platform_i18n_name: 'lark',
          },
          created_at: String(Math.floor(Date.now() / 1000)),
          updated_at: String(Math.floor(Date.now() / 1000)),
        };
      } catch (error) {
        logger.error('Failed to uncomplete task', { taskId, error });
        throw new Error(`Failed to uncomplete task: ${error}`);
      }
    },

    /**
     * 获取单个任务详情
     */
    async getTask(taskId: string): Promise<Task> {
      try {
        // TODO: 调用飞书任务 API
        // const response = await client.task.get({
        //   task_id: taskId,
        // });

        logger.debug('Fetching task', { taskId });

        throw new Error('Task not found');
      } catch (error) {
        logger.error('Failed to fetch task', { taskId, error });
        throw new Error(`Failed to fetch task: ${error}`);
      }
    },
  };
}

/**
 * 导出 Lark SDK 类型供外部使用
 */
export { lark };