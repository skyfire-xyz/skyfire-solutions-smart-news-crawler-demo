import axios from 'axios'
import { Page } from 'puppeteer'
import Pusher from 'pusher'
import { config } from './config'
import {
  CRAWLER,
  MessageType,
  PAGE_MAX_LENGTH,
  PaidStatus,
  RobotsTxtData
} from './types'

/* eslint-disable no-new */
function isFullPath(path: string): boolean {
  try {
    new URL(path)
    return true
  } catch {
    return false
  }
}
/* eslint-disable no-new */

export function getRootUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid URL scheme')
    }
    return `${parsedUrl.protocol}//${parsedUrl.host}`
  } catch (error) {
    throw new Error('Invalid URL')
  }
}

export function getRelativePath(url: string): string {
  const parsedUrl = new URL(url)
  return parsedUrl.pathname
}

export async function fetchRobotsTxt(
  path: string,
  channelId: string
): Promise<string> {
  let robotsUrl = ''
  try {
    const domain = new URL(path).origin
    robotsUrl =
      domain === 'https://skyfire.xyz' || domain === 'https://www.skyfire.xyz'
        ? 'https://skyfire.xyz/robots-skyfire.txt'
        : `${domain}/robots.txt`
    const response = await axios.get(`${robotsUrl}`, { timeout: 3000 })
    const robotsTxt = response.data
    console.log(`Fetched robots.txt`)
    const messageData = {
      message: {
        type: MessageType.PAGE,
          title: 'robots.txt',
          request: {url: robotsUrl, headers:"",  method:""}, 
          response: {text: robotsTxt.substring(0, 5000), url: robotsUrl, headers:""}, 
          paid: PaidStatus.FREE,
          depth: 0,
      }
    }
    await triggerCrawlEvent(messageData, channelId)
    return robotsTxt
  } catch (error) {
    console.log(
      `Issue fetching robots.txt from ${robotsUrl}: crawling without robots.txt`
    )
    return ''
  }
}

export function parseRobotsTxt(robotsTxt: string): RobotsTxtData {
  const data: RobotsTxtData = {
    paymentUrl: '',
    siteUsername: '',
    disallowedPaths: new Set(),
    paidContentPaths: {}
  }
  const lines = robotsTxt.split('\n')
  let appliesToUserAgent = false

  for (const line of lines) {
    const [directive, info] = line
      .trim()
      .split(/:(.+)/)
      .map((part) => part.trim())

    switch (directive.toLowerCase()) {
      case 'payment-url':
        data.paymentUrl = info
        break
      case 'site-username':
        data.siteUsername = info
        break
      case 'user-agent':
        appliesToUserAgent = info === '*' || info === CRAWLER
        break
      case 'disallow':
        if (appliesToUserAgent) {
          data.disallowedPaths.add(info)
        }
        break
      case 'paid-content':
        {
          const [path, price] = info.split(', 0.00').map((part) => part.trim())
          data.paidContentPaths[normalizePath(path)] = {
            claimId: '',
            amount: Number(price)
          }
        }
        break
      default:
        break
    }
  }
  return data
}

export function isAllowedByRobotsTxt(
  relativePath: string,
  robotsData: RobotsTxtData
): boolean {
  let isAllowed = true
  let maxRuleLength = -1
  for (const disallowedPath of robotsData.disallowedPaths) {
    if (
      relativePath.startsWith(disallowedPath) ||
      new RegExp(disallowedPath.replace(/\*/g, '.*')).test(relativePath)
    ) {
      if (disallowedPath.length > maxRuleLength) {
        isAllowed = false
        maxRuleLength = disallowedPath.length
      }
    }
  }
  return isAllowed
}

export function filterAllowedLinks(
  allLinks: string[],
  robotsData: RobotsTxtData,
  rootUrl: string
): string[] {
  const allowedLinks: string[] = []
  for (const link of allLinks) {
    try {
      let pathToCheck: string = link
      if (isFullPath(link)) {
        if (getRootUrl(link) !== rootUrl) {
          continue
        }
        pathToCheck = getRelativePath(link)
      }
      const normalizedPathToCheck = normalizePath(pathToCheck)
      if (isAllowedByRobotsTxt(normalizedPathToCheck, robotsData)) {
        allowedLinks.push(normalizedPathToCheck)
      }
    } catch (error) {
      console.log({ url: link }, 'Error filtering links')
    }
  }
  return allowedLinks
}

export function normalizePath(path: string): string {
  if (path.endsWith('*')) {
    path = path.slice(0, -1)
  }
  if (path.endsWith('$')) {
    path = path.slice(0, -1)
  }
  return path.endsWith('/') ? path : `${path}/`
}

export async function getTitleFromPage(page: Page): Promise<string> {
  let title: string
  try {
    title = await page.$eval(
      '.text-40.font-bold.leading-98.lg\\:text-80',
      (h1) => h1?.textContent?.trim() ?? 'No title found'
    )
  } catch (e) {
    title = 'No title found'
  }
  return title
}

export async function getTextFromPage(page: Page): Promise<string> {
  let textContent = await page.$eval('body', (element) => element.innerText)
  if (textContent.length > PAGE_MAX_LENGTH) {
    textContent = textContent.slice(0, PAGE_MAX_LENGTH) + '...'
  }
  return textContent
}

export const pusher = new Pusher({
  appId: config.get('pusher.appId'),
  key: config.get('pusher.key'),
  secret: config.get('pusher.secret'),
  cluster: config.get('pusher.cluster'),
  useTLS: config.get('pusher.useTLS')
})

export async function triggerCrawlEvent(
  data: unknown,
  channel: string = 'crawler-channel',
  event: string = 'crawler-event'
): Promise<void> {
  console.log(
    { data },
    `Triggering pusher event ${event} on channel ${channel} type ${(data as { message: { type: string } }).message.type}`
  )
  await pusher.trigger(channel, event, data)
}

export async function triggerEndCrawlMessage({
  totalPagesCrawled,
  totalTimeSeconds,
  totalTraversalSizeBytes,
  channelId
}: {
  totalPagesCrawled: number
  totalTimeSeconds: number
  channelId: string
  totalTraversalSizeBytes: number
}): Promise<void> {
  const receiptMessage = {
    message: {
      type: MessageType.SUMMARY,
      totalPagesCrawled: '' + totalPagesCrawled,
      totalTraversalSizeBytes: '' + totalTraversalSizeBytes,
      totalTimeSeconds: '' + totalTimeSeconds
    }
  }
  await triggerCrawlEvent(receiptMessage, channelId)
}

export function encodeHTML(htmlString: string): string {
  return htmlString;
}