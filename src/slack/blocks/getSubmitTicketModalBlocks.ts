import { KnownBlock, InputBlock, Option } from '@slack/types';
import { getIssueTemplates } from '../../github/utils/fetchIssueTemplates';

export enum SubmitTicketModalElement {
  Title = 'title',
  Description = 'description',
  Type = 'type',
  Stakeholders = 'stakeholders',
}

export async function getSubmitTicketModalBlocks(): Promise<KnownBlock[]> {
  const templates = await getIssueTemplates();

  if (templates.length === 0) {
    templates.unshift({ name: 'Generic', about: '', title: '', body: '' });
  }

  const options: Option[] = templates.map((template) => ({
    text: {
      type: 'plain_text',
      text: template.name,
    },
    value: template.name,
  }));

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
      action_id: SubmitTicketModalElement.Title,
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
      action_id: SubmitTicketModalElement.Description,
      type: 'plain_text_input',
      multiline: true,
      max_length: 500,
    },
  };

  const ticketType: InputBlock = {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Type of Ticket',
    },
    hint: {
      type: 'plain_text',
      text: 'This will organize the ticket with labels using the issue template',
    },
    optional: false,
    element: {
      action_id: SubmitTicketModalElement.Type,
      type: 'static_select',
      options,
      initial_option: options[0],
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
      action_id: SubmitTicketModalElement.Stakeholders,
      type: 'multi_users_select',
    },
  };

  return [ticketTitleBlock, descriptionBlock, ticketType, stakeholders];
}
