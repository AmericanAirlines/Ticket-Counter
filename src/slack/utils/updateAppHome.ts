import { KnownBlock } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { appHomeBlocks } from '../blocks/appHome';
import { actionIds } from '../constants';

export const updateAppHome = async (client: WebClient, userId: string, blocks?: KnownBlock[]) => {
  await client.views.publish({
    user_id: userId,
    view: {
      type: 'home',
      callback_id: actionIds.ignore,
      title: {
        type: 'plain_text',
        text: 'Ticket Counter',
      },
      blocks: blocks ?? (await appHomeBlocks(userId, client)),
    },
  });
};
