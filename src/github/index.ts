import { Router } from 'express';
import { githubWebhooks } from './webhooks';

export const github = Router();

github.use('/webhook', githubWebhooks);
