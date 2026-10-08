import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const [accountIdentifier, projectId] = process.argv.slice(2);

if (!accountIdentifier || !projectId) {
  console.error("Usage: npm run grant-admin -- <email-or-uid> <project-id>");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId,
});

const auth = getAuth();
const user = accountIdentifier.includes("@")
  ? await auth.getUserByEmail(accountIdentifier)
  : await auth.getUser(accountIdentifier);

await auth.setCustomUserClaims(user.uid, {
  ...user.customClaims,
  admin: true,
  role: "ADMIN",
});
await getFirestore().doc(`users/${user.uid}`).set({
  uid: user.uid,
  email: user.email ?? null,
  displayName: user.displayName ?? user.email?.split("@")[0] ?? "Администратор",
  photoURL: user.photoURL ?? null,
  role: "ADMIN",
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`Admin claim assigned to ${user.uid} (${user.email ?? accountIdentifier}) in ${projectId}. The user must sign in again to refresh the ID token.`);