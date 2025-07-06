// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhiSxNUrQ4b_iwpYr4F_J1UW3XOwzsMmE",
    authDomain: "dsa-squad.firebaseapp.com",
    databaseURL: "https://dsa-squad-default-rtdb.firebaseio.com",
    projectId: "dsa-squad",
    storageBucket: "dsa-squad.firebasestorage.app",
    messagingSenderId: "762339454857",
    appId: "1:762339454857:web:bfc50ed181e2daefe2fb58",
    measurementId: "G-WCPR6FCESS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'All';
let searchTerm = '';
let cart = [];
let currentProduct = null;
let isDarkMode = false;
let categoriesData = []; // Store categories from Firestore

// Category and subcategory mappings with icons
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

// Category icons for sidebar
const categoryIcons = {
    'All': '🌐',
    'food': '🍽️',
    'daily_essential': '🏠',
    'drinks': '🥤'
};

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const loadingState = document.getElementById('loadingState');
const noProductsState = document.getElementById('noProductsState');
const searchInput = document.getElementById('searchInput');
const mainSearchInput = document.getElementById('mainSearchInput');
const categorySidebar = document.getElementById('categorySidebar');
const cartCount = document.getElementById('cartCount');
const categoryTitle = document.getElementById('categoryTitle');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCategories();
    setupEventListeners();
    setupTheme();
    setupSidebar();
    loadCart();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', function(e) {
        searchTerm = e.target.value.toLowerCase();
        filterProducts();
    });

    mainSearchInput.addEventListener('input', function(e) {
        searchTerm = e.target.value.toLowerCase();
        filterProducts();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', refreshProducts);

    // Cart button
    document.querySelector('.fa-shopping-cart').parentElement.addEventListener('click', openCart);

    // Add refresh functionality (for debugging)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshProducts();
        }
    });
}

// Setup theme
function setupTheme() {
    const savedTheme = localStorage.getItem('quickmart-theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        isDarkMode = true;
        themeIcon.className = 'fas fa-sun w-5 h-5';
    }
}

// Toggle theme
function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        themeIcon.className = 'fas fa-sun w-5 h-5';
        localStorage.setItem('quickmart-theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.className = 'fas fa-moon w-5 h-5';
        localStorage.setItem('quickmart-theme', 'light');
    }
}

// Setup sidebar
function setupSidebar() {
    const categories = ['All', ...categoryOptions.map(cat => cat.value)];
    
    categorySidebar.innerHTML = categories.map(category => `
        <li>
            <button
                onclick="setActiveCategory('${category}')"
                class="sidebar-category w-full text-center p-3 text-sm font-medium border-l-4 ${currentCategory === category ? 'active' : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
            >
                <div class="text-2xl mb-1 mx-auto">${categoryIcons[category]}</div>
                ${category}
            </button>
        </li>
    `).join('');
}

// Set active category
function setActiveCategory(category) {
    currentCategory = category;
    categoryTitle.textContent = category;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = Array.from(document.querySelectorAll('.sidebar-category')).find(btn => 
        btn.textContent.trim().includes(category)
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    filterProducts();
}

// Load products from Firebase
async function loadProducts() {
    try {
        showLoading(true);
        console.log('Setting up Firebase real-time listener...');
        
        // Use real-time listener instead of one-time fetch
        const unsubscribe = db.collection('products').onSnapshot((snapshot) => {
            console.log('Firebase snapshot received:', snapshot.docs.length, 'products');
            allProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Products loaded:', allProducts.length);
            filteredProducts = [...allProducts];
            renderProducts();
            showLoading(false);
        }, (error) => {
            console.error('Error in Firebase listener:', error);
            showLoading(false);
            showError('Failed to load products. Please try again later.');
        });

        // Store unsubscribe function for cleanup (optional)
        window.unsubscribeProducts = unsubscribe;
        
    } catch (error) {
        console.error('Error setting up product listener:', error);
        showLoading(false);
        showError('Failed to load products. Please try again later.');
    }
}

// Filter products based on category and search
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        return matchesCategory && matchesSearch;
    });
    
    renderProducts();
}

// Get subcategory display name with icon for drinks
function getSubcategoryDisplay(subcategory, category) {
    // First check if we have this subcategory in Firestore
    const firestoreCategory = categoriesData.find(cat => 
        cat.name === subcategory && cat.category === category
    );
    
    if (firestoreCategory) {
        return firestoreCategory.icon ? `${firestoreCategory.icon} ${firestoreCategory.displayName || firestoreCategory.name}` : firestoreCategory.displayName || firestoreCategory.name;
    }
    
    // Fallback to default logic for drinks
    if (category === 'drinks') {
        const drinkOption = categoryOptions.find(cat => cat.value === 'drinks')
            .subcategories.find(sub => sub.name === subcategory);
        return drinkOption ? `${drinkOption.icon} ${drinkOption.name}` : subcategory;
    }
    
    return subcategory;
}

// Get category display name
function getCategoryDisplayName(category) {
    switch (category) {
        case 'food': return 'Foods';
        case 'daily_essential': return 'Daily Essentials';
        case 'drinks': return 'Drinks';
        default: return category;
    }
}

// Render products in the grid
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        noProductsState.style.display = 'block';
        return;
    }
    
    productsGrid.style.display = 'grid';
    noProductsState.style.display = 'none';
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow border dark:border-gray-700" onclick="openProductModal('${product.id}')">
            <div class="relative">
                <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.name}" 
                     class="w-full h-48 object-cover">
                <button 
                    class="absolute top-3 right-3 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2"
                    onclick="event.stopPropagation(); addToWishlist('${product.id}')"
                >
                    <i class="fas fa-heart w-4 h-4 text-gray-600 dark:text-gray-300"></i>
                </button>
                ${!product.inStock ? '<div class="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Out of Stock</div>' : ''}
                <div class="absolute bottom-3 left-3 bg-black/80 text-white px-3 py-1 rounded text-sm">
                    ₹${product.price}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 text-gray-800 dark:text-white">${product.name}</h3>
                <div class="flex items-center space-x-2 mb-2">
                    <div class="flex items-center space-x-1">
                        <i class="fas fa-star w-4 h-4 fill-green-500 text-green-500"></i>
                        <span class="font-medium text-sm text-gray-600 dark:text-gray-300">${product.rating || '4.5'}</span>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">• ${product.deliveryTime || '30-45 mins'}</span>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-sm">${product.description || 'No description available.'}</p>
                <div class="flex items-center gap-2 mt-2">
                    <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${getCategoryDisplayName(product.category)}</span>
                    ${product.subcategory ? `<span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${getSubcategoryDisplay(product.subcategory, product.category)}</span>` : ''}
                </div>
                <button 
                    class="w-full mt-3 bg-quicklymart-orange-500 hover:bg-quicklymart-orange-600 text-white py-2 rounded-lg font-semibold transition-colors" 
                    onclick="event.stopPropagation(); addToCartFromGrid('${product.id}')"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Add to wishlist
function addToWishlist(productId) {
    showNotification('Added to wishlist!');
}

// Open product modal
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    
    // Populate modal content
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalImage').src = product.image || 'https://via.placeholder.com/300x200?text=No+Image';
    document.getElementById('modalDescription').textContent = product.description || 'No description available.';
    document.getElementById('modalPrice').textContent = `₹${product.price}`;
    document.getElementById('modalRating').textContent = product.rating ? `${product.rating}/5` : 'No rating';
    document.getElementById('modalDeliveryTime').textContent = product.deliveryTime || '30-45 mins';
    document.getElementById('modalStock').textContent = product.inStock ? `${product.stock} in stock` : 'Out of stock';
    document.getElementById('quantity').textContent = '1';
    
    // Populate tags
    const tagsContainer = document.getElementById('modalTags');
    if (product.tags && product.tags.length > 0) {
        tagsContainer.innerHTML = product.tags.map(tag => 
            `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${tag}</span>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '<span class="text-gray-500">No tags</span>';
    }
    
    // Show modal
    document.getElementById('productModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close product modal
function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentProduct = null;
}

// Quantity controls
function increaseQuantity() {
    const quantityElement = document.getElementById('quantity');
    let quantity = parseInt(quantityElement.textContent);
    if (currentProduct && quantity < currentProduct.stock) {
        quantityElement.textContent = quantity + 1;
    }
}

function decreaseQuantity() {
    const quantityElement = document.getElementById('quantity');
    let quantity = parseInt(quantityElement.textContent);
    if (quantity > 1) {
        quantityElement.textContent = quantity - 1;
    }
}

// Add to cart from modal
function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').textContent);
    addToCartItem(currentProduct, quantity);
    closeModal();
}

// Add to cart from grid
function addToCartFromGrid(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCartItem(product, 1);
    }
}

// Add item to cart
function addToCartItem(product, quantity) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    updateCartCount();
    updateCartDisplay();
    saveCart();
    showNotification(`${product.name} added to cart!`);
}

// Update cart count
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Update cart display
function updateCartDisplay() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center">Your cart is empty</p>';
        cartTotal.textContent = '₹0';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img src="${item.image || 'https://via.placeholder.com/50x50'}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
            <div class="flex-1">
                <h4 class="font-semibold text-gray-800 dark:text-white text-sm">${item.name}</h4>
                <p class="text-gray-600 dark:text-gray-300 text-sm">₹${item.price} x ${item.quantity}</p>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total}`;
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    updateCartDisplay();
    saveCart();
}

// Open cart
function openCart() {
    cartSidebar.classList.remove('translate-x-full');
    cartOverlay.classList.remove('hidden');
}

// Close cart
function closeCart() {
    cartSidebar.classList.add('translate-x-full');
    cartOverlay.classList.add('hidden');
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('quickmart-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
        updateCartDisplay();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('quickmart-cart', JSON.stringify(cart));
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    showNotification('Checkout functionality coming soon!');
}

// Go back
function goBack() {
    window.history.back();
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show loading state
function showLoading(show) {
    if (show) {
        loadingState.style.display = 'block';
        productsGrid.style.display = 'none';
        noProductsState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Close modal when clicking outside
document.getElementById('productModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeCart();
    }
});

// Manual refresh function
function refreshProducts() {
    console.log('Manually refreshing products...');
    showLoading(true);
    
    // Force a new snapshot
    db.collection('products').get().then((snapshot) => {
        allProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        filteredProducts = [...allProducts];
        renderProducts();
        showLoading(false);
        showNotification('Products refreshed!');
    }).catch((error) => {
        console.error('Error refreshing products:', error);
        showLoading(false);
        showError('Failed to refresh products');
    });
}

// Function to get dynamic subcategories for a category
function getDynamicSubcategories(category) {
    const categoryOption = categoryOptions.find(cat => cat.value === category);
    if (!categoryOption) return [];
    
    let baseSubcategories = [];
    
    if (category === 'drinks') {
        baseSubcategories = categoryOption.subcategories.map(sub => sub.name);
    } else {
        baseSubcategories = categoryOption.subcategories;
    }
    
    // Get custom subcategories from Firestore categories collection
    const firestoreSubcategories = categoriesData
        .filter(cat => cat.category === category)
        .map(cat => cat.name);
    
    // Get custom subcategories from actual products (fallback)
    const productSubcategories = [...new Set(allProducts
        .filter(product => product.category === category)
        .map(product => product.subcategory)
        .filter(Boolean)
    )];
    
    // Combine base, Firestore, and product subcategories, removing duplicates
    const allSubcategories = [...new Set([...baseSubcategories, ...firestoreSubcategories, ...productSubcategories])];
    return allSubcategories;
}

// Load categories from Firestore
async function loadCategories() {
    try {
        console.log('Loading categories from Firestore...');
        
        const unsubscribe = db.collection('categories').onSnapshot((snapshot) => {
            console.log('Categories snapshot received:', snapshot.docs.length, 'categories');
            categoriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Categories loaded:', categoriesData.length);
        }, (error) => {
            console.error('Error in categories listener:', error);
        });

        // Store unsubscribe function for cleanup (optional)
        window.unsubscribeCategories = unsubscribe;
        
    } catch (error) {
        console.error('Error setting up categories listener:', error);
    }
} 