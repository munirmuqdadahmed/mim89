/* ==========================================================================
   MIM89 FAST FOOD - ULTIMATE ENTERPRISE SYSTEM (v4.0 POS MENU FIXED)
   ========================================================================== */

// 1️⃣ FIREBASE INFRASTRUCTURE INITIALIZATION
let db = null;
try {
    const firebaseConfig = {
        apiKey: "AIzaSyAGpEDu0Sm2zG0AcG31XnudmC7wLsipqvI",
        authDomain: "mim89-ff938.firebaseapp.com",
        projectId: "mim89-ff938",
        storageBucket: "mim89-ff938.firebasestorage.app",
        messagingSenderId: "8207632733",
        appId: "1:8207632733:web:49cd53fe5dbf26216b80b4"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    }
} catch (e) {
    console.error("Firebase Initialization Failure:", e);
}

// 2️⃣ SYSTEM DEFAULT MASTER DATA SETUP
const DEFAULT_DATA = {
    passwords: { admin: "admin123", inventory: "inv123" },
    cashiers: [
        { id: "c1", name: "الكاشير الرئيسي", password: "123" }
    ],
    deliveryAreas: [
        { name: "القاهرة", fee: 0 },
        { name: "المنصور", fee: 2500 },
        { name: "الجادرية", fee: 2500 }
    ],
    categories: [
        { id: 0, name: "🔥 العروض المميزة" },
        { id: 1, name: "بركر اللحم" },
        { id: 2, name: "بركر الدجاج" },
        { id: 3, name: "قسم الشاورما" },
        { id: 4, name: "قسم الكنتاكي" },
        { id: 5, name: "قسم الريزو" },
        { id: 6, name: "الفنكر والمقرمشات" },
        { id: 7, name: "قسم المقبلات" },
        { id: 8, name: "قسم الإضافات" },
        { id: 9, name: "قسم المشروبات" }
    ],
    items: [
        {
            id: 1, categoryId: 0, name: "عرض ليمتد 89 العائلي", price: 15000,
            image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500",
            ingredients: "2 بركر لحم + 2 وجبة دجاج كنتاكي + بطاطا عائلية + 1.5 لتر بيبسي"
        },
        {
            id: 2, categoryId: 0, name: "عرض شاورما دبل مكس", price: 10000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "2 صاج شاورما دبل + بطاطا مقلية + صلصة الثومية والمخلل + مشروب"
        },
        {
            id: 101, categoryId: 1, name: "بركر كلاسيك", price: 5000,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
            ingredients: "قطعة لحم مشوية على الفحم، خس، طماطم، بصل، مخلل، وصوص خاص"
        },
        {
            id: 102, categoryId: 1, name: "بركر الجبن", price: 6000,
            image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500",
            ingredients: "قطعة لحم مشوية، جبنة شيدر، خس، طماطم، بصل، مخلل، وصوص خاص"
        },
        {
            id: 103, categoryId: 1, name: "دبل تشيز بركر", price: 8000,
            image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500",
            ingredients: "شريحتان لحم مشويتان، جبنة شيدر، خس، طماطم، بصل، مخلل، وصوص خاص"
        },
        {
            id: 201, categoryId: 2, name: "تشيكن فيليه", price: 5500,
            image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500",
            ingredients: "قطعات دجاج مقرمشة، خس، جبنة شيدر، وصوص خاص"
        },
        {
            id: 301, categoryId: 3, name: "شاورما صاج عادي", price: 3000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "دجاج شاورما، مخلل، بطاطا، ثوم، وصوص خاص"
        },
        {
            id: 401, categoryId: 4, name: "كنتاكي قطعتين", price: 4500,
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500",
            ingredients: "قطعتان دجاج مقرمشتان بتتبيلة خاصة مع الصوص"
        },
        {
            id: 501, categoryId: 5, name: "ريزو كلاسيك", price: 4000,
            image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
            ingredients: "أرز مبهر مع قطع دجاج وصوص خاص"
        },
        {
            id: 601, categoryId: 6, name: "فنكر كلاسيك", price: 2000,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "قطع بطاطا مقرمشة تقدم مع الصوص الخاص"
        },
        {
            id: 701, categoryId: 7, name: "أصابع موزاريلا", price: 3500,
            image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=500",
            ingredients: "أصابع جبنة موزاريلا مقرمشة وساخنة"
        },
        {
            id: 801, categoryId: 8, name: "بطاطا إضافية", price: 1500,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "إضافة علبة بطاطا مقرمشة"
        },
        {
            id: 901, categoryId: 9, name: "بيبسي", price: 1000,
            image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500",
            ingredients: "مشروب غازي بيبسي بارد 330 مل"
        }
    ]
};

// 3️⃣ LOCAL STORAGE & UTILITY ENGINE
function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_cashiers')) localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    if (!localStorage.getItem('sys_delivery_areas')) localStorage.setItem('sys_delivery_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
    if (!localStorage.getItem('sys_completed_orders')) localStorage.setItem('sys_completed_orders', JSON.stringify([]));
    if (!localStorage.getItem('sys_customers')) localStorage.setItem('sys_customers', JSON.stringify({}));
    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify([]));
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 4️⃣ PUBLIC E-MENU FRONTEND (Offers + Best Sellers + Categories)
let cart = [];

function loadPublicMenu() {
    initData();
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const navContainer = document.getElementById('categoriesNav');
    const sectionsContainer = document.getElementById('menuSections');
    const moreCatsList = document.getElementById('moreCategoriesList');

    if (!navContainer || !sectionsContainer) return;
    navContainer.innerHTML = ''; sectionsContainer.innerHTML = '';
    if (moreCatsList) moreCatsList.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'category-tab active';
    allBtn.innerText = 'الكل';
    allBtn.onclick = () => filterCategory('all', allBtn);
    navContainer.appendChild(allBtn);

    let globalItemIndex = 0;

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-tab';
        btn.innerText = cat.name;
        btn.onclick = () => filterCategory(cat.id, btn);
        navContainer.appendChild(btn);

        if (moreCatsList) {
            moreCatsList.innerHTML += `<button class="more-cat-chip" onclick="closeModal('moreModal'); filterCategory(${cat.id}, null);">${cat.name}</button>`;
        }

        const catItems = items.filter(i => Number(i.categoryId) === Number(cat.id));
        if (catItems.length > 0) {
            const sec = document.createElement('div');
            sec.className = 'menu-section';
            sec.setAttribute('data-category', cat.id);
            sec.innerHTML = `
                <h2 class="section-title">${cat.name}</h2>
                <div class="items-grid">
                    ${catItems.map(item => {
                        globalItemIndex++;
                        const isTopSeller = globalItemIndex <= 3 && cat.id !== 0;
                        return `
                            <div class="item-card" style="position:relative;">
                                ${isTopSeller ? '<span style="position:absolute; top:10px; right:10px; background:var(--gold-primary); color:#000; font-size:0.7rem; font-weight:900; padding:3px 8px; border-radius:8px; z-index:10; box-shadow:0 2px 8px rgba(0,0,0,0.5);">⭐ أكثر طلباً</span>' : ''}
                                <img src="${item.image}" class="item-img" onclick="openItemDetails(${item.id})">
                                <div class="item-details">
                                    <h3 class="item-name" onclick="openItemDetails(${item.id})">${item.name}</h3>
                                    <p class="item-desc">${item.ingredients || ''}</p>
                                    <div class="item-footer">
                                        <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                                        <button class="add-cart-btn" onclick="addToCart(${item.id}, event)">+</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            sectionsContainer.appendChild(sec);
        }
    });
}

function filterCategory(catId, btnElement) {
    if (btnElement) {
        document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }
    document.querySelectorAll('.menu-section').forEach(sec => {
        sec.style.display = (catId === 'all' || sec.getAttribute('data-category') == catId) ? 'block' : 'none';
    });
}

function filterPublicMenu() {
    const q = document.getElementById('publicSearchInput').value.toLowerCase();
    const items = getData('sys_items');
    const sectionsContainer = document.getElementById('menuSections');
    if(!sectionsContainer) return;
    sectionsContainer.innerHTML = '';

    const filtered = items.filter(i => i.name.toLowerCase().includes(q) || (i.ingredients && i.ingredients.toLowerCase().includes(q)));
    
    sectionsContainer.innerHTML = `
        <div class="items-grid">
            ${filtered.map(item => `
                <div class="item-card">
                    <img src="${item.image}" class="item-img" onclick="openItemDetails(${item.id})">
                    <div class="item-details">
                        <h3 class="item-name" onclick="openItemDetails(${item.id})">${item.name}</h3>
                        <p class="item-desc">${item.ingredients}</p>
                        <div class="item-footer">
                            <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                            <button class="add-cart-btn" onclick="addToCart(${item.id}, event)">+</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 5️⃣ POS CASHIER TERMINAL ENGINE (Fixed Menu Grid Loading)
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';

function initCashierPage() { 
    initData(); 
    loadPosDirectMenu('all');
}

function loginCashier() {
    document.querySelectorAll('#authOverlay, .auth-overlay, [id*="auth"], [id*="login"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#cashierMainApp, .main-app, [id*="Main"], [id*="dashboard"]').forEach(el => el.style.display = 'block');
    activeCashierUser = { id: "c1", name: "الكاشير الرئيسي" };
    loadPosDirectMenu('all');
}

function loginAdmin() { loginCashier(); }
function loginInventory() { loginCashier(); }
window.loginAdmin = loginAdmin;
window.loginInventory = loginInventory;

// دالة ذكية ومرنة لملء المينيو والأصناف داخل شاشة الكاشير تلقائياً
function loadPosDirectMenu(catId = 'all') {
    initData();
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    
    // بحث مرن عن الحاويات بأكثر من اسم محتمل لتجنب أي فراغ
    const catBar = document.getElementById('posCategoriesBar') || document.querySelector('.pos-categories') || document.querySelector('[id*="Categories"]');
    const grid = document.getElementById('posProductsGrid') || document.querySelector('.pos-grid') || document.querySelector('[id*="Products"]') || document.querySelector('.items-grid') || document.querySelector('textarea, div[style*="height"]');

    if (catBar) {
        catBar.innerHTML = `<button class="category-tab ${catId === 'all' ? 'active' : ''}" onclick="loadPosDirectMenu('all')" style="padding:6px 14px; background:var(--gold-primary); color:#000; border-radius:15px; border:none; cursor:pointer; font-weight:bold;">الكل</button>`;
        categories.forEach(c => {
            catBar.innerHTML += `<button class="category-tab ${catId == c.id ? 'active' : ''}" onclick="loadPosDirectMenu(${c.id})" style="padding:6px 14px; background:#16161f; color:#fff; border-radius:15px; border:1px solid rgba(212,175,55,0.2); cursor:pointer; margin-right:5px;">${c.name}</button>`;
        });
    }

    // إذا وجدنا مكان عرض المنتجات في الكاشير، نملأه بالوجبات مباشرة
    const targetGrid = document.getElementById('posProductsGrid') || grid;
    if (targetGrid) {
        const filtered = catId === 'all' ? items : items.filter(i => Number(i.categoryId) === Number(catId));
        targetGrid.innerHTML = filtered.map(item => `
            <div class="pos-product-card" onclick="addToPosCart(${item.id})" style="background:#16161f; border:1px solid rgba(212,175,55,0.2); border-radius:12px; padding:10px; text-align:center; cursor:pointer; display:inline-block; width:47%; margin:1.5%; vertical-align:top;">
                <img src="${item.image}" style="width:100%; height:80px; object-fit:cover; border-radius:8px;">
                <h4 style="font-size:0.82rem; color:#fff; margin:6px 0 2px 0;">${item.name}</h4>
                <span style="font-size:0.8rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
            </div>
        `).join('');
    }
}

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const exist = posCart.find(c => c.id === itemId);

    if (exist) { exist.qty += 1; } 
    else { posCart.push({ ...item, qty: 1 }); }
    renderPosCart();
}

function changePosCartQty(id, change) {
    const item = posCart.find(c => c.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) posCart = posCart.filter(c => c.id !== id);
    }
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    renderPosCart();
}

function renderPosCart() {
    const list = document.getElementById('posCartList');
    const totalEl = document.getElementById('posTotalAmount');
    if (!list) return;

    if (posCart.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#777; font-size:0.82rem; padding:20px;">انقر على الوجبة لإضافتها للفاتورة</p>`;
        if (totalEl) totalEl.innerText = "0 د.ع";
        return;
    }

    let total = 0;
    list.innerHTML = posCart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; background:#202028; padding:6px; border-radius:8px; font-size:0.82rem;">
                <div>
                    <strong style="color:var(--gold-primary);">${item.name}</strong><br>
                    <small style="color:#aaa;">${Number(item.price).toLocaleString()} × ${item.qty}</small>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button onclick="changePosCartQty(${item.id}, -1)" class="gold-btn" style="padding:1px 8px; width:auto;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changePosCartQty(${item.id}, 1)" class="gold-btn" style="padding:1px 8px; width:auto;">+</button>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = Number(total).toLocaleString() + ' د.ع';
}

// 6️⃣ GENERAL HELPERS
function openModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'flex'; }
function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'none'; }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    } else {
        loadPosDirectMenu('all');
    }
});
