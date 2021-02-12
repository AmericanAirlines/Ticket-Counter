import { SlackShortcutMiddlewareArgs, SlackShortcut } from '@slack/bolt';
import logger from '../../logger';
import { getSubmitTicketModalBlocks } from '../blocks/getSubmitTicketModalBlocks';
import { callbackIds } from '../constants';
import { env } from '../../env';
import { AppMiddlewareFunction } from '../types';

export const submitTicket: AppMiddlewareFunction<SlackShortcutMiddlewareArgs<SlackShortcut>> = (app) => async ({
  shortcut,
  ack,
}) => {
  ack();
  try {
    await app.client.views.open({
      token: env.slackBotToken,
      trigger_id: shortcut.trigger_id,
      view: {
        callback_id: callbackIds.submitTicketSubmitted,
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Submit a Support Ticket',
        },
        blocks: getSubmitTicketModalBlocks(),
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
