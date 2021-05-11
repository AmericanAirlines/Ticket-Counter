import { Webhooks } from '@octokit/webhooks';
import logger from '../../../logger';
import { env } from '../../../env';

const errorLogger = jest.spyOn(logger, 'error').mockImplementation();

jest.mock('../../../env', () => ({
  env: {
    githubAppWebhookSecret: 'GITHUB_APP_WEBHOOK_SECRET',
  },
}));

const WebhooksMock = Webhooks as jest.Mock;
const webhooksOnErrorMock = jest.fn();
jest.mock('@octokit/webhooks', () => ({
  Webhooks: jest.fn(() => ({
    onError: jest.fn((...args) => webhooksOnErrorMock(...args)),
  })),
}));

jest.mock('../../../github/webhooks/issueAssignmentChanged', () => ({ issueAssignmentChanged: jest.fn() }));
jest.mock('../../../github/webhooks/issueClosed', () => ({ issueClosed: jest.fn() }));
jest.mock('../../../github/webhooks/issueCommentedOn', () => ({ issueCommentedOn: jest.fn() }));
jest.mock('../../../github/webhooks/issueReopened', () => ({ issueReopened: jest.fn() }));
jest.mock('../../../github/webhooks/issueTransferred', () => ({ issueTransferred: jest.fn() }));

describe('GitHub Webhooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.isolateModules(() => {
      require('../../../github/webhooks');
    });
  });

  it('Sets up Webhooks with secret from environment variable', () => {
    expect(WebhooksMock).toHaveBeenCalledWith({
      secret: env.githubAppWebhookSecret,
    });
  });

  it('Logs to console, with error level, when there is a webhook error', () => {
    const webhookError = new Error('WEBHOOK_ERROR');
    webhooksOnErrorMock.mock.calls[0][0](webhookError);

    expect(errorLogger).toHaveBeenCalledWith('Error handling GitHub webhook', webhookError);
  });
});
