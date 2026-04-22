import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  HEALTHCHECK_TOKEN: z.string().min(1).optional(),
  PORT: z
    .string()
    .optional()
    .transform((value) => Number(value ?? "3030")),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid server env:\n${parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n")}`,
  );
}

export const serverEnv = parsed.data;
