import { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { Ticket } from '../../entities/Ticket';
import { githubGraphql } from '../../github/graphql';
import { dividerBlockWithPadding, headerBlock } from '../common/blocks/commonBlocks';
import { problemLoadingIssuesBlock } from '../common/blocks/errors/corruptIssueError';
import { noIssuesBlock } from './noIssuesOpen';
import logger from '../../logger';
import { issueBlocks } from './issueBlocks';
import { GithubIssueInfo } from '../../github/types';
import { getUserDetails } from '../utils/userCache';
import { UserInfo } from '../types';

export const appHomeBlocks = async (slackId: string, client: WebClient): Promise<KnownBlock[]> => {
  // TODO Use the users.info slack api method to get the timezone information
  // TODO Figure out how to format human readable date for each timezone

  const homeBlocks: KnownBlock[] = [headerBlock('Open Tickets :ticket:', true)];
  const tickets = await Ticket.find({ where: { authorId: slackId, status: 'Open' } });
  const issueIds = tickets.map((ticket) => ticket.issueId);
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
      const userInfo = await getUserDetails(slackId, client);
      const { tz: timezone } = userInfo as UserInfo;
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
