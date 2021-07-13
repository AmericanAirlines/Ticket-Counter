import 'jest';
import { NextFunction } from 'express';
import { ignoreBotEvents } from '../../github';
import { getMock } from '../utils/getMock';

jest.mock('../../github/webhooks', () => ({
  githubWebhooks: jest.fn(),
}));

jest.mock('express', () => ({
  Router: jest.fn().mockReturnValue({ get: jest.fn(), urlencoded: jest.fn(), use: jest.fn() }),
  json: jest.fn(),
}));

const mockResponse = {
  sendStatus: jest.fn(),
};

const mockBotRequest: any = {
  body: {
    sender: {
      type: 'Bot',
    },
  },
};

const mockUserRequest: any = {
  body: {
    sender: {
      type: 'User',
    },
  },
};

const mockNext: NextFunction = jest.fn();

describe('github fetch repo util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores bot events', () => {
    ignoreBotEvents(mockBotRequest as any, mockResponse as any, mockNext);
    expect(getMock(mockResponse.sendStatus)).toBeCalledWith(200);
    expect(getMock(mockNext)).not.toBeCalled();
  });

  it('performs next function when not a bot event', () => {
    ignoreBotEvents(mockUserRequest as any, mockResponse as any, mockNext);
    expect(getMock(mockResponse.sendStatus)).not.toBeCalled();
    expect(getMock(mockNext)).toBeCalledTimes(1);
  });
});
