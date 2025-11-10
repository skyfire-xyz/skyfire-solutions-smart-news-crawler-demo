import express from "express";
const router = express.Router();
import { crawlWebsite } from "../controllers/cheerioCrawler";
import { triggerEndCrawlMessage } from "../controllers/crawlerUtils";
import { stopAndRemoveCrawler } from "../controllers/crawlerRegistry";

router.route("/").post(async (req, res) => {
  try {
    let crawlerInfo = await crawlWebsite(req.body);
    await triggerEndCrawlMessage({
      totalPagesCrawled: crawlerInfo.results.length,
      totalTimeSeconds: crawlerInfo.totalTimeSeconds,
      totalTraversalSizeBytes: crawlerInfo.totalTraversalSizeBytes,
      channelId: req.body.channelId,
    }).catch((error) => {
      console.error("Error triggering end crawl message:", error);
      // Don't fail the request if Pusher fails
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error in crawl route:", error);
    // Always return a response, even on error
    if (!res.headersSent) {
      res.status(500).json({
        error: "Crawl failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

router.route("/stop").post(async (req, res) => {
  try {
    stopAndRemoveCrawler(req.body.channelId, "user request");
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error in stop route:", error);
    // Still return success since stop is best-effort
    if (!res.headersSent) {
      res.status(200).send("OK");
    }
  }
});

export default router;
