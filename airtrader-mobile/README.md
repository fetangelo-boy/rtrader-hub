# AirTrader Mobile

AirTrader Mobile is an Expo + React Native app connected to Supabase auth and a local tRPC backend.

## Features
- Email/password authentication via Supabase
- Protected tRPC API with JWT bearer token from Supabase session
- Chats list fetched from backend (`chat.list`)
- Chat details with messages (`chat.getMessages`)
- Send message flow (`chat.sendMessage`)
- Account subscription status (`account.getSubscription`)

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Start API server (terminal 1):
   ```bash
   npm run server
   ```
4. Start Expo app (terminal 2):
   ```bash
   npm run start
   ```

## Environment variables

Required client values:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL` (for emulator/device)

Required server values:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (optional, default `3000`)

## Notes
- For Android emulator, usually use `http://10.0.2.2:3000` as API base URL.
- tRPC endpoint path is `/api/trpc`.
- Chat/account routes are strict API mode now (no offline fallback data in UI).
