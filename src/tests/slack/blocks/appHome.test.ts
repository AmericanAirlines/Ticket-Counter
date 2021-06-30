import { WebClient } from '@slack/web-api';
import 'jest';
import { Ticket } from '../../../entities/Ticket';
import { githubGraphql } from '../../../github/graphql';
import { appHomeBlocks } from '../../../slack/blocks/appHome';
import { getMock } from '../../test-utils/getMock';
import { problemLoadingIssuesBlock } from '../../../slack/common/blocks/errors/corruptIssueError';
import { noIssuesBlock } from '../../../slack/blocks/noIssuesOpen';
import { GitHubIssueInfo } from '../../../github/types';
import logger from '../../../logger';

jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn(),
}));

jest.mock('../../../../src/entities/Ticket.ts', () => ({
  Ticket: {
    find: jest.fn(),
  },
}));

jest.mock('../../../../src/slack/utils/userCache.ts', () => ({
  getUserDetails: jest.fn().mockResolvedValue({ user: { tz: '2021-06-03T21:28:55Z' } }),
}));

jest.mock('../../../env.ts');
jest.spyOn(logger, 'error').mockImplementation();

const mockSlackId = 'SLACK_ID';
const mockClient = ({
  views: {
    publish: jest.fn(),
  },
  chat: {
    getPermalink: jest.fn(() => 'slack://link'),
  },
} as unknown) as WebClient;

const mockUrl = 'TEST_URL.com';
const mockGitHubIssuesPayload = {
  nodes: [
    {
      id: 'MOCK_ID',
      url: mockUrl,
      body: 'Test body of issue\n',
      createdAt: '2021-05-19 16:49:39.609229',
      number: '1',
      state: 'Open',
      title: 'Mock Open Ticket',
      updatedAt: '2021-05-19 16:49:39.609229',
    } as GitHubIssueInfo,
  ],
};

const mockTickets: Ticket[] = [
  {
    issueId: 'ISSUE_ID',
    issueNumber: 1,
    authorId: 'AUTHOR_ID',
    authorName: 'TEST_NAME',
    platformPostId: 'SLACK_THREAD_TS',
  } as Ticket,
];

describe('appHome blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an array of blocks containing fields including issue data', async () => {
    getMock(githubGraphql).mockResolvedValueOnce(mockGitHubIssuesPayload);
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    const expectedDescription = mockGitHubIssuesPayload.nodes[0].body.split('\n')[0];
    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.objectContaining({
            text: expect.stringContaining(expectedDescription),
          }),
        }),
      ]),
    );
  });

  it('returns a response that includes an error block if there is a problem loading the issue blocks', async () => {
    getMock(githubGraphql).mockResolvedValueOnce(mockGitHubIssuesPayload);
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    getMock(mockClient.chat.getPermalink).mockRejectedValueOnce('Something broke');
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    expect(blocks).toEqual(expect.arrayContaining([expect.objectContaining(problemLoadingIssuesBlock)]));
  });

  it("returns an array of blocks containing the 'no issues' block when no issues are provided", async () => {
    getMock(Ticket.find).mockResolvedValueOnce([]);
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    expect(blocks).toEqual(expect.arrayContaining([expect.objectContaining(noIssuesBlock)]));
  });

  it('still uses returned data if an error is thrown', async () => {
    getMock(githubGraphql).mockRejectedValueOnce({ data: mockGitHubIssuesPayload });
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    const expectedDescription = mockGitHubIssuesPayload.nodes[0].body.split('\n')[0];
    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.objectContaining({
            text: expect.stringContaining(expectedDescription),
          }),
        }),
      ]),
    );
  });
});
