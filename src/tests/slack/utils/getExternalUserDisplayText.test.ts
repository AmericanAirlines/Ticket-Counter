import { getExternalUserDisplayText } from '../../../slack/utils/getExternalUserDisplayText';
import { UserInfo } from '../../../slack/types';

describe('get external user display text util', () => {
  it('will include both real name and display name if both are provided', () => {
    const realName = 'Jane Smith';
    const mockUser = {
      real_name: realName,
      profile: {
        display_name: 'Jane.Smith',
        real_name: realName,
      },
    } as UserInfo;
    expect(getExternalUserDisplayText(mockUser)).toEqual(`${realName} (\`@${mockUser.profile.display_name}\`)`);
  });
  it('will only show real name if display name cannot be found', () => {
    const realName = 'Jane Smith';
    const mockUser = {
      real_name: realName,
      profile: {
        display_name: '',
        real_name: realName,
      },
    } as UserInfo;
    expect(getExternalUserDisplayText(mockUser)).toEqual(realName);
  });
});
