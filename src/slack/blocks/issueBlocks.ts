import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { Ticket } from '../../entities/Ticket';
import { actionIds } from '../constants';
import { env } from '../../env';
import { dividerBlockWithPadding } from '../common/blocks/commonBlocks';
import logger from '../../logger';
import { GitHubIssueInfo } from '../../github/types';
import { relativeDateFromTimestamp } from '../../utils/dateFormatter';

const issueBlock = (ticket: GitHubIssueInfo, threadLink: string, timezone: string): KnownBlock[] => {
  const issueText = `*Title:* <${ticket.url}|${ticket.title}>\n *Opened At:*  ${relativeDateFromTimestamp(
    ticket.createdAt,
    timezone,
  )}\n*Last Updated:*  ${relativeDateFromTimestamp(ticket.updatedAt, timezone)}\n*State:* ${ticket.state}`;
  const description = `*Description:* ${ticket.body.split('\n')[0]}`;
  const truncatedDescriptionLength = 300;
  return [
    ...dividerBlockWithPadding,
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${issueText}\n${
          description.length > truncatedDescriptionLength
            ? `${description.substring(0, truncatedDescriptionLength)}...`
            : description
        }`,
      },
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
            text: `Go to Issue #${ticket.number} :memo:`,
            emoji: true,
          },
          url: ticket.url,
          action_id: `${actionIds.ignore}2`,
        },
      ],
    },
  ];
};

export const issueBlocks = async (
  githubIssuesInfo: GitHubIssueInfo[],
  storedTickets: Ticket[],
  client: WebClient,
  timezone: string,
) =>
  Promise.all(
    githubIssuesInfo
      .sort((a, b) => (a.number > b.number ? 1 : -1))
      .map(async (issue) => {
        const threadTs = storedTickets.find((ticket) => ticket.issueId === issue.id)?.platformPostId!;
        const thread: { permalink: string } = ((await client.chat.getPermalink({
          channel: env.slackSupportChannel,
          message_ts: threadTs,
        })) as unknown) as { permalink: string };

        return issueBlock(issue, thread.permalink, timezone);
      }),
  )
    .then((arr) => arr.flat())
    .catch((err) => {
      logger.error(`Something went wrong getting a permalink for a Slack message: `, err);
      throw err;
    });
