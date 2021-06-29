import 'jest';
import { relativeDateFromTimestamp } from '../../utils/dateFormatter';

jest.mock('../../env.ts');

const mockTimeZonePDT = 'America/Los_Angeles';
const mockTimeZoneEST = 'America/New_York';
const mockTimeStamp = '2021-06-03T21:28:55Z';

describe('relativeDateFromTimestamp formatting', () => {
  it('returns the correct format for the time based on PDT', async () => {
    const dateTime = relativeDateFromTimestamp(mockTimeStamp, mockTimeZonePDT);
    expect(dateTime).toEqual('June 3, 2021, 2:28 PM PDT');
  });

  it('returns the correct format for the time based on EST', async () => {
    const dateTime = relativeDateFromTimestamp(mockTimeStamp, mockTimeZoneEST);
    expect(dateTime).toEqual('June 3, 2021, 5:28 PM EDT');
  });
});
