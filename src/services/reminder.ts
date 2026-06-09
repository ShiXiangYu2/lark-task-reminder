/**
 * Reminder Service
 * 提醒服务 - 检查并生成任务提醒
 */

import { logger } from '../utils/logger.js';
import type { Task } from '../types/index.js';

/**
 * 提醒服务配置
 */
export interface ReminderServiceConfig {
  /** 启用提醒功能 */
  enabled?: boolean;
  /** 提前提醒小时数 */
  beforeHours?: number;
  /** 重复提醒间隔（分钟） */
  repeatInterval?: number;
  /** 每日最大提醒数 */
  maxPerDay?: number;
}

/**
 * 提醒结果
 */
export interface ReminderResult {
  taskId: string;
  taskTitle: string;
  priority?: string;
  message: string;
  dueTime: string;
}

/**
 * 提醒服务接口
 */
export interface ReminderService {
  /** 检查需要提醒的任务 */
  checkReminders(tasks: Task[]): ReminderResult[];
  /** 判断单个任务是否需要提醒 */
  shouldRemind(task: Task): boolean;
}

/**
 * 创建提醒服务实例
 */
export function createReminderService(config: ReminderServiceConfig = {}): ReminderService {
  const {
    enabled = true,
    beforeHours = 2,
    repeatInterval = 60,
    maxPerDay = 10,
  } = config;

  // 记录已提醒的任务（用于控制重复提醒）
  const remindedTasks = new Map<string, number>();

  /**
   * 判断单个任务是否需要提醒
   */
  function shouldRemind(task: Task): boolean {
    if (!enabled) return false;
    if (task.completion.is_completed) return false;

    const now = Date.now() / 1000;
    const dueTime = parseInt(task.due.timestamp);

    // 已超期，不提醒
    if (dueTime < now) return false;

    // 距离截止时间在提前提醒小时内
    const hoursUntilDue = (dueTime - now) / (60 * 60);
    if (hoursUntilDue > beforeHours) return false;

    return true;
  }

  /**
   * 生成提醒消息
   */
  function generateMessage(task: Task): string {
    const now = Date.now() / 1000;
    const dueTime = parseInt(task.due.timestamp);
    const hoursUntilDue = Math.floor((dueTime - now) / (60 * 60));
    const minutesUntilDue = Math.floor(((dueTime - now) / 60) %60);

    let timeText = '';
    if (hoursUntilDue < 1) {
      timeText = `${minutesUntilDue}分钟后`;
    } else {
      timeText = `${hoursUntilDue}小时${minutesUntilDue}分钟后`;
    }

    const priorityText = task.priority ? `[${task.priority}] ` : '';
    return `${priorityText}${task.title}将在 ${timeText} 到期`;
  }

  /**
   * 检查需要提醒的任务
   */
  function checkReminders(tasks: Task[]): ReminderResult[] {
    if (!enabled) {
      logger.debug('Reminder service is disabled');
      return [];
    }

    const results: ReminderResult[] = [];
    const now = Date.now();

    for (const task of tasks) {
      // 检查是否需要提醒
      if (!shouldRemind(task)) continue;

      // 检查重复提醒间隔
      const lastReminder = remindedTasks.get(task.id);
      if (lastReminder) {
        const minutesSinceLastReminder = (now - lastReminder) / (60 * 1000);
        if (minutesSinceLastReminder < repeatInterval) {
          logger.debug('Task in repeat interval', { taskId: task.id });
          continue;
        }
      }

      // 检查每日限制
      if (results.length >= maxPerDay) {
        logger.debug('Max reminders per day reached');
        break;
      }

      // 生成提醒
      const result: ReminderResult = {
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        message: generateMessage(task),
        dueTime: task.due.timestamp,
      };

      results.push(result);
      remindedTasks.set(task.id, now);

      logger.info('Reminder generated', { taskId: task.id, title: task.title });
    }

    return results;
  }

  return {
    checkReminders,
    shouldRemind,
  };
}