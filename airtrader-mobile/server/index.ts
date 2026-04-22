import cors from "cors";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { appRouter } from "./routers";
import { createTrpcContext } from "./trpc/context";
import { serverEnv } from './env';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTrpcContext,
  }),
);

const port = serverEnv.PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AirTrader tRPC API listening on :${port}`);
});
