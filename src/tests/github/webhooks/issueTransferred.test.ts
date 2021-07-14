import { HandlerFunction } from '@octokit/webhooks/dist-types/types';
import { app } from '../../../app';
import { Status, Ticket } from '../../../entities/Ticket';
import { env } from '../../../env';
import { issueTransferred } from '../../../github/webhooks/issueTransferred';
import logger from '../../../logger';
import { getMock } from '../../utils/getMock';

jest.mock('../../../env');
const mockLoggerError = jest.spyOn(logger, 'error').mockImplementation();

const webhooksMock = {
  on: jest.fn(),
};

const postMessageMock = getMock(app.client.chat.postMessage).mockResolvedValue(undefined as any);
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

function getMockTicket(status = Status.Open) {
  return {
    issueId: 'TicketNodeId',
    platformPostId: '123123',
    status,
  };
}

const mockWebhookEvent = {
  payload: {
    action: 'transferred',
    sender: {
      name: 'Jane Doe',
      login: 'jane-doe',
    },
    issue: {
      node_id: 'MOCK_OLD_NODE_ID',
    },
    changes: {
      new_issue: {
        node_id: 'MOCK_NEW_NODE_ID',
        html_url: 'MOCK_NEW_HTML_URL',
      },
    },
  },
};

const ticket = getMockTicket();
const ticketUpdateMock = getMock(Ticket.update);
const ticketFindOneMock = getMock(Ticket.findOne).mockResolvedValue(ticket as any);
jest.mock('../../../entities/Ticket.ts', () => {
  const { Status: actualStatus } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Status: actualStatus,
    Ticket: {
      findOne: jest.fn(),
      update: jest.fn(),
    },
  };
});

describe('issue transferred webhook handler', () => {
  let webhook: jest.MockedFunction<HandlerFunction<'issues.transferred', unknown>>;

  beforeEach(() => {
    jest.clearAllMocks();

    issueTransferred(webhooksMock as any);

    // eslint-disable-next-line prefer-destructuring
    webhook = webhooksMock.on.mock.calls[0][1];
  });

  it('sets up the webhook correctly', () => {
    expect(webhooksMock.on).toHaveBeenCalledTimes(1);
    expect(webhooksMock.on).toHaveBeenCalledWith('issues.transferred', expect.any(Function));
  });

  it('updates tickets in database', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 0 } as any);
    ticketFindOneMock.mockResolvedValueOnce(undefined);

    await webhook(mockWebhookEvent as any);

    expect(ticketUpdateMock).toHaveBeenCalledTimes(1);
    expect(ticketUpdateMock).toHaveBeenCalledWith(
      { issueId: mockWebhookEvent.payload.issue.node_id },
      { issueId: mockWebhookEvent.payload.changes.new_issue.node_id },
    );

    expect(ticketFindOneMock).toHaveBeenCalledTimes(1);
    expect(ticketFindOneMock).toHaveBeenCalledWith(mockWebhookEvent.payload.changes.new_issue.node_id);
  });

  it('does not notify the thread if no affected number was returned from DB', async () => {
    ticketUpdateMock.mockResolvedValueOnce({} as any);

    await webhook(mockWebhookEvent as any);

    expect(postMessageMock).toHaveBeenCalledTimes(0);
  });

  it('notifies the thread if the updated ticket has a thread', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 1 } as any);

    await webhook(mockWebhookEvent as any);

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        thread_ts: ticket.platformPostId,
        text: expect.stringContaining(
          `${mockWebhookEvent.payload.sender.name} transferred this issue to ${mockWebhookEvent.payload.changes.new_issue.html_url}`,
        ),
      }),
    );
  });

  it('notifies the thread with no sender in webhook payload', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 1 } as any);

    await webhook({
      payload: {
        ...mockWebhookEvent.payload,
        sender: undefined,
      },
    } as any);

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Someone'),
      }),
    );
  });

  it('notifies the thread with only sender login in webhook payload', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 1 } as any);

    await webhook({
      payload: {
        ...mockWebhookEvent.payload,
        sender: {
          login: mockWebhookEvent.payload.sender.login,
        },
      },
    } as any);

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(mockWebhookEvent.payload.sender.login),
      }),
    );
  });

  it('notifies the thread with only sender login in webhook payload', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 1 } as any);

    await webhook({
      payload: {
        ...mockWebhookEvent.payload,
        sender: {
          login: mockWebhookEvent.payload.sender.login,
        },
      },
    } as any);

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(mockWebhookEvent.payload.sender.login),
      }),
    );
  });

  it('logs error if thread notification fails', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 1 } as any);

    const mockError = new Error('Mock');
    postMessageMock.mockRejectedValueOnce(mockError);

    await webhook(mockWebhookEvent as any);

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining(ticket.issueId), mockError);
  });

  it('does not notify in thread if the issue has no platformPostId', async () => {
    ticketUpdateMock.mockResolvedValueOnce({ affected: 1 } as any);
    ticketFindOneMock.mockResolvedValueOnce({ ...ticket, platformPostId: undefined } as any);

    await webhook(mockWebhookEvent as any);

    expect(postMessageMock).toHaveBeenCalledTimes(0);
  });
});
