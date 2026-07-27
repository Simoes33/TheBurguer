// Cart State
let cart = [];

// DOM Elements
const cartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartCountElement = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const cartTotalPrice = document.getElementById('cart-total-price');

// Toggle Cart Drawer
function openCart() {
  cartOverlay.classList.add('active');
  cartDrawer.classList.add('active');
}

function closeCart() {
  cartOverlay.classList.remove('active');
  cartDrawer.classList.remove('active');
}

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Add to Cart Logic
function addToCart(name, price) {
  // Check if item already exists
  const existingItem = cart.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  
  updateCartUI();
  
  // Show quick feedback (could be a toast, but opening cart is a common pattern for food delivery)
  openCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateQuantity(index, change) {
  if (cart[index].quantity + change > 0) {
    cart[index].quantity += change;
    updateCartUI();
  } else if (cart[index].quantity + change === 0) {
    removeFromCart(index);
  }
}

// Update UI
function updateCartUI() {
  // Update count badge
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElement.textContent = totalItems;
  
  // Update Items List
  if (cart.length === 0) {
    emptyCartMsg.style.display = 'block';
    // Remove all item elements
    const itemElements = cartItemsContainer.querySelectorAll('.cart-item-row');
    itemElements.forEach(el => el.remove());
    cartTotalPrice.textContent = 'R$ 0,00';
    return;
  }
  
  emptyCartMsg.style.display = 'none';
  
  // Render items (simple clear and re-render for prototype)
  // First, remove existing rendered items
  const itemElements = cartItemsContainer.querySelectorAll('.cart-item-row');
  itemElements.forEach(el => el.remove());
  
  let total = 0;
  
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item-row';
    itemEl.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    `;
    
    itemEl.innerHTML = `
      <div style="flex: 1;">
        <h4 style="margin-bottom: 0.2rem">${item.name}</h4>
        <span style="color: var(--primary-color); font-weight: 600;">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.05); padding: 0.3rem 0.5rem; border-radius: 50px;">
        <button onclick="updateQuantity(${index}, -1)" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;"><i class="ph ph-minus"></i></button>
        <span style="font-weight: 600; width: 16px; text-align: center;">${item.quantity}</span>
        <button onclick="updateQuantity(${index}, 1)" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;"><i class="ph ph-plus"></i></button>
      </div>
    `;
    
    cartItemsContainer.appendChild(itemEl);
  });
  
  cartTotalPrice.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Checkout Function
function checkout() {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }
  
  alert("Redirecionando para o pagamento seguro... (Protótipo)");
  // Here we would integrate Stripe or similar
}
