import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { serverEnv } from '@/server/env';

type TableExpectation = {
  table: string;
  columns: string[];
};

const REQUIRED_SCHEMA: TableExpectation[] = [
  { table: 'profiles', columns: ['id'] },
  { table: 'chats', columns: ['id', 'title', 'updated_at'] },
  { table: 'chat_participants', columns: ['chat_id', 'user_id', 'unread_count'] },
  { table: 'messages', columns: ['id', 'chat_id', 'sender_id', 'content', 'created_at'] },
  { table: 'chat_settings', columns: ['chat_id', 'user_id', 'muted'] },
  { table: 'subscriptions', columns: ['user_id', 'plan', 'status', 'expires_at'] },
];

export type SchemaHealthResult = {
  status: 'ok' | 'degraded';
  checkedAt: string;
  missingTables: string[];
  missingColumns: Record<string, string[]>;
};

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

async function checkTableColumns(supabaseAdmin: SupabaseClient, table: string, columns: string[]) {
  const missing: string[] = [];

  for (const column of columns) {
    const { error } = await supabaseAdmin.from(table).select(column).limit(1);
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('does not exist') || message.includes('column')) {
        missing.push(column);
      }
    }
  }

  return missing;
}

export async function checkSupabaseSchema(supabaseAdmin: SupabaseClient): Promise<SchemaHealthResult> {
  const missingTables: string[] = [];
  const missingColumns: Record<string, string[]> = {};

  for (const expected of REQUIRED_SCHEMA) {
    const { error } = await supabaseAdmin.from(expected.table).select('*').limit(1);

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('does not exist') || message.includes('relation')) {
        missingTables.push(expected.table);
        continue;
      }
    }

    const missingForTable = await checkTableColumns(supabaseAdmin, expected.table, expected.columns);
    if (missingForTable.length > 0) {
      missingColumns[expected.table] = missingForTable;
    }
  }

  return {
    status: missingTables.length === 0 && Object.keys(missingColumns).length === 0 ? 'ok' : 'degraded',
    checkedAt: new Date().toISOString(),
    missingTables,
    missingColumns,
  };
}

export function buildSchemaHealthResponse(result: SchemaHealthResult) {
  return {
    status: result.status,
    checkedAt: result.checkedAt,
    missingTables: result.missingTables,
    missingColumns: result.missingColumns,
  };
}
