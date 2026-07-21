import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const isProd = process.env.NODE_ENV === 'production';
    const correlationId =
      request.correlationId ||
      (request.headers['x-correlation-id'] as string | undefined) ||
      undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>;
        message = (record.message as string | string[]) ?? message;
        error = (record.error as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (!isProd) {
        message = exception.message;
      }
    } else {
      this.logger.error(`Unhandled exception: ${String(exception)}`);
    }

    const payload: Record<string, unknown> = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    if (correlationId) {
      payload.correlationId = correlationId;
    }
    if (!isProd && exception instanceof Error && !(exception instanceof HttpException)) {
      payload.stack = exception.stack;
    }

    response.status(status).json(payload);
  }
}
