import { env } from '../../env';
import logger from '../../logger';
import { githubGraphql } from '../graphql';

// This should be the same as the query
interface GitHubRepo {
  issueTemplates: Array<{
    name: string;
    about: string;
    title: string;
    body: string;
  }>;
}

let templates: GitHubRepo['issueTemplates'] | undefined;

const fetchIssueTemplates = async (): Promise<GitHubRepo['issueTemplates']> => {
  const { repository } = (await githubGraphql(
    `query getRepo($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        issueTemplates {
          name
          about
          title
          body
        }
      }
    }`,
    {
      owner: env.githubRepoOwner,
      name: env.githubRepoName,
    },
  )) as { repository: GitHubRepo | null };

  return repository?.issueTemplates ?? [];
};

const autoFetchTemplates = async () => {
  logger.debug('Auto fetching issue templates');

  try {
    const newTemplates = await fetchIssueTemplates();
    templates = newTemplates;

    setTimeout(() => autoFetchTemplates(), 60000);
  } catch (err) {
    logger.error('Unable to fetch new templates, waiting 30 minutes before trying again', err);
    setTimeout(() => autoFetchTemplates(), 30 * 60000);
  }
};

// Start auto fetching
autoFetchTemplates();

export const getIssueTemplates = async (): Promise<GitHubRepo['issueTemplates']> => {
  // Backup, for the edge case that someone requests this before the auto fetch finishes
  if (!Array.isArray(templates)) {
    templates = await fetchIssueTemplates();
  }

  return templates;
};
