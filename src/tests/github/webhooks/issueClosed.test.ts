import 'jest';
import { Status } from '../../../entities/Ticket';
import { issueClosed } from '../../../github/webhooks/issueClosed';
import logger from '../../../logger';
import { env } from '../../../env';

jest.spyOn(logger, 'info').mockImplementation();
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
const ticketUpdateMock = jest.fn();
const ticketFindOneOrFailMock = jest.fn().mockResolvedValue(ticket);
jest.mock('../../../entities/Ticket.ts', () => {
  const { Status: actualStatus } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Status: actualStatus,
    Ticket: {
      update: jest.fn((...args) => ticketUpdateMock(...args)),
      findOneOrFail: jest.fn((...args) => ticketFindOneOrFailMock(...args)),
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

describe('issue closed webhook handler', () => {
  issueClosed(mockWebhooks as any);
  const [events, issueClosedHandler] = mockWebhookOnAddListener.mock.calls[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers for the right event', () => {
    expect(events).toEqual('issues.closed');
  });

  it('updates the ticket to closed', async () => {
    const nodeId = 'NODE_ID';
    const mockEvent = getMockEvent(nodeId, {});
    await issueClosedHandler(mockEvent);

    expect(ticketUpdateMock).toHaveBeenCalledWith(nodeId, { status: Status.Closed });
  });

  it('does not post to Slack the event if the ticket has no platformPostId', async () => {
    ticketFindOneOrFailMock.mockResolvedValueOnce({ platformPostId: '' });

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueClosedHandler(mockEvent);

    expect(postMessageMock).not.toHaveBeenCalled();
  });

  it('posts to Slack and updates the reactions', async () => {
    const mockEvent = getMockEvent('NODE_ID', {});
    await issueClosedHandler(mockEvent);

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        thread_ts: ticket.platformPostId,
      }),
    );

    expect(postMessageMock.mock.calls[0][0].text).toEqual(expect.stringMatching(/closed this ticket$/i));
  });

  it('sends the users name in the Slack message', async () => {
    const tempUser = { name: 'USER_NAME' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueClosedHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0].text).toEqual(
      expect.stringMatching(new RegExp(`${tempUser.name} closed this ticket$`, 'i')),
    );
  });

  it('sends the users login in the Slack message, if there is no name', async () => {
    const tempUser = { login: 'USER_LOGIN' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueClosedHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0].text).toEqual(
      expect.stringMatching(new RegExp(`${tempUser.login} closed this ticket$`, 'i')),
    );
  });

  it('sends `Someone` in the Slack message, if there is no name or login', async () => {
    const tempUser = {};
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueClosedHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0].text).toEqual(
      expect.stringMatching(new RegExp(`Someone closed this ticket$`, 'i')),
    );
  });

  it('defaults to `Someone` if user is null', async () => {
    mockFetchUser.mockResolvedValueOnce(null);

    const mockEvent = getMockEvent('NODE_ID', user);
    await issueClosedHandler(mockEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    expect(postMessageMock.mock.calls[0][0].text).toEqual(
      expect.stringMatching(new RegExp(`Someone closed this ticket$`, 'i')),
    );
  });

  it('logs an error when it cant post to Slack', async () => {
    const postMessageError = new Error('Error posting to Slack');
    postMessageMock.mockRejectedValueOnce(postMessageError);

    const mockEvent = getMockEvent('NODE_ID', {});
    await issueClosedHandler(mockEvent);

    expect(errorLogger).toBeCalledTimes(1);
    expect(errorLogger.mock.calls[0]).toContain(postMessageError);
  });
});

interface User {
  login?: string;
  name?: string;
}

function getMockEvent(nodeId: string, sender: User): any {
  return {
    payload: {
      sender,
      issue: {
        node_id: nodeId,
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
