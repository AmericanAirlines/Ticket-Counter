import 'jest';
import { KnownBlock } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { updateAppHome } from '../../../slack/utils/updateAppHome';
import { actionIds } from '../../../slack/constants';
import { getMock } from '../../test-utils/getMock';

jest.mock('../../../env');
jest.mock('../../../slack/blocks/appHome.ts', () => ({
  appHomeBlocks: jest.fn().mockResolvedValue([]),
}));

const mockClient = {
  views: {
    publish: jest.fn(),
  },
} as unknown as WebClient;

describe('update app home util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls views.publish with correct values', async () => {
    const userId = '123123';
    await updateAppHome(mockClient, userId);
    expect(mockClient.views.publish).toBeCalledTimes(1);
    expect(getMock(mockClient.views.publish).mock.calls[0][0]).toMatchObject({
      view: {
        type: 'home',
        callback_id: actionIds.ignore,
      },
    });
  });

  it('calls views.publish with blocks', async () => {
    const userId = '123123';
    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'MOCK BLOCKS',
        },
      },
    ];
    await updateAppHome(mockClient, userId, blocks);
    expect(mockClient.views.publish).toBeCalledTimes(1);
    expect(getMock(mockClient.views.publish).mock.calls[0][0]).toMatchObject({
      view: {
        blocks,
      },
    });
  });
});
