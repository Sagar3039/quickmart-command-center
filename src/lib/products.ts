import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export const PRODUCT_CATEGORIES = {
  FOOD: 'food',
  DAILY_ESSENTIALS: 'daily_essential',
  DRINKS: 'drinks'
} as const;

export const PRODUCT_SUBCATEGORIES = {
  PIZZAS: 'Pizzas',
  BIRYANI: 'Biryani',
  CHINESE: 'Chinese',
  BURGERS: 'Burgers',
  INDIAN: 'Indian',
  DESSERTS: 'Desserts',
  STAPLES: 'Staples',
  SNACKS: 'Snacks',
  BEVERAGES: 'Beverages',
  PERSONAL_CARE: 'Personal Care',
  HOUSEHOLD: 'Household',
  ALL: 'All',
  BEER: 'Beer',
  WINE: 'Wine',
  SPIRITS: 'Spirits',
  COCKTAILS: 'Cocktails'
} as const;

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  deliveryTime: string;
  inStock: boolean;
  rating: number;
  tags: string[];
  discount?: string;
  offer?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get products by category with real-time updates
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(collection(db, 'products'), where('category', '==', category));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Get all products with real-time updates
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

// Subscribe to products by category with real-time updates
export const subscribeToProductsByCategory = (
  category: string, 
  callback: (products: Product[]) => void
) => {
  try {
    const q = query(collection(db, 'products'), where('category', '==', category));
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[];
      
      callback(products);
    }, (error) => {
      console.error('Error in products subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up products subscription:', error);
    throw error;
  }
};

// Subscribe to all products with real-time updates
export const subscribeToAllProducts = (
  callback: (products: Product[]) => void
) => {
  try {
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[];
      
      callback(products);
    }, (error) => {
      console.error('Error in products subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up products subscription:', error);
    throw error;
  }
}; 