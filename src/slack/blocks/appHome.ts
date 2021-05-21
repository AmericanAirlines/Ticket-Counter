import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { Ticket } from '../../entities/Ticket';
import { githubGraphql } from '../../github/graphql';
import { headerBlock } from '../common/blocks/commonBlocks';
import { issueBlocks } from './issueBlocks';
import { noIssuesBlock } from './noIssuesOpen';
import { dividerBlock, dividerBlockWithPadding } from '../common/blocks/dividerBlock';

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
  const issues: { nodes: GithubIssueInfo[] } = await githubGraphql(
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

  blocks.push(headerBlock('Open Tickets :ticket:', true));

  if (issues.nodes.length > 0) {
    blocks.push(...(await issueBlocks(issues.nodes, tickets, client)));
  } else {
    blocks.push(...dividerBlockWithPadding, noIssuesBlock());
  }

  return blocks;
};
