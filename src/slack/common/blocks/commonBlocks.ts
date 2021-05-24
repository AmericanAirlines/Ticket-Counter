import { KnownBlock } from '@slack/types';

export const headerBlock = (text: string, emoji: boolean): KnownBlock => ({
  type: 'header',
  text: {
    type: 'plain_text',
    text,
    emoji,
  },
});

export const sectionBlock = (text: string): KnownBlock => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text,
  },
});
