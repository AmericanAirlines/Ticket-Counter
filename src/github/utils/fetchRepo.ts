import { env } from '../../env';
import { githubGraphql } from '../graphql';

// This should be the same as the query
interface GitHubRepo {
  id: string;
}

let cachedRepo: GitHubRepo | undefined;

export const fetchRepo = async (): Promise<GitHubRepo | null> => {
  if (cachedRepo) return cachedRepo;

  const { repository } = await githubGraphql(
    `query getRepo($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
      }
    }`,
    {
      owner: env.githubRepoOwner,
      name: env.githubRepoName,
    },
  );

  cachedRepo = repository;

  return repository;
};
