import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';

interface RequestState {
  workflowId: string;
  request: {
    requestId: string;
    employeeName: string;
    employeeEmail: string;
    startDate: string;
    endDate: string;
    reason: string;
    approverEmail: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'cancelled';
  submittedAt: string;
  decision?: {
    approved: boolean;
    comment?: string;
    decidedBy: string;
  };
  cancelReason?: string;
  completed?: boolean;
}

const statusHeaderStyles = {
  pending: 'status-header-pending',
  approved: 'status-header-approved',
  rejected: 'status-header-rejected',
  timeout: 'status-header-timeout',
  cancelled: 'status-header-cancelled',
};

const statusLabels = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
  timeout: 'タイムアウト',
  cancelled: '取り消し',
};

export function RequestDetail() {
  const { id } = useParams({ from: '/requests/$id' });
  const [request, setRequest] = useState<RequestState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setRequest(data);
      setError(null);
    } catch (err) {
      setError('申請が見つかりません');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment || '承認しました' }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchRequest();
      setComment('');
    } catch (err) {
      setError('承認に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment || '却下しました' }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchRequest();
      setComment('');
    } catch (err) {
      setError('却下に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('この申請を取り消しますか？')) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/requests/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '申請者により取り消し' }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchRequest();
    } catch (err) {
      setError('取り消しに失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="alert-error">
        {error || '申請が見つかりません'}
        <Link to="/" className="link-retry">
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ナビゲーション */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="link-back">
          ← 一覧に戻る
        </Link>
      </div>

      {/* メインカード */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* ステータスヘッダー */}
        <div className={`px-6 py-4 border-b-2 ${statusHeaderStyles[request.status]}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">
              {statusLabels[request.status]}
            </span>
            <span className="text-sm opacity-75">ID: {request.workflowId}</span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 申請者・承認者情報 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="section-label">申請者</h3>
              <p className="text-lg">{request.request.employeeName}</p>
              <p className="text-sm text-gray-500">
                {request.request.employeeEmail}
              </p>
            </div>
            <div>
              <h3 className="section-label">承認者</h3>
              <p className="text-sm text-gray-600">
                {request.request.approverEmail}
              </p>
            </div>
          </div>

          {/* 休暇期間 */}
          <div>
            <h3 className="section-label">休暇期間</h3>
            <p className="text-lg">
              {request.request.startDate} 〜 {request.request.endDate}
            </p>
          </div>

          {/* 理由 */}
          <div>
            <h3 className="section-label">理由</h3>
            <p className="text-gray-700">{request.request.reason}</p>
          </div>

          {/* 申請日時 */}
          <div>
            <h3 className="section-label">申請日時</h3>
            <p className="text-gray-600">
              {new Date(request.submittedAt).toLocaleString('ja-JP')}
            </p>
          </div>

          {/* 決定内容 */}
          {request.decision && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="section-label mb-2">決定内容</h3>
              <p className="text-gray-700">
                <span className="font-medium">決定者:</span>{' '}
                {request.decision.decidedBy}
              </p>
              {request.decision.comment && (
                <p className="text-gray-700 mt-1">
                  <span className="font-medium">コメント:</span>{' '}
                  {request.decision.comment}
                </p>
              )}
            </div>
          )}

          {/* 取り消し理由 */}
          {request.status === 'cancelled' && request.cancelReason && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="section-label mb-2">取り消し理由</h3>
              <p className="text-gray-700">{request.cancelReason}</p>
            </div>
          )}
        </div>

        {/* 承認・却下アクション */}
        {request.status === 'pending' && (
          <div className="border-t bg-gray-50 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              承認・却下
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  コメント（任意）
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="コメントを入力..."
                  className="form-input"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="btn-success"
                >
                  {actionLoading ? '処理中...' : '承認する'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="btn-danger"
                >
                  {actionLoading ? '処理中...' : '却下する'}
                </button>
              </div>
            </div>

            {/* 取り消しボタン */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                申請者本人が取り消す場合
              </p>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
              >
                {actionLoading ? '処理中...' : '申請を取り消す'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
