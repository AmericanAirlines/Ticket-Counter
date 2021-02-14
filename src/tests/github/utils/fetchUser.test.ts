import 'jest';

jest.mock('../../../env.ts');

const githubGraphqlMock = jest.fn().mockReturnValue({
  user: {},
});
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn((args) => githubGraphqlMock(args)),
}));
let fetchUser: any;

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      fetchUser = require('../../../github/utils/fetchUser').fetchUser;
    });
  });

  it('retrieves users from the github api', async () => {
    await fetchUser('octocat');
  });

  test.todo('make sure it calls the api with the correct attributes');
});
