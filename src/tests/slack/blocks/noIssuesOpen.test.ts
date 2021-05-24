import { noIssuesBlock } from '../../../slack/blocks/noIssuesOpen';

describe('Common blocks used across slack', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('correctly forms a section block', async () => {
    const blocks = noIssuesBlock();

    expect(blocks).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('You currently have no tickets opened at this time. 😊'),
          }),
        ]),
      }),
    );
  });
});
