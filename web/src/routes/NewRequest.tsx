import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function NewRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      employeeName: formData.get('employeeName'),
      employeeEmail: formData.get('employeeEmail'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reason: formData.get('reason'),
      approverEmail: formData.get('approverEmail'),
    };

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create request');

      const result = await res.json();
      navigate({ to: '/requests/$id', params: { id: result.workflowId } });
    } catch (err) {
      setError('申請の送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title mb-6">新規休暇申請</h2>

      {error && <div className="alert-error mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* 申請者情報 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="form-label">申請者名</label>
            <input
              type="text"
              name="employeeName"
              required
              defaultValue="山田太郎"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">申請者メール</label>
            <input
              type="email"
              name="employeeEmail"
              required
              defaultValue="yamada@example.com"
              className="form-input"
            />
          </div>
        </div>

        {/* 休暇期間 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="form-label">開始日</label>
            <input
              type="date"
              name="startDate"
              required
              defaultValue={today}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">終了日</label>
            <input
              type="date"
              name="endDate"
              required
              defaultValue={today}
              className="form-input"
            />
          </div>
        </div>

        {/* 理由 */}
        <div>
          <label className="form-label">理由</label>
          <textarea
            name="reason"
            required
            rows={3}
            defaultValue="私用のため"
            className="form-input"
          />
        </div>

        {/* 承認者 */}
        <div>
          <label className="form-label">承認者メール</label>
          <input
            type="email"
            name="approverEmail"
            required
            defaultValue="manager@example.com"
            className="form-input"
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="btn-secondary"
          >
            キャンセル
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '送信中...' : '申請する'}
          </button>
        </div>
      </form>
    </div>
  );
}
