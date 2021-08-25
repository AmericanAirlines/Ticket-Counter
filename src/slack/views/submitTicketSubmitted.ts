import { ViewSubmitAction, SlackViewMiddlewareArgs, App } from '@slack/bolt';
import logger from '../../logger';
import { env } from '../../env';
import { AppMiddlewareFunction } from '../types';
import { githubGraphql } from '../../github/graphql';
import { Platform, Ticket } from '../../entities/Ticket';
import { fetchRepo } from '../../github/utils/fetchRepo';
import { ViewOutputUtils } from '../utils/ViewOutputUtils';
import { SubmitTicketModalElement } from '../blocks/getSubmitTicketModalBlocks';

export const submitTicketSubmitted: AppMiddlewareFunction<SlackViewMiddlewareArgs<ViewSubmitAction>> =
  (app: App) =>
  async ({ ack, body, view }) => {
    try {
      await ack();

      const viewUtils = new ViewOutputUtils(view);
      const { trigger_id: triggerId } = body as unknown as { [id: string]: string };

      const title = viewUtils.getInputValue(SubmitTicketModalElement.Title)?.value ?? '';
      const description = viewUtils.getInputValue(SubmitTicketModalElement.Description)?.value ?? '';
      const type = viewUtils.getInputValue(SubmitTicketModalElement.Type)?.selected_option?.value?.trim();
      const stakeholders = viewUtils.getInputValue(SubmitTicketModalElement.Stakeholders)?.selected_users ?? [];

      if (!title || !description || (!type && type !== '')) {
        throw new Error('Missing required fields');
      }

      try {
        await app.client.views.open({
          view: {
            type: 'modal',
            title: {
              type: 'plain_text',
              text: `We're working on it!`,
            },
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: ":white_check_mark: You've successfully submitted your ticket",
                  emoji: true,
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Someone will help you shortly!\nSee <#${env.slackSupportChannel}> for more details. Keep an eye on your Direct Messages in case something goes wrong`,
                },
              },
            ],
          },
          trigger_id: triggerId,
          token: env.slackBotToken,
        });
      } catch (e) {
        logger.error('Unable to open the confirmation modal', e);
      }

      const repository = await fetchRepo();

      if (!repository) {
        throw new Error('Repository does not exist; unable to process submission');
      }

      const githubBody = `${description}\n\n> Opened in Slack by \`@${body.user.name}\`\n_Comments will be synced automatically between this Issue and the Slack thread_`;
      let createIssue: { issue: { id: string; url: string; number: number } } | undefined;
      try {
        const response: { createIssue: { issue: { id: string; url: string; number: number } } } = await githubGraphql(
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
              body: githubBody,
              repositoryId: repository.id,
              issueTemplate: type,
            },
          },
        );
        createIssue = response.createIssue;
      } catch (error) {
        logger.error('Unable to create issue', error);
      }

      const truncatedDescription =
        description.length > 200
          ? `${description.substr(0, Math.min(description.length, 200))}...${
              createIssue ? '\n_(Full description can be found on the issue)_' : ''
            }`
          : description;
      const headerText = createIssue
        ? `<${createIssue.issue.url}|Ticket #${createIssue.issue.number} Opened> by <@${body.user.id}>`
        : `:warning: Something went wrong opening a ticket from <@${body.user.id}>`;
      const text = `*_${headerText}_*
*Title:* ${title}
>${truncatedDescription}`;

      const result: { ts: string } = (await app.client.chat.postMessage({
        token: env.slackBotToken,
        channel: env.slackSupportChannel,
        text,
      })) as any;

      if (!createIssue) return;

      const ticket = new Ticket(
        createIssue.issue.id,
        createIssue.issue.number,
        body.user.id,
        body.user.name,
        Platform.Slack,
        result.ts,
      );
      await ticket.save();

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

      logger.info(`Ticket opened by ${body.user.name}/${body.user.id}: ${description}`);
    } catch (error) {
      logger.error('Something went wrong trying to create a ticket: ', error);
    }
  };
