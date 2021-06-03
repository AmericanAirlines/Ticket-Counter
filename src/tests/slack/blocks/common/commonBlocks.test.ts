import { headerBlock, sectionBlock } from '../../../../slack/common/blocks/commonBlocks';

describe('Common blocks used across slack', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('Header Block', () => {
    it('correctly sets the emoji to true', async () => {
      const blocks = headerBlock('text', true);

      expect(blocks).toEqual(
        expect.objectContaining({
          text: expect.objectContaining({
            emoji: true,
          }),
        }),
      );
    });

    it('has the correct form and correctly uses the emoji argument', async () => {
      const testWord = 'test Word 🙂';
      const blocks = headerBlock(testWord, false);

      expect(blocks).toEqual(
        expect.objectContaining({
          text: expect.objectContaining({
            text: expect.stringContaining(testWord),
            emoji: false,
          }),
        }),
      );
    });
  });

  describe('Section Block', () => {
    it('has the correct form', async () => {
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
});
