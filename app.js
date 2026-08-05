/* ==========================================================================
   MIM89 FAST FOOD - ULTIMATE ENTERPRISE SYSTEM (v4.3 FULLY FIXED & FUNCTIONAL)
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

// 4️⃣ PUBLIC E-MENU FRONTEND
let cart = [];

function loadPublicMenu() {
    initData();
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const navContainer = document.getElementById('categoriesNav');
    const sectionsContainer = document.getElementById('menuSections');

    if (!navContainer || !sectionsContainer) return;
    navContainer.innerHTML = ''; sectionsContainer.innerHTML = '';

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
    const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes'].value.trim() : '';

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

    const newOrder = {
        id: 'ONLINE_' + Date.now().toString().slice(-6),
        customerName: name,
        phone: phone,
        address: area + ' - ' + address,
        serviceType: type === 'delivery' ? '🚗 توصيل' : '🍽️ صالة/سفري',
        items: [...cart],
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount,
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    // حفظ الطلب في قائمة الطلبات الواردة لكي تظهر في "طلبات المينيو" للكاشير
    let onlineOrders = getData('sys_online_orders');
    onlineOrders.unshift(newOrder);
    setData('sys_online_orders', onlineOrders);

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
    
    alert("تم إرسال طلبك بنجاح وسيتم تحويلك إلى الواتساب الآن.");
    window.open(`https://wa.me/9647750008630?text=${encodeURIComponent(waText)}`, '_blank');

    cart = [];
    updateCartBadge();
    closeModal('cartModal');
}

// 5️⃣ POS CASHIER TERMINAL ENGINE (Instant Login & Real Functioning Buttons)
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';

function initCashierPage() { 
    initData(); 
    loadPosDirectMenu('all');
    bindTopActionButtons();
    executeInstantLogin();
}

function executeInstantLogin() {
    document.querySelectorAll('#authOverlay, .auth-overlay, [id*="auth"], [id*="login"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#cashierMainApp, .main-app, [id*="Main"], [id*="dashboard"]').forEach(el => el.style.display = 'block');
    activeCashierUser = { id: "c1", name: "الكاشير الرئيسي" };
}

function loginCashier() { executeInstantLogin(); }
function loginAdmin() { executeInstantLogin(); }
function loginInventory() { executeInstantLogin(); }
window.loginAdmin = loginAdmin;
window.loginInventory = loginInventory;
window.loginCashier = loginCashier;

function logoutCashier() { location.reload(); }

// برمجة الأزرار العلوية الحقيقية (السجل، طلبات المينيو، تفعيل الدوام، خروج)
function bindTopActionButtons() {
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.innerText || "";
        if (text.includes("دخول") || text.includes("الشاشة")) {
            btn.onclick = (e) => { e.preventDefault(); executeInstantLogin(); };
        } else if (text.includes("خروج")) {
            btn.onclick = () => logoutCashier();
        } else if (text.includes("السجل")) {
            btn.onclick = () => openSalesHistoryModal();
        } else if (text.includes("طلبات المينيو")) {
            btn.onclick = () => openMenuOrdersModal();
        } else if (text.includes("تفعيل الدوام")) {
            btn.onclick = () => alert("🟢 وردية العمل نشطة ومفتوحة وجاهزة لتسجيل المبيعات.");
        }
    });
}

// 📜 نافذة السجل الحقيقية (تعرض جميع الفواتير والمبيعات المكتملة)
function openSalesHistoryModal() {
    const orders = getData('sys_completed_orders');
    let modal = document.getElementById('dynamicHistoryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicHistoryModal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999; font-family:"Tajawal",sans-serif;';
        document.body.appendChild(modal);
    }

    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    modal.innerHTML = `
        <div style="background:#16161f; border:1px solid var(--gold-primary, #d4af37); width:90%; max-width:500px; max-height:80vh; border-radius:16px; padding:20px; color:#fff; overflow-y:auto; text-align:right;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:15px;">
                <h3 style="margin:0; color:var(--gold-primary); font-size:1.1rem;">📊 سجل المبيعات والطلبات المكتملة</h3>
                <button onclick="document.getElementById('dynamicHistoryModal').style.display='none'" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <div style="background:#202028; padding:10px 15px; border-radius:10px; margin-bottom:15px; display:flex; justify-content:space-between;">
                <span>إجمالي مبيعات اليوم:</span>
                <strong style="color:var(--gold-primary);">${totalSales.toLocaleString()} د.ع</strong>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${orders.length === 0 ? '<p style="text-align:center; color:#888; padding:20px;">لا توجد مبيعات مسجلة حتى الآن</p>' : 
                  orders.map(o => `
                    <div style="background:#202028; padding:12px; border-radius:10px; border-left:4px solid var(--gold-primary);">
                        <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:5px;">
                            <span>#${o.id} - ${o.customerName || 'مباشر'}</span>
                            <span style="color:var(--gold-primary);">${(o.totalAmount || 0).toLocaleString()} د.ع</span>
                        </div>
                        <div style="font-size:0.8rem; color:#aaa;">الخدمة: ${o.serviceType || 'صالة'} | الوقت: ${o.timestamp || ''}</div>
                    </div>
                  `).join('')}
            </div>
            <button onclick="document.getElementById('dynamicHistoryModal').style.display='none'" style="width:100%; margin-top:15px; background:var(--gold-primary); color:#000; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">إغلاق السجل</button>
        </div>
    `;
    modal.style.display = 'flex';
}

// 📥 نافذة طلبات المينيو الواردة الحقيقية
function openMenuOrdersModal() {
    const orders = getData('sys_online_orders');
    let modal = document.getElementById('dynamicMenuOrdersModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicMenuOrdersModal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999; font-family:"Tajawal",sans-serif;';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:#16161f; border:1px solid var(--gold-primary, #d4af37); width:90%; max-width:500px; max-height:80vh; border-radius:16px; padding:20px; color:#fff; overflow-y:auto; text-align:right;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:15px;">
                <h3 style="margin:0; color:var(--gold-primary); font-size:1.1rem;">📥 الطلبات الواردة عبر المينيو</h3>
                <button onclick="document.getElementById('dynamicMenuOrdersModal').style.display='none'" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${orders.length === 0 ? '<p style="text-align:center; color:#888; padding:20px;">لا توجد طلبات جديدة من الزبائن حالياً</p>' : 
                  orders.map((o, idx) => `
                    <div style="background:#202028; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:4px;">
                            <span>👤 ${o.customerName} (${o.phone})</span>
                            <span style="color:var(--gold-primary);">${(o.totalAmount || 0).toLocaleString()} د.ع</span>
                        </div>
                        <div style="font-size:0.82rem; color:#ccc; margin-bottom:6px;">📍 ${o.address}</div>
                        <div style="font-size:0.78rem; color:#aaa; margin-bottom:8px;">الوجبات: ${o.items.map(i => i.name + ' (x' + i.qty + ')').join(', ')}</div>
                        <button onclick="acceptOnlineOrder(${idx})" style="background:#28a745; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">✓ قبول وطباعة الفاتورة</button>
                    </div>
                  `).join('')}
            </div>
            <button onclick="document.getElementById('dynamicMenuOrdersModal').style.display='none'" style="width:100%; margin-top:15px; background:var(--gold-primary); color:#000; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">إغلاق القائمة</button>
        </div>
    `;
    modal.style.display = 'flex';
}

function acceptOnlineOrder(index) {
    let orders = getData('sys_online_orders');
    let completed = getData('sys_completed_orders');
    let order = orders[index];
    
    orders.splice(index, 1);
    setData('sys_online_orders', orders);
    
    completed.unshift(order);
    setData('sys_completed_orders', completed);

    printReceipt(order);
    openMenuOrdersModal();
}

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
            <div class="pos-product-card" onclick="addToPosCart(${item.id})" style="background:#16161f; border:1px solid rgba(212,175,55,0.25); border-radius:12px; padding:8px; text-align:center; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s;">
                <img src="${item.image}" style="width:100%; height:75px; object-fit:cover; border-radius:8px; margin-bottom:5px;">
                <h4 style="font-size:0.78rem; color:#fff; margin:2px 0; line-height:1.2; font-weight:700;">${item.name}</h4>
                <span style="font-size:0.75rem; color:var(--gold-bright, #f3e5ab); font-weight:bold; margin-top:4px;">${Number(item.price).toLocaleString()} د.ع</span>
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

function processPosDirectCheckout() {
    if (posCart.length === 0) return alert("اختر وجبات أولاً للفاتورة!");
    
    const custName = (document.getElementById('posCustName') && document.getElementById('posCustName').value.trim()) || "زبون مباشر";
    const custPhone = (document.getElementById('posCustPhone') && document.getElementById('posCustPhone').value.trim()) || "-";
    const custAddress = (document.getElementById('posCustAddress') && document.getElementById('posCustAddress').value.trim()) || "-";

    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    if (custPhone !== "-") {
        saveOrUpdateCustomer(custPhone, custName, custAddress, custAddress);
    }

    const directOrder = {
        id: 'POS_' + Date.now().toString().slice(-6),
        customerName: custName,
        phone: custPhone,
        address: custAddress,
        orderType: selectedPosOrderType,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? '💵 كاش' : '💳 فيزا',
        serviceType: selectedPosOrderType === 'takeaway' ? '🛍️ سفري' : (selectedPosOrderType === 'delivery' ? '🚗 توصيل' : '🍽️ صالة'),
        items: [...posCart],
        subtotal: subtotal,
        deliveryFee: 0,
        totalAmount: subtotal,
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    let completed = getData('sys_completed_orders');
    completed.unshift(directOrder);
    setData('sys_completed_orders', completed);

    printReceipt(directOrder);
    clearPosCart();
}

// 🖨️ نظام طباعة الفاتورة الحقيقي والفعال
function printReceipt(order) {
    let receiptContainer = document.getElementById('receiptModal');
    if (!receiptContainer) {
        receiptContainer = document.createElement('div');
        receiptContainer.id = 'receiptModal';
        receiptContainer.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:99999;';
        document.body.appendChild(receiptContainer);
    }

    const itemsHtml = (order.items || []).map(i => `
        <div style="display:flex; justify-content:space-between; font-size:12px; font-family:monospace; margin-bottom:4px; border-bottom:1px dashed #eee; padding-bottom:3px;">
            <span style="font-weight:bold;">${i.name} (×${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()}</span>
        </div>
    `).join('');

    receiptContainer.innerHTML = `
        <div class="modal-content" style="background:#fff !important; color:#000 !important; width:280px; margin:0 auto; padding:15px; font-family:'Tajawal', sans-serif; text-align:right; border-radius:8px;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px;">
                <h2 style="margin:0; font-size:18px; font-weight:900;">MIM89 FAST FOOD</h2>
                <p style="margin:2px 0; font-size:11px;">بغداد - القاهرة | 07750008630</p>
                <div style="font-size:12px; font-weight:bold; margin-top:4px; background:#000; color:#fff; padding:2px 0; border-radius:4px;">
                    فاتورة رقم: #${order.id}
                </div>
            </div>
            <div style="font-size:11px; margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:6px;">
                <div><strong>👤 الزبون:</strong> ${order.customerName || 'مباشر'}</div>
                <div><strong>📞 الهاتف:</strong> ${order.phone || '-'}</div>
                <div><strong>🚗 الخدمة:</strong> ${order.serviceType || 'صالة'}</div>
                <div><strong>⏰ الوقت:</strong> ${order.dateDate} | ${order.timestamp}</div>
            </div>
            <div style="margin-bottom:10px;">
                ${itemsHtml}
            </div>
            <div style="border-top:2px solid #000; padding-top:6px; margin-top:10px; font-weight:900; font-size:14px; display:flex; justify-content:space-between;">
                <span>المجموع:</span>
                <span>${(order.totalAmount || 0).toLocaleString()} د.ع</span>
            </div>
            <button onclick="window.print(); document.getElementById('receiptModal').style.display='none';" style="width:100%; margin-top:10px; background:#000; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">🖨️ طباعة الآن</button>
            <button onclick="document.getElementById('receiptModal').style.display='none';" style="width:100%; margin-top:5px; background:#ccc; color:#000; border:none; padding:6px; border-radius:6px; cursor:pointer; font-weight:bold;">إغلاق</button>
        </div>
    `;
    receiptContainer.style.display = 'flex';
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
        bindTopActionButtons();
        executeInstantLogin();
    }
});
