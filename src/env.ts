import setEnv from '@americanairlines/simple-env';

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
  },
});
