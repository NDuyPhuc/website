import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  type DocumentData,
  type Unsubscribe
} from 'firebase/firestore';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  fitnessGoal?: string;
  membershipPlan?: string;
  preferredTime?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: any;
}

/**
 * Creates or updates a user profile in Firestore
 */
export async function syncUserProfile(userId: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const newUser: UserProfile = {
      userId,
      email: data.email || '',
      displayName: data.displayName || 'Athlete',
      fitnessGoal: 'Lose weight & Build muscle',
      membershipPlan: 'Essential',
      preferredTime: 'Morning',
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, newUser);
  } else {
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Listener for user profile
 */
export function subscribeToUserProfile(userId: string, callback: (data: UserProfile | null) => void): Unsubscribe {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProfile);
    } else {
      callback(null);
    }
  });
}

/**
 * Listener for live announcements
 */
export function subscribeToAnnouncements(callback: (data: Announcement[]) => void): Unsubscribe {
  const announcementsRef = collection(db, 'liveAnnouncements');
  const q = query(announcementsRef, orderBy('createdAt', 'desc'), limit(5));
  
  return onSnapshot(q, (snapshot) => {
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Announcement));
    callback(announcements);
  });
}

/**
 * Demo helper to add an announcement
 */
export async function addAnnouncement(title: string, message: string, type: 'info' | 'warning' | 'success' = 'info') {
  const announcementsRef = doc(collection(db, 'liveAnnouncements'));
  await setDoc(announcementsRef, {
    title,
    message,
    type,
    createdAt: serverTimestamp(),
  });
}
