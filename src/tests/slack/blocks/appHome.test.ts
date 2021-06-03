import { WebClient } from '@slack/web-api';
import 'jest';
import { Platform, Ticket } from '../../../entities/Ticket';
import { githubGraphql } from '../../../github/graphql';
import { appHomeBlocks } from '../../../slack/blocks/appHome';
import { getMock } from '../../test-utils/getMock';
import { GithubIssueInfo } from '../../../slack/common/blocks/types/githubIssueInfo';
import { problemLoadingIssuesBlock } from '../../../slack/common/blocks/errors/corruptIssueError';
import { noIssuesBlock } from '../../../slack/blocks/noIssuesOpen';

jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn(),
}));

jest.mock('../../../../src/entities/Ticket.ts', () => ({
  Ticket: {
    find: jest.fn(),
  },
}));

jest.mock('../../../env.ts');

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
    } as GithubIssueInfo,
  ],
};

const mockTickets: Ticket[] = [
  {
    issueId: 'ISSUE_ID',
    issueNumber: 1,
    authorId: 'AUTHOR_ID',
    authorName: 'TEST_NAME',
    platformPostId: 'SLACK_THREAD_TS',
    platform: Platform.Slack,
  } as Ticket,
];

describe('appHome blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an array of blocks containing fields including issue data", async () => {
    getMock(githubGraphql).mockResolvedValueOnce(mockOpenGithubIssue);
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining(mockIssue.nodes[0].body),
            }),
          ]),
        }),
      ]),
    );
  });

  it('returns a response that includes an error block if there is a problem loading the issue blocks', async () => {
    getMock(githubGraphql).mockResolvedValueOnce(mockOpenGithubIssue);
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    getMock(mockClient.chat.getPermalink).mockRejectedValue('Something broke');
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    expect(blocks).toEqual(expect.arrayContaining([expect.objectContaining(problemLoadingIssuesBlock)]));
  });

  it("returns an array of blocks containing the 'no issues' block when no issues are provided", async () => {
    getMock(githubGraphql).mockResolvedValueOnce({ nodes: [] });
    getMock(Ticket.find).mockResolvedValueOnce([]);
    const blocks = await appHomeBlocks(mockSlackId, mockClient);
    expect(blocks).toEqual(expect.arrayContaining([expect.objectContaining(noIssuesBlock)]));
  });
});
