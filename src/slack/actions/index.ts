import { App } from '@slack/bolt';
import { ignore } from './ignore';
import { appHomeOpened } from '../events/appHomeOpened';

export function actions(bolt: App): void {
  // Register all action listeners
  bolt.action({ action_id: /ignore.*/i }, ignore);
  bolt.event('app_home_opened', appHomeOpened);
}
