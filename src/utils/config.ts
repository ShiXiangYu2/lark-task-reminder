/**
 * Configuration Manager
 * Loads and manages application configuration
 */

import { config as dotenvConfig } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { AppConfig } from '../types/index.js';

// Load .env file
dotenvConfig();

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  lark: {
    appId: process.env.LARK_APP_ID || '',
    appSecret: process.env.LARK_APP_SECRET || '',
  },
  reminder: {
    enabled: true,
    beforeHours: 2,
    repeatInterval: 60,
    maxPerDay: 10,
  },
  notify: {
    channel: 'direct',
    userId: process.env.LARK_USER_ID || '',
    groupId: process.env.LARK_GROUP_ID || '',
  },
  schedule: {
    dailyReport: '09:00',
    checkInterval: 30,
  },
  storage: {
    dataDir: './data',
    backupEnabled: true,
  },
};

/**
 * Load configuration from file
 */
export function loadConfigFromFile(configPath?: string): Partial<AppConfig> {
  const path = configPath || resolve(process.cwd(), 'config.json');

  if (!existsSync(path)) {
    return {};
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load config from ${path}:`, error);
    return {};
  }
}

/**
 * Merge configurations with priority: env > file > default
 */
export function mergeConfig(fileConfig: Partial<AppConfig> = {}): AppConfig {
  return {
    lark: {
      appId: process.env.LARK_APP_ID || fileConfig.lark?.appId || DEFAULT_CONFIG.lark.appId,
      appSecret: process.env.LARK_APP_SECRET || fileConfig.lark?.appSecret || DEFAULT_CONFIG.lark.appSecret,
    },
    reminder: {
      ...DEFAULT_CONFIG.reminder,
      ...fileConfig.reminder,
    },
    notify: {
      ...DEFAULT_CONFIG.notify,
      ...fileConfig.notify,
    },
    schedule: {
      ...DEFAULT_CONFIG.schedule,
      ...fileConfig.schedule,
    },
    storage: {
      ...DEFAULT_CONFIG.storage,
      ...fileConfig.storage,
    },
  };
}

/**
 * Get application configuration
 */
export function getConfig(configPath?: string): AppConfig {
  const fileConfig = loadConfigFromFile(configPath);
  return mergeConfig(fileConfig);
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.lark.appId) {
    errors.push('LARK_APP_ID is required');
  }

  if (!config.lark.appSecret) {
    errors.push('LARK_APP_SECRET is required');
  }

  if (config.reminder.beforeHours < 0) {
    errors.push('reminder.beforeHours must be non-negative');
  }

  if (config.reminder.maxPerDay < 1) {
    errors.push('reminder.maxPerDay must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export { DEFAULT_CONFIG };