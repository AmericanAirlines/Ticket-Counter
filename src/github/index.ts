import { json, NextFunction, Request, Response, Router } from 'express';
import { githubWebhooks } from './webhooks';

export const github = Router();

export const ignoreBotEvents = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.sender.type === 'Bot') {
    res.sendStatus(200);
    return;
  }

  next();
};

github.use(json());
github.use('/webhook', ignoreBotEvents, githubWebhooks);
