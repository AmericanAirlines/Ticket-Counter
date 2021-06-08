export interface UserInfo {
  id: string;
  name: string;
  real_name: string;
  profile: {
    real_name: string;
    display_name: string;
  };
}
