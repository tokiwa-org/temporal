import express from 'express';
import cors from 'cors';
import { getTemporalClient, closeTemporalClient } from '../temporal/client';
import { LeaveRequestService } from '../services/leave-request.service';
import { createLeaveRequestRoutes } from './routes/leave-requests';
import { errorHandler } from './middleware/error-handler';

const app = express();

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// アプリケーション起動
async function startServer() {
  // Temporalクライアント初期化
  const client = await getTemporalClient();
  console.log('Connected to Temporal server');

  // サービス初期化
  const leaveRequestService = new LeaveRequestService(client);

  // ルート設定
  app.use('/api/requests', createLeaveRequestRoutes(leaveRequestService));

  // ヘルスチェック
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // エラーハンドリング（最後に設定）
  app.use(errorHandler);

  // サーバー起動
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
  });

  // グレースフルシャットダウン
  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    await closeTemporalClient();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
