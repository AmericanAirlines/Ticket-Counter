import { WebAPIPlatformError } from '@slack/web-api';
import { app } from '../../app';
import { Status } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';

export enum Emoji {
  InProgress = 'technologist',
  Closed = 'white_check_mark',
  Reopened = 'leftwards_arrow_with_hook',
  Transferred = 'truck',
}

export async function updatePostReactions(status: Status, threadTs: string, isReopened = false) {
  const reopenedEmojis = isReopened ? [Emoji.Reopened] : [];
  switch (status) {
    case Status.InProgress:
      await updateReactions(threadTs, { remove: [Emoji.Closed], add: [...reopenedEmojis, Emoji.InProgress] });
      break;
    case Status.Closed:
      await updateReactions(threadTs, { remove: [Emoji.InProgress], add: [Emoji.Closed] });
      break;
    case Status.Open:
      await updateReactions(threadTs, {
        remove: [Emoji.Closed, Emoji.InProgress],
        add: reopenedEmojis,
      });
      break;
    // no default
  }
}

async function updateReactions(threadTs: string, { remove, add }: { remove: Emoji[]; add: Emoji[] }) {
  const mapper = (action: 'remove' | 'add') => async (name: Emoji) => {
    try {
      await app.client.reactions[action]({
        token: env.slackBotToken,
        name,
        timestamp: threadTs,
        channel: env.slackSupportChannel,
      });
    } catch (err) {
      const error = err as WebAPIPlatformError | Error;
      if (!('data' in error && ['no_reaction', 'already_reacted'].includes(error.data.error))) {
        logger.error(`Unable to ${action} emoji: ${name}`, err);
      }
    }
  };

  await Promise.all(remove.map(mapper('remove')));
  await Promise.all(add.map(mapper('add')));
}
