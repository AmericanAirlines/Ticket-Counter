/* eslint-disable @typescript-eslint/no-var-requires */
import 'jest';
import supertest from 'supertest';
import { app } from '../app';

jest.spyOn(app.client.auth, 'test').mockImplementation();
jest.mock('../env.ts', () => {
  const actualEnv = jest.requireActual('../env.ts');
  return {
    env: {
      ...actualEnv,
      githubAppId: 'APP_ID',
      githubAppPrivateKey: 'super secret key',
      githubAppInstallationId: 'INSTALLATION_ID',
      githubAppWebhookSecret: 'GITHUB_WEBHOOK_SECRET',
    },
  };
});
jest.mock('../github/graphql.ts', () => ({
  githubGraphql: jest.fn().mockResolvedValueOnce({ repository: {} }),
}));

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a 200 status code for requests to /', async () => {
    const { receiver } = require('../app');
    await supertest(receiver.app).get('/').expect(200);
  });

  it('returns a 404 status code for requests to unknown routes', async () => {
    const { receiver } = require('../app');
    await supertest(receiver.app).get('/api/wafflesRgood').expect(404);
  });
});
