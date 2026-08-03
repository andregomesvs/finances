import "server-only";

import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "./admin";

let firestore: Firestore | undefined;

export function getFirestoreDatabase(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseAdminApp());
    firestore.settings({ ignoreUndefinedProperties: true });
  }

  return firestore;
}
