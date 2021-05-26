import { SectionBlock } from '@slack/types';

export const noIssuesBlock: SectionBlock = {
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: 'You currently have no tickets opened at this time. 😊',
    },
  ],
};
