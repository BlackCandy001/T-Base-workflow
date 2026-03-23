import { Request, Response, NextFunction } from 'express'
import { createLogger } from '../utils/logger'

const logger = createLogger('HTTP')

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`)
  })

  next()
}
