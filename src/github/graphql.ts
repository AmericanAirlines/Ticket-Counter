import fs from 'fs';
import path from 'path';
import { createAppAuth } from '@octokit/auth';
import { graphql } from '@octokit/graphql';
import { env } from '../env';

let privateKey: string;
if (env.githubAppPemFile) {
  privateKey = fs.readFileSync(path.join(process.cwd(), env.githubAppPemFile), { encoding: 'utf-8' });
} else {
  privateKey = env.githubAppPrivateKey;
}

const auth = createAppAuth({
  appId: env.githubAppId,
  privateKey,
  installationId: 14693205,
});

export const githubGraphql = graphql.defaults({
  request: {
    hook: auth.hook,
  },
});
