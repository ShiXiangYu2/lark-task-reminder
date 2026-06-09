/**
 * Lark Task Reminder - Type Definitions
 * Core type definitions for the application
 */

/**
 * Task priority levels
 */
export type TaskPriority = 'P0' | 'P1' | 'P2';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Task due date information
 */
export interface TaskDue {
  timestamp: string;
  is_all_day: boolean;
}

/**
 * Task completion information
 */
export interface TaskCompletion {
  is_completed: boolean;
  completed_at?: string;
}

/**
 * Task creator/member information
 */
export interface TaskMember {
  id: string;
  name: string;
}

/**
 * Task origin platform
 */
export interface TaskOrigin {
  platform_i18n_name: string;
}

/**
 * Lark Task
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Task description (optional) */
  description?: string;
  /** Due date information */
  due: TaskDue;
  /** Completion status */
  completion: TaskCompletion;
  /** Task creator */
  creator: TaskMember;
  /** Assigned member */
  member: TaskMember;
  /** Origin platform */
  origin: TaskOrigin;
  /** AI-generated summary (optional) */
  summary?: string;
  /** Task priority (optional) */
  priority?: TaskPriority;
  /** Task tags (optional) */
  tags?: string[];
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Reminder configuration
 */
export interface ReminderConfig {
  /** Enable reminder feature */
  enabled: boolean;
  /** Hours before due to send reminder */
  beforeHours: number;
  /** Repeat interval in minutes */
  repeatInterval: number;
  /** Maximum reminders per day */
  maxPerDay: number;
}

/**
 * Daily report
 */
export interface DailyReport {
  /** Report date */
  date: string;
  /** Total number of tasks */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Number of overdue tasks */
  overdueTasks: number;
  /** Upcoming due tasks */
  upcomingTasks: Task[];
  /** Tasks at risk */
  riskTasks: Task[];
  /** AI-generated summary */
  summary: string;
}

/**
 * Risk detection result
 */
export interface RiskReport {
  /** Overdue tasks */
  overdue: Task[];
  /** Urgent tasks (within 2 hours) */
  urgent: Task[];
  /** At-risk tasks */
  atRisk: Task[];
}

/**
 * Sort options for task list
 */
export interface SortOptions {
  /** Sort by field */
  field: 'due' | 'priority' | 'created_at';
  /** Sort order */
  order: 'asc' | 'desc';
}

/**
 * Filter criteria for task list
 */
export interface FilterCriteria {
  /** Filter by status */
  status?: TaskStatus;
  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Filter by keyword search */
  keyword?: string;
  /** Filter by priority */
  priority?: TaskPriority;
  /** Filter by tags */
  tags?: string[];
}

/**
 * Sync result
 */
export interface SyncResult {
  /** Number of added tasks */
  added: number;
  /** Number of updated tasks */
  updated: number;
  /** Number of deleted tasks */
  deleted: number;
  /** Last sync timestamp */
  lastSync: string;
}

/**
 * CLI output format
 */
export type OutputFormat = 'table' | 'json' | 'markdown';

/**
 * CLI command options
 */
export interface CLIOptions {
  /** Output format */
  format?: OutputFormat;
  /** Limit number of results */
  limit?: number;
  /** Status filter */
  status?: TaskStatus;
  /** Date filter */
  date?: string;
}

/**
 * Lark API configuration
 */
export interface LarkConfig {
  /** Lark app ID */
  appId: string;
  /** Lark app secret */
  appSecret: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  /** Lark API configuration */
  lark: LarkConfig;
  /** Reminder configuration */
  reminder: ReminderConfig;
  /** Notification configuration */
  notify: {
    channel: 'direct' | 'group';
    userId?: string;
    groupId?: string;
  };
  /** Schedule configuration */
  schedule: {
    dailyReport: string;
    checkInterval: number;
  };
  /** Storage configuration */
  storage: {
    dataDir: string;
    backupEnabled: boolean;
  };
}

// ============================================================================
// Task Factory Functions
// ============================================================================

/**
 * Input for creating a task
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: Date;
  tags?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Create a new task with default values
 */
export function createTask(input: CreateTaskInput): Task {
  const now = String(Math.floor(Date.now() / 1000));
  const dueTimestamp = input.dueAt
    ? String(Math.floor(input.dueAt.getTime() / 1000))
    : String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // Default: 7 days later

  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: input.title,
    description: input.description,
    priority: input.priority || 'P2',
    due: {
      timestamp: dueTimestamp,
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
      platform_i18n_name: 'lark-task-reminder',
    },
    tags: input.tags,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Validate task fields
 */
export function validateTask(task: Partial<Task>): ValidationResult {
  const errors: string[] = [];

  // Validate title
  if (!task.title || task.title.trim() === '') {
    errors.push('title: 标题不能为空');
  } else if (task.title.length > 500) {
    errors.push('title: 标题长度不能超过500字符');
  }

  // Validate priority
  if (task.priority && !['P0', 'P1', 'P2'].includes(task.priority)) {
    errors.push('priority: 无效的优先级，仅支持 P0/P1/P2');
  }

  // Validate due date
  if (task.due) {
    const dueTimestamp = parseInt(task.due.timestamp) * 1000;
    const now = Date.now();
    // Allow some buffer for timestamp parsing errors
    if (isNaN(dueTimestamp)) {
      errors.push('due: 无效的时间戳格式');
    } else if (dueTimestamp < now - 60 * 1000) {
      // 60 second buffer
      errors.push('due: 截止时间不能早于当前时间');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Task Status Helper Functions
// ============================================================================

/**
 * Task status utility functions
 */
export const TaskStatus = {
  /**
   * Check if task is pending (not completed)
   */
  isPending(task: Task): boolean {
    return !task.completion.is_completed;
  },

  /**
   * Check if task is completed
   */
  isCompleted(task: Task): boolean {
    return task.completion.is_completed;
  },

  /**
   * Check if task is overdue
   */
  isOverdue(task: Task): boolean {
    if (task.completion.is_completed) return false;
    const dueTime = parseInt(task.due.timestamp) * 1000;
    return dueTime < Date.now();
  },

  /**
   * Check if task is urgent (within 2 hours)
   */
  isUrgent(task: Task): boolean {
    if (task.completion.is_completed) return false;
    const dueTime = parseInt(task.due.timestamp) * 1000;
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    return dueTime - now <= twoHours && dueTime > now;
  },

  /**
   * Get task status text
   */
  getStatusText(task: Task): string {
    if (task.completion.is_completed) return '已完成';
    if (TaskStatus.isOverdue(task)) return '已超期';
    if (TaskStatus.isUrgent(task)) return '紧急';
    return '待处理';
  },
};