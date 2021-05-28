import { WebClient } from '@slack/web-api';
import 'jest';
import { Platform, Ticket } from '../../../entities/Ticket';
import { githubGraphql } from '../../../github/graphql';
import { appHomeBlocks } from '../../../slack/blocks/appHome';
import { issueBlocks } from '../../../slack/blocks/issueBlocks';
import { getMock } from '../../test-utils/getMock';
import { problemLoadingIssuesBlock } from '../../../slack/common/blocks/errors/corruptIssueError';

jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn(),
}));

jest.mock('../../../../src/entities/Ticket.ts', () => ({
  Ticket: {
    find: jest.fn(),
  },
}));

jest.mock('../../../slack/blocks/issueBlocks.ts', () => ({
  issueBlocks: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../slack/blocks/noIssuesOpen.ts', () => ({
  noIssuesBlock: jest.fn().mockReturnValue({}),
}));

const mockSlackId = 'SLACK_ID';
const mockClient = ({
  views: {
    publish: jest.fn(),
  },
} as unknown) as WebClient;

const mockOpenGithubIssue = {
  nodes: [
    {
      id: 'MOCK_ID',
      url: 'TEST_URL.com',
      body: 'Test body of issue',
      createdAt: '2021-05-19 16:49:39.609229',
      number: '1',
      state: 'OPEN',
      title: 'Mock Open Ticket',
      updatedAt: '2021-05-19 16:49:39.609229',
    },
  ],
};

const mockTickets: Ticket[] = [
  {
    issueId: 'ISSUE_ID',
    issueNumber: 1,
    authorId: 'AUTHOR_ID',
    authorName: 'TEST_NAME',
    platformPostId: 'SLACK_THREAD_TS',
    platform: {} as Platform,
  } as Ticket,
];

describe('appHome blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the block generator related to the standard app home doesn't throw", async () => {
    getMock(githubGraphql).mockResolvedValueOnce(mockOpenGithubIssue);
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    await expect(appHomeBlocks(mockSlackId, mockClient)).resolves.not.toThrowError();
    expect(issueBlocks).toBeCalledTimes(1);
  });

  it('calls the error block if there is a problem loading the issue blocks', async () => {
    getMock(githubGraphql).mockResolvedValueOnce(mockOpenGithubIssue);
    getMock(Ticket.find).mockResolvedValueOnce(mockTickets);
    getMock(issueBlocks).mockResolvedValue(undefined);
    await expect(appHomeBlocks(mockSlackId, mockClient)).resolves.not.toThrowError();
    expect(getMock(problemLoadingIssuesBlock)).toBeCalledTimes(1);
  });

  it("calls the block generators related to judging and doesn't throw", async () => {
    getMock(githubGraphql).mockResolvedValueOnce({ nodes: [] });
    getMock(Ticket.find).mockResolvedValueOnce([]);
    await appHomeBlocks(mockSlackId, mockClient);
    expect(issueBlocks).toBeCalledTimes(0);
  });
});
