import { SectionBlock } from '@slack/types';

export const noIssuesBlock: SectionBlock = {
  type: 'section',
  text: {
    type: 'mrkdwn',
    text: 'You have no open tickets :tada:',
  },
} as const;
