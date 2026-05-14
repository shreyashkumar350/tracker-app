import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../firebase"

const provider = new GoogleAuthProvider()

export default function Auth() {

  const login = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <button onClick={login}>
      Sign in with Google
    </button>
  )
}