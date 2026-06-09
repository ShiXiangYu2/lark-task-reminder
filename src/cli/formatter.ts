/**
 * CLI Formatter
 * Formats output for CLI display
 */

import chalk from 'chalk';
import type { Task, OutputFormat } from '../types/index.js';

/**
 * Format a single task for display
 */
export function formatTask(task: Task): string {
  const isOverdue = isTaskOverdue(task);
  const isUrgent = isTaskUrgent(task);

  let priorityIcon = '  ';
  if (task.priority === 'P0') {
    priorityIcon = isOverdue ? chalk.red('🔴') : chalk.red('🔴');
  } else if (task.priority === 'P1') {
    priorityIcon = isUrgent ? chalk.yellow('🟡') : chalk.yellow('🟡');
  } else {
    priorityIcon = chalk.green('🟢');
  }

  const dueText = formatDueText(task);
  const statusText = task.completion.is_completed
    ? chalk.green('✓')
    : isOverdue
      ? chalk.red('⚠️ 超期')
      : isUrgent
        ? chalk.yellow('⏰ 紧急')
        : chalk.gray('📋');

  const tagsText = task.tags?.length
    ? chalk.gray(` [${task.tags.join(', ')}]`)
    : '';

  return `${priorityIcon} [${chalk.gray(task.priority || 'P2')}] ${chalk.white(task.title)}${tagsText} - ${dueText} ${statusText}`;
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.completion.is_completed) return false;
  const now = Date.now();
  const dueTime = parseInt(task.due.timestamp) * 1000;
  return dueTime < now;
}

/**
 * Check if task is urgent (within 2 hours)
 */
export function isTaskUrgent(task: Task): boolean {
  if (task.completion.is_completed) return false;
  const now = Date.now();
  const dueTime = parseInt(task.due.timestamp) * 1000;
  const twoHours = 2 * 60 * 60 * 1000;
  return dueTime - now <= twoHours && dueTime > now;
}

/**
 * Format due date text
 */
export function formatDueText(task: Task): string {
  const dueTime = parseInt(task.due.timestamp) * 1000;
  const now = Date.now();
  const diff = dueTime - now;

  if (task.completion.is_completed) {
    return chalk.green('已完成');
  }

  if (diff < 0) {
    const daysOverdue = Math.floor(Math.abs(diff) / (24 * 60 * 60 * 1000));
    return chalk.red(`超期 ${daysOverdue} 天`);
  }

  const hoursLeft = Math.floor(diff / (60 * 60 * 1000));
  const minutesLeft = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hoursLeft < 1) {
    return chalk.red(`${minutesLeft} 分钟后`);
  } else if (hoursLeft < 24) {
    return chalk.yellow(`${hoursLeft} 小时后`);
  } else {
    const daysLeft = Math.floor(hoursLeft / 24);
    return chalk.gray(`${daysLeft} 天后`);
  }
}

/**
 * Format task list for table display
 */
export function formatTaskTable(tasks: Task[]): string {
  if (tasks.length === 0) {
    return chalk.yellow('暂无任务');
  }

  const lines: string[] = [];
  lines.push(chalk.bold('\n📋 任务列表'));
  lines.push(chalk.gray('─'.repeat(60)));

  tasks.forEach((task, index) => {
    lines.push(`${index + 1}. ${formatTask(task)}`);
  });

  lines.push(chalk.gray('─'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format task list for JSON output
 */
export function formatTaskJson(tasks: Task[]): string {
  return JSON.stringify(tasks, null, 2);
}

/**
 * Format task list for Markdown output
 */
export function formatTaskMarkdown(tasks: Task[]): string {
  if (tasks.length === 0) {
    return '暂无任务\n';
  }

  const lines: string[] = [];
  lines.push('## 任务列表\n');

  tasks.forEach((task, index) => {
    const checkbox = task.completion.is_completed ? '[x]' : '[ ]';
    lines.push(`${index + 1}. ${checkbox} **${task.title}**`);
    if (task.due) {
      lines.push(`   - 截止: ${new Date(parseInt(task.due.timestamp) * 1000).toLocaleString()}`);
    }
    if (task.priority) {
      lines.push(`   - 优先级: ${task.priority}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format task list based on output format
 */
export function formatTaskList(tasks: Task[], format: OutputFormat = 'table'): string {
  switch (format) {
    case 'json':
      return formatTaskJson(tasks);
    case 'markdown':
      return formatTaskMarkdown(tasks);
    case 'table':
    default:
      return formatTaskTable(tasks);
  }
}

/**
 * Format section header
 */
export function formatHeader(text: string): string {
  return chalk.bold.cyan(`\n${text}\n${'─'.repeat(text.length)}`);
}

/**
 * Format success message
 */
export function formatSuccess(text: string): string {
  return chalk.green(`✅ ${text}`);
}

/**
 * Format error message
 */
export function formatError(text: string): string {
  return chalk.red(`❌ ${text}`);
}

/**
 * Format warning message
 */
export function formatWarning(text: string): string {
  return chalk.yellow(`⚠️ ${text}`);
}

/**
 * Format info message
 */
export function formatInfo(text: string): string {
  return chalk.blue(`ℹ️ ${text}`);
}