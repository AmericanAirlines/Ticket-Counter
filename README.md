<!-- [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![](https://github.com/AmericanAirlines/Ticketing-Bot/workflows/Build/badge.svg?branch=main)
[![codecov](https://codecov.io/gh/AmericanAirlines/Ticketing-Bot/branch/main/graph/badge.svg)](https://codecov.io/gh/AmericanAirlines/Ticketing-Bot)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/AmericanAirlines/Ticketing-Bot.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/AmericanAirlines/Ticketing-Bot/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/AmericanAirlines/Ticketing-Bot.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/AmericanAirlines/Ticketing-Bot/context:javascript) -->

# Ticketing-Bot
A bot to help with support ticketing in GitHub

## Development
### Environment Variables
Project environment variables should first be defined in `.env.sample` without real values for their data (that file is tracked by git). After cloning, make sure to duplicate `.env.sample` as `.env` and then fill in all required variables using the details provided in the section below.

### Dependencies
This project is reliant on the installation of the following dependencies:
- [Node (LTS)](https://nodejs.org/en/download/) (v12.0+)

After downloading the dependencies above, install all NPM dependencies by running `npm i`.

### Create a Slack App
Before being able to run the app locally, you'll need to create a Slack app and configure it with the appropriate permissions:
- Create an app on the [Slack API Site](https://api.slack.com/apps)
- Using the sidebar, navigate to "_OAuth & Permissions_" and enable them
  - Under '_Scopes_' --> '_Bot Token Scopes_' click `Add an OAuth Scope` and add the following scope:
    - `chat:write`
    - `chat:write.public`
- Using the sidebar, navigate to the "_App Home_"
  - Scroll to "_Your App's Presence in Slack" and click "_Edit_" next to "_App Display Name_" (e.g., using `Ticketing Bot` for the name and `ticketing-bot` for the username is recommended)
  - We also recommend enabling "Always Show My Bot as Online"
  - Finally, in the _Show Tabs_ section, disable the _Messages Tab_
- Using the sidebar, navigate to the "_Basic Information_", scroll down, copy the `Signing Secret` value and use it to replace the `SLACK_SIGNING_SECRET` value in your `.env`
- Using the sidebar, navigate to the "_Install App_" and click "Reinstall App"
  - Once finished, copy the `Bot User OAuth Access Token` value and use it to replace the `SLACK_TOKEN` value in your `.env`

Once the above steps are finished, you'll need to connect your Slack app to your app running locally. Follow the steps in the [Starting the App](#starting-the-app) section below. After the app is running, you can use [`ngrok`](https://ngrok.com) to create a publicly accessible URL. Copy that URL and head back to your app's settings:
- Using the sidebar, navigate to "_Interactivity & Shortcuts_" and enable them
  - For the `Request URL` field, use your app's URL and then append `/slack/events`
  - Under Shortcuts, chose "_Create New Shortcut_", chose "_Global_", and use the following values:
    - Name: `New support ticket`
    - Short Description: `Opens a support ticket and posts details in Slack`
    - Callback ID: `postQuestionAnonymously`
  - Click "_Save Changes_" at the bottom
- After clicking save, you should see a banner at the top of the page suggesting you reinstall the app; click `Reinstall`

### Starting the App
The best way to start the app and work on it is by using `npm run dev`, which will start the app and then restart the app whenever a TypeScript file changes. After modifying a non-Typescript file, restart the app by typing `rs` into the same terminal you ran `npm run dev` from and then hitting return.

After the app starts, it will be accessible on `localhost:3000` (unless the port was modified via `.env`).

# Contributing
Interested in contributing to the project? Check out our [Contributing Guidelines](./.github/CONTRIBUTING.md).
