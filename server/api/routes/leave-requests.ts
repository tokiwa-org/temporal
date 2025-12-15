import { Router, Request, Response } from 'express';
import { LeaveRequestService } from '../../services/leave-request.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

/**
 * 休暇申請ルートを作成
 * @param service LeaveRequestServiceインスタンス
 */
export function createLeaveRequestRoutes(service: LeaveRequestService): Router {
  const router = Router();

  /**
   * GET /api/requests
   * 申請一覧を取得
   */
  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
      const requests = await service.listPending();
      res.json(requests);
    })
  );

  /**
   * POST /api/requests
   * 新規申請を作成
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const { employeeName, employeeEmail, startDate, endDate, reason, approverEmail } = req.body;

      // バリデーション
      if (!employeeName || !employeeEmail || !startDate || !endDate || !reason || !approverEmail) {
        throw new ValidationError('必須項目が入力されていません');
      }

      const result = await service.submit({
        employeeName,
        employeeEmail,
        startDate,
        endDate,
        reason,
        approverEmail,
      });

      res.status(201).json(result);
    })
  );

  /**
   * GET /api/requests/:id
   * 申請詳細を取得
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const request = await service.getById(req.params.id);

      if (!request) {
        throw new NotFoundError();
      }

      res.json(request);
    })
  );

  /**
   * POST /api/requests/:id/approve
   * 申請を承認
   */
  router.post(
    '/:id/approve',
    asyncHandler(async (req: Request, res: Response) => {
      const { comment, decidedBy } = req.body;
      await service.approve(req.params.id, comment, decidedBy);
      res.json({ success: true, message: '承認しました' });
    })
  );

  /**
   * POST /api/requests/:id/reject
   * 申請を却下
   */
  router.post(
    '/:id/reject',
    asyncHandler(async (req: Request, res: Response) => {
      const { comment, decidedBy } = req.body;
      await service.reject(req.params.id, comment, decidedBy);
      res.json({ success: true, message: '却下しました' });
    })
  );

  /**
   * POST /api/requests/:id/cancel
   * 申請を取り消し
   */
  router.post(
    '/:id/cancel',
    asyncHandler(async (req: Request, res: Response) => {
      const { reason } = req.body;
      await service.cancel(req.params.id, reason);
      res.json({ success: true, message: '申請を取り消しました' });
    })
  );

  return router;
}
