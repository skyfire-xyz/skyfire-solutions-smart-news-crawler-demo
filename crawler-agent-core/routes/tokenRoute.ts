import express from "express";
const router = express.Router();

    const getEpochPlus24Hours = () => {
        const now = Date.now();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        const futureTimeInMs = now + twentyFourHoursInMs;
        const futureEpochInSeconds = Math.floor(futureTimeInMs / 1000);
        return futureEpochInSeconds;
    }

router.route("/").post(async (req, res) => {
    const {tokenAmount, userApiKey} = req.body;
    try {
        const response = await fetch(`${process.env.SKYFIRE_API_BASE_URL}/api/v1/tokens`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "skyfire-api-key": userApiKey && userApiKey.length > 0 ? userApiKey : process.env.SKYFIRE_API_KEY,
            },
            body: JSON.stringify({
                type: "kya+pay",
                buyerTag: process.env.BUYER_TAG, 
                tokenAmount: tokenAmount,
                sellerServiceId: process.env.SELLER_SERVICE_ID,
                expiresAt: getEpochPlus24Hours(),
            }),
        });

        if (response.status === 200) {
            const res1: { token: string } = await response.json();
            if (!res1 || !res1.token) {
                console.error("Unable to create kya+pay token");
                res.status(500).json({ error: "Unable to create kya+pay token" });
                return;
            }
            res.status(200).json({"token": `${res1.token}`})
        } else {
            res.status(response.status).json({ error: response.statusText });
        }
    } catch(error: any) {
        console.error("Error in token creation:", error);
        res.status(500).json({ error: error?.message || "Internal server error" });
    }
})

export default router;