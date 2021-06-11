import { WebClient } from '@slack/web-api';
import { Platform, Ticket } from '../../../entities/Ticket';
import { issueBlocks } from '../../../slack/blocks/issueBlocks';
import { relativeDateFromTimestamp } from '../../../utils/dateFormatter';

const mockPermalink = 'chat-permalink';

const mockClient = {
  chat: {
    getPermalink: jest.fn().mockResolvedValue({ permalink: mockPermalink }),
  },
} as unknown as WebClient;

const mockTimeZone = 'America/Los_Angeles';
const MOCK_DATE_STRING = 'June 3, 2021, 2:28 PM PDT';


const mockOpenGithubIssue = [
  {
    id: 'ISSUE_ID',
    url: 'TEST_URL.com',
    body: 'Second Test body of issue\n send by someone in slack',
    createdAt: '2021-06-03T21:28:55Z',
    number: '1',
    state: 'OPEN',
    title: 'Mock Open Ticket',
    updatedAt: '2021-06-03T21:28:55Z',
  },
  {
    id: 'ISSUE_ID_3',
    url: 'TEST_URL_3.com',
    body: 'First Test body of issue\n send by someone in slack',
    createdAt: '2021-06-03T21:28:55Z',
    number: '3',
    state: 'OPEN',
    title: 'Mock Open Ticket 3',
    updatedAt: '2021-06-03T21:28:55Z',
  },
  {
    id: 'ISSUE_ID_2',
    url: 'TEST_URL_2.com',
    body: `${'A really large string'.repeat(3000)}\n`,
    createdAt: '2021-06-03T21:28:55Z',
    number: '2',
    state: 'OPEN',
    title: 'Mock Open Ticket 2',
    updatedAt: '2021-06-03T21:28:55Z',
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

jest.mock('../../../../src/utils/dateFormatter.ts', () => ({
  relativeDateFromTimestamp: jest.fn(),
}));

describe('Issue blocks used in app home', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('correctly forms a list of issue blocks', async () => {
    (relativeDateFromTimestamp as jest.Mock).mockReturnValue(MOCK_DATE_STRING);

    const blocks = await issueBlocks(mockOpenGithubIssue.slice(0, 2), mockTickets, mockClient, mockTimeZone);
    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.objectContaining({ text: expect.stringContaining('First Test body of issue') }),
        }),
        expect.objectContaining({
          text: expect.objectContaining({ text: expect.stringContaining(MOCK_DATE_STRING) }),
        }),
        expect.objectContaining({
          text: expect.objectContaining({ text: expect.stringContaining('Second Test body of issue') }),
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

  it('correctly forms a list of issue blocks when description is too long', async () => {
    const blocks = await issueBlocks(mockOpenGithubIssue, mockTickets, mockClient, mockTimeZone);

    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.objectContaining({ text: expect.stringContaining('A really large string') }),
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
