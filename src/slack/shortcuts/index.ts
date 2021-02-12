import { App } from '@slack/bolt';
import { callbackIds } from '../constants';
import { submitTicket } from './submitTicket';

export function shortcuts(bolt: App): void {
  // Register all action listeners
  bolt.shortcut(callbackIds.submitTicket, submitTicket(bolt));
}
