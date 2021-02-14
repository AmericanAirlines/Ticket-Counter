import { githubGraphql } from '../graphql';

interface PostMessageArgs {
  name: string;
  message: string;
  platformText: string;
}

const createBody = (args: PostMessageArgs) => `${args.message}

> From ${args.name || 'someone'} in ${args.platformText}`;

export const postMessage = async (issueId: string, args: PostMessageArgs) => {
  await githubGraphql(
    `mutation newIssue($input: AddCommentInput!) {
      addComment(input: $input) {
        subject {
          id
        }
      }
    }`,
    {
      input: {
        subjectId: issueId,
        body: createBody(args),
      },
    },
  );
};
