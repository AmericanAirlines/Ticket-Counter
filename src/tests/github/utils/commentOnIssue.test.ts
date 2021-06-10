import 'jest';
import { commentOnIssue } from '../../../github/utils/commentOnIssue';
import { githubGraphql } from '../../../github/graphql';

jest.mock('../../../env.ts');
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn(),
}));

const mockGraphql = githubGraphql as unknown as jest.Mock<any, any>;

const issueId = 'ISSUE_ID';
const name = 'Jane Doe';
const message = 'I HAVE AN ISSUE';
const platformText = 'Slack';

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('will call graphql mutation with correct subject and body containing args information', async () => {
    await commentOnIssue(issueId, {
      name,
      message,
      platformText,
    });

    expect(mockGraphql).toBeCalledTimes(1);
    const { input } = mockGraphql.mock.calls[0][1];
    expect(input.subjectId).toEqual(issueId);
    expect(input.body).toContain(name);
    expect(input.body).toContain(message);
    expect(input.body).toContain(platformText);
  });

  it('will call graphql mutation without platform text and not error', async () => {
    await expect(commentOnIssue(issueId, { name, message })).resolves.not.toThrow();
  });

  it('will default name', async () => {
    await commentOnIssue(issueId, {
      name: '',
      message,
    });

    expect(mockGraphql).toBeCalledTimes(1);
    const { input } = mockGraphql.mock.calls[0][1];
    expect(input.body).toContain('From someone');
  });

  test.todo('make sure it calls the api with the correct attributes');
});
