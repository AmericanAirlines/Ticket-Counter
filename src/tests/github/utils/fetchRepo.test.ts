import 'jest';

jest.mock('../../../env.ts');

const githubGraphqlMock = jest.fn().mockReturnValue({
  repository: {},
});
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn((args) => githubGraphqlMock(args)),
}));
let fetchRepo: any;

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      fetchRepo = require('../../../github/utils/fetchRepo').fetchRepo;
    });
  });
  it('will use a cache on subsequent uses', async () => {
    await fetchRepo();
    await fetchRepo();
    expect(githubGraphqlMock).toBeCalledTimes(1);
  });

  test.todo('make sure it calls the api with the correct attributes');
});
