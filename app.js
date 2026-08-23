// منع القائمة عند الضغط بالزر الأيمن
document.addEventListener('contextmenu', event => event.preventDefault());

// منع اختصارات أدوات المطورين
document.addEventListener('keydown', event => {
  if (
    event.key === 'F12' || 
    (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(event.key.toUpperCase())) ||
    (event.ctrlKey && event.key.toUpperCase() === 'U')
  ) {
    event.preventDefault();
  }
});

/* ==========================================================================
   MIM89 FAST FOOD - Master Core Engine (v27.0 Thermal Print & Delivery Fixed)
   مشروع الفايربيس: mim89-ff938 | نظام الكاشير المباشر والمينيو ودليل الزبائن CRM
   صاحب النظام: منير مقداد
   ========================================================================== */

// 1. المتغيرات العامة والاتصال السحابي
let db = null;
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';
let activeDiscountType = null;
let posDiscountAmount = 0;
let currentPercentValue = 0;
let cart = [];
let activePendingPrintOrder = null;
let lastCompletedOrder = null;
let isCustomerPrinted = false;
let isKitchenPrinted = false;
let currentUploadedBase64 = "";
let currentDetailItem = null;

// 🧮 دالة عالمية لتنظيف أي سعر/رقم وتحويله إلى رقم مجرد
function cleanPrice(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, '');
    let num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
}

// 🍔 دالة فتح وإغلاق البردة الجانبية
window.toggleSideDrawer = function() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (!drawer || !overlay) return;

    if (drawer.classList.contains('active')) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    } else {
        overlay.style.display = 'block';
        void drawer.offsetWidth;
        drawer.classList.add('active');
        overlay.classList.add('active');
    }
};

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

        db.enablePersistence({ synchronizeTabs: true }).catch(err => {
            console.log("حالة التخزين المحلي Offline Persistence:", err.code);
        });
    }
} catch (e) {
    console.warn("جاري التشغيل بالنظام المحلي الحُر:", e);
}

// 2. البيانات الأساسية الكاملة للأقسام
const DEFAULT_DATA = {
    passwords: { 
        admin: "admin123", 
        inventory: "inv123",
        costing: "1278900",
        cashier: "123"
    },
    printerSettings: {
        enableIpPrinting: true,
        cashierIp: "192.168.0.218",
        kitchen1Ip: "192.168.0.200",
        kitchen2Ip: "192.168.0.202",
        port: "9100"
    },
    cashiers: [
        { id: "c1", name: "الكاشير الرئيسي", password: "123" }
    ],
    employees: [
        { id: "emp_1", name: "أحمد - شيف شاورما" },
        { id: "emp_2", name: "علي - كاشير ومساعد" },
        { id: "emp_3", name: "حسين - صالة ونظافة" },
        { id: "emp_4", name: "مصطفى - دليفري" }
    ],
    drivers: [
        { id: "drv_1", name: "أحمد دليفري", phone: "07700000001" },
        { id: "drv_2", name: "مصطفى دليفري", phone: "07700000002" }
    ],
    quickKitchenNotes: [
        "بدون ثوم 🧄",
        "سبايسي 🌶️",
        "صوص زيادة 🧀",
        "بدون مخلل 🥒"
    ],
    categories: [
        { id: 1, name: "🔥 العروض المميزة" },
        { id: 2, name: "🥩 بركر لحم" },
        { id: 3, name: "🍗 بركر دجاج" },
        { id: 4, name: "🥪 قسم الساندويش" },
        { id: 5, name: "🍚 قسم الريزو" },
        { id: 6, name: "🍗 قسم الكنتاكي" },
        { id: 7, name: "🍟 قسم الفنكر" },
        { id: 8, name: "🌯 قسم الشاورما" },
        { id: 9, name: "🥣 الصوصات والمقبلات" },
        { id: 10, name: "➕ قسم الإضافات" }
    ],
    deliveryAreas: [
        { name: "القاهرة", price: 0 },
        { name: "البنوك", price: 2000 },
        { name: "الأعظمية", price: 3000 },
        { name: "الشعب", price: 2500 }
    ],
    inventory: [
        { id: 1, name: "صدور دجاج طازجة", quantity: 100, unit: "كغم", totalPrice: 500000, costPerUnit: 5000 },
        { id: 2, name: "خبز صاج", quantity: 200, unit: "قطع", totalPrice: 40000, costPerUnit: 200 },
        { id: 3, name: "بطاطس", quantity: 150, unit: "كغم", totalPrice: 150000, costPerUnit: 1000 },
        { id: 4, name: "صلصة ثومية", quantity: 30, unit: "علبة", totalPrice: 30000, costPerUnit: 1000 },
        { id: 5, name: "خبز بركر", quantity: 100, unit: "قطع", totalPrice: 25000, costPerUnit: 250 }
    ],
    items: [
        { id: 101, categoryId: 1, catId: 1, category: 1, name: "عرض ليمتد 89 العائلي", price: 15000, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500", ingredients: "تشكيلة عائلية مميزة من وجبات MIM89", recipe: [] },
        { id: 102, categoryId: 1, catId: 1, category: 1, name: "عرض شاورما دبل دجاج", price: 10000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبتين شاورما دجاج دبل مع صوص وبطاطس", recipe: [{ invId: 1, qty: 0.3 }, { invId: 2, qty: 2 }] },
        { id: 301, categoryId: 8, catId: 8, category: 8, name: "شاورما صاج عادي", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج، شاورما دجاج طازجة، صلصة ثومية، مخلل", recipe: [{ invId: 1, qty: 0.12 }, { invId: 2, qty: 1 }] },
        { id: 302, categoryId: 8, catId: 8, category: 8, name: "وجبة شاورما عربية", price: 3500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج، بطاطس مقلية، ثومية، خبز طازج", recipe: [{ invId: 1, qty: 0.12 }] }
    ]
};

function getItemCategory(item) {
    if (!item) return 1;
    let rawCat = item.categoryId !== undefined ? item.categoryId : (item.catId !== undefined ? item.catId : item.category);
    let parsed = cleanPrice(rawCat);
    if (parsed > 0) return parsed;
    
    if (item.name) {
        const name = item.name.trim();
        if (name.includes('شاورما')) return 8; 
        if (name.includes('بركر') && name.includes('لحم')) return 2; 
        if (name.includes('بركر') && (name.includes('دجاج') || name.includes('سلايدر'))) return 3; 
        if (name.includes('ريزو')) return 5; 
        if (name.includes('كنتاكي') || name.includes('بروستد') || name.includes('ستربس')) return 6; 
        if (name.includes('فنكر') || name.includes('بطاطس') || name.includes('فرنش فريز')) return 7; 
        if (name.includes('صوص') || name.includes('ثومية') || name.includes('مقبلات') || name.includes('مخلل') || name.includes('كاتشب')) return 9; 
        if (name.includes('سندويش') || name.includes('ساندويش') || name.includes('صاج') || name.includes('زنجر') || name.includes('سكالوب')) return 4; 
        if (name.includes('عرض') || name.includes('عائلي') || name.includes('ليمتد')) return 1; 
        if (name.includes('إضافة') || name.includes('اضافة') || name.includes('جبن')) return 10; 
    }
    return 1;
}

function autoFixItemCategories() {
    let items = getData('sys_items');
    if (Array.isArray(items) && items.length > 0) {
        let updated = false;
        items.forEach(i => {
            const correctCat = getItemCategory(i);
            if (cleanPrice(i.categoryId) !== correctCat) {
                i.categoryId = correctCat;
                i.catId = correctCat;
                i.category = correctCat;
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('sys_items', JSON.stringify(items));
        }
    }
}

function normalizeArabicArea(str) {
    if (!str) return '';
    return str.toString()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/^ال/, '')
        .trim()
        .toLowerCase();
}

function initData() {
    let currentItems = getData('sys_items');
    if (!currentItems || !Array.isArray(currentItems) || currentItems.length === 0) {
        if (db) {
            db.collection("menu_items").get().then(snapshot => {
                if (!snapshot.empty) {
                    let cloudItems = [];
                    snapshot.forEach(doc => cloudItems.push({ ...doc.data(), docId: doc.id }));
                    setData('sys_items', cloudItems);
                    refreshActiveUI();
                } else {
                    localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
                }
            }).catch(err => console.error("Error fetching initial cloud data:", err));
        } else {
            localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
        }
    }

    let existingCats = getData('sys_categories');
    if (!existingCats || !Array.isArray(existingCats) || existingCats.length === 0) {
        localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    }

    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify(DEFAULT_DATA.inventory));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_printer_settings')) localStorage.setItem('sys_printer_settings', JSON.stringify(DEFAULT_DATA.printerSettings));
    if (!localStorage.getItem('sys_cashiers') || JSON.parse(localStorage.getItem('sys_cashiers')).length === 0) {
        localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    }
    if (!localStorage.getItem('sys_employees')) localStorage.setItem('sys_employees', JSON.stringify(DEFAULT_DATA.employees));
    if (!localStorage.getItem('sys_drivers')) localStorage.setItem('sys_drivers', JSON.stringify(DEFAULT_DATA.drivers));
    if (!localStorage.getItem('sys_areas')) localStorage.setItem('sys_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
    if (!localStorage.getItem('sys_quick_kitchen_notes')) localStorage.setItem('sys_quick_kitchen_notes', JSON.stringify(DEFAULT_DATA.quickKitchenNotes));
    if (!localStorage.getItem('sys_expenses')) localStorage.setItem('sys_expenses', JSON.stringify([]));
    if (!localStorage.getItem('sys_completed_orders')) localStorage.setItem('sys_completed_orders', JSON.stringify([]));
    if (!localStorage.getItem('sys_customers')) localStorage.setItem('sys_customers', JSON.stringify([]));

    setupCloudRealtimeSync();
}

function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function setData(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    if (db && key !== 'sys_items') {
        try {
            db.collection("system_store").doc(key).set({ content: JSON.stringify(val), updatedAt: new Date() });
        } catch(e) {}
    }
}

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 🔢 حاسبة رقم الطلب الديناميكية الحقيقية
function getOrderSequence(customOrder) {
    if (customOrder) {
        if (customOrder.orderNum && !isNaN(customOrder.orderNum)) return parseInt(customOrder.orderNum);
        if (customOrder.orderNumber && !isNaN(customOrder.orderNumber)) return parseInt(customOrder.orderNumber);
    }
    
    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();
    const todayOrders = completed.filter(o => o.dateDate === today);

    if (todayOrders.length > 0) {
        let maxNum = 0;
        todayOrders.forEach(o => {
            const num = cleanPrice(o.orderNum || o.orderNumber);
            if (num > maxNum) maxNum = num;
        });
        if (maxNum > 0) return maxNum + 1;
    }

    let currentSeq = localStorage.getItem('mim89_daily_order_seq');
    let seqNum = currentSeq ? parseInt(currentSeq) : 101;
    return seqNum;
}

function incrementOrderSequence() {
    let nextSeq = getOrderSequence() + 1;
    if (nextSeq >= 999) nextSeq = 101;
    localStorage.setItem('mim89_daily_order_seq', nextSeq);
}

function getSystemPassword(type) {
    const sysPasses = getData('sys_passwords') || {};
    return sysPasses[type] || DEFAULT_DATA.passwords[type] || '123456';
}

function setupCloudRealtimeSync() {
    if (!db) return;

    db.collection("menu_items").onSnapshot(snapshot => {
        if (!snapshot.empty) {
            let cloudItems = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                cloudItems.push({
                    ...data,
                    docId: doc.id,
                    id: data.id || doc.id,
                    categoryId: cleanPrice(data.categoryId || data.catId || data.category || 1)
                });
            });
            if (cloudItems.length > 0) {
                localStorage.setItem('sys_items', JSON.stringify(cloudItems));
                refreshActiveUI();
            }
        }
    }, err => console.log("Menu sync fallback:", err));
}

const posSyncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mim89_menu_sync') : null;

if (posSyncChannel) {
    posSyncChannel.onmessage = (event) => {
        if (event.data === 'menu_updated') {
            if (typeof refreshActiveUI === 'function') refreshActiveUI();
        }
    };
}

function notifyMenuUpdated() {
    localStorage.setItem('mim89_last_menu_update', Date.now());
    if (posSyncChannel) posSyncChannel.postMessage('menu_updated');
    if (typeof refreshActiveUI === 'function') refreshActiveUI();
}

function refreshActiveUI() {
    autoFixItemCategories();
    if (document.body.classList.contains('public-menu-body')) {
        if (typeof renderPublicMenuUI === 'function') renderPublicMenuUI();
    } else if (document.getElementById('posProductsGrid')) {
        if (typeof loadPosDirectMenu === 'function') loadPosDirectMenu('all');
        if (typeof listenForIncomingOrders === 'function') listenForIncomingOrders();
    } else if (document.getElementById('adminItemsTable')) {
        if (typeof renderAdminCategories === 'function') renderAdminCategories();
        if (typeof renderAdminItems === 'function') renderAdminItems();
        if (typeof renderAdminDrivers === 'function') renderAdminDrivers();
        if (typeof renderAdminCustomers === 'function') renderAdminCustomers();
    } else if (document.getElementById('inventoryTableBody')) {
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
    }
}

/* ==========================================
   3. إدارة وحفظ دليل الزبائن السريع (Customer CRM)
   ========================================== */

function saveCustomerRecord(name, phone, area, address) {
    if (!phone || phone === '-' || phone === 'بدون رقم') return;
    
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 5) return;

    let rawData = getData('sys_customers');
    let customers = Array.isArray(rawData) ? rawData : [];
    
    let existingIndex = customers.findIndex(c => c && c.phone && String(c.phone).replace(/[^0-9]/g, '') === cleanPhone);

    const customerData = {
        id: existingIndex !== -1 ? customers[existingIndex].id : 'CUST_' + Date.now(),
        name: (name && name !== 'مكالمة واردة' && name !== 'زبون مباشر') ? name : (existingIndex !== -1 ? customers[existingIndex].name : 'زبون هاتف'),
        phone: cleanPhone,
        area: area || (existingIndex !== -1 ? customers[existingIndex].area : ''),
        address: address || (existingIndex !== -1 ? customers[existingIndex].address : ''),
        lastOrderDate: getTodayString(),
        updatedAt: Date.now()
    };

    if (existingIndex !== -1) {
        customers[existingIndex] = { ...customers[existingIndex], ...customerData };
    } else {
        customers.unshift(customerData);
    }

    setData('sys_customers', customers);

    if (typeof db !== 'undefined' && db) {
        db.collection("customers").doc(cleanPhone).set(customerData, { merge: true })
            .catch(err => console.error("Customer cloud sync error:", err));
    }
}

function autoSearchCustomerByPhone(phoneInput) {
    const cleanPhone = String(phoneInput || '').replace(/[^0-9]/g, '');
    const resultsBox = document.getElementById('phoneSearchResults');
    if (!resultsBox) return;

    if (cleanPhone.length < 3) {
        resultsBox.style.display = 'none';
        return;
    }

    const customers = getData('sys_customers') || [];
    const completed = getData('sys_completed_orders') || [];

    let matches = customers.filter(c => c.phone && c.phone.includes(cleanPhone));

    if (matches.length === 0) {
        completed.forEach(o => {
            if (o.phone && o.phone !== '-' && String(o.phone).includes(cleanPhone)) {
                if (!matches.some(m => m.phone === o.phone)) {
                    matches.push({
                        name: o.customerName || 'زبون سابق',
                        phone: o.phone,
                        area: o.area || '',
                        address: o.address || ''
                    });
                }
            }
        });
    }

    if (matches.length === 0) {
        resultsBox.innerHTML = '<div style="padding:8px; color:#aaa; font-size:0.8rem; text-align:center;">🆕 زبون جديد (غير مسجل سابقاً)</div>';
        resultsBox.style.display = 'block';
        return;
    }

    resultsBox.innerHTML = matches.slice(0, 4).map(cust => `
        <div onclick="fillCustomerData('${(cust.name || 'زبون').replace(/'/g, "\\'")}', '${cust.phone}', '${(cust.area || '').replace(/'/g, "\\'")}', '${(cust.address || '').replace(/'/g, "\\'")}')" 
             style="padding:8px 12px; background:#22222a; border-bottom:1px solid #333; cursor:pointer; border-radius:6px; margin-bottom:4px;">
            <strong style="color:var(--gold-bright, #ffd700); font-size:0.85rem;">👤 ${cust.name}</strong> 
            <small style="color:#aaa;">(${cust.phone})</small><br>
            <span style="font-size:0.75rem; color:#ccc;">📍 ${cust.area || 'بدون منطقة'} ${cust.address ? '- ' + cust.address : ''}</span>
        </div>
    `).join('');
    resultsBox.style.display = 'block';
}

function fillCustomerData(name, phone, area, address) {
    const nameInput = document.getElementById('posCustName');
    if (nameInput) {
        nameInput.value = `${name} | هاتف: ${phone} ${area ? '| ' + area : ''} ${address ? '- ' + address : ''}`;
    }
    const resultsBox = document.getElementById('phoneSearchResults');
    if (resultsBox) resultsBox.style.display = 'none';
}

/* ==========================================
   4. نقطة البيع POS وتحديد نوع الطلب والدليفري
   ========================================== */

function initCashierPage() { 
    initData(); 
    sessionStorage.removeItem('active_cashier');
    if (document.getElementById('authOverlay')) document.getElementById('authOverlay').style.display = 'flex';
    if (document.getElementById('cashierMainApp')) document.getElementById('cashierMainApp').style.display = 'none';
}

function loginCashier() {
    const passInput = document.getElementById('cashierPassInput');
    const inputPass = passInput ? String(passInput.value).trim() : '';
    const sysPasses = getData('sys_passwords') || {};
    const validPass = sysPasses.cashier || "123";

    let cashiers = getData('sys_cashiers');
    let user = cashiers.find(c => String(c.password).trim() === inputPass);

    if (!user && (inputPass === validPass || inputPass === '123')) {
        user = { id: "c1", name: "الكاشير الرئيسي", password: validPass };
    }

    if (user) {
        activeCashierUser = user;
        sessionStorage.setItem('active_cashier', JSON.stringify(activeCashierUser));
        sessionStorage.setItem('shift_start_time', new Date().toLocaleString('ar-IQ'));
        sessionStorage.setItem('shift_start_timestamp', Date.now());

        if (document.getElementById('authOverlay')) document.getElementById('authOverlay').style.display = 'none';
        if (document.getElementById('cashierMainApp')) document.getElementById('cashierMainApp').style.display = 'flex';
        if (document.getElementById('activeCashierName')) document.getElementById('activeCashierName').innerText = "الكاشير: " + user.name;
        if (document.getElementById('authError')) document.getElementById('authError').innerText = "";
        if (passInput) passInput.value = "";
        
        loadPosDirectMenu('all');
        loadDriversAndAppDropdowns();
        listenForIncomingOrders();
    } else {
        if (document.getElementById('authError')) document.getElementById('authError').innerText = "الرمز السري غير صحيح!";
    }
}

function selectOrderType(btnElement) {
    document.querySelectorAll('#posOrderTypeGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosOrderType = btnElement.getAttribute('data-value');

    const driverBox = document.getElementById('driverSelectBox');
    if (driverBox) {
        driverBox.style.display = (selectedPosOrderType === 'delivery') ? 'block' : 'none';
    }
    renderPosCart();
}

function selectPaymentMethod(btnElement) {
    document.querySelectorAll('#posPaymentGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosPaymentMethod = btnElement.getAttribute('data-value');
}

function loadDriversAndAppDropdowns() {
    const drivers = getData('sys_drivers');
    const select = document.getElementById('posDriverSelect');
    if (!select) return;

    select.innerHTML = `
        <option value="">-- اختر سائق التوصيل / التطبيق --</option>
        <optgroup label="🛵 سائقو المطعم">
            ${drivers.map(d => `<option value="${d.name}">${d.name} (${d.phone || 'مطعم'})</option>`).join('')}
        </optgroup>
        <optgroup label="📱 تطبيقات الطلبات">
            <option value="تطبيق طلباتي">📱 تطبيق طلباتي (Talabatey)</option>
            <option value="تطبيق توترز">📱 تطبيق توترز (Toters)</option>
            <option value="تطبيق بلي">📱 تطبيق بلي (Bale)</option>
        </optgroup>
    `;
}

function loadPosDirectMenu(catId = 'all') {
    const categories = getData('sys_categories');
    let items = getData('sys_items');
    const catBar = document.getElementById('posCategoriesBar');
    const grid = document.getElementById('posProductsGrid');

    if (!catBar || !grid) return;

    catBar.innerHTML = `<button class="category-tab ${catId === 'all' ? 'active' : ''}" onclick="loadPosDirectMenu('all')">الكل 🍔</button>`;
    categories.forEach(c => {
        catBar.innerHTML += `<button class="category-tab ${catId == c.id ? 'active' : ''}" onclick="loadPosDirectMenu('${c.id}')">${c.name}</button>`;
    });

    let filtered = (catId === 'all') ? items : items.filter(i => getItemCategory(i) === cleanPrice(catId));
    filtered.sort((a, b) => (cleanPrice(a.price) || 0) - (cleanPrice(b.price) || 0));

    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card ${item.isOutOfStock ? 'sold-out' : ''}" onclick="${item.isOutOfStock ? 'alert(\'نفذت الكمية\')' : `addToPosCart('${item.id}')`}">
            <img src="${item.image || item.img}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary, #ffd700); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
            ${item.isOutOfStock ? '<small style="color:#ff4d4d; font-weight:bold; display:block;">نفذت 🚫</small>' : ''}
        </div>
    `).join('');
}

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => String(i.id) === String(itemId) || cleanPrice(i.id) === cleanPrice(itemId));
    if (!item) return;

    if (item.isOutOfStock) return alert("⚠️ نفذت كمية هذا الصنف!");

    const exist = posCart.find(c => String(c.id) === String(itemId) || cleanPrice(c.id) === cleanPrice(itemId));

    if (exist) {
        exist.qty += 1;
    } else {
        posCart.push({ ...item, price: cleanPrice(item.price), qty: 1, itemNotes: [] });
    }
    recalculateActiveDiscount();
    renderPosCart();
}

function changePosCartQty(id, change) {
    const item = posCart.find(c => String(c.id) === String(id) || cleanPrice(c.id) === cleanPrice(id));
    if (item) {
        item.qty += change;
        if (item.qty <= 0) posCart = posCart.filter(c => String(c.id) !== String(id) && cleanPrice(c.id) !== cleanPrice(id));
    }
    recalculateActiveDiscount();
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    clearAllDiscounts();
    renderPosCart();
}

function renderPosCart() {
    const list = document.getElementById('posCartList');
    const totalEl = document.getElementById('posTotalAmount');
    if (!list) return;

    if (posCart.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#777; font-size:0.85rem; padding:20px;">اختر الوجبات لإضافتها للفاتورة</p>`;
        if (totalEl) totalEl.innerText = "0 د.ع";
        return;
    }

    const quickNotes = getData('sys_quick_kitchen_notes') || ["بدون ثوم 🧄", "سبايسي 🌶️", "صوص زيادة 🧀", "بدون مخلل 🥒"];
    let subtotal = 0;

    let cartContentHtml = posCart.map((item, index) => {
        const itemTotal = cleanPrice(item.price) * cleanPrice(item.qty);
        subtotal += itemTotal;

        let notesTags = (item.itemNotes && item.itemNotes.length > 0) ? 
            `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:3px;">` + 
            item.itemNotes.map((n, nIdx) => `<span style="background:#333; color:var(--gold-bright, #ffd700); font-size:0.7rem; padding:1px 6px; border-radius:4px; border:1px solid #555;">${n} <b onclick="removeNoteFromCartItem(${index}, ${nIdx})" style="cursor:pointer; color:#ff4d4d; margin-right:3px;">×</b></span>`).join('') +
            `</div>` : '';

        return `
            <div style="background:#1c1c20; padding:8px; border-radius:6px; margin-bottom:6px; border:1px solid #333;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff; font-size:0.85rem;">${item.name}</strong>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button onclick="changePosCartQty('${item.id}', -1)" style="padding:1px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:3px;">-</button>
                        <span style="color:#ffd700; font-weight:bold;">${item.qty}</span>
                        <button onclick="changePosCartQty('${item.id}', 1)" style="padding:1px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:3px;">+</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; color:#aaa; font-size:0.75rem; margin-top:3px;">
                    <span>${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع × ${item.qty}</span>
                    <strong style="color:#ffd700;">${itemTotal.toLocaleString('ar-IQ')} د.ع</strong>
                </div>
                ${notesTags}
            </div>
        `;
    }).join('');

    let deliveryFee = 0;
    if (selectedPosOrderType === 'delivery') {
        const custInput = document.getElementById('posCustName')?.value || '';
        const normInput = normalizeArabicArea(custInput);
        if (normInput.includes('قاهره') || normInput.includes('قاهرة')) {
            deliveryFee = 0;
        } else {
            deliveryFee = 2500;
        }
    }

    const netTotal = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;

    if (totalEl) {
        totalEl.innerHTML = `${netTotal.toLocaleString('ar-IQ')} د.ع ${deliveryFee > 0 ? `<small style="font-size:0.75rem; color:#aaa;">(توصيل: ${deliveryFee.toLocaleString()} د.ع)</small>` : ''}`;
    }

    list.innerHTML = cartContentHtml;
}
/* ==========================================
   5. إدارة حاسبة النقد وإتمام الطباعة (الزبون + المطبخ)
   ========================================== */

function openQuickCashModal() {
    if (!posCart || posCart.length === 0) {
        return alert("⚠️ السلة فارغة! يرجى إضافة وجبات أولاً.");
    }

    if (selectedPosOrderType === 'delivery') {
        const driver = document.getElementById('posDriverSelect')?.value;
        if (!driver || driver === '') {
            return alert("⚠️ يرجى اختيار سائق التوصيل أو التطبيق قبل إتمام الطلب!");
        }
    }

    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    let deliveryFee = 0;

    if (selectedPosOrderType === 'delivery') {
        const custInput = document.getElementById('posCustName')?.value || '';
        const normInput = normalizeArabicArea(custInput);
        deliveryFee = (normInput.includes('قاهره') || normInput.includes('قاهرة')) ? 0 : 2500;
    }

    const netTotal = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;

    const reqEl = document.getElementById('modalCashTotalReq');
    if (reqEl) reqEl.innerText = netTotal.toLocaleString('ar-IQ') + " د.ع";

    const cashInput = document.getElementById('cashGivenInput');
    if (cashInput) {
        cashInput.value = netTotal;
    }

    calculateCashChange();
    openModal('quickCashModal');
}

function setCashGiven(amount) {
    const cashInput = document.getElementById('cashGivenInput');
    if (cashInput) {
        cashInput.value = amount;
        calculateCashChange();
    }
}

function calculateCashChange() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    let deliveryFee = 0;
    if (selectedPosOrderType === 'delivery') {
        const custInput = document.getElementById('posCustName')?.value || '';
        const normInput = normalizeArabicArea(custInput);
        deliveryFee = (normInput.includes('قاهره') || normInput.includes('قاهرة')) ? 0 : 2500;
    }

    const netTotal = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;
    const cashGiven = cleanPrice(document.getElementById('cashGivenInput')?.value || 0);
    const change = cashGiven - netTotal;

    const changeEl = document.getElementById('cashChangeResult');
    if (changeEl) {
        if (change < 0) {
            changeEl.innerText = `المبلغ غير كافٍ (${Math.abs(change).toLocaleString()} د.ع)`;
            changeEl.style.color = "var(--danger)";
        } else {
            changeEl.innerText = `${change.toLocaleString('ar-IQ')} د.ع`;
            changeEl.style.color = "var(--success)";
        }
    }
}

function proceedToPrintAfterCash() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    let deliveryFee = 0;
    if (selectedPosOrderType === 'delivery') {
        const custInput = document.getElementById('posCustName')?.value || '';
        const normInput = normalizeArabicArea(custInput);
        deliveryFee = (normInput.includes('قاهره') || normInput.includes('قاهرة')) ? 0 : 2500;
    }

    const netTotal = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;
    const cashGiven = cleanPrice(document.getElementById('cashGivenInput')?.value || 0);

    if (cashGiven < netTotal && selectedPosPaymentMethod === 'cash') {
        return alert("⚠️ المبلغ المستلم أقل من مجموع الفاتورة المطلوب!");
    }

    const custNameRaw = document.getElementById('posCustName')?.value.trim() || 'زبون مباشر';
    const driverName = selectedPosOrderType === 'delivery' ? (document.getElementById('posDriverSelect')?.value || 'سائق غير محدد') : '-';

    let orderNumSeq = getOrderSequence();

    activePendingPrintOrder = {
        id: "ORD_" + Date.now(),
        orderNum: orderNumSeq,
        customerName: custNameRaw,
        phone: custNameRaw.includes('هاتف:') ? custNameRaw.split('هاتف:')[1].trim().split(' ')[0] : '-',
        orderType: selectedPosOrderType === 'delivery' ? 'توصيل' : (selectedPosOrderType === 'takeaway' ? 'سفري' : 'صالة'),
        area: selectedPosOrderType === 'delivery' ? (custNameRaw.includes('|') ? custNameRaw.split('|').slice(2).join(' ') : 'توصيل محلي') : 'داخل المطعم',
        paymentMethod: selectedPosPaymentMethod === 'cash' ? 'كاش' : 'فيزا / ماستر',
        driverName: driverName,
        items: posCart.map(i => ({
            id: i.id,
            name: i.name,
            qty: cleanPrice(i.qty),
            price: cleanPrice(i.price),
            itemNotes: i.itemNotes || []
        })),
        subtotal: subtotal,
        discount: posDiscountAmount,
        deliveryFee: deliveryFee,
        totalAmount: netTotal,
        cashGiven: cashGiven,
        cashChange: Math.max(0, cashGiven - netTotal),
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now(),
        cashierName: activeCashierUser ? activeCashierUser.name : 'الرئيسي',
        isSettled: false // لم يتم تصفية حساب الدليفري بعد
    };

    isCustomerPrinted = false;
    isKitchenPrinted = false;

    updatePrintStatusBadges();
    closeModal('quickCashModal');
    openModal('printOptionsModal');
}

function updatePrintStatusBadges() {
    const custBadge = document.getElementById('custPrintBadge');
    const kitBadge = document.getElementById('kitchenPrintBadge');

    if (custBadge) {
        custBadge.innerText = isCustomerPrinted ? "✅ (تمت الطباعة)" : "(لم تُطبع)";
        custBadge.style.color = isCustomerPrinted ? "var(--success)" : "#888";
    }
    if (kitBadge) {
        kitBadge.innerText = isKitchenPrinted ? "✅ (تمت الطباعة)" : "(لم تُطبع)";
        kitBadge.style.color = isKitchenPrinted ? "var(--success)" : "#888";
    }
}

/* ==========================================
   6. آلية الطباعة الحرارية المباشرة (80mm)
   ========================================== */

function executeCustomerPrintOnly() {
    if (!activePendingPrintOrder) return alert("لا توجد فاتورة جاهزة للطباعة!");

    const ord = activePendingPrintOrder;
    let itemsHtml = ord.items.map(i => `
        <tr style="border-bottom:1px solid #000;">
            <td style="padding:4px 0; font-weight:bold; font-size:14px; text-align:right;">${i.name} ${i.itemNotes.length ? '<br><small>('+i.itemNotes.join(', ')+')</small>' : ''}</td>
            <td style="padding:4px 0; font-weight:bold; font-size:14px; text-align:center;">${i.qty}</td>
            <td style="padding:4px 0; font-weight:bold; font-size:14px; text-align:left;">${(i.price * i.qty).toLocaleString()}</td>
        </tr>
    `).join('');

    const printBox = document.getElementById('mim89ThermalPrintBox');
    printBox.innerHTML = `
        <div style="width:76mm; font-family:'Tajawal', sans-serif; text-align:right; direction:rtl; color:#000; padding:2mm;">
            <div style="text-align:center; border-bottom:2px dashed #000; padding-bottom:4px; margin-bottom:6px;">
                <h2 style="margin:0; font-size:22px; font-weight:900;">MIM89 FAST FOOD</h2>
                <span style="font-size:12px; font-weight:bold;">بغداد - القاهرة | فاتورة مبيعات</span>
            </div>

            <div style="text-align:center; border:2px solid #000; padding:4px; margin-bottom:6px; background:#fff;">
                <span style="font-size:12px; font-weight:bold;">رقم الطلب</span>
                <h1 style="margin:0; font-size:40px; font-weight:900; line-height:1;">#${ord.orderNum}</h1>
            </div>

            <div style="font-size:12px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:4px; margin-bottom:6px; line-height:1.4;">
                <div>التاريخ: ${ord.dateDate} - ${ord.timestamp}</div>
                <div>الخدمة: <strong>${ord.orderType}</strong> ${ord.driverName !== '-' ? `(السائق: ${ord.driverName})` : ''}</div>
                <div>الزبون: ${ord.customerName}</div>
                <div>طريقة الدفع: ${ord.paymentMethod}</div>
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:6px;">
                <thead>
                    <tr style="border-bottom:2px solid #000;">
                        <th style="text-align:right; font-size:12px;">الوجبة</th>
                        <th style="text-align:center; font-size:12px;">العدد</th>
                        <th style="text-align:left; font-size:12px;">المبلغ</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>

            <div style="border-top:2px dashed #000; padding-top:4px; font-size:13px; font-weight:bold; line-height:1.5;">
                <div style="display:flex; justify-content:space-between;"><span>المجموع:</span> <span>${ord.subtotal.toLocaleString()} د.ع</span></div>
                ${ord.discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>الخصم:</span> <span>-${ord.discount.toLocaleString()} د.ع</span></div>` : ''}
                ${ord.deliveryFee > 0 ? `<div style="display:flex; justify-content:space-between;"><span>التوصيل:</span> <span>+${ord.deliveryFee.toLocaleString()} د.ع</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:16px; border-top:2px solid #000; padding-top:4px; margin-top:2px;">
                    <span>المطلوب:</span> <strong>${ord.totalAmount.toLocaleString()} د.ع</strong>
                </div>
                ${ord.cashGiven > 0 ? `
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#333; margin-top:2px;">
                        <span>المستلم: ${ord.cashGiven.toLocaleString()} | الباقي: ${ord.cashChange.toLocaleString()} د.ع</span>
                    </div>
                ` : ''}
            </div>

            <div style="text-align:center; margin-top:10px; font-size:11px; font-weight:bold; border-top:1px solid #000; padding-top:4px;">
                شكراً لزيارتكم MIM89 - أهلاً وسهلاً بكم
            </div>
        </div>
    `;

    isCustomerPrinted = true;
    updatePrintStatusBadges();

    setTimeout(() => {
        window.print();
    }, 100);
}

function executeKitchenPrintOnly() {
    if (!activePendingPrintOrder) return alert("لا توجد فاتورة جاهزة للطباعة!");

    const ord = activePendingPrintOrder;
    let kitchenItemsHtml = ord.items.map(i => `
        <div style="border-bottom:2px dashed #000; padding:6px 0; font-size:18px; font-weight:900;">
            <div style="display:flex; justify-content:space-between;">
                <span>● ${i.name}</span>
                <span style="font-size:24px;">[x${i.qty}]</span>
            </div>
            ${i.itemNotes.length ? `<div style="font-size:15px; color:#000; margin-top:2px; background:#eee; padding:2px;">⚠️ ملاحظة: ${i.itemNotes.join(' - ')}</div>` : ''}
        </div>
    `).join('');

    const printBox = document.getElementById('mim89ThermalPrintBox');
    printBox.innerHTML = `
        <div style="width:76mm; font-family:'Tajawal', sans-serif; text-align:right; direction:rtl; color:#000; padding:2mm;">
            <div style="text-align:center; border-bottom:3px solid #000; padding-bottom:4px; margin-bottom:6px;">
                <h1 style="margin:0; font-size:24px; font-weight:900;">*** أمر تجهيز المطبخ ***</h1>
                <span style="font-size:13px; font-weight:bold;">الوقت: ${ord.timestamp}</span>
            </div>

            <div style="text-align:center; border:3px solid #000; padding:4px; margin-bottom:6px; background:#fff;">
                <span style="font-size:12px; font-weight:bold;">رقم الطلب</span>
                <h1 style="margin:0; font-size:48px; font-weight:900; line-height:1;">#${ord.orderNum}</h1>
            </div>

            <div style="font-size:14px; font-weight:bold; margin-bottom:8px; border-bottom:2px solid #000; padding-bottom:4px;">
                <div>النوع: <strong>${ord.orderType}</strong></div>
                <div>الزبون: ${ord.customerName}</div>
            </div>

            <div>${kitchenItemsHtml}</div>
        </div>
    `;

    isKitchenPrinted = true;
    updatePrintStatusBadges();

    setTimeout(() => {
        window.print();
    }, 100);
}

function tryFinalizeAndClearOrder() {
    if (!activePendingPrintOrder) return;

    if (!isCustomerPrinted || !isKitchenPrinted) {
        if (!confirm("⚠️ لم تقم بطباعة الفاتورتين (الزبون والمطبخ) بعد! هل أنت متأكد من إنهاء الطلب وتفريغ السلة بدون طباعة؟")) {
            return;
        }
    }

    // حفظ الفاتورة المنجزة
    let completed = getData('sys_completed_orders') || [];
    completed.unshift(activePendingPrintOrder);
    setData('sys_completed_orders', completed);

    // خصم المواد من المخزن
    if (typeof deductInventoryFromRecipe === 'function') {
        deductInventoryFromRecipe(activePendingPrintOrder.items);
    }

    // زيادة الترتيب اليومي
    incrementOrderSequence();

    // تفريغ السلة والواجهة
    posCart = [];
    clearAllDiscounts();
    activePendingPrintOrder = null;
    isCustomerPrinted = false;
    isKitchenPrinted = false;

    const custInput = document.getElementById('posCustName');
    if (custInput) custInput.value = '';

    renderPosCart();
    closeModal('printOptionsModal');
    alert("🎉 تم إتمام وسحب الطلب بنجاح وتوثيقه في الصندوق!");
}

/* ==========================================
   7. تصفية حساب وسائقي الدليفري وإدارة الذمة (السعر + العودة)
   ========================================== */

function getDriverDailySettlementReport(driverName) {
    const today = getTodayString();
    const completed = getData('sys_completed_orders') || [];
    
    // الفواتير غير المصفاة لهذا السائق اليوم
    const driverOrders = completed.filter(o => 
        o.dateDate === today && 
        o.orderType === 'توصيل' && 
        o.driverName === driverName && 
        !o.isSettled
    );

    let totalAmountCollected = 0;
    let totalDeliveryFees = 0;

    driverOrders.forEach(ord => {
        totalAmountCollected += cleanPrice(ord.totalAmount || 0);
        totalDeliveryFees += cleanPrice(ord.deliveryFee || 0);
    });

    const netToPayToRestaurant = totalAmountCollected - totalDeliveryFees;

    return {
        driverName: driverName,
        ordersCount: driverOrders.length,
        ordersList: driverOrders,
        totalAmountCollected: totalAmountCollected,
        totalDeliveryFees: totalDeliveryFees,
        netToPayToRestaurant: netToPayToRestaurant
    };
}

function openDriverSettlementModal() {
    const drivers = getData('sys_drivers') || [];
    const repContainer = document.getElementById('repDriversList');
    if (!repContainer) return;

    let html = `
        <div style="background:#121215; padding:10px; border-radius:8px; margin-bottom:10px;">
            <h4 style="color:var(--gold-primary); margin-bottom:8px; font-size:0.95rem;">🛵 تصفية واستلام كاش الدليفري فور العودة:</h4>
    `;

    drivers.forEach(drv => {
        const rep = getDriverDailySettlementReport(drv.name);
        
        let ordersDetailHtml = rep.ordersList.map(o => `
            <div style="font-size:0.75rem; color:#ccc; display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:3px 0;">
                <span>طلب #${o.orderNum} - ${o.customerName}</span>
                <strong style="color:var(--gold-bright);">${cleanPrice(o.totalAmount).toLocaleString('ar-IQ')} د.ع</strong>
            </div>
        `).join('');

        html += `
            <div style="background:#1c1c24; border:1px solid #333; padding:8px; border-radius:6px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff; font-size:0.9rem;">👤 ${drv.name}</strong>
                    <span style="background:#333; color:#ffd700; padding:1px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${rep.ordersCount} طلبات بالشارع</span>
                </div>
                
                <div style="margin:6px 0; background:#121215; padding:4px; border-radius:4px; max-height:80px; overflow-y:auto;">
                    ${ordersDetailHtml || '<p style="color:#777; font-size:0.72rem; margin:0; text-align:center;">لا توجد طلبات بذمة السائق حالياً</p>'}
                </div>

                <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:#aaa; margin-top:2px;">
                    <span>المقبوضات: <strong style="color:#fff;">${rep.totalAmountCollected.toLocaleString('ar-IQ')} د.ع</strong></span>
                    <span>أجور التوصيل: <strong style="color:#fff;">${rep.totalDeliveryFees.toLocaleString('ar-IQ')} د.ع</strong></span>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; border-top:1px dashed #444; padding-top:4px;">
                    <strong style="color:var(--success); font-size:0.88rem;">الصافي للصندوق: ${rep.netToPayToRestaurant.toLocaleString('ar-IQ')} د.ع</strong>
                    ${rep.ordersCount > 0 ? `<button class="gold-btn btn-sm" onclick="settleDriverAccount('${drv.name}')" style="background:var(--success); color:#fff; border:none; padding:4px 8px; font-weight:bold; width:auto; font-size:0.75rem;">✅ استلام الكاش وتصفية الذمة</button>` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    repContainer.innerHTML = html;
}

function settleDriverAccount(driverName) {
    const rep = getDriverDailySettlementReport(driverName);
    if (rep.ordersCount === 0) return alert("لا توجد طلبات معلقة لهذا السائق لتصفيتها!");

    if (confirm(`هل تم استلام المبلغ الصافي (${rep.netToPayToRestaurant.toLocaleString()} د.ع) وتصفية ذمة السائق (${driverName}) بالكامل؟`)) {
        let completed = getData('sys_completed_orders') || [];
        const today = getTodayString();

        completed.forEach(o => {
            if (o.dateDate === today && o.driverName === driverName && !o.isSettled) {
                o.isSettled = true;
                o.settledTimestamp = Date.now();
            }
        });

        setData('sys_completed_orders', completed);
        openDriverSettlementModal();
        alert(`✅ تم استلام مبلغ الصندوق وتصفية حساب السائق (${driverName}) وتصفير الذمة فور عودته!`);
    }
}

/* ==========================================
   8. الصرفيات والتقارير المالية المجمعة
   ========================================== */

function openExpenseManagerModal() {
    renderExpensesList();
    loadExpenseDropdowns();
    openModal('expenseManagerModal');
}

function loadExpenseDropdowns() {
    const typeSelect = document.getElementById('expenseTypeSelect');
    if (!typeSelect) return;

    typeSelect.innerHTML = `
        <option value="عامة">صرفيات نثرية عامة</option>
        <option value="مشتريات">مشتريات مسواق طارئة</option>
        <option value="سلفة">سلفة موظف / كادر</option>
    `;

    const empSelect = document.getElementById('expenseEmployeeSelect');
    const employees = getData('sys_employees') || [];
    if (empSelect) {
        empSelect.innerHTML = employees.map(e => `<option value="${e.name}">${e.name}</option>`).join('');
    }
}

function toggleExpenseTypeFields() {
    const type = document.getElementById('expenseTypeSelect')?.value;
    const empSelect = document.getElementById('expenseEmployeeSelect');
    if (empSelect) {
        empSelect.style.display = (type === 'سلفة') ? 'block' : 'none';
    }
}

function addNewExpenseRecord() {
    const type = document.getElementById('expenseTypeSelect')?.value || 'عامة';
    const amount = cleanPrice(document.getElementById('expenseAmountInput')?.value);
    const note = document.getElementById('expenseNoteInput')?.value.trim() || 'بدون تفاصيل';
    const empName = (type === 'سلفة') ? document.getElementById('expenseEmployeeSelect')?.value : '';

    if (amount <= 0) return alert("يرجى إدخال مبلغ الصرفية بشكل صحيح!");

    const expenseData = {
        id: "EXP_" + Date.now(),
        type: type,
        amount: amount,
        note: (type === 'سلفة' ? `سلفة للموظف: ${empName} | ` : '') + note,
        dateDate: getTodayString(),
        createdTimestamp: Date.now(),
        cashierName: activeCashierUser ? activeCashierUser.name : 'الرئيسي'
    };

    let expenses = getData('sys_expenses') || [];
    expenses.unshift(expenseData);
    setData('sys_expenses', expenses);

    document.getElementById('expenseAmountInput').value = '';
    document.getElementById('expenseNoteInput').value = '';

    renderExpensesList();
    alert("✅ تم تسجيل الصرفية وخصمها من الصندوق اليومي!");
}

function renderExpensesList() {
    const container = document.getElementById('expensesListTable');
    if (!container) return;

    const today = getTodayString();
    const expenses = getData('sys_expenses') || [];
    const todayExpenses = expenses.filter(e => e.dateDate === today);

    if (todayExpenses.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#777; padding:10px;">لا توجد صرفيات مسجلة اليوم</p>`;
        return;
    }

    container.innerHTML = todayExpenses.map((exp, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#181822; padding:6px 10px; border-radius:6px; margin-bottom:4px; border:1px solid #282835;">
            <div>
                <strong style="color:var(--danger); font-size:0.85rem;">${exp.amount.toLocaleString('ar-IQ')} د.ع</strong>
                <div style="font-size:0.75rem; color:#aaa;">${exp.type} - ${exp.note}</div>
            </div>
            <button onclick="deleteExpenseRecord('${exp.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">✕</button>
        </div>
    `).join('');
}

function deleteExpenseRecord(id) {
    if (confirm("حذف هذه الصرفية؟")) {
        let expenses = getData('sys_expenses') || [];
        expenses = expenses.filter(e => e.id !== id);
        setData('sys_expenses', expenses);
        renderExpensesList();
    }
}

function openCompletedOrdersModal() {
    const container = document.getElementById('completedOrdersList');
    if (!container) return;

    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();
    const todayOrders = completed.filter(o => o.dateDate === today);

    if (todayOrders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#aaa; padding:15px;">لا توجد فواتير مطبوعة اليوم حتى الآن</p>`;
    } else {
        container.innerHTML = todayOrders.map(o => `
            <div style="background:#181822; border:1px solid #333; padding:8px; border-radius:6px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:var(--gold-bright);">طلب #${o.orderNum} (${o.orderType})</strong>
                    <div style="font-size:0.75rem; color:#ccc;">الزبون: ${o.customerName} | المجموع: ${cleanPrice(o.totalAmount).toLocaleString()} د.ع</div>
                </div>
                <button onclick="reprintCompletedOrder('${o.id}')" class="gold-btn btn-sm" style="width:auto; padding:3px 8px; font-size:0.75rem;">🖨️ إعادات طباعة</button>
            </div>
        `).join('');
    }

    openModal('completedOrdersModal');
}

function reprintCompletedOrder(orderId) {
    const completed = getData('sys_completed_orders') || [];
    const ord = completed.find(o => o.id === orderId);
    if (ord) {
        activePendingPrintOrder = ord;
        isCustomerPrinted = true;
        isKitchenPrinted = true;
        updatePrintStatusBadges();
        closeModal('completedOrdersModal');
        openModal('printOptionsModal');
    }
}

function clearCompletedOrdersHistory() {
    if (confirm("هل أنت متأكد من مسح أرشيف الفواتير المطبوعة بالكامل؟")) {
        setData('sys_completed_orders', []);
        openCompletedOrdersModal();
    }
}

function globalSystemSync(btnEl) {
    if (btnEl) btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري المزامنة...';
    refreshActiveUI();
    setTimeout(() => {
        if (btnEl) btnEl.innerHTML = '<i class="fa-solid fa-rotate"></i> تحديث ومزامنة النظام';
        alert("✅ تم تحديث ومزامنة بيانات المينيو والكاشير بنجاح!");
    }, 500);
}
