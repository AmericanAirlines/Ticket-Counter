import { ViewSubmitAction, SlackViewMiddlewareArgs, App } from '@slack/bolt';
import { InputBlock } from '@slack/types';
import logger from '../../logger';
import { env } from '../../env';
import { AppMiddlewareFunction } from '../types';
import { githubGraphql } from '../../github/graphql';
import { Platform, Ticket } from '../../entities/Ticket';

export const submitTicketSubmitted: AppMiddlewareFunction<SlackViewMiddlewareArgs<ViewSubmitAction>> = (
  app: App,
) => async ({ ack, body, view }) => {
  try {
    const { blocks, state } = view;
    const ticketTitleBlockId = (blocks[0] as InputBlock).block_id;
    const ticketTitleActionId = (blocks[0] as InputBlock).element.action_id;
    const descriptionBlockId = (blocks[1] as InputBlock).block_id;
    const descriptionActionId = (blocks[1] as InputBlock).element.action_id;

    if (!ticketTitleBlockId || !ticketTitleActionId || !descriptionBlockId || !descriptionActionId) {
      throw new Error('Missing title or description block id');
    }

    const title = state.values[ticketTitleBlockId][ticketTitleActionId].value;
    const description = state.values[descriptionBlockId][descriptionActionId].value;

    const { createIssue } = await githubGraphql(
      `mutation newIssue($input: CreateIssueInput!) {
          createIssue(input: $input) {
            issue {
              id
              url
            }
          }
        }`,
      {
        input: {
          title,
          body: description,
          repositoryId: 'MDEwOlJlcG9zaXRvcnkzMzgzNTY2ODE=',
        },
      },
    );

    const text = `*_New Support Ticket Created_*
${createIssue.issue.url}
*Title:* ${title}
*Description:*
>${description}`;

    const result: { ts: string } = (await app.client.chat.postMessage({
      token: env.slackBotToken,
      channel: 'C01MYGGAT8S',
      text,
    })) as any;
    ack();

    const ticket = new Ticket(createIssue.issue.id, body.user.id, body.user.name, result.ts, Platform.Slack);
    await ticket.save();

    logger.info(`Question asked by ${body.user.name}/${body.user.id}: ${description}`);
  } catch (error) {
    ack();
    // const { trigger_id: triggerId } = (body as unknown) as { [id: string]: string };
    logger.error('Something went wrong trying to post to a channel: ', error);
    try {
      // await app.client.views.open({
      //   trigger_id: triggerId,
      //   token: env.slackBotToken,
      //   view: {
      //     type: 'modal',
      //     title: {
      //       type: 'plain_text',
      //       text: 'Error',
      //     },
      //     blocks: [
      //       {
      //         type: 'section',
      //         text: {
      //           type: 'mrkdwn',
      //           text: `:warning: unable to post question to channel.
      //           \nWe're not totally sure what happened but this issue has been logged.`,
      //         },
      //       },
      //     ],
      //   },
      // });
    } catch (err) {
      logger.error("Something went really wrong and the error modal couldn't be opened");
    }
  }
};
