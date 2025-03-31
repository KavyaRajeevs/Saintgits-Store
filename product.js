document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        // Redirect to home if no product ID is provided
        window.location.href = 'home.html';
        return;
    }
    
    // For demo purposes, use mock data if no API is available
    if (window.location.protocol === 'file:') {
        displayMockProductDetails(productId);
    } else {
        // Fetch product details from API
        fetchProductDetails(productId);
    }
    
});
function logout() {
    localStorage.removeItem('token');
    window.location.href = "login.html";
    window.history.replaceState(null, null, "login.html");
}


// Fetch product details from API
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`http://localhost:3000/college_store/${productId}`);
        if (!response.ok) {
            throw new Error('Product not found');
        }
        
        const product = await response.json();
        displayProductDetails(product);
        fetchRecommendations(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        document.querySelector('.product-container').innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>Sorry, the product you're looking for could not be found.</p>
                <a href="home.html" class="btn">Go Back to Shop</a>
            </div>
        `;
    }
}

// Display product details on the page
function displayProductDetails(product) {
    // Set product image
    document.getElementById('product-img').src = product.imageUrl || 'placeholder.jpg';
    
    // Set product name
    document.getElementById('product-name').textContent = product.name;
    
    // Set stock status with color indication
    const stockStatus = document.getElementById('stock-status');
    if (product.instock > 5) {
        stockStatus.textContent = `In Stock(${product.instock})`;
        stockStatus.className = 'in-stock';
    } else if (product.instock > 0) {
        stockStatus.textContent = `Low Stock(${product.instock})`;
        stockStatus.className = 'low-stock';
    } else {
        stockStatus.textContent = 'Out of Stock';
        stockStatus.className = 'low-stock';
    }
    
    // Set price
    document.getElementById('product-price').textContent = `Rs.${product.price.toFixed(2)}`;
    
    // Set product details
    document.getElementById('product-size').textContent = product.size || 'N/A';
    document.getElementById('product-color').textContent = Array.isArray(product.color) 
        ? product.color.join(', ') 
        : (product.color || 'N/A');
    document.getElementById('product-company').textContent = product.company || 'N/A';
    
    // Set up purchase controls based on stock availability
    const purchaseControls = document.getElementById('purchase-controls');
    
    if (product.instock > 0) {
        // For any stock level above 0, show Add to Cart button
        purchaseControls.innerHTML = `
            <div class="quantity-controls">
                <button id="decrease-qty">-</button>
                <input type="number" id="quantity" value="1" min="1" max="${product.instock}">
                <button id="increase-qty">+</button>
            </div>
            <div class="action-buttons">
                <button id="add-to-cart" class="btn">Add to Cart</button>
                <button id="add-to-wishlist" class="wishlist-btn">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        `;
        
        // Set up quantity controls
        setupQuantityControls(product.instock);
        
        // Set up add to cart button
        document.getElementById('add-to-cart').addEventListener('click', () => {
            addToCart(product._id, product.name, product.price, product.imageUrl);
        });
        
        // Set up wishlist button
        document.getElementById('add-to-wishlist').addEventListener('click', () => {
            addToWishlist(product._id, product.name, product.price, product.imageUrl);
        });
    } else {
        // Only for completely out of stock (instock = 0) - show notify button
        purchaseControls.innerHTML = `
            <button id="notify-btn" class="btn">Notify Me When Available</button>
            <button id="add-to-wishlist" class="wishlist-btn">
                <i class="far fa-heart"></i>
            </button>
        `;
        
        // Set up notify button
        document.getElementById('notify-btn').addEventListener('click', showNotificationModal);
        
        // Set up wishlist button
        document.getElementById('add-to-wishlist').addEventListener('click', () => {
            addToWishlist(product._id, product.name, product.price, product.imageUrl);
        });
    }
}

// Set up quantity controls
function setupQuantityControls(maxStock) {
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('quantity');
    
    decreaseBtn.addEventListener('click', () => {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue < maxStock) {
            quantityInput.value = currentValue + 1;
        }
    });
    
    quantityInput.addEventListener('change', () => {
        let currentValue = parseInt(quantityInput.value);
        if (isNaN(currentValue) || currentValue < 1) {
            quantityInput.value = 1;
        } else if (currentValue > maxStock) {
            quantityInput.value = maxStock;
        }
    });
}

// Add product to cart
async function addToCart(productId, name, price, imageUrl) {
    try {
        const quantity = parseInt(document.getElementById('quantity').value);
        
        // If running locally, just show success alert
        if (window.location.protocol === 'file:') {
            alert('Product added to cart successfully!');
            return;
        }
        
        const response = await fetch('http://localhost:3000/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId,
                name,
                price,
                imageUrl,
                quantity,
                color: document.getElementById('product-color').textContent
            })
        });
        
        if (response.ok) {
            alert('Product added to cart successfully!');
        } else {
            throw new Error('Failed to add product to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart. Please try again.');
    }
}

// Add product to wishlist
async function addToWishlist(productId, name, price, imageUrl) {
    try {
        // If running locally, just show success alert and update icon
        if (window.location.protocol === 'file:') {
            alert('Product added to wishlist!');
            const wishlistIcons = document.querySelectorAll('.wishlist-btn i, .wishlist-icon i, .wishlist-btn-sm i');
            wishlistIcons.forEach(icon => {
                icon.className = 'fas fa-heart';
            });
            return;
        }
        
        const response = await fetch('http://localhost:3000/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId,
                name,
                price,
                imageUrl,
                color: document.getElementById('product-color').textContent
            })
        });
        
        if (response.ok) {
            alert('Product added to wishlist!');
            // Change heart icon to filled
            document.querySelector('#add-to-wishlist i').className = 'fas fa-heart';
        } else {
            throw new Error('Failed to add product to wishlist');
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Failed to add product to wishlist. Please try again.');
    }
}




// Fetch product recommendations
async function fetchRecommendations(currentProduct) {
    try {
        // Fetch products from the same category
        const response = await fetch(`/college_store/category/${currentProduct.category}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
        }
        
        let products = await response.json();
        
        // Filter out the current product
        products = products.filter(product => product._id !== currentProduct._id);
        
        // Sort by relevance (simple algorithm - products from same company first)
        products.sort((a, b) => {
            // Same company products come first
            if (a.company === currentProduct.company && b.company !== currentProduct.company) {
                return -1;
            }
            if (a.company !== currentProduct.company && b.company === currentProduct.company) {
                return 1;
            }
            
            // Then sort by price similarity
            const aPriceDiff = Math.abs(a.price - currentProduct.price);
            const bPriceDiff = Math.abs(b.price - currentProduct.price);
            return aPriceDiff - bPriceDiff;
        });
        
        // Display only up to 4 recommendations
        displayRecommendations(products.slice(0, 4));
        
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        document.querySelector('.recommendations-section').style.display = 'none';
    }
}

// Display product recommendations
function displayRecommendations(products) {
    const container = document.getElementById('recommendations-container');
    
    if (products.length === 0) {
        document.querySelector('.recommendations-section').style.display = 'none';
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const discount = Math.floor(Math.random() * 20) + 5; // Random discount between 5-25%
        const originalPrice = (product.price / (1 - discount / 100)).toFixed(2);
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            
            <div class="wishlist-icon">
                <i class="far fa-heart"></i>
            </div>
            <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${product.name}">
            <div class="product-card-info">
                <h3 class="product-card-title">${product.name}</h3>
                <div class="product-card-price">
                    <span class="current-price">₹${product.price.toFixed(2)}</span>
                   
                </div>
                <div class="product-card-actions">
                    <button class="card-btn add-to-cart">Add to Cart</button>
                    <button class="card-btn view-details" onclick="viewProductDetails('${product._id}')">View Details</button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// View product details
function viewProductDetails(productId) {
    window.location.href = `product.html?id=${productId}`;
}