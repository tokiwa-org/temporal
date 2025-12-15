import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';

interface LeaveRequest {
  workflowId: string;
  request: {
    requestId: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'cancelled';
  submittedAt: string;
}

const badgeStyles = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  timeout: 'badge-timeout',
  cancelled: 'badge-cancelled',
};

const statusLabels = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
  timeout: 'タイムアウト',
  cancelled: '取り消し',
};

export function RequestList() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError('申請一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error">
        {error}
        <button onClick={fetchRequests} className="link-retry">
          再試行
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">申請一覧</h2>
        <button onClick={fetchRequests} className="btn-ghost">
          更新
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center text-gray-500">
          申請がありません。
          <Link to="/new" className="block mt-4 link">
            新規申請を作成する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link
              key={req.workflowId}
              to="/requests/$id"
              params={{ id: req.workflowId }}
              className="block card-hover"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">
                      {req.request.employeeName}
                    </span>
                    <span className={`badge ${badgeStyles[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {req.request.startDate} 〜 {req.request.endDate}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {req.request.reason}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(req.submittedAt).toLocaleString('ja-JP')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
