/**
 * Lark Task Reminder CLI
 * Command-line interface for managing Feishu/Lark tasks with smart reminders
 */

import { Command } from 'commander';
import { getConfig, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { formatSuccess, formatError, formatInfo } from './cli/formatter.js';

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
    .option('-s, --sort<field>', '排序字段 (priority|due|created)', 'priority')
    .option('-a, --all', '显示所有任务，包括已完成的')
    .action((options) => {
      logger.info('Listing tasks', options);
      // TODO: Implement task listing
      console.log(formatInfo('任务列表功能开发中...'));
      console.log(formatInfo('提示: 需要先配置 LARK_APP_ID 和 LARK_APP_SECRET'));
    });

  // Sync command
  program
    .command('sync')
    .description('同步飞书任务到本地')
    .option('-f, --force', '强制全量同步')
    .action((options) => {
      logger.info('Syncing tasks', options);
      // TODO: Implement task sync
      console.log(formatInfo('任务同步功能开发中...'));
    });

  // Reminder command
  program
    .command('remind')
    .description('检查并发送提醒')
    .option('-t, --test', '测试模式，不发送实际通知')
    .action((options) => {
      logger.info('Checking reminders', options);
      // TODO: Implement reminders
      console.log(formatInfo('提醒检查功能开发中...'));
    });

  // Daily report command
  program
    .command('report')
    .description('生成每日任务报告')
    .option('-d, --date <date>', '指定日期 (YYYY-MM-DD)', '')
    .option('-o, --output <file>', '输出文件路径', '')
    .action((options) => {
      logger.info('Generating daily report', options);
      // TODO: Implement daily report
      console.log(formatInfo('每日报告功能开发中...'));
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