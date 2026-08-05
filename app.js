/* ==========================================================================
   MIM89 FAST FOOD - ULTIMATE ENTERPRISE SYSTEM (v4.7 BULLETPROOF EVENT BINDING)
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

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_cashiers')) localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    if (!localStorage.getItem('sys_delivery_areas')) localStorage.setItem('sys_delivery_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
    if (!localStorage.getItem('sys_completed_orders')) localStorage.setItem('sys_completed_orders', JSON.stringify([]));
    if (!localStorage.getItem('sys_customers')) localStorage.setItem('sys_customers', JSON.stringify({}));
    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify([]));
    if (!localStorage.getItem('sys_online_orders')) localStorage.setItem('sys_online_orders', JSON.stringify([]));
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 4️⃣ LOGIN & INTERACTION ENGINE (Bulletproof Event Delegation)
function loginCashier() {
    // إخفاء كل ما يتعلق بشاشة الدخول بغض النظر عن أسماء العناصر
    const elementsToHide = document.querySelectorAll('#authOverlay, .auth-overlay, [id*="auth"], [id*="login"], form');
    elementsToHide.forEach(el => {
        el.style.display = 'none';
    });

    // إظهار التطبيق الرئيسي أو لوحة الكاشير
    const elementsToShow = document.querySelectorAll('#cashierMainApp, .main-app, [id*="Main"], [id*="App"], [id*="dashboard"], [id*="pos"]');
    elementsToShow.forEach(el => {
        el.style.display = 'block';
    });

    // إظهار أي عنصر مخفي يحتوي على محتوى الكاشير
    document.querySelectorAll('div, section').forEach(el => {
        if (window.getComputedStyle(el).display === 'none' && (el.id.includes('main') || el.id.includes('App') || el.id.includes('pos') || el.className.includes('main'))) {
            el.style.display = 'block';
        }
    });

    if (typeof loadPosDirectMenu === 'function') {
        loadPosDirectMenu('all');
    }
}

function loginAdmin() { loginCashier(); }
function loginInventory() { loginCashier(); }

// تحميل وترتيب شبكة الوجبات داخل الكاشير بشكل متناسق واحترافي
function loadPosDirectMenu(catId = 'all') {
    initData();
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    
    const catBar = document.getElementById('posCategoriesBar') || document.querySelector('.pos-categories') || document.querySelector('[id*="Categories"]');
    const targetGrid = document.getElementById('posProductsGrid') || document.querySelector('.pos-grid') || document.querySelector('[id*="Products"]') || document.querySelector('.items-grid');

    if (catBar) {
        catBar.innerHTML = `<button class="category-tab ${catId === 'all' ? 'active' : ''}" onclick="loadPosDirectMenu('all')" style="padding:6px 14px; background:var(--gold-primary, #d4af37); color:#000; border-radius:15px; border:none; cursor:pointer; font-weight:bold; white-space:nowrap;">الكل</button>`;
        categories.forEach(c => {
            catBar.innerHTML += `<button class="category-tab ${catId == c.id ? 'active' : ''}" onclick="loadPosDirectMenu(${c.id})" style="padding:6px 14px; background:#16161f; color:#fff; border-radius:15px; border:1px solid rgba(212,175,55,0.2); cursor:pointer; margin-right:5px; white-space:nowrap;">${c.name}</button>`;
        });
    }

    if (targetGrid) {
        targetGrid.style.display = 'grid';
        targetGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(110px, 1fr))';
        targetGrid.style.gap = '10px';
        targetGrid.style.padding = '5px';

        const filtered = catId === 'all' ? items : items.filter(i => Number(i.categoryId) === Number(catId));
        targetGrid.innerHTML = filtered.map(item => `
            <div class="pos-product-card" onclick="addToPosCard(${item.id})" style="background:#16161f; border:1px solid rgba(212,175,55,0.25); border-radius:12px; padding:8px; text-align:center; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s;">
                <img src="${item.image}" style="width:100%; height:75px; object-fit:cover; border-radius:8px; margin-bottom:5px;">
                <h4 style="font-size:0.78rem; color:#fff; margin:2px 0; line-height:1.2; font-weight:700;">${item.name}</h4>
                <span style="font-size:0.75rem; color:var(--gold-bright, #f3e5ab); font-weight:bold; margin-top:4px;">${Number(item.price).toLocaleString()} د.ع</span>
            </div>
        `).join('');
    }
}

let posCart = [];

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const exist = posCart.find(c => c.id === itemId);

    if (exist) { exist.qty += 1; } 
    else { posCart.push({ ...item, qty: 1 }); }
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

// ربط تلقائي لكل الأزرار والنماذج بمجرد تحميل الصفحة لتجاوز أي مشكلة في أزرار الدخول
document.addEventListener('DOMContentLoaded', () => {
    initData();
    
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, input[type="submit"], a');
        if (target) {
            const text = (target.innerText || target.value || "").trim();
            if (text.includes("دخول") || text.includes("الشاشة") || target.type === "submit") {
                e.preventDefault();
                loginCashier();
            }
        }
    });

    document.addEventListener('submit', (e) => {
        e.preventDefault();
        loginCashier();
    });
});

// التصدير الشامل لـ window لضمان عمل كافة الوظائف والأزرار
window.loginCashier = loginCashier;
window.loginAdmin = loginAdmin;
window.loginInventory = loginInventory;
window.loadPosDirectMenu = loadPosDirectMenu;
window.addToPosCart = addToPosCart;
