import setEnv from '@americanairlines/simple-env';
import { Base64 } from 'js-base64';
import logger from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vcapServices: { [id: string]: any } = {};
if (process.env.VCAP_SERVICES) {
  vcapServices = JSON.parse(process.env.VCAP_SERVICES as string);
}

// User defined credentials are provided via User Defined Services (cups and uups)
const userDefinedCredentials: { [id: string]: string } = vcapServices['user-provided']?.[0]?.credentials;
if (userDefinedCredentials) {
  Object.keys(userDefinedCredentials).forEach((key: string) => {
    process.env[key] = userDefinedCredentials[key];
  });
  logger.info('User Defined Credentials added to env');
}

const vcapPostgres = vcapServices['databases-for-postgresql']?.[0]?.credentials?.connection?.postgres;
if (vcapPostgres) {
  process.env.DATABASE_URL = vcapPostgres.composed[0]?.replace('?sslmode=verify-full', '');
  try {
    process.env.DATABASE_CERT = Base64.decode(vcapPostgres.certificate?.certificate_base64);
  } catch (err) {
    logger.error('Unable to decode cert: ', err);
  }
}

export const env = setEnv({
  required: {
    nodeEnv: 'NODE_ENV',
    slackBotToken: 'SLACK_BOT_TOKEN',
    slackSigningSecret: 'SLACK_SIGNING_SECRET',
    githubAppId: 'GITHUB_APP_ID',
    githubAppClientId: 'GITHUB_APP_CLIENT_ID',
    githubAppClientSecret: 'GITHUB_APP_CLIENT_SECRET',
    githubAppWebhookSecret: 'GITHUB_APP_WEBHOOK_SECRET',
    githubAppPrivateKey: 'GITHUB_APP_PRIVATE_KEY',
  },
  optional: {
    port: 'PORT',
    githubAppPemFile: 'GITHUB_APP_PEM_FILE',
    databaseUrl: 'DATABASE_URL',
    databaseCert: 'DATABASE_CERT',
  },
});
