import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Camera,
  Upload,
  Phone,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Check,
  Loader2,
  PlusCircle,
  Clock,
  Eye,
  SlidersHorizontal,
  Landmark,
  CreditCard,
  Edit3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveListingToSupabase, getUserFromSupabase, savePayoutDetailsToSupabase, getPayoutDetailsFromSupabase } from '../../lib/supabaseService';
import { PropertyListing, PropertyType, UserSession, BankPayoutDetails, ListingStatus } from '../../types';
import {
  NIGERIAN_STATES,
  NIGERIAN_STATE_AREAS,
  PROPERTY_TYPES,
  DEFAULT_AMENITIES,
  INITIAL_BANK_SETTINGS,
  NIGERIAN_BANKS
} from '../../data/nigerianData';

interface HostDashboardProps {
  session?: UserSession | null;
  listings?: PropertyListing[];
  bankDetails?: BankPayoutDetails;
  onLogout?: () => void;
  onAddNewListing?: (listing: PropertyListing) => void;
  onDeleteListing?: (id: string) => void;
  onSaveBankDetails?: (details: BankPayoutDetails) => void;
}

interface ImageItem {
  id: string;
  url: string;
  file: File;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  session,
  listings = [],
  bankDetails: initialBankDetails,
  onAddNewListing,
  onDeleteListing,
  onSaveBankDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'new-listing'>('listings');
  const [filterStatus, setFilterStatus] = useState<'all' | ListingStatus>('all');
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);

  // Host Display Name state
  const [hostDisplayName, setHostDisplayName] = useState<string>(
    session?.fullName || 'Valued Host'
  );

  // Live Bank Details state
  const [activeBankDetails, setActiveBankDetails] = useState<BankPayoutDetails>(
    initialBankDetails || INITIAL_BANK_SETTINGS
  );
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editBankName, setEditBankName] = useState(activeBankDetails.bankName);
  const [editAccountNumber, setEditAccountNumber] = useState(activeBankDetails.accountNumber);
  const [editAccountName, setEditAccountName] = useState(activeBankDetails.accountName);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);
  const [bankErrorMsg, setBankErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session?.fullName) {
      setHostDisplayName(session.fullName);
    }

    const fetchHostData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const metaName = user.user_metadata?.fullName || user.user_metadata?.full_name;
          if (metaName) {
            setHostDisplayName(metaName);
          }
          const identifier = user.id || user.email || session?.email || '';
          if (identifier) {
            const dbUser = await getUserFromSupabase(identifier);
            if (dbUser?.fullName) {
              setHostDisplayName(dbUser.fullName);
            }
          }
          const email = user.email || session?.email;
          if (email) {
            const dbBank = await getPayoutDetailsFromSupabase(email);
            if (dbBank) {
              setActiveBankDetails(dbBank);
              setEditBankName(dbBank.bankName);
              setEditAccountNumber(dbBank.accountNumber);
              setEditAccountName(dbBank.accountName);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching host session details in HostDashboard:', err);
      }
    };
    fetchHostData();
  }, [session]);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankErrorMsg(null);

    if (!editBankName) {
      setBankErrorMsg('Please select your Nigerian bank.');
      return;
    }
    if (editAccountNumber.length !== 10) {
      setBankErrorMsg('Nigerian NUBAN account number must be exactly 10 digits.');
      return;
    }
    if (!editAccountName.trim()) {
      setBankErrorMsg('Please provide the registered bank account name.');
      return;
    }

    setIsSavingBank(true);
    const updated: BankPayoutDetails = {
      bankName: editBankName,
      accountNumber: editAccountNumber,
      accountName: editAccountName.trim().toUpperCase(),
      isVerified: true,
    };

    try {
      const email = session?.email;
      await savePayoutDetailsToSupabase(updated, email);
      setActiveBankDetails(updated);
      if (onSaveBankDetails) {
        onSaveBankDetails(updated);
      }
      setBankSaveSuccess(true);
      setTimeout(() => {
        setBankSaveSuccess(false);
        setShowEditBankModal(false);
      }, 1200);
    } catch (err: any) {
      setBankErrorMsg(err?.message || 'Failed to save bank details.');
    } finally {
      setIsSavingBank(false);
    }
  };

  // Form State for New Listing Creation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Entire Apartment');
  const [pricePerDay, setPricePerDay] = useState<string>('');
  const [state, setState] = useState<string>('Lagos');
  const [cityArea, setCityArea] = useState<string>(
    NIGERIAN_STATE_AREAS['Lagos']?.[0] || 'Lekki Phase 1'
  );
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24/7 Power / Generator / Solar',
    'High-Speed WiFi',
    'Air Conditioning (AC)',
    'Gated Security & CCTV'
  ]);

  // Raw File objects state for Cloudinary direct upload
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [hostWhatsApp, setHostWhatsApp] = useState('+234 ');
  
  // Loading and Error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdListingData, setCreatedListingData] = useState<PropertyListing | null>(null);

  // Handle State Change
  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    const availableAreas = NIGERIAN_STATE_AREAS[selectedState] || [];
    if (availableAreas.length > 0) {
      setCityArea(availableAreas[0]);
    } else {
      setCityArea('Central Area');
    }
  };

  // Toggle amenities
  const handleToggleAmenity = (amenityLabel: string) => {
    if (selectedAmenities.includes(amenityLabel)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenityLabel));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityLabel]);
    }
  };

  // Handle File Selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);

    const newItems: ImageItem[] = newFiles.map((file: File) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setImageItems((prev) => [...prev, ...newItems]);
    setUploadError('');
    e.target.value = '';
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    const itemToRemove = imageItems[index];
    if (itemToRemove?.file) {
      setImageFiles((prev) => prev.filter((f) => f !== itemToRemove.file));
      URL.revokeObjectURL(itemToRemove.url);
    }
    setImageItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset form fields
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPropertyType('Entire Apartment');
    setPricePerDay('');
    setState('Lagos');
    setCityArea(NIGERIAN_STATE_AREAS['Lagos']?.[0] || 'Lekki Phase 1');
    setStreetAddress('');
    setSelectedAmenities([
      '24/7 Power / Generator / Solar',
      'High-Speed WiFi',
      'Air Conditioning (AC)',
      'Gated Security & CCTV'
    ]);
    imageItems.forEach((item) => URL.revokeObjectURL(item.url));
    setImageFiles([]);
    setImageItems([]);
    setHostWhatsApp('+234 ');
    setIsSubmitting(false);
    setUploadError('');
  };

  /**
   * Complete, bulletproof Supabase listing submission handler
   */
  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError('');

    try {
      // 1. Get the current authenticated Supabase user
      let currentAuthUser: any = null;
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (!authError && authData?.user) {
          currentAuthUser = authData.user;
        }
      } catch (authErr) {
        console.warn('supabase.auth.getUser check:', authErr);
      }

      const hostUserId = currentAuthUser?.id || session?.uid || 'host-user';
      const hostEmailAddress = currentAuthUser?.email || session?.email || 'host@ileya.ng';

      if (!hostUserId && !session?.isAuthenticated) {
        throw new Error('You must be logged in as a host to submit a listing.');
      }

      // Validate inputs
      const numericPrice = parseFloat(pricePerDay.replace(/[^0-9.]/g, '')) || 0;
      if (!title.trim()) {
        throw new Error('Please enter a valid property title.');
      }
      if (!numericPrice || numericPrice < 5000) {
        throw new Error('Please specify a valid nightly price in ₦ (minimum ₦5,000).');
      }
      if (!cityArea.trim() || !streetAddress.trim()) {
        throw new Error('Please provide both the City/Area and the Street Address.');
      }

      // 2. Validate that images are selected
      if ((!imageFiles || imageFiles.length === 0) && (!imageItems || imageItems.length === 0)) {
        throw new Error('Please select at least one image for your listing.');
      }

      // 3. Upload images to Supabase storage bucket ('listing-images')
      const imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `listings/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.warn('Supabase storage upload error:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }

          // Get public URL for the uploaded image
          const { data: publicUrlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            imageUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      if (imageUrls.length === 0) {
        imageUrls.push('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80');
      }

      const newListingId = `il-${Date.now().toString().slice(-6)}`;

      // 4. Insert the listing data into the PostgreSQL 'listings' table
      const listingPayload = {
        id: newListingId,
        host_id: hostUserId,
        host_email: hostEmailAddress.toLowerCase(),
        title: title.trim(),
        description: description.trim() || 'Modern verified apartment ready for short-let guests.',
        price: numericPrice,
        price_per_day: numericPrice,
        state: state.trim(),
        city: cityArea.trim(),
        city_area: cityArea.trim(),
        street_address: streetAddress.trim(),
        property_type: propertyType,
        amenities: selectedAmenities,
        images: imageUrls,
        photos: imageUrls,
        host_whatsapp: hostWhatsApp.trim(),
        host_full_name: session?.fullName || 'Verified Host',
        host_bank_details: activeBankDetails || INITIAL_BANK_SETTINGS,
        status: 'pending',
        is_physically_verified: false,
        is_booked: false,
        created_at: new Date().toISOString().split('T')[0],
        verification_notes: 'Pending WhatsApp contact and physical inspection scheduling.'
      };

      const { error: insertError } = await supabase
        .from('listings')
        .insert([listingPayload]);

      if (insertError) {
        console.warn('Supabase insert warning:', insertError);
        throw new Error(`Database save failed: ${insertError.message}`);
      }

      const createdListing: PropertyListing = {
        id: newListingId,
        title: title.trim(),
        description: description.trim() || 'Modern verified apartment ready for short-let guests.',
        propertyType,
        pricePerDay: numericPrice,
        state,
        cityArea: cityArea.trim(),
        streetAddress: streetAddress.trim(),
        amenities: selectedAmenities,
        photos: imageUrls,
        images: imageUrls,
        hostWhatsApp: hostWhatsApp.trim(),
        hostFullName: session?.fullName || 'Verified Host',
        hostEmail: hostEmailAddress,
        hostBankDetails: activeBankDetails || INITIAL_BANK_SETTINGS,
        status: 'pending',
        isPhysicallyVerified: false,
        isBooked: false,
        createdAt: new Date().toISOString().split('T')[0],
        verificationNotes: 'Pending WhatsApp contact and physical inspection scheduling.'
      };

      // 5. Success cleanup
      setCreatedListingData(createdListing);
      setShowSuccessModal(true);

      if (onAddNewListing) {
        onAddNewListing(createdListing);
      }

      // Reset form fields
      setTitle('');
      setDescription('');
      setPricePerDay('');
      setState('Lagos');
      setCityArea(NIGERIAN_STATE_AREAS['Lagos']?.[0] || 'Lekki Phase 1');
      setStreetAddress('');
      imageItems.forEach((item) => URL.revokeObjectURL(item.url));
      setImageFiles([]);
      setImageItems([]);

    } catch (err: any) {
      console.error('Submission Error:', err);
      const errMsg = err.message || 'An unexpected error occurred during submission.';
      setUploadError(errMsg);
      alert('Error: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = handleSubmitListing;

  const handleAcknowledgeSuccess = () => {
    if (createdListingData) {
      if (onAddNewListing) {
        onAddNewListing(createdListingData);
      }
      resetForm();
      setActiveTab('listings');
    }
  };

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'approved_live' || filterStatus === 'approved') {
      return listing.status === 'approved_live' || listing.status === 'approved';
    }
    if (filterStatus === 'pending_verification' || filterStatus === 'pending') {
      return listing.status === 'pending_verification' || listing.status === 'pending';
    }
    if (filterStatus === 'rejected') {
      return listing.status === 'rejected';
    }
    return listing.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Toggle Switch */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B4332]/10">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#1B4332]">Host Management</h1>
          <p className="text-xs text-[#6B756F]">Manage your short-let apartments and track verification status</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'listings' ? (
            <button
              onClick={() => setActiveTab('new-listing')}
              id="create-new-listing-btn"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Listing</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('listings')}
              id="view-my-listings-btn"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#1B4332] bg-white border border-[#1B4332]/20 hover:bg-[#FBF6EC] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Listings</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'new-listing' ? (
        /* ================= NEW LISTING FORM VIEW ================= */
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-[#1B4332]/10 p-6 sm:p-10">
          <div className="border-b border-[#1B4332]/10 pb-6 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif tracking-tight">
              Add New Property Listing
            </h2>
            <p className="mt-1.5 text-sm text-[#6B756F]">
              Provide accurate details for your apartment. All submissions will be physically inspected in person by an Ileya verification officer before being published to travelers.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-8">
            {/* Section 1: Property Details & Pricing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">1</span>
                <span>Basic Property Information & Pricing</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="host-listing-title" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    Property Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="host-listing-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Luxurious 2-Bedroom Serviced Apartment in Lekki Phase 1"
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="host-property-type" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="host-property-type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all cursor-pointer"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="host-price-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    Amount Per Day / Night (in ₦ / NGN) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1B4332] font-bold text-sm">
                      ₦
                    </div>
                    <input
                      type="number"
                      id="host-price-input"
                      min="5000"
                      step="1000"
                      required
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      placeholder="e.g. 85000"
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="host-description-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    Property Description
                  </label>
                  <textarea
                    id="host-description-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your space, special amenities, quiet hours, and check-in instructions..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location & Address */}
            <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">2</span>
                  <span>Location & Nigerian Address</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="host-state-select" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="host-state-select"
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all cursor-pointer"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="host-city-select" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    City / Area ({state}) <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="host-city-select"
                    value={cityArea}
                    onChange={(e) => setCityArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all cursor-pointer"
                  >
                    {(NIGERIAN_STATE_AREAS[state] || ['Central Area', 'GRA']).map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="host-street-address" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    Specific Street Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D6A4F]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="host-street-address"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. 14 Adeola Odeku St"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Amenities */}
            <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">3</span>
                  <span>Amenities</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {DEFAULT_AMENITIES.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity.label);
                  return (
                    <label
                      key={amenity.id}
                      onClick={() => handleToggleAmenity(amenity.label)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#1B4332]/10 border-[#1B4332] text-[#1B4332]'
                          : 'bg-white border-[#1B4332]/15 text-[#14231C] hover:bg-[#FBF6EC]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked
                            ? 'bg-[#1B4332] border-[#1B4332] text-white'
                            : 'border-[#6B756F]/40 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{amenity.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Photos */}
            <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">4</span>
                  <span>Apartment Photos (Cloudinary Upload)</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-[#1B4332]/25 rounded-2xl p-6 text-center bg-[#FBF6EC]/50 hover:bg-[#FBF6EC] transition-colors relative">
                <input
                  type="file"
                  id="host-photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                <h4 className="text-sm font-bold text-[#14231C]">Upload Real Photos of Your Apartment</h4>
                <p className="text-xs text-[#6B756F] mt-1 max-w-md mx-auto">
                  Select high-quality images from your device. Photos will be directly uploaded and hosted securely.
                </p>

                <div className="mt-4 flex items-center justify-center">
                  <label
                    htmlFor="host-photo-upload"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1B4332] hover:bg-[#2D6A4F] text-white transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Choose Images from Device</span>
                  </label>
                </div>
              </div>

              {imageItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imageItems.map((item, idx) => (
                    <div key={item.id} className="relative aspect-video rounded-xl overflow-hidden border border-[#1B4332]/15 group bg-black/5">
                      <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-600 text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Verification WhatsApp */}
            <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">5</span>
                <span>Physical Inspection Coordination</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/15 space-y-3">
                <div>
                  <label htmlFor="host-phone-whatsapp" className="block text-xs font-bold text-[#14231C] mb-1.5">
                    Host WhatsApp Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D6A4F]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      id="host-phone-whatsapp"
                      required
                      value={hostWhatsApp}
                      onChange={(e) => setHostWhatsApp(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-medium">
                    <strong>Privacy Guarantee:</strong> This number is strictly private and used only by the Ileya team to schedule physical inspection.
                  </p>
                </div>
              </div>
            </div>

            {/* Submission CTA & Gold Loading Indicator & Upload Error in Red Text above Submit Button */}
            <div className="pt-6 border-t border-[#1B4332]/10 space-y-4">
              {/* Display error in red text above submit button if it exists */}
              {uploadError && (
                <div
                  id="host-upload-error"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {isSubmitting && (
                    <div className="flex items-center gap-2.5 text-xs font-bold text-[#E8A33D]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#E8A33D]" />
                      <span>Publishing your listing...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('listings')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-[#6B756F] hover:text-[#14231C] hover:bg-[#1B4332]/5 transition-all cursor-pointer text-center disabled:opacity-50"
                  >
                    Cancel & Return
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    id="host-submit-listing-btn"
                    className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.99] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-[#14231C]" />
                        <span>Publishing your listing...</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>Submit Listing for Physical Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Submission Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1B4332]/10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#E8A33D]/20 text-[#1B4332] flex items-center justify-center mx-auto mb-4 border border-[#E8A33D]/40">
                  <ShieldCheck className="w-8 h-8 text-[#2D6A4F]" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8A33D] text-[#14231C] mb-3">
                  Status: Pending Physical Verification
                </span>
                <h3 className="text-2xl font-bold text-[#1B4332] font-serif">Listing Submitted!</h3>
                <p className="mt-3 text-sm text-[#14231C] leading-relaxed font-medium bg-[#FBF6EC] p-4 rounded-xl border border-[#1B4332]/10">
                  Our verification team will contact you via WhatsApp to physically inspect the apartment before it goes live.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAcknowledgeSuccess}
                    className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] transition-all shadow-md cursor-pointer"
                  >
                    Go to My Listings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= LISTINGS OVERVIEW VIEW ================= */
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm mb-3">
                <ShieldCheck className="w-4 h-4 text-[#E8A33D]" />
                <span>Verified Host Partner • 100% Physical Inspection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
                Welcome back, {hostDisplayName}!
              </h2>
              <p className="mt-2 text-white/80 text-sm leading-relaxed">
                Manage your verified apartments, track physical inspection schedules, and ensure your NUBAN settlement details are synchronized for automatic guest booking disbursements.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('new-listing')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List New Apartment</span>
                </button>
                <button
                  onClick={() => setShowEditBankModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5 text-[#E8A33D]" />
                  <span>Edit Payment Details</span>
                </button>
              </div>
            </div>
          </div>

          {/* Host Bank & Payout Details Sync Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#1B4332]/10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B4332]/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-[#2D6A4F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#14231C] font-serif">Host Payment & Settlement Details</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      <CheckCircle2 className="w-3 h-3" />
                      Synced to Supabase
                    </span>
                  </div>
                  <p className="text-xs text-[#6B756F]">
                    Directly synced with Master Admin database for automated guest payout remittances.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditBankModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1B4332] bg-[#1B4332]/5 hover:bg-[#1B4332]/10 border border-[#1B4332]/15 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Update Bank Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
                <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">Bank Name</span>
                <p className="text-sm font-bold text-[#14231C] mt-0.5">{activeBankDetails.bankName || 'Not Set'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
                <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">NUBAN Account Number</span>
                <p className="text-sm font-mono font-bold text-[#14231C] mt-0.5 tracking-wider">{activeBankDetails.accountNumber || '0000000000'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
                <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">Verified Account Name</span>
                <p className="text-sm font-bold text-[#14231C] mt-0.5 truncate">{activeBankDetails.accountName || 'ADEWALE BABATUNDE O.'}</p>
              </div>
            </div>
          </div>

          {/* Edit Bank Details Modal */}
          {showEditBankModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1B4332]/10">
                <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E8A33D]/20 text-[#1B4332] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#E8A33D]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-[#1B4332]">Edit Bank Payout Details</h3>
                      <p className="text-xs text-[#6B756F]">Syncs directly to Supabase & Master Admin</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditBankModal(false)}
                    className="text-[#6B756F] hover:text-[#14231C] text-sm font-bold p-1 rounded-lg hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {bankSaveSuccess && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#1B4332] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Bank details saved & synced to Supabase successfully!</span>
                  </div>
                )}

                {bankErrorMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{bankErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBankDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#14231C] mb-1">
                      Nigerian Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    >
                      <option value="">Select your bank...</option>
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14231C] mb-1">
                      Account Number (10 Digits NUBAN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      value={editAccountNumber}
                      onChange={(e) => setEditAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="0123456789"
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14231C] mb-1">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editAccountName}
                      onChange={(e) => setEditAccountName(e.target.value)}
                      placeholder="e.g. ADEWALE BABATUNDE O."
                      className="w-full px-3.5 py-2.5 text-sm font-bold uppercase bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    />
                    <p className="text-[11px] text-[#6B756F] mt-1">Must match your official bank registration.</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1B4332]/10 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditBankModal(false)}
                      disabled={isSavingBank}
                      className="px-4 py-2.5 text-xs font-bold text-[#6B756F] hover:text-[#14231C] hover:bg-gray-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingBank}
                      className="px-6 py-2.5 text-xs font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] rounded-xl transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingBank ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save & Sync Bank Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Listings List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1B4332]/10">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1B4332]" />
                <h3 className="font-bold text-[#14231C]">My Properties ({listings.length})</h3>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'all'
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white text-[#6B756F] hover:bg-[#1B4332]/5 border border-[#1B4332]/10'
                  }`}
                >
                  All ({listings.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'pending'
                      ? 'bg-[#E8A33D] text-[#14231C]'
                      : 'bg-white text-[#6B756F] hover:bg-[#1B4332]/5 border border-[#1B4332]/10'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'approved'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-white text-[#6B756F] hover:bg-[#1B4332]/5 border border-[#1B4332]/10'
                  }`}
                >
                  Live Approved
                </button>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#1B4332]/10">
                <Building2 className="w-12 h-12 text-[#6B756F]/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-[#14231C]">No properties found</h4>
                <p className="text-xs text-[#6B756F] mt-1 max-w-sm mx-auto">
                  Click the button below to upload your first apartment for physical inspection.
                </p>
                <button
                  onClick={() => setActiveTab('new-listing')}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List Apartment Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-2xl border border-[#1B4332]/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-video bg-black/5">
                      <img
                        src={listing.images?.[0] || listing.photos?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                        listing.status === 'approved' || listing.status === 'approved_live'
                          ? 'bg-[#1B4332] text-white'
                          : listing.status === 'rejected'
                          ? 'bg-red-600 text-white'
                          : 'bg-[#E8A33D] text-[#14231C]'
                      }`}>
                        {listing.status === 'approved' || listing.status === 'approved_live'
                          ? 'Verified & Live'
                          : listing.status === 'rejected'
                          ? 'Inspection Failed'
                          : 'Pending Inspection'}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{listing.cityArea}, {listing.state}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#14231C] line-clamp-1">{listing.title}</h4>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#1B4332]/10 text-xs">
                        <div>
                          <span className="text-[#6B756F]">Per night:</span>{' '}
                          <strong className="text-[#1B4332] font-bold">₦{listing.pricePerDay?.toLocaleString()}</strong>
                        </div>
                        {onDeleteListing && (
                          <button
                            onClick={() => setListingToDelete(listing)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14231C] font-serif">Delete Property Listing?</h3>
                <p className="text-xs text-[#6B756F]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-[#FBF6EC] p-3.5 rounded-xl border border-[#1B4332]/10 mb-5 flex items-center gap-3">
              <img
                src={listingToDelete.photos?.[0] || listingToDelete.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop&q=80'}
                alt={listingToDelete.title}
                className="w-12 h-12 rounded-lg object-cover border border-[#1B4332]/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#14231C] truncate">{listingToDelete.title}</h4>
                <p className="text-[11px] text-[#2D6A4F] mt-0.5">{listingToDelete.cityArea}, {listingToDelete.state}</p>
              </div>
            </div>

            <p className="text-xs text-[#6B756F] leading-relaxed mb-5">
              Are you sure you want to permanently delete this listing from your host portfolio?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-[#1B4332]/5 hover:text-[#14231C] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteListing && listingToDelete) {
                    onDeleteListing(listingToDelete.id);
                  }
                  setListingToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Listing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HostDashboard;
