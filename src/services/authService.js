import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error("User profile not found. Contact the administrator.");
  }

  const userData = userDoc.data();

  if (!["driver", "security", "admin"].includes(userData.role)) {
    await signOut(auth);
    throw new Error("Invalid user role. Contact the administrator.");
  }

  return {
    uid: user.uid,
    email: user.email,
    role: userData.role,
    name: userData.name || user.email,
  };
};

export const logoutUser = async () => {
  await signOut(auth);
};
