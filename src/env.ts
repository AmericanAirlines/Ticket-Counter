import setEnv from '@americanairlines/simple-env';
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

if (vcapServices?['databases-for-postgresql']) {

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
    databaseUrl: 'DATABASE_URL'
  },
});
