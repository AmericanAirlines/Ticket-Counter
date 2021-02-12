import { Webhooks } from '@octokit/webhooks';
import { app } from '../app';
import { Ticket } from '../entities/Ticket';
import { env } from '../env';

const webhooks = new Webhooks({
  secret: env.githubAppWebhookSecret,
});

webhooks.on(['issues.assigned', 'issues.unassigned'], async (event) => {
  const supportMembers = (event.payload.issue.assignees ?? []).map((user) => user.login);

  const { affected, raw } = await Ticket.createQueryBuilder()
    .update()
    .set({ supportMembers })
    .where('issueId = :issueId', { issueId: event.payload.issue.node_id })
    .andWhere('supportMembers <> :supportMembers', { supportMembers })
    .returning('*')
    .execute();

  if (typeof affected !== 'number' || affected <= 0) {
    return;
  }

  const tickets = raw as Ticket[]; // This is not enhanced, readonly

  for (const ticket of tickets) {
    await app.client.chat
      .postMessage({
        token: env.slackBotToken,
        channel: 'C01MYGGAT8S',
        text: `Support Members Assigned: ${supportMembers.join(', ')}`,
        thread_ts: ticket.platformPostId,
      })
      .catch(() => {});
  }
});

export const githubWebhooks = webhooks.middleware;
