import { AppHomeOpenedEvent } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import 'jest';
import logger from '../../../logger';
import { appHomeOpened } from '../../../slack/events/appHomeOpened';
import { updateAppHome } from '../../../slack/utils/updateAppHome';

jest.mock('../../../env.ts', () => {
  const actualEnv = jest.requireActual('../../../env.ts');
  return {
    env: {
      ...actualEnv,
      githubAppId: 'APP_ID',
      githubAppPrivateKey: 'super secret key',
      githubAppInstallationId: 'INSTALLATION_ID',
      githubAppWebhookSecret: 'GITHUB_WEBHOOK_SECRET',
      slackSigningSecret: 'SLACK_SIGNING_SECRET',
    },
  };
});

jest.mock('../../../slack/utils/updateAppHome.ts');
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();

const mockClient = {} as unknown as WebClient;
const mockUser = {} as any;
const mockEvent = { user: mockUser } as unknown as AppHomeOpenedEvent;

describe('app home opened event handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the util method to update the app home with the right arguments', async () => {
    await appHomeOpened({ event: mockEvent, client: mockClient } as any);
    expect(updateAppHome).toBeCalledTimes(1);
    const [clientArgument, userArgument] = (updateAppHome as jest.Mock).mock.calls[0];
    expect(clientArgument).toBe(mockClient);
    expect(userArgument).toBe(mockUser);
  });

  it('logs an error if the app home cannot be updated', async () => {
    (updateAppHome as jest.Mock).mockRejectedValueOnce(new Error("I can't find my home!"));
    await appHomeOpened({ event: mockEvent } as any);
    expect(updateAppHome).toBeCalledTimes(1);
    expect(loggerErrorSpy).toBeCalledTimes(1);
  });
});
