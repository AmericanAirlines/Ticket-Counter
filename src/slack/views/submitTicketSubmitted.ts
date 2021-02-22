import { ViewSubmitAction, SlackViewMiddlewareArgs, App } from '@slack/bolt';
import logger from '../../logger';
import { env } from '../../env';
import { AppMiddlewareFunction } from '../types';
import { githubGraphql } from '../../github/graphql';
import { Platform, Ticket } from '../../entities/Ticket';
import { fetchRepo } from '../../github/utils/fetchRepo';
import { ViewOutputUtils } from '../utils/ViewOutputUtils';
import { SubmitTicketModalElement } from '../blocks/getSubmitTicketModalBlocks';

export const submitTicketSubmitted: AppMiddlewareFunction<SlackViewMiddlewareArgs<ViewSubmitAction>> = (
  app: App,
) => async ({ ack, body, view }) => {
  try {
    const viewUtils = new ViewOutputUtils(view);
    const { trigger_id: triggerId } = (body as unknown) as { [id: string]: string };

    const title = viewUtils.getInputValue(SubmitTicketModalElement.Title)?.value ?? '';
    const description = viewUtils.getInputValue(SubmitTicketModalElement.Description)?.value ?? '';
    const type = viewUtils.getInputValue(SubmitTicketModalElement.Type)?.selected_option?.value;
    const stakeholders = viewUtils.getInputValue(SubmitTicketModalElement.Stakeholders)?.selected_users ?? [];

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
          body: description,
          repositoryId: repository.id,
          issueTemplate: type,
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
    const text = `*_<${createIssue.issue.url}|Ticket #${createIssue.issue.number} Opened>_*
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
