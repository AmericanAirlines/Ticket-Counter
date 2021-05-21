import { DividerBlock, HeaderBlock } from '@slack/types';

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
