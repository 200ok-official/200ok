/* eslint-disable no-console */

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(log: LogMessage): string {
    const { level, message, timestamp, context } = log;
    let output = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += `\n${JSON.stringify(context, null, 2)}`;
    }

    return output;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logMessage: LogMessage = { level, message, timestamp, context };

    const formattedMessage = this.formatMessage(logMessage);

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.log(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // 在生產環境可以將日誌發送到外部服務（Sentry, Datadog, etc.）
    if (!this.isDevelopment) {
      // TODO: Send to external logging service
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  // API 請求日誌
  request(method: string, path: string, context?: Record<string, any>) {
    this.info(`${method} ${path}`, context);
  }

  // API 回應日誌
  response(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ) {
    this.info(`${method} ${path} - ${statusCode} (${duration}ms)`);
  }
}

export const logger = new Logger();

