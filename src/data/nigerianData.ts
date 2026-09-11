import { PropertyListing, BankPayoutDetails } from '../types';

export const NIGERIAN_STATES = [
  'Lagos',
  'Abuja (FCT)',
  'Rivers',
  'Oyo',
  'Ogun',
  'Enugu',
  'Delta',
  'Anambra',
  'Edo',
  'Kaduna',
  'Kano',
  'Akwa Ibom',
  'Cross River',
  'Ondo',
  'Kwara',
  'Plateau',
  'Imo',
  'Abia',
  'Benue',
  'Bayelsa',
  'Ekiti',
  'Osun',
  'Kogi',
  'Bauchi',
  'Gombe',
  'Adamawa',
  'Taraba',
  'Niger',
  'Nasarawa',
  'Sokoto',
  'Kebbi',
  'Zamfara',
  'Katsina',
  'Jigawa',
  'Yobe',
  'Borno',
  'Ebonyi'
];

export const NIGERIAN_STATE_AREAS: Record<string, string[]> = {
  'Lagos': [
    'Lekki Phase 1',
    'Victoria Island (VI)',
    'Ikoyi',
    'Ikeja GRA',
    'Surulere',
    'Maryland',
    'Yaba',
    'Ajah & Sangotedo',
    'Chevron Drive & Orchid',
    'Magodo Phase 2',
    'Banana Island',
    'Gbagada',
    'Oniru Estate',
    'Victoria Garden City (VGC)',
    'Anthony Village',
    'Ogudu GRA',
    'Festac Town',
    'Ilupeju',
    'Alausa / Oregun',
    'Epe & Ibeju Lekki'
  ],
  'Abuja (FCT)': [
    'Maitama',
    'Wuse 2',
    'Gwarinpa Estate',
    'Asokoro',
    'Jabi',
    'Central Business District (CBD)',
    'Guzape',
    'Katampe Extension',
    'Utako',
    'Apo Legislative Quarters',
    'Life Camp',
    'Mabushi',
    'Lugbe Airport Road',
    'Lokogoma',
    'Kado Estate',
    'Dawaki',
    'Kubwa'
  ],
  'Rivers': [
    'Old GRA (Port Harcourt)',
    'New GRA (Port Harcourt)',
    'Peter Odili Road',
    'Trans Amadi Industrial Layout',
    'D-Line',
    'Stadium Road',
    'Woji',
    'Ada George Road',
    'Rumuola',
    'Elelenwo',
    'Rumuokwuta',
    'Choba / Uniport Axis'
  ],
  'Oyo': [
    'Bodija (Old & New)',
    'Oluyole Estate (Ibadan)',
    'Jericho GRA',
    'Agodi GRA',
    'Samonda / UI Axis',
    'Ring Road (Ibadan)',
    'Akobo Estate',
    'Alalubosa GRA',
    'Iyaganku GRA',
    'Dugbe Commercial Hub',
    'Ikolaba GRA',
    'Eleyele'
  ],
  'Ogun': [
    'Abeokuta GRA',
    'Magboro / Arepo (Lagos-Ibadan Corridor)',
    'Isheri North',
    'Ibara GRA',
    'Sagamu Interchange',
    'Mowe / Ofada Axis',
    'Oke-Mosan (Govt Axis)',
    'Agbara Industrial Estate',
    'Ibafo Axis',
    'Ijebu-Ode GRA'
  ],
  'Enugu': [
    'Independence Layout',
    'New Haven',
    'GRA (Enugu)',
    'Golf Estate',
    'Achara Layout',
    'Trans-Ekulu',
    'Coal Camp',
    'Abakpa Nike',
    'Thinkers Corner'
  ],
  'Delta': [
    'Asaba GRA',
    'Warri GRA',
    'Okpanam Road (Asaba)',
    'Effurun / Delta Mall Axis',
    'Airport Road (Warri)',
    'DDPA Housing Estate',
    'Sapele Town',
    'Ughelli Central'
  ],
  'Anambra': [
    'Awka GRA',
    'Onitsha GRA',
    'Nnewi Central',
    'Ngozika Housing Estate (Awka)',
    'Udoka Housing Estate',
    '3-3 Nkwelle Ezunaka',
    'Iyiagu Estate'
  ],
  'Edo': [
    'GRA (Benin City)',
    'Airport Road (Benin)',
    'Ugbor Village',
    'Boundary Road',
    'Ugbowo / UNIBEN Axis',
    'Ikpoba Hill',
    'Sapele Road Axis'
  ],
  'Kaduna': [
    'Barnawa',
    'Malali GRA',
    'Kaduna GRA',
    'Ungwan Rimi',
    'Millennium City',
    'Sabon Tasha',
    'Narayi High Cost',
    'Kabala Doki'
  ],
  'Kano': [
    'Nasarawa GRA',
    'Bompai Industrial Area',
    'Tarauni',
    'Kano City Centre',
    'Commercial Layout',
    'Fagge',
    'Sharada',
    'Sabon Gari'
  ],
  'Akwa Ibom': [
    'Ewet Housing Estate',
    'Shelter Afrique Estate',
    'Uyo GRA',
    'Osongama Estate',
    'Ring Road 3 Axis (Uyo)',
    'Ikot Ekpene Road',
    'Federal Housing Estate'
  ],
  'Cross River': [
    'State Housing Estate (Calabar)',
    'Marian Road',
    'Federal Housing Estate',
    'Diamond Hill (Govt House Axis)',
    'Etta Agbor',
    'Calabar Road Commercial'
  ],
  'Ondo': [
    'Alagbaka GRA (Akure)',
    'Ijapo Estate',
    'Oba-Ile Housing Estate',
    'Akure Central Hub',
    'Ondo City GRA'
  ],
  'Kwara': [
    'GRA (Ilorin)',
    'Fate Road',
    'Tanke / University Axis',
    'University Road',
    'Kulende Housing Estate',
    'Adewole Housing Estate'
  ],
  'Plateau': [
    'Rayfield (Jos)',
    'Millionaires Quarters',
    'Anglo Jos',
    'Lamingo',
    'Bukuru Axis',
    'Old Airport Road'
  ],
  'Imo': [
    'New Owerri (World Bank)',
    'Works Layout',
    'Aladinma Estate',
    'Ikenegbu Layout',
    'Owerri GRA',
    'Port Harcourt Road Axis'
  ],
  'Abia': [
    'Umuahia GRA',
    'Aba Commercial District',
    'World Bank Housing (Umuahia)',
    'Ogbor Hill (Aba)',
    'Umungasi'
  ],
  'Benue': [
    'Makurdi GRA',
    'High Level',
    'Wurukum',
    'Judges Quarters',
    'Kanshio Axis'
  ],
  'Bayelsa': [
    'Yenagoa GRA',
    'Ekeki Housing Estate',
    'Isaac Boro Expressway',
    'Biogbolo',
    'Kpansia'
  ],
  'Ekiti': [
    'Ado-Ekiti GRA',
    'Federal Housing Estate',
    'Similoluwa / Bank Road',
    'Adebayo Area',
    'Basiri'
  ],
  'Osun': [
    'Osogbo GRA',
    'Oke-Fia',
    'Ring Road (Osogbo)',
    'Jaleyemi',
    'Ogo-Oluwa Area',
    'Ede Axis'
  ],
  'Kogi': [
    'Lokoja GRA',
    'Ganaja Village / Road',
    'Phase 1 & 2 Housing Estates',
    'Lokongoma Phase 1 & 2',
    'Kabba Central'
  ],
  'Bauchi': [
    'Bauchi GRA',
    'New GRA (Bauchi)',
    'Railway Quarter',
    'Federal Lowcost'
  ],
  'Gombe': [
    'Gombe GRA',
    'Federal Lowcost Gombe',
    'Orji Estate',
    'Pantami Area'
  ],
  'Adamawa': [
    'Yola GRA',
    'Jimeta Commercial Hub',
    'Dougirei (Govt Axis)',
    'Karewa GRA',
    'Bekaji Estate'
  ],
  'Taraba': [
    'Jalingo GRA',
    'Mile 6 Axis',
    'Sabon Gari Jalingo',
    'Magami Area'
  ],
  'Niger': [
    'Minna GRA',
    'Maitumbi',
    'Bosso Estate / Campus Axis',
    'Tunga Commercial Area',
    'Kpakungu'
  ],
  'Nasarawa': [
    'Lafia GRA',
    'Karu / Mararaba (Abuja Corridor)',
    'Nyanya Axis',
    'Bukan Sidi'
  ],
  'Sokoto': [
    'Sokoto GRA',
    'Runjin Sambo',
    'Arkilla Housing Estate',
    'Mabera Area',
    'Guiwa Lowcost'
  ],
  'Kebbi': [
    'Birnin Kebbi GRA',
    'Gwadangaji Quarters',
    'Bayan Kara',
    'Adamu Aliero Estate'
  ],
  'Zamfara': [
    'Gusau GRA',
    'Samaru Area',
    'Tudun Wada',
    'Canteen Daji'
  ],
  'Katsina': [
    'Katsina GRA',
    'Kofar Kaura',
    'Dutsen Safe Lowcost',
    'Steel Rolling Mill Area'
  ],
  'Jigawa': [
    'Dutse GRA',
    'Takur Commercial Area',
    'Hakimi Street',
    'Kiyawa Road Axis'
  ],
  'Yobe': [
    'Damaturu GRA',
    'Nayinawa Area',
    'New Jerusalem',
    'Gujba Road Axis'
  ],
  'Borno': [
    'Maiduguri GRA',
    'New GRA (Maiduguri)',
    'Polo Area',
    'Bulumkutu',
    'Custom Area'
  ],
  'Ebonyi': [
    'Abakaliki GRA',
    'Mile 50 Layout',
    'Azuiyiokwu Area',
    'CAS Campus Area',
    'Ezza Road'
  ]
};

export const NIGERIAN_BANKS = [
  'Access Bank',
  'Zenith Bank',
  'Guaranty Trust Bank (GTBank)',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Bank (Microfinance)',
  'Moniepoint Microfinance Bank',
  'OPay Digital Services',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank / ALAT',
  'First City Monument Bank (FCMB)',
  'Union Bank of Nigeria',
  'Ecobank Nigeria',
  'Polaris Bank',
  'Keystone Bank',
  'Jaiz Bank',
  'Taj Bank',
  'Providus Bank',
  'Titan Trust Bank'
];

export const DEFAULT_AMENITIES = [
  { id: 'power', label: '24/7 Power / Generator / Solar', icon: 'Zap' },
  { id: 'wifi', label: 'High-Speed WiFi', icon: 'Wifi' },
  { id: 'ac', label: 'Air Conditioning (AC)', icon: 'Wind' },
  { id: 'security', label: 'Gated Security & CCTV', icon: 'ShieldCheck' },
  { id: 'pool', label: 'Swimming Pool', icon: 'Waves' },
  { id: 'workspace', label: 'Dedicated Workspace', icon: 'Laptop' },
  { id: 'tv', label: 'Smart TV & DSTV / Netflix', icon: 'Tv' },
  { id: 'kitchen', label: 'Fully Equipped Kitchen', icon: 'Utensils' },
  { id: 'water', label: 'Treated Running Water', icon: 'Droplets' },
  { id: 'parking', label: 'Free Secured Parking', icon: 'Car' },
  { id: 'washing', label: 'Washing Machine', icon: 'Shirt' },
  { id: 'gym', label: 'Access to Fitness Gym', icon: 'Dumbbell' }
];

export const PROPERTY_TYPES = [
  'Entire Apartment',
  'Studio Apartment',
  'Duplex',
  'Penthouse',
  'Serviced Flat',
  'Townhouse',
  'Luxury Villa'
] as const;

export const INITIAL_BANK_SETTINGS: BankPayoutDetails = {
  bankName: 'Guaranty Trust Bank (GTBank)',
  accountNumber: '0123456789',
  accountName: 'ADEWALE BABATUNDE O.',
  isVerified: true
};

export const INITIAL_VERIFIED_LISTINGS: PropertyListing[] = [
  {
    id: 'LIST-LAG-001',
    title: 'Luxury 2-Bedroom Waterfront Serviced Apartment',
    description: 'Physically inspected luxury apartment with uninterrupted 24/7 industrial generator power, fiber-optic WiFi, clean treated water, and 24-hour uniformed security on Admiralty Way.',
    propertyType: 'Entire Apartment',
    pricePerDay: 85000,
    state: 'Lagos',
    cityArea: 'Lekki Phase 1',
    streetAddress: '14 Admiralty Way, Lekki Phase 1',
    amenities: ['24/7 Power / Generator / Solar', 'High-Speed WiFi', 'Air Conditioning (AC)', 'Gated Security & CCTV', 'Swimming Pool', 'Smart TV & DSTV / Netflix'],
    photos: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
    ],
    hostWhatsApp: '+2348031234567',
    hostFullName: 'Chief Babatunde Balogun',
    hostEmail: 'babatunde.balogun@ileya.ng',
    status: 'approved_live',
    isPhysicallyVerified: true,
    isBooked: false,
    createdAt: '2025-01-10T08:00:00.000Z',
    verificationNotes: 'Physical site audit verified 100KVA standby Cummins generator, Mikano synchronization panel, clean borehole with industrial reverse osmosis, and biometric access.'
  },
  {
    id: 'LIST-ABJ-002',
    title: 'Diplomatic Penthouse with Panoramic City Views',
    description: 'Inspected penthouse residence in prime Maitama with high-speed Starlink WiFi, private elevator access, 24/7 dual soundproof generator backup, and high-end Italian furnishings.',
    propertyType: 'Penthouse',
    pricePerDay: 150000,
    state: 'Abuja (FCT)',
    cityArea: 'Maitama',
    streetAddress: '22 Gana Street, Maitama District',
    amenities: ['24/7 Power / Generator / Solar', 'High-Speed WiFi', 'Air Conditioning (AC)', 'Dedicated Workspace', 'Free Secured Parking', 'Access to Fitness Gym'],
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'
    ],
    hostWhatsApp: '+2348029876543',
    hostFullName: 'Hajiya Amina Bello',
    hostEmail: 'amina.bello@ileya.ng',
    status: 'approved_live',
    isPhysicallyVerified: true,
    isBooked: false,
    createdAt: '2025-01-12T10:30:00.000Z',
    verificationNotes: 'Physically inspected by Ileya Abuja team. Dual 60KVA Perkins generators tested with 0-second transfer switch.'
  },
  {
    id: 'LIST-LAG-003',
    title: 'Executive Studio Flat in Victoria Island Commercial Hub',
    description: 'Modern, fully equipped studio in Victoria Island near Eko Atlantic, featuring continuous power supply, premium DSTV package, work desk, and on-site gym.',
    propertyType: 'Studio Apartment',
    pricePerDay: 55000,
    state: 'Lagos',
    cityArea: 'Victoria Island (VI)',
    streetAddress: '7 Adeola Odeku Street, Victoria Island',
    amenities: ['24/7 Power / Generator / Solar', 'High-Speed WiFi', 'Air Conditioning (AC)', 'Smart TV & DSTV / Netflix', 'Fully Equipped Kitchen'],
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502005229762-ee1b40286392?auto=format&fit=crop&w=1000&q=80'
    ],
    hostWhatsApp: '+2348095551212',
    hostFullName: 'Chinedu Okonkwo',
    hostEmail: 'chinedu.okonkwo@ileya.ng',
    status: 'approved_live',
    isPhysicallyVerified: true,
    isBooked: false,
    createdAt: '2025-01-15T14:15:00.000Z',
    verificationNotes: 'Generator and inverter tested. Continuous pressure running water verified.'
  },
  {
    id: 'LIST-LAG-004',
    title: 'Prime 3-Bedroom Duplex with Private Garden',
    description: 'Spacious family duplex in serene Ikeja GRA close to MMA2 airport. Features 24/7 security patrol, solar inverter system with generator support, and private parking.',
    propertyType: 'Duplex',
    pricePerDay: 95000,
    state: 'Lagos',
    cityArea: 'Ikeja GRA',
    streetAddress: '18 Isaac John Street, Ikeja GRA',
    amenities: ['24/7 Power / Generator / Solar', 'High-Speed WiFi', 'Air Conditioning (AC)', 'Free Secured Parking', 'Washing Machine', 'Gated Security & CCTV'],
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80'
    ],
    hostWhatsApp: '+2348039988776',
    hostFullName: 'Mrs. Folake Adeyemi',
    hostEmail: 'folake.adeyemi@ileya.ng',
    status: 'approved_live',
    isPhysicallyVerified: true,
    isBooked: false,
    createdAt: '2025-01-18T11:00:00.000Z',
    verificationNotes: 'Inverter batteries health 98%. Clean borehole and water treatment plant confirmed.'
  },
  {
    id: 'LIST-RIV-005',
    title: 'Serene Serviced Apartment in Old GRA Port Harcourt',
    description: 'Chic short-stay apartment on Peter Odili axis with round-the-clock power, tight residential security, pool access, and tranquil ambiance.',
    propertyType: 'Serviced Flat',
    pricePerDay: 70000,
    state: 'Rivers',
    cityArea: 'Old GRA (Port Harcourt)',
    streetAddress: '9 Forces Avenue, Old GRA',
    amenities: ['24/7 Power / Generator / Solar', 'High-Speed WiFi', 'Swimming Pool', 'Air Conditioning (AC)', 'Treated Running Water'],
    photos: [
      'https://images.unsplash.com/photo-1554995207-c18c20360250?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1000&q=80'
    ],
    hostWhatsApp: '+2348084433221',
    hostFullName: 'Tamuno Briggs',
    hostEmail: 'tamuno.briggs@ileya.ng',
    status: 'approved_live',
    isPhysicallyVerified: true,
    isBooked: false,
    createdAt: '2025-01-20T16:00:00.000Z',
    verificationNotes: 'Physical inspection completed. All air conditioners serviced, generator fuel levels tracked.'
  },
  {
    id: 'LIST-OYO-006',
    title: 'Modern 2-Bedroom Haven in Bodija Ibadan',
    description: 'Beautifully styled apartment in prestigious Bodija with uninterrupted solar inverter backup, super-fast WiFi, smart streaming TVs, and perimeter CCTV.',
    propertyType: 'Entire Apartment',
    pricePerDay: 48000,
    state: 'Oyo',
    cityArea: 'Bodija (Old & New)',
    streetAddress: '5 Oshuntokun Avenue, Old Bodija',
    amenities: ['24/7 Power / Generator / Solar', 'High-Speed WiFi', 'Smart TV & DSTV / Netflix', 'Fully Equipped Kitchen', 'Free Secured Parking'],
    photos: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80'
    ],
    hostWhatsApp: '+2348057766554',
    hostFullName: 'Dr. Olumide Adeleke',
    hostEmail: 'olumide.adeleke@ileya.ng',
    status: 'approved_live',
    isPhysicallyVerified: true,
    isBooked: false,
    createdAt: '2025-01-22T09:45:00.000Z',
    verificationNotes: 'Solar inverter system rated 5kVA with lithium iron phosphate storage. 24/7 uptime verified.'
  }
];

