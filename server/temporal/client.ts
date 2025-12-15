import { Client, Connection } from '@temporalio/client';

let clientInstance: Client | null = null;
let connectionInstance: Connection | null = null;

/**
 * Temporalクライアントのシングルトンインスタンスを取得
 * 接続が切れた場合は再接続を試みる
 */
export async function getTemporalClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  connectionInstance = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  clientInstance = new Client({
    connection: connectionInstance,
  });

  return clientInstance;
}

/**
 * Temporalクライアント接続をクローズ
 * アプリケーション終了時に呼び出す
 */
export async function closeTemporalClient(): Promise<void> {
  if (connectionInstance) {
    await connectionInstance.close();
    connectionInstance = null;
    clientInstance = null;
  }
}
