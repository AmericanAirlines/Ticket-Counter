import { App, Middleware } from '@slack/bolt';

export type AppMiddlewareFunction<Args> = (app: App) => Middleware<Args>;

export interface UserInfo {
  id: string;
  name: string;
  real_name: string;
  profile: {
    real_name: string;
    display_name: string;
  };
}
