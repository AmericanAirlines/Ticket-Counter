import { WebClient } from '@slack/web-api';

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
const mockClient = {
  users: {
    info: userInfoMock,
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
      const user = await getUserDetails('ABC123', mockClient as unknown as WebClient);
      expect(userInfoMock).toBeCalledTimes(1);
      expect(user).toEqual(mockUser);
      done();
    });
  });
  it('subsequent calls for the same user will not result in multiple API calls', (done) => {
    jest.isolateModules(async () => {
      const { getUserDetails } = require('../../../slack/utils/userCache');
      const user = await getUserDetails('ABC123', mockClient as unknown as WebClient);
      const user2 = await getUserDetails('ABC123', mockClient as unknown as WebClient);
      expect(userInfoMock).toBeCalledTimes(1);
      expect(user).toEqual(mockUser);
      expect(user2).toEqual(mockUser);
      done();
    });
  });
});
