import 'jest';
import { Status } from '../../../entities/Ticket';
import { issueAssignmentChanged } from '../../../github/webhooks/issueAssignmentChanged';
import logger from '../../../logger';

const mockWebhookOnAddListener = jest.fn();

const mockWebhooks = {
  on: mockWebhookOnAddListener,
};

const postMessageMock = jest.fn();
jest.mock('../../../app.ts', () => ({
  app: { client: { chat: { postMessage: jest.fn((args) => postMessageMock(args)) } } },
}));

const updatePostReactionsMock = jest.fn();
jest.mock('../../../slack/utils/updatePostReactions.ts', () => ({
  updatePostReactions: jest.fn((args) => updatePostReactionsMock(args)),
}));

const mockExecute = jest.fn(async () => ({
  affected: 1,
  raw: getMockTicket(),
}));
const mockCreateQueryBuilder = jest.fn(() => ({
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(() => mockExecute()),
}));
jest.mock('../../../entities/Ticket.ts', () => {
  const { Status: actualStatus } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Status: actualStatus,
    Ticket: {
      createQueryBuilder: jest.fn(() => mockCreateQueryBuilder()),
    },
  };
});

const mockFetchUser = jest.fn().mockResolvedValue({
  login: 'JaneSmith',
  name: 'Jane Smith',
});
jest.mock('../../../github/utils/fetchUser.ts', () => ({
  fetchUser: jest.fn(() => mockFetchUser()),
}));

jest.mock('../../../env.ts');
jest.spyOn(logger, 'debug').mockImplementation();

describe('issue assignment changed webhook handler', () => {
  issueAssignmentChanged(mockWebhooks as any);
  const [events, issueAssignmentChangedHandler] = mockWebhookOnAddListener.mock.calls[0];

  it('registers for the right events', () => {
    expect(events).toEqual(['issues.assigned', 'issues.unassigned']);
  });

  it('updates the thread and updates reactions in Slack when someone is assigned', async () => {
    const mockEvent = getMockEvent([{ login: 'JaneSmith' }]);
    await issueAssignmentChangedHandler(mockEvent);
  });

  it.todo('it handles no assignees appropriately');
  it.todo('updates the support members for the ticket');
  it.todo('logs an error when a DB issue occurs');
  it.todo('ignores events when the number of affected is not a number');
  it.todo('ignores events when the number of affected is not 1+');
});

interface User {
  login?: string;
  name?: string;
}

function getMockEvent(assignees?: User[]): any {
  return {
    payload: {
      issue: {
        assignees,
      },
    },
  };
}

function getMockTicket(status = Status.Open) {
  return {
    platformPostId: '123123',
    status,
  };
}
