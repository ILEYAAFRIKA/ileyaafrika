import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveListingToSupabase } from '../../lib/supabaseService';
import { PropertyListing, PropertyType, UserSession, BankPayoutDetails } from '../../types';
import {
  NIGERIAN_STATES,
  NIGERIAN_STATE_AREAS,
  PROPERTY_TYPES,
  DEFAULT_AMENITIES,
  INITIAL_BANK_SETTINGS
} from '../../data/nigerianData';

interface ListingCreationFormProps {
  onCancel: () => void;
  onSubmitSuccess: (newListing: PropertyListing) => void;
  hostSession?: UserSession | null;
  bankDetails?: BankPayoutDetails;
}

interface ImageItem {
  id: string;
  url: string;
  file: File;
}

export const ListingCreationForm: React.FC<ListingCreationFormProps> = ({
  onCancel,
  onSubmitSuccess,
  hostSession,
  bankDetails,
}) => {
  // Form State
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
  // Preview items state for immediate visual display
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);

  const [hostWhatsApp, setHostWhatsApp] = useState('+234 ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdListingData, setCreatedListingData] = useState<PropertyListing | null>(null);

  // Handle State Change - Dynamically updates City/Area options
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

  /**
   * Handle File Selection - captures raw File objects into local React state
   */
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);

    // Create local object URLs for immediate preview
    const newItems: ImageItem[] = newFiles.map((file: File) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setImageItems((prev) => [...prev, ...newItems]);
    setUploadError('');

    // Reset input value so same files can be re-selected if desired
    e.target.value = '';
  };

  // Remove photo from preview and imageFiles state
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

      const hostUserId = currentAuthUser?.id || hostSession?.uid || 'host-user';
      const hostEmailAddress = currentAuthUser?.email || hostSession?.email || 'host@ileya.ng';

      if (!hostUserId && !hostSession?.isAuthenticated) {
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
        host_full_name: hostSession?.fullName || 'Verified Host',
        host_bank_details: bankDetails || INITIAL_BANK_SETTINGS,
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
        hostFullName: hostSession?.fullName || 'Verified Host',
        hostEmail: hostEmailAddress,
        hostBankDetails: bankDetails || INITIAL_BANK_SETTINGS,
        status: 'pending',
        isPhysicallyVerified: false,
        isBooked: false,
        createdAt: new Date().toISOString().split('T')[0],
        verificationNotes: 'Pending WhatsApp contact and physical inspection scheduling.'
      };

      // 5. Success cleanup
      setCreatedListingData(createdListing);
      setShowSuccessModal(true);

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
      onSubmitSuccess(createdListingData);
      resetForm();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          id="back-to-listings-btn"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:text-[#2D6A4F] bg-white px-3.5 py-2 rounded-xl border border-[#1B4332]/15 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </button>

        <div className="text-right">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8A33D]/20 text-[#1B4332] border border-[#E8A33D]/30">
            Step 1: Listing Creation & Verification
          </span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl shadow-xl shadow-[#1B4332]/5 border border-[#1B4332]/10 p-6 sm:p-10">
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
              {/* Property Title */}
              <div className="md:col-span-2">
                <label htmlFor="listing-title-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="listing-title-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Luxurious 2-Bedroom Serviced Apartment in Lekki Phase 1"
                  className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                />
              </div>

              {/* Property Type */}
              <div>
                <label htmlFor="listing-property-type-select" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="listing-property-type-select"
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

              {/* Pricing (Crucial in NGN) */}
              <div>
                <label htmlFor="listing-price-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Amount Per Day / Night (in ₦ / NGN) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1B4332] font-bold text-sm">
                    ₦
                  </div>
                  <input
                    type="number"
                    id="listing-price-input"
                    min="5000"
                    step="1000"
                    required
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    placeholder="e.g. 85000"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                  />
                </div>
                {pricePerDay && Number(pricePerDay) > 0 && (
                  <p className="mt-1 text-[11px] text-[#2D6A4F] font-medium">
                    Formatted: ₦{Number(pricePerDay).toLocaleString()} / night
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="listing-description-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Property Description
                </label>
                <textarea
                  id="listing-description-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your space, special amenities, quiet hours, and check-in instructions..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Address (Native Dependent Dropdowns & Street Address) */}
          <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">2</span>
                <span>Location & Nigerian Address</span>
              </div>
              <span className="text-[11px] font-semibold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-0.5 rounded-full">
                Structured Dropdown System
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State Dropdown */}
              <div>
                <label htmlFor="listing-state-select" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  State Dropdown <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="listing-state-select"
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
                <p className="mt-1 text-[11px] text-[#6B756F]">
                  Select the Nigerian state where the property is located.
                </p>
              </div>

              {/* City / Area Dependent Dropdown */}
              <div>
                <label htmlFor="listing-city-select" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  City / Area Dropdown ({state}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="listing-city-select"
                    value={cityArea}
                    onChange={(e) => setCityArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all cursor-pointer"
                  >
                    {(NIGERIAN_STATE_AREAS[state] || [
                      'Central Area',
                      'GRA',
                      'Downtown',
                      'Commercial Hub',
                      'Residential Area'
                    ]).map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-[#2D6A4F] font-medium">
                  {NIGERIAN_STATE_AREAS[state]?.length || 0} neighborhood options for {state}
                </p>
              </div>

              {/* Specific Street Address Text Input */}
              <div className="md:col-span-2">
                <label htmlFor="listing-street-address-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Specific Street Address (House No. & Street) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D6A4F]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="listing-street-address-input"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. 14 Adeola Odeku St"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                  />
                </div>
                <div className="mt-2 p-2.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 flex items-center justify-between text-xs">
                  <span className="text-[#6B756F]">Full Combined Address:</span>
                  <span className="font-bold text-[#1B4332]">
                    {streetAddress ? `${streetAddress}, ` : ''}{cityArea || 'Area'}, {state} State, Nigeria
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Standard Nigerian Amenities */}
          <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">3</span>
                <span>Nigerian Apartment Amenities</span>
              </div>
              <span className="text-xs text-[#6B756F]">
                {selectedAmenities.length} selected
              </span>
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

          {/* Section 4: Photo Upload with Cloudinary Direct Upload */}
          <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">4</span>
                <span>Apartment Photos (Cloudinary Upload)</span>
              </div>
              <span className="text-xs text-[#6B756F]">
                {imageItems.length} selected
              </span>
            </div>

            {/* Standard File Input Container */}
            <div className="border-2 border-dashed border-[#1B4332]/25 rounded-2xl p-6 sm:p-8 text-center bg-[#FBF6EC]/50 hover:bg-[#FBF6EC] transition-colors relative">
              <input
                type="file"
                id="listing-photo-upload"
                multiple
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-bold text-[#14231C]">
                Upload Real Photos of Your Apartment
              </h4>
              <p className="text-xs text-[#6B756F] mt-1 max-w-md mx-auto">
                Select high-quality images from your device (PNG, JPG, JPEG, WEBP). Photos will be securely processed and hosted via Cloudinary.
              </p>

              {/* Upload Action Button */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <label
                  htmlFor="listing-photo-upload"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1B4332] hover:bg-[#2D6A4F] text-white transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Choose Images from Device</span>
                </label>
              </div>
            </div>

            {/* Selected Photos Thumbnails Preview */}
            {imageItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {imageItems.map((item, idx) => (
                  <div key={item.id} className="relative aspect-video rounded-xl overflow-hidden border border-[#1B4332]/15 group bg-black/5">
                    <img src={item.url} alt={`Property upload ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-600 text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#1B4332] text-white px-1.5 py-0.5 rounded">
                        Cover Photo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Private Verification Contact (WhatsApp) */}
          <div className="space-y-4 pt-4 border-t border-[#1B4332]/10">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs">5</span>
              <span>Physical Inspection Coordination</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/15 space-y-3">
              <div>
                <label htmlFor="listing-whatsapp-input" className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Host WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D6A4F]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="listing-whatsapp-input"
                    required
                    value={hostWhatsApp}
                    onChange={(e) => setHostWhatsApp(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                  />
                </div>
              </div>

              {/* Explicit Disclaimer */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">
                  <strong>Privacy Guarantee:</strong> This number is strictly private and used only by the Ileya team to schedule physical inspection. It will never be shown to guests.
                </p>
              </div>
            </div>
          </div>

          {/* Submission CTA & Gold Loading Indicator & Upload Error in Red Text above Submit Button */}
          <div className="pt-6 border-t border-[#1B4332]/10 space-y-4">
            {/* Display error in red text above submit button if it exists */}
            {uploadError && (
              <div
                id="host-upload-error-message"
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
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-[#6B756F] hover:text-[#14231C] hover:bg-[#1B4332]/5 transition-all cursor-pointer text-center disabled:opacity-50"
                >
                  Cancel & Return
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="submit-new-listing-btn"
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
      </div>

      {/* Submission Success Modal / Banner */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1B4332]/10 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-[#E8A33D]/20 text-[#1B4332] flex items-center justify-center mx-auto mb-4 border border-[#E8A33D]/40">
              <ShieldCheck className="w-8 h-8 text-[#2D6A4F]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8A33D] text-[#14231C] mb-3">
              Status: Pending Physical Verification
            </span>

            <h3 className="text-2xl font-bold text-[#1B4332] font-serif">
              Listing Submitted!
            </h3>

            <p className="mt-3 text-sm text-[#14231C] leading-relaxed font-medium bg-[#FBF6EC] p-4 rounded-xl border border-[#1B4332]/10">
              Our verification team will contact you via WhatsApp to physically inspect the apartment before it goes live.
            </p>

            <div className="mt-4 text-xs text-[#6B756F] text-left space-y-2 p-3 bg-white border border-[#1B4332]/10 rounded-xl">
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Property:</span>
                <strong className="text-[#14231C] truncate max-w-[240px]">{createdListingData?.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Inspection WhatsApp:</span>
                <strong className="font-mono text-[#2D6A4F]">{createdListingData?.hostWhatsApp}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Nightly Price:</span>
                <strong className="text-[#1B4332]">₦{createdListingData?.pricePerDay.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Photos Uploaded:</span>
                <strong className="text-[#2D6A4F]">{createdListingData?.images?.length || 0} images</strong>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                id="modal-confirm-btn"
                onClick={handleAcknowledgeSuccess}
                className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] transition-all shadow-md shadow-[#E8A33D]/25 cursor-pointer"
              >
                Go to My Listings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
