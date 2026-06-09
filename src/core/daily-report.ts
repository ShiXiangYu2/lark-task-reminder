/**
 * Daily Report Service
 * 每日报告服务 - 生成任务日报
 */

import { logger } from '../utils/logger.js';
import type { Task, DailyReport } from '../types/index.js';

/**
 * 报告配置
 */
export interface DailyReportConfig {
  /** 报告日期 */
  date?: string;
  /** 是否包含风险分析 */
  includeRiskAnalysis?: boolean;
}

/**
 * 每日报告服务接口
 */
export interface DailyReportService {
  /** 生成每日报告 */
  generateReport(tasks: Task[], config?: DailyReportConfig): DailyReport;
  /** 生成 Markdown 格式报告 */
  generateMarkdownReport(tasks: Task[], config?: DailyReportConfig): string;
}

/**
 * 创建每日报告服务实例
 */
export function createDailyReportService(): DailyReportService {
  /**
   *统计数据
   */
  function calculateStats(tasks: Task[]): {
    total: number;
    completed: number;
    overdue: number;
    pending: number;
  } {
    const now = Date.now() / 1000;
    const todayEnd = now + (24 * 60 * 60 - ((now % (24 * 60 * 60))));

    const total = tasks.length;
    let completed = 0;
    let overdue = 0;
    let pending = 0;

    tasks.forEach((task) => {
      if (task.completion.is_completed) {
        completed++;
      } else {
        const dueTime = parseInt(task.due.timestamp);
        if (dueTime < now) {
          overdue++;
        } else if (dueTime <= todayEnd) {
          pending++;
        }
      }
    });

    return { total, completed, overdue, pending };
  }

  /**
   * 生成每日报告
   */
  function generateReport(tasks: Task[], config: DailyReportConfig = {}): DailyReport {
    const date = config.date || new Date().toISOString().split('T')[0];
    const stats = calculateStats(tasks);

    //筛选今日到期和超期任务
    const now = Date.now() / 1000;
    const todayEnd = now + (24 * 60 * 60 - ((now % (24 * 60 * 60))));

    const upcomingTasks = tasks.filter((task) => {
      if (task.completion.is_completed) return false;
      const dueTime = parseInt(task.due.timestamp);
      return dueTime > now && dueTime <= todayEnd;
    });

    // 风险任务
    const riskTasks = tasks.filter((task) => {
      if (task.completion.is_completed) return false;
      const dueTime = parseInt(task.due.timestamp);
      return dueTime < now || (dueTime <= now + 2 * 60 * 60);
    });

    // 生成摘要
    let summary = `今日任务统计：共 ${stats.total} 个任务`;
    summary += `，已完成 ${stats.completed} 个`;
    if (stats.overdue > 0) {
      summary += `，超期 ${stats.overdue} 个`;
    }
    if (stats.pending > 0) {
      summary += `，今日到期 ${stats.pending} 个`;
    }

    logger.info('Daily report generated', { date, total: stats.total });

    return {
      date,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      overdueTasks: stats.overdue,
      upcomingTasks,
      riskTasks,
      summary,
    };
  }

  /**
   * 生成 Markdown 格式报告
   */
  function generateMarkdownReport(tasks: Task[], config: DailyReportConfig = {}): string {
    const report = generateReport(tasks, config);
    const lines: string[] = [];

    lines.push(`# 📋 每日任务报告 - ${report.date}`);
    lines.push('');
    lines.push('## 📊 统计概览');
    lines.push(`| 指标 | 数量 |`);
    lines.push(`|------|------|`);
    lines.push(`| 总任务数 | ${report.totalTasks} |`);
    lines.push(`| 已完成 | ${report.completedTasks} |`);
    lines.push(`| 超期 | ${report.overdueTasks} |`);
    lines.push(`| 今日到期 | ${report.upcomingTasks.length} |`);
    lines.push(`| 风险任务 | ${report.riskTasks.length} |`);
    lines.push('');

    if (report.overdueTasks > 0) {
      lines.push('## ⚠️ 超期任务');
      report.riskTasks
        .filter((t) => !t.completion.is_completed && parseInt(t.due.timestamp) < Date.now() / 1000)
        .forEach((task) => {
          lines.push(`- [${task.priority || '无优先级'}] ${task.title}`);
        });
      lines.push('');
    }

    if (report.upcomingTasks.length > 0) {
      lines.push('##🔔 今日到期任务');
      report.upcomingTasks.forEach((task) => {
        lines.push(`- [${task.priority || '无优先级'}] ${task.title}`);
      });
      lines.push('');
    }

    lines.push('## 📝 摘要');
    lines.push(report.summary);

    return lines.join('\n');
  }

  return {
    generateReport,
    generateMarkdownReport,
  };
}