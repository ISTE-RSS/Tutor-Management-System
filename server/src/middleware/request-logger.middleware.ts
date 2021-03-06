import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, _: unknown, next: () => void): void {
    const user: string = req.user?._id ?? 'Not identified user';

    Logger.debug(`Request: ${user} -> ${req.path}@${req.method}`);
    next();
  }
}
