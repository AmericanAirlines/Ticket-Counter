/* eslint-disable @typescript-eslint/no-unused-expressions, global-require */
import 'jest';
import fs from 'fs';

const fsReadFileSyncSpy = jest.spyOn(fs, 'readFileSync');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createAppAuthMock = jest.fn((args) => ({ auth: {} }));
jest.mock('@octokit/auth', () => ({
  createAppAuth: jest.fn((args) => createAppAuthMock(args)),
}));

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses a private key if one is provided', () => {
    jest.mock('../../env');

    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('../../github/graphql').githubGraphql;
    });
    expect(createAppAuthMock).toBeCalled();
    const { privateKey } = createAppAuthMock.mock.calls[0][0];
    expect(privateKey).toEqual('');
  });

  it('uses a private key if one is provided', () => {
    const mockPrivateKey = 'something super secretive';
    jest.mock('../../env', () => {
      const actualEnv = jest.requireActual('../../env');
      return {
        env: {
          ...actualEnv,
          githubAppPrivateKey: mockPrivateKey,
        },
      };
    });

    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('../../github/graphql').githubGraphql;
    });
    expect(createAppAuthMock).toBeCalled();
    const { privateKey } = createAppAuthMock.mock.calls[0][0];
    expect(privateKey).toEqual(mockPrivateKey);
  });

  it('uses a pem file if one is provided', () => {
    const mockPemContents = 'super secret file contents';
    fsReadFileSyncSpy.mockReturnValue(mockPemContents);
    jest.mock('../../env', () => {
      const actualEnv = jest.requireActual('../../env');
      return {
        env: {
          ...actualEnv,
          githubAppPemFile: mockPemContents,
        },
      };
    });

    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('../../github/graphql').githubGraphql;
    });
    expect(createAppAuthMock).toBeCalled();
    const { privateKey } = createAppAuthMock.mock.calls[0][0];
    expect(privateKey).toEqual(mockPemContents);
  });
});
