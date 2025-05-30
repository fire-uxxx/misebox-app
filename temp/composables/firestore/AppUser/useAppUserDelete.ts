import { doc, deleteDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { useFirestore } from "vuefire";
import { useFirestoreManager } from "@fireux/core";

export function useAppUserDelete() {
  const { useRuntimeConfig } = require("#imports");
  const {
    public: { tenantId },
  } = useRuntimeConfig();

  const db = useFirestore();
  const { waitForCurrentUser } = useFirestoreManager();

  async function deleteAppUserProfile(): Promise<void> {
    const user = await waitForCurrentUser();
    const uid = user.uid;

    try {
      // 🔥 Delete app-specific profile
      const profileRef = doc(db, `users/${uid}/profiles`, tenantId);
      await deleteDoc(profileRef);
      console.log(`✅ Deleted profile for tenant ${tenantId}`);

      // 🗂️ Remove app ID from core user (userOf array)
      const coreUserRef = doc(db, "users", uid);
      await updateDoc(coreUserRef, {
        userOf: arrayRemove(tenantId),
      });
      console.log(`✅ Removed tenant ID ${tenantId} from core user ${uid}`);

      // 🔒 Remove user from app's admin list (admin_ids on App model)
      const appRef = doc(db, "apps", tenantId);
      await updateDoc(appRef, {
        admin_ids: arrayRemove(uid),
      });
    } catch (error) {
      console.error("❌ Error deleting app user profile:", error);
    }
  }

  return { deleteAppUserProfile };
}
