import { LeaveRequest, LeaveRequestResult } from '../types/leave-request';

/**
 * 承認者に通知を送信するアクティビティ
 * 実際の実装では、メールやSlack通知を行う
 */
export async function notifyApprover(request: LeaveRequest): Promise<void> {
  console.log(`
========================================
[通知] 承認者への通知
========================================
宛先: ${request.approverEmail}
件名: 休暇申請の承認依頼

${request.employeeName}さんから休暇申請が届いています。

申請ID: ${request.requestId}
期間: ${request.startDate} 〜 ${request.endDate}
理由: ${request.reason}

承認する場合: npm run approve -- ${request.requestId}
却下する場合: npm run reject -- ${request.requestId}
========================================
  `);
}

/**
 * 申請者に結果を通知するアクティビティ
 */
export async function notifyEmployee(
  request: LeaveRequest,
  result: LeaveRequestResult
): Promise<void> {
  const statusText = {
    approved: '承認されました',
    rejected: '却下されました',
    timeout: 'タイムアウトにより自動却下されました',
    pending: '処理中',
    cancelled: '申請者により取り消されました',
  }[result.status];

  console.log(`
========================================
[通知] 申請者への結果通知
========================================
宛先: ${request.employeeEmail}
件名: 休暇申請の結果

${request.employeeName}さん、

休暇申請（${request.startDate} 〜 ${request.endDate}）は
${statusText}

${result.decision?.comment ? `コメント: ${result.decision.comment}` : ''}
========================================
  `);
}

/**
 * リマインダー通知を送信するアクティビティ
 */
export async function sendReminder(request: LeaveRequest): Promise<void> {
  console.log(`
========================================
[リマインダー] 承認待ちの申請があります
========================================
宛先: ${request.approverEmail}

${request.employeeName}さんの休暇申請が未承認です。
申請ID: ${request.requestId}
========================================
  `);
}
