import Constants from 'expo-constants';
import { z } from 'zod';

const clientEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
});

const parsed = clientEnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid app environment. Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. Details: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

const defaultApiUrl = Constants.expoConfig?.hostUri
  ? `http://${Constants.expoConfig.hostUri.split(':')[0]}:3000`
  : 'http://localhost:3000';

export const env = {
  ...parsed.data,
  EXPO_PUBLIC_API_URL: parsed.data.EXPO_PUBLIC_API_URL ?? defaultApiUrl,
};
