import { SectionBlock } from '@slack/types';

export const problemLoadingIssuesBlock: SectionBlock = {
  type: 'section',
  text: {
    type: 'mrkdwn',
    text: 'Whoops, Something went wrong while loading your tickets. Please try again Later...',
  },
} as const;
