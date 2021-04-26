import { KnownBlock, InputBlock, Option, SectionBlock, HeaderBlock } from '@slack/types';
import { getIssueTemplates } from '../../github/utils/fetchIssueTemplates';
import { getAnnouncement } from '../../github/utils/fetchAnnouncement';

export enum SubmitTicketModalElement {
  Title = 'title',
  Description = 'description',
  Type = 'type',
  Stakeholders = 'stakeholders',
}

export async function getSubmitTicketModalBlocks(): Promise<KnownBlock[]> {
  const templatesCall = getIssueTemplates();
  const announcementCall = getAnnouncement();
  const templates = await templatesCall;
  let announcement = await announcementCall;

  const noTemplates = templates.length === 0;
  if (noTemplates) {
    templates.unshift({ name: 'Generic', about: '', title: '', body: '' });
  }

  announcement = announcement.trim();

  const ticketOptions: Option[] = templates.map((template) => ({
    text: {
      type: 'plain_text',
      text: template.name,
    },
    value: noTemplates ? ' ' : template.name,
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

  const supportedProductsInfoBlock: SectionBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text:
        'Please continue to use <https://technologyservices.aa.com/|Cherwell> for FAR, AD, GPO, and Security requests. View <https://wiki.aa.com/bin/view/TnT%20Technology%20and%20Platform%20Support/|TnT products> for more info on what is supported with this request form.',
    },
  };

  const descriptionInfoBlock: SectionBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text:
        'If you are filling out an EMFT request, please provide the relevant information from the <https://cepdocs.drke.ok8s.aa.com/triage/media/EMFT%20Request%20Template.xlsx|the EMFT Request Template (requires VPN)>.',
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
      options: ticketOptions,
      initial_option: ticketOptions[0],
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

  const modal: KnownBlock[] = [
    ticketTitleBlock,
    descriptionBlock,
    supportedProductsInfoBlock,
    descriptionInfoBlock,
    ticketType,
    stakeholders,
  ];
  if (announcement !== '') {
    modal.unshift({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: announcement,
      },
    } as SectionBlock);
    modal.unshift({
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Announcement!',
      },
    } as HeaderBlock);
  }

  return modal;
}
