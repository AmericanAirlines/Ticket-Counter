import { SlackShortcutMiddlewareArgs, SlackShortcut, Middleware } from '@slack/bolt';
import logger from '../../logger';
import { getSubmitTicketModalBlocks } from '../blocks/getSubmitTicketModalBlocks';
import { callbackIds } from '../constants';

export const submitTicket: Middleware<SlackShortcutMiddlewareArgs<SlackShortcut>> = async ({
  shortcut,
  ack,
  client,
}) => {
  void ack();
  try {
    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        callback_id: callbackIds.submitTicketSubmitted,
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Submit a Support Ticket',
        },
        blocks: await getSubmitTicketModalBlocks(),
        submit: {
          type: 'plain_text',
          text: 'Submit Ticket',
        },
      },
    });
  } catch (error) {
    logger.error('Something went wrong publishing a view to Slack: ', error);
  }
};
