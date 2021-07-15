/* eslint-disable @typescript-eslint/no-unused-vars */
import 'jest';
import { ChatPostMessageResponse } from '@slack/web-api';
import { Status, Ticket } from '../../../entities/Ticket';
import { issueReopened } from '../../../github/webhooks/issueReopened';
import logger from '../../../logger';
import { env } from '../../../env';
import { app } from '../../../app';
import { getMock } from '../../utils/getMock';

jest.spyOn(logger, 'info').mockImplementation();
jest.spyOn(logger, 'debug').mockImplementation();
const errorLogger = jest.spyOn(logger, 'error').mockImplementation();
const mockWebhookOnAddListener = jest.fn();

const mockWebhooks = {
  on: mockWebhookOnAddListener,
};

const postMessageMock = getMock(app.client.chat.postMessage);
jest.mock('../../../app.ts', () => ({
  app: { client: { chat: { postMessage: jest.fn() } } },
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
jest.mock('../../../entities/Ticket.ts', () => {
  const { Status: actualStatus } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Status: actualStatus,
    Ticket: {
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    },
  };
});

const user = {
  login: 'JaneSmith',
  name: 'Jane Smith',
} as User;
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

describe('issue reopened webhook handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Ticket.findOneOrFail as jest.Mock).mockResolvedValue(ticket);
    issueReopened(mockWebhooks as any);
  });

  it('registers for the right event', () => {
    const [events] = mockWebhookOnAddListener.mock.calls[0];
    expect(events).toEqual(['issues.reopened', 'issues.transferred']);
  });

  it('updates the ticket to open with no one assigned', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];
    const mockPostMessageResponse = {
      ok: true,
      channel: 'MOCK_CHANNEL_ID',
      message: {},
    } as ChatPostMessageResponse;

    postMessageMock.mockResolvedValue(mockPostMessageResponse);
    const nodeId = 'NODE_ID';
    const mockEvent = getMockEvent(nodeId, {});
    await issueReopenedHandler(mockEvent);

    expect(Ticket.update as jest.Mock).toHaveBeenCalledWith(nodeId, { status: Status.Open, supportMembers: [] });
  });

  it('reopens the ticket to in progress with someone assigned', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];
    const mockPostMessageResponse = {
      ok: true,
      channel: 'MOCK_CHANNEL_ID',
      message: {},
    } as ChatPostMessageResponse;

    postMessageMock.mockResolvedValue(mockPostMessageResponse);
    const nodeId = 'NODE_ID';
    const mockEvent = getMockEvent(nodeId, {}, [user]);
    await issueReopenedHandler(mockEvent);

    expect(Ticket.update as jest.Mock).toHaveBeenCalledWith(nodeId, {
      status: Status.InProgress,
      supportMembers: [user.login],
    });
  });

  it('does not post to Slack the event if the ticket has no platformPostId', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];

    (Ticket.findOneOrFail as jest.Mock).mockResolvedValueOnce({ platformPostId: '' });

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(postMessageMock).not.toHaveBeenCalled();
  });

  it('posts to Slack and updates the reactions', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];
    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        thread_ts: ticket.platformPostId,
      }),
    );

    expect(postMessageMock.mock.calls[0][0]?.text).toEqual(expect.stringMatching(/reopened this ticket$/i));
  });

  it('sends the users name in the Slack message', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];
    const tempUser = { name: 'USER_NAME' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0]?.text).toEqual(
      expect.stringMatching(new RegExp(`${tempUser.name} reopened this ticket$`, 'i')),
    );
  });

  it('sends the users login in the Slack message, if there is no name', async () => {
    const [event, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];

    const tempUser = { login: 'USER_LOGIN' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0]?.text).toEqual(
      expect.stringMatching(new RegExp(`${tempUser.login} reopened this ticket$`, 'i')),
    );
  });

  it('sends `Someone` in the Slack message, if there is no name or login', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];

    const tempUser = {};
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0]?.text).toEqual(
      expect.stringMatching(new RegExp(`Someone reopened this ticket$`, 'i')),
    );
  });

  it('defaults to `Someone` if user is null', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];

    mockFetchUser.mockResolvedValueOnce(null);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0]?.text).toEqual(
      expect.stringMatching(new RegExp(`Someone reopened this ticket$`, 'i')),
    );
  });

  it('logs an error when it cant post to Slack', async () => {
    const [e, issueReopenedHandler] = mockWebhookOnAddListener.mock.calls[0];

    const postMessageError = new Error('Error posting to Slack');
    postMessageMock.mockRejectedValueOnce(postMessageError);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueReopenedHandler(mockEvent);

    expect(errorLogger).toBeCalledTimes(1);
    expect(errorLogger.mock.calls[0]).toContain(postMessageError);
  });
});

interface User {
  login?: string;
  name?: string;
}

function getMockEvent(nodeId: string, sender: User, assignees?: User[]): any {
  return {
    payload: {
      sender,
      issue: {
        node_id: nodeId,
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
