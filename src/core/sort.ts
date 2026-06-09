/**
 * Task Sort Service
 * 智能排序算法 - 根据优先级、紧急程度、时间等因素综合排序
 */

import type { Task, TaskPriority } from '../types/index.js';

/**
 * 排序字段
 */
export type SortField = 'priority' | 'due' | 'created_at' | 'score';

/**
 * 排序选项
 */
export interface SortOptions {
  field: SortField;
  order: 'asc' | 'desc';
}

/**
 * 排序服务配置
 */
export interface SortServiceConfig {
  /** 优先级权重 */
  priorityWeights?: Record<TaskPriority, number>;
  /** 紧急阈值（秒） */
  urgencyThreshold?: number;
  /** 是否将已完成任务排在最后 */
  completedAtBottom?: boolean;
}

/**
 * 排序服务接口
 */
export interface TaskSortService {
  /** 排序任务列表 */
  sort(tasks: Task[], options: SortOptions): Task[];
}

/**
 * 默认优先级权重
 */
const DEFAULT_PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  P0: 100,
  P1: 50,
  P2: 10,
};

/**
 * 默认紧急阈值（秒）- 2小时
 */
const DEFAULT_URGENCY_THRESHOLD = 2 * 60 * 60;

/**
 * 计算任务紧急程度得分
 */
function calculateUrgencyScore(task: Task, threshold: number): number {
  const now = Date.now();
  const dueTime = parseInt(task.due.timestamp) * 1000;
  const timeDiff = dueTime - now;
  const thresholdMs = threshold * 1000; // 转换为毫秒

  // console.log(`Urgency: ${task.id}, now=${now}, dueTime=${dueTime}, timeDiff=${timeDiff}, threshold=${thresholdMs}`);

  // 已超期
  if (timeDiff < 0) {
    // 超期越久，得分越高（但有上限）
    const overdueHours = Math.abs(timeDiff) / (60 * 60 * 1000);
    return 100 + Math.min(overdueHours, 24) * 2;
  }

  // 即将到期
  if (timeDiff <= thresholdMs) {
    // 时间越近，得分越高（最高150分，超过P0优先级）
    const ratio = 1 - timeDiff / thresholdMs;
    return 30 + ratio * 120;
  }

  // 正常任务
  return 0;
}

/**
 * 计算任务综合得分
 */
function calculateScore(
  task: Task,
  priorityWeights: Record<TaskPriority, number>,
  urgencyThreshold: number
): number {
  // 如果已完成，得分为 0
  if (task.completion.is_completed) {
    return 0;
  }

  // 优先级得分
  const priority = task.priority || 'P2';
  const priorityScore = priorityWeights[priority] || 10;

  // 紧急程度得分
  const urgencyScore = calculateUrgencyScore(task, urgencyThreshold);

  // 综合得分 = 优先级 * 0.6 + 紧急程度 * 0.4
  return priorityScore * 0.6 + urgencyScore * 0.4;
}

/**
 * 获取优先级数值（用于排序）
 */
function getPriorityValue(priority?: TaskPriority): number {
  const weights: Record<TaskPriority, number> = {
    P0: 0,
    P1: 1,
    P2: 2,
  };
  return priority ? weights[priority] : 3; // 无优先级放在最后
}

/**
 * 创建排序服务实例
 */
export function createTaskSortService(config: SortServiceConfig = {}): TaskSortService {
  const {
    priorityWeights = DEFAULT_PRIORITY_WEIGHTS,
    urgencyThreshold = DEFAULT_URGENCY_THRESHOLD,
    completedAtBottom = true,
  } = config;

  /**
   * 排序任务列表
   */
  function sort(tasks: Task[], options: SortOptions): Task[] {
    if (tasks.length <= 1) {
      return [...tasks];
    }

    const { field, order } = options;
    const sorted = [...tasks];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'priority': {
          // 优先级：P0 > P1 > P2
          const aPriority = getPriorityValue(a.priority);
          const bPriority = getPriorityValue(b.priority);
          comparison = aPriority - bPriority;
          break;
        }

        case 'due': {
          // 按截止时间排序
          const aDue = parseInt(a.due.timestamp);
          const bDue = parseInt(b.due.timestamp);
          comparison = aDue - bDue;
          break;
        }

        case 'created_at': {
          // 按创建时间排序
          const aCreated = parseInt(a.created_at);
          const bCreated = parseInt(b.created_at);
          comparison = aCreated - bCreated;
          break;
        }

        case 'score': {
          // 按综合评分排序
          const aScore = calculateScore(a, priorityWeights, urgencyThreshold);
          const bScore = calculateScore(b, priorityWeights, urgencyThreshold);
          comparison = aScore - bScore; // 得分高的在前
          break;
        }

        default:
          comparison = 0;
      }

      // 处理降序
      return order === 'desc' ? -comparison : comparison;
    });

    // 如果配置了将已完成任务排在最后
    if (completedAtBottom) {
      const completed: Task[] = [];
      const pending: Task[] = [];

      sorted.forEach((task) => {
        if (task.completion.is_completed) {
          completed.push(task);
        } else {
          pending.push(task);
        }
      });

      return [...pending, ...completed];
    }

    return sorted;
  }

  return { sort };
}