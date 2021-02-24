import { App } from '@slack/bolt';
import { getExternalUserDisplayText } from './getExternalUserDisplayText';
import { getUserDetails } from './userCache';

const userMentionRegex = /<@(\w*)>/g;

export async function makeUserMentionsReadable(text: string, app: App): Promise<string> {
  let readableString = text;

  let match = userMentionRegex.exec(readableString);
  while (match) {
    const userId = match[1];
    const userText = getExternalUserDisplayText(await getUserDetails(userId, app));
    readableString = readableString.replace(new RegExp(`<@${userId}>`, 'g'), userText);
    match = userMentionRegex.exec(readableString);
  }
  return readableString;
}
