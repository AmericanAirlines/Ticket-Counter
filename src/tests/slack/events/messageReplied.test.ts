import 'jest';
import { AllMiddlewareArgs, App, Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';
import logger from '../../../logger';

jest.spyOn(logger, 'info').mockImplementation();
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
jest.spyOn(logger, 'debug').mockImplementation();
jest.mock('../../../env');

jest.mock('../../../github/utils/postMessage.ts', () => ({
  postMessage: jest.fn(),
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
const ticketFindOneMock = jest.fn((_args: any) => ({
  platformPostId: mockTs,
  issueId: 'KJFAKSJFKAHLKF',
}));
jest.mock('../../../entities/Ticket.ts', () => {
  const { Platform } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Ticket: {
      findOne: jest.fn((args) => ticketFindOneMock(args)),
    },
    Platform,
  };
});

function getMockMessageEvent(parentUserId: string, text: string, ts: string, channel: string, subtype?: string) {
  return ({
    message: { parent_user_id: parentUserId, text, ts, channel, subtype },
  } as unknown) as SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs;
}

let messageRepliedHandler: Middleware<SlackEventMiddlewareArgs<'message'>>;

describe('messageReplied event listener', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Get a clean copy of the module to avoid state being an issue
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
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
});
