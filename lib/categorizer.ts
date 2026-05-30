/**
 * Keyword-based spend categorizer
 * Maps merchant name keywords to categories
 */

const CATEGORY_MAP: Record<string, string[]> = {
  'Food & Dining': [
    'swiggy', 'zomato', 'dunzo', 'mcdonald', 'domino', 'pizza', 'kfc',
    'subway', 'restaurant', 'cafe', 'food', 'biryani', 'barbeque', 'burger',
    'starbucks', 'chai', 'haldirams', 'hotel', 'dining', 'eats', 'blinkit food',
  ],
  'Transport': [
    'uber', 'ola', 'rapido', 'metro', 'bus', 'auto', 'cab', 'petrol', 'fuel',
    'namma yatri', 'irctc', 'flight', 'indigo', 'spicejet', 'airline',
  ],
  'Shopping': [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'reliance',
    'dmart', 'bigbasket', 'zepto', 'blinkit', 'jiomart', 'shopsy',
  ],
  'Subscription': [
    'netflix', 'spotify', 'hotstar', 'prime', 'zee5', 'sony', 'youtube',
    'jio', 'airtel', 'bsnl', 'notion', 'adobe', 'microsoft', 'apple',
  ],
  'Healthcare': [
    'pharmacy', 'medicine', 'hospital', 'doctor', 'clinic', 'apollo',
    'medplus', '1mg', 'netmeds', 'practo', 'diagnostic',
  ],
  'Utilities': [
    'electricity', 'bescom', 'water', 'gas', 'mahanagar', 'bwssb',
    'maintenance', 'society', 'rent', 'broadband', 'wifi',
  ],
  'Entertainment': [
    'bookmyshow', 'pvr', 'inox', 'game', 'steam', 'playstation', 'xbox',
    'event', 'concert', 'theatre',
  ],
  'Finance': [
    'insurance', 'lic', 'emi', 'loan', 'sip', 'mutual fund', 'groww',
    'zerodha', 'coin', 'ppf', 'nps', 'fd', 'rd',
  ],
  'Income': [
    'salary', 'credit', 'refund', 'cashback', 'interest', 'dividend',
    'transfer received', 'neft cr', 'imps cr',
  ],
  'Cash & ATM': [
    'atm', 'cash withdrawal', 'cash deposit',
  ],
};

export function categorizeTransaction(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'Uncategorized';
}
