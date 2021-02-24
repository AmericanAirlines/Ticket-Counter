import logger from '../../../logger';
import { makeUserMentionsReadable } from '../../../slack/utils/makeUserMentionsReadable';

const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();

const getUserDetailsMock = jest.fn();
jest.mock('../../../slack/utils/userCache.ts', () => ({
  getUserDetails: jest.fn(async () => getUserDetailsMock()),
}));

const getExternalUserDisplayTextMock = jest.fn();
jest.mock('../../../slack/utils/getExternalUserDisplayText.ts', () => ({
  getExternalUserDisplayText: jest.fn(() => getExternalUserDisplayTextMock()),
}));

describe('make user mentions readable util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces a user mention with a display name', async () => {
    const displayText = 'Jane Smith';
    getExternalUserDisplayTextMock.mockReturnValueOnce(displayText);
    const text = await makeUserMentionsReadable('Hello <@ABC123>!', {} as any);
    expect(getExternalUserDisplayTextMock).toBeCalledTimes(1);
    expect(text).toEqual(`Hello ${displayText}!`);
  });

  it('replaces multiple user names', async () => {
    const displayText1 = 'Jane Smith';
    const displayText2 = 'Jane Smith';
    getExternalUserDisplayTextMock.mockReturnValueOnce(displayText1).mockReturnValueOnce(displayText2);

    const text = await makeUserMentionsReadable('Hello <@ABC123> and <@DEF456>!', {} as any);
    expect(getExternalUserDisplayTextMock).toBeCalledTimes(2);
    expect(text).toEqual(`Hello ${displayText1} and ${displayText2}!`);
  });
  it('replaces multiple instances of the same name without multiple calls to get user details', async () => {
    const displayText = 'Jane Smith';
    getExternalUserDisplayTextMock.mockReturnValueOnce(displayText);
    const userId = 'ABC123';
    const text = await makeUserMentionsReadable(`Hello <@${userId}>! How do you do, <@${userId}>?`, {} as any);
    expect(getExternalUserDisplayTextMock).toBeCalledTimes(1);
    expect(text).toEqual(`Hello ${displayText}! How do you do, ${displayText}?`);
  });

  it('leaves plain text alone', async () => {
    const originalText = 'lorem ipsum latin is fancy';
    const text = await makeUserMentionsReadable(originalText, {} as any);
    expect(text).toEqual(originalText);
    expect(getExternalUserDisplayTextMock).not.toBeCalled();
  });

  it('leaves user mentions as is if the associated user can\t be found', async () => {
    const originalText = "Slack doesn't know who <@BREAKME> is";
    getUserDetailsMock.mockRejectedValueOnce(new Error('Who is that???'));
    const text = await makeUserMentionsReadable(originalText, {} as any);
    expect(text).toEqual(originalText.replace('<@BREAKME>', '@BREAKME (Unknown User)'));
    expect(getExternalUserDisplayTextMock).not.toBeCalled();
    expect(loggerErrorSpy).toBeCalledTimes(1);
  });
});
