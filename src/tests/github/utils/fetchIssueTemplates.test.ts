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
  repository: {},
});
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn((args) => githubGraphqlMock(args)),
}));
let getIssueTemplates: any;

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      getIssueTemplates = require('../../../github/utils/fetchIssueTemplates').getIssueTemplates;
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('will use the auto fetch templates cache', async () => {
    await new Promise<void>((r) => setImmediate(() => r()));
    githubGraphqlMock.mockClear();
    await getIssueTemplates();
    expect(githubGraphqlMock).toBeCalledTimes(0);
  });

  it('will use a cache on subsequent uses', (done) => {
    jest.isolateModules(async () => {
      githubGraphqlMock.mockRejectedValueOnce(new Error());

      const isolatedGetIssueTemplates = require('../../../github/utils/fetchIssueTemplates').getIssueTemplates;

      // Wait for promises to resolve/reject before continuing
      await new Promise<void>((r) => setImmediate(() => r()));

      githubGraphqlMock.mockReset();
      githubGraphqlMock.mockResolvedValue({
        repository: {},
      });

      await isolatedGetIssueTemplates();
      await isolatedGetIssueTemplates();
      expect(githubGraphqlMock).toBeCalledTimes(1);

      done();
    });
  });

  test.todo('make sure it calls the api with the correct attributes');
});