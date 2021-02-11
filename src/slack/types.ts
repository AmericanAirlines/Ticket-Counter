import { App, Middleware } from '@slack/bolt';

export type AppMiddlewareFunction<Args> = (app: App) => Middleware<Args>;
