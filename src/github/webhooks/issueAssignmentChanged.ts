import { Webhooks } from '@octokit/webhooks';
import { BaseEntity } from 'typeorm';
import { app } from '../../app';
import { Status, Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';
import { Emoji, updatePostReactions } from '../../slack/utils/updatePostReactions';
import { fetchUser } from '../utils/fetchUser';

export const issueAssignmentChanged = (webhooks: Webhooks) => {
  webhooks.on(['issues.assigned', 'issues.unassigned'], async (event) => {
    logger.debug(`Received an issue ${event.payload.action} event`);

    const supportMembers = event.payload.issue.assignees.map((user) => user.login);

    const { affected, raw } = await Ticket.createQueryBuilder()
      .update()
      .set({
        supportMembers,
        status: supportMembers.length > 0 ? Status.InProgress : Status.Open,
      })
      .where('issueId = :issueId', { issueId: event.payload.issue.node_id })
      .andWhere('status <> :status', { status: Status.Closed })
      .returning('*')
      .execute();

    if (typeof affected !== 'number' || affected <= 0) {
      return;
    }

    const login = event.payload.assignee?.login;

    if (!login) {
      return;
    }

    const ticket = raw[0] as Omit<Ticket, keyof BaseEntity>;

    const user = await fetchUser(login);
    const assignedName = user?.name ?? user?.login ?? 'Someone';

    if (!ticket.platformPostId) {
      return;
    }

    await app.client.chat
      .postMessage({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        text: `:${Emoji.InProgress}: ${assignedName} has been ${event.payload.action} to this ticket`,
        thread_ts: ticket.platformPostId,
      })
      .catch((err: Error) => {
        logger.error('Could not post message to Slack', err);
      });

    await updatePostReactions(ticket.status, ticket.platformPostId);
  });
};
