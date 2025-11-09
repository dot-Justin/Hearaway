/**
 * Centralized logging utility for Hearaway
 * - Debug logs only appear in development
 * - Errors and warnings always logged
 */

const logger = {
  /**
   * Debug logging - only appears in development mode
   */
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },

  /**
   * Error logging - always logged
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /**
   * Warning logging - always logged
   */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /**
   * Info logging - always logged
   */
  info: (...args: unknown[]) => {
    console.info(...args);
  },
};

export default logger;
