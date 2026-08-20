import { initializeApp } from "firebase/app";
import { browserSessionPersistence, getAuth, setPersistence } from "firebase/auth";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);

// 기본값(browserLocalPersistence)은 같은 브라우저의 모든 탭이 로그인 상태를 공유해,
// 한 탭에서 다른 계정으로 로그인하면 이미 열려 있던 다른 탭의 auth.currentUser까지
// 조용히 바뀐다. App.tsx가 세션 상태를 sessionStorage(탭 단위)에 캐싱하는 것과
// 맞춰 탭마다 독립된 로그인 세션을 쓰도록 세션 단위 persistence로 고정한다.
void setPersistence(auth, browserSessionPersistence);
