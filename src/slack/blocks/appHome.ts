import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { Ticket } from '../../entities/Ticket';
import { githubGraphql } from '../../github/graphql';
import { dividerBlockWithPadding, headerBlock } from '../common/blocks/commonBlocks';
import { issueBlocks } from './issueBlocks';
import { noIssuesBlock } from './noIssuesOpen';

export interface GithubIssueInfo {
  id: string;
  url: string;
  body: string;
  createdAt: string;
  number: string;
  state: string;
  title: string;
  updatedAt: string;
}

export const appHomeBlocks = async (slackId: string, client: WebClient): Promise<KnownBlock[]> => {
  const blocks: KnownBlock[] = [];
  const tickets = await Ticket.find({ where: { authorId: slackId } });
  const issueIds = tickets.map((ticket) => ticket.issueId);
  blocks.push(headerBlock('Open Tickets :ticket:', true));

  if (issueIds.length > 0) {
    const issues: { nodes: (GithubIssueInfo | null)[] } = await githubGraphql(
      `query RepoInfo($issueIds: [ID!]!) {
        nodes(ids: $issueIds) {
          ... on Issue {
            id
            url
            body
            createdAt
            number
            state
            title
            updatedAt
          }
        }
      }`,
      { issueIds },
    );
    const issueInfo = issues.nodes.filter((issue) => issue !== null) as GithubIssueInfo[];
    blocks.push(...(await issueBlocks(issueInfo, tickets, client)));
  } else {
    blocks.push(...dividerBlockWithPadding, noIssuesBlock);
  }
  return blocks;
};
