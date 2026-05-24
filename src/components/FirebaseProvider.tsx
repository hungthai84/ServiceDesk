import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  increment,
  updateDoc
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { BlogPost } from "../types";
import { INITIAL_LISTINGS } from "../data";

interface FirebaseContextType {
  user: FirebaseUser | null;
  loading: boolean;
  listings: BlogPost[];
  likedIds: string[];
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  addNewBlogPost: (newPost: Omit<BlogPost, "authorId" | "author">) => Promise<void>;
  incrementViews: (postId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<BlogPost[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // 1. Manage Authentication State & User Session Saving
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Automatically ensure user profile is mirrored to Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const userPayload = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "Anonymous Reader",
          photoURL: currentUser.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, userPayload, { merge: true });
        } catch (error) {
          console.warn("User index sync warning: User profile write restricted by rules.");
        }
      } else {
        setLikedIds([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time sync for Posts (with automatic database seeding)
  useEffect(() => {
    const postsRef = collection(db, "posts");

    const unsubscribe = onSnapshot(
      postsRef,
      async (snapshot) => {
        const postsList: BlogPost[] = [];
        snapshot.forEach((docSnap) => {
          postsList.push(docSnap.data() as BlogPost);
        });

        // Seed default listings if Firestore collection is blank
        if (postsList.length === 0 && snapshot.metadata.fromCache === false) {
          try {
            console.log("Seeding Firestore with default design articles...");
            const batch = writeBatch(db);
            INITIAL_LISTINGS.forEach((story) => {
              // Map mock posts to a default system admin author account tag
              const seedDocRef = doc(db, "posts", story.id);
              batch.set(seedDocRef, {
                ...story,
                authorId: "system_genesis_admin"
              });
            });
            await batch.commit();
          } catch (seedError) {
            console.error("Failed to seed default database records: ", seedError);
          }
        } else {
          // Sort posts by date or ID index to preserve elegant look
          setListings(postsList);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "posts");
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Sync Liked IDs for the Logged-In User
  useEffect(() => {
    if (!user) {
      setLikedIds([]);
      return;
    }

    const userLikesRef = collection(db, "users", user.uid, "likes");
    const unsubscribe = onSnapshot(
      userLikesRef,
      (snapshot) => {
        const likes: string[] = [];
        snapshot.forEach((docSnap) => {
          likes.push(docSnap.data().postId);
        });
        setLikedIds(likes);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/likes`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS SCHEMA ---

  // Gmail / Google Account Sign-In Method
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Recommending Custom Select Account popup behavior
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Gmail popup sign-in declined", error);
      throw error;
    }
  };

  // Sign out
  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failure", error);
      throw error;
    }
  };

  // Like & Target Increment System
  const toggleLikePost = async (postId: string) => {
    if (!user) {
      throw new Error("Vui lòng đăng nhập bằng Gmail để lưu bài tập san yêu thích.");
    }

    const likeId = `like_${postId}`;
    const userLikeRef = doc(db, "users", user.uid, "likes", likeId);
    const postRef = doc(db, "posts", postId);
    const isCurrentlyLiked = likedIds.includes(postId);

    try {
      if (isCurrentlyLiked) {
        // 1. Delete like tracking doc (subcollection)
        await deleteDoc(userLikeRef);
        // 2. Decrement post likes counter (with custom transactional adjustment)
        await updateDoc(postRef, {
          likes: increment(-1)
        });
      } else {
        // 1. Set like tracking doc (subcollection)
        await setDoc(userLikeRef, {
          id: likeId,
          userId: user.uid,
          postId: postId,
          createdAt: new Date().toISOString()
        });
        // 2. Increment post likes counter
        await updateDoc(postRef, {
          likes: increment(1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/likes`);
    }
  };

  // Add new editorial post written with Gemini or Editor tools
  const addNewBlogPost = async (newPost: Omit<BlogPost, "authorId" | "author">) => {
    if (!user) {
      throw new Error("Bạn phải đăng nhập để xuất bản chuyên khảo tập san.");
    }

    const postId = newPost.id;
    const postRef = doc(db, "posts", postId);

    // Build comprehensive validated BlogPost entity payload
    const finalPostPayload: BlogPost & { authorId: string } = {
      ...newPost,
      authorId: user.uid,
      author: {
        name: user.displayName || "Nhà Biên Tập Trẻ",
        avatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
        rating: 5.0,
        verified: true,
        role: "Tác giả biên tập"
      }
    };

    try {
      await setDoc(postRef, finalPostPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
    }
  };

  // Increment dynamic views counter securely
  const incrementViews = async (postId: string) => {
    const postRef = doc(db, "posts", postId);
    try {
      await updateDoc(postRef, {
        views: increment(1)
      });
    } catch (error) {
      // Views updates are non-blocking UI metrics, but logged
      console.warn("Views update restricted: ", error);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        listings,
        likedIds,
        loginWithGoogle,
        logoutUser,
        toggleLikePost,
        addNewBlogPost,
        incrementViews
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used inside a FirebaseProvider wrapper");
  }
  return context;
};
