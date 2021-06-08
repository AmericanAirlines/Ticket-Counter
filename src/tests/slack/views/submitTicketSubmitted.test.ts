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

jest.spyOn(logger, 'info').mockImplementation();
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
// const loggerErrorSpy = jest.spyOn(logger, 'error');

const viewsOpenMock = jest.fn();
const chatPostMessageMock = jest.fn();
const mockClient = {
  views: {
    open: jest.fn((...args) => viewsOpenMock(...args)),
  },
  chat: {
    postMessage: jest.fn((...args) => chatPostMessageMock(...args)),
  },
};

let submitTicketSubmittedHandler: Middleware<SlackEventMiddlewareArgs<'message'>>;

describe('submit ticket view submission handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Get a clean copy of the module to avoid state being an issue
    jest.isolateModules(() => {
      submitTicketSubmittedHandler = require('../../../slack/views/submitTicketSubmitted').submitTicketSubmitted;
    });
  });

  it('logs an error and pops and error modal if there is a mismatch in submission fields', async () => {
    const viewSubmission = getMockViewSubmission({});
    const ack = (viewSubmission as any).ack as jest.Mock;
    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalledTimes(1);
    expect(viewsOpenMock.mock.calls[0][0].view.title.text).toEqual('Error');
  });

  it('logs an error and pops and error modal if there is a mismatch in submission fields', async () => {
    const viewSubmission = getMockViewSubmission({});
    const ack = (viewSubmission as any).ack as jest.Mock;
    viewsOpenMock.mockRejectedValueOnce("You didn't say the magic word!");
    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalledTimes(1);
    expect(loggerErrorSpy).toBeCalled();
  });

  it("throws an error if the support repo can't be found", async () => {
    const viewSubmission = getMockViewSubmission({
      [SubmitTicketModalElement.Title]: { value: 'title' },
      [SubmitTicketModalElement.Description]: { value: 'description' },
    });
    const ack = (viewSubmission as any).ack as jest.Mock;
    fetchRepoMock.mockResolvedValueOnce(undefined);
    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
    expect(ack).toBeCalled();
    expect(viewsOpenMock).toBeCalledTimes(1);
    expect(viewsOpenMock.mock.calls[0][0].view.title.text).toEqual('Error');
  });

  it('handles submission, creates a new ticket, saves it, and notifies the user', async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    const viewSubmission = getMockViewSubmission({
      [SubmitTicketModalElement.Title]: { value: title },
      [SubmitTicketModalElement.Description]: { value: description },
    });
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

    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
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
    const viewSubmission = getMockViewSubmission({
      [SubmitTicketModalElement.Title]: { value: title },
      [SubmitTicketModalElement.Description]: { value: description },
    });

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

    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
    const { text } = chatPostMessageMock.mock.calls[0][0];
    const extraCharsAdded = '...\n_(Full description can be found on the issue)_';
    expect(text).toContain(extraCharsAdded);
    const [truncatedTextWithFormatting] = text.split(extraCharsAdded);
    const last200Chars = truncatedTextWithFormatting.substr(truncatedTextWithFormatting.length - 200, 200);
    const first200CharsOfOriginalDescription = description.substr(0, 200);
    expect(last200Chars).toEqual(first200CharsOfOriginalDescription);
  });

  it('sends an issue template if there is one', async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    const type = 'Sev 1';
    const stakeholders: string[] = [];
    const viewSubmission = getMockViewSubmission({
      [SubmitTicketModalElement.Title]: { value: title },
      [SubmitTicketModalElement.Description]: { value: description },
      [SubmitTicketModalElement.Type]: { selected_option: { value: type } },
      [SubmitTicketModalElement.Stakeholders]: { selected_users: stakeholders },
    });

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

    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
    const { input } = graphqlMock.mock.calls[0][1];
    expect(input.issueTemplate).toEqual(type);
  });

  it("tags stakeholders in a thread if they're provided", async () => {
    const title = 'Something broke!';
    const description = 'Lorem ipsum!';
    const stakeholders = ['JohnDoe', 'JaneSmith'];
    const viewSubmission = getMockViewSubmission({
      [SubmitTicketModalElement.Title]: { value: title },
      [SubmitTicketModalElement.Description]: { value: description },
      [SubmitTicketModalElement.Stakeholders]: { selected_users: stakeholders },
    });

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

    await submitTicketSubmittedHandler({ ...viewSubmission, client: mockClient } as any);
    const { text } = chatPostMessageMock.mock.calls[1][0];
    const formattedStakeholders = stakeholders.map((stakeholder: string) => `<@${stakeholder}>`).join(', ');
    expect(text).toContain(`FYI ${formattedStakeholders}`);
  });
});

type ActionValue = { value: string } | { selected_option: { value: string } } | { selected_users: string[] };
function getMockViewSubmission(
  actionValues: Record<string, ActionValue>,
): SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs {
  const blocks = [];
  const state = { values: {} } as any;
  for (const [actionId, value] of Object.entries(actionValues)) {
    const block = getMockBlock(`block-${actionId}`, actionId);
    blocks.push(block);
    state.values[block.block_id] = {
      [actionId]: value,
    };
  }
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

function getMockBlock(blockId: string, actionId: string) {
  return {
    block_id: blockId,
    element: {
      action_id: actionId,
    },
  };
}
