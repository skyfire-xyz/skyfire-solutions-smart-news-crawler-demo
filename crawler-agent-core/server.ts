import express, {Express, Request, Response} from "express";
import cors from "cors";
import dotenv from "dotenv";

const app: Express = express();

dotenv.config();
const port = process.env.PORT;

import crawlerRoute from "./routes/crawlerRouter";
import tokenRoute from "./routes/tokenRoute";

app.use(cors());
app.use(express.json());

app.use("/crawl", crawlerRoute);
app.use("/token", tokenRoute);

app.get("/", (req: Request, res: Response) => {
  return res.send("Welcome to Crawler Service");
});

app.listen(port, () => {
  console.log(`Connected on ${port}`);
});
