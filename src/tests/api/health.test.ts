import 'jest';
import supertest from 'supertest';
import { receiver } from '../../app';

jest.mock('../../env.ts', () => {
  const actualEnv = jest.requireActual('../../env.ts');
  return {
    env: {
      ...actualEnv,
      githubAppId: 'APP_ID',
      githubAppPrivateKey: 'super secret key',
      githubAppInstallationId: 'INSTALLATION_ID',
      githubAppWebhookSecret: 'GITHUB_WEBHOOK_SECRET',
      slackSigningSecret: 'SLACK_SIGNING_SECRET',
      nodeEnv: 'test',
    },
  };
});

describe('/api/health', () => {
  it('returns status, details, and timestamp', async () => {
    const healthResponse = await supertest(receiver.app).get('/api/health');
    const health = healthResponse.body;

    expect(health.status).toBe('OK');
    expect(health.details).toBe('Everything looks good 👌');
    expect(health.time).toBeDefined();
    expect(new Date(health.time)).toBeInstanceOf(Date);
  });
});
