import 'jest';
import logger from '../../../logger';

jest.useFakeTimers();
jest.mock('../../../env.ts', () => {
  const actualEnv = jest.requireActual('../../../env').env;
  return {
    env: {
      ...actualEnv,
      nodeEnv: 'developer',
    },
  };
});
jest.spyOn(logger, 'error').mockImplementation();

const githubGraphqlMock = jest.fn().mockResolvedValue({
  repository: { object: { text: '' } },
});
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn((args) => githubGraphqlMock(args)),
}));
let getAnnouncement: any;

describe('github fetch announcement util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      getAnnouncement = require('../../../github/utils/fetchAnnouncement').getAnnouncement;
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('will use the auto fetch announcement cache', async () => {
    await new Promise<void>((r) => setImmediate(() => r()));
    githubGraphqlMock.mockClear();
    await getAnnouncement();
    expect(githubGraphqlMock).toBeCalledTimes(0);
  });

  it('will use a cache on subsequent uses', (done) => {
    jest.isolateModules(async () => {
      githubGraphqlMock.mockRejectedValueOnce(new Error());

      const isolatedGetAnnouncement = require('../../../github/utils/fetchAnnouncement').getAnnouncement;

      // Wait for promises to resolve/reject before continuing
      await new Promise<void>((r) => setImmediate(() => r()));

      githubGraphqlMock.mockReset();
      githubGraphqlMock.mockResolvedValue({
        repository: {},
      });

      await isolatedGetAnnouncement();
      await isolatedGetAnnouncement();
      expect(githubGraphqlMock).toBeCalledTimes(1);

      done();
    });
  });
});
