// merchant normalization
// converts raw bank strings like "SWGY*O123456 UPI 9988776655@okaxis" → { name: "Swiggy", emoji: "🧡", ... }
//
// covers ~220 indian merchants. if yours is missing, add it to MERCHANT_MAP below.
// pattern matching is intentionally fuzzy — strips noise first, then looks for known brand substrings.

export interface MerchantInfo {
  raw:      string;
  name:     string;
  category: string;
  emoji:    string;
  brand:    string;
  matched:  boolean;  // false = no match found, we just cleaned up the raw string
}


// the merchant map. patterns are matched against a noise-stripped lowercase version of the raw string.
// order doesn't matter much — longest pattern wins on ties.
interface MerchantEntry {
  patterns: string[];
  name:     string;
  category: string;
  emoji:    string;
  brand:    string;
}

const MERCHANT_MAP: MerchantEntry[] = [

  // ── Food Delivery ──────────────────────────────────────────
  { patterns: ['swiggy', 'swgy'],           name: 'Swiggy',        category: 'Food & Dining', emoji: '🧡', brand: 'swiggy' },
  { patterns: ['zomato', 'zomat'],          name: 'Zomato',        category: 'Food & Dining', emoji: '🍱', brand: 'zomato' },
  { patterns: ['dunzo'],                    name: 'Dunzo',          category: 'Food & Dining', emoji: '🛵', brand: 'dunzo' },
  { patterns: ['magicpin'],                 name: 'Magicpin',       category: 'Food & Dining', emoji: '📍', brand: 'magicpin' },
  { patterns: ['eatsure'],                  name: 'EatSure',        category: 'Food & Dining', emoji: '🍽️', brand: 'eatsure' },

  // ── Quick Commerce ─────────────────────────────────────────
  { patterns: ['blinkit', 'grofers'],       name: 'Blinkit',        category: 'Shopping',      emoji: '⚡', brand: 'blinkit' },
  { patterns: ['zepto'],                    name: 'Zepto',          category: 'Shopping',      emoji: '🟡', brand: 'zepto' },
  { patterns: ['bigbasket', 'bb'],          name: 'BigBasket',      category: 'Shopping',      emoji: '🧺', brand: 'bigbasket' },
  { patterns: ['jiomart'],                  name: 'JioMart',        category: 'Shopping',      emoji: '🛒', brand: 'jiomart' },
  { patterns: ['milkbasket'],               name: 'Milkbasket',     category: 'Shopping',      emoji: '🥛', brand: 'milkbasket' },
  { patterns: ['countrydelight'],           name: 'Country Delight',category: 'Shopping',      emoji: '🐄', brand: 'countrydelight' },

  // ── Restaurants & QSR ──────────────────────────────────────
  { patterns: ['mcdonalds', 'mcdonald', 'mcd', 'mct'], name: "McDonald's",  category: 'Food & Dining', emoji: '🍟', brand: 'mcdonalds' },
  { patterns: ['kfc'],                      name: 'KFC',            category: 'Food & Dining', emoji: '🍗', brand: 'kfc' },
  { patterns: ['dominos', 'domino'],        name: "Domino's",       category: 'Food & Dining', emoji: '🍕', brand: 'dominos' },
  { patterns: ['pizzahut'],                 name: 'Pizza Hut',      category: 'Food & Dining', emoji: '🍕', brand: 'pizzahut' },
  { patterns: ['burgerking'],               name: 'Burger King',    category: 'Food & Dining', emoji: '🍔', brand: 'burgerking' },
  { patterns: ['subway'],                   name: 'Subway',         category: 'Food & Dining', emoji: '🥖', brand: 'subway' },
  { patterns: ['starbucks'],                name: 'Starbucks',      category: 'Food & Dining', emoji: '☕', brand: 'starbucks' },
  { patterns: ['cafecoffeeday', 'ccd'],     name: 'Café Coffee Day',category: 'Food & Dining', emoji: '☕', brand: 'ccd' },
  { patterns: ['chaayos'],                  name: 'Chaayos',        category: 'Food & Dining', emoji: '🍵', brand: 'chaayos' },
  { patterns: ['barista'],                  name: 'Barista',        category: 'Food & Dining', emoji: '☕', brand: 'barista' },
  { patterns: ['dunkin'],                   name: "Dunkin'",        category: 'Food & Dining', emoji: '🍩', brand: 'dunkin' },
  { patterns: ['haldiram'],                 name: "Haldiram's",     category: 'Food & Dining', emoji: '🍛', brand: 'haldirams' },
  { patterns: ['barbeque', 'bbnation'],     name: 'Barbeque Nation',category: 'Food & Dining', emoji: '🥩', brand: 'bbq' },
  { patterns: ['biryanibykilode', 'bbk'],   name: 'Biryani By Kilo',category: 'Food & Dining', emoji: '🍛', brand: 'bbk' },
  { patterns: ['naturals'],                 name: 'Naturals Ice Cream', category: 'Food & Dining', emoji: '🍦', brand: 'naturals' },
  { patterns: ['baskinrobbins', 'baskin'],  name: 'Baskin Robbins', category: 'Food & Dining', emoji: '🍦', brand: 'baskinrobbins' },
  { patterns: ['amul'],                     name: 'Amul',           category: 'Food & Dining', emoji: '🧀', brand: 'amul' },
  { patterns: ['theobroma'],                name: 'Theobroma',      category: 'Food & Dining', emoji: '🎂', brand: 'theobroma' },

  // ── E-commerce ─────────────────────────────────────────────
  { patterns: ['amazon'],                   name: 'Amazon',         category: 'Shopping',      emoji: '📦', brand: 'amazon' },
  { patterns: ['flipkart'],                 name: 'Flipkart',       category: 'Shopping',      emoji: '🛍️', brand: 'flipkart' },
  { patterns: ['myntra'],                   name: 'Myntra',         category: 'Shopping',      emoji: '👗', brand: 'myntra' },
  { patterns: ['ajio'],                     name: 'AJIO',           category: 'Shopping',      emoji: '👘', brand: 'ajio' },
  { patterns: ['meesho'],                   name: 'Meesho',         category: 'Shopping',      emoji: '🛒', brand: 'meesho' },
  { patterns: ['nykaa'],                    name: 'Nykaa',          category: 'Shopping',      emoji: '💄', brand: 'nykaa' },
  { patterns: ['tatacliq'],                 name: 'Tata CLiQ',      category: 'Shopping',      emoji: '🛍️', brand: 'tatacliq' },
  { patterns: ['snapdeal'],                 name: 'Snapdeal',       category: 'Shopping',      emoji: '🏷️', brand: 'snapdeal' },
  { patterns: ['shopsy'],                   name: 'Shopsy',         category: 'Shopping',      emoji: '🛒', brand: 'shopsy' },
  { patterns: ['limeroad'],                 name: 'LimeRoad',       category: 'Shopping',      emoji: '👒', brand: 'limeroad' },
  { patterns: ['firstcry'],                 name: 'FirstCry',       category: 'Shopping',      emoji: '👶', brand: 'firstcry' },
  { patterns: ['pepperfry'],                name: 'Pepperfry',      category: 'Shopping',      emoji: '🛋️', brand: 'pepperfry' },
  { patterns: ['urbanladder'],              name: 'Urban Ladder',   category: 'Shopping',      emoji: '🪑', brand: 'urbanladder' },

  // ── Fashion & Lifestyle ────────────────────────────────────
  { patterns: ['zara'],                     name: 'Zara',           category: 'Shopping',      emoji: '👔', brand: 'zara' },
  { patterns: ['handm', 'h&m'],             name: 'H&M',            category: 'Shopping',      emoji: '🧥', brand: 'hm' },
  { patterns: ['uniqlo'],                   name: 'Uniqlo',         category: 'Shopping',      emoji: '👕', brand: 'uniqlo' },
  { patterns: ['westside'],                 name: 'Westside',       category: 'Shopping',      emoji: '🧢', brand: 'westside' },
  { patterns: ['pantaloon'],                name: 'Pantaloons',     category: 'Shopping',      emoji: '👖', brand: 'pantaloons' },
  { patterns: ['centralfashion', 'central'],name: 'Central',        category: 'Shopping',      emoji: '🏬', brand: 'central' },
  { patterns: ['shoppersstop'],             name: "Shoppers Stop",  category: 'Shopping',      emoji: '🏬', brand: 'shoppersstop' },
  { patterns: ['lifestylestyle', 'lifestyle'], name: 'Lifestyle',   category: 'Shopping',      emoji: '👠', brand: 'lifestyle' },
  { patterns: ['puma'],                     name: 'Puma',           category: 'Shopping',      emoji: '🐾', brand: 'puma' },
  { patterns: ['nike'],                     name: 'Nike',           category: 'Shopping',      emoji: '✔️', brand: 'nike' },
  { patterns: ['adidas'],                   name: 'Adidas',         category: 'Shopping',      emoji: '3️⃣', brand: 'adidas' },
  { patterns: ['reebok'],                   name: 'Reebok',         category: 'Shopping',      emoji: '🏃', brand: 'reebok' },
  { patterns: ['skechers'],                 name: 'Skechers',       category: 'Shopping',      emoji: '👟', brand: 'skechers' },
  { patterns: ['decathlon'],                name: 'Decathlon',      category: 'Shopping',      emoji: '🏋️', brand: 'decathlon' },
  { patterns: ['crocs'],                    name: 'Crocs',          category: 'Shopping',      emoji: '🥿', brand: 'crocs' },

  // ── Grocery & Hypermarket ──────────────────────────────────
  { patterns: ['dmart'],                    name: 'DMart',          category: 'Shopping',      emoji: '🛒', brand: 'dmart' },
  { patterns: ['reliancefresh', 'reliancesmart'], name: 'Reliance Smart', category: 'Shopping', emoji: '🧴', brand: 'reliancesmart' },
  { patterns: ['moreonline', 'moreretail'], name: 'More',           category: 'Shopping',      emoji: '🛒', brand: 'more' },
  { patterns: ['spar'],                     name: 'SPAR',           category: 'Shopping',      emoji: '🛒', brand: 'spar' },
  { patterns: ['hypercity'],                name: 'HyperCity',      category: 'Shopping',      emoji: '🏬', brand: 'hypercity' },

  // ── Ride-hailing & Transport ───────────────────────────────
  { patterns: ['uber'],                     name: 'Uber',           category: 'Transport',     emoji: '🚗', brand: 'uber' },
  { patterns: ['olacab', 'olacabs', 'olamoney', 'ola'],
                                            name: 'Ola',            category: 'Transport',     emoji: '🟡', brand: 'ola' },
  { patterns: ['rapido'],                   name: 'Rapido',         category: 'Transport',     emoji: '🛵', brand: 'rapido' },
  { patterns: ['nammayatri', 'yatri'],      name: 'Namma Yatri',   category: 'Transport',     emoji: '🚕', brand: 'nammayatri' },
  { patterns: ['bounce'],                   name: 'Bounce',         category: 'Transport',     emoji: '🛴', brand: 'bounce' },
  { patterns: ['yulu'],                     name: 'Yulu',           category: 'Transport',     emoji: '🚲', brand: 'yulu' },
  { patterns: ['bluebirdbike', 'vogo'],     name: 'Vogo',           category: 'Transport',     emoji: '🛵', brand: 'vogo' },

  // ── Travel & Airlines ──────────────────────────────────────
  { patterns: ['irctc'],                    name: 'IRCTC',          category: 'Transport',     emoji: '🚆', brand: 'irctc' },
  { patterns: ['indigo', 'interglobe'],     name: 'IndiGo',         category: 'Transport',     emoji: '✈️', brand: 'indigo' },
  { patterns: ['airindia'],                 name: 'Air India',      category: 'Transport',     emoji: '✈️', brand: 'airindia' },
  { patterns: ['spicejet'],                 name: 'SpiceJet',       category: 'Transport',     emoji: '✈️', brand: 'spicejet' },
  { patterns: ['vistara'],                  name: 'Vistara',        category: 'Transport',     emoji: '✈️', brand: 'vistara' },
  { patterns: ['goair', 'goindigo'],        name: 'Go First',       category: 'Transport',     emoji: '✈️', brand: 'gofirst' },
  { patterns: ['akasaair', 'akasa'],        name: 'Akasa Air',      category: 'Transport',     emoji: '✈️', brand: 'akasa' },
  { patterns: ['makemytrip', 'mmt'],        name: 'MakeMyTrip',     category: 'Transport',     emoji: '🗺️', brand: 'makemytrip' },
  { patterns: ['goibibo'],                  name: 'Goibibo',        category: 'Transport',     emoji: '🏨', brand: 'goibibo' },
  { patterns: ['cleartrip'],                name: 'Cleartrip',      category: 'Transport',     emoji: '✈️', brand: 'cleartrip' },
  { patterns: ['easemytrip', 'emt'],        name: 'EaseMyTrip',     category: 'Transport',     emoji: '✈️', brand: 'easemytrip' },
  { patterns: ['redbus'],                   name: 'RedBus',         category: 'Transport',     emoji: '🚌', brand: 'redbus' },
  { patterns: ['abhibus'],                  name: 'AbhiBus',        category: 'Transport',     emoji: '🚌', brand: 'abhibus' },
  { patterns: ['oyo'],                      name: 'OYO',            category: 'Transport',     emoji: '🏨', brand: 'oyo' },
  { patterns: ['airbnb'],                   name: 'Airbnb',         category: 'Transport',     emoji: '🏡', brand: 'airbnb' },
  { patterns: ['zostel'],                   name: 'Zostel',         category: 'Transport',     emoji: '🏕️', brand: 'zostel' },
  { patterns: ['petrol', 'iocl', 'hpcl', 'bpcl', 'fuel', 'indianoil'],
                                            name: 'Fuel',           category: 'Transport',     emoji: '⛽', brand: 'fuel' },
  { patterns: ['fastag'],                   name: 'FASTag',         category: 'Transport',     emoji: '🛣️', brand: 'fastag' },

  // ── Streaming & Entertainment ──────────────────────────────
  { patterns: ['netflix'],                  name: 'Netflix',        category: 'Subscription',  emoji: '📺', brand: 'netflix' },
  { patterns: ['spotify'],                  name: 'Spotify',        category: 'Subscription',  emoji: '🎵', brand: 'spotify' },
  { patterns: ['hotstar', 'disneyplus', 'disney+'],
                                            name: 'Disney+ Hotstar',category: 'Subscription',  emoji: '🎬', brand: 'hotstar' },
  { patterns: ['primevideo', 'amazonprime'],name: 'Amazon Prime',   category: 'Subscription',  emoji: '📦', brand: 'prime' },
  { patterns: ['sonyliv'],                  name: 'SonyLIV',        category: 'Subscription',  emoji: '📡', brand: 'sonyliv' },
  { patterns: ['zee5'],                     name: 'ZEE5',           category: 'Subscription',  emoji: '📺', brand: 'zee5' },
  { patterns: ['mxplayer', 'mxshare'],      name: 'MX Player',      category: 'Subscription',  emoji: '▶️', brand: 'mxplayer' },
  { patterns: ['voot'],                     name: 'Voot',           category: 'Subscription',  emoji: '📺', brand: 'voot' },
  { patterns: ['aha'],                      name: 'aha',            category: 'Subscription',  emoji: '📺', brand: 'aha' },
  { patterns: ['jiocinema'],                name: 'JioCinema',      category: 'Subscription',  emoji: '🎞️', brand: 'jiocinema' },
  { patterns: ['appletv', 'applemusic'],    name: 'Apple',          category: 'Subscription',  emoji: '🍎', brand: 'apple' },
  { patterns: ['youtubepremium', 'googleyoutube'],
                                            name: 'YouTube Premium',category: 'Subscription',  emoji: '▶️', brand: 'youtube' },

  // ── Telecom ────────────────────────────────────────────────
  { patterns: ['airtelxstream', 'airtelpayment', 'bhartiairtel', 'airtel'],
                                            name: 'Airtel',         category: 'Subscription',  emoji: '📶', brand: 'airtel' },
  { patterns: ['jiorecharge', 'reljioinfocomm', 'rjil', 'jio'],
                                            name: 'Jio',            category: 'Subscription',  emoji: '📶', brand: 'jio' },
  { patterns: ['vodafone', 'viindia', 'vil', 'idea'],
                                            name: 'Vi (Vodafone)',  category: 'Subscription',  emoji: '📶', brand: 'vi' },
  { patterns: ['bsnl'],                     name: 'BSNL',           category: 'Subscription',  emoji: '📡', brand: 'bsnl' },
  { patterns: ['act', 'actfibernet'],       name: 'ACT Fibernet',   category: 'Utilities',     emoji: '🌐', brand: 'act' },
  { patterns: ['hathway'],                  name: 'Hathway',        category: 'Utilities',     emoji: '🌐', brand: 'hathway' },
  { patterns: ['tatasky', 'tataplay'],      name: 'Tata Play',      category: 'Subscription',  emoji: '📡', brand: 'tataplay' },

  // ── Software & Productivity ────────────────────────────────
  { patterns: ['microsoftoffice', 'microsoft365', 'msoft', 'microsoft'],
                                            name: 'Microsoft',      category: 'Subscription',  emoji: '🪟', brand: 'microsoft' },
  { patterns: ['googleone', 'googlepay', 'googlecloud', 'google'],
                                            name: 'Google',         category: 'Subscription',  emoji: '🔵', brand: 'google' },
  { patterns: ['notion'],                   name: 'Notion',         category: 'Subscription',  emoji: '📝', brand: 'notion' },
  { patterns: ['canva'],                    name: 'Canva',          category: 'Subscription',  emoji: '🎨', brand: 'canva' },
  { patterns: ['figma'],                    name: 'Figma',          category: 'Subscription',  emoji: '🖊️', brand: 'figma' },
  { patterns: ['github'],                   name: 'GitHub',         category: 'Subscription',  emoji: '🐙', brand: 'github' },
  { patterns: ['digitalocean'],             name: 'DigitalOcean',   category: 'Subscription',  emoji: '🌊', brand: 'digitalocean' },
  { patterns: ['awsamazon', 'amazonaws'],   name: 'AWS',            category: 'Subscription',  emoji: '☁️', brand: 'aws' },
  { patterns: ['dropbox'],                  name: 'Dropbox',        category: 'Subscription',  emoji: '📦', brand: 'dropbox' },
  { patterns: ['zoom'],                     name: 'Zoom',           category: 'Subscription',  emoji: '📹', brand: 'zoom' },
  { patterns: ['slack'],                    name: 'Slack',          category: 'Subscription',  emoji: '💬', brand: 'slack' },
  { patterns: ['adobecreative', 'adobe'],   name: 'Adobe',          category: 'Subscription',  emoji: '🖌️', brand: 'adobe' },
  { patterns: ['chatgpt', 'openai'],        name: 'OpenAI',         category: 'Subscription',  emoji: '🤖', brand: 'openai' },
  { patterns: ['grammarly'],                name: 'Grammarly',      category: 'Subscription',  emoji: '✍️', brand: 'grammarly' },

  // ── Healthcare ─────────────────────────────────────────────
  { patterns: ['apollopharmacy', 'apollohealth', 'apollohospital', 'apollo'],
                                            name: 'Apollo',         category: 'Healthcare',    emoji: '🏥', brand: 'apollo' },
  { patterns: ['medplus'],                  name: 'MedPlus',        category: 'Healthcare',    emoji: '💊', brand: 'medplus' },
  { patterns: ['1mg', 'onemg', 'tata1mg'], name: '1mg',            category: 'Healthcare',    emoji: '💊', brand: '1mg' },
  { patterns: ['netmeds'],                  name: 'Netmeds',        category: 'Healthcare',    emoji: '💊', brand: 'netmeds' },
  { patterns: ['pharmeasy'],                name: 'PharmEasy',      category: 'Healthcare',    emoji: '💊', brand: 'pharmeasy' },
  { patterns: ['practo'],                   name: 'Practo',         category: 'Healthcare',    emoji: '👨‍⚕️', brand: 'practo' },
  { patterns: ['lybrate'],                  name: 'Lybrate',        category: 'Healthcare',    emoji: '🩺', brand: 'lybrate' },
  { patterns: ['healthians'],               name: 'Healthians',     category: 'Healthcare',    emoji: '🧪', brand: 'healthians' },
  { patterns: ['thyrocare'],                name: 'Thyrocare',      category: 'Healthcare',    emoji: '🧪', brand: 'thyrocare' },
  { patterns: ['mfine'],                    name: 'mfine',          category: 'Healthcare',    emoji: '🩺', brand: 'mfine' },
  { patterns: ['cultfit', 'cult.fit'],      name: 'Cult.fit',       category: 'Healthcare',    emoji: '🏋️', brand: 'cultfit' },
  { patterns: ['healthifyme'],              name: 'HealthifyMe',    category: 'Healthcare',    emoji: '🥗', brand: 'healthifyme' },
  { patterns: ['aarogyasri'],               name: 'Aarogya Setu',   category: 'Healthcare',    emoji: '🩺', brand: 'aarogyasetu' },

  // ── Finance & Investment ───────────────────────────────────
  { patterns: ['groww'],                    name: 'Groww',          category: 'Finance',       emoji: '📈', brand: 'groww' },
  { patterns: ['zerodha', 'zrodha'],        name: 'Zerodha',        category: 'Finance',       emoji: '💹', brand: 'zerodha' },
  { patterns: ['upstox'],                   name: 'Upstox',         category: 'Finance',       emoji: '📊', brand: 'upstox' },
  { patterns: ['angelbroking', 'angelone'], name: 'Angel One',      category: 'Finance',       emoji: '📈', brand: 'angelone' },
  { patterns: ['5paisa'],                   name: '5paisa',         category: 'Finance',       emoji: '💰', brand: '5paisa' },
  { patterns: ['smallcase'],                name: 'Smallcase',      category: 'Finance',       emoji: '📦', brand: 'smallcase' },
  { patterns: ['kuvera'],                   name: 'Kuvera',         category: 'Finance',       emoji: '📈', brand: 'kuvera' },
  { patterns: ['indmoney'],                 name: 'INDmoney',       category: 'Finance',       emoji: '💵', brand: 'indmoney' },
  { patterns: ['motilaloswal', 'motilal'],  name: 'Motilal Oswal',  category: 'Finance',       emoji: '📊', brand: 'motilal' },
  { patterns: ['navi'],                     name: 'Navi',           category: 'Finance',       emoji: '💳', brand: 'navi' },
  { patterns: ['lic', 'licofind'],          name: 'LIC',            category: 'Finance',       emoji: '🛡️', brand: 'lic' },
  { patterns: ['hdfclife'],                 name: 'HDFC Life',      category: 'Finance',       emoji: '🛡️', brand: 'hdfclife' },
  { patterns: ['iciciprudential', 'icicipru'],
                                            name: 'ICICI Prudential',category: 'Finance',      emoji: '🛡️', brand: 'icicipru' },
  { patterns: ['bajajfinserv', 'bajajfin'], name: 'Bajaj Finserv',  category: 'Finance',       emoji: '💳', brand: 'bajajfinserv' },
  { patterns: ['sbilife'],                  name: 'SBI Life',       category: 'Finance',       emoji: '🛡️', brand: 'sbilife' },
  { patterns: ['policybazaar'],             name: 'Policybazaar',   category: 'Finance',       emoji: '📋', brand: 'policybazaar' },
  { patterns: ['cred'],                     name: 'CRED',           category: 'Finance',       emoji: '💳', brand: 'cred' },
  { patterns: ['slice'],                    name: 'Slice',          category: 'Finance',       emoji: '💳', brand: 'slice' },
  { patterns: ['lazypay'],                  name: 'LazyPay',        category: 'Finance',       emoji: '💳', brand: 'lazypay' },
  { patterns: ['simpl'],                    name: 'Simpl',          category: 'Finance',       emoji: '💳', brand: 'simpl' },
  { patterns: ['mobikwik'],                 name: 'MobiKwik',       category: 'Finance',       emoji: '💳', brand: 'mobikwik' },
  { patterns: ['freecharge'],               name: 'Freecharge',     category: 'Finance',       emoji: '⚡', brand: 'freecharge' },
  { patterns: ['jupiter'],                  name: 'Jupiter',        category: 'Finance',       emoji: '🪐', brand: 'jupiter' },
  { patterns: ['fifimoney', 'epifi'],       name: 'Fi Money',       category: 'Finance',       emoji: '💚', brand: 'fi' },
  { patterns: ['niyo'],                     name: 'Niyo',           category: 'Finance',       emoji: '💙', brand: 'niyo' },
  { patterns: ['razorpay'],                 name: 'Razorpay',       category: 'Finance',       emoji: '⚡', brand: 'razorpay' },
  { patterns: ['paytm'],                    name: 'Paytm',          category: 'Finance',       emoji: '🔵', brand: 'paytm' },
  { patterns: ['phonepe'],                  name: 'PhonePe',        category: 'Finance',       emoji: '💜', brand: 'phonepe' },
  { patterns: ['gpay', 'googlepay', 'tez'], name: 'Google Pay',     category: 'Finance',       emoji: '🔵', brand: 'gpay' },
  { patterns: ['amazonpay'],                name: 'Amazon Pay',     category: 'Finance',       emoji: '💛', brand: 'amazonpay' },
  { patterns: ['bhim'],                     name: 'BHIM',           category: 'Finance',       emoji: '🇮🇳', brand: 'bhim' },

  // ── Education ──────────────────────────────────────────────
  { patterns: ['byjus', 'byju'],            name: "BYJU'S",         category: 'Subscription',  emoji: '📚', brand: 'byjus' },
  { patterns: ['unacademy'],                name: 'Unacademy',      category: 'Subscription',  emoji: '📖', brand: 'unacademy' },
  { patterns: ['vedantu'],                  name: 'Vedantu',        category: 'Subscription',  emoji: '📐', brand: 'vedantu' },
  { patterns: ['whitehatjr', 'whitehat'],   name: 'WhiteHat Jr',    category: 'Subscription',  emoji: '👩‍💻', brand: 'whitehatjr' },
  { patterns: ['coursera'],                 name: 'Coursera',       category: 'Subscription',  emoji: '🎓', brand: 'coursera' },
  { patterns: ['udemy'],                    name: 'Udemy',          category: 'Subscription',  emoji: '🎓', brand: 'udemy' },
  { patterns: ['skillshare'],               name: 'Skillshare',     category: 'Subscription',  emoji: '✏️', brand: 'skillshare' },
  { patterns: ['physicswallah', 'pw'],      name: 'Physics Wallah', category: 'Subscription',  emoji: '⚛️', brand: 'pw' },

  // ── Entertainment & Events ─────────────────────────────────
  { patterns: ['bookmyshow', 'bms'],        name: 'BookMyShow',     category: 'Entertainment', emoji: '🎟️', brand: 'bookmyshow' },
  { patterns: ['pvr'],                      name: 'PVR Cinemas',    category: 'Entertainment', emoji: '🎬', brand: 'pvr' },
  { patterns: ['inox'],                     name: 'INOX',           category: 'Entertainment', emoji: '🎬', brand: 'inox' },
  { patterns: ['steamgames', 'steampowered'], name: 'Steam',        category: 'Entertainment', emoji: '🎮', brand: 'steam' },
  { patterns: ['epicgames'],                name: 'Epic Games',     category: 'Entertainment', emoji: '🎮', brand: 'epicgames' },
  { patterns: ['sonypsl', 'playstation'],   name: 'PlayStation',    category: 'Entertainment', emoji: '🎮', brand: 'playstation' },
  { patterns: ['xboxgamepass', 'microsoft'],name: 'Xbox',           category: 'Entertainment', emoji: '🎮', brand: 'xbox' },
  { patterns: ['ludo', 'mpl', 'winzo'],     name: 'Gaming App',     category: 'Entertainment', emoji: '🎯', brand: 'gaming' },

  // ── Utilities & Bills ──────────────────────────────────────
  { patterns: ['bescom', 'electricity', 'powerbill', 'ebill'],
                                            name: 'Electricity Bill',category: 'Utilities',    emoji: '⚡', brand: 'electricity' },
  { patterns: ['bwssb', 'waterboard', 'waterbill'],
                                            name: 'Water Bill',     category: 'Utilities',     emoji: '💧', brand: 'water' },
  { patterns: ['piped gas', 'gas bill', 'indraprastha gas', 'igt', 'mgl'],
                                            name: 'Gas Bill',       category: 'Utilities',     emoji: '🔥', brand: 'gas' },
  { patterns: ['msedcl', 'tneb', 'wbsedcl', 'tsspdcl'],
                                            name: 'Electricity Board',category: 'Utilities',   emoji: '⚡', brand: 'eb' },
  { patterns: ['bbmppropertytax', 'propertytax'],
                                            name: 'Property Tax',   category: 'Utilities',     emoji: '🏠', brand: 'propertytax' },
  { patterns: ['sulekha'],                  name: 'Sulekha',        category: 'Utilities',     emoji: '🔧', brand: 'sulekha' },
  { patterns: ['urbanclap', 'urbancompany'],name: 'Urban Company',  category: 'Utilities',     emoji: '🔧', brand: 'urbancompany' },
  { patterns: ['nobroker'],                 name: 'NoBroker',       category: 'Utilities',     emoji: '🏠', brand: 'nobroker' },
  { patterns: ['magicbricks'],              name: 'MagicBricks',    category: 'Utilities',     emoji: '🏗️', brand: 'magicbricks' },
  { patterns: ['99acres'],                  name: '99acres',        category: 'Utilities',     emoji: '🏡', brand: '99acres' },

  // ── Income & Transfers ─────────────────────────────────────
  { patterns: ['salary', 'salcredit', 'salarydeposit'],
                                            name: 'Salary',         category: 'Income',        emoji: '💰', brand: 'salary' },
  { patterns: ['freelance'],                name: 'Freelance Income',category: 'Income',       emoji: '💼', brand: 'freelance' },
  { patterns: ['refund'],                   name: 'Refund',         category: 'Income',        emoji: '↩️', brand: 'refund' },
  { patterns: ['cashback'],                 name: 'Cashback',       category: 'Income',        emoji: '🎁', brand: 'cashback' },
  { patterns: ['dividend'],                 name: 'Dividend',       category: 'Income',        emoji: '📈', brand: 'dividend' },
  { patterns: ['interest', 'intpaid'],      name: 'Interest',       category: 'Income',        emoji: '🏦', brand: 'interest' },

  // ── ATM & Cash ─────────────────────────────────────────────
  { patterns: ['atm', 'atmwdl', 'atmwithdraw', 'cashwithdraw'],
                                            name: 'ATM Withdrawal', category: 'Cash & ATM',    emoji: '🏧', brand: 'atm' },
  { patterns: ['cashdeposit', 'cdm'],       name: 'Cash Deposit',   category: 'Cash & ATM',    emoji: '💵', brand: 'cashdeposit' },
];

// strip the garbage out of a raw bank description before trying to match
function cleanRaw(raw: string): string {
  return raw
    .toLowerCase()
    // Remove UPI VPA addresses (xxx@okhdfcbank, xx@ybl, etc.)
    .replace(/\w+@\w+/g, '')
    // Remove pure-numeric token references (txn IDs, cheque numbers)
    .replace(/\b\d{6,}\b/g, '')
    // Remove NEFT/IMPS/UPI/RTGS prefix tokens
    .replace(/^(neft|imps|rtgs|upi|nach|ecs|int|pos|inf|mmt)[\/\-\s]*/i, '')
    // Remove trailing Cr / Dr indicators
    .replace(/\s+(cr|dr)\s*$/i, '')
    // Remove common bank suffixes (city names, branch names)
    .replace(/\b(mumbai|delhi|bangalore|bengaluru|chennai|hyderabad|pune|kolkata|ahmedabad|surat|jaipur)\b/gi, '')
    // Remove special chars except letters and numbers
    .replace(/[^a-z0-9\s]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, '')
    .trim();
}

const cache = new Map<string, MerchantInfo>(); // avoid re-processing the same string

export function normalizeMerchant(rawDescription: string): MerchantInfo {
  const cacheKey = rawDescription.trim();
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const cleaned = cleanRaw(rawDescription);

  // Scan merchant map for best match
  // Longer pattern wins ties (more specific match)
  let bestMatch: MerchantEntry | null = null;
  let bestPatternLen = 0;

  for (const entry of MERCHANT_MAP) {
    for (const pattern of entry.patterns) {
      const normPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleaned.includes(normPattern) && normPattern.length > bestPatternLen) {
        bestMatch = entry;
        bestPatternLen = normPattern.length;
      }
    }
  }

  const result: MerchantInfo = bestMatch
    ? {
        raw:      rawDescription,
        name:     bestMatch.name,
        category: bestMatch.category,
        emoji:    bestMatch.emoji,
        brand:    bestMatch.brand,
        matched:  true,
      }
    : {
        raw:      rawDescription,
        // Clean up the raw string for display when no match
        name:     toTitleCase(rawDescription
          .replace(/UPI\/?\s*/gi, '')
          .replace(/NEFT\/?\s*/gi, '')
          .replace(/IMPS\/?\s*/gi, '')
          .replace(/\s*\d{6,}\s*/g, '')
          .replace(/\w+@\w+/g, '')
          .replace(/[*\/\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 40)
        ),
        category: 'Uncategorized',
        emoji:    '💳',
        brand:    '',
        matched:  false,
      };

  cache.set(cacheKey, result);
  return result;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Lookup a merchant by its brand slug (for deduplication in charts) */
export function getMerchantByBrand(brand: string): MerchantEntry | undefined {
  return MERCHANT_MAP.find(m => m.brand === brand);
}

/** Get all known brands for a given category */
export function getMerchantsForCategory(category: string): MerchantEntry[] {
  return MERCHANT_MAP.filter(m => m.category === category);
}
