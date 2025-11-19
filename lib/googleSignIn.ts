import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export async function googleSignInWithIdToken() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  const user = result.user;
  const idToken = await user.getIdToken();

  return { firebaseUser: user, idToken };
}
