import { App } from '@slack/bolt';
import { callbackIds } from '../constants';
import { submitTicketSubmitted } from './submitTicketSubmitted';

export function views(bolt: App): void {
  // Register all action listeners
  bolt.view(callbackIds.submitTicketSubmitted, submitTicketSubmitted(bolt));
}
