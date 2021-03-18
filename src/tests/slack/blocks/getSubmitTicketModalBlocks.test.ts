import 'jest';

jest.mock('../../../env.ts');
let getSubmitTicketModalBlocks: any;

describe('submit ticket modal blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock('../../../github/utils/fetchIssueTemplates.ts', () => ({
      getIssueTemplates: jest.fn().mockReturnValue([]),
    }));
    jest.mock('../../../github/utils/fetchAnnouncement.ts', () => ({
      getAnnouncement: jest.fn().mockReturnValue(''),
    }));
    getSubmitTicketModalBlocks = require('../../../slack/blocks/getSubmitTicketModalBlocks').getSubmitTicketModalBlocks;
  });

  it('does not return an announcement section if there is no announcement', async () => {
    const modalStructure = await getSubmitTicketModalBlocks();
    const announcementTitle = modalStructure[0]?.text?.text ?? '';
    expect(announcementTitle).not.toBe('Announcement!');
  });
});
