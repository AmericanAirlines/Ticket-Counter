import { App, Middleware } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

export type AppMiddlewareFunction<Args> = (app: App) => Middleware<Args>;

export interface UserInfo {
  id: string;
  name: string;
  real_name: string;
  profile: {
    real_name: string;
    display_name: string;
  };
  tz: string;
}
