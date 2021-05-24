import { headerBlock, sectionBlock } from '../../../../slack/common/blocks/commonBlocks';

describe('Common blocks used across slack', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('correctly forms a header block', async () => {
    const testWord = 'test Word';
    const blocks = headerBlock(testWord, true);

    expect(blocks).toEqual(
      expect.objectContaining({
        text: expect.objectContaining({
          text: expect.stringContaining(testWord),
        }),
      }),
    );
  });

  it('correctly forms a section block', async () => {
    const testWord = 'test Word';
    const blocks = sectionBlock(testWord);

    expect(blocks).toEqual(
      expect.objectContaining({
        text: expect.objectContaining({
          text: expect.stringContaining(testWord),
        }),
      }),
    );
  });
});
