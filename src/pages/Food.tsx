import React, { useState, useEffect } from 'react';
import { Search, Star, Heart, Mic, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductQuickView from '@/components/ProductQuickView';
import { subscribeToProductsByCategory, PRODUCT_CATEGORIES, PRODUCT_SUBCATEGORIES, type Product } from '@/lib/products';
import { useTheme } from '@/App';
import { useFirebaseCollection } from '@/hooks/useFirebaseData';
import { initializeCategories } from '@/lib/initializeCategories';
import { compareSubcategories } from '@/lib/utils';

const Food = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories from Firestore
  const { data: categoriesData, loading: categoriesLoading } = useFirebaseCollection('categories');

  // Dynamically generate categories from products and Firestore
  const getDynamicCategories = () => {
    const allSubcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    const defaultCategories = ['Pizzas', 'Biryani', 'Chinese', 'Burgers', 'Indian', 'Desserts'];
    
    // Get categories from Firestore
    const firestoreCategories = categoriesData
      .filter(cat => cat.category === 'food')
      .map(cat => cat.name);
    
    // Combine default categories with Firestore categories and product subcategories
    const combinedCategories = [...new Set([...defaultCategories, ...firestoreCategories, ...allSubcategories])];
    
    // Sort categories alphabetically (excluding 'All')
    const sortedCategories = combinedCategories
      .filter(cat => cat.toLowerCase() !== 'all')
      .sort((a, b) => a.localeCompare(b));
    
    console.log('Categories Debug:', {
      defaultCategories,
      firestoreCategories,
      allSubcategories,
      combinedCategories: sortedCategories,
      categoriesDataLength: categoriesData.length
    });
    
    return ['All', ...sortedCategories];
  };

  const foodCategories = getDynamicCategories();

  // Dynamic category icons - add default icons for new categories
  const getCategoryIcon = (category: string) => {
    const defaultIcons: {[key: string]: string} = {
      'All': '🌐',
      'Pizzas': '🍕',
      'Biryani': '🍛',
      'Chinese': '🥡',
      'Burgers': '🍔',
      'Indian': '🍛',
      'Desserts': '🍰'
    };
    
    // Check if category exists in Firestore with custom icon
    const firestoreCategory = categoriesData.find(cat => cat.name === category && cat.category === 'food');
    if (firestoreCategory && firestoreCategory.icon) {
      return firestoreCategory.icon;
    }
    
    return defaultIcons[category] || '🍽️'; // Default food icon for custom categories
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Enhanced subcategory matching with better case handling
    let matchesCategory = true;
    if (activeCategory !== 'All') {
      if (!product.subcategory) {
        matchesCategory = false;
      } else {
        // Use utility function for consistent comparison
        matchesCategory = compareSubcategories(product.subcategory, activeCategory);
      }
    }
    
    // Debug logging
    if (activeCategory !== 'All') {
      console.log(`Product: ${product.name}, Subcategory: ${product.subcategory}, Active Category: ${activeCategory}, Matches: ${matchesCategory}`);
    }
    
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart!`);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const loadProducts = () => {
    setIsLoading(true);
    try {
      console.log('Setting up real-time listener for food products...');
      
      // Use real-time subscription instead of one-time fetch
      const unsubscribe = subscribeToProductsByCategory(PRODUCT_CATEGORIES.FOOD, (foodProducts) => {
        console.log('Food products updated:', foodProducts.length);
        setProducts(foodProducts);
        setIsLoading(false);
      });

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading food products:', error);
      toast.error('Failed to load products');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = loadProducts();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('quicklymart-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    console.log('Food page useEffect triggered, location.state:', location.state);
    if (location.state?.category) {
        const categoryExists = foodCategories.includes(location.state.category);
        if (categoryExists) {
            setActiveCategory(location.state.category);
        }
    }
  }, [location.state?.category]);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('quicklymart-cart', JSON.stringify(cart));
  }, [cart]);

  // Debug categories loading
  useEffect(() => {
    console.log('Categories data updated:', categoriesData);
    console.log('Categories loading:', categoriesLoading);
    
    // Debug: Log all products and their subcategories
    console.log('All products and their subcategories:');
    products.forEach(product => {
      console.log(`Product: ${product.name}, Subcategory: "${product.subcategory}"`);
    });
    
    // Debug: Log all available subcategories
    const allSubcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    console.log('All available subcategories:', allSubcategories);
    
    // Debug: Log food categories from Firestore
    const firestoreFoodCategories = categoriesData.filter(cat => cat.category === 'food');
    console.log('Firestore food categories:', firestoreFoodCategories);
  }, [categoriesData, categoriesLoading, products]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className='flex items-center gap-2'>
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Food</h1>
            </div>
            <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🧪 Manual category initialization triggered');
                    initializeCategories().then(() => {
                      console.log('✅ Manual initialization complete');
                    }).catch(console.error);
                  }}
                  className="text-xs"
                >
                  🧪 Init Categories
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 dark:text-gray-300"
                  onClick={toggleDarkMode}
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                <Search className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <Mic className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-28 bg-gray-50 dark:bg-gray-800 h-full fixed top-16 left-0 overflow-y-auto pb-16">
          <nav>
            <ul>
              {foodCategories.map((category, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-center p-3 text-sm font-medium border-l-4 ${activeCategory === category ? 'border-blue-500 bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <div className="text-2xl mb-1 mx-auto">{getCategoryIcon(category)}</div>
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="ml-28 p-4 flex-1 mb-16">
            <Input
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl text-md w-full mb-4 dark:text-white dark:placeholder-gray-400"
            />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{activeCategory}</h2>
            
            {/* Debug Panel */}
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Categories Loading:</strong> {categoriesLoading ? 'Yes' : 'No'}<br/>
                  <strong>Categories Count:</strong> {categoriesData.length}<br/>
                  <strong>Food Categories:</strong> {categoriesData.filter(c => c.category === 'food').length}<br/>
                  <strong>Sidebar Categories:</strong> {foodCategories.length}
                </div>
                <div>
                  <strong>Products Count:</strong> {products.length}<br/>
                  <strong>Products Loading:</strong> {isLoading ? 'Yes' : 'No'}<br/>
                  <strong>Active Category:</strong> {activeCategory}<br/>
                  <strong>Filtered Products:</strong> {filteredProducts.length}
                </div>
              </div>
              <div className="mt-2">
                <strong>Firestore Categories:</strong>
                <div className="max-h-20 overflow-y-auto">
                  {categoriesData.map((cat, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                      {cat.name} ({cat.category})
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <strong>Product Subcategories:</strong>
                <div className="max-h-20 overflow-y-auto">
                  {[...new Set(products.map(p => p.subcategory).filter(Boolean))].map((subcat, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                      "{subcat}"
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <strong>Sidebar Categories:</strong>
                <div className="max-h-20 overflow-y-auto">
                  {foodCategories.map((cat, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded">
                      "{cat}"
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                    <Card 
                    key={product.id} 
                    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow border dark:border-gray-700"
                    onClick={() => handleProductClick(product)}
                    >
                    <div className="relative">
                        <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        />
                        <Button 
                        variant="ghost" 
                        size="sm"
                        className="absolute top-3 right-3 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.success('Added to wishlist!');
                        }}
                        >
                        <Heart className="w-4 h-4" />
                        </Button>
                        {product.discount && (
                        <div className="absolute top-3 left-3 bg-quicklymart-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {product.discount}
                        </div>
                        )}
                        {product.offer && (
                        <div className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {product.offer}
                        </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/80 text-white px-3 py-1 rounded text-sm">
                        ₹{product.price}
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-white">{product.name}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-green-500 text-green-500" />
                            <span className="font-medium text-sm text-gray-600 dark:text-gray-300">{product.rating}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">• {product.deliveryTime}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{product.description}</p>
                        <Button 
                        className="w-full mt-3 bg-quicklymart-orange-500 hover:bg-quicklymart-orange-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                        }}
                        >
                        Add to Cart
                        </Button>
                    </CardContent>
                    </Card>
                ))}
              </div>
            )}
        </main>
      </div>

      <ProductQuickView 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default Food; 