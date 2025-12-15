import { Client, Connection } from '@temporalio/client';
import { leaveRequestWorkflow, approvalSignal, getStateQuery } from './temporal/workflows';
import { LeaveRequest } from './types/leave-request';
import { TASK_QUEUE } from './shared';

async function getClient(): Promise<Client> {
  const connection = await Connection.connect();
  return new Client({ connection });
}

// 休暇申請を提出
async function submitRequest() {
  const client = await getClient();

  const requestId = `leave-${Date.now()}`;
  const request: LeaveRequest = {
    requestId,
    employeeName: '山田太郎',
    employeeEmail: 'yamada@example.com',
    startDate: '2024-12-20',
    endDate: '2024-12-25',
    reason: '年末年始の帰省',
    approverEmail: 'manager@example.com',
  };

  const handle = await client.workflow.start(leaveRequestWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId: requestId,
    args: [request],
  });

  console.log(`
休暇申請を提出しました。

ワークフローID: ${handle.workflowId}
申請者: ${request.employeeName}
期間: ${request.startDate} 〜 ${request.endDate}

状態確認: npm run status -- ${requestId}
承認:     npm run approve -- ${requestId}
却下:     npm run reject -- ${requestId}
  `);
}

// 承認する
async function approveRequest(workflowId: string, comment?: string) {
  const client = await getClient();
  const handle = client.workflow.getHandle(workflowId);

  await handle.signal(approvalSignal, {
    approved: true,
    comment: comment || '承認しました',
    decidedBy: 'manager@example.com',
  });

  console.log(`申請 ${workflowId} を承認しました。`);
}

// 却下する
async function rejectRequest(workflowId: string, comment?: string) {
  const client = await getClient();
  const handle = client.workflow.getHandle(workflowId);

  await handle.signal(approvalSignal, {
    approved: false,
    comment: comment || '却下しました',
    decidedBy: 'manager@example.com',
  });

  console.log(`申請 ${workflowId} を却下しました。`);
}

// 状態を確認
async function checkStatus(workflowId: string) {
  const client = await getClient();
  const handle = client.workflow.getHandle(workflowId);

  try {
    const state = await handle.query(getStateQuery);

    console.log(`
========================================
申請状態
========================================
申請ID: ${state.request.requestId}
申請者: ${state.request.employeeName}
期間: ${state.request.startDate} 〜 ${state.request.endDate}
理由: ${state.request.reason}

ステータス: ${state.status}
申請日時: ${state.submittedAt}
${
  state.decision
    ? `
決定者: ${state.decision.decidedBy}
コメント: ${state.decision.comment || 'なし'}
`
    : ''
}
========================================
    `);
  } catch (error) {
    // ワークフローが完了している場合は結果を取得
    const result = await handle.result();
    console.log('ワークフロー完了:', result);
  }
}

// メイン処理
async function main() {
  const [, , command, workflowId, comment] = process.argv;

  switch (command) {
    case 'submit':
      await submitRequest();
      break;
    case 'approve':
      if (!workflowId) {
        console.error('Usage: npm run approve -- <workflowId> [comment]');
        process.exit(1);
      }
      await approveRequest(workflowId, comment);
      break;
    case 'reject':
      if (!workflowId) {
        console.error('Usage: npm run reject -- <workflowId> [comment]');
        process.exit(1);
      }
      await rejectRequest(workflowId, comment);
      break;
    case 'status':
      if (!workflowId) {
        console.error('Usage: npm run status -- <workflowId>');
        process.exit(1);
      }
      await checkStatus(workflowId);
      break;
    default:
      console.log(`
休暇申請アプリ - 使い方

npm run submit              # 新しい休暇申請を提出
npm run status -- <id>      # 申請状態を確認
npm run approve -- <id>     # 申請を承認
npm run reject -- <id>      # 申請を却下
      `);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
