import { KnownBlock, InputBlock } from '@slack/types';

export function getSubmitTicketModalBlocks(): KnownBlock[] {
  const ticketTitleBlock: InputBlock = {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Support Ticket Title',
    },
    hint: {
      type: 'plain_text',
      text: 'A short description of your ticket',
    },
    element: {
      type: 'plain_text_input',
      max_length: 120,
    },
  };
  const descriptionBlock: InputBlock = {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Description',
    },
    hint: {
      type: 'plain_text',
      text: 'A longer description of your ticket',
    },
    element: {
      type: 'plain_text_input',
      multiline: true,
      max_length: 500,
    },
  };
  const stakeholders: InputBlock = {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Stakeholders',
    },
    hint: {
      type: 'plain_text',
      text: 'Add anyone else impacted or related to this ticket',
    },
    optional: true,
    element: {
      type: 'multi_users_select',
    },
  };
  return [ticketTitleBlock, descriptionBlock, stakeholders];
}
