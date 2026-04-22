import cors from "cors";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { appRouter } from "./routers";
import { createTrpcContext } from "./trpc/context";
import { serverEnv } from './env';
import {
  buildSchemaHealthResponse,
  checkSupabaseSchema,
  createSupabaseAdminClient,
} from './health/schema-health';

const app = express();
const supabaseAdmin = createSupabaseAdminClient();
let lastSchemaHealth = await checkSupabaseSchema(supabaseAdmin);

if (lastSchemaHealth.status !== 'ok') {
  // eslint-disable-next-line no-console
  console.error('Supabase schema health check failed at startup', lastSchemaHealth);
}

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

app.get('/server/health/db', async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const token = req.headers['x-health-token'];
    if (!serverEnv.HEALTHCHECK_TOKEN || token !== serverEnv.HEALTHCHECK_TOKEN) {
      return res.status(403).json({ status: 'forbidden' });
    }
  }

  lastSchemaHealth = await checkSupabaseSchema(supabaseAdmin);
  return res.json(buildSchemaHealthResponse(lastSchemaHealth));
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
