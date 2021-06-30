import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { Ticket } from '../../entities/Ticket';
import { githubGraphql } from '../../github/graphql';
import { dividerBlockWithPadding, headerBlock } from '../common/blocks/commonBlocks';
import { problemLoadingIssuesBlock } from '../common/blocks/errors/corruptIssueError';
import { noIssuesBlock } from './noIssuesOpen';
import logger from '../../logger';
import { issueBlocks } from './issueBlocks';
import { GitHubIssueInfo } from '../../github/types';
import { getUserDetails } from '../utils/userCache';

interface GitHubIssues {
  nodes: (GitHubIssueInfo | null)[];
}

export const appHomeBlocks = async (slackId: string, client: WebClient): Promise<KnownBlock[]> => {
  const homeBlocks: KnownBlock[] = [headerBlock('Open Tickets :ticket:', true)];
  const tickets = await Ticket.find({ where: { authorId: slackId, status: 'Open' } });
  const issueIds = tickets.map((ticket) => ticket.issueId);

  const issues: GitHubIssues | null =
    issueIds.length > 0
      ? await githubGraphql<GitHubIssues>(
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
        ).catch((err) => err.data)
      : null;
  const issueInfo = (issues?.nodes.filter((issue) => issue !== null) ?? []) as GitHubIssueInfo[];

  if (issueInfo.length) {
    try {
      const { tz: timezone } = await getUserDetails(slackId, client);
      const blocks = await issueBlocks(issueInfo, tickets, client, timezone);
      homeBlocks.push(...blocks);
    } catch (err) {
      logger.error('Something went wrong trying to create issue blocks:', err);
      homeBlocks.push(problemLoadingIssuesBlock);
    }
  } else {
    homeBlocks.push(...dividerBlockWithPadding, noIssuesBlock);
  }
  return homeBlocks;
};
