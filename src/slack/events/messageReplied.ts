import { App, SlackEventMiddlewareArgs } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/bolt/dist/types/events/message-events';
import { Platform, Ticket } from '../../entities/Ticket';
import { env } from '../../env';
import { commentOnIssue } from '../../github/utils/commentOnIssue';
import logger from '../../logger';
import { AppMiddlewareFunction } from '../types';
import { getExternalUserDisplayText } from '../utils/getExternalUserDisplayText';
import { makeUserMentionsReadable } from '../utils/makeUserMentionsReadable';
import { getUserDetails } from '../utils/userCache';

let appUserId: string;
const getViewInSlackLink = (link: string) =>
  ` - [View in <img width="55" alt="Slack" src="https://assets.brandfolder.com/pljt3c-dcwb20-c19uuy/v/2995547/view@2x.png?v=1611630737" />](${link})`;

export const messageReplied: AppMiddlewareFunction<SlackEventMiddlewareArgs<'message'>> =
  (app: App) =>
  async ({ message }) => {
    const {
      parent_user_id: parentUserId,
      text,
      ts,
      thread_ts: threadTs,
      user: slackUserId,
      channel,
      files,
    } = message as GenericMessageEvent;

    appUserId = appUserId ?? ((await app.client.auth.test({ token: env.slackBotToken })) as any).user_id;
    if (parentUserId !== appUserId || message.subtype === 'bot_message') {
      // The parent message is not something the bot wrote OR the reply is from a bot
      // -> ignore the event entirely
      return;
    }

    logger.debug(`${(message as GenericMessageEvent).user} replied with ${text}`);

    const ticket = await Ticket.findOne({
      where: {
        platform: Platform.Slack,
        platformPostId: threadTs,
      },
    });

    if (!ticket) {
      logger.info(`No ticket found for message ${threadTs} (user: ${slackUserId})`, message);
      return;
    }

    try {
      const user = await getUserDetails(slackUserId, app);

      const { permalink } = (await app.client.chat.getPermalink({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        message_ts: ts,
      })) as Record<string, any>;

      let messageText = await makeUserMentionsReadable(text ?? '', app);
      messageText = messageText.replace(/```/g, '\n```\n');

      if (files?.length) {
        // Note: Extra newlines are trimmed in GitHub so it's not an issue that the message could start with \n\n
        messageText += `\n\n[\`Message contains file(s), see Slack to view them\`](${permalink})`;
      }

      const nameText = getExternalUserDisplayText(user);
      await commentOnIssue(ticket.issueId!, {
        name: nameText,
        message: messageText || 'Could not load message, please see this ticket in Slack',
        platformText: getViewInSlackLink(permalink),
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
