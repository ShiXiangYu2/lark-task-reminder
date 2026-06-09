/**
 * Lark Task Reminder CLI
 * Command-line interface for managing Feishu/Lark tasks with smart reminders
 */

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { getConfig, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { formatTaskList, formatSuccess, formatError, formatInfo } from './cli/formatter.js';
import { createTaskSyncService } from './services/sync.js';
import { createTaskSortService } from './core/sort.js';
import type { SortField } from './core/sort.js';
import { createRiskDetectionService } from './core/risk.js';
import { createReminderService } from './services/reminder.js';
import { createDailyReportService } from './core/daily-report.js';
import type { OutputFormat } from './types/index.js';

const program = new Command();

/**
 * Initialize CLI application
 */
export function initCLI(): Command {
  program
    .name('lark-task-reminder')
    .description('飞书任务提醒工具 - 智能管理和提醒任务')
    .version('1.0.0');

  // Configure command
  program
    .command('config')
    .description('查看或配置应用设置')
    .option('-s, --show', '显示当前配置')
    .option('-v, --validate', '验证配置是否正确')
    .action((options) => {
      const config = getConfig();
      if (options.show) {
        console.log(formatInfo('当前配置:'));
        console.log(JSON.stringify(config, null, 2));
      }
      if (options.validate) {
        const result = validateConfig(config);
        if (result.valid) {
          console.log(formatSuccess('配置验证通过'));
        } else {
          console.log(formatError('配置验证失败:'));
          result.errors.forEach((err) => console.log(`  - ${err}`));
        }
      }
      if (!options.show && !options.validate) {
        console.log(formatInfo('使用 --show 查看配置，使用 --validate 验证配置'));
      }
    });

  // List tasks command
  program
    .command('list')
    .description('列出所有任务')
    .option('-f, --format <type>', '输出格式 (table|json|markdown)', 'table')
    .option('-s, --sort <field>', '排序字段 (priority|due|created|score)', 'priority')
    .option('-a, --all', '显示所有任务，包括已完成的')
    .action(async (options) => {
      logger.info('Listing tasks', options);
      const config = getConfig();
      const syncService = createTaskSyncService({ dataDir: config.storage.dataDir });

      try {
        let tasks = await syncService.loadTasks();

        // 过滤已完成任务
        if (!options.all) {
          tasks = tasks.filter((t) => !t.completion.is_completed);
        }

        // 排序
        const sortService = createTaskSortService();
        const order = 'asc' as const;
        tasks = sortService.sort(tasks, { field: options.sort as SortField, order });

        // 输出
        console.log(formatTaskList(tasks, options.format as OutputFormat));
        console.log(formatSuccess(`共 ${tasks.length} 个任务`));
      } catch (error) {
        console.log(formatError(`加载任务失败: ${error}`));
      }
    });

  // Sync command
  program
    .command('sync')
    .description('同步飞书任务到本地')
    .option('-f, --force', '强制全量同步')
    .action(async (options) => {
      logger.info('Syncing tasks', options);
      const config = getConfig();
      const syncService = createTaskSyncService({ dataDir: config.storage.dataDir });

      try {
        console.log(formatInfo('开始同步任务...'));
        const result = await syncService.sync(options.force);
        console.log(
          formatSuccess(
            `同步完成: 新增 ${result.added}, 更新 ${result.updated}, 删除 ${result.deleted}`
          )
        );
      } catch (error) {
        console.log(formatError(`同步失败: ${error}`));
      }
    });

  // Reminder command
  program
    .command('remind')
    .description('检查并发送提醒')
    .option('-t, --test', '测试模式，不发送实际通知')
    .action(async (options) => {
      logger.info('Checking reminders', options);
      const config = getConfig();
      const syncService = createTaskSyncService({ dataDir: config.storage.dataDir });
      const reminderService = createReminderService(config.reminder);

      try {
        const tasks = await syncService.loadTasks();
        const reminders = reminderService.checkReminders(tasks);

        if (reminders.length === 0) {
          console.log(formatInfo('暂无需要提醒的任务'));
        } else {
          console.log(formatInfo(`发现 ${reminders.length} 个需要提醒的任务:`));
          reminders.forEach((r) => {
            console.log(`  - ${r.message}`);
          });
        }
      } catch (error) {
        console.log(formatError(`检查提醒失败: ${error}`));
      }
    });

  // Daily report command
  program
    .command('report')
    .description('生成每日任务报告')
    .option('-d, --date <date>', '指定日期 (YYYY-MM-DD)', '')
    .option('-o, --output <file>', '输出文件路径', '')
    .action(async (options) => {
      logger.info('Generating daily report', options);
      const config = getConfig();
      const syncService = createTaskSyncService({ dataDir: config.storage.dataDir });
      const reportService = createDailyReportService();

      try {
        const tasks = await syncService.loadTasks();
        const report = reportService.generateReport(tasks, { date: options.date });

        console.log(formatInfo('📋 每日任务报告'));
        console.log(`日期: ${report.date}`);
        console.log(`总任务: ${report.totalTasks}`);
        console.log(`已完成: ${report.completedTasks}`);
        console.log(`超期: ${report.overdueTasks}`);
        console.log(`今日到期: ${report.upcomingTasks.length}`);
        console.log(`风险任务: ${report.riskTasks.length}`);

        // 如果指定了输出文件
        if (options.output) {
          const markdown = reportService.generateMarkdownReport(tasks, { date: options.date });
          writeFileSync(options.output, markdown, 'utf-8');
          console.log(formatSuccess(`报告已保存到 ${options.output}`));
        }
      } catch (error) {
        console.log(formatError(`生成报告失败: ${error}`));
      }
    });

  // Risk command
  program
    .command('risk')
    .description('显示风险任务')
    .action(async () => {
      logger.info('Checking risk tasks');
      const config = getConfig();
      const syncService = createTaskSyncService({ dataDir: config.storage.dataDir });
      const riskService = createRiskDetectionService();

      try {
        const tasks = await syncService.loadTasks();
        const report = riskService.detect(tasks);

        if (report.overdue.length > 0) {
          console.log(formatError(`⚠️ 超期任务: ${report.overdue.length} 个`));
        }
        if (report.urgent.length > 0) {
          console.log(formatInfo(`🔔 紧急任务: ${report.urgent.length} 个`));
        }
        if (report.atRisk.length > 0) {
          console.log(formatInfo(`📊 高风险任务: ${report.atRisk.length} 个`));
        }

        if (report.overdue.length === 0 && report.urgent.length === 0) {
          console.log(formatSuccess('✅ 所有任务状态正常'));
        }
      } catch (error) {
        console.log(formatError(`检查风险任务失败: ${error}`));
      }
    });

  return program;
}

/**
 * Run CLI application
 */
export async function runCLI(args: string[] = process.argv): Promise<void> {
  const program = initCLI();

  try {
    await program.parseAsync(args);
  } catch (error) {
    logger.error('CLI error', error);
    console.log(formatError('执行命令时发生错误'));
    process.exit(1);
  }
}

// Run CLI if this is the main module
runCLI();