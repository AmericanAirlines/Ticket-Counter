import { Webhooks } from '@octokit/webhooks';
import { app } from '../../app';
import { Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';
import { updatePostReactions } from '../../slack/utils/updatePostReactions';
import { fetchUser } from '../utils/fetchUser';

export const issueAssignmentChanged = (webhooks: Webhooks) => {
  webhooks.on(['issues.assigned', 'issues.unassigned'], async (event) => {
    logger.info(`Received an issue ${event.payload.action} event`);

    const supportMembers = (event.payload.issue.assignees ?? []).map((user) => user.login);

    const { affected, raw } = await Ticket.createQueryBuilder()
      .update()
      .set({ supportMembers })
      .where('issueId = :issueId', { issueId: event.payload.issue.node_id })
      .returning('*')
      .execute();

    if (typeof affected !== 'number' || affected <= 0) {
      return;
    }

    const login = event.payload.assignee?.login;

    if (!login) {
      return;
    }

    const ticket = raw[0] as Ticket; // This is not enhanced, readonly

    const user = await fetchUser(login);
    const assignedName = user.name ?? user.login ?? 'Someone';

    if (ticket.platformPostId) {
      await app.client.chat
        .postMessage({
          token: env.slackBotToken,
          channel: env.slackSupportChannel,
          text: `${assignedName} has been ${event.payload.action} to this ticket`,
          thread_ts: ticket.platformPostId,
        })
        .catch(() => {});
      await updatePostReactions(ticket.status, ticket.platformPostId);
    }
  });
};
