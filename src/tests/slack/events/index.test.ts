import 'jest';
import { isMessageReply } from '../../../slack/events/index';

jest.mock('../../../env');

describe('slack events registration', () => {
  it('will ignore non-message-reply events', async () => {
    const next = jest.fn();
    await isMessageReply({} as any)({ message: {} as any, next } as any);
    expect(next).not.toBeCalled();
  });

  it('will handle message reply events', async () => {
    const next = jest.fn();
    await isMessageReply({} as any)({ message: { thread_ts: '123' } as any, next } as any);
    expect(next).toBeCalled();
  });

  it('will', async () => {
    expect(isMessageReply({} as any)({ message: { thread_ts: '123' } as any } as any)).resolves.not.toThrow();
  });
});
