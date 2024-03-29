/* eslint-disable @typescript-eslint/no-unused-expressions */
import 'jest';
import { env } from '../../env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createAppAuthMock = jest.fn((args) => ({ auth: {} }));
jest.mock('@octokit/auth', () => ({
  createAppAuth: jest.fn((args) => createAppAuthMock(args)),
}));

jest.mock('../../env');

const fsReadFileSyncMock = jest.fn();
jest.mock('fs', () => ({
  readFileSync: jest.fn((...args) => fsReadFileSyncMock(...args)),
}));

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (env.githubAppPrivateKey as any) = undefined;
    (env.githubAppPemFile as any) = '';
  });

  it('defaults to an empty string if private key is not provided', () => {
    jest.isolateModules(() => {
      require('../../github/graphql').githubGraphql;
    });

    expect(createAppAuthMock).toBeCalled();
    const { privateKey } = createAppAuthMock.mock.calls[0][0];
    expect(privateKey).toEqual('');
  });

  it('uses a private key if one is provided', () => {
    const mockPrivateKey = 'something super secretive';
    (env.githubAppPrivateKey as any) = mockPrivateKey;

    jest.isolateModules(() => {
      require('../../github/graphql').githubGraphql;
    });
    expect(createAppAuthMock).toBeCalled();
    const { privateKey } = createAppAuthMock.mock.calls[0][0];
    expect(privateKey).toEqual(mockPrivateKey);
  });

  it('uses a pem file if one is provided', () => {
    const mockPemContents = 'super secret file contents';
    fsReadFileSyncMock.mockReturnValueOnce(mockPemContents);
    (env.githubAppPemFile as any) = mockPemContents;

    jest.isolateModules(() => {
      require('../../github/graphql').githubGraphql;
    });
    expect(createAppAuthMock).toBeCalled();
    const { privateKey } = createAppAuthMock.mock.calls[0][0];
    expect(privateKey).toEqual(mockPemContents);
  });
});
