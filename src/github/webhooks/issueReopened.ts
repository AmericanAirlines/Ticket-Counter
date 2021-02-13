import { Webhooks } from '@octokit/webhooks';
import { app } from '../../app';
import { Status, Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';
import { Emoji, updatePostReactions } from '../../slack/utils/updatePostReactions';
import { fetchUser } from '../utils/fetchUser';

export const issueReopened = (webhooks: Webhooks) => {
  webhooks.on('issues.reopened', async (event) => {
    logger.info(`Received an issue reopened event`);

    const supportMembers = (event.payload.issue.assignees ?? []).map((user) => user.login);

    await Ticket.update(event.payload.issue.node_id, {
      status: supportMembers.length > 0 ? Status.InProgress : Status.Open,
      supportMembers,
    });

    const user = await fetchUser(event.payload.sender.login);

    const ticket = await Ticket.findOneOrFail(event.payload.issue.node_id);

    if (ticket.platformPostId) {
      await app.client.chat
        .postMessage({
          token: env.slackBotToken,
          channel: env.slackSupportChannel,
          text: `:${Emoji.Reopened}: ${user?.name ?? user?.login ?? 'Someone'} reopened this ticket`,
          thread_ts: ticket.platformPostId,
        })
        .catch(() => {});
      await updatePostReactions(ticket.status, ticket.platformPostId, true);
    }
  });
};
