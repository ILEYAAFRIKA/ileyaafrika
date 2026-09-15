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
import { INITIAL_BANK_SETTINGS, INITIAL_VERIFIED_LISTINGS } from '../data/nigerianData';
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
  isLoading: boolean;
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
    const stored = getStoredItem<PropertyListing[]>(STORAGE_KEYS.LISTINGS, []);
    if (stored && stored.length > 0) return stored;
    return INITIAL_VERIFIED_LISTINGS;
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
    // Safety timer: ensure loading barrier NEVER gets stuck indefinitely
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 1500);

    // Check current session on mount
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setCurrentUserState(null);
          setStoredItem(STORAGE_KEYS.CURRENT_USER, null);
          setAuthLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase auth session check notice:', err);
        setCurrentUserState(null);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, null);
        setAuthLoading(false);
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
        const email = (supaUser.email || '').trim().toLowerCase();
        const isMaster = email === MASTER_ADMIN_EMAIL.toLowerCase() || email === 'emmanuelolarinde53@gmail.com';
        
        // 1. Immediately execute a direct .select() query to the profiles table using authenticated user's id
        const { data: profileRecord, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();

        if (profileError) {
          console.warn('[AuthContext] Note on profiles table select:', profileError.message);
        }

        // Secondary fallback to users table or email query if profiles row doesn't exist yet
        let dbUser = profileRecord;
        if (!dbUser && email) {
          dbUser = await getUserFromSupabase(uid);
          if (!dbUser) {
            dbUser = await getUserFromSupabase(email);
          }
        }

        // 2. Determine Role
        let userRole: UserRole = 'guest';
        if (isMaster) {
          userRole = 'master_admin';
        } else if (adminEmails.some((a) => a.toLowerCase() === email)) {
          userRole = 'admin';
        } else if (profileRecord?.role) {
          userRole = profileRecord.role;
        } else if ((dbUser as any)?.role) {
          userRole = (dbUser as any).role;
        } else if (supaUser.user_metadata?.role) {
          userRole = supaUser.user_metadata.role;
        }

        // 3. Extract and Sanitize Name from profiles table (filtering out any legacy diagnostic mocks)
        const isCorruptedDiagnosticString = (val?: string | null): boolean => {
          if (!val || typeof val !== 'string') return false;
          const lower = val.toLowerCase();
          return lower.includes('diagnostic probe') || lower.includes('diagnostic.probe') || lower.includes('automated diagnostic') || lower.includes('probe (');
        };

        const rawProfileName =
          profileRecord?.full_name ||
          profileRecord?.fullName ||
          (profileRecord?.first_name
            ? `${profileRecord.first_name} ${profileRecord.last_name || ''}`.trim()
            : '') ||
          profileRecord?.name ||
          (dbUser as any)?.fullName ||
          (dbUser as any)?.full_name ||
          '';

        const rawMetaName =
          supaUser.user_metadata?.fullName ||
          supaUser.user_metadata?.full_name ||
          (supaUser.user_metadata?.first_name
            ? `${supaUser.user_metadata.first_name} ${supaUser.user_metadata.last_name || ''}`.trim()
            : '') ||
          supaUser.user_metadata?.name ||
          '';

        let actualName = '';
        if (rawProfileName && !isCorruptedDiagnosticString(rawProfileName)) {
          actualName = rawProfileName;
        } else if (rawMetaName && !isCorruptedDiagnosticString(rawMetaName)) {
          actualName = rawMetaName;
        } else if (isMaster) {
          actualName = 'Emmanuel Olarinde';
        } else if (email) {
          const emailPrefix = email.split('@')[0];
          actualName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        } else {
          actualName = 'Valued User';
        }

        // If the database profiles table contained the corrupted diagnostic probe string, self-heal it immediately
        if (profileRecord && isCorruptedDiagnosticString(profileRecord.full_name)) {
          console.log('[AuthContext] Healing corrupted diagnostic probe name in profiles table for user:', uid, '->', actualName);
          try {
            await supabase
              .from('profiles')
              .update({ full_name: actualName, updated_at: new Date().toISOString() })
              .eq('id', uid);
          } catch (e) {
            console.warn('Profile heal update notice:', e);
          }
        }

        // If profiles table has no record yet, create one for the authenticated user
        if (!profileRecord && supaUser) {
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: uid,
                email: email,
                full_name: actualName,
                role: userRole,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' });
          } catch (e) {
            console.warn('Profile auto-create notice:', e);
          }
        }

        // 4. Update React user state with the actual name retrieved from the profiles table
        const sessionUser: UserSession = {
          uid,
          email,
          fullName: actualName,
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
        console.error("Error fetching user profile from Supabase:", error);
      } finally {
        setAuthLoading(false);
      }
    }

    return () => {
      clearTimeout(safetyTimer);
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

    const isMaster = (newUser?.email || '').toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const isAdmin = adminEmails.some((a) => a.toLowerCase() === (newUser?.email || '').toLowerCase());
    const finalRole: UserRole = isMaster ? 'master_admin' : (isAdmin ? 'admin' : (newUser?.role || 'guest'));

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
      rejectionReason: reason || 'Does not meet minimum Ileya Afrika quality standards.'
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

  // Deprecated: is_booked is replaced by date-based bookings table availability
  const toggleBookingStatus = (_id: string) => {};

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
        isLoading: authLoading,
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

// Aliases for authentication context consumers
export const useAuth = () => {
  const app = useApp();
  return {
    ...app,
    user: app.currentUser,
    session: app.currentUser,
    isAuthenticated: !!app.currentUser?.isAuthenticated,
    isLoading: app.isLoading,
  };
};

export const AuthContext = AppContext;
export const AuthProvider = AppProvider;
