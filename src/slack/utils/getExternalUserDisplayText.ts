import { UserInfo } from '../types';

export function getExternalUserDisplayText(user: UserInfo): string {
  const { real_name: realName, display_name: displayName } = user.profile;
  return displayName ? `${realName} (\`@${displayName}\`)` : realName;
}
