export const authService = {
  // Sign up with email and password
  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Get ID token
  getIdToken: async () => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },

  // Auth state observer
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};