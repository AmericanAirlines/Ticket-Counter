import 'jest';
import { Middleware, SlackShortcut, SlackShortcutMiddlewareArgs } from '@slack/bolt';
import { submitTicket } from '../../../slack/shortcuts/submitTicket';
import logger from '../../../logger';

jest.mock('../../../env.ts');
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();

const viewsOpenMock = jest.fn();
const mockApp = {
  client: {
    views: {
      open: jest.fn((args) => viewsOpenMock(args)),
    },
  },
};
const submitTicketHandler: Middleware<SlackShortcutMiddlewareArgs<SlackShortcut>> = submitTicket(mockApp as any);

describe('submit ticket shortcut handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a view with editable blocks', async () => {
    const ack = jest.fn();
    await submitTicketHandler({
      ack,
      shortcut: {
        trigger_id: '',
      },
    } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalled();
  });

  it("logs an error if the modal can't be opened", async () => {
    const ack = jest.fn();
    viewsOpenMock.mockRejectedValueOnce("Can't open me!");
    await submitTicketHandler({
      ack,
      shortcut: {
        trigger_id: '',
      },
    } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalled();
    expect(loggerErrorSpy).toBeCalled();
  });
});
