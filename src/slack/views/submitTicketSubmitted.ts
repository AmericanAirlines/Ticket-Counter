import { ViewSubmitAction, SlackViewMiddlewareArgs, App } from '@slack/bolt';
import { InputBlock } from '@slack/types';
import logger from '../../logger';
import { env } from '../../env';
import { AppMiddlewareFunction } from '../types';
import { githubGraphql } from '../../github/graphql';
import { Platform, Ticket } from '../../entities/Ticket';
import { fetchRepo } from '../../github/utils/fetchRepo';

export const submitTicketSubmitted: AppMiddlewareFunction<SlackViewMiddlewareArgs<ViewSubmitAction>> = (
  app: App,
) => async ({ ack, body, view }) => {
  try {
    const { blocks, state } = view;
    const { trigger_id: triggerId } = (body as unknown) as { [id: string]: string };
    const ticketTitleBlockId = (blocks[0] as InputBlock)?.block_id;
    const ticketTitleActionId = (blocks[0] as InputBlock)?.element.action_id;
    const descriptionBlockId = (blocks[1] as InputBlock)?.block_id;
    const descriptionActionId = (blocks[1] as InputBlock)?.element.action_id;
    const stakeholdersBlockId = (blocks[2] as InputBlock)?.block_id;
    const stakeholdersActionId = (blocks[2] as InputBlock)?.element.action_id;

    if (
      !ticketTitleBlockId ||
      !ticketTitleActionId ||
      !descriptionBlockId ||
      !descriptionActionId ||
      !stakeholdersBlockId ||
      !stakeholdersActionId
    ) {
      throw new Error('Missing a required block id; unable to process submission');
    }

    const title = state.values[ticketTitleBlockId][ticketTitleActionId].value;
    const description: string = state.values[descriptionBlockId][descriptionActionId].value;
    const stakeholders = state.values[stakeholdersBlockId][stakeholdersActionId].selected_users;

    const repository = await fetchRepo();

    if (!repository) {
      throw new Error('Repository does not exist; unable to process submission');
    }

    const { createIssue } = await githubGraphql(
      `mutation newIssue($input: CreateIssueInput!) {
          createIssue(input: $input) {
            issue {
              id
              url
              number
            }
          }
        }`,
      {
        input: {
          title,
          body: `${description}\n\n Opened in Slack by \`@${body.user.name}\``,
          repositoryId: repository.id,
        },
      },
    );

    const truncatedDescription =
      description.length > 200
        ? `${description.substr(
            0,
            Math.max(description.length, 200),
          )}...\n_(Full description can be found on the issue)_`
        : description;
    const text = `*_<${createIssue.issue.url}|Ticket #${createIssue.issue.number} Opened> by <@${body.user.id}>_*
*Title:* ${title}
>${truncatedDescription}`;

    const result: { ts: string } = (await app.client.chat.postMessage({
      token: env.slackBotToken,
      channel: env.slackSupportChannel,
      text,
    })) as any;

    ack();

    await app.client.views.open({
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: `Ticket #${createIssue.issue.number} Opened`,
        },
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ':white_check_mark: Your ticket was opened successfully',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Someone will help you shortly!\nSee <#${env.slackSupportChannel}> for more details.`,
            },
          },
        ],
      },
      trigger_id: triggerId,
      token: env.slackBotToken,
    });

    let threadResponse = `<@${body.user.id}>, please monitor this thread for updates. If you need to add more information or if you want to respond to the support team, add a message to this thread.`;
    if (stakeholders.length > 0) {
      const formattedStakeholders = stakeholders.map((stakeholder: string) => `<@${stakeholder}>`).join(', ');
      threadResponse += `\n\nFYI ${formattedStakeholders}`;
    }

    await app.client.chat.postMessage({
      token: env.slackBotToken,
      channel: env.slackSupportChannel,
      text: threadResponse,
      thread_ts: result.ts,
    });

    const ticket = new Ticket(
      createIssue.issue.id,
      createIssue.issue.number,
      body.user.id,
      body.user.name,
      Platform.Slack,
      result.ts,
    );
    await ticket.save();

    logger.info(`Ticket opened by ${body.user.name}/${body.user.id}: ${description}`);
  } catch (error) {
    ack();
    const { trigger_id: triggerId } = (body as unknown) as { [id: string]: string };
    logger.error('Something went wrong trying to create a ticket: ', error);
    try {
      await app.client.views.open({
        trigger_id: triggerId,
        token: env.slackBotToken,
        view: {
          type: 'modal',
          title: {
            type: 'plain_text',
            text: 'Error',
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:warning: Unable to open ticket.
                \nWe're not totally sure what happened, but this issue has been logged.`,
              },
            },
          ],
        },
      });
    } catch (err) {
      logger.error("Something went really wrong and the error modal couldn't be opened");
    }
  }
};
