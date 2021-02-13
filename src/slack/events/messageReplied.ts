import { App, SlackEventMiddlewareArgs } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/bolt/dist/types/events/message-events';
import { env } from '../../env';
import logger from '../../logger';
import { AppMiddlewareFunction } from '../types';

let appId: string;

export const messageReplied: AppMiddlewareFunction<SlackEventMiddlewareArgs<'message'>> = (app: App) => async ({
  message,
}) => {
  const { parent_user_id: parentUserId, text, ts, channel } = message as GenericMessageEvent;

  appId = appId ?? ((await app.client.bots.info({ token: env.slackBotToken })).bot as any)?.user_id;
  if (parentUserId !== appId || message.subtype === 'bot_message') {
    // The parent message is not something the bot wrote; ignore the thread reply
    // OR the reply is from a bot
    return;
  }

  logger.info(`${(message as GenericMessageEvent).user} replied with ${text}`);

  try {
    await app.client.reactions.add({
      token: env.slackBotToken,
      timestamp: ts,
      channel,
      name: 'eyes',
    });
  } catch (err) {
    logger.error('Something went wrong adding a reaction to a message: ', err);
  }
};
