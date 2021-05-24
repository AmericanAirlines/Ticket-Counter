import { KnownBlock } from '@slack/types';

export const noIssuesBlock: KnownBlock = {
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: 'You currently have no tickets opened at this time. 😊',
    },
  ],
};
