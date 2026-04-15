import winston from 'winston'
import { getEnv } from './env'

const level = () => {
  try {
    return getEnv().LOG_LEVEL
  } catch {
    return 'info'
  }
}

export const logger = winston.createLogger({
  level: level(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level: lv, message, timestamp, stack }) => {
          return `${String(timestamp)} [${lv}] ${stack ?? message}`
        }),
      ),
    }),
  ],
})
