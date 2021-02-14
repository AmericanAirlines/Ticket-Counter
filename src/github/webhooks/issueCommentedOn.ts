import { Webhooks } from '@octokit/webhooks';
import { app } from '../../app';
import { Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';
import { fetchUser } from '../utils/fetchUser';

export const issueCommentedOn = (webhooks: Webhooks) => {
  webhooks.on('issue_comment.created', async (event) => {
    logger.info(`Received an issue comment created event`);

    const user = await fetchUser(event.payload.sender.login);
    const ticket = await Ticket.findOneOrFail(event.payload.issue.node_id);

    let messageUserName = 'someone';
    if (user) {
      if (user.name) {
        messageUserName = `${user.name} (\`@${user.login}\`)`;
      } else {
        messageUserName = `\`@${user.login}\``;
      }
    }

    if (ticket.platformPostId) {
      await app.client.chat
        .postMessage({
          token: env.slackBotToken,
          channel: env.slackSupportChannel,
          text: `${event.payload.comment.body}\n\n> From ${messageUserName} - <${event.payload.comment.html_url}|View in GitHub>`,
          thread_ts: ticket.platformPostId,
        })
        .catch(() => {});
    }
  });
};
