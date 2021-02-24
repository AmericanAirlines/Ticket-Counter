import { App } from '@slack/bolt';
import logger from '../../logger';
import { getExternalUserDisplayText } from './getExternalUserDisplayText';
import { getUserDetails } from './userCache';

export async function makeUserMentionsReadable(text: string, app: App): Promise<string> {
  const userMentionRegex = '<@(\\w*)>';
  let readableString = text;

  let match = RegExp(userMentionRegex, 'g').exec(readableString);
  while (match) {
    const [atMention, userId] = match;
    let userText = `@${userId} (Unknown User)`;

    try {
      const user = await getUserDetails(userId, app);
      userText = getExternalUserDisplayText(user);
    } catch (err) {
      logger.error('Unable to retrieve user and format external display text: ', err);
    }

    readableString = readableString.split(atMention).join(userText); // Replace all instances
    match = RegExp(userMentionRegex, 'g').exec(readableString);
  }

  return readableString;
}
