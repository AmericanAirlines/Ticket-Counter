import 'jest';
import { Status } from '../../../entities/Ticket';
import { issueAssignmentChanged } from '../../../github/webhooks/issueAssignmentChanged';
import logger from '../../../logger';
import { env } from '../../../env';
import { Emoji } from '../../../slack/utils/updatePostReactions';

jest.spyOn(logger, 'debug').mockImplementation();
const errorLogger = jest.spyOn(logger, 'error').mockImplementation();

const mockWebhookOnAddListener = jest.fn();

const mockWebhooks = {
  on: mockWebhookOnAddListener,
};

const postMessageMock = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../app.ts', () => ({
  app: { client: { chat: { postMessage: jest.fn((...args) => postMessageMock(...args)) } } },
}));

const updatePostReactionsMock = jest.fn();
jest.mock('../../../slack/utils/updatePostReactions.ts', () => {
  const { Emoji: actualEmoji } = jest.requireActual('../../../slack/utils/updatePostReactions.ts');
  return {
    Emoji: actualEmoji,
    updatePostReactions: jest.fn((...args) => updatePostReactionsMock(...args)),
  };
});

const ticket = getMockTicket();
const mockExecute = jest.fn(async () => ({
  affected: 1,
  raw: [ticket],
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

const user = {
  login: 'JaneSmith',
  name: 'Jane Smith',
};
const mockFetchUser = jest.fn().mockResolvedValue(user);
jest.mock('../../../github/utils/fetchUser.ts', () => ({
  fetchUser: jest.fn(() => mockFetchUser()),
}));

jest.mock('../../../env.ts', () => ({
  env: {
    slackBotToken: 'token',
    slackSupportChannel: 'channel',
  },
}));

describe('issue assignment changed webhook handler', () => {
  issueAssignmentChanged(mockWebhooks as any);
  const [events, issueAssignmentChangedHandler] = mockWebhookOnAddListener.mock.calls[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers for the right events', () => {
    expect(events).toEqual(['issues.assigned', 'issues.unassigned']);
  });

  it('updates the thread and updates reactions in Slack when someone is assigned', async () => {
    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0]).toEqual({
      token: env.slackBotToken,
      channel: env.slackSupportChannel,
      text: `:${Emoji.InProgress}: ${user.name} has been assigned to this ticket`,
      thread_ts: ticket.platformPostId,
    });

    expect(updatePostReactionsMock).toBeCalledTimes(1);
    expect(updatePostReactionsMock).toBeCalledWith(ticket.status, ticket.platformPostId);
  });

  it('updates the thread and updates reactions in Slack when someone is unassigned', async () => {
    const mockEvent = getMockEvent('unassigned', user, []);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0].text).toEqual(
      `:${Emoji.InProgress}: ${user.name} has been unassigned to this ticket`,
    );
  });

  it('updates the thread and updates reactions in Slack when someone is assigned', async () => {
    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0]).toEqual({
      token: env.slackBotToken,
      channel: env.slackSupportChannel,
      text: `:${Emoji.InProgress}: ${user.name} has been assigned to this ticket`,
      thread_ts: ticket.platformPostId,
    });

    expect(updatePostReactionsMock).toBeCalledTimes(1);
    expect(updatePostReactionsMock).toBeCalledWith(ticket.status, ticket.platformPostId);
  });

  it('updates the support members for the ticket', async () => {
    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(mockCreateQueryBuilder.mock.results[0].value.set).toBeCalledWith({
      supportMembers: [user.login],
      status: Status.InProgress,
    });
  });

  it.todo('logs an error when a DB issue occurs');

  it('ignores events when the number of affected is not a number', async () => {
    mockExecute.mockResolvedValueOnce({
      affected: '',
    } as any);

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).not.toBeCalled();
  });

  it('ignores events when the number of affected is not 1+', async () => {
    mockExecute.mockResolvedValueOnce({
      affected: 0,
    } as any);

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).not.toBeCalled();
  });

  it('updates the thread and updates reactions in Slack when someone is assigned', async () => {
    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0]).toEqual({
      token: env.slackBotToken,
      channel: env.slackSupportChannel,
      text: `:${Emoji.InProgress}: ${user.name} has been assigned to this ticket`,
      thread_ts: ticket.platformPostId,
    });

    expect(updatePostReactionsMock).toBeCalledTimes(1);
    expect(updatePostReactionsMock).toBeCalledWith(ticket.status, ticket.platformPostId);
  });

  it('ignores events when there is no assignee in the event payload', async () => {
    const mockEvent = getMockEvent('assigned', undefined as any, []);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).not.toBeCalled();
  });

  it('defaults to user login if name is undefined', async () => {
    const tempUser = { login: 'USER_LOGIN' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0].text).toContain(tempUser.login);
  });

  it('defaults to `Someone` if name and login are undefined', async () => {
    mockFetchUser.mockResolvedValueOnce({});

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0].text).toContain('Someone');
  });

  it('defaults to `Someone` if user is null', async () => {
    mockFetchUser.mockResolvedValueOnce(null);

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0].text).toContain('Someone');
  });

  it('ignores events when there is no platformPostId for the ticket', async () => {
    mockExecute.mockResolvedValueOnce({ affected: 1, raw: [{ status: Status.Open, platformPostId: '' }] });

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(postMessageMock).not.toBeCalled();
  });

  it('logs an error when there is a problem posting to slack', async () => {
    const postMessageError = new Error('POST_MESSAGE_ERROR');
    postMessageMock.mockRejectedValueOnce(postMessageError);

    const mockEvent = getMockEvent('assigned', user);
    await issueAssignmentChangedHandler(mockEvent);

    expect(errorLogger).toBeCalledTimes(1);
    expect(errorLogger.mock.calls[0]).toContain(postMessageError);
  });
});

interface User {
  login?: string;
  name?: string;
}

function getMockEvent(action: string, assignee: User, assignees?: User[]): any {
  return {
    payload: {
      action,
      assignee,
      issue: {
        assignees: assignees ?? [assignee],
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
