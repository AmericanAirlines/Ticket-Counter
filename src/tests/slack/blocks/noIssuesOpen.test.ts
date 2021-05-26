import { noIssuesBlock } from '../../../slack/blocks/noIssuesOpen';

describe('Common blocks used across slack', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('correctly forms a section block', async () => {
    expect(noIssuesBlock).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('You have no open tickets :tada:'),
          }),
        ]),
      }),
    );
  });
});
