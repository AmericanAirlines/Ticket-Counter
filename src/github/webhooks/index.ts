import { Webhooks } from '@octokit/webhooks';
import { env } from '../../env';
import logger from '../../logger';
import { issueAssignmentChanged } from './issueAssignmentChanged';

export const webhooks = new Webhooks({
  secret: env.githubAppWebhookSecret,
});

webhooks.onError((error) => {
  logger.error('Error handling GitHub webhook', error);
});

issueAssignmentChanged(webhooks);

export const githubWebhooks = webhooks.middleware;
