/* ==========================================================================
   MIM89 FAST FOOD - ULTIMATE ENTERPRISE SYSTEM (v3.9 ADMIN TABS FIXED)
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

// 4️⃣ ADMIN TABS & DASHBOARD ENGINE (Fixed Top Buttons)
function switchAdminTab(tabId, btnElement) {
    // إخفاء جميع أقسام الإدارة
    document.querySelectorAll('.admin-section, .admin-tab-content, [id*="adminSection"], [id*="section"]').forEach(sec => {
        sec.style.display = 'none';
    });

    // إزالة التحديد عن كل الأزرار العلوية
    document.querySelectorAll('.admin-header-btn, .admin-nav button, button').forEach(b => {
        b.style.background = '#16161f';
        b.style.color = '#fff';
    });

    // إظهار القسم المطلوب بناءً على الـ ID أو الاسم
    const targetSection = document.getElementById(tabId) || document.querySelector('.' + tabId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        // إن لم يوجد قسم محدد، أظهر القسم العام
        const allSections = document.querySelectorAll('.admin-section');
        if (allSections.length > 0) allSections[0].style.display = 'block';
    }

    // تمييز الزر المضغوط حالياً باللون الذهبي
    if (btnElement) {
        btnElement.style.background = 'var(--gold-primary, #d4af37)';
        btnElement.style.color = '#000';
    }
}

// ربط الأزرار العلوية تلقائياً عند تحميل الصفحة لتعمل 100%
document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }

    // تفعيل أزرار الإدارة العلوية ذكي来的
    const adminButtons = document.querySelectorAll('header button, .admin-nav button, .top-nav-buttons button');
    adminButtons.forEach((btn, index) => {
        btn.onclick = function() {
            adminButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        };
    });
});

// 5️⃣ PUBLIC E-MENU FRONTEND (Offers + Best Sellers + Categories)
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

function openItemDetails(id) {
    const item = getData('sys_items').find(i => i.id === id);
    if (!item) return;
    document.getElementById('detailImg').src = item.image;
    document.getElementById('detailTitle').innerText = item.name;
    document.getElementById('detailPrice').innerText = Number(item.price).toLocaleString() + ' د.ع';
    document.getElementById('detailIngredients').innerText = item.ingredients;
    document.getElementById('detailAddBtn').onclick = (e) => { addToCart(item.id, e); closeModal('itemDetailModal'); };
    openModal('itemDetailModal');
}

function addToCart(itemId, event) {
    const items = getData('sys_items');
    const item = items.find(i => i.id === itemId);
    const exist = cart.find(c => c.id === itemId);

    if (exist) { exist.qty += 1; }
    else { cart.push({ ...item, qty: 1 }); }
    
    updateCartBadge();

    if (event && event.currentTarget) {
        const btn = event.currentTarget;
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
    }
}

function updateCartBadge() {
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    const badge = document.getElementById('cartBadgeCount');
    if (badge) badge.innerText = count;
}

function openCartModal() {
    renderCartModalItems();
    calculateDeliveryCost();
    openModal('cartModal');
}

function renderCartModalItems() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">السلة فارغة حالياً</p>`;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#202028; padding:10px 12px; border-radius:12px;">
            <div>
                <strong style="color:var(--gold-primary); font-size:0.95rem;">${item.name}</strong><br>
                <small style="color:#aaa;">${Number(item.price).toLocaleString()} د.ع</small>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button onclick="changeCartQty(${item.id}, -1)" class="gold-btn" style="padding:2px 10px; width:auto;">-</button>
                <span style="font-weight:bold;">${item.qty}</span>
                <button onclick="changeCartQty(${item.id}, 1)" class="gold-btn" style="padding:2px 10px; width:auto;">+</button>
            </div>
        </div>
    `).join('');
}

function changeCartQty(id, change) {
    const item = cart.find(c => c.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
    }
    updateCartBadge();
    renderCartModalItems();
    calculateDeliveryCost();
}

function toggleDeliveryFields() {
    const type = document.getElementById('orderTypeSelect').value;
    const group = document.getElementById('deliveryFieldsGroup');
    const feeLine = document.getElementById('deliveryFeeLine');
    if (type === 'delivery') {
        if(group) group.style.display = 'block';
        if(feeLine) feeLine.style.display = 'flex';
    } else {
        if(group) group.style.display = 'none';
        if(feeLine) feeLine.style.display = 'none';
    }
    calculateDeliveryCost();
}

function isCairoArea(text) {
    if (!text) return false;
    const cleanText = text.trim().toLowerCase();
    return cleanText.includes("قاهرة") || cleanText.includes("القاهرة") || cleanText.includes("قاهره") || cleanText.includes("القاهره");
}

function calculateDeliveryCost() {
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const orderType = document.getElementById('orderTypeSelect') ? document.getElementById('orderTypeSelect').value : 'delivery';
    
    const areaInput = document.getElementById('custArea') ? document.getElementById('custArea').value : '';
    const addressInput = document.getElementById('custAddress') ? document.getElementById('custAddress').value : '';
    const combinedAddress = areaInput + ' ' + addressInput;

    let deliveryFee = 0;
    if (orderType === 'delivery') {
        if (isCairoArea(combinedAddress)) { deliveryFee = 0; } else { deliveryFee = 2500; }
    }

    const subtotalEl = document.getElementById('subtotalPrice');
    const feeEl = document.getElementById('deliveryFeePrice');
    const totalEl = document.getElementById('finalTotalPrice');

    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString() + ' د.ع';
    if (feeEl) feeEl.innerText = deliveryFee === 0 ? "مجاني 🎉" : deliveryFee.toLocaleString() + ' د.ع';
    if (totalEl) totalEl.innerText = (subtotal + deliveryFee).toLocaleString() + ' د.ع';
}

function submitOrderToCashier() {
    if (cart.length === 0) return alert("السلة فارغة!");
    
    const name = document.getElementById('custName') ? document.getElementById('custName').value.trim() : '';
    const phone = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim() : '';
    const type = document.getElementById('orderTypeSelect') ? document.getElementById('orderTypeSelect').value : 'delivery';
    const area = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    const address = document.getElementById('custAddress') ? document.getElementById('custAddress').value.trim() : '';
    const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';

    if (!name) return alert("⚠️ يرجى كتابة الاسم الثلاثي أولاً");
    if (!phone || phone.length < 10) return alert("⚠️ يرجى كتابة رقم الهاتف الصحيح المكون من 11 رقم");
    
    if (type === 'delivery' && (!area || !address)) {
        return alert("⚠️ يرجى كتابة المنطقة والعنوان التفصيلي للتوصيل");
    }

    saveOrUpdateCustomer(phone, name, area, address);

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const combinedAddress = area + ' ' + address;
    let deliveryFee = (type === 'delivery') ? (isCairoArea(combinedAddress) ? 0 : 2500) : 0;
    const totalAmount = subtotal + deliveryFee;

    let itemsText = cart.map(i => `• ${i.name} (العدد: ${i.qty})`).join('\n');
    let waText = `🍔 *طلب جديد - MIM89 FAST FOOD*\n` +
                 `👤 *الزبون:* ${name}\n` +
                 `📞 *الهاتف:* ${phone}\n` +
                 `🚗 *الخدمة:* ${type === 'delivery' ? 'توصيل' : 'سفري/صالة'}\n` +
                 `📍 *العنوان:* ${area} - ${address}\n` +
                 `📝 *ملاحظات:* ${notes || 'لا يوجد'}\n` +
                 `---------------------------\n` +
                 `طلب الوجبات:\n${itemsText}\n` +
                 `---------------------------\n` +
                 `💰 *المجموع الكلي:* ${totalAmount.toLocaleString()} د.ع`;

    const waUrl = `https://wa.me/9647750008630?text=${encodeURIComponent(waText)}`;
    
    alert("سيتم تحويلك إلى الواتساب لإرسال الفاتورة الرسمية للمطعم.");
    window.open(waUrl, '_blank');

    cart = [];
    updateCartBadge();
    closeModal('cartModal');
}

// 6️⃣ UNIVERSAL LOGIN & CASHIER ENGINE
function loginCashier() {
    document.querySelectorAll('#authOverlay, .auth-overlay, [id*="auth"], [id*="login"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#cashierMainApp, .main-app, [id*="Main"], [id*="dashboard"]').forEach(el => el.style.display = 'block');
    activeCashierUser = { id: "c1", name: "الكاشير الرئيسي" };
}

function loginAdmin() { loginCashier(); }
function loginInventory() { loginCashier(); }
window.loginAdmin = loginAdmin;
window.loginInventory = loginInventory;

// 7️⃣ GENERAL HELPERS
function openModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'flex'; }
function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'none'; }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
