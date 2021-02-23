import 'jest';
import { AllMiddlewareArgs, App, Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';
import logger from '../../../logger';

const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
jest.spyOn(logger, 'debug').mockImplementation();
jest.mock('../../../env');

const postMessageMock = jest.fn();
jest.mock('../../../github/utils/postMessage.ts', () => ({
  postMessage: postMessageMock,
}));

const mockTs = '123456.789';
const mockChannel = 'support';
const mockAppId = '1234';
const mockPermalink = 'chat-permalink';
const mockRealName = 'Jane Doe';
const mockDisplayName = 'jane.doe';
const reactionsAddMock = jest.fn();
const authTestMock = jest.fn(() => ({ user_id: mockAppId }));
const getPermalinkMock = jest.fn(() => ({ permalink: mockPermalink }));
const usersInfoMock = jest.fn(() => ({
  user: { profile: { real_name: mockRealName, display_name: mockDisplayName } },
}));
const mockApp = {
  client: {
    reactions: {
      add: reactionsAddMock,
    },
    auth: {
      test: authTestMock,
    },
    chat: {
      getPermalink: getPermalinkMock,
    },
    users: {
      info: usersInfoMock,
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ticketFindOneMock = jest.fn(
  async (): Promise<any> => ({
    platformPostId: mockTs,
    issueId: 'KJFAKSJFKAHLKF',
  }),
);
jest.mock('../../../entities/Ticket.ts', () => {
  const { Platform } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Ticket: {
      findOne: ticketFindOneMock,
    },
    Platform,
  };
});

function getMockMessageEvent(
  parentUserId: string,
  text: string | undefined,
  ts: string,
  channel: string,
  subtype?: string,
  files?: string[],
) {
  return ({
    message: { parent_user_id: parentUserId, text, ts, channel, subtype, files },
  } as unknown) as SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs;
}

let messageRepliedHandler: Middleware<SlackEventMiddlewareArgs<'message'>>;

describe('messageReplied event listener', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Get a clean copy of the module to avoid state being an issue
    jest.isolateModules(() => {
      messageRepliedHandler = require('../../../slack/events/messageReplied').messageReplied(
        (mockApp as unknown) as App,
      );
    });
  });

  it('adds a reaction to the message sent by a user', async () => {
    const mockMessageEvent = getMockMessageEvent(mockAppId, 'Hello world!', mockTs, mockChannel);
    await messageRepliedHandler(mockMessageEvent);

    expect(authTestMock).toBeCalled();
    expect(reactionsAddMock).toBeCalled();
    expect(usersInfoMock).toBeCalled();
    expect(postMessageMock).toBeCalledTimes(1);
    const { timestamp, channel, name } = reactionsAddMock.mock.calls[0][0];
    expect(timestamp).toEqual(mockTs);
    expect(channel).toEqual(mockChannel);
    expect(name).toEqual('eyes');
  });

  it('throws an error if it cannot react to the message', async () => {
    const mockMessageEvent = getMockMessageEvent(mockAppId, 'Hello world!', mockTs, mockChannel);
    reactionsAddMock.mockRejectedValueOnce(new Error('Oof!'));
    await messageRepliedHandler(mockMessageEvent);

    expect(authTestMock).toBeCalled();
    expect(reactionsAddMock).toBeCalled();
    expect(loggerErrorSpy).toBeCalled();
  });

  it('caches auth info after one call', async () => {
    const mockMessageEvent = getMockMessageEvent(mockAppId, 'Hello world!', mockTs, mockChannel);
    reactionsAddMock.mockRejectedValueOnce(new Error('Unable to add reaction!'));
    await messageRepliedHandler(mockMessageEvent);
    await messageRepliedHandler(mockMessageEvent);

    expect(authTestMock).toBeCalledTimes(1);
  });

  it('ignores replies on unrelated posts', async () => {
    const anotherUserId = `NOT ${mockAppId}`;
    const mockMessageEvent = getMockMessageEvent(anotherUserId, 'Hello world!', mockTs, mockChannel);
    reactionsAddMock.mockRejectedValueOnce(new Error('Unable to add reaction!'));
    await messageRepliedHandler(mockMessageEvent);

    expect(reactionsAddMock).not.toBeCalled();
  });

  it('ignores replies from other bots', async () => {
    const mockMessageEvent = getMockMessageEvent(mockAppId, 'Hello world!', mockTs, mockChannel, 'bot_message');
    reactionsAddMock.mockRejectedValueOnce(new Error('Unable to add reaction!'));
    await messageRepliedHandler(mockMessageEvent);

    expect(reactionsAddMock).not.toBeCalled();
  });

  it('defaults to an error text if no message is found', async () => {
    const mockMessageEvent = getMockMessageEvent(mockAppId, undefined, mockTs, mockChannel);
    await messageRepliedHandler(mockMessageEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    const { message } = postMessageMock.mock.calls[0][1];
    expect(message).toEqual('Could not load message, please see this ticket in Slack');
  });

  it('includes a link to the message if file(s) are included', async () => {
    const mockMessageEvent = getMockMessageEvent(
      mockAppId,
      'This message has a file!',
      mockTs,
      mockChannel,
      undefined,
      ['some file URL'],
    );
    await messageRepliedHandler(mockMessageEvent);

    expect(postMessageMock).toBeCalledTimes(1);
    const { message } = postMessageMock.mock.calls[0][1];
    expect(message).toContain('Message contains file(s), see Slack to view them');
  });

  it('logs info and does not respond if an associated ticket cannot be found', async () => {
    const mockMessageEvent = getMockMessageEvent(mockAppId, 'This message has a file!', mockTs, mockChannel);
    ticketFindOneMock.mockResolvedValueOnce(undefined);
    await messageRepliedHandler(mockMessageEvent);

    expect(postMessageMock).not.toBeCalled();
    expect(loggerInfoSpy).toBeCalled();
  });
});
