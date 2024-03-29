import { Webhooks } from '@octokit/webhooks';
import { app } from '../../app';
import { Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';
import { Emoji } from '../../slack/utils/updatePostReactions';

export const issueTransferred = (webhooks: Webhooks) => {
  webhooks.on('issues.transferred', async (event) => {
    logger.info(`Received an issue ${event.payload.action} event`);

    // Need to have the type here so that we can use the type of the payload
    type IssueTransferredEventWithChanges = typeof event.payload & {
      changes: {
        new_issue: typeof event.payload.issue;
      };
    };

    const payload: IssueTransferredEventWithChanges = event.payload as IssueTransferredEventWithChanges;

    const oldId = payload.issue.node_id;
    const { node_id: newId, html_url: newUrl } = payload.changes.new_issue;

    const { affected } = await Ticket.update(
      {
        issueId: oldId,
      },
      {
        issueId: newId,
      },
    );

    const ticket = await Ticket.findOne(newId);

    if (!ticket || (affected ?? 0) === 0) {
      return;
    }

    const eventUser = payload.sender?.name ?? payload.sender?.login ?? 'Someone';

    if (ticket.platformPostId) {
      await app.client.chat
        .postMessage({
          token: env.slackBotToken,
          channel: env.slackSupportChannel,
          text: `:${Emoji.Transferred}: ${eventUser} transferred this issue to ${newUrl}`,
          thread_ts: ticket.platformPostId,
        })
        .catch((err) => {
          logger.error(
            `Could not send message to thread for issue transferred event for Ticket ${ticket.issueId}`,
            err,
          );
        });
    }
  });
};
