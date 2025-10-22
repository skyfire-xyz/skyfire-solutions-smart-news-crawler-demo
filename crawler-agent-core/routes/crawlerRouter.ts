import express from "express";
const router = express.Router();
import { crawlWebsite } from "../controllers/cheerioCrawler";
import { triggerEndCrawlMessage } from "../controllers/crawlerUtils";
import { stopAndRemoveCrawler } from "../controllers/crawlerRegistry";


router.route("/").post(async (req, res) => {
    let crawlerInfo = await crawlWebsite(req.body);
    await triggerEndCrawlMessage({
      totalPagesCrawled: crawlerInfo.results.length,
      totalTimeSeconds: crawlerInfo.totalTimeSeconds,
      totalTraversalSizeBytes: crawlerInfo.totalTraversalSizeBytes,
      channelId: req.body.channelId
    })

    res.status(200).send("OK");
});

router.route("/stop").post(async (req, res) => {
  stopAndRemoveCrawler(req.body.channelId, "user request")
  res.status(200).send("OK");
});

export default router;