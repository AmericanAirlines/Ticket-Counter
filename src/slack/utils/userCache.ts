import { WebClient } from '@slack/web-api';
import { env } from '../../env';
import { UserInfo } from '../types';

// TODO: Implement cache timeout

interface UserCache {
  [id: string]: UserInfo;
}

const userCache: UserCache = {};

export async function getUserDetails(userId: string, client: WebClient): Promise<UserInfo> {
  userCache[userId] =
    userCache[userId] ??
    ((
      await client.users.info({
        user: userId,
      })
    ).user as UserInfo);
  return userCache[userId];
}
