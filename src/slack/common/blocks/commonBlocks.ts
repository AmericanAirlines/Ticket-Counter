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
};

export const spacerBlock: HeaderBlock = {
  type: 'header',
  text: {
    type: 'plain_text',
    text: ' ',
  },
};

export const dividerBlockWithPadding: [HeaderBlock, DividerBlock] = [spacerBlock, dividerBlock];
