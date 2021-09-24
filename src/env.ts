import setEnv from '@americanairlines/simple-env';

export const env = setEnv({
  required: {
    nodeEnv: 'NODE_ENV',
    slackBotToken: 'SLACK_BOT_TOKEN',
    slackSigningSecret: 'SLACK_SIGNING_SECRET',
    slackSupportChannel: 'SLACK_SUPPORT_CHANNEL',
    githubRepoOwner: 'GITHUB_REPO_OWNER',
    githubRepoName: 'GITHUB_REPO_NAME',
    githubAppId: 'GITHUB_APP_ID',
    githubAppWebhookSecret: 'GITHUB_APP_WEBHOOK_SECRET',
    githubAppInstallationId: 'GITHUB_APP_INSTALLATION_ID',
  },
  optional: {
    port: 'PORT',
    githubAppPemFile: 'GITHUB_APP_PEM_FILE',
    githubAppPrivateKey: 'GITHUB_APP_PRIVATE_KEY',
    databaseUrl: 'DATABASE_URL',
    databaseCert: 'DATABASE_CERT',
  },
});
