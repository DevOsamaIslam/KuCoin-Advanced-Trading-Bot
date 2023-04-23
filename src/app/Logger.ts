import { createLogger, format, transports, Logger as WinstonLogger } from 'winston'
import * as path from 'path'
import * as fs from 'fs'

class Logger {
  private static instance: Logger
  private logger: WinstonLogger
  private logDirectoryPath: string = ''
  private logFileName: string = ''

  private constructor() {
    this.createLogsDirectory()
    this.createLogFile()
    this.logger = createLogger({
      level: 'verbose',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`),
      ),
      transports: [
        new transports.File({
          filename: path.join(this.logDirectoryPath, this.logFileName),
        }),
      ],
    })
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }

    return Logger.instance
  }

  public verbose(...message: unknown[]): void {
    this.checkLogFile()
    const log = message.map(msg => {
      if (typeof msg === 'object') msg = JSON.stringify(msg)
      return msg
    })
    this.logger.verbose(log.join(' | '))
  }

  public info(...message: unknown[]): void {
    this.checkLogFile()
    const log = message.map(msg => {
      if (typeof msg === 'object') msg = JSON.stringify(msg)
      return msg
    })
    this.logger.info(log.join(' | '))
  }

  public warn(...message: unknown[]): void {
    this.checkLogFile()
    const log = message.map(msg => {
      if (typeof msg === 'object') msg = JSON.stringify(msg)
      return msg
    })
    this.logger.warn(log.join(' | '))
  }

  public error(...message: unknown[]): void {
    this.checkLogFile()
    const log = message.map(msg => {
      if (typeof msg === 'object') msg = JSON.stringify(msg)
      return msg
    })
    this.logger.error(log.join(' | '))
  }

  private createLogsDirectory(): void {
    this.logDirectoryPath = path.join('src', 'logs')
    if (!fs.existsSync(this.logDirectoryPath)) {
      fs.mkdirSync(this.logDirectoryPath)
    }
  }

  private createLogFile(): void {
    const now = new Date()
    const dateString = now.toISOString().slice(0, 10)
    this.logFileName = `${dateString}.log`
  }

  private checkLogFile(): void {
    const now = new Date()
    const dateString = now.toISOString().slice(0, 10)
    if (dateString !== this.logFileName.slice(0, 10)) {
      // If the date has changed since the last log file was created,
      // create a new log file with the current date in the filename
      this.createLogFile()
      this.logger = createLogger({
        level: 'verbose',
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`),
        ),
        transports: [
          new transports.File({
            filename: path.join(this.logDirectoryPath, this.logFileName),
          }),
        ],
      })
    }
  }
}

export default Logger
