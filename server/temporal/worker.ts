import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { TASK_QUEUE } from '../shared';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: TASK_QUEUE,
  });

  console.log('Worker started, listening on task queue:', TASK_QUEUE);
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
