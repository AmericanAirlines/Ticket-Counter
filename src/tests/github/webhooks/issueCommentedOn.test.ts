import 'jest';
import { Status } from '../../../entities/Ticket';
import { issueCommentedOn } from '../../../github/webhooks/issueCommentedOn';
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

const ticket = getMockTicket();
const ticketFindOneOrFailMock = jest.fn().mockResolvedValue(ticket);
jest.mock('../../../entities/Ticket.ts', () => {
  const { Status: actualStatus } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Status: actualStatus,
    Ticket: {
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

describe('issue commented on webhook handler', () => {
  issueCommentedOn(mockWebhooks as any);
  const [events, issueCommentedOnHandler] = mockWebhookOnAddListener.mock.calls[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers for the right event', () => {
    expect(events).toEqual('issue_comment.created');
  });

  it('does not post to Slack the event if the ticket has no platformPostId', async () => {
    ticketFindOneOrFailMock.mockResolvedValueOnce({ platformPostId: '' });

    const mockEvent = getMockEvent('NODE_ID', {}, {});
    await issueCommentedOnHandler(mockEvent);

    expect(postMessageMock).not.toHaveBeenCalled();
  });

  it('posts to Slack and updates the reactions', async () => {
    const mockEvent = getMockEvent('NODE_ID', {}, {});
    await issueCommentedOnHandler(mockEvent);

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        thread_ts: ticket.platformPostId,
      }),
    );
  });

  it('sends the users name and login in the Slack message', async () => {
    const tempUser = { name: 'USER_NAME', login: 'USER_LOGIN' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {}, {});
    await issueCommentedOnHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0].text).toContain(`From ${tempUser.name} (\`@${tempUser.login}\`)`);
  });

  it('sends the users login in the Slack message, if there is no name', async () => {
    const tempUser = { login: 'USER_LOGIN' };
    mockFetchUser.mockResolvedValueOnce(tempUser);

    const mockEvent = getMockEvent('NODE_ID', {}, {});
    await issueCommentedOnHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0].text).toContain(`From \`@${tempUser.login}\``);
  });

  it('sends `someone` in the Slack message, if there is no name or login', async () => {
    mockFetchUser.mockResolvedValueOnce(null);

    const mockEvent = getMockEvent('NODE_ID', {}, {});
    await issueCommentedOnHandler(mockEvent);

    expect(postMessageMock.mock.calls[0][0].text).toContain('From someone');
  });

  it('logs an error when it cant post to Slack', async () => {
    const postMessageError = new Error('Error posting to Slack');
    postMessageMock.mockRejectedValueOnce(postMessageError);

    const mockEvent = getMockEvent('NODE_ID', {}, {});
    await issueCommentedOnHandler(mockEvent);

    expect(errorLogger).toBeCalledTimes(1);
    expect(errorLogger.mock.calls[0]).toContain(postMessageError);
  });
});

interface User {
  login?: string;
  name?: string;
}

interface Comment {
  body?: string;
  html_url?: string;
}

function getMockEvent(nodeId: string, comment: Comment, sender: User): any {
  return {
    payload: {
      sender,
      comment,
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
