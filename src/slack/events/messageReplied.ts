import { App, SlackEventMiddlewareArgs } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/bolt/dist/types/events/message-events';
import { env } from '../../env';
import logger from '../../logger';
import { AppMiddlewareFunction } from '../types';

let appUserId: string;

export const messageReplied: AppMiddlewareFunction<SlackEventMiddlewareArgs<'message'>> = (app: App) => async ({
  message,
}) => {
  const { parent_user_id: parentUserId, text, ts, channel } = message as GenericMessageEvent;

  appUserId = appUserId ?? ((await app.client.auth.test({ token: env.slackBotToken })) as any).user_id;
  if (parentUserId !== appUserId || message.subtype === 'bot_message') {
    // The parent message is not something the bot wrote OR the reply is from a bot
    // -> ignore the event entirely
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
