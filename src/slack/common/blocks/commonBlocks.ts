import { DividerBlock, HeaderBlock, SectionBlock } from '@slack/types';

export const headerBlock = (text: string, emoji: boolean): HeaderBlock => ({
  type: 'header',
  text: {
    type: 'plain_text',
    text,
    emoji,
  },
});

export const sectionBlock = (text: string): SectionBlock => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text,
  },
});

export const dividerBlock: DividerBlock = {
  type: 'divider',
} as const;

export const spacerBlock: HeaderBlock = {
  type: 'header',
  text: {
    type: 'plain_text',
    text: ' ',
  },
} as const;

export const dividerBlockWithPadding: [HeaderBlock, DividerBlock] = [spacerBlock, dividerBlock]  as const;
