import { App, SlackEventMiddlewareArgs } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/bolt/dist/types/events/message-events';
import { AppMiddlewareFunction } from '../types';
import { messageReplied } from './messageReplied';

export function events(bolt: App): void {
  // Register all event listeners

  bolt.message(isMessageReply(bolt), messageReplied(bolt));
  // TODO: Replace the above with the below when the bug with subtype is addressed:
  // https://api.slack.com/events/message/message_replied (bug at bottom of page)
  // Once fixed, removed the isMessageReply middleware below
  // bolt.message(subtype('message_replied'), messageReplied(bolt));
}

export const isMessageReply: AppMiddlewareFunction<SlackEventMiddlewareArgs<'message'>> = () => async ({
  message,
  next,
}) => {
  if ((message as GenericMessageEvent).thread_ts) {
    next?.();
  }
};
