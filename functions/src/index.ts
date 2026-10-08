import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const db = getFirestore();
const region = "us-central1";

export const initializeBuyerWallet = onDocumentCreated(
  { document: "users/{userId}", region },
  async (event) => {
    const userId = event.params.userId;
    const walletRef = db.doc(`wallets/${userId}`);

    await db.runTransaction(async (transaction) => {
      const wallet = await transaction.get(walletRef);
      if (wallet.exists) return;

      transaction.create(walletRef, {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        currency: "KGS",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  },
);

export const aggregateSellerReview = onDocumentCreated(
  { document: "reviews/{orderId}", region },
  async (event) => {
    const review = event.data?.data();
    if (!review || typeof review.sellerId !== "string" || typeof review.rating !== "number") return;

    const sellerId = review.sellerId;
    const profileRef = db.doc(`publicProfiles/${sellerId}`);
    const eventRef = db.doc(`reviewAggregateEvents/${event.params.orderId}`);

    await db.runTransaction(async (transaction) => {
      const [profileSnapshot, eventSnapshot] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(eventRef),
      ]);
      if (eventSnapshot.exists || !profileSnapshot.exists) return;

      const profile = profileSnapshot.data();
      const previousCount = Number(profile?.reviewCount ?? 0);
      const previousRating = Number(profile?.rating ?? 0);
      const reviewCount = previousCount + 1;
      const rating = Number((((previousRating * previousCount) + review.rating) / reviewCount).toFixed(2));

      transaction.update(profileRef, {
        rating,
        reviewCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(eventRef, {
        orderId: event.params.orderId,
        sellerId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  },
);

export const decideSellerApplication = onCall({ region }, async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Only administrators can review seller applications.");
  }

  const userId = request.data?.userId;
  const decision = request.data?.decision;
  if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(userId)
    || !["APPROVED", "REJECTED"].includes(decision)) {
    throw new HttpsError("invalid-argument", "Provide a userId and APPROVED or REJECTED decision.");
  }

  const applicationRef = db.doc(`sellerApplications/${userId}`);
  const userRef = db.doc(`users/${userId}`);
  const publicProfileRef = db.doc(`publicProfiles/${userId}`);
  const auditRef = db.collection("auditLogs").doc(`seller_application_${userId}_${decision.toLowerCase()}`);

  await db.runTransaction(async (transaction) => {
    const [applicationSnapshot, userSnapshot, publicProfileSnapshot] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(userRef),
      transaction.get(publicProfileRef),
    ]);

    if (!applicationSnapshot.exists || !userSnapshot.exists) {
      throw new HttpsError("not-found", "Seller application or user was not found.");
    }

    const application = applicationSnapshot.data();
    if (application?.status !== "PENDING" && application?.status !== decision) {
      throw new HttpsError("failed-precondition", "This application has already been reviewed.");
    }

    if (application?.status === "PENDING") {
      transaction.update(applicationRef, {
        status: decision,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: request.auth?.uid,
      });

      if (decision === "APPROVED") {
        transaction.update(userRef, { role: "SELLER", updatedAt: FieldValue.serverTimestamp() });
      }

      transaction.create(auditRef, {
        action: `SELLER_APPLICATION_${decision}`,
        actorId: request.auth?.uid,
        targetUserId: userId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    if (decision === "APPROVED" && !publicProfileSnapshot.exists) {
      const application = applicationSnapshot.data();
      transaction.create(publicProfileRef, {
        uid: userId,
        storeName: application?.storeName,
        description: application?.description,
        rating: 0,
        salesCount: 0,
        successRate: 0,
        verified: false,
        status: "ACTIVE",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });

  if (decision === "APPROVED") {
    const auth = getAuth();
    const userRecord = await auth.getUser(userId);
    await auth.setCustomUserClaims(userId, {
      ...userRecord.customClaims,
      role: "SELLER",
      sellerApproved: true,
    });
  }

  return { userId, status: decision };
});
