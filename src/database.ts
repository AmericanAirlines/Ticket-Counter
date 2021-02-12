import path from 'path';
import { createConnection, getConnectionOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Base64 } from 'js-base64';
import logger from './logger';
import { env } from './env';

export const initDatabase = async (): Promise<void> => {
  if (env.nodeEnv !== 'test') {
    try {
      // Use VCAP_SERVICES (Cloud Foundry) if available, else local env, else default DB from ormconfig.json
      const vcapServices = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : {};
      const vcapPostgres = vcapServices['databases-for-postgresql']?.[0]?.credentials?.connection?.postgres;
      let url = (vcapPostgres?.composed[0]?.replace('?sslmode=verify-full', '') as string) || process.env.DATABASE_URL;

      if (!url) {
        // Pull connection options from ormconfig.json
        const ormConfig = (await getConnectionOptions()) as PostgresConnectionOptions;

        url = ormConfig.url;
      }

      const cert = vcapPostgres ? Base64.decode(vcapPostgres.certificate?.certificate_base64) : null;
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
