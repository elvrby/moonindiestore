// src/libs/firebase/auth.ts
import { type User, GoogleAuthProvider, signInWithPopup, onAuthStateChanged as _onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { firebaseAuth, firebaseFirestore } from "./config";

/** -------------------- Types -------------------- */
export type CartItem = {
  productId: string; // simpan sebagai string agar konsisten (id number -> String(id))
  quantity: number; // minimal 1
};

export type UserDoc = {
  uid: string;
  email: string;
  username: string;
  roles: unknown | null;
  favorites: string[]; // daftar productId
  cart: CartItem[]; // daftar item keranjang
  orderIds: string[]; // daftar order id milik user
};

/** -------------------- Auth State -------------------- */
export function onAuthStateChanged(callback: (authUser: User | null) => void) {
  return _onAuthStateChanged(firebaseAuth, callback);
}

/** -------------------- Helpers -------------------- */
async function ensureUserDefaults(uid: string) {
  const userRef = doc(firebaseFirestore, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return; // kalau tidak ada, akan dibuat di signInWithGoogle

  const data = snap.data() || {};
  const patch: Partial<UserDoc> = {};

  if (!("favorites" in data)) patch.favorites = [];
  if (!("cart" in data)) patch.cart = [];
  if (!("orderIds" in data)) patch.orderIds = [];

  if (Object.keys(patch).length > 0) {
    await setDoc(userRef, patch, { merge: true });
  }
}

/** -------------------- Sign In / Out -------------------- */
export async function signInWithGoogle(): Promise<string | null> {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(firebaseAuth, provider);

    if (!result || !result.user) {
      throw new Error("Google sign in failed");
    }
    const user = result.user;
    const uid = user.uid;
    const email = user.email || "No email";
    const username = user.displayName || "No username";

    const userRef = doc(firebaseFirestore, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Buat dokumen user awal + field baru
      const initialData: UserDoc = {
        uid,
        email,
        username,
        roles: null, // roles tetap null awalnya
        favorites: [], // favorit awal kosong
        cart: [], // keranjang awal kosong
        orderIds: [], // daftar order id awal kosong
      };

      await setDoc(userRef, initialData);
    } else {
      // Pastikan field baru ada jika sebelumnya belum ada
      await ensureUserDefaults(uid);
    }

    return uid;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return null; // <- penting agar bukan undefined
  }
}

export async function signOutWithGoogle() {
  try {
    await firebaseAuth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}

/** -------------------- Roles -------------------- */
export async function getUserRoles(uid: string) {
  try {
    const userDoc = await getDoc(doc(firebaseFirestore, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as Partial<UserDoc>;
      return userData?.roles ?? null;
    } else {
      throw new Error("No such user!");
    }
  } catch (error) {
    console.error("Error getting user roles", error);
    return null;
  }
}

/** -------------------- Favorites (Product) -------------------- */
// Tambah product ke favorites (id disimpan sebagai string, aman walau sumbernya number)
export async function addProductToFavorites(uid: string, productId: string | number) {
  try {
    const userRef = doc(firebaseFirestore, "users", uid);
    await updateDoc(userRef, {
      favorites: arrayUnion(String(productId)),
    });
  } catch (error) {
    console.error("Error adding product to favorites", error);
  }
}

// Hapus product dari favorites
export async function removeProductFromFavorites(uid: string, productId: string | number) {
  try {
    const userRef = doc(firebaseFirestore, "users", uid);
    await updateDoc(userRef, {
      favorites: arrayRemove(String(productId)),
    });
  } catch (error) {
    console.error("Error removing product from favorites", error);
  }
}

// Ambil daftar favorites
export async function getFavoriteProductIds(uid: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(firebaseFirestore, "users", uid));
    if (!userDoc.exists()) return [];
    const data = userDoc.data() as Partial<UserDoc>;
    return Array.isArray(data.favorites) ? data.favorites : [];
  } catch (error) {
    console.error("Error getting favorite products", error);
    return [];
  }
}

/** -------------------- Cart (Keranjang) -------------------- */
// Ambil cart
export async function getCartItems(uid: string): Promise<CartItem[]> {
  try {
    const snap = await getDoc(doc(firebaseFirestore, "users", uid));
    if (!snap.exists()) return [];
    const data = snap.data() as Partial<UserDoc>;
    return Array.isArray(data.cart) ? (data.cart as CartItem[]) : [];
  } catch (error) {
    console.error("Error getting cart items", error);
    return [];
  }
}

// Set/replace cart sepenuhnya (opsional kalau kamu ingin set langsung)
export async function setCartItems(uid: string, items: CartItem[]) {
  try {
    const sanitized: CartItem[] = items.map((it) => ({
      productId: String(it.productId),
      quantity: Math.max(1, Number(it.quantity) || 1),
    }));
    await setDoc(doc(firebaseFirestore, "users", uid), { cart: sanitized }, { merge: true });
  } catch (error) {
    console.error("Error setting cart items", error);
  }
}

// Tambah ke cart (jika item sudah ada, quantity akan di-increment)
export async function addToCart(uid: string, item: CartItem) {
  try {
    const current = await getCartItems(uid);
    const productId = String(item.productId);
    const quantity = Math.max(1, Number(item.quantity) || 1);

    const idx = current.findIndex((c) => String(c.productId) === productId);
    if (idx >= 0) {
      current[idx] = {
        productId,
        quantity: current[idx].quantity + quantity,
      };
    } else {
      current.push({ productId, quantity });
    }

    await setCartItems(uid, current);
  } catch (error) {
    console.error("Error adding item to cart", error);
  }
}

// Update quantity item di cart (hapus jika quantity < 1)
export async function updateCartItemQuantity(uid: string, productId: string | number, quantity: number) {
  try {
    const current = await getCartItems(uid);
    const pid = String(productId);
    const idx = current.findIndex((c) => String(c.productId) === pid);

    if (idx < 0) return; // tidak ada item, diamkan

    if (quantity <= 0) {
      // hapus
      const next = current.filter((c) => String(c.productId) !== pid);
      await setCartItems(uid, next);
    } else {
      current[idx] = { productId: pid, quantity: Math.max(1, Math.floor(quantity)) };
      await setCartItems(uid, current);
    }
  } catch (error) {
    console.error("Error updating cart item quantity", error);
  }
}

// Hapus satu item dari cart
export async function removeFromCart(uid: string, productId: string | number) {
  try {
    const pid = String(productId);
    const current = await getCartItems(uid);
    const next = current.filter((c) => String(c.productId) !== pid);
    await setCartItems(uid, next);
  } catch (error) {
    console.error("Error removing item from cart", error);
  }
}

// 🔥 Hapus BANYAK item cart sekaligus (satu write → anti race-condition dibanding loop)
export async function removeManyFromCart(uid: string, productIds: Array<string | number>) {
  try {
    const ids = new Set(productIds.map(String));
    const current = await getCartItems(uid);
    const next = current.filter((c) => !ids.has(String(c.productId)));
    await setCartItems(uid, next);
  } catch (error) {
    console.error("Error removing many items from cart", error);
  }
}

// Kosongkan cart
export async function clearCart(uid: string) {
  try {
    await setDoc(doc(firebaseFirestore, "users", uid), { cart: [] }, { merge: true });
  } catch (error) {
    console.error("Error clearing cart", error);
  }
}

/** -------------------- Orders (Order IDs) -------------------- */
// Tambahkan orderId ke daftar user (mis. setelah checkout berhasil)
export async function addOrderId(uid: string, orderId: string | number) {
  try {
    const userRef = doc(firebaseFirestore, "users", uid);
    await updateDoc(userRef, {
      orderIds: arrayUnion(String(orderId)),
    });
  } catch (error) {
    console.error("Error adding orderId", error);
  }
}

// Ambil semua orderId milik user
export async function getOrderIds(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(firebaseFirestore, "users", uid));
    if (!snap.exists()) return [];
    const data = snap.data() as Partial<UserDoc>;
    return Array.isArray(data.orderIds) ? data.orderIds : [];
  } catch (error) {
    console.error("Error getting orderIds", error);
    return [];
  }
}
