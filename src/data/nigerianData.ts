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
