import { Webhooks } from '@octokit/webhooks';
import { app } from '../../app';
import { Status, Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';
import { Emoji, updatePostReactions } from '../../slack/utils/updatePostReactions';
import { fetchUser } from '../utils/fetchUser';

export const issueClosed = (webhooks: Webhooks) => {
  webhooks.on('issues.closed', async (event) => {
    logger.info(`Received an issue closed event`);

    await Ticket.update(event.payload.issue.node_id, {
      status: Status.Closed,
    });

    const user = await fetchUser(event.payload.sender.login);

    const ticket = await Ticket.findOneOrFail(event.payload.issue.node_id);

    if (ticket.platformPostId) {
      await app.client.chat
        .postMessage({
          token: env.slackBotToken,
          channel: env.slackSupportChannel,
          text: `:${Emoji.Closed}: ${user?.name ?? user?.login ?? 'Someone'} closed this ticket`,
          thread_ts: ticket.platformPostId,
        })
        .catch(() => {});
      await updatePostReactions(ticket.status, ticket.platformPostId);
    }
  });
};
