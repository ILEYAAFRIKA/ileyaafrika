import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  UserRole,
  UserSession,
  RegisteredUser,
  PropertyListing,
  ListingStatus,
  BankPayoutDetails,
  GuestBooking,
} from '../types';
import { INITIAL_BANK_SETTINGS } from '../data/nigerianData';
import {
  syncUserToSupabase,
  getUserFromSupabase,
  saveListingToSupabase,
  updateListingInSupabase,
  deleteListingFromSupabase,
  saveBookingToSupabase,
  saveAdminEmailToSupabase,
  deleteAdminEmailFromSupabase,
  savePayoutDetailsToSupabase,
  getPayoutDetailsFromSupabase,
  subscribeToListings,
  subscribeToBookings,
  subscribeToAdminEmails,
  subscribeToPayoutSettings
} from '../lib/supabaseService';

// LocalStorage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'ileya_current_user',
  USERS: 'ileya_users',
  LISTINGS: 'ileya_listings',
  ADMIN_EMAILS: 'ileya_admin_emails',
  BOOKINGS: 'ileya_my_bookings',
  BANK_DETAILS: 'ileya_bank_details',
};

export const MASTER_ADMIN_EMAIL = 'emmanuelolarinde53@gmail.com';

interface AppContextType {
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  authLoading: boolean;
  isAuthLoading: boolean;
  users: RegisteredUser[];
  setUsers: React.Dispatch<React.SetStateAction<RegisteredUser[]>>;
  registerUser: (newUser: RegisteredUser) => void;
  loginUser: (email: string, fullName?: string, role?: UserRole) => UserSession;
  logoutUser: () => Promise<void>;
  signOutUser: () => Promise<void>;
  listings: PropertyListing[];
  setListings: React.Dispatch<React.SetStateAction<PropertyListing[]>>;
  addListing: (newListing: PropertyListing) => void;
  updateListing: (id: string, updates: Partial<PropertyListing>) => void;
  approveListing: (id: string, inspectionNotes?: string) => void;
  rejectListing: (id: string, reason: string) => void;
  deleteListing: (id: string) => void;
  toggleBookingStatus: (id: string) => void;
  updateListingStatus: (id: string, status: ListingStatus) => void;
  adminEmails: string[];
  addAdmin: (email: string) => void;
  revokeAdmin: (email: string) => void;
  myBookings: GuestBooking[];
  addBooking: (booking: GuestBooking) => void;
  bankDetails: BankPayoutDetails;
  updateBankDetails: (details: BankPayoutDetails) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving to localStorage key "${key}":`, err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current User state
  const [currentUser, setCurrentUserState] = useState<UserSession | null>(() => {
    return getStoredItem<UserSession | null>(STORAGE_KEYS.CURRENT_USER, null);
  });

  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // 2. Users state
  const [users, setUsersState] = useState<RegisteredUser[]>(() => {
    return getStoredItem<RegisteredUser[]>(STORAGE_KEYS.USERS, []);
  });

  // 3. Listings state
  const [listings, setListingsState] = useState<PropertyListing[]>(() => {
    return getStoredItem<PropertyListing[]>(STORAGE_KEYS.LISTINGS, []);
  });

  // 4. Admin Emails state
  const [adminEmails, setAdminEmailsState] = useState<string[]>(() => {
    const stored = getStoredItem<string[]>(STORAGE_KEYS.ADMIN_EMAILS, []);
    if (!stored.includes(MASTER_ADMIN_EMAIL)) {
      return [MASTER_ADMIN_EMAIL, ...stored];
    }
    return stored;
  });

  // 5. My Bookings state
  const [myBookings, setMyBookingsState] = useState<GuestBooking[]>(() => {
    return getStoredItem<GuestBooking[]>(STORAGE_KEYS.BOOKINGS, []);
  });

  // 6. Bank Details state
  const [bankDetails, setBankDetailsState] = useState<BankPayoutDetails>(() => {
    return getStoredItem<BankPayoutDetails>(STORAGE_KEYS.BANK_DETAILS, INITIAL_BANK_SETTINGS);
  });

  // Synchronize localStorage
  useEffect(() => {
    setStoredItem(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.LISTINGS, listings);
  }, [listings]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.ADMIN_EMAILS, adminEmails);
  }, [adminEmails]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.BOOKINGS, myBookings);
  }, [myBookings]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.BANK_DETAILS, bankDetails);
  }, [bankDetails]);

  // Real-time Supabase Auth listener & loading barrier
  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setCurrentUserState(null);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, null);
        setAuthLoading(false);
      }
    });

    async function handleUserSession(supaUser: any) {
      try {
        const uid = supaUser.id;
        const email = supaUser.email || '';
        const isMaster = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || email.toLowerCase() === 'emmanuelolarinde53@gmail.com';
        
        let dbUser = await getUserFromSupabase(uid);
        if (!dbUser && email) {
          dbUser = await getUserFromSupabase(email);
        }

        let userRole: UserRole = 'guest';
        if (isMaster) {
          userRole = 'master_admin';
        } else if (adminEmails.some((a) => a.toLowerCase() === email.toLowerCase())) {
          userRole = 'admin';
        } else if (dbUser?.role) {
          userRole = dbUser.role;
        } else if (supaUser.user_metadata?.role) {
          userRole = supaUser.user_metadata.role;
        }

        const determinedFullName = dbUser?.fullName || (dbUser as any)?.full_name || supaUser.user_metadata?.fullName || supaUser.user_metadata?.full_name || (isMaster ? 'Emmanuel Olarinde (Master Admin)' : (email.split('@')[0] || 'User'));

        const sessionUser: UserSession = {
          uid,
          email,
          fullName: determinedFullName,
          role: userRole,
          isMasterAdmin: isMaster,
          isAuthenticated: true,
          emailVerified: supaUser.email_confirmed_at ? true : false,
        };

        setCurrentUserState(sessionUser);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, sessionUser);

        // If user is a host, fetch their stored bank payout details from Supabase
        if (email) {
          getPayoutDetailsFromSupabase(email).then((savedBank) => {
            if (savedBank) {
              setBankDetailsState(savedBank);
              setStoredItem(STORAGE_KEYS.BANK_DETAILS, savedBank);
            }
          }).catch((e) => console.warn('Supabase payout fetch warning:', e));
        }
      } catch (error) {
        console.error("Error fetching user role from Supabase:", error);
      } finally {
        setAuthLoading(false);
      }
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Real-time Supabase Database Subscriptions
  useEffect(() => {
    const unsubListings = subscribeToListings((supabaseListings) => {
      if (supabaseListings && supabaseListings.length > 0) {
        setListingsState(supabaseListings);
      }
    });

    const unsubBookings = subscribeToBookings((supabaseBookings) => {
      if (supabaseBookings && supabaseBookings.length > 0) {
        setMyBookingsState(supabaseBookings);
      }
    });

    const unsubAdmins = subscribeToAdminEmails((supabaseAdmins) => {
      if (supabaseAdmins && supabaseAdmins.length > 0) {
        const combined = Array.from(new Set([MASTER_ADMIN_EMAIL, ...supabaseAdmins]));
        setAdminEmailsState(combined);
      }
    });

    const unsubPayouts = subscribeToPayoutSettings((payoutMap) => {
      if (currentUser?.email) {
        const myPayout = payoutMap[currentUser.email.toLowerCase()];
        if (myPayout) {
          setBankDetailsState(myPayout);
        }
      }
    });

    return () => {
      unsubListings();
      unsubBookings();
      unsubAdmins();
      unsubPayouts();
    };
  }, [currentUser?.email]);

  const setCurrentUser = (user: UserSession | null) => {
    setCurrentUserState(user);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, user);
  };

  const registerUser = (newUser: RegisteredUser) => {
    setUsersState((prevUsers) => {
      const existingIdx = prevUsers.findIndex(
        (u) => u.email.toLowerCase() === newUser.email.toLowerCase()
      );
      if (existingIdx >= 0) {
        const updated = [...prevUsers];
        updated[existingIdx] = { ...updated[existingIdx], ...newUser };
        return updated;
      }
      return [newUser, ...prevUsers];
    });

    syncUserToSupabase(newUser);

    const isMaster = newUser.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const isAdmin = adminEmails.some((a) => a.toLowerCase() === newUser.email.toLowerCase());
    const finalRole: UserRole = isMaster ? 'master_admin' : (isAdmin ? 'admin' : newUser.role);

    const newSession: UserSession = {
      uid: newUser.uid || newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: finalRole,
      isMasterAdmin: isMaster,
      isAuthenticated: true,
    };
    setCurrentUser(newSession);
  };

  const loginUser = (email: string, fullName?: string, role?: UserRole): UserSession => {
    const trimmedEmail = email.trim();
    const isMaster = trimmedEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const isEmailAdmin = adminEmails.some(
      (a) => a.toLowerCase() === trimmedEmail.toLowerCase()
    );

    const existingUser = users.find(
      (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    const determinedRole: UserRole = isMaster 
      ? 'master_admin' 
      : (isEmailAdmin ? 'admin' : (role || existingUser?.role || 'guest'));
      
    const determinedName =
      fullName ||
      existingUser?.fullName ||
      (isMaster ? 'Emmanuel Olarinde (Master Admin)' : isEmailAdmin ? 'Operations Admin' : trimmedEmail.split('@')[0]);

    const session: UserSession = {
      fullName: determinedName,
      email: trimmedEmail,
      role: determinedRole,
      isMasterAdmin: isMaster,
      isAuthenticated: true,
    };

    setCurrentUser(session);
    return session;
  };

  const signOutUser = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out of Supabase Auth:', err);
    } finally {
      setCurrentUser(null);
      setStoredItem(STORAGE_KEYS.CURRENT_USER, null);
    }
  };

  const logoutUser = async (): Promise<void> => {
    await signOutUser();
  };

  const addListing = (newListing: PropertyListing) => {
    const photoArray = newListing.photos || newListing.images || [];
    const normalizedListing: PropertyListing = {
      ...newListing,
      photos: photoArray,
      images: photoArray,
      status: newListing.status || 'pending',
      isPhysicallyVerified: newListing.isPhysicallyVerified ?? false,
      isBooked: newListing.isBooked ?? false,
      createdAt: newListing.createdAt || new Date().toISOString().split('T')[0],
    };

    setListingsState((prev) => [normalizedListing, ...prev.filter((l) => l.id !== normalizedListing.id)]);
    saveListingToSupabase(normalizedListing);
  };

  const updateListing = (id: string, updates: Partial<PropertyListing>) => {
    setListingsState((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.photos && !updates.images) updated.images = updates.photos;
          if (updates.images && !updates.photos) updated.photos = updates.images;
          return updated;
        }
        return item;
      })
    );
    updateListingInSupabase(id, updates);
  };

  const approveListing = (id: string, inspectionNotes?: string) => {
    const updates: Partial<PropertyListing> = {
      status: 'approved',
      isPhysicallyVerified: true,
      verificationNotes: inspectionNotes || 'Passed physical inspection for power, water, and security.'
    };

    setListingsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    updateListingInSupabase(id, updates);
  };

  const rejectListing = (id: string, reason: string) => {
    const updates: Partial<PropertyListing> = {
      status: 'rejected',
      rejectionReason: reason || 'Does not meet minimum Ileya quality standards.'
    };

    setListingsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    updateListingInSupabase(id, updates);
  };

  const deleteListing = (id: string) => {
    setListingsState((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      setStoredItem(STORAGE_KEYS.LISTINGS, updated);
      return updated;
    });
    deleteListingFromSupabase(id);
  };

  const toggleBookingStatus = (id: string) => {
    const target = listings.find((l) => l.id === id);
    if (!target) return;
    const newBookedStatus = !target.isBooked;

    setListingsState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBooked: newBookedStatus } : item
      )
    );
    updateListingInSupabase(id, { isBooked: newBookedStatus });
  };

  const updateListingStatus = (id: string, status: ListingStatus) => {
    const isApproved = status === 'approved_live' || status === 'approved';
    const updates: Partial<PropertyListing> = {
      status,
      isPhysicallyVerified: isApproved ? true : undefined,
    };

    setListingsState((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status,
            isPhysicallyVerified: isApproved ? true : item.isPhysicallyVerified,
          };
        }
        return item;
      })
    );
    updateListingInSupabase(id, updates);
  };

  const addAdmin = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!adminEmails.some((a) => a.toLowerCase() === trimmed)) {
      setAdminEmailsState((prev) => [...prev, email.trim()]);
      saveAdminEmailToSupabase(trimmed);
    }
  };

  const revokeAdmin = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed === MASTER_ADMIN_EMAIL.toLowerCase()) return;
    setAdminEmailsState((prev) =>
      prev.filter((a) => a.toLowerCase() !== trimmed)
    );
    deleteAdminEmailFromSupabase(trimmed);
  };

  const addBooking = (booking: GuestBooking) => {
    setMyBookingsState((prev) => {
      const alreadyExists = prev.some(
        (b) =>
          b.id === booking.id ||
          (booking.paymentReference && b.paymentReference === booking.paymentReference)
      );
      if (alreadyExists) {
        return prev;
      }
      return [booking, ...prev];
    });
    saveBookingToSupabase(booking);
  };

  const updateBankDetails = (details: BankPayoutDetails) => {
    setBankDetailsState(details);
    setStoredItem(STORAGE_KEYS.BANK_DETAILS, details);
    
    // Also update any listings owned by this host in state
    if (currentUser?.email) {
      setListingsState((prev) =>
        prev.map((l) =>
          l.hostEmail?.toLowerCase() === currentUser.email.toLowerCase()
            ? { ...l, hostBankDetails: details }
            : l
        )
      );
    }
    
    savePayoutDetailsToSupabase(details, currentUser?.email);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        isAuthLoading: authLoading,
        users,
        setUsers: setUsersState,
        registerUser,
        loginUser,
        logoutUser,
        signOutUser,
        listings,
        setListings: setListingsState,
        addListing,
        updateListing,
        approveListing,
        rejectListing,
        deleteListing,
        toggleBookingStatus,
        updateListingStatus,
        adminEmails,
        addAdmin,
        revokeAdmin,
        myBookings,
        addBooking,
        bankDetails,
        updateBankDetails,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
