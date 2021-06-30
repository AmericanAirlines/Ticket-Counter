import { Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';
import logger from '../../logger';
import { updateAppHome } from '../utils/updateAppHome';

export const appHomeOpened: Middleware<SlackEventMiddlewareArgs<'app_home_opened'>> = async ({ client, event }) => {
  try {
    await updateAppHome(client, event.user);
  } catch (error) {
    logger.error('Something went wrong updating app home: ', error);
  }
};
