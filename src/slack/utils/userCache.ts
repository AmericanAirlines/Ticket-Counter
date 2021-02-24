import { App } from '@slack/bolt';
import { env } from '../../env';
import { UserInfo } from '../types';

// TODO: Implement cache timeout

interface UserCache {
  [id: string]: UserInfo;
}

const userCache: UserCache = {};

export async function getUserDetails(userId: string, app: App): Promise<UserInfo> {
  userCache[userId] =
    userCache[userId] ??
    ((
      await app.client.users.info({
        user: userId,
        token: env.slackBotToken,
      })
    ).user as UserInfo);
  return userCache[userId];
}
