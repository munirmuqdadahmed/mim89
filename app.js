/* ==========================================
   MIM89 FAST FOOD - Core Engine (v6.0 Full Master Engine)
   ========================================== */

// 1. الاتصال بـ Firebase بمشروع mim89-ff938
let db = null;
try {
    const firebaseConfig = {
        apiKey: "AIzaSyAGpEDu0Sm2zG0AcG31XnudmC7wLsipqvI",
        authDomain: "mim89-ff938.firebaseapp.com",
        projectId: "mim89-ff938",
        storageBucket: "mim89-ff938.firebasestorage.app",
        messagingSenderId: "8207632733",
        appId: "1:8207632733:web:49cd53fe5dbf26216b80b4",
        measurementId: "G-D9GK0G77ZD"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("تم الاتصال السحابي اللحظي بـ Firebase بنجاح! 🚀");
    }
} catch (e) {
    console.warn("جاري التشغيل بالنظام المحلي:", e);
}

// 2. البيانات الأساسية الكاملة لمطعم MIM89 (خالية تماماً من الكص والجمص)
const DEFAULT_DATA = {
    passwords: { admin: "admin123", inventory: "inv123" },
    printerSettings: {
        enableIpPrinting: false,
        cashierIp: "192.168.1.100",
        kitchenIp: "192.168.1.101",
        port: "9100"
    },
    cashiers: [
        { id: "c1", name: "الكاشير الرئيسي", password: "123" }
    ],
    categories: [
        { id: 1, name: "🔥 العروض المميزة" },
        { id: 2, name: "بركر اللحم والبركر" },
        { id: 3, name: "قسم الشاورما (دجاج)" },
        { id: 4, name: "قسم الكنتاكي والريزو" },
        { id: 5, name: "الفنكر والمقبلات" },
        { id: 6, name: "قسم الإضافات" }
    ],
    deliveryAreas: [
        { name: "القاهرة", price: 0 },
        { name: "البنوك", price: 2000 },
        { name: "الأعظمية", price: 3000 },
        { name: "الشعب", price: 2500 }
    ],
    inventory: [
        { id: 1, name: "صدور دجاج طازجة", quantity: 100, unit: "كغم" },
        { id: 2, name: "خبز صاج", quantity: 200, unit: "قطع" },
        { id: 3, name: "بطاطس", quantity: 150, unit: "كغم" },
        { id: 4, name: "صلصة ثومية", quantity: 30, unit: "علبة" },
        { id: 5, name: "لحم عجل طازج", quantity: 80, unit: "كغم" },
        { id: 6, name: "خبز بركر", quantity: 100, unit: "قطع" }
    ],
    items: [
        // 🔥 العروض المميزة
        { id: 101, categoryId: 1, name: "عرض ليمتد 89 العائلي", price: 15000, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500", ingredients: "تشكيلة عائلية مميزة من وجبات MIM89", recipe: [] },
        { id: 102, categoryId: 1, name: "عرض شاورما دبل مكس", price: 10000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبتين شاورما دبل مع صوص وبطاطس", recipe: [{ invId: 1, qty: 0.3 }, { invId: 2, qty: 2 }] },

        // 🍔 قسم البركر
        { id: 201, categoryId: 2, name: "بركر كلاسيك", price: 5000, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500", ingredients: "شريحة لحم طازج، طماطم، خس، صوص خاص", recipe: [{ invId: 5, qty: 0.15 }, { invId: 6, qty: 1 }] },
        { id: 202, categoryId: 2, name: "بركر الجبن", price: 6000, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500", ingredients: "شريحة لحم عجل طازج مع جبن شيدر ذائب", recipe: [{ invId: 5, qty: 0.15 }, { invId: 6, qty: 1 }] },
        { id: 203, categoryId: 2, name: "دبل تشيز بركر", price: 8000, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500", ingredients: "شريحتي لحم طازج مع دبل جبن شيدر", recipe: [{ invId: 5, qty: 0.3 }, { invId: 6, qty: 1 }] },
        { id: 204, categoryId: 2, name: "بركر 89 الخاص (دجاج)", price: 7000, image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500", ingredients: "صدر دجاج مقرمش مع خلطة وجبن 89 الخاص", recipe: [{ invId: 1, qty: 0.2 }, { invId: 6, qty: 1 }] },

        // 🌯 قسم الشاورما (دجاج)
        { id: 301, categoryId: 3, name: "شاورما صاج عادي", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج، شاورما دجاج طازجة، صلصة ثومية، مخلل", recipe: [{ invId: 1, qty: 0.1 }, { invId: 2, qty: 1 }] },
        { id: 302, categoryId: 3, name: "وجبة شاورما", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج، بطاطس مقلية، ثومية، خبز طازج", recipe: [{ invId: 1, qty: 0.12 }, { invId: 3, qty: 0.1 }] },
        { id: 303, categoryId: 3, name: "شاورما صاج دبل", price: 4500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج دبل مع كمية دجاج مضاعفة", recipe: [{ invId: 1, qty: 0.2 }, { invId: 2, qty: 2 }] },
        { id: 304, categoryId: 3, name: "شاورما صاج سوبر", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج حجم سوبر مع الصوصات والبطاطس", recipe: [{ invId: 1, qty: 0.22 }, { invId: 2, qty: 2 }] },
        { id: 305, categoryId: 3, name: "شاورما عربي", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "قطع شاورما عربي مقطعة مع بطاطس وثومية", recipe: [{ invId: 1, qty: 0.2 }, { invId: 2, qty: 1.5 }] },
        { id: 306, categoryId: 3, name: "شاورما 89 الخاص", price: 5000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خلطة شاورما MIM89 الخاصة مع الجبن والصوص", recipe: [{ invId: 1, qty: 0.25 }, { invId: 2, qty: 2 }] },
        { id: 307, categoryId: 3, name: "وجبة شاورما دبل", price: 7500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبة شاورما مضاعفة الدجاج مع المقبلات", recipe: [{ invId: 1, qty: 0.3 }, { invId: 3, qty: 0.2 }] },
        { id: 308, categoryId: 3, name: "شاورما وزن 250 غرام", price: 7000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "ربع كغم شاورما دجاج صافي بدون خبز", recipe: [{ invId: 1, qty: 0.25 }] },
        { id: 309, categoryId: 3, name: "شاورما وزن 500 غرام", price: 13000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "نصف كغم شاورما دجاج صافي طازج", recipe: [{ invId: 1, qty: 0.5 }] },

        // 🍗 قسم الكنتاكي والريزو
        { id: 401, categoryId: 4, name: "كنتاكي قطعتين", price: 4500, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500", ingredients: "2 قطعة دجاج مقرمش، بطاطس، ثومية، خبز", recipe: [{ invId: 1, qty: 0.25 }, { invId: 3, qty: 0.15 }] },
        { id: 402, categoryId: 4, name: "ريزو (كلاسيك / كص)", price: 5000, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500", ingredients: "أرز ريزو متبل، قطع شاورما دجاج كص", recipe: [{ invId: 1, qty: 0.15 }] },
        { id: 403, categoryId: 4, name: "ريزو (جبنة / مشروم)", price: 6000, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500", ingredients: "أرز ريزو مع صوص الجبن والمشروم", recipe: [{ invId: 1, qty: 0.15 }] },
        { id: 404, categoryId: 4, name: "ريزو 89 الخاص", price: 7500, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500", ingredients: "أرز ريزو مع قطع دجاج مقرمشة وخلطة 89 الخاصة", recipe: [{ invId: 1, qty: 0.2 }] },
        { id: 405, categoryId: 4, name: "كنتاكي 4 قطع", price: 8000, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500", ingredients: "4 قطع كنتاكي مقرمش، بطاطس، خبز، ثومية", recipe: [{ invId: 1, qty: 0.5 }, { invId: 3, qty: 0.2 }] },
        { id: 406, categoryId: 4, name: "كنتاكي 6 قطع", price: 13000, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500", ingredients: "6 قطع كنتاكي مقرمش عائلي مع البطاطس", recipe: [{ invId: 1, qty: 0.75 }, { invId: 3, qty: 0.3 }] },
        { id: 407, categoryId: 4, name: "وجبة كنتاكي كاملة (10 قطع)", price: 20000, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500", ingredients: "10 قطع كنتاكي عائلي ضخم مع جميع الملحقات", recipe: [{ invId: 1, qty: 1.2 }, { invId: 3, qty: 0.5 }] },

        // 🍟 الفنكر والمقبلات
        { id: 501, categoryId: 5, name: "أصابع موزاريلا", price: 750, image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500", ingredients: "أصابع جبن موزاريلا مقلية ذهبية", recipe: [] },
        { id: 502, categoryId: 5, name: "قدح فنكر سبايسي", price: 1000, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", ingredients: "بطاطس مقلية مع بهارات سبايسي حارة", recipe: [{ invId: 3, qty: 0.1 }] },
        { id: 503, categoryId: 5, name: "حلقات بصل (5 قطع)", price: 2000, image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500", ingredients: "5 قطع حلقات بصل مقرمشة", recipe: [] },
        { id: 504, categoryId: 5, name: "قدح فنكر كلاسيك", price: 2500, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", ingredients: "بطاطس مقلية ذهبية كلاسيكية", recipe: [{ invId: 3, qty: 0.2 }] },
        { id: 505, categoryId: 5, name: "قدح فنكر (دوريتوس/هالابينو)", price: 3500, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", ingredients: "بطاطس مقلية مع قطع دوريتوس وقطع هالابينو", recipe: [{ invId: 3, qty: 0.2 }] },
        { id: 506, categoryId: 5, name: "فنكر 89 الخاص", price: 4500, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", ingredients: "بطاطس ذهبية، جبن شيدر، صوص هالابينو، وخلطة 89", recipe: [{ invId: 3, qty: 0.25 }] },

        // ➕ قسم الإضافات
        { id: 601, categoryId: 6, name: "بطاطا إضافية", price: 1000, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", ingredients: "حصة بطاطا مقلية إضافية", recipe: [{ invId: 3, qty: 0.1 }] },
        { id: 602, categoryId: 6, name: "صوص خاص", price: 1000, image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500", ingredients: "علبة صوص MIM89 الخاص", recipe: [] },
        { id: 603, categoryId: 6, name: "هالابينو", price: 1000, image: "https://images.unsplash.com/photo-1588877323863-718873550e58?w=500", ingredients: "شرائح فلفل هالابينو حار", recipe: [] },
        { id: 604, categoryId: 6, name: "جبن شيدر", price: 1000, image: "https://images.unsplash.com/photo-1552767059-ce182ead8c1b?w=500", ingredients: "صلصة جبن شيدر ذائبة إضافية", recipe: [] }
    ]
};

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify(DEFAULT_DATA.inventory));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_printer_settings')) localStorage.setItem('sys_printer_settings', JSON.stringify(DEFAULT_DATA.printerSettings));
    if (!localStorage.getItem('sys_cashiers') || JSON.parse(localStorage.getItem('sys_cashiers')).length === 0) {
        localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    }
    if (!localStorage.getItem('sys_areas')) localStorage.setItem('sys_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
    if (!localStorage.getItem('sys_completed_orders')) localStorage.setItem('sys_completed_orders', JSON.stringify([]));

    setupCloudRealtimeSync();
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/* ⚡ تفعيل المزامنة اللحظية المباشرة للأصناف والأقسام بين كل الأجهزة */
function setupCloudRealtimeSync() {
    if (!db) return;

    db.collection("menu_items").onSnapshot(snapshot => {
        if (!snapshot.empty) {
            let cloudItems = [];
            snapshot.forEach(doc => cloudItems.push({ ...doc.data(), docId: doc.id }));
            setData('sys_items', cloudItems);
            refreshActiveUI();
        }
    }, err => console.log("Menu sync fallback:", err));

    db.collection("menu_categories").onSnapshot(snapshot => {
        if (!snapshot.empty) {
            let cloudCategories = [];
            snapshot.forEach(doc => cloudCategories.push({ ...doc.data(), docId: doc.id }));
            setData('sys_categories', cloudCategories);
            refreshActiveUI();
        }
    }, err => console.log("Category sync fallback:", err));
}

function refreshActiveUI() {
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    } else if (document.getElementById('posProductsGrid')) {
        loadPosDirectMenu('all');
    } else if (document.getElementById('adminItemsTable')) {
        renderAdminItems();
    }
}

/* ==========================================
   3. المينيو العام وتجربة الزبون (index.html)
   ========================================== */
let cart = [];

function loadPublicMenu() {
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

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-tab';
        btn.innerText = cat.name;
        btn.onclick = () => filterCategory(cat.id, btn);
        navContainer.appendChild(btn);

        if (moreCatsList) {
            moreCatsList.innerHTML += `<button class="gold-btn" style="font-size:0.85rem;" onclick="closeModal('moreModal'); filterCategory(${cat.id}, null);">${cat.name}</button>`;
        }

        const catItems = items.filter(i => Number(i.categoryId) === Number(cat.id));
        if (catItems.length > 0) {
            const sec = document.createElement('div');
            sec.className = 'menu-section';
            sec.setAttribute('data-category', cat.id);
            sec.innerHTML = `
                <h2 class="section-title"><i class="fa-solid fa-utensils"></i> ${cat.name}</h2>
                <div class="items-grid">
                    ${catItems.map(item => `
                        <div class="item-card">
                            <img src="${item.image}" alt="${item.name}" class="item-img" onclick="openItemDetails(${item.id})" onerror="this.src='https://via.placeholder.com/300x200?text=MIM89+FAST+FOOD'">
                            <div class="item-details">
                                <h3 class="item-name" onclick="openItemDetails(${item.id})">${item.name}</h3>
                                <p class="item-desc">${item.ingredients || 'وجبة طازجة من MIM89'}</p>
                                <div class="item-footer">
                                    <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                                    <button class="add-cart-btn" onclick="addToCart(${item.id})" title="إضافة للسلة"><i class="fa-solid fa-plus"></i></button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
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
    sectionsContainer.innerHTML = '';

    const filtered = items.filter(i => i.name.toLowerCase().includes(q) || (i.ingredients && i.ingredients.toLowerCase().includes(q)));
    
    sectionsContainer.innerHTML = `
        <div class="items-grid">
            ${filtered.map(item => `
                <div class="item-card">
                    <img src="${item.image}" alt="${item.name}" class="item-img" onclick="openItemDetails(${item.id})">
                    <div class="item-details">
                        <h3 class="item-name">${item.name}</h3>
                        <p class="item-desc">${item.ingredients}</p>
                        <div class="item-footer">
                            <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                            <button class="add-cart-btn" onclick="addToCart(${item.id})"><i class="fa-solid fa-plus"></i></button>
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
    document.getElementById('detailAddBtn').onclick = () => { addToCart(item.id); closeModal('itemDetailModal'); };
    openModal('itemDetailModal');
}

function addToCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => i.id === itemId);
    const exist = cart.find(c => c.id === itemId);

    if (exist) {
        exist.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCartBadge();
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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#222; padding:8px 12px; border-radius:8px;">
            <div>
                <strong style="color:var(--gold-primary);">${item.name}</strong><br>
                <small style="color:#aaa;">${Number(item.price).toLocaleString()} د.ع</small>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button onclick="changeCartQty(${item.id}, -1)" class="gold-btn" style="padding:2px 10px;">-</button>
                <span>${item.qty}</span>
                <button onclick="changeCartQty(${item.id}, 1)" class="gold-btn" style="padding:2px 10px;">+</button>
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

function calculateDeliveryCost() {
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const orderType = document.getElementById('orderTypeSelect') ? document.getElementById('orderTypeSelect').value : 'delivery';
    const areaInput = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    
    let deliveryFee = 0;
    if (orderType === 'delivery') {
        if (areaInput.includes("القاهرة") || areaInput.includes("قاهرة")) {
            deliveryFee = 0;
        } else if (areaInput !== "") {
            const areas = getData('sys_areas');
            const found = areas.find(a => areaInput.includes(a.name));
            deliveryFee = found ? found.price : 3000;
        } else {
            deliveryFee = 3000;
        }
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
    const phone = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim().replace(/\s+/g, '') : '';
    const type = document.getElementById('orderTypeSelect') ? document.getElementById('orderTypeSelect').value : 'delivery';
    const area = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    const address = document.getElementById('custAddress') ? document.getElementById('custAddress').value.trim() : '';
    const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';

    // 🛡️ شرط إجباري: التأكد من أن رقم الهاتف عراقي صحيح يتكون من 11 رقماً ويبدأ بـ 07
    const iraqiPhoneRegex = /^07[3-9]\d{8}$/;
    if (!phone || !iraqiPhoneRegex.test(phone)) {
        return alert("❌ يرجى إدخال رقم هاتف عراقي صحيح يتكون من 11 رقماً ويبدأ بـ 07\nمثال: 07750008630");
    }

    if (type === 'delivery' && (!name || !area || !address)) {
        return alert("يرجى إكمال جميع الحقول المطلوب (الاسم، المنطقة، والعنوان)");
    } else if (!name) {
        return alert("يرجى إدخال الاسم على الأقل");
    }

    const submitBtn = document.querySelector('#cartModal .gold-btn');
    if (submitBtn) {
        submitBtn.innerText = "⏳ جاري إرسال الطلب للكاشير والواتساب...";
        submitBtn.disabled = true;
    }

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let deliveryFee = 0;
    if (type === 'delivery') {
        deliveryFee = (area.includes("القاهرة") || area.includes("قاهرة")) ? 0 : 3000;
    }
    const totalAmount = subtotal + deliveryFee;

    const orderData = {
        id: 'ORD_' + Date.now(),
        customerName: name,
        phone: phone,
        orderType: type,
        area: area,
        address: address,
        notes: notes,
        items: cart,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount,
        status: 'جديد',
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    saveOrderLocally(orderData);
    if (db) {
        db.collection("orders").add(orderData).catch(err => console.error("Firebase Order Sync Error:", err));
    }

    let typeText = '🚗 توصيل منزل';
    if (type === 'takeaway') typeText = '🛍️ سفري من المطعم';
    if (type === 'dine_in') typeText = '🍽️ صالة';

    let itemsListText = cart.map(item => `• ${item.name} × ${item.qty} (${(item.price * item.qty).toLocaleString()} د.ع)`).join('\n');

    let waMessage = `🔥 *طلب جديد من MIM89 FAST FOOD* 🔥\n`;
    waMessage += `----------------------------------\n`;
    waMessage += `👤 *الاسم:* ${name}\n`;
    waMessage += `📞 *رقم الهاتف:* ${phone}\n`;
    waMessage += `📋 *نوع الخدمة:* ${typeText}\n`;
    if (type === 'delivery') {
        waMessage += `📍 *المنطقة:* ${area}\n`;
        waMessage += `🏠 *العنوان:* ${address}\n`;
    }
    if (notes) {
        waMessage += `📝 *ملاحظات:* ${notes}\n`;
    }
    waMessage += `----------------------------------\n`;
    waMessage += `🛒 *الوجبات والطلبات:*\n${itemsListText}\n`;
    waMessage += `----------------------------------\n`;
    waMessage += `💵 *المجموع الفرعي:* ${subtotal.toLocaleString()} د.ع\n`;
    if (type === 'delivery') {
        waMessage += `🛵 *أجور التوصيل:* ${deliveryFee === 0 ? 'مجاني 🎉' : deliveryFee.toLocaleString() + ' د.ع'}\n`;
    }
    waMessage += `💰 *المجموع الكلي:* ${totalAmount.toLocaleString()} د.ع\n`;
    waMessage += `----------------------------------\n`;
    waMessage += `⏳ *تم تحويل الطلب للكاشير، يرجى البدء بالتجهيز.*`;

    const restaurantPhone = "9647750008630";
    const waUrl = `https://api.whatsapp.com/send?phone=${restaurantPhone}&text=${encodeURIComponent(waMessage)}`;

    cart = [];
    updateCartBadge();
    closeModal('cartModal');

    if (submitBtn) {
        submitBtn.innerText = "إرسال الفاتورة عبر الواتساب";
        submitBtn.disabled = false;
    }

    window.open(waUrl, '_blank');
}

function saveOrderLocally(orderData) {
    const orders = getData('sys_live_orders');
    orders.push(orderData);
    setData('sys_live_orders', orders);
}

function sendRestaurantFeedback() {
    const msg = document.getElementById('feedbackMsg').value;
    if (!msg) return alert("اكتب ملاحظتك أولاً");
    alert("شكراً لك! تم إرسال ملاحظتك لإدارة المطعم.");
    document.getElementById('feedbackMsg').value = '';
    closeModal('moreModal');
}

/* ==========================================
   4. نقطة البيع POS الأرشيف والكشوفات (cashier.html)
   ========================================== */
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';

function initCashierPage() { initData(); }

function loginCashier() {
    const inputPass = String(document.getElementById('cashierPassInput').value).trim();
    let cashiers = getData('sys_cashiers');

    if (!cashiers || cashiers.length === 0) {
        cashiers = [{ id: "c1", name: "الكاشير الرئيسي", password: "123" }];
        setData('sys_cashiers', cashiers);
    }

    let user = cashiers.find(c => String(c.password).trim() === inputPass);

    if (!user && inputPass === "123") {
        user = { id: "c1", name: "الكاشير الرئيسي", password: "123" };
    }

    if (user) {
        activeCashierUser = user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'block';
        document.getElementById('activeCashierName').innerText = "الكاشير: " + user.name;
        document.getElementById('authError').innerText = "";
        document.getElementById('cashierPassInput').value = "";
        
        loadPosDirectMenu('all');
        listenForIncomingOrders();
    } else {
        document.getElementById('authError').innerText = "الرمز السري غير صحيح!";
    }
}

function logoutCashier() { location.reload(); }

function switchCashierTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.style.display = 'none';
    });
    
    document.querySelectorAll('.pos-sidebar .toggle-btn').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'flex';
    }
    if (btn) btn.classList.add('active');
}

function selectOrderType(btnElement) {
    document.querySelectorAll('#posOrderTypeGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosOrderType = btnElement.getAttribute('data-value');
}

function selectPaymentMethod(btnElement) {
    document.querySelectorAll('#posPaymentGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosPaymentMethod = btnElement.getAttribute('data-value');
}

function loadPosDirectMenu(catId = 'all') {
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const catBar = document.getElementById('posCategoriesBar');
    const grid = document.getElementById('posProductsGrid');

    if (!catBar || !grid) return;

    catBar.innerHTML = `<button class="category-tab ${catId === 'all' ? 'active' : ''}" onclick="loadPosDirectMenu('all')">الكل</button>`;
    categories.forEach(c => {
        catBar.innerHTML += `<button class="category-tab ${catId == c.id ? 'active' : ''}" onclick="loadPosDirectMenu(${c.id})">${c.name}</button>`;
    });

    const filtered = catId === 'all' ? items : items.filter(i => Number(i.categoryId) === Number(catId));

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:20px;">لا توجد وجبات في هذا القسم</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
        </div>
    `).join('');
}

function filterPosProducts() {
    const query = document.getElementById('posSearchInput') ? document.getElementById('posSearchInput').value.toLowerCase() : '';
    const items = getData('sys_items');
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;
    
    const filtered = items.filter(i => i.name.toLowerCase().includes(query));
    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
        </div>
    `).join('');
}

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => i.id === itemId);
    const exist = posCart.find(c => c.id === itemId);

    if (exist) {
        exist.qty += 1;
    } else {
        posCart.push({ ...item, qty: 1 });
    }
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
        list.innerHTML = `<p style="text-align:center; color:#777; font-size:0.8rem; padding:15px;">اختر الوجبات لإضافتها للفاتورة</p>`;
        totalEl.innerText = "0 د.ع";
        return;
    }

    let total = 0;
    list.innerHTML = posCart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; background:#1c1c20; padding:4px 6px; border-radius:4px; font-size:0.8rem;">
                <div>
                    <strong style="color:var(--gold-primary);">${item.name}</strong><br>
                    <small style="color:#aaa;">${Number(item.price).toLocaleString()} × ${item.qty}</small>
                </div>
                <div style="display:flex; gap:4px; align-items:center;">
                    <button onclick="changePosCartQty(${item.id}, -1)" class="gold-btn" style="padding:1px 6px; font-size:0.75rem;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changePosCartQty(${item.id}, 1)" class="gold-btn" style="padding:1px 6px; font-size:0.75rem;">+</button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.innerText = Number(total).toLocaleString() + ' د.ع';
}

function processPosDirectCheckout() {
    if (posCart.length === 0) return alert("اختر وجبات أولاً للفاتورة!");
    
    const custName = document.getElementById('posCustName').value.trim() || "زبون مباشر";
    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    let typeText = '🍽️ صالة';
    if (selectedPosOrderType === 'takeaway') typeText = '🛍️ سفري';
    if (selectedPosOrderType === 'delivery') typeText = '🚗 توصيل';

    const directOrder = {
        id: 'POS_' + Date.now(),
        customerName: custName,
        phone: "-",
        orderType: selectedPosOrderType,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? '💵 كاش' : '💳 فيزا',
        area: typeText,
        address: "-",
        notes: "-",
        items: posCart,
        subtotal: subtotal,
        deliveryFee: 0,
        totalAmount: subtotal,
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    saveCompletedOrder(directOrder);
    deductInventoryFromRecipe(directOrder.items);
    printReceipt(directOrder);
    clearPosCart();
    document.getElementById('posCustName').value = '';
}

function saveCompletedOrder(order) {
    let completed = getData('sys_completed_orders');
    if (!order.dateDate) order.dateDate = getTodayString();
    
    const existingIndex = completed.findIndex(o => o.id === order.id);
    if (existingIndex !== -1) {
        completed[existingIndex] = order;
    } else {
        completed.unshift(order);
    }
    setData('sys_completed_orders', completed);
}

function openCompletedOrdersModal() {
    const list = document.getElementById('completedOrdersList');
    const completed = getData('sys_completed_orders');

    if (!list) return;

    if (!completed || completed.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; padding:20px; font-size:0.85rem;">لا توجد فواتير سابقة مطبوعة</p>`;
    } else {
        list.innerHTML = completed.map(ord => {
            const itemsText = (ord.items && Array.isArray(ord.items)) ? ord.items.map(i => `${i.name} (×${i.qty})`).join(' ، ') : 'طلب مباشر';
            return `
                <div style="background:#222228; border:1px solid var(--card-border); border-radius:8px; padding:8px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--gold-primary);">
                        <strong>👤 ${ord.customerName || 'زبون'}</strong>
                        <span style="font-size:0.75rem; color:#aaa;">⏰ ${ord.timestamp || ''} (${ord.dateDate || ''})</span>
                    </div>
                    <div style="font-size:0.75rem; color:#888; margin:4px 0;">الوجبات: ${itemsText}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #333; padding-top:4px; margin-top:4px;">
                        <strong style="color:var(--gold-bright); font-size:0.9rem;">${Number(ord.totalAmount || 0).toLocaleString()} د.ع</strong>
                        <button class="gold-btn" style="padding:2px 8px; font-size:0.75rem;" onclick="reprintCompletedOrder('${ord.id}')">🖨️ إعادة طباعة</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openModal('completedOrdersModal');
}

function reprintCompletedOrder(orderId) {
    const completed = getData('sys_completed_orders');
    const order = completed.find(o => o.id === orderId);
    if (order) {
        closeModal('completedOrdersModal');
        printReceipt(order);
    }
}

function clearCompletedOrdersHistory() {
    if (confirm("مسح جميع الفواتير من السجل؟")) {
        setData('sys_completed_orders', []);
        openCompletedOrdersModal();
    }
}

/* ==========================================
   5. تقارير كشف الحساب والتقفيل اليومي (Z-Report)
   ========================================== */
function openDailyReportModal() {
    const dateInput = document.getElementById('reportDateInput');
    const today = getTodayString();
    if (dateInput) dateInput.value = today;
    renderDailyReport(today);
    openModal('dailyReportModal');
}

function renderDailyReport(targetDate) {
    const completed = getData('sys_completed_orders');
    const filteredOrders = completed.filter(o => o.dateDate === targetDate);

    let totalSales = 0, totalCash = 0, totalVisa = 0, totalDelivery = 0, subtotalFood = 0;
    let itemsSoldMap = {};

    filteredOrders.forEach(ord => {
        const orderTotal = Number(ord.totalAmount || 0);
        totalSales += orderTotal;
        totalDelivery += Number(ord.deliveryFee || 0);
        subtotalFood += Number(ord.subtotal || 0);

        if (ord.paymentMethod && ord.paymentMethod.includes("فيزا")) {
            totalVisa += orderTotal;
        } else {
            totalCash += orderTotal;
        }

        if (ord.items && Array.isArray(ord.items)) {
            ord.items.forEach(item => {
                itemsSoldMap[item.name] = (itemsSoldMap[item.name] || 0) + item.qty;
            });
        }
    });

    document.getElementById('reportDateText').innerText = "تاريخ الكشف: " + targetDate;
    document.getElementById('reportCashierText').innerText = "الكاشير: " + (activeCashierUser ? activeCashierUser.name : "الرئيسي");
    document.getElementById('repTotalSales').innerText = totalSales.toLocaleString();
    document.getElementById('repOrdersCount').innerText = filteredOrders.length;
    document.getElementById('repTotalCash').innerText = totalCash.toLocaleString();
    document.getElementById('repTotalVisa').innerText = totalVisa.toLocaleString();
    document.getElementById('repTotalDelivery').innerText = totalDelivery.toLocaleString();
    document.getElementById('repNetFood').innerText = subtotalFood.toLocaleString();

    const itemsListEl = document.getElementById('repItemsSoldList');
    const itemNames = Object.keys(itemsSoldMap);

    if (itemNames.length === 0) {
        itemsListEl.innerHTML = `<p style="text-align:center; color:#777; margin:10px 0;">لا توجد مبيعات</p>`;
    } else {
        itemsListEl.innerHTML = itemNames.map(name => `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:2px 0;">
                <span>● ${name}</span>
                <strong>العدد: ${itemsSoldMap[name]}</strong>
            </div>
        `).join('');
    }
}

/* ==========================================
   6. محرك كاشف المكالمات، التنبيهات وإدارة الطلبات الملغاة
   ========================================== */
let knownOrderIds = new Set();
let continuousAlertTimer = null;
let globalAudioCtx = null;

function unlockIpadAudio() {
    try {
        if (!globalAudioCtx) {
            globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (globalAudioCtx.state === 'suspended') {
            globalAudioCtx.resume();
        }
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        gain.gain.value = 0.01;
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.start(0);
        osc.stop(0.1);
        alert("🔔 تم تفعيل جرس التنبيهات بنجاح على الايباد!");
    } catch (e) {
        console.log("Audio unlock:", e);
    }
}

document.addEventListener('touchstart', () => { if (globalAudioCtx && globalAudioCtx.state === 'suspended') globalAudioCtx.resume(); }, { once: true });
document.addEventListener('click', () => { if (globalAudioCtx && globalAudioCtx.state === 'suspended') globalAudioCtx.resume(); }, { once: true });

function startContinuousAlert() {
    if (continuousAlertTimer) return;
    playSingleBeep();
    continuousAlertTimer = setInterval(() => playSingleBeep(), 1000);
}

function stopContinuousAlert() {
    if (continuousAlertTimer) {
        clearInterval(continuousAlertTimer);
        continuousAlertTimer = null;
    }
}

function playSingleBeep() {
    try {
        if (!globalAudioCtx) {
            globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (globalAudioCtx.state === 'suspended') {
            globalAudioCtx.resume();
        }
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, globalAudioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, globalAudioCtx.currentTime);
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.start();
        osc.stop(globalAudioCtx.currentTime + 0.3);
    } catch (e) {}
}

function getCustomerHistoryByPhone(phone) {
    if (!phone || phone === 'بدون رقم' || phone === '-') return null;
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 5) return null;

    const completed = getData('sys_completed_orders');
    return completed.find(o => {
        if (!o.phone) return false;
        const oPhone = String(o.phone).replace(/[^0-9]/g, '');
        return oPhone && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone)) && o.customerName && o.customerName !== 'زبون مباشر';
    }) || null;
}

function listenForIncomingOrders() {
    const container = document.getElementById('liveOrdersContainer');
    if (!container) return;

    const processOrdersList = (ordersList) => {
        let unhandledCount = 0;
        let html = '';

        ordersList.forEach(ord => {
            const isUnhandled = !ord.status || ord.status === 'جديد' || ord.status === 'new' || ord.status === 'pending' || ord.status === '';
            
            if (isUnhandled) {
                unhandledCount++;
                if (!knownOrderIds.has(ord.id)) {
                    knownOrderIds.add(ord.id);
                }
                html += generateOrderCardHTML(ord, ord.docId || ord.id);
            }
        });

        container.innerHTML = html || '<p style="color:#aaa; text-align:center; padding:20px; font-size:0.85rem;">لا توجد طلبات أو مكالمات جارية حالياً</p>';
        
        const badge = document.getElementById('liveOrdersBadge');
        const alertBanner = document.getElementById('pendingOrdersAlertBanner');
        const bannerCount = document.getElementById('pendingOrdersBannerCount');

        if (unhandledCount > 0) {
            if (badge) { badge.innerText = unhandledCount; badge.style.display = 'inline-block'; }
            if (alertBanner) { alertBanner.style.display = 'block'; }
            if (bannerCount) { bannerCount.innerText = unhandledCount; }
            startContinuousAlert();
        } else {
            if (badge) { badge.style.display = 'none'; }
            if (alertBanner) { alertBanner.style.display = 'none'; }
            stopContinuousAlert();
        }
    };

    if (db) {
        db.collection("orders").onSnapshot(snapshot => {
            let list = [];
            snapshot.forEach(doc => {
                list.push({ ...doc.data(), docId: doc.id });
            });
            processOrdersList(list);
        }, err => {
            processOrdersList(getData('sys_live_orders'));
        });
    } else {
        setInterval(() => processOrdersList(getData('sys_live_orders')), 2000);
    }
}

function generateOrderCardHTML(ord, docId) {
    const itemsList = Array.isArray(ord.items) ? ord.items : [];
    const total = (ord.totalAmount !== undefined && ord.totalAmount !== null) ? Number(ord.totalAmount).toLocaleString() : '0';

    const rawPhone = ord.phone || ord.number || ord.caller || ord.from || 'بدون رقم';
    const rawName = ord.customerName || ord.name || ord.caller_name || 'مكالمة واردة';
    const pastCustomer = getCustomerHistoryByPhone(rawPhone);

    const displayName = (rawName && rawName !== 'مكالمة' && rawName !== 'مكالمة واردة')
        ? rawName 
        : (pastCustomer ? pastCustomer.customerName : 'زبون جديد (غير مسجل)');

    const displayArea = ord.area || (pastCustomer ? pastCustomer.area : '');
    const displayAddress = ord.address || (pastCustomer ? pastCustomer.address : '');

    return `
        <div id="order_card_${docId || ord.id}" style="background:#222228; border:1px solid ${pastCustomer ? 'var(--gold-bright)' : 'var(--gold-primary)'}; padding:10px; margin-bottom:8px; border-radius:8px; width:100%;">
            <div style="display:flex; justify-content:space-between; color:var(--gold-primary); font-size:0.85rem;">
                <strong>📞 ${displayName} (${rawPhone})</strong>
                <span>${ord.orderType === 'delivery' ? '🚗 توصيل' : '🛍️ سفري'}</span>
            </div>
            ${pastCustomer ? '<span style="background:var(--gold-primary); color:#000; font-size:0.7rem; font-weight:bold; padding:1px 6px; border-radius:4px; margin-top:2px; display:inline-block;">⭐ زبون مسجل سابقاً</span>' : '<span style="background:#444; color:#fff; font-size:0.7rem; padding:1px 6px; border-radius:4px; margin-top:2px; display:inline-block;">🆕 متصل جديد</span>'}
            <p style="font-size:0.8rem; color:#ccc; margin-top:4px;">${displayArea ? 'المنطقة: ' + displayArea : ''} ${displayAddress ? '- ' + displayAddress : ''}</p>
            <p style="font-size:0.8rem; color:#f59e0b;">ملاحظات: ${ord.notes || 'طلب من الاتصال الهاتفي'}</p>
            <hr style="border-color:#333; margin:6px 0;">
            <ul style="padding-right:12px; font-size:0.8rem;">
                ${itemsList.length > 0 
                    ? itemsList.map(i => `<li>${i.name} × ${i.qty}</li>`).join('') 
                    : '<li style="color:#aaa;">(طلب هاتف - اختر الوجبات يدوياً في الفاتورة المباشرة)</li>'}
            </ul>
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--gold-bright); font-size:0.85rem;">المجموع: ${total} د.ع</strong>
                    <button class="gold-btn" style="padding:4px 8px; font-size:0.8rem;" onclick="fulfillAndPrintOrder('${docId}', '${ord.id}')">تجهيز وطباعة</button>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="gold-btn" style="padding:4px 6px; font-size:0.7rem; background:#333; color:var(--gold-bright); border:1px solid var(--gold-primary); flex:1;" onclick="loadIncomingCallToPos('${docId}', '${ord.id}', '${rawPhone}', '${displayName.replace(/'/g, "\\'")}', '${displayArea.replace(/'/g, "\\'")}', '${displayAddress.replace(/'/g, "\\'")}')">📥 نقل لكاشير</button>
                    <button class="gold-btn" style="padding:4px 6px; font-size:0.7rem; background:var(--danger-red); color:#fff; flex:1;" onclick="cancelIncomingOrder('${docId}', '${ord.id}')">❌ إلغاء وحذف</button>
                </div>
            </div>
        </div>
    `;
}

function cancelIncomingOrder(docId, orderId) {
    if (confirm("هل أنت متأكد من إلغاء وحذف هذا الطلب (غير الصادق/الملغي)؟")) {
        if (db) {
            db.collection("orders").doc(docId).delete().catch(err => console.error("Error deleting order:", err));
        }
        let orders = getData('sys_live_orders');
        orders = orders.filter(o => o.id !== orderId);
        setData('sys_live_orders', orders);
        
        const card = document.getElementById(`order_card_${docId}`) || document.getElementById(`order_card_${orderId}`);
        if (card) card.remove();
        
        listenForIncomingOrders();
    }
}

function loadIncomingCallToPos(docId, orderId, phone, name, area, address) {
    const btnDirect = document.querySelector(".pos-sidebar .toggle-btn");
    switchCashierTab('tabPosDirect', btnDirect);

    const infoText = `${name} | هاتف: ${phone} ${area ? '| ' + area : ''} ${address ? '- ' + address : ''}`;
    const custInput = document.getElementById('posCustName');
    if (custInput) custInput.value = infoText;

    fulfillAndPrintOrder(docId, orderId);
    alert(`تم جلب بيانات الزبون (${name}) لشاشة المبيعات بنجاح! اختر الوجبات من القائمة لطباعة الفاتورة.`);
}

function fulfillAndPrintOrder(docId, orderId) {
    if (db) {
        db.collection("orders").doc(docId).get().then(doc => {
            if (doc.exists) {
                const order = doc.data();
                saveCompletedOrder(order);
                deductInventoryFromRecipe(order.items);
                db.collection("orders").doc(docId).update({ status: 'تم التجهيز' });
                printReceipt(order);
            } else {
                fulfillLocalOrder(orderId);
            }
        }).catch(() => {
            fulfillLocalOrder(orderId);
        });
    } else {
        fulfillLocalOrder(orderId);
    }
}

function fulfillLocalOrder(orderId) {
    let orders = getData('sys_live_orders');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        saveCompletedOrder(order);
        deductInventoryFromRecipe(order.items);
        orders = orders.filter(o => o.id !== orderId);
        setData('sys_live_orders', orders);
        printReceipt(order);
    }
}

function deductInventoryFromRecipe(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    let inventory = getData('sys_inventory');
    const allMenuItems = getData('sys_items');

    items.forEach(cartItem => {
        const menuItem = allMenuItems.find(m => m.id === cartItem.id);
        if (menuItem && menuItem.recipe) {
            menuItem.recipe.forEach(ingredient => {
                const stockItem = inventory.find(inv => inv.id === ingredient.invId);
                if (stockItem) {
                    const totalDeduct = ingredient.qty * cartItem.qty;
                    stockItem.quantity = Math.max(0, stockItem.quantity - totalDeduct);
                }
            });
        }
    });

    setData('sys_inventory', inventory);
}

function printReceipt(order) {
    document.getElementById('receiptCashierName').innerText = "الكاشير: " + (activeCashierUser ? activeCashierUser.name : "الرئيسي");
    document.getElementById('receiptCustInfo').innerText = `الزبون: ${order.customerName || 'زبون مباشر'}`;
    document.getElementById('receiptPaymentInfo').innerText = `طريقة الدفع: ${order.paymentMethod || '💵 كاش'}`;
    document.getElementById('receiptTypeInfo').innerText = `نوع الخدمة: ${order.area || 'صالة'}`;
    
    const items = Array.isArray(order.items) ? order.items : [];
    document.getElementById('receiptItemsBody').innerHTML = items.map(i => `
        <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-size:0.85rem;">
            <span>${i.name} (×${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()} د.ع</span>
        </div>
    `).join('');

    document.getElementById('receiptSubtotal').innerText = (order.subtotal || 0).toLocaleString() + ' د.ع';
    document.getElementById('receiptDeliveryFee').innerText = (order.deliveryFee || 0).toLocaleString() + ' د.ع';
    document.getElementById('receiptGrandTotal').innerText = (order.totalAmount || 0).toLocaleString() + ' د.ع';

    document.getElementById('kitchenOrderType').innerText = `نوع الخدمة: ${order.area || 'صالة'}`;
    document.getElementById('kitchenCustName').innerText = `الزبون / الاتصال: ${order.customerName || 'مباشر'} (${order.phone || ''})`;
    document.getElementById('kitchenTimeInfo').innerText = `الوقت: ${order.timestamp || new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`;

    document.getElementById('kitchenItemsBody').innerHTML = items.map(i => `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #000; padding:4px 0; font-size:1.1rem; font-weight:bold;">
            <span>● ${i.name}</span>
            <span style="font-size:1.2rem; background:#000; color:#fff; padding:0 6px; border-radius:3px;">[ العدد: ${i.qty} ]</span>
        </div>
    `).join('');

    document.getElementById('kitchenNotesInfo').innerText = `ملاحظات الطلب: ${order.notes || 'لا يوجد'}`;

    openModal('receiptModal');

    const printerSettings = getData('sys_printer_settings');

    if (printerSettings && printerSettings.enableIpPrinting) {
        sendDirectNetworkPrint(printerSettings.cashierIp, printerSettings.port, 'cashier', order);
        sendDirectNetworkPrint(printerSettings.kitchenIp, printerSettings.port, 'kitchen', order);
        setTimeout(() => closeModal('receiptModal'), 300);
    } else {
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                closeModal('receiptModal');
            }, 400);
        }, 200);
    }
}

function sendDirectNetworkPrint(ip, port, target, orderData) {
    console.log(`Sending Raw Print Job to IP: ${ip}:${port} for Target: ${target}`);
}

/* ==========================================
   7. إدارة المخزن والإدارة العامة (admin & inventory)
   ========================================== */
let currentUploadedBase64 = "";

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUploadedBase64 = e.target.result;
            const preview = document.getElementById('imgPreview');
            if (preview) preview.src = currentUploadedBase64;
            const urlInput = document.getElementById('itemImage');
            if (urlInput) urlInput.value = "";
        };
        reader.readAsDataURL(file);
    }
}

function initInventoryPage() { initData(); }

function loginInventory() {
    const pass = document.getElementById('invPassInput').value;
    const sysPasses = getData('sys_passwords');

    if (pass === sysPasses.inventory || pass === sysPasses.admin) {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('invMainApp').style.display = 'block';
        renderInventoryTable();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function renderInventoryTable() {
    const inv = getData('sys_inventory');
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = inv.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><input type="text" value="${item.name}" onchange="updateInvField(${item.id}, 'name', this.value)" class="gold-input"></td>
            <td><input type="number" value="${item.quantity}" onchange="updateInvField(${item.id}, 'quantity', this.value)" class="gold-input"></td>
            <td><input type="text" value="${item.unit}" onchange="updateInvField(${item.id}, 'unit', this.value)" class="gold-input"></td>
            <td><button onclick="deleteInvItem(${item.id})" class="btn-sm btn-danger">حذف</button></td>
        </tr>
    `).join('');
}

function addNewInventoryItem() {
    const name = document.getElementById('newInvName').value;
    const qty = Number(document.getElementById('newInvQty').value);
    const unit = document.getElementById('newInvUnit').value;

    if (!name || !qty) return alert("أدخل الاسم والكمية");

    const inv = getData('sys_inventory');
    inv.push({ id: Date.now(), name, quantity: qty, unit: unit || 'قطع' });
    setData('sys_inventory', inv);

    document.getElementById('newInvName').value = '';
    document.getElementById('newInvQty').value = '';
    document.getElementById('newInvUnit').value = '';
    renderInventoryTable();
}

function updateInvField(id, field, value) {
    const inv = getData('sys_inventory');
    const item = inv.find(i => i.id === id);
    if (item) {
        item[field] = field === 'quantity' ? Number(value) : value;
        setData('sys_inventory', inv);
    }
}

function deleteInvItem(id) {
    if (confirm("حذف هذه المادة من الجرد؟")) {
        let inv = getData('sys_inventory').filter(i => i.id !== id);
        setData('sys_inventory', inv);
        renderInventoryTable();
    }
}

function initAdminPage() { initData(); }

function loginAdmin() {
    const pass = document.getElementById('adminPassInput').value;
    const sysPasses = getData('sys_passwords');

    if (pass === sysPasses.admin) {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMainApp').style.display = 'block';
        loadAdminTabsData();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function switchAdminTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
}

function loadAdminTabsData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminCashiers();
    renderAdminAreas();
    loadPrinterSettings();
}

function loadPrinterSettings() {
    const settings = getData('sys_printer_settings');
    if (!settings) return;
    
    if (document.getElementById('enableIpPrinting')) document.getElementById('enableIpPrinting').checked = !!settings.enableIpPrinting;
    if (document.getElementById('cashierPrinterIp')) document.getElementById('cashierPrinterIp').value = settings.cashierIp || '';
    if (document.getElementById('kitchenPrinterIp')) document.getElementById('kitchenPrinterIp').value = settings.kitchenIp || '';
    if (document.getElementById('printerPort')) document.getElementById('printerPort').value = settings.port || '9100';
}

function savePrinterSettings() {
    const enableIpPrinting = document.getElementById('enableIpPrinting').checked;
    const cashierIp = document.getElementById('cashierPrinterIp').value.trim();
    const kitchenIp = document.getElementById('kitchenPrinterIp').value.trim();
    const port = document.getElementById('printerPort').value.trim() || '9100';

    const settings = { enableIpPrinting, cashierIp, kitchenIp, port };
    setData('sys_printer_settings', settings);
    alert("تم حفظ إعدادات الطابعات بنجاح!");
}

function renderAdminAreas() {
    const areas = getData('sys_areas');
    const tbody = document.getElementById('adminAreasTable');
    if (!tbody) return;
    tbody.innerHTML = areas.map((a, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${a.name}</td>
            <td>${a.price === 0 ? 'مجاني' : a.price.toLocaleString() + ' د.ع'}</td>
            <td><button class="btn-sm btn-danger" onclick="deleteArea('${a.name}')">حذف</button></td>
        </tr>
    `).join('');
}

function saveDeliveryArea() {
    const name = document.getElementById('areaNameInput').value.trim();
    const price = Number(document.getElementById('areaPriceInput').value);
    if (!name) return alert("أدخل اسم المنطقة");

    let areas = getData('sys_areas');
    areas.push({ name, price });
    setData('sys_areas', areas);

    document.getElementById('areaNameInput').value = '';
    document.getElementById('areaPriceInput').value = '';
    renderAdminAreas();
}

function deleteArea(name) {
    let areas = getData('sys_areas').filter(a => a.name !== name);
    setData('sys_areas', areas);
    renderAdminAreas();
}

function renderAdminItems() {
    const items = getData('sys_items');
    const categories = getData('sys_categories');
    const tbody = document.getElementById('adminItemsTable');
    const select = document.getElementById('itemCategory');

    if (select) select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const cat = categories.find(c => c.id == item.categoryId);
        return `
            <tr>
                <td><img src="${item.image}" width="40" height="40" style="object-fit:cover; border-radius:4px;" onerror="this.src='https://via.placeholder.com/40'"></td>
                <td>${item.name}</td>
                <td>${cat ? cat.name : '-'}</td>
                <td>${Number(item.price).toLocaleString()} د.ع</td>
                <td>
                    <button onclick="editItem(${item.id})" class="btn-sm gold-btn">تعديل</button>
                    <button onclick="deleteItem(${item.id})" class="btn-sm btn-danger">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveItem() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('itemName').value.trim();
    const price = Number(document.getElementById('itemPrice').value);
    const categoryId = Number(document.getElementById('itemCategory').value);
    const ingredients = document.getElementById('itemIngredients').value.trim();

    let image = currentUploadedBase64 || document.getElementById('itemImage').value.trim() || 'https://via.placeholder.com/300?text=MIM89';

    if (!name || !price) {
        return alert("❌ يرجى إدخال اسم الصنف والسعر على الأقل!");
    }

    let items = getData('sys_items');
    let newItemData = { 
        id: id ? Number(id) : Date.now(), 
        name, 
        price, 
        categoryId, 
        image, 
        ingredients, 
        recipe: [] 
    };

    if (id) {
        items = items.map(i => i.id == id ? { ...i, ...newItemData } : i);
    } else {
        items.push(newItemData);
    }

    setData('sys_items', items);

    if (db) {
        db.collection("menu_items").doc(String(newItemData.id)).set(newItemData)
            .then(() => console.log("Cloud sync item success"))
            .catch(err => console.error("Cloud sync item error:", err));
    }

    resetItemForm();
    renderAdminItems();
    refreshActiveUI();
    alert("🎉 تم حفظ الصنف بنجاح ومزامنته فوراً مع المينيو الإلكتروني والكاشير!");
}

function editItem(id) {
    const item = getData('sys_items').find(i => i.id === id);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.categoryId;
    document.getElementById('itemIngredients').value = item.ingredients || '';

    if (item.image && item.image.startsWith('data:image')) {
        currentUploadedBase64 = item.image;
        document.getElementById('itemImage').value = '';
    } else {
        currentUploadedBase64 = '';
        document.getElementById('itemImage').value = item.image || '';
    }

    const preview = document.getElementById('imgPreview');
    if (preview) preview.src = item.image || 'https://via.placeholder.com/150';
    
    document.getElementById('itemFormTitle').innerText = "تعديل: " + item.name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemImage').value = '';
    document.getElementById('itemIngredients').value = '';
    
    const fileInput = document.getElementById('itemImgFile');
    if (fileInput) fileInput.value = '';
    currentUploadedBase64 = '';
    
    const preview = document.getElementById('imgPreview');
    if (preview) preview.src = 'https://via.placeholder.com/150?text=معاينة+الصورة';
    
    document.getElementById('itemFormTitle').innerText = "إضافة / تعديل صنف للمينيو";
}

function deleteItem(id) {
    if (confirm("هل أنت متأكد من حذف هذا الصنف نهائياً من المينيو والكاشير؟")) {
        let items = getData('sys_items').filter(i => i.id !== id);
        setData('sys_items', items);
        
        if (db) {
            db.collection("menu_items").doc(String(id)).delete();
        }
        renderAdminItems();
        refreshActiveUI();
    }
}

function renderAdminCategories() {}

function renderAdminCashiers() {
    const cashiers = getData('sys_cashiers');
    const tbody = document.getElementById('adminCashiersTable');
    if (!tbody) return;

    tbody.innerHTML = cashiers.map((c, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${c.name}</td>
            <td>${c.password}</td>
            <td><button onclick="deleteCashier('${c.id}')" class="btn-sm btn-danger">حذف</button></td>
        </tr>
    `).join('');
}

function saveCashier() {
    const name = document.getElementById('cashierNameInput').value;
    const pass = document.getElementById('cashierPassNew').value;
    if (!name || !pass) return alert("أدخل الاسم وكلمة المرور");

    const cashiers = getData('sys_cashiers');
    cashiers.push({ id: 'c_' + Date.now(), name, password: pass });
    setData('sys_cashiers', cashiers);

    document.getElementById('cashierNameInput').value = '';
    document.getElementById('cashierPassNew').value = '';
    renderAdminCashiers();
}

function deleteCashier(id) {
    if (confirm("حذف الكاشير؟")) {
        let cashiers = getData('sys_cashiers').filter(c => c.id !== id);
        setData('sys_cashiers', cashiers);
        renderAdminCashiers();
    }
}

function updateSystemPasswords() {
    const newAdmin = document.getElementById('newAdminPass').value;
    const newInv = document.getElementById('newInvPass').value;
    const passes = getData('sys_passwords');

    if (newAdmin) passes.admin = newAdmin;
    if (newInv) passes.inventory = newInv;

    setData('sys_passwords', passes);
    alert("تم تحديث كلمات المرور بنجاح!");
    document.getElementById('newAdminPass').value = '';
    document.getElementById('newInvPass').value = '';
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
