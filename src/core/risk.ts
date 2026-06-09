/**
 * Risk Detection Service
 * 风险检测引擎 - 识别超期、紧急和高风险任务
 */

import type { Task, RiskReport } from '../types/index.js';

/**
 * 风险因素配置
 */
export interface RiskConfig {
  /** 紧急阈值（秒） - 默认2小时 */
  urgencyThreshold?: number;
  /** 风险因素权重 */
  riskFactors?: {
    noDue?: number;
    highPriority?: number;
    overdue?: number;
    longDuration?: number;
  };
}

/**
 * 风险检测服务接口
 */
export interface RiskDetectionService {
  /** 检测任务风险 */
  detect(tasks: Task[]): RiskReport;
  /** 生成风险摘要 */
  generateSummary(report: RiskReport): string;
}

/**
 * 默认风险因素权重
 */
const DEFAULT_RISK_FACTORS = {
  noDue: 10,
  highPriority: 20,
  overdue: 30,
  longDuration: 15,
};

/**
 * 创建风险检测服务实例
 */
export function createRiskDetectionService(config: RiskConfig = {}): RiskDetectionService {
  const {
    urgencyThreshold = 2 * 60 * 60, // 2小时（秒）
    riskFactors = DEFAULT_RISK_FACTORS,
  } = config;

  /**
   * 检测任务是否超期
   */
  function isOverdue(task: Task): boolean {
    if (task.completion.is_completed) return false;
    if (!task.due) return false;
    const now = Date.now() / 1000;
    const dueTime = parseInt(task.due.timestamp);
    return dueTime < now;
  }

  /**
   * 检测任务是否紧急（2小时内到期）
   */
  function isUrgent(task: Task): boolean {
    if (task.completion.is_completed) return false;
    if (!task.due) return false;
    const now = Date.now() / 1000;
    const dueTime = parseInt(task.due.timestamp);
    const timeDiff = dueTime - now;
    return timeDiff > 0 && timeDiff <= urgencyThreshold;
  }

  /**
   * 计算任务风险得分
   */
  function calculateRiskScore(task: Task): number {
    let score = 0;

    // 超期风险
    if (isOverdue(task)) {
      score += riskFactors.overdue ?? DEFAULT_RISK_FACTORS.overdue;
    }

    // 高优先级风险
    if (task.priority === 'P0') {
      score += riskFactors.highPriority ?? DEFAULT_RISK_FACTORS.highPriority;
    }

    // 无截止时间风险
    if (!task.due) {
      score += riskFactors.noDue ?? DEFAULT_RISK_FACTORS.noDue;
    }

    // 长期任务风险（超过30天）
    if (task.due) {
      const now = Date.now() / 1000;
      const dueTime = parseInt(task.due.timestamp);
      const duration = dueTime - now;
      if (duration > 30 * 24 * 60 * 60) {
        // 超过30天
        score += riskFactors.longDuration ?? DEFAULT_RISK_FACTORS.longDuration;
      }
    }

    return score;
  }

  /**
   * 检测任务风险
   */
  function detect(tasks: Task[]): RiskReport {
    const overdue: Task[] = [];
    const urgent: Task[] = [];
    const atRisk: Task[] = [];

    tasks.forEach((task) => {
      // 检测超期任务
      if (isOverdue(task)) {
        overdue.push(task);
      }

      // 检测紧急任务
      if (isUrgent(task)) {
        urgent.push(task);
      }

      // 检测高风险任务
      if (calculateRiskScore(task) > 0) {
        atRisk.push(task);
      }
    });

    return { overdue, urgent, atRisk };
  }

  /**
   * 生成风险摘要
   */
  function generateSummary(report: RiskReport): string {
    const lines: string[] = [];

    if (report.overdue.length > 0) {
      lines.push(`⚠️ 超期任务: ${report.overdue.length} 个`);
      report.overdue.forEach((task) => {
        lines.push(`  - [${task.priority || '无优先级'}] ${task.title}`);
      });
    }

    if (report.urgent.length > 0) {
      lines.push(`🔔 紧急任务: ${report.urgent.length} 个`);
      report.urgent.forEach((task) => {
        lines.push(`  - [${task.priority || '无优先级'}] ${task.title}`);
      });
    }

    if (report.atRisk.length > 0) {
      lines.push(`📊 高风险任务: ${report.atRisk.length} 个`);
      report.atRisk.forEach((task) => {
        lines.push(`  - [${task.priority || '无优先级'}] ${task.title}`);
      });
    }

    if (lines.length === 0) {
      return '✅ 所有任务状态正常，无风险';
    }

    return lines.join('\n');
  }

  return {
    detect,
    generateSummary,
  };
}