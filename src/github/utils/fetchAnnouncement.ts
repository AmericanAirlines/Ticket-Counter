import { env } from '../../env';
import logger from '../../logger';
import { githubGraphql } from '../graphql';

interface GitHubAnnouncement {
  object: { text: string };
}

let announcement: string | undefined;

const fetchAnnouncement = async (): Promise<string> => {
  const { repository } = (await githubGraphql(
    `query getRepo($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: "main:announcement.md") {
          ... on Blob {
            text
          }
        }
      }
    }`,
    {
      owner: env.githubRepoOwner,
      name: env.githubRepoName,
    },
  )) as { repository: GitHubAnnouncement | null };

  return repository?.object?.text ?? '';
};

const autoFetchAnnouncement = async () => {
  logger.debug('Auto fetching announcement');

  try {
    const newAnnouncement = await fetchAnnouncement();
    announcement = newAnnouncement;

    setTimeout(() => autoFetchAnnouncement(), 60000);
  } catch (err) {
    if (env.nodeEnv !== 'test') {
      logger.error('Unable to fetch new products, waiting 30 minutes before trying again', err);
    }
    setTimeout(() => autoFetchAnnouncement(), 30 * 60000);
  }
};

if (env.nodeEnv !== 'test') {
  // Start auto fetching
  autoFetchAnnouncement();
}

export const getAnnouncement = async (): Promise<string> => {
  // Backup, for the edge case that someone requests this before the auto fetch finishes
  if (typeof announcement === 'undefined') {
    announcement = await fetchAnnouncement();
  }

  return announcement;
};
