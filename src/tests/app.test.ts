/* eslint-disable @typescript-eslint/no-var-requires */
import 'jest';
import supertest from 'supertest';
import { app } from '../app';

jest.mock('../env.ts');

jest.spyOn(app.client.auth, 'test').mockImplementation();

describe('app', () => {
  it('returns a 200 status code for requests to /', async () => {
    const { receiver } = require('../app');
    await supertest(receiver.app).get('/').expect(200);
  });

  it('returns a 404 status code for requests to unknown routes', async () => {
    const { receiver } = require('../app');
    await supertest(receiver.app).get('/api/wafflesRgood').expect(404);
  });
});
