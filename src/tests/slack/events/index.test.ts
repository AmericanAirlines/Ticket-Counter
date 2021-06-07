import 'jest';
import { isMessageReply } from '../../../slack/events';

jest.mock('../../../env', () => {
  const actualEnv = jest.requireActual('../../../env');
  return {
    env: {
      ...actualEnv,
      githubAppId: 'APP_ID',
      githubAppPrivateKey: 'super secret key',
      githubAppInstallationId: 'INSTALLATION_ID',
    },
  };
});

jest.mock('../../../slack/utils/makeUserMentionsReadable.ts');

describe('slack events registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
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
    await expect(isMessageReply({} as any)({ message: { thread_ts: '123' } as any } as any)).resolves.not.toThrow();
  });
});
