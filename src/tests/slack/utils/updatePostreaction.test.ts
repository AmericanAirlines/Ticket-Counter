import 'jest';
import { Status } from '../../../entities/Ticket';
import { env } from '../../../env';
import logger from '../../../logger';
import { Emoji, updatePostReactions } from '../../../slack/utils/updatePostReactions';

const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();

jest.mock('../../../env', () => {
  const actualEnv = jest.requireActual('../../../env');
  return {
    env: {
      ...actualEnv,
      slackSupportChannel: 'some-cool-channel',
      slackBotToken: 'xoxb-123',
    },
  };
});

const mockTs = '123456.789';

const addReactionMock = jest.fn();
const removeReactionMock = jest.fn();
jest.mock('../../../app.ts', () => ({
  app: {
    client: {
      reactions: {
        add: jest.fn((args) => addReactionMock(args)),
        remove: jest.fn((args) => removeReactionMock(args)),
      },
    },
  },
}));

describe('update post reactions util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('will add the right emojis when moved to In Progress', async () => {
    await updatePostReactions(Status.InProgress, mockTs);
    expect(addReactionMock).toBeCalledTimes(1);
    const { name: addName, timestamp: addTs } = addReactionMock.mock.calls[0][0];
    expect(addName).toEqual(Emoji.InProgress);
    expect(addTs).toEqual(mockTs);

    expect(removeReactionMock).toBeCalledTimes(1);
    const { name: removeName, timestamp: removeTs } = removeReactionMock.mock.calls[0][0];
    expect(removeName).toEqual(Emoji.Closed);
    expect(removeTs).toEqual(mockTs);
  });

  it('will add the right emojis when moved to Closed', async () => {
    await updatePostReactions(Status.Closed, mockTs);
    expect(addReactionMock).toBeCalledTimes(1);
    const { name: addName, timestamp: addTs } = addReactionMock.mock.calls[0][0];
    expect(addName).toEqual(Emoji.Closed);
    expect(addTs).toEqual(mockTs);

    expect(removeReactionMock).toBeCalledTimes(1);
    const { name: removeName, timestamp: removeTs } = removeReactionMock.mock.calls[0][0];
    expect(removeName).toEqual(Emoji.InProgress);
    expect(removeTs).toEqual(mockTs);
  });

  it('will add the right emojis when moved to Open for the first time', async () => {
    await updatePostReactions(Status.Open, mockTs);
    expect(addReactionMock).not.toBeCalled();

    expect(removeReactionMock).toBeCalledTimes(2);
    const names = removeReactionMock.mock.calls.map(([call]: any) => call.name);
    expect(names).toContain(Emoji.Closed);
    expect(names).toContain(Emoji.InProgress);
  });

  it('will add the right emojis when moved to Open after being closed (reopened)', async () => {
    await updatePostReactions(Status.Open, mockTs, true);
    expect(addReactionMock).toBeCalledTimes(1);
    const { name: addName, timestamp: addTs } = addReactionMock.mock.calls[0][0];
    expect(addName).toEqual(Emoji.Reopened);
    expect(addTs).toEqual(mockTs);

    expect(removeReactionMock).toBeCalledTimes(2);
    const names = removeReactionMock.mock.calls.map(([call]: any) => call.name);
    expect(names).toContain(Emoji.Closed);
    expect(names).toContain(Emoji.InProgress);
  });

  it('will ignore errors if no_reaction is returned from Slack', async () => {
    addReactionMock.mockRejectedValueOnce({ data: { error: 'no_reaction' } });
    await updatePostReactions(Status.InProgress, mockTs);
    expect(loggerErrorSpy).not.toBeCalled();
  });

  it('will ignore errors if already_reacted is returned from Slack', async () => {
    addReactionMock.mockRejectedValueOnce({ data: { error: 'already_reacted' } });
    await updatePostReactions(Status.InProgress, mockTs);
    expect(loggerErrorSpy).not.toBeCalled();
  });
  
  it('will log errors legitimate error', async () => {
    addReactionMock.mockRejectedValueOnce(new Error("I'm legit, I swear!"));
    await updatePostReactions(Status.InProgress, mockTs);
    expect(loggerErrorSpy).toBeCalled();
  });

  it('will use the right slack token and slack support channel', async () => {
    await updatePostReactions(Status.InProgress, mockTs);
    expect(addReactionMock).toBeCalledTimes(1);
    const { token, channel } = addReactionMock.mock.calls[0][0];
    expect(token).toEqual(env.slackBotToken);
    expect(channel).toEqual(env.slackSupportChannel);
  });
});
