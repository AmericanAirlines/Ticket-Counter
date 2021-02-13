import { githubGraphql } from '../graphql';

// This should be the same as the query
interface GitHubUser {
  login: string;
  name: string | null;
}

export const fetchUser = async (login: string): Promise<GitHubUser | null> => {
  const { user } = await githubGraphql(
    `query getUser($login: String!) {
        user(login: $login) {
          login
          name
        }
      }`,
    { login },
  );

  return user;
};
