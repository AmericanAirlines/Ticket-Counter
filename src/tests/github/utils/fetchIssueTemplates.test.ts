import 'jest';
import logger from '../../../logger';

jest.useFakeTimers();
jest.mock('../../../env.ts', () => {
  const actualEnv = jest.requireActual('../../../env').env;
  return {
    env: {
      ...actualEnv,
      nodeEnv: 'development',
    },
  };
});
const errorLoggerSpy = jest.spyOn(logger, 'error').mockImplementation();

const githubGraphqlMock = jest.fn().mockResolvedValue({
  repository: {
    issueTemplates: [
      {
        name: '',
        about: '',
        title: '',
        body: '',
      },
    ],
  },
});
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn((args) => githubGraphqlMock(args)),
}));
let getIssueTemplates: any;

jest.useFakeTimers();

describe('github fetch repo util', () => {
  beforeEach(async () => {
    jest.isolateModules(() => {
      githubGraphqlMock.mockRejectedValueOnce(new Error());
      getIssueTemplates = require('../../../github/utils/fetchIssueTemplates').getIssueTemplates;
    });

    // Wait for promises to resolve/reject before continuing
    await new Promise<void>((r) => setImmediate(() => r()));

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
  // !This tests a piece of code that causes an infinite loop in GH CI
  // it('will auto fetch after 30 minutes if there was an error', () => {
  //   // The timer was already setup in the beforeEach with a failure
  //   jest.advanceTimersByTime(30 * 60000);
  //
  //   expect(githubGraphqlMock).toBeCalledTimes(1);
  // });

  it('will log an error when not in test environment', (done) => {
    jest.isolateModules(async () => {
      githubGraphqlMock.mockRejectedValueOnce(new Error());

      require('../../../github/utils/fetchIssueTemplates');

      // Wait for promises to resolve/reject before continuing
      await new Promise<void>((r) => setImmediate(() => r()));

      githubGraphqlMock.mockClear();

      expect(errorLoggerSpy).toBeCalledTimes(1);

      done();
    });
  });

  it('will use the auto fetch templates cache', (done) => {
    jest.isolateModules(async () => {
      const isolatedGetIssueTemplates = require('../../../github/utils/fetchIssueTemplates').getIssueTemplates;

      // Wait for promises to resolve/reject before continuing
      await new Promise<void>((r) => setImmediate(() => r()));

      githubGraphqlMock.mockClear();

      await isolatedGetIssueTemplates();
      expect(githubGraphqlMock).toBeCalledTimes(0);

      done();
    });
  });

  it('will auto fetch after 60 seconds', (done) => {
    jest.isolateModules(async () => {
      require('../../../github/utils/fetchIssueTemplates');

      // Wait for promises to resolve/reject before continuing
      await new Promise<void>((r) => setImmediate(() => r()));

      githubGraphqlMock.mockClear();

      jest.advanceTimersByTime(60000);

      expect(githubGraphqlMock).toBeCalledTimes(1);

      done();
    });
  });

  it('will use a cache on subsequent uses', async () => {
    await getIssueTemplates();
    await getIssueTemplates();
    expect(githubGraphqlMock).toBeCalledTimes(1);
  });

  it('will return empty array when repository comes back as null', async () => {
    githubGraphqlMock.mockResolvedValueOnce({
      repository: null,
    });

    const templates = await getIssueTemplates();
    expect(templates).toHaveLength(0);
  });

  test.todo('make sure it calls the api with the correct attributes');
});
