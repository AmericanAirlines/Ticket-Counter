import { SectionBlock } from '@slack/types';

export const noIssuesBlock: SectionBlock = {
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: 'You have no open tickets :tada:',
    },
  ],
};
