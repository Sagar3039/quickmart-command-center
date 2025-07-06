# QuickMart Command Center & E-Commerce Platform

This project consists of two parts:
1. **Admin Panel** - For managing products in Firebase
2. **E-Commerce Website** - For displaying products to customers

## 🚀 Quick Start

### Admin Panel (Product Management)

The admin panel is built with React + TypeScript and allows you to manage products in Firebase.

#### Features:
- ✅ Add new products with all required fields
- ✅ Edit existing products
- ✅ Delete products
- ✅ Category and subcategory management
- ✅ Product images, descriptions, ratings, and tags
- ✅ Stock management
- ✅ Delivery time settings
- ✅ Real-time Firebase integration

#### Setup:
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Product Fields:
- **Name** - Product name
- **Category** - Foods, Daily Essentials, Drinks
- **Subcategory** - Dynamic based on category selection
- **Price** - Product price
- **Stock** - Available quantity
- **Image URL** - Product image
- **Description** - Product description
- **Delivery Time** - 15-30 mins, 30-45 mins, 45-60 mins, 1-2 hours
- **Rating** - 0-5 rating
- **In Stock** - Boolean toggle
- **Tags** - Array of tags for search

### E-Commerce Website

The e-commerce website displays products from the same Firebase database and provides a shopping experience for customers.

#### Features:
- ✅ Browse products by category
- ✅ Search products
- ✅ Product details modal
- ✅ Shopping cart functionality
- ✅ Responsive design
- ✅ Real-time product updates

#### Setup:
```bash
# Navigate to e-commerce directory
cd ecommerce-site

# Open index.html in a web browser
# Or serve with a local server:
python -m http.server 8000
# Then visit http://localhost:8000
```

## 🔥 Firebase Configuration

Both applications use the same Firebase configuration:

```javascript
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
```

## 📊 Database Structure

Products are stored in Firestore with the following structure:

```javascript
{
  name: "Product Name",
  category: "Foods|Daily Essentials|Drinks",
  subcategory: "snacks|meals|desserts|...",
  price: 29.99,
  stock: 100,
  image: "https://example.com/image.jpg",
  description: "Product description",
  deliveryTime: "30-45 mins",
  inStock: true,
  rating: 4.5,
  tags: ["tag1", "tag2", "tag3"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🛠️ How to Use

### For Admins:
1. Start the admin panel: `npm run dev`
2. Navigate to the Product Management section
3. Click "Add Product" to create new products
4. Fill in all required fields
5. Products will be saved to Firebase and immediately available on the e-commerce site

### For Customers:
1. Open the e-commerce website (`ecommerce-site/index.html`)
2. Browse products by category
3. Search for specific products
4. Click on products to view details
5. Add items to cart

## 🔄 Real-time Updates

Both applications use Firebase's real-time listeners, so:
- When you add/edit/delete products in the admin panel, changes appear immediately on the e-commerce site
- No page refresh required
- Multiple users can see updates in real-time

## 📱 Responsive Design

Both applications are fully responsive and work on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 Customization

### Admin Panel:
- Modify `src/components/ProductManager.tsx` to change the admin interface
- Update categories in the `categoryOptions` array
- Customize form fields and validation

### E-Commerce Site:
- Modify `ecommerce-site/index.html` for layout changes
- Update `ecommerce-site/app.js` for functionality changes
- Customize styling in the HTML file

## 🚀 Deployment

### Admin Panel:
```bash
npm run build
# Deploy the dist folder to your hosting service
```

### E-Commerce Site:
- Upload the `ecommerce-site` folder to any web hosting service
- Or deploy to Firebase Hosting, Netlify, Vercel, etc.

## 🔧 Troubleshooting

### Common Issues:

1. **Firebase connection errors**
   - Check your Firebase configuration
   - Ensure Firestore rules allow read/write access

2. **Products not loading**
   - Check browser console for errors
   - Verify Firebase collection name is 'products'

3. **Images not displaying**
   - Ensure image URLs are accessible
   - Check for CORS issues with external images

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Firebase configuration
3. Ensure all dependencies are installed

## 🎯 Future Enhancements

Potential improvements:
- User authentication
- Order management
- Payment integration
- Inventory tracking
- Analytics dashboard
- Multi-language support
- Advanced filtering options
