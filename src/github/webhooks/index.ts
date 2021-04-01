import { Webhooks } from '@octokit/webhooks';
import { env } from '../../env';
import logger from '../../logger';
import { issueAssignmentChanged } from './issueAssignmentChanged';
import { issueClosed } from './issueClosed';
import { issueCommentedOn } from './issueCommentedOn';
import { issueReopened } from './issueReopened';
import { issueTransferred } from './issueTransferred';

export const webhooks = new Webhooks({
  secret: env.githubAppWebhookSecret,
});

webhooks.onError((error) => {
  logger.error('Error handling GitHub webhook', error);
});

issueAssignmentChanged(webhooks);
issueClosed(webhooks);
issueReopened(webhooks);
issueCommentedOn(webhooks);
issueTransferred(webhooks);

export const githubWebhooks = webhooks.middleware;
