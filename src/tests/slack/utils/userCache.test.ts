import { App } from '@slack/bolt';

jest.mock('../../../env.ts');

const mockRealName = 'Jane Doe';
const mockDisplayName = 'jane.doe';
const mockUser = {
  real_name: mockRealName,
  profile: { real_name: mockRealName, display_name: mockDisplayName },
};
const userInfoMock = jest.fn(() => ({
  user: mockUser,
}));
const mockApp = {
  client: {
    users: {
      info: userInfoMock,
    },
  },
};
describe('user cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses the user info api method to retrieve details', (done) => {
    jest.isolateModules(async () => {
      const { getUserDetails } = require('../../../slack/utils/userCache');
      const user = await getUserDetails('ABC123', (mockApp as unknown) as App);
      expect(userInfoMock).toBeCalledTimes(1);
      expect(user).toEqual(mockUser);
      done();
    });
  });
  it('subsequent calls for the same user will not result in multiple API calls', (done) => {
    jest.isolateModules(async () => {
      const { getUserDetails } = require('../../../slack/utils/userCache');
      const user = await getUserDetails('ABC123', (mockApp as unknown) as App);
      const user2 = await getUserDetails('ABC123', (mockApp as unknown) as App);
      expect(userInfoMock).toBeCalledTimes(1);
      expect(user).toEqual(mockUser);
      expect(user2).toEqual(mockUser);
      done();
    });
  });
});