import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { GithubIssueInfo } from './appHome';
import { Ticket } from '../../entities/Ticket';
import { actionIds } from '../constants';
import { env } from '../../env';
import { dividerBlockWithPadding } from '../common/blocks/dividerBlock';

const issueBlock = (ticket: GithubIssueInfo, threadLink: string): KnownBlock[] => {
  const issueText = `*Issue Number:*  ${ticket.number}\n*Opened At:*  ${ticket.createdAt}\n*Last Updated:*  ${ticket.updatedAt}\n*State:* ${ticket.state}`;
  const description = `*Description:* ${ticket.body.substring(0, ticket.body.indexOf('\n'))}`;
  const maxTextLength = 1996 - issueText.length;
  return [
    ...dividerBlockWithPadding,
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `${issueText}\n${
            description.length > maxTextLength ? `${description.substring(0, maxTextLength)}...` : description
          }`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Go to Thread :slack:',
            emoji: true,
          },
          url: threadLink,
          action_id: actionIds.ignore,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Go to Issue :github-neutral:',
            emoji: true,
          },
          url: ticket.url,
          action_id: `${actionIds.ignore}2`,
        },
      ],
    },
  ];
};

export const issueBlocks = async (githubIssuesInfo: GithubIssueInfo[], storedTickets: Ticket[], client: WebClient) =>
  Promise.all(
    githubIssuesInfo
      .sort((a, b) => (a.number > b.number ? 1 : -1))
      .filter((issue) => issue.state === 'OPEN')
      .map(async (issue) => {
        const threadTs = storedTickets.filter((ticket) => ticket.issueId === issue.id)[0].platformPostId;
        const thread: { permalink: string } = ((await client.chat.getPermalink({
          channel: env.slackSupportChannel,
          message_ts: threadTs,
        })) as unknown) as { permalink: string };

        return issueBlock(issue, thread.permalink);
      }),
  ).then((arr) => arr.flat());
