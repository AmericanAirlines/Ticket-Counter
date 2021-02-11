import setEnv from '@americanairlines/simple-env';

export const env = setEnv({
  required: {
    nodeEnv: 'NODE_ENV',
    slackBotToken: 'SLACK_BOT_TOKEN',
    slackSigningSecret: 'SLACK_SIGNING_SECRET',
  },
  optional: {
    port: 'PORT',
  },
});
