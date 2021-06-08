import 'jest';
import { submitTicket } from '../../../slack/shortcuts/submitTicket';
import logger from '../../../logger';

jest.mock('../../../env.ts');
jest.mock('../../../github/utils/fetchIssueTemplates.ts', () => ({
  getIssueTemplates: jest.fn().mockReturnValue([]),
}));
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();

const viewsOpenMock = jest.fn();
const mockClient = {
  views: {
    open: jest.fn((args) => viewsOpenMock(args)),
  },
};
describe('submit ticket shortcut handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a view with editable blocks', async () => {
    const ack = jest.fn();
    await submitTicket({
      ack,
      shortcut: {
        trigger_id: '',
      },
      client: mockClient,
    } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalled();
  });

  it("logs an error if the modal can't be opened", async () => {
    const ack = jest.fn();
    viewsOpenMock.mockRejectedValueOnce("Can't open me!");
    await submitTicket({
      ack,
      shortcut: {
        trigger_id: '',
      },
      client: mockClient,
    } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalled();
    expect(loggerErrorSpy).toBeCalled();
  });
});
