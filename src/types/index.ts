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