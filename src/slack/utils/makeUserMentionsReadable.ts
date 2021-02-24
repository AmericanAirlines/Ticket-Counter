import { App } from '@slack/bolt';
import { getExternalUserDisplayText } from './getExternalUserDisplayText';
import { getUserDetails } from './userCache';

export async function makeUserMentionsReadable(text: string, app: App): Promise<string> {
  const userMentionRegex = "<@(\\w*)>";
  let readableString = text;

  let match = RegExp(userMentionRegex, 'g').exec(readableString);
  while (match) {
    const atMention = match[0];
    const userId = match[1];
    const userText = getExternalUserDisplayText(await getUserDetails(userId, app));
    readableString = readableString.split(atMention).join(userText); // Replace all instances
    match = RegExp(userMentionRegex, 'g').exec(readableString);
  }
  return readableString;
}
