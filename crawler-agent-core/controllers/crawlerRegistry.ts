import { CheerioCrawler } from "crawlee";

let runningCrawlers : Record<string,CheerioCrawler> = {};

export function addCrawler(channelId: string, crawler: CheerioCrawler) {
    runningCrawlers[`${channelId}`] = crawler;
}
  
export function getCurrentRunningCrawler(channelId:string) {
    return runningCrawlers[`${channelId}`];
}
  
export function stopAndRemoveCrawler(channelId:string, errorMsg: string) {

    const crawler = getCurrentRunningCrawler(channelId);
    if (crawler) {
        crawler.stop('Stopping crawl due to '+ errorMsg)
        delete runningCrawlers[`${channelId}`];
    }
    else {
        console.log("Crawler not found for channelId:", channelId);
    }
    
}