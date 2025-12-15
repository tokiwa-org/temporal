import { Request, Response, NextFunction } from 'express';
import { WorkflowNotFoundError } from '@temporalio/client';

/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '申請が見つかりません') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

/**
 * 統一エラーハンドリングミドルウェア
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // AppError（カスタムエラー）
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.name,
    });
    return;
  }

  // Temporal WorkflowNotFoundError
  if (err instanceof WorkflowNotFoundError) {
    res.status(404).json({
      error: '申請が見つかりません',
      code: 'WorkflowNotFound',
    });
    return;
  }

  // その他のエラー
  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    code: 'InternalError',
  });
}

/**
 * async/await対応のルートハンドララッパー
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
