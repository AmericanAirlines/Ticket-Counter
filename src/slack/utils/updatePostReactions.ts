import { app } from '../../app';
import { Status } from '../../entities/Ticket';
import { env } from '../../env';
import logger from '../../logger';

enum Emoji {
  Eyes = 'eyes',
  WhiteCheckMark = 'white_check_mark',
  Repeat = 'leftwards_arrow_with_hook',
}

export async function updatePostReactions(status: Status, threadTs: string) {
  switch (status) {
    case Status.InProgress:
      await updateReaction('add', Emoji.Eyes, threadTs);
      break;
    case Status.Closed:
      await updateReaction('remove', Emoji.Eyes, threadTs);
      await updateReaction('add', Emoji.WhiteCheckMark, threadTs);
      break;
    case Status.Reopened:
      await updateReaction('remove', Emoji.WhiteCheckMark, threadTs);
      await updateReaction('add', Emoji.Repeat, threadTs);
      await updateReaction('add', Emoji.Eyes, threadTs);
      break;
    default:
      break;
  }
}

async function updateReaction(action: 'remove' | 'add', name: string, threadTs: string) {
  try {
    if (action === 'add') {
      await app.client.reactions.add({
        token: env.slackBotToken,
        name,
        thread_ts: threadTs,
        channel: env.slackSupportChannel,
      });
    } else {
      await app.client.reactions.remove({
        token: env.slackBotToken,
        name,
        thread_ts: threadTs,
        channel: env.slackSupportChannel,
      });
    }
  } catch (err) {
    logger.error(`Unable to ${action} emoji: ${name}`);
  }
}
