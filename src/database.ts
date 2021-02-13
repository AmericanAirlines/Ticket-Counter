import path from 'path';
import { createConnection, getConnectionOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import logger from './logger';
import { env } from './env';

export const initDatabase = async (): Promise<void> => {
  if (env.nodeEnv !== 'test') {
    try {
      let url = env.databaseUrl;
      const cert = env.databaseCert;
      if (!url) {
        // Pull connection options from ormconfig.json
        const ormConfig = (await getConnectionOptions()) as PostgresConnectionOptions;

        url = ormConfig.url;
      }

      const connectionOptions: PostgresConnectionOptions = {
        url,
        type: 'postgres',
        entities: [path.join(__dirname, 'entities/*')],
        migrations: [path.join(__dirname, 'migrations/*')],
        migrationsRun: true,
        ssl: cert ? { ca: cert } : false,
      };

      await createConnection(connectionOptions as PostgresConnectionOptions);
    } catch (err) {
      logger.crit('Failed to connect to DB: ', err);
      process.exit(1);
    }
  }
};
