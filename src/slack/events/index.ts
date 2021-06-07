import { App, SlackEventMiddlewareArgs } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/bolt/dist/types/events/message-events';
import { WebClient } from '@slack/web-api';
import { env } from '../../env';
import { ClientMiddlewareFunction } from '../types';
import { messageReplied } from './messageReplied';

export function events(bolt: App): void {
  // Register all event listeners
  const botToken = env.slackBotToken;
  const client = new WebClient(botToken);
  bolt.message(isMessageReply(client), messageReplied(client));
  // TODO: Replace the above with the below when the bug with subtype is addressed:
  // https://api.slack.com/events/message/message_replied (bug at bottom of page)
  // Once fixed, removed the isMessageReply middleware below
  // bolt.message(subtype('message_replied'), messageReplied(bolt));
}

export const isMessageReply: ClientMiddlewareFunction<SlackEventMiddlewareArgs<'message'>> = () => async ({
  message,
  next,
}) => {
  if ((message as GenericMessageEvent).thread_ts) {
    await next?.();
  }
};
