import { problemLoadingIssuesBlock } from '../../../../../slack/common/blocks/errors/corruptIssueError';

describe('corrupt ', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('correctly forms a error block', async () => {
    const testWord = 'Whoops, Something went wrong while loading your tickets.';
    expect(problemLoadingIssuesBlock).toEqual(
      expect.objectContaining({
        text: expect.objectContaining({
          text: expect.stringContaining(testWord),
        }),
      }),
    );
  });
});
