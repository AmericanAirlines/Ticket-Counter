import { Webhooks } from '@octokit/webhooks';
import { Ticket, Platform } from '../../entities/Ticket';
import logger from '../../logger';
import { fetchUser } from '../utils/fetchUser';

export const issueOpened = (webhooks: Webhooks) => {
  webhooks.on('issues.opened', async (event) => {
    logger.info(`Received an issue opened event`);

    const { name, login } = await fetchUser(event.payload.issue.user.login);

    const newTicket = new Ticket(
      event.payload.issue.node_id,
      event.payload.issue.number,
      login,
      name ?? login,
      Platform.GitHub,
    );

    await newTicket.save();
  });
};
