import 'jest';
import { isMessageReply } from '../../../slack/events';

jest.mock('../../../env');

jest.mock('../../../slack/utils/makeUserMentionsReadable.ts');

describe('slack events registration', () => {
  it('will ignore non-message-reply events', async () => {
    const next = jest.fn();
    await isMessageReply({ message: {} as any, next } as any);
    expect(next).not.toBeCalled();
  });

  it('will handle message reply events', async () => {
    const next = jest.fn();
    await isMessageReply({ message: { thread_ts: '123' } as any, next } as any);
    expect(next).toBeCalled();
  });

  it('will', async () => {
    await expect(isMessageReply({ message: { thread_ts: '123' } as any } as any)).resolves.not.toThrow();
  });
});
