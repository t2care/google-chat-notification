import * as github from '@actions/github';
import * as axios from 'axios';
import { Status } from './status';

const statusColorPalette: { [key in Status]: string } = {
  success: "#2cbe4e",
  cancelled: "#ffc107",
  failure: "#ff0000"
};

const statusText: { [key in Status]: string } = {
  success: "Succeeded",
  cancelled: "Cancelled",
  failure: "Failed"
};

const textButton = (text: string, url: string) => ({
  textButton: {
    text,
    onClick: { openLink: { url } }
  }
});

export async function notify(name: string, url: string, status: Status) {
  const { owner, repo } = github.context.repo;
  const { eventName, sha, ref } = github.context;
  const { number } = github.context.issue;
  const runNumber = github.context.runNumber;
  const repoUrl = `https://git.t2-technology.fr/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pulls/${number}` : `/commit/${sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${repoUrl}/actions/runs/${runNumber}`;

  const body = {
    cards: [{
      sections: [
        {
          widgets: [{
            textParagraph: {
              text: `<b>${name} <font color="${statusColorPalette[status]}">${statusText[status]}</font></b>`
            }
          }]
        },
        {
          widgets: [
            {
              keyValue: {
                topLabel: "repository",
                content: `${owner}/${repo}`,
                contentMultiline: true,
                button: textButton("OPEN REPOSITORY", repoUrl)
              }
            },
            {
              keyValue: {
                topLabel: "event name",
                content: eventName,
                button: textButton("OPEN EVENT", eventUrl)
              }
            },
            {
              keyValue: { topLabel: "ref", content: ref }
            }
          ]
        },
        {
          widgets: [{
            buttons: [textButton("OPEN CHECKS", checksUrl)]
          }]
        }
      ]
    }]
  };

  const response = await axios.default.post(url, body);
  if (response.status !== 200) {
    throw new Error(`Google Chat notification failed. response status=${response.status}`);
  }
}