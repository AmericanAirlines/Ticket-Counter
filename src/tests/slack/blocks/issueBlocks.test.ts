import { WebClient } from '@slack/web-api';
import { Platform, Ticket } from '../../../entities/Ticket';
import { issueBlocks } from '../../../slack/blocks/issueBlocks';

const mockPermalink = 'chat-permalink';

const mockClient = ({
  chat: {
    getPermalink: jest.fn().mockResolvedValue({ permalink: mockPermalink }),
  },
} as unknown) as WebClient;

const mockOpenGithubIssue = [
  {
    id: 'ISSUE_ID',
    url: 'TEST_URL.com',
    body: 'Test body of issue\n send by someone in slack',
    createdAt: '2021-05-19 16:49:39.609229',
    number: '1',
    state: 'OPEN',
    title: 'Mock Open Ticket',
    updatedAt: '2021-05-19 16:49:39.609229',
  },
  {
    id: 'ISSUE_ID_3',
    url: 'TEST_URL_3.com',
    body: `${'A really large string'.repeat(3000)}\n`,
    createdAt: '2021-05-21 16:49:39.609229',
    number: '3',
    state: 'OPEN',
    title: 'Mock Open Ticket 3',
    updatedAt: '2021-05-21 16:49:39.609229',
  },
  {
    id: 'ISSUE_ID_2',
    url: 'TEST_URL_2.com',
    body: 'Test body of issue\n send by someone in slack',
    createdAt: '2021-05-20 16:49:39.609229',
    number: '2',
    state: 'OPEN',
    title: 'Mock Open Ticket 2',
    updatedAt: '2021-05-20 16:49:39.609229',
  },
];

const mockTickets: Ticket[] = [
  {
    issueId: 'ISSUE_ID',
    issueNumber: 1,
    authorId: 'AUTHOR_ID',
    authorName: 'TEST_NAME',
    platformPostId: 'SLACK_THREAD_TS',
    platform: {} as Platform,
  } as Ticket,
  {
    issueId: 'ISSUE_ID_2',
    issueNumber: 2,
    authorId: 'AUTHOR_ID',
    authorName: 'TEST_NAME',
    platformPostId: 'SLACK_THREAD_TS',
    platform: {} as Platform,
  } as Ticket,
  {
    issueId: 'ISSUE_ID_4',
    issueNumber: 3,
    authorId: 'AUTHOR_ID',
    authorName: 'TEST_NAME',
    platformPostId: 'SLACK_THREAD_TS',
    platform: {} as Platform,
  } as Ticket,
];

jest.mock('../../../env.ts');

describe('Issue blocks used in app home', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('correctly forms a list of issue blocks', async () => {
    const blocks = await issueBlocks(mockOpenGithubIssue, mockTickets, mockClient);

    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ text: expect.stringContaining('Test body of issue') }),
          ]),
        }),
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ text: expect.stringContaining('A really large string') }),
          ]),
        }),
        expect.objectContaining({
          elements: expect.arrayContaining([
            expect.objectContaining({
              text: expect.objectContaining({ text: expect.stringContaining('Go to Thread :slack:') }),
            }),
          ]),
        }),
      ]),
    );
  });
});
