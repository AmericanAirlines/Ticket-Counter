import { app, init } from './app';
import { env } from './env';
import logger from './logger';

export const port = env.port || '3000';
async function start(): Promise<void> {
  await init();
  await app.start(port);
  if (env.nodeEnv === 'development') {
    logger.info(`Listening on http://localhost:${port} in the ${process.env.NODE_ENV || 'development'} environment`);
    return;
  }
  logger.info(`Listening on port ${port} in the ${process.env.NODE_ENV || 'development'} environment`);
}

// Start the app
start().catch((err) => {
  logger.error('Something went wrong starting the app: ', err);
  process.exit(1);
});
