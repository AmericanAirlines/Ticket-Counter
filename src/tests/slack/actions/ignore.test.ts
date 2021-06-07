/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import 'jest';
import supertest from 'supertest';
import { createHash } from '../utils/slack';
import logger from '../../../logger';

jest.mock('../../../env.ts');
jest.mock('../../../github/graphql.ts');

import { receiver } from '../../../app';
import { actionIds } from '../../../slack/constants';
import { env } from '../../../env';

const mockIgnoreEvent: any = {
  type: 'block_actions',
  user: { id: 'XXX', username: 'XXX', name: 'XXX', team_id: 'XXX' },
  team: { id: 'XXX', domain: 'XXX' },
  actions: [
    {
      action_id: actionIds.ignore,
      block_id: 'XXX',
      type: 'button',
    },
  ],
};

jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn().mockResolvedValueOnce({ repository: {} }),
}));

const loggerSpy = jest.spyOn(logger, 'debug').mockImplementation();
jest.mock('../../../env', () => {
  const actualEnv = jest.requireActual('../../../env');
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

describe('ignore action listener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully ignores the issue', async () => {
    const timestamp = new Date().valueOf();
    const signature = createHash(mockIgnoreEvent, timestamp, env.slackSigningSecret);
    await supertest(receiver.app)
      .post('/slack/events')
      .send(mockIgnoreEvent)
      .set({
        'x-slack-signature': signature,
        'x-slack-request-timestamp': timestamp,
      })
      .expect(200);
    expect(loggerSpy).toBeCalled();
  });
});
