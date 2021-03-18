import 'jest';

jest.mock('../../../env.ts');
let getSubmitTicketModalBlocks: any;
const sampleAnnouncement = 'Sample Announcement';

describe('submit ticket modal blocks with announcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock('../../../github/utils/fetchIssueTemplates.ts', () => ({
      getIssueTemplates: jest.fn().mockReturnValue([]),
    }));
    jest.mock('../../../github/utils/fetchAnnouncement.ts', () => ({
      getAnnouncement: jest.fn().mockReturnValue(sampleAnnouncement),
    }));
    getSubmitTicketModalBlocks = require('../../../slack/blocks/getSubmitTicketModalBlocks').getSubmitTicketModalBlocks;
  });

  it('returns an announcement section if there is an announcement', async () => {
    const modalStructure = await getSubmitTicketModalBlocks();
    const announcementTitle = modalStructure[0]?.text?.text ?? '';
    expect(announcementTitle).toBe('Announcement!');
    const announcementContent = modalStructure[1]?.text?.text ?? '';
    expect(announcementContent).toBe(sampleAnnouncement);
  });
});
