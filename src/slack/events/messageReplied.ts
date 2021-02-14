import { App, SlackEventMiddlewareArgs } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/bolt/dist/types/events/message-events';
import { Platform, Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import { postMessage } from '../../github/utils/postMessage';
import logger from '../../logger';
import { AppMiddlewareFunction } from '../types';

let appUserId: string;

export const messageReplied: AppMiddlewareFunction<SlackEventMiddlewareArgs<'message'>> = (app: App) => async ({
  message,
}) => {
  const {
    parent_user_id: parentUserId,
    text,
    ts,
    thread_ts: threadTs,
    user: slackUserId,
    channel,
  } = message as GenericMessageEvent;

  appUserId = appUserId ?? ((await app.client.auth.test({ token: env.slackBotToken })) as any).user_id;
  if (parentUserId !== appUserId || message.subtype === 'bot_message') {
    // The parent message is not something the bot wrote OR the reply is from a bot
    // -> ignore the event entirely
    return;
  }

  logger.info(`${(message as GenericMessageEvent).user} replied with ${text}`);

  const ticket = await Ticket.findOne({
    where: {
      platform: Platform.Slack,
      platformPostId: threadTs,
    },
  });

  if (!ticket) {
    // error
    return;
  }

  const { user } = (await app.client.users.info({ token: env.slackBotToken, user: slackUserId })) as Record<
    string,
    any
  >;

  try {
    const { permalink } = (await app.client.chat.getPermalink({
      token: env.slackBotToken,
      channel: env.slackSupportChannel,
      message_ts: ticket.platformPostId!,
    })) as Record<string, any>;

    await postMessage(ticket.issueId!, {
      name: `${user.profile.real_name} (\`@${user.profile.display_name}\`)`,
      message: text || '`Could not load text, please see this ticket in Slack for text`',
      platformText: `[<img width="55" alt="Slack" src="https://assets.brandfolder.com/pljt3c-dcwb20-c19uuy/v/2995547/view@2x.png?v=1611630737" />](${permalink})`,
    });

    await app.client.reactions.add({
      token: env.slackBotToken,
      timestamp: ts,
      channel,
      name: 'eyes',
    });
  } catch (err) {
    logger.error('Something went wrong sending message to GitHub: ', err);
  }
};
