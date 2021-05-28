import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { Ticket, Status } from '../../entities/Ticket';
import { githubGraphql } from '../../github/graphql';
import { dividerBlockWithPadding, headerBlock } from '../common/blocks/commonBlocks';
import { problemLoadingIssuesBlock } from '../common/blocks/errors/corruptIssueError';
import { GithubIssueInfo } from '../common/blocks/types/githubIssueInfo';
import { issueBlocks } from './issueBlocks';
import { noIssuesBlock } from './noIssuesOpen';

export const appHomeBlocks = async (slackId: string, client: WebClient): Promise<KnownBlock[]> => {
  const homeBlocks: KnownBlock[] = [];
  const tickets = await Ticket.find({ where: { authorId: slackId, status: Status.Open} });
  const issueIds = tickets.map((ticket) => ticket.issueId);
  homeBlocks.push(headerBlock('Open Tickets :ticket:', true));

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
    try {
      const issueBlocks = await issueBlocks(issueInfo, tickets, client)
      homeBlocks.push(...issueBlocks);
    } catch (err) {
      logger.error('Something went wrong trying to create issue blocks:', err);
      homeBlocks.push(problemLoadingIssuesBlock());
    }
  } else {
    homeBlocks.push(...dividerBlockWithPadding, noIssuesBlock);
  }
  return homeBlocks;
};
