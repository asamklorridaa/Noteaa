# Firebase setup

The app uses Clerk for sign-in. Every Firestore request goes through the Next.js server, which authenticates the Clerk session and uses the Clerk user ID as the only Firestore path it can access. Firebase Admin credentials are server-only. Browser clients cannot access Firestore directly.

## Configure the app

1. In Firebase, create a project and a Cloud Firestore database. Firebase Authentication is not required for this server-mediated setup.
2. Set `FIREBASE_ADMIN_PROJECT_ID` in the local environment using your Firebase project ID.
3. Generate a Firebase service-account key in **Project settings → Service accounts**. Keep the downloaded JSON private. Set these server-only variables from it:
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
4. Deploy the included rules:

   ```sh
   firebase deploy --only firestore:rules
   ```

Never commit a service-account key or put its private key in a `NEXT_PUBLIC_*` variable. If a key has been shared or exposed, revoke it and generate a replacement. The browser only calls authenticated `/api/user-data/...` endpoints; the server derives the user ID from Clerk and never accepts a user ID supplied by the browser.

## Configure the AI chatbot

The chatbot uses OpenRouter through the authenticated `/api/chat` server endpoint. Add `OPENROUTER_API_KEY` to the server environment and optionally set `OPENROUTER_MODEL` (defaults to `openrouter/free`). Keep the key private: do not use a `NEXT_PUBLIC_*` variable or commit it. The server sends only the signed-in user's recent chat history and current message to OpenRouter.

## User data layout

Data is stored in each signed-in user's own subcollections:

- `users/{userId}/tasks`
- `users/{userId}/projects`
- `users/{userId}/events`
- `users/{userId}/notes`
- `users/{userId}/chatMessages`
- `users/{userId}/settings`

`firebase.json` points the Firebase CLI at [firestore.rules](./firestore.rules). These rules deny all direct client access. The trusted server uses Firebase Admin, which bypasses Firestore rules, so it must always scope every operation to the Clerk user ID obtained from the verified session.
