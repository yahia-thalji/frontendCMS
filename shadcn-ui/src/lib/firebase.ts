import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// إعدادات Firebase (يمكن استخدام مشروع تجريبي)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "import-system-demo.firebaseapp.com",
  projectId: "import-system-demo",
  storageBucket: "import-system-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة Firestore
export const db = getFirestore(app);

// تهيئة المصادقة
export const auth = getAuth(app);

// للتطوير المحلي - استخدام محاكي Firestore
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Firestore emulator already connected or not available');
  }
}

export default app;