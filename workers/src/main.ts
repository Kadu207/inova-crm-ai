import { startConsumers } from './consumer';

void startConsumers().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
