import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Default categories to initialize
const defaultCategories = [
  // Food categories
  { name: 'Biryani', icon: '🍛', category: 'food', subcategory: 'biryani', displayName: 'Biryani' },
  { name: 'Pizzas', icon: '🍕', category: 'food', subcategory: 'pizzas', displayName: 'Pizzas' },
  { name: 'Chinese', icon: '🥡', category: 'food', subcategory: 'chinese', displayName: 'Chinese' },
  { name: 'Burgers', icon: '🍔', category: 'food', subcategory: 'burgers', displayName: 'Burgers' },
  { name: 'Indian', icon: '🍛', category: 'food', subcategory: 'indian', displayName: 'Indian' },
  { name: 'Desserts', icon: '🍰', category: 'food', subcategory: 'desserts', displayName: 'Desserts' },
  
  // Daily Essentials categories
  { name: 'Staples', icon: '🌾', category: 'daily_essential', subcategory: 'staples', displayName: 'Staples' },
  { name: 'Snacks', icon: '🍿', category: 'daily_essential', subcategory: 'snacks', displayName: 'Snacks' },
  { name: 'Beverages', icon: '🥤', category: 'daily_essential', subcategory: 'beverages', displayName: 'Beverages' },
  { name: 'Personal Care', icon: '🧴', category: 'daily_essential', subcategory: 'personal_care', displayName: 'Personal Care' },
  { name: 'Household', icon: '🏠', category: 'daily_essential', subcategory: 'household', displayName: 'Household' },
  
  // Drinks categories
  { name: 'All', icon: '🌐', category: 'drinks', subcategory: 'all', displayName: 'All' },
  { name: 'Beer', icon: '🍺', category: 'drinks', subcategory: 'beer', displayName: 'Beer' },
  { name: 'Wine', icon: '🍷', category: 'drinks', subcategory: 'wine', displayName: 'Wine' },
  { name: 'Spirits', icon: '🥃', category: 'drinks', subcategory: 'spirits', displayName: 'Spirits' },
  { name: 'Cocktails', icon: '🍹', category: 'drinks', subcategory: 'cocktails', displayName: 'Cocktails' }
];

export const initializeCategories = async () => {
  try {
    console.log('🚀 Starting category initialization...');
    
    // Check if categories already exist
    const existingCategories = await getDocs(collection(db, 'categories'));
    
    console.log('📊 Existing categories found:', existingCategories.size);
    
    if (!existingCategories.empty) {
      console.log('✅ Categories already exist, skipping initialization');
      existingCategories.docs.forEach(doc => {
        console.log('  -', doc.data().name, '(', doc.data().category, ')');
      });
      return;
    }
    
    console.log('🆕 No categories found, creating default categories...');
    
    // Add default categories
    const promises = defaultCategories.map(async (category) => {
      try {
        const docRef = await addDoc(collection(db, 'categories'), {
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Added category: ${category.name} (ID: ${docRef.id})`);
        return docRef;
      } catch (error) {
        console.error(`❌ Error adding category ${category.name}:`, error);
        throw error;
      }
    });
    
    await Promise.all(promises);
    console.log('🎉 Default categories initialized successfully!');
    
  } catch (error) {
    console.error('💥 Error initializing categories:', error);
  }
};

// Function to check if a category exists
export const categoryExists = async (name: string, category: string) => {
  try {
    const q = query(
      collection(db, 'categories'), 
      where('name', '==', name),
      where('category', '==', category)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking category existence:', error);
    return false;
  }
}; 