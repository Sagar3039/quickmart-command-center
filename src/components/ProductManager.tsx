import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Image,
  Package,
  AlertTriangle,
  Clock,
  Tag,
  RefreshCw
} from "lucide-react";
import { categoryExists } from '@/lib/initializeCategories';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cleanupDuplicateSubcategories } from '@/lib/cleanupDuplicateSubcategories';
import { normalizeSubcategoryName, compareSubcategories } from '@/lib/utils';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

// Move MapLocationPicker definition here, before ProductManager
function MapLocationPicker({ value, onChange }: { value: string, onChange: (loc: string) => void }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: 'AIzaSyC0aUsBjWppu-5sSvme3Zz66Ts9aFKOYRs', libraries: ['places'] });
  const [marker, setMarker] = React.useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = React.useState('');

  const {
    ready,
    value: searchValue,
    setValue: setSearchValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  React.useEffect(() => {
    if (value && typeof value === 'string' && value.includes(',')) {
      const [lat, lng] = value.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) setMarker({ lat, lng });
    }
  }, [value]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      onChange(`${lat},${lng}`);
      setAddress('');
      setSearchValue('');
    }
  };

  const handleSelect = async (address: string) => {
    setSearchValue(address, false);
    setAddress(address);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setMarker({ lat, lng });
      onChange(`${lat},${lng}`);
    } catch (error) {
      // Optionally handle error
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;
  return (
    <div>
      <div className="mb-2">
        <input
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder="Search for a location..."
          className="w-full border rounded px-3 py-2 text-base mb-1"
        />
        {status === 'OK' && (
          <div className="bg-white border rounded shadow max-h-48 overflow-y-auto absolute z-10 w-full">
            {data.map(({ place_id, description }) => (
              <div
                key={place_id}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(description)}
              >
                {description}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ height: 300, width: '100%' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={marker || { lat: 19.0760, lng: 72.8777 }} // Default to Mumbai
          zoom={marker ? 15 : 12}
          onClick={handleMapClick}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
        <div className="text-xs text-gray-500 mt-1">
          {marker ? `Selected: ${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}` : 'Click on the map or search to select a location.'}
        </div>
      </div>
    </div>
  );
}

export function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryTab, setNewSubcategoryTab] = useState<'emoji' | 'url'>('emoji');
  const [newSubcategoryIcon, setNewSubcategoryIcon] = useState('🍽️');
  const [newSubcategoryImage, setNewSubcategoryImage] = useState('');
  const [newSubcategoryImageFile, setNewSubcategoryImageFile] = useState<File | null>(null);
  const [newSubcategoryImagePreview, setNewSubcategoryImagePreview] = useState('');
  const [customSubcategories, setCustomSubcategories] = useState<{[key: string]: string[]}>({
    food: [],
    daily_essential: [],
    drinks: []
  });

  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    subcategory: '',
    price: '',
    stock: '',
    image: '',
    description: '',
    preparationTime: '15-20 mins',
    inStock: true,
    tags: [] as string[],
    newTag: '',
    vegType: 'veg',
    location: '',
    landmark: '', // NEW FIELD
  });

  const { toast } = useToast();

  const { data: productsData, loading: firebaseLoading, error: firebaseError, addDocument, updateDocument, deleteDocument } = useFirebaseCollection('products');
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError, addDocument: addCategoryDocument, updateDocument: updateCategoryDocument, deleteDocument: deleteCategoryDocument } = useFirebaseCollection('categories');

  const [isManageSubDialogOpen, setIsManageSubDialogOpen] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState<any>(null);
  const [editSubcatName, setEditSubcatName] = useState('');
  const [editSubcatIcon, setEditSubcatIcon] = useState('');
  const [editSubcatImage, setEditSubcatImage] = useState('');
  const [editSubcatImageFile, setEditSubcatImageFile] = useState<File | null>(null);
  const [editSubcatImagePreview, setEditSubcatImagePreview] = useState('');
  const [isEditSubDialogOpen, setIsEditSubDialogOpen] = useState(false);
  const [editSubcatTab, setEditSubcatTab] = useState<'emoji' | 'url'>('emoji');

  const [sortOption, setSortOption] = useState('updated'); // 'updated', 'price-desc', 'price-asc', 'stock-desc', 'stock-asc', 'rating'
  const [showOnlyManualProducts, setShowOnlyManualProducts] = useState(true); // Only show manually uploaded products

  const [selectedSubcategory, setSelectedSubcategory] = useState('All');

  // Add state for subcategory management
  const [isDeleteSubDialogOpen, setIsDeleteSubDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<any>(null);

  // Memoized set of auto-generated product names for O(1) lookup
  const autoGeneratedProductSet = React.useMemo(() => new Set([
    'Chocolate Cake',
    'Potato Chips', 
    'Butter Chicken',
    'Basmati Rice',
    'Mojito Cocktail',
    'Domino\'s Pizza',
    'Heineken Beer',
    'China Nation Noodles',
    'Classic Burger',
    'Spice N Ice Biryani',
    'Red Wine',
    'Whiskey',
    'Dish Soap',
    'Toothpaste',
    'Coca Cola',
    // Add more common auto-generated product names
    'Test Product',
    'Sample Product',
    'Demo Product',
    'Example Product'
  ]), []);

  // Category and subcategory mappings
  const categoryOptions = [
    { value: 'food', label: 'Foods', icon: '🍽️', subcategories: ['Biryani', 'Pizzas', 'Chinese', 'Burgers', 'Indian', 'Desserts'] },
    { value: 'daily_essential', label: 'Daily Essentials', icon: '🏠', subcategories: ['Staples', 'Snacks', 'Beverages', 'Personal Care', 'Household'] },
    { value: 'drinks', label: 'Drinks', icon: '🥤', subcategories: [
      { name: 'All', icon: '🌐' },
      { name: 'Beer', icon: '🍺' },
      { name: 'Wine', icon: '🍷' },
      { name: 'Spirits', icon: '🥃' },
      { name: 'Cocktails', icon: '🍹' }
    ]}
  ];

  // Common food icons for selection
  const foodIcons = [
    '🍽️', '🍕', '🍔', '🌮', '🍜', '🍛', '🥪', '🥗', '🍖', '🍗', '🥩', '🥓', '🍳', '🥚', '🥑', '🥦', '🥬', '🥕', '🌽', '🥔', '🍠', '🥐', '🥖', '🥨', '🥯', '🥞', '🧀', '🥛', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍰', '🍫', '🍬', '🍭', '🍮', '🍯', '🥜', '🌰', '🥥', '🥝', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥑', '🥦', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🧉', ''
  ];

  // Memoized helper function to get subcategory options for a category
  const getSubcategoryOptions = React.useCallback((category: string) => {
    const categoryOption = categoryOptions.find(cat => cat.value === category);
    if (!categoryOption) return [];
    
    let baseSubcategories: any[] = [];
    
    if (category === 'drinks') {
      baseSubcategories = (categoryOption.subcategories as Array<{name: string, icon: string}>)
        .filter(sub => sub && typeof sub.name === 'string' && sub.name.trim() !== "")
        .map(sub => ({
        value: sub.name,
        label: `${sub.icon} ${sub.name}`
      }));
    } else {
      baseSubcategories = (categoryOption.subcategories as string[])
        .filter(sub => typeof sub === 'string' && sub.trim() !== "")
        .map(sub => ({
        value: sub,
        label: sub.charAt(0).toUpperCase() + sub.slice(1)
      }));
    }
    
    // Get custom subcategories from Firestore categories collection
    const firestoreCategories = categoriesData
      .filter(cat => cat.category === category && typeof cat.name === 'string' && cat.name.trim() !== "" && cat.name.toLowerCase() !== 'all')
      .map(cat => ({
        value: cat.name,
        label: cat.icon ? `${cat.icon} ${cat.displayName || cat.name}` : cat.displayName || cat.name
      }));
    
    // Combine base and Firestore categories, removing duplicates (case-insensitive)
    const allCategories = [...baseSubcategories, ...firestoreCategories];
    const uniqueCategories = allCategories.filter((cat, index, self) => {
      if (typeof cat.value !== 'string' || cat.value.trim() === '') return false;
      return index === self.findIndex(c => 
        typeof c.value === 'string' && 
        c.value.trim() !== '' && 
        c.value.toLowerCase() === cat.value.toLowerCase()
      );
    });
    
    return uniqueCategories;
  }, [categoriesData]);

  // Memoized helper function to get subcategory display name with icon
  const getSubcategoryDisplay = React.useCallback((subcategory: string, category: string) => {
    if (category === 'drinks') {
      const drinkOption = categoryOptions.find(cat => cat.value === 'drinks');
      if (drinkOption) {
        const drinkSub = (drinkOption.subcategories as Array<{name: string, icon: string}>).find(sub => sub.name === subcategory);
        return drinkSub ? `${drinkSub.icon} ${drinkSub.name}` : subcategory;
      }
    }
    return subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
  }, []);

  // Memoized product processing for better performance
  const processedProducts = React.useMemo(() => {
    // Transform and filter products
    const transformed = productsData
      .map((product) => ({
        id: product.id,
        name: product.name || 'Unknown Product',
        category: product.category || 'food',
        subcategory: product.subcategory || '',
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock) || 0,
        status: product.inStock !== false ? 'active' : 'out-of-stock',
        image: product.image || '/placeholder.svg',
        description: product.description || '',
        deliveryTime: product.deliveryTime || '30-45 mins',
        rating: parseFloat(product.rating) || 4.5,
        tags: product.tags || [],
        lowStock: (parseInt(product.stock) || 0) < 10,
        firebaseId: product.id,
        createdAt: product.createdAt || null,
        updatedAt: product.updatedAt || null,
        manuallyUploaded: product.manuallyUploaded || false,
        vegType: product.vegType || 'veg', // Include vegType
        location: product.location || '', // Include location
      }));

    // Remove duplicates - use both ID and name to ensure uniqueness
    const unique = Array.from(
      new Map(transformed.map(p => [p.firebaseId, p])).values()
    ).filter((product, index, self) => {
      // Additional check to remove any remaining duplicates by name and category
      return index === self.findIndex(p => 
        p.firebaseId === product.firebaseId && 
        p.name === product.name && 
        p.category === product.category
      );
    });

    // Sort products
    const sorted = unique.sort((a, b) => {
      if (sortOption === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortOption === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortOption === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
      if (sortOption === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
      if (sortOption === 'rating') return (b.rating || 0) - (a.rating || 0);
      // Default: updatedAt desc, fallback to createdAt
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    });

    return sorted;
  }, [productsData, sortOption]);

  // Memoized filtered products - filter by category and search
  const filteredProducts = React.useMemo(() => {
    return processedProducts.filter(product => 
      product.category === selectedCategory &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedProducts, selectedCategory, searchTerm]);

  // Memoized categories - only show actual categories, not 'all'
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(productsData.map(p => p.category || 'food')));
    return uniqueCategories.length > 0 ? uniqueCategories : ['food'];
  }, [productsData]);

  // Helper to get icon for category
  const getCategoryIcon = (category) => {
    const cat = categoryOptions.find(c => c.value === category);
    return cat ? cat.icon : '📦';
  };

  // Subcategory filter bar UI (above product grid)
  const subcategoriesForCategory = React.useMemo(() => {
    // Get all subcategories for the selected category from categoriesData
    const subcategoryData = categoriesData
      .filter(cat => 
        cat.category === selectedCategory && 
        typeof cat.name === 'string' && 
        cat.name.trim() !== '' && 
        cat.name.toLowerCase() !== 'all'
      )
      .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
      .map(cat => ({
        name: cat.name,
        icon: cat.icon || '📦',
        displayName: cat.displayName || cat.name
      }));
    
    // Add "All" option at the beginning
    return [
      { name: 'All', icon: '🌐', displayName: 'All' },
      ...subcategoryData
    ];
  }, [categoriesData, selectedCategory]);

  // Reset subcategory filter when category changes
  React.useEffect(() => {
    setSelectedSubcategory('All');
  }, [selectedCategory]);



  const validSubcategories = categoriesData
    .filter(cat => cat.category === formData.category && typeof cat.name === 'string' && cat.name.trim() !== '' && cat.name.toLowerCase() !== 'all')
    .map(cat => cat.name);

  // Add state for landmark validation error
  const [landmarkError, setLandmarkError] = useState('');

  const handleAddProduct = async () => {
    // Enhanced validation for subcategory
    if (!formData.subcategory || formData.subcategory.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a valid subcategory",
        variant: "destructive"
      });
      return;
    }

    // Check if the selected subcategory exists in the categories collection
    const subcategoryExists = categoriesData.some(cat => 
      cat.category === formData.category && 
      cat.name.toLowerCase() === formData.subcategory.toLowerCase()
    );

    if (!subcategoryExists) {
      toast({
        title: "Error",
        description: "Selected subcategory does not exist. Please create it first or select a valid subcategory.",
        variant: "destructive"
      });
      return;
    }

    if ((formData.category === 'food' || formData.category === 'drinks') && !formData.landmark.trim()) {
      setLandmarkError('Landmark is required for food and drinks.');
      return;
    } else {
      setLandmarkError('');
    }

    try {
      // Normalize the subcategory name to match the stored format
      const normalizedSubcategory = normalizeSubcategoryName(formData.subcategory);
      
      const productData = {
        name: formData.name,
        category: formData.category,
        subcategory: normalizedSubcategory,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image: formData.image,
        description: formData.description,
        preparationTime: formData.preparationTime,
        inStock: formData.inStock,
        tags: formData.tags,
        vegType: formData.vegType,
        location: formData.location,
        landmark: formData.landmark,
        manuallyUploaded: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDocument(productData);
      
      toast({
        title: "Success",
        description: "Product added successfully"
      });
      
      setIsAddDialogOpen(false);
      setFormData({ 
        name: '', 
        category: 'food', 
        price: '', 
        stock: '', 
        image: '', 
        description: '', 
        preparationTime: '15-20 mins',
        inStock: true, 
        tags: [], 
        newTag: '',
        subcategory: '',
        vegType: 'veg',
        location: '',
        landmark: '',
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async () => {
    // Enhanced validation for subcategory
    if (!formData.subcategory || formData.subcategory.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a valid subcategory",
        variant: "destructive"
      });
      return;
    }

    // Check if the selected subcategory exists in the categories collection
    const subcategoryExists = categoriesData.some(cat => 
      cat.category === formData.category && 
      cat.name.toLowerCase() === formData.subcategory.toLowerCase()
    );

    if (!subcategoryExists) {
      toast({
        title: "Error",
        description: "Selected subcategory does not exist. Please create it first or select a valid subcategory.",
        variant: "destructive"
      });
      return;
    }

    if ((formData.category === 'food' || formData.category === 'drinks') && !formData.landmark.trim()) {
      setLandmarkError('Landmark is required for food and drinks.');
      return;
    } else {
      setLandmarkError('');
    }

    try {
      // Normalize the subcategory name to match the stored format
      const normalizedSubcategory = normalizeSubcategoryName(formData.subcategory);
      
      const productData = {
        name: formData.name,
        category: formData.category,
        subcategory: normalizedSubcategory,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image: formData.image,
        description: formData.description,
        preparationTime: formData.preparationTime,
        inStock: formData.inStock,
        tags: formData.tags,
        vegType: formData.vegType,
        location: formData.location,
        landmark: formData.landmark,
        updatedAt: new Date()
      };

      await updateDocument(editingProduct.firebaseId, productData);
      
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        category: 'food', 
        price: '', 
        stock: '', 
        image: '', 
        description: '', 
        preparationTime: '15-20 mins',
        inStock: true, 
        tags: [], 
        newTag: '',
        subcategory: '',
        vegType: 'veg',
        location: '',
        landmark: '',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDocument(product.firebaseId);
        toast({
          title: "Success",
          description: "Product deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive"
        });
      }
    }
  };

  const clearAllProducts = async () => {
    if (window.confirm('Are you sure you want to delete ALL existing products? This action cannot be undone.')) {
      try {
        console.log('Starting to delete', productsData.length, 'products...');
        
        // Delete all products from Firestore
        const deletePromises = productsData.map(product => {
          console.log('Deleting product:', product.name, 'with ID:', product.id);
          return deleteDocument(product.id);
        });
        
        await Promise.all(deletePromises);
        
        console.log('Successfully deleted all products');
        
        toast({
          title: "Success",
          description: `All ${productsData.length} existing products have been removed`
        });
      } catch (error) {
        console.error('Error clearing products:', error);
        toast({
          title: "Error",
          description: `Failed to clear all products: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  };

  const removeAutoGeneratedProducts = async () => {
    const productsToDelete = productsData.filter(product => 
      autoGeneratedProductSet.has(product.name)
    );

    if (productsToDelete.length === 0) {
      toast({
        title: "Info",
        description: "No auto-generated products found to remove"
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${productsToDelete.length} auto-generated products?\n\nProducts to delete:\n${productsToDelete.map(p => `- ${p.name}`).join('\n')}`)) {
      try {
        console.log('Starting to delete', productsToDelete.length, 'auto-generated products...');
        
        const deletePromises = productsToDelete.map(product => {
          console.log('Deleting auto-generated product:', product.name, 'with ID:', product.id);
          return deleteDocument(product.id);
        });
        
        await Promise.all(deletePromises);
        
        console.log('Successfully deleted auto-generated products');
        
        toast({
          title: "Success",
          description: `Removed ${productsToDelete.length} auto-generated products`
        });
      } catch (error) {
        console.error('Error clearing auto-generated products:', error);
        toast({
          title: "Error",
          description: `Failed to remove auto-generated products: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  };

  const showAllProducts = () => {
    console.log('=== ALL PRODUCTS IN DATABASE ===');
    productsData.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - ID: ${product.id}`);
      console.log(`   - Category: ${product.category}`);
      console.log(`   - Manually Uploaded: ${product.manuallyUploaded || false}`);
      console.log(`   - Created At: ${product.createdAt}`);
      console.log(`   - Updated At: ${product.updatedAt}`);
      console.log('---');
    });
    console.log(`Total products: ${productsData.length}`);
    
    toast({
      title: "Debug Info",
      description: `Logged ${productsData.length} products to console. Check browser console for details.`
    });
  };

  const showDuplicateProducts = () => {
    console.log('=== CHECKING FOR DUPLICATE PRODUCTS ===');
    
    // Group products by name and category
    const productGroups = new Map();
    productsData.forEach(product => {
      const key = `${product.name.toLowerCase()}-${product.category}`;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key).push(product);
    });

    let duplicateCount = 0;
    for (const [key, products] of productGroups.entries()) {
      if (products.length > 1) {
        duplicateCount++;
        console.log(`\nDuplicate group: ${key}`);
        products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
          console.log(`     - Category: ${product.category}`);
          console.log(`     - Subcategory: ${product.subcategory}`);
          console.log(`     - Updated: ${product.updatedAt}`);
        });
      }
    }

    if (duplicateCount === 0) {
      console.log('No duplicate products found!');
    } else {
      console.log(`\nFound ${duplicateCount} groups of duplicate products`);
    }

    toast({
      title: "Duplicate Check",
      description: duplicateCount > 0 
        ? `Found ${duplicateCount} groups of duplicate products. Check console for details.`
        : "No duplicate products found!"
    });
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image,
      description: product.description,
      preparationTime: product.preparationTime || '15-20 mins',
      inStock: true, // Always set to true
      tags: product.tags || [],
      newTag: '',
      subcategory: product.subcategory || '',
      vegType: product.vegType || 'veg', // Set vegType for editing
      location: product.location || '', // Set location for editing
      landmark: product.landmark || '', // Set landmark for editing
    });
    setIsEditDialogOpen(true);
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: ''
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Memoized helper functions
  const getCategoryColor = React.useCallback((category: string) => {
    switch (category) {
      case 'food': return 'bg-green-100 text-green-800';
      case 'daily_essential': return 'bg-blue-100 text-blue-800';
      case 'drinks': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getCategoryDisplayName = React.useCallback((category: string) => {
    switch (category) {
      case 'food': return 'Foods';
      case 'daily_essential': return 'Daily Essentials';
      case 'drinks': return 'Drinks';
      default: return category;
    }
  }, []);

  const getStatusBadge = React.useCallback((status: string, lowStock: boolean) => {
    if (status === 'out-of-stock') return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    if (lowStock) return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  }, []);

  // 2. Add handler to add new subcategory
  type CategoryDoc = { name: string; displayName?: string; category: string; icon?: string; createdAt?: Date; updatedAt?: Date; };
  const handleAddNewSubcategory = async () => {
    const trimmed = newSubcategoryName.trim();
    if (!trimmed) {
      toast({ title: 'Error', description: 'Please enter a subcategory name', variant: 'destructive' });
      return;
    }
    if (trimmed.toLowerCase() === 'all') {
      toast({ title: 'Error', description: 'Subcategory name cannot be "All"', variant: 'destructive' });
      return;
    }
    // Normalize the subcategory name using utility function
    const normalizedName = normalizeSubcategoryName(trimmed);

    // Enhanced duplicate check - check both Firestore and local state
    try {
      // Check Firestore for case-insensitive matches
      const q = query(
        collection(db, 'categories'),
        where('category', '==', formData.category)
      );
      const snapshot = await getDocs(q);
      
      // Check for case-insensitive duplicates in Firestore
      const firestoreDuplicates = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.name && data.name.toLowerCase() === normalizedName.toLowerCase();
      });
      
      if (firestoreDuplicates.length > 0) {
        toast({ title: 'Error', description: 'This subcategory already exists (case-insensitive)', variant: 'destructive' });
        return;
      }

      // Check for case-insensitive duplicates in local state
      const existingSubcategory = categoriesData.find(cat => 
        cat.category === formData.category && 
        cat.name.toLowerCase() === normalizedName.toLowerCase()
      );
      
      if (existingSubcategory) {
        toast({ title: 'Error', description: 'A subcategory with this name already exists (case-insensitive)', variant: 'destructive' });
        return;
      }
    } catch (err) {
      console.error('Error checking for duplicates:', err);
      toast({ title: 'Error', description: 'Failed to check for duplicates', variant: 'destructive' });
      return;
    }

    let icon = newSubcategoryTab === 'emoji' ? newSubcategoryIcon : newSubcategoryImage;
    if (!icon) icon = '🍽️';
    
    try {
      const categoryData: CategoryDoc = {
        name: normalizedName,
        displayName: normalizedName,
        category: formData.category,
        icon,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addCategoryDocument(categoryData);
      toast({ title: 'Success', description: `Added new subcategory: ${normalizedName}` });
      setShowNewSubcategoryInput(false);
      setNewSubcategoryName('');
      setNewSubcategoryIcon('🍽️');
      setNewSubcategoryImage('');
      setNewSubcategoryTab('emoji');
      setFormData(prev => ({ ...prev, subcategory: normalizedName }));
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast({ title: 'Error', description: 'Failed to add subcategory', variant: 'destructive' });
    }
  };

  // Add handler to delete subcategory
  const handleDeleteSubcategory = async (subcategory: any) => {
    try {
      // Check if there are any products using this subcategory
      const productsUsingSubcategory = productsData.filter(product => 
        product.category === selectedCategory && 
        product.subcategory && 
        product.subcategory.toLowerCase() === subcategory.name.toLowerCase()
      );

      // Delete all products using this subcategory first
      if (productsUsingSubcategory.length > 0) {
        console.log(`Deleting ${productsUsingSubcategory.length} products that use subcategory: ${subcategory.name}`);
        
        const deleteProductPromises = productsUsingSubcategory.map(product => {
          console.log('Deleting product:', product.name, 'with ID:', product.id);
          return deleteDocument(product.id);
        });
        
        await Promise.all(deleteProductPromises);
        console.log(`Successfully deleted ${productsUsingSubcategory.length} products`);
      }

      // Now delete the subcategory
      await deleteCategoryDocument(subcategory.id);
      
      const message = productsUsingSubcategory.length > 0 
        ? `Deleted subcategory "${subcategory.name}" and ${productsUsingSubcategory.length} associated product(s)`
        : `Deleted subcategory: ${subcategory.name}`;
        
      toast({ title: 'Success', description: message });
      setSubcategoryToDelete(null);
      setIsDeleteSubDialogOpen(false);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({ title: 'Error', description: 'Failed to delete subcategory', variant: 'destructive' });
    }
  };

  // Add cleanup function for duplicate subcategories
  const handleCleanupDuplicates = async () => {
    try {
      toast({ title: 'Info', description: 'Starting duplicate cleanup...' });
      const deletedCount = await cleanupDuplicateSubcategories();
      toast({ 
        title: 'Success', 
        description: deletedCount > 0 
          ? `Cleaned up ${deletedCount} duplicate subcategories` 
          : 'No duplicate subcategories found'
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({ title: 'Error', description: 'Failed to cleanup duplicates', variant: 'destructive' });
    }
  };

  // Add cleanup function for duplicate products
  const handleCleanupDuplicateProducts = async () => {
    try {
      toast({ title: 'Info', description: 'Starting duplicate product cleanup...' });
      
      // Group products by name and category to find duplicates
      const productGroups = new Map();
      productsData.forEach(product => {
        const key = `${product.name.toLowerCase()}-${product.category}`;
        if (!productGroups.has(key)) {
          productGroups.set(key, []);
        }
        productGroups.get(key).push(product);
      });

      let deletedCount = 0;
      const deletePromises = [];

      // Delete duplicates, keeping the most recent one
      for (const [key, products] of productGroups.entries()) {
        if (products.length > 1) {
          // Sort by updatedAt (most recent first)
          products.sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return bTime - aTime;
          });

          // Keep the first (most recent) one, delete the rest
          const toDelete = products.slice(1);
          toDelete.forEach(product => {
            deletePromises.push(deleteDocument(product.id));
            deletedCount++;
          });
        }
      }

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        toast({ 
          title: 'Success', 
          description: `Cleaned up ${deletedCount} duplicate products`
        });
      } else {
        toast({ 
          title: 'Success', 
          description: 'No duplicate products found'
        });
      }
    } catch (error) {
      console.error('Error during product cleanup:', error);
      toast({ title: 'Error', description: 'Failed to cleanup duplicate products', variant: 'destructive' });
    }
  };

  // Get all subcategories for the selected category (for management)
  const allSubcategoriesForCategory = React.useMemo(() => {
    return categoriesData
      .filter(cat => cat.category === selectedCategory && typeof cat.name === 'string' && cat.name.trim() !== '' && cat.name.toLowerCase() !== 'all')
      .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));
  }, [categoriesData, selectedCategory]);

  if (firebaseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading products: {firebaseError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Product Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto text-base px-6 py-2 rounded-lg shadow-md">
              <Plus className="w-5 h-5" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={formData.subcategory || undefined} onValueChange={val => setFormData({...formData, subcategory: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                      {categoriesData
                        .filter(cat => cat.category === formData.category && typeof cat.name === 'string' && cat.name.trim() !== '' && cat.name.toLowerCase() !== 'all')
                        .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.icon && cat.icon.startsWith('http') ? (
                              <img src={cat.icon} alt={cat.displayName || cat.name} className="w-4 h-4 mr-2 object-contain inline-block align-middle" />
                            ) : (
                              <span className="mr-2 align-middle">{cat.icon}</span>
                            )}
                            {cat.displayName || cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                  </div>
                  
              <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSubcategoryInput(v => !v)}>
                  + Add New Subcategory
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsManageSubDialogOpen(true)}>
                  Manage Subcategories
                </Button>
              </div>
                  {showNewSubcategoryInput && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex gap-2">
                        <Input
                          value={newSubcategoryName}
                      onChange={e => setNewSubcategoryName(e.target.value)}
                          placeholder="Enter new subcategory name"
                      onKeyDown={e => { if (e.key === 'Enter') handleAddNewSubcategory(); }}
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={handleAddNewSubcategory}>Save</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewSubcategoryInput(false); setNewSubcategoryName(''); setNewSubcategoryIcon('🍽️'); setNewSubcategoryImage(''); setNewSubcategoryTab('emoji'); }}>Cancel</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={newSubcategoryTab === 'emoji' ? 'default' : 'outline'} onClick={() => setNewSubcategoryTab('emoji')}>Emoji</Button>
                    <Button type="button" size="sm" variant={newSubcategoryTab === 'url' ? 'default' : 'outline'} onClick={() => setNewSubcategoryTab('url')}>Image URL</Button>
                  </div>
                  {newSubcategoryTab === 'emoji' ? (
                    <div className="grid grid-cols-8 gap-1 p-2 max-h-32 overflow-y-auto border rounded">
                                    {foodIcons.map((icon, index) => (
                        <Button key={index} type="button" size="sm" variant={newSubcategoryIcon === icon ? 'default' : 'ghost'} className="text-lg p-1" onClick={() => setNewSubcategoryIcon(icon)}>
                          {icon}
                        </Button>
                                    ))}
                                  </div>
                  ) : (
                    <div className="flex items-center gap-2">
                              <Input
                                value={newSubcategoryImage}
                        onChange={e => setNewSubcategoryImage(e.target.value)}
                                placeholder="Paste image/logo URL"
                        className="flex-1"
                              />
                              {newSubcategoryImage && (
                        <img
                          src={newSubcategoryImage}
                          alt="Preview"
                          className="w-8 h-8 object-contain rounded border"
                          onError={e => { (e.target as HTMLImageElement).src = ''; setNewSubcategoryImage(''); toast({ title: 'Error', description: 'Invalid image URL', variant: 'destructive' }); }}
                        />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">Preview:</span>
                    {newSubcategoryTab === 'emoji' ? (
                      <span className="text-2xl">{newSubcategoryIcon}</span>
                    ) : (
                      newSubcategoryImage && <img src={newSubcategoryImage} alt="Preview" className="w-8 h-8 object-contain rounded border" />
                  )}
                </div>
              </div>
              )}

                <div>
                  <Label htmlFor="vegType">Veg/Non-Veg</Label>
                  <Select
                    value={formData.vegType}
                    onValueChange={val => setFormData({ ...formData, vegType: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Veg</SelectItem>
                      <SelectItem value="non-veg">Non-Veg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div>
                <Label htmlFor="preparationTime">Preparation Time</Label>
                <Select value={formData.preparationTime} onValueChange={(value) => setFormData({...formData, preparationTime: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="5-10 mins">5-10 mins</SelectItem>
                    <SelectItem value="10-15 mins">10-15 mins</SelectItem>
                    <SelectItem value="15-20 mins">15-20 mins</SelectItem>
                    <SelectItem value="20-30 mins">20-30 mins</SelectItem>
                      <SelectItem value="30-45 mins">30-45 mins</SelectItem>
                      <SelectItem value="45-60 mins">45-60 mins</SelectItem>
                      <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                    </SelectContent>
                  </Select>
              </div>



              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter product description..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={formData.newTag}
                    onChange={(e) => setFormData({...formData, newTag: e.target.value})}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {(formData.category === 'food' || formData.category === 'drinks') && (
                  <>
                    <div className="mb-4">
                      <Label htmlFor="landmark">Landmark</Label>
                      <Input
                        id="landmark"
                        value={formData.landmark}
                        onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                        placeholder="Enter a nearby landmark (required)"
                        required
                      />
                      {landmarkError && <div className="text-red-600 text-xs mt-1">{landmarkError}</div>}
                    </div>
                    <div className="mb-4">
                      <MapLocationPicker
                        value={formData.location}
                        onChange={loc => setFormData({ ...formData, location: loc })}
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddProduct} className="w-full">
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subcategory">Subcategory</Label>
                <Select value={formData.subcategory || undefined} onValueChange={val => setFormData({...formData, subcategory: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                    {categoriesData
                      .filter(cat => cat.category === formData.category && typeof cat.name === 'string' && cat.name.trim() !== '' && cat.name.toLowerCase() !== 'all')
                      .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.icon && cat.icon.startsWith('http') ? (
                            <img src={cat.icon} alt={cat.displayName || cat.name} className="w-4 h-4 mr-2 object-contain inline-block align-middle" />
                          ) : (
                            <span className="mr-2 align-middle">{cat.icon}</span>
                          )}
                          {cat.displayName || cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSubcategoryInput(v => !v)}>
                + Add New Subcategory
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsManageSubDialogOpen(true)}>
                Manage Subcategories
                  </Button>
                </div>
            {showNewSubcategoryInput && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    value={newSubcategoryName}
                    onChange={e => setNewSubcategoryName(e.target.value)}
                    placeholder="Enter new subcategory name"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddNewSubcategory(); }}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddNewSubcategory}>Save</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewSubcategoryInput(false); setNewSubcategoryName(''); setNewSubcategoryIcon('🍽️'); setNewSubcategoryImage(''); setNewSubcategoryTab('emoji'); }}>Cancel</Button>
              </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={newSubcategoryTab === 'emoji' ? 'default' : 'outline'} onClick={() => setNewSubcategoryTab('emoji')}>Emoji</Button>
                  <Button type="button" size="sm" variant={newSubcategoryTab === 'url' ? 'default' : 'outline'} onClick={() => setNewSubcategoryTab('url')}>Image URL</Button>
            </div>
                {newSubcategoryTab === 'emoji' ? (
                  <div className="grid grid-cols-8 gap-1 p-2 max-h-32 overflow-y-auto border rounded">
                    {foodIcons.map((icon, index) => (
                      <Button key={index} type="button" size="sm" variant={newSubcategoryIcon === icon ? 'default' : 'ghost'} className="text-lg p-1" onClick={() => setNewSubcategoryIcon(icon)}>
                        {icon}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSubcategoryImage}
                      onChange={e => setNewSubcategoryImage(e.target.value)}
                      placeholder="Paste image/logo URL"
                      className="flex-1"
                    />
                    {newSubcategoryImage && (
                      <img
                        src={newSubcategoryImage}
                        alt="Preview"
                        className="w-8 h-8 object-contain rounded border"
                        onError={e => { (e.target as HTMLImageElement).src = ''; setNewSubcategoryImage(''); toast({ title: 'Error', description: 'Invalid image URL', variant: 'destructive' }); }}
                      />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Preview:</span>
                  {newSubcategoryTab === 'emoji' ? (
                    <span className="text-2xl">{newSubcategoryIcon}</span>
                  ) : (
                    newSubcategoryImage && <img src={newSubcategoryImage} alt="Preview" className="w-8 h-8 object-contain rounded border" />
                  )}
                </div>
              </div>
            )}

              <div>
                <Label htmlFor="edit-vegType">Veg/Non-Veg</Label>
                <Select
                  value={formData.vegType}
                  onValueChange={val => setFormData({ ...formData, vegType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="non-veg">Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.category === 'food' || formData.category === 'drinks') && (
                <>
                  <div className="mb-4">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="Enter a nearby landmark (required)"
                      required
                    />
                    {landmarkError && <div className="text-red-600 text-xs mt-1">{landmarkError}</div>}
                  </div>
                  <div className="mb-4">
                    <MapLocationPicker
                      value={formData.location}
                      onChange={loc => setFormData({ ...formData, location: loc })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="edit-stock">Stock Quantity</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
              <Label htmlFor="edit-preparationTime">Preparation Time</Label>
              <Select value={formData.preparationTime} onValueChange={(value) => setFormData({...formData, preparationTime: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="5-10 mins">5-10 mins</SelectItem>
                  <SelectItem value="10-15 mins">10-15 mins</SelectItem>
                  <SelectItem value="15-20 mins">15-20 mins</SelectItem>
                  <SelectItem value="20-30 mins">20-30 mins</SelectItem>
                    <SelectItem value="30-45 mins">30-45 mins</SelectItem>
                    <SelectItem value="45-60 mins">45-60 mins</SelectItem>
                    <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                  </SelectContent>
                </Select>
            </div>



            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter product description..."
                rows={3}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={formData.newTag}
                  onChange={(e) => setFormData({...formData, newTag: e.target.value})}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleEditProduct} className="w-full">
              Update Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategory Management Dialog */}
      <Dialog open={isManageSubDialogOpen} onOpenChange={setIsManageSubDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Subcategories - {getCategoryDisplayName(selectedCategory)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allSubcategoriesForCategory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No subcategories found for this category.</p>
                <p className="text-sm text-gray-400 mt-2">Add subcategories using the "Add New Subcategory" button.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  {allSubcategoriesForCategory.length} subcategory{allSubcategoriesForCategory.length !== 1 ? 's' : ''} found
                </p>
                {allSubcategoriesForCategory.map((subcat) => {
                  const productsUsingThis = productsData.filter(product => 
                    product.category === selectedCategory && 
                    product.subcategory && 
                    product.subcategory.toLowerCase() === subcat.name.toLowerCase()
                  );
                  
                  return (
                    <div key={subcat.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {subcat.icon && subcat.icon.startsWith('http') ? (
                            <img src={subcat.icon} alt={subcat.displayName || subcat.name} className="w-8 h-8 object-contain rounded border bg-white" />
                          ) : (
                            subcat.icon || '📦'
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{subcat.displayName || subcat.name}</h4>
                          <p className="text-sm text-gray-500">
                            {productsUsingThis.length} product{productsUsingThis.length !== 1 ? 's' : ''} using this subcategory
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSubcat(subcat);
                            setEditSubcatName(subcat.displayName || subcat.name);
                            setEditSubcatIcon(subcat.icon || '');
                            setEditSubcatImage('');
                            setEditSubcatImageFile(null);
                            setEditSubcatImagePreview('');
                            setEditSubcatTab('emoji');
                            setIsEditSubDialogOpen(true);
                          }}
                          title="Edit Subcategory"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSubcategoryToDelete(subcat);
                            setIsDeleteSubDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={isEditSubDialogOpen} onOpenChange={setIsEditSubDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="edit-subcat-name">Name</Label>
            <Input
              id="edit-subcat-name"
              value={editSubcatName}
              onChange={e => setEditSubcatName(e.target.value)}
              placeholder="Subcategory name"
            />
            <div className="flex gap-2 mt-2">
              <Button type="button" size="sm" variant={editSubcatTab === 'emoji' ? 'default' : 'outline'} onClick={() => setEditSubcatTab('emoji')}>Emoji</Button>
              <Button type="button" size="sm" variant={editSubcatTab === 'url' ? 'default' : 'outline'} onClick={() => setEditSubcatTab('url')}>Image URL</Button>
            </div>
            {editSubcatTab === 'emoji' ? (
              <div className="grid grid-cols-8 gap-1 p-2 max-h-32 overflow-y-auto border rounded">
                {foodIcons.map((icon, index) => (
                  <Button key={index} type="button" size="sm" variant={editSubcatIcon === icon ? 'default' : 'ghost'} className="text-lg p-1" onClick={() => setEditSubcatIcon(icon)}>
                    {icon}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={editSubcatImage}
                  onChange={e => setEditSubcatImage(e.target.value)}
                  placeholder="Paste image/logo URL"
                  className="flex-1"
                />
                {editSubcatImage && (
                  <img
                    src={editSubcatImage}
                    alt="Preview"
                    className="w-8 h-8 object-contain rounded border"
                    onError={e => { (e.target as HTMLImageElement).src = ''; setEditSubcatImage(''); toast({ title: 'Error', description: 'Invalid image URL', variant: 'destructive' }); }}
                  />
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">Preview:</span>
              {editSubcatTab === 'emoji' ? (
                <span className="text-2xl">{editSubcatIcon}</span>
              ) : (
                editSubcatImage && <img src={editSubcatImage} alt="Preview" className="w-8 h-8 object-contain rounded border" />
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                variant="default"
                onClick={async () => {
                  if (!editSubcatName.trim()) {
                    toast({ title: 'Error', description: 'Please enter a subcategory name', variant: 'destructive' });
                    return;
                  }
                  let icon = editSubcatTab === 'emoji' ? editSubcatIcon : editSubcatImage;
                  if (!icon) icon = '🍽️';
                  const normalizedName = editSubcatName.trim().charAt(0).toUpperCase() + editSubcatName.trim().slice(1);
                  // Only check for duplicate if the name is actually changing
                  const isNameChanging = normalizedName.toLowerCase() !== (editingSubcat.name || '').toLowerCase();
                  const duplicate = isNameChanging && categoriesData.some(cat => cat.category === editingSubcat.category && cat.name.toLowerCase() === normalizedName.toLowerCase() && cat.id !== editingSubcat.id);
                  if (duplicate) {
                    toast({ title: 'Error', description: 'This subcategory already exists', variant: 'destructive' });
                    return;
                  }
                  try {
                    await updateCategoryDocument(editingSubcat.id, {
                      name: normalizedName,
                      displayName: normalizedName,
                      icon,
                      updatedAt: new Date()
                    });
                    // If name changed, update all products using old subcategory name
                    if (normalizedName !== editingSubcat.name) {
                      const productsToUpdate = productsData.filter(product => product.category === editingSubcat.category && product.subcategory && product.subcategory.toLowerCase() === editingSubcat.name.toLowerCase());
                      await Promise.all(productsToUpdate.map(product => updateDocument(product.id, { subcategory: normalizedName })));
                    }
                    toast({ title: 'Success', description: 'Subcategory updated' });
                    setIsEditSubDialogOpen(false);
                    setEditingSubcat(null);
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update subcategory', variant: 'destructive' });
                  }
                }}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditSubDialogOpen(false);
                  setEditingSubcat(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subcategory Confirmation Dialog */}
      <Dialog open={isDeleteSubDialogOpen} onOpenChange={setIsDeleteSubDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const productsUsingThis = subcategoryToDelete ? productsData.filter(product => 
                product.category === selectedCategory && 
                product.subcategory && 
                product.subcategory.toLowerCase() === subcategoryToDelete.name.toLowerCase()
              ) : [];
              
              return (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">
                      Are you sure you want to delete "{subcategoryToDelete?.displayName || subcategoryToDelete?.name}"?
                    </p>
                    {productsUsingThis.length > 0 ? (
                      <p className="text-sm text-red-600 mt-1">
                        This will also delete {productsUsingThis.length} product{productsUsingThis.length !== 1 ? 's' : ''} that use this subcategory.
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 mt-1">
                        This action cannot be undone.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => handleDeleteSubcategory(subcategoryToDelete)}
                className="flex-1"
              >
                {(() => {
                  const productsUsingThis = subcategoryToDelete ? productsData.filter(product => 
                    product.category === selectedCategory && 
                    product.subcategory && 
                    product.subcategory.toLowerCase() === subcategoryToDelete.name.toLowerCase()
                  ) : [];
                  return productsUsingThis.length > 0 ? `Delete Subcategory & ${productsUsingThis.length} Product${productsUsingThis.length !== 1 ? 's' : ''}` : 'Delete Subcategory';
                })()}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubcategoryToDelete(null);
                  setIsDeleteSubDialogOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Nav Bar */}
      <nav className="flex gap-4 overflow-x-auto pb-2 border-b border-gray-200 mb-6">
            {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-150 whitespace-nowrap font-semibold text-base focus:outline-none ${selectedCategory === category ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-primary/10'}`}
          >
            <span className="text-2xl mb-1">{getCategoryIcon(category)}</span>
            <span>{getCategoryDisplayName(category)}</span>
          </button>
            ))}
      </nav>

      {/* Search and Sort Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full sm:w-72 h-12 text-base rounded-lg shadow-sm"
              />
            </div>
            <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full sm:w-56 h-12 text-base rounded-lg shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={removeAutoGeneratedProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
                title="Remove known auto-generated products"
              >
                <Trash2 className="w-4 h-4" />
                Remove Auto
              </Button>
              {productsData.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={clearAllProducts}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCleanupDuplicates}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
                title="Clean up duplicate subcategories"
              >
                <Package className="w-4 h-4" />
                Clean Subcategories
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCleanupDuplicateProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
                title="Clean up duplicate products"
              >
                <Trash2 className="w-4 h-4" />
                Clean Products
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
                title="Refresh page to ensure latest data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={showDuplicateProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
                title="Check for duplicate products (console log)"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Check Duplicates
              </Button>
            </div>
          </div>
        </div>

      {/* Total products info */}
      {(() => {
        const categoryProducts = processedProducts.filter(product => 
          product.category === selectedCategory &&
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="mb-2 text-gray-600 text-sm font-medium">
            Total products: {categoryProducts.length}
          </div>
        );
      })()}

      {/* Subcategory filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {subcategoriesForCategory.map(subcat => (
          <Button
            key={subcat.name}
            size="sm"
            variant={selectedSubcategory === subcat.name ? 'default' : 'outline'}
            className="rounded-full px-4 flex-shrink-0"
            onClick={() => setSelectedSubcategory(subcat.name)}
          >
            {subcat.icon && subcat.icon.startsWith('http') ? (
              <img src={subcat.icon} alt={subcat.displayName} className="w-4 h-4 mr-2 object-contain" />
            ) : (
              <span className="mr-2">{subcat.icon}</span>
            )}
            {subcat.displayName}
          </Button>
        ))}
      </div>

      {/* Product Grid */}
      {(() => {
        const categoryProducts = processedProducts.filter(product => {
          const matchesCategory = product.category === selectedCategory;
          const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Enhanced subcategory matching with better case handling
          let matchesSubcategory = true;
          if (selectedSubcategory !== 'All') {
            if (!product.subcategory) {
              matchesSubcategory = false;
            } else {
              // Normalize both subcategory names for comparison
              const productSubcategory = product.subcategory.trim();
              const selectedSubcategoryNormalized = selectedSubcategory.trim();
              
              // Case-insensitive comparison
              matchesSubcategory = productSubcategory.toLowerCase() === selectedSubcategoryNormalized.toLowerCase();
            }
          }
          
          return matchesCategory && matchesSubcategory && matchesSearch;
        });
        return categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10 xl:gap-12 py-4">
            {categoryProducts.map((product: any) => (
              <Card key={product.firebaseId} className="hover:scale-[1.025] hover:shadow-2xl transition-transform duration-200 shadow-md rounded-2xl border-0 bg-white p-0 flex flex-col h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="relative mb-5">
                    <div className="w-full aspect-square h-56 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                          {product.image && product.image !== '/placeholder.svg' ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover mx-auto rounded-xl" />
                          ) : (
                        <Image className="w-24 h-24 text-gray-300" />
                          )}
                        </div>
                        {product.lowStock && (
                          <div className="absolute -top-2 -right-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500 bg-white rounded-full p-1 shadow" />
                          </div>
                        )}
                      </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-lg line-clamp-2 mb-1">{product.name}</h3>
                    <span className="text-xl font-extrabold text-green-600 mb-2">₹{product.price}</span>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getStatusBadge(product.status, product.lowStock)}
                        </div>
                        {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                            {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1 rounded-full">
                                {tag}
                              </Badge>
                            ))}
                            {product.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full">
                                +{product.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                    {product.subcategory && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-1 rounded-full">
                        {product.subcategory}
                      </Badge>
                    )}
                    <div className="flex gap-2 mt-auto pt-4">
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg text-base" onClick={() => openEditDialog(product)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 rounded-lg" onClick={() => handleDeleteProduct(product)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
          <div className="text-center py-16">
                <div className="max-w-md mx-auto">
              <Image className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {productsData.length === 0 ? 'No Products Yet' : 'No Products Found'}
                  </h3>
              <p className="text-gray-500 mb-6 text-base">
                    {productsData.length === 0 
                      ? 'Start by adding your first product manually. Only manually uploaded products will be displayed.'
                      : 'No products match your current search or filter criteria.'
                    }
                  </p>
                  {productsData.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2 mx-auto px-6 py-2 text-base rounded-lg">
                      <Plus className="w-4 h-4" />
                      Add Your First Product
                    </Button>
                  )}
                </div>
              </div>
        );
      })()}
    </div>
  );
}