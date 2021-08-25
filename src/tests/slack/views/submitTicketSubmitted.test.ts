import { AllMiddlewareArgs, App, Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';
import 'jest';
import logger from '../../../logger';
import { SubmitTicketModalElement } from '../../../slack/blocks/getSubmitTicketModalBlocks';

jest.mock('../../../env.ts', () => ({
  env: {
    nodeEnv: 'test',
  },
}));

const graphqlMock = jest.fn();
jest.mock('../../../github/graphql.ts', () => ({
  githubGraphql: jest.fn().mockImplementation((...args) => graphqlMock(...args)),
}));

const fetchRepoMock = jest.fn();
jest.mock('../../../github/utils/fetchRepo.ts', () => ({
  fetchRepo: jest.fn(() => fetchRepoMock()),
}));

const ticketSaveMock = jest.fn();
jest.mock('../../../entities/Ticket.ts', () => {
  const { Platform } = jest.requireActual('../../../entities/Ticket.ts');
  return {
    Ticket: jest.fn(() => ({
      save: jest.fn((...args) => ticketSaveMock(...args)),
    })),
    Platform,
  };
});

const mockViewDescription = jest.fn().mockReturnValue('Description');
const mockViewTitle = jest.fn().mockReturnValue('Title');
const mockViewType = jest.fn().mockReturnValue('Type');
const mockViewStakeholders = jest.fn().mockReturnValue([]);
jest.mock('../../../slack/utils/ViewOutputUtils.ts', () => ({
  ViewOutputUtils: jest.fn(() => ({
    getInputValue: jest.fn(
      (actionId: string): { value: string } | { selected_users: string[] } | { selected_option: { value: string } } => {
        switch (actionId) {
          case SubmitTicketModalElement.Title:
            return { value: mockViewTitle() };
          case SubmitTicketModalElement.Description:
            return { value: mockViewDescription() };
          case SubmitTicketModalElement.Type:
            return { selected_option: { value: mockViewType() } };
          case SubmitTicketModalElement.Stakeholders:
            return { selected_users: mockViewStakeholders() };
          default:
            return { value: '' };
        }
      },
    ),
  })),
}));

jest.spyOn(logger, 'info').mockImplementation();
const loggerErrorSpy = jest.spyOn(logger, 'error');
// const loggerErrorSpy = jest.spyOn(logger, 'error')//TODO add mockImplementation back;

const viewsOpenMock = jest.fn();
const chatPostMessageMock = jest.fn();
const mockApp = {
  client: {
    views: {
      open: jest.fn((...args) => viewsOpenMock(...args)),
    },
    chat: {
      postMessage: jest.fn((...args) => chatPostMessageMock(...args)),
    },
  },
};

let submitTicketSubmittedHandler: Middleware<SlackEventMiddlewareArgs<'message'>>;

describe('submit ticket view submission handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Get a clean copy of the module to avoid state being an issue
    jest.isolateModules(() => {
      submitTicketSubmittedHandler = require('../../../slack/views/submitTicketSubmitted').submitTicketSubmitted(
        mockApp as unknown as App,
      );
    });
  });

  it('logs an error when unable to add new issue to github', async () => {
    const viewSubmission = getMockViewSubmission();
    const ack = (viewSubmission as any).ack as jest.Mock;
    fetchRepoMock.mockResolvedValueOnce({ id: '456', description: 'words'.repeat(2000) });
    graphqlMock.mockResolvedValue(undefined);
    await submitTicketSubmittedHandler(viewSubmission);
    expect(ack).toBeCalled();
    expect(loggerErrorSpy).toBeCalled();
    expect(chatPostMessageMock).toBeCalledWith({
      channel: undefined,
      text: expect.stringContaining('Something went wrong'),
      token: undefined,
    });
  });

  it('logs an error and pops and error modal if there is a mismatch in submission fields', async () => {
    const viewSubmission = getMockViewSubmission();
    const ack = (viewSubmission as any).ack as jest.Mock;
    await submitTicketSubmittedHandler(viewSubmission);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalledTimes(1);
    expect(viewsOpenMock.mock.calls[0][0].view.title.text).toEqual("We're working on it!");
  });

  it('logs an error and pops and error modal if there is a mismatch in submission fields', async () => {
    const viewSubmission = getMockViewSubmission();
    const ack = (viewSubmission as any).ack as jest.Mock;
    viewsOpenMock.mockRejectedValueOnce("You didn't say the magic word!");
    await submitTicketSubmittedHandler(viewSubmission);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalledTimes(1);
    expect(loggerErrorSpy).toBeCalled();
  });

  it("throws an error if the support repo can't be found", async () => {
    mockViewDescription.mockReturnValueOnce('Description');
    mockViewTitle.mockReturnValueOnce('Title');

    const viewSubmission = getMockViewSubmission();
    const ack = (viewSubmission as any).ack as jest.Mock;
    fetchRepoMock.mockResolvedValueOnce(undefined);
    await submitTicketSubmittedHandler(viewSubmission);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalledTimes(1);
    expect(viewsOpenMock.mock.calls[0][0].view.title.text).toEqual("We're working on it!");
  });

  it('handles submission, creates a new ticket, saves it, and notifies the user', async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    mockViewDescription.mockReturnValueOnce(description);
    mockViewTitle.mockReturnValueOnce(title);
    const viewSubmission = getMockViewSubmission();
    const ack = (viewSubmission as any).ack as jest.Mock;

    fetchRepoMock.mockResolvedValueOnce({ id: '456' });
    graphqlMock.mockResolvedValueOnce({
      createIssue: {
        issue: {
          url: 'mockUrl',
          number: '123',
          id: '456',
        },
      },
    });
    chatPostMessageMock.mockResolvedValueOnce({ ts: '123123.34545' });

    await submitTicketSubmittedHandler(viewSubmission);
    // TODO: Improve this to check values
    expect(graphqlMock).toBeCalled();
    expect(ticketSaveMock).toBeCalled();
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalled();
    expect(chatPostMessageMock).toBeCalledTimes(2);
  });

  it('truncates the displayed description if the user is feeling verbose', async () => {
    const title = 'Something broke!';
    const description =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    mockViewTitle.mockReturnValueOnce(title);
    mockViewDescription.mockReturnValueOnce(description);
    const viewSubmission = getMockViewSubmission();

    fetchRepoMock.mockResolvedValueOnce({ id: '456' });
    graphqlMock.mockResolvedValueOnce({
      createIssue: {
        issue: {
          url: 'mockUrl',
          number: '123',
          id: '456',
        },
      },
    });
    chatPostMessageMock.mockResolvedValueOnce({ ts: '123123.34545' });

    await submitTicketSubmittedHandler(viewSubmission);
    const { text } = chatPostMessageMock.mock.calls[0][0];
    const extraCharsAdded = '...\n_(Full description can be found on the issue)_';
    expect(text).toContain(extraCharsAdded);
    const [truncatedTextWithFormatting] = text.split(extraCharsAdded);
    const last200Chars = truncatedTextWithFormatting.substr(truncatedTextWithFormatting.length - 200, 200);
    const first200CharsOfOriginalDescription = description.substr(0, 200);
    expect(last200Chars).toEqual(first200CharsOfOriginalDescription);
  });

  it('does not mention github if the issue does not get created', async () => {
    const title = 'Something broke!';
    const description =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    mockViewTitle.mockReturnValueOnce(title);
    mockViewDescription.mockReturnValueOnce(description);
    const viewSubmission = getMockViewSubmission();

    fetchRepoMock.mockResolvedValueOnce({ id: '456' });
    graphqlMock.mockResolvedValueOnce(undefined);
    chatPostMessageMock.mockResolvedValueOnce({ ts: '123123.34545' });

    await submitTicketSubmittedHandler(viewSubmission);
    const { text } = chatPostMessageMock.mock.calls[0][0];
    const extraCharsAdded = '...\n_(Full description can be found on the issue)_';
    expect(text).not.toContain(extraCharsAdded);
  });

  it('sends an issue template if there is one', async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    const type = 'Sev 1';
    const stakeholders: string[] = [];
    mockViewTitle.mockReturnValueOnce(title);
    mockViewDescription.mockReturnValueOnce(description);
    mockViewType.mockReturnValueOnce(type);
    mockViewStakeholders.mockReturnValueOnce(stakeholders);
    const viewSubmission = getMockViewSubmission();

    fetchRepoMock.mockResolvedValueOnce({ id: '456' });
    graphqlMock.mockResolvedValueOnce({
      createIssue: {
        issue: {
          url: 'mockUrl',
          number: '123',
          id: '456',
        },
      },
    });
    chatPostMessageMock.mockResolvedValueOnce({ ts: '123123.34545' });

    await submitTicketSubmittedHandler(viewSubmission);
    const { input } = graphqlMock.mock.calls[0][1];
    expect(input.issueTemplate).toEqual(type);
  });

  it('sends an issue template with no stakeholders', async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    const type = 'Sev 1';
    mockViewTitle.mockReturnValueOnce(title);
    mockViewDescription.mockReturnValueOnce(description);
    mockViewType.mockReturnValueOnce(type);
    mockViewStakeholders.mockReturnValueOnce(undefined);
    const viewSubmission = getMockViewSubmission();

    fetchRepoMock.mockResolvedValueOnce({ id: '456' });
    graphqlMock.mockResolvedValueOnce({
      createIssue: {
        issue: {
          url: 'mockUrl',
          number: '123',
          id: '456',
        },
      },
    });
    chatPostMessageMock.mockResolvedValueOnce({ ts: '123123.34545' });

    await submitTicketSubmittedHandler(viewSubmission);
    const { input } = graphqlMock.mock.calls[0][1];
    expect(input.issueTemplate).toEqual(type);
  });

  it("throws an error if title isn't defined", async () => {
    const description = 'Lorem ipsum!';
    const type = 'Sev 1';
    const stakeholders: string[] = [];
    mockViewTitle.mockReturnValueOnce(undefined);
    mockViewDescription.mockReturnValueOnce(description);
    mockViewType.mockReturnValueOnce(type);
    mockViewStakeholders.mockReturnValueOnce(stakeholders);
    const viewSubmission = getMockViewSubmission();

    await submitTicketSubmittedHandler(viewSubmission);
    expect(loggerErrorSpy).toBeCalled();
  });

  it("tags stakeholders in a thread if they're provided", async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    const stakeholders = ['JohnDoe', 'JaneSmith'];
    const viewSubmission = getMockViewSubmission();

    mockViewTitle.mockReturnValueOnce(title);
    mockViewDescription.mockReturnValueOnce(description);
    mockViewStakeholders.mockReturnValueOnce(stakeholders);

    fetchRepoMock.mockResolvedValueOnce({ id: '456' });
    graphqlMock.mockResolvedValueOnce({
      createIssue: {
        issue: {
          url: 'mockUrl',
          number: '123',
          id: '456',
        },
      },
    });
    chatPostMessageMock.mockResolvedValueOnce({ ts: '123123.34545' });

    await submitTicketSubmittedHandler(viewSubmission);
    const { text } = chatPostMessageMock.mock.calls[1][0];
    const formattedStakeholders = stakeholders.map((stakeholder: string) => `<@${stakeholder}>`).join(', ');
    expect(text).toContain(`FYI ${formattedStakeholders}`);
  });
});

function getMockViewSubmission(): SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs {
  const blocks = [] as any;
  const state = { values: {} } as any;

  return {
    ack: jest.fn(),
    body: {
      user: {
        id: '111222',
        name: 'JaneSmith',
      },
    },
    view: {
      blocks,
      state,
    },
  } as any;
}
