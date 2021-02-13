import { Webhooks } from '@octokit/webhooks';
import { env } from '../../env';

export const webhooks = new Webhooks({
  secret: env.githubAppWebhookSecret,
});

export const githubWebhooks = webhooks.middleware;
