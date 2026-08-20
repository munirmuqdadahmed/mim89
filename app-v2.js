/* ==========================================================================
   MIM89 FAST FOOD - Master Core Engine (v21.3 Full Version - PART 1)
   مشروع الفايربيس: mim89-ff938 | نظام الكاشير المباشر والمينيو ودليل الزبائن CRM
   صاحب النظام: منير مقداد
   ========================================================================== */

// 🔒 1. الحماية الأمنية المباشرة ضد أدوات المطورين والضغط بالزر الأيمن
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', event => {
  if (
    event.key === 'F12' || 
    (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(event.key.toUpperCase())) ||
    (event.ctrlKey && event.key.toUpperCase() === 'U')
  ) {
    event.preventDefault();
  }
});

// 2. المتغيرات العامة والاتصال السحابي بـ Firebase
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
let currentUploadedBase64 = "";
let currentDetailItem = null;

// 🧮 دالة عالمية لتنظيف أي سعر/رقم من الفواصل والنصوص والأرقام الشرقية وتحويله إلى رقم مجرد
function cleanPrice(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, '');
    let num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
}

// 🍔 دالة فتح وإغلاق البردة الجانبية (الثلاث شخوط) المباشرة
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

// 3. البيانات الأساسية الكاملة لمطعم MIM89
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
        { id: 2, name: "🍔 بركر اللحم والبركر" },
        { id: 3, name: "🌯 قسم الشاورما (دجاج)" },
        { id: 4, name: "🥖 قسم السندويشات والصاج (زنجر، سكالوب، فاهيتا)" },
        { id: 5, name: "🍗 قسم الكنتاكي والريزو والوجبات" },
        { id: 6, name: "🍟 الفنكر والمقبلات" },
        { id: 7, name: "➕ قسم الإضافات" }
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
        { id: 5, name: "خبز بركر", quantity: 100, unit: "قطع", totalPrice: 25000, costPerUnit: 250 },
        { id: 6, name: "شرائح سكالوب دجاج", quantity: 50, unit: "كغم", totalPrice: 300000, costPerUnit: 6000 },
        { id: 7, name: "شرائح زنجر سبايسي", quantity: 50, unit: "كغم", totalPrice: 325000, costPerUnit: 6500 }
    ],
    items: [
        { id: 101, categoryId: 1, name: "عرض ليمتد 89 العائلي", price: 15000, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500", ingredients: "تشكيلة عائلية مميزة من وجبات MIM89", recipe: [] },
        { id: 102, categoryId: 1, name: "عرض شاورما دبل دجاج", price: 10000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبتين شاورما دجاج دبل مع صوص وبطاطس", recipe: [{ invId: 1, qty: 0.3 }, { invId: 2, qty: 2 }] },
        { id: 301, categoryId: 3, name: "شاورما صاج عادي", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج، شاورما دجاج طازجة، صلصة ثومية، مخلل", recipe: [{ invId: 1, qty: 0.12 }, { invId: 2, qty: 1 }, { invId: 3, qty: 0.1 }, { invId: 4, qty: 1 }] },
        { id: 302, categoryId: 3, name: "وجبة شاورما", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج، بطاطس مقلية، ثومية، خبز طازج", recipe: [{ invId: 1, qty: 0.12 }, { invId: 3, qty: 0.1 }] },
        { id: 303, categoryId: 3, name: "شاورما صاج دبل", price: 4500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج دبل مع كمية دجاج مضاعفة", recipe: [{ invId: 1, qty: 0.2 }, { invId: 2, qty: 2 }] },
        { id: 304, categoryId: 3, name: "شاورما صاج سوبر", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج حجم سوبر مع الصوصات والبطاطس", recipe: [{ invId: 1, qty: 0.22 }, { invId: 2, qty: 2 }] },
        { id: 305, categoryId: 3, name: "شاورما عربي", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "قطع شاورما عربي مقطعة مع بطاطس وثومية", recipe: [{ invId: 1, qty: 0.2 }, { invId: 2, qty: 1.5 }] },
        { id: 306, categoryId: 3, name: "شاورما 89 الخاص", price: 5000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خلطة شاورما MIM89 الخاصة مع الجبن والصوص", recipe: [{ invId: 1, qty: 0.25 }, { invId: 2, qty: 2 }] },
        { id: 307, categoryId: 3, name: "وجبة شاورما دبل", price: 7500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبة شاورما مضاعفة الدجاج مع المقبلات", recipe: [{ invId: 1, qty: 0.3 }, { invId: 3, qty: 0.2 }] },
        { id: 308, categoryId: 3, name: "شاورما وزن 250 غرام", price: 7000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "ربع كغم شاورما دجاج صافي بدون خبز", recipe: [{ invId: 1, qty: 0.25 }] },
        { id: 309, categoryId: 3, name: "شاورما وزن 500 غرام", price: 13000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "نصف كغم شاورما دجاج صافي طازج", recipe: [{ invId: 1, qty: 0.5 }] }
    ]
};

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
                    localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
                    localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
                }
            }).catch(err => console.error("Error fetching initial cloud data:", err));
        }
    }

    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
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
    if (db) {
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

function getOrderSequence(customOrder) {
    if (customOrder) {
        if (customOrder.orderNum && !isNaN(customOrder.orderNum)) return parseInt(customOrder.orderNum);
        if (customOrder.orderNumber && !isNaN(customOrder.orderNumber)) return parseInt(customOrder.orderNumber);
    }
    let currentSeq = localStorage.getItem('mim89_daily_order_seq');
    let seqNum = currentSeq ? parseInt(currentSeq) : 101;
    return seqNum;
}

function incrementOrderSequence() {
    let currentSeq = localStorage.getItem('mim89_daily_order_seq');
    let seqNum = currentSeq ? parseInt(currentSeq) : 101;
    let nextSeq = (seqNum >= 999) ? 101 : seqNum + 1;
    localStorage.setItem('mim89_daily_order_seq', nextSeq);
}

function getSystemPassword(type) {
    const sysPasses = getData('sys_passwords') || {};
    return sysPasses[type] || DEFAULT_DATA.passwords[type] || '123456';
}

function calculateItemCost(item) {
    const inventory = getData('sys_inventory');
    if (!item || !item.recipe || !Array.isArray(item.recipe)) return 0;

    let totalCost = 0;
    item.recipe.forEach(ingredient => {
        const stockItem = inventory.find(inv => cleanPrice(inv.id) === cleanPrice(ingredient.invId));
        if (stockItem) {
            const costPerUnit = stockItem.costPerUnit 
                || (cleanPrice(stockItem.quantity) > 0 ? (cleanPrice(stockItem.totalPrice) / cleanPrice(stockItem.quantity)) : 0);
            totalCost += (costPerUnit * cleanPrice(ingredient.qty || 0));
        }
    });
    return totalCost;
}

function setupCloudRealtimeSync() {
    if (!db) return;

    db.collection("menu_items").onSnapshot(snapshot => {
        if (!snapshot.empty) {
            let cloudItems = [];
            snapshot.forEach(doc => cloudItems.push({ ...doc.data(), docId: doc.id }));
            if (cloudItems.length >= 5) {
                setData('sys_items', cloudItems);
                refreshActiveUI();
            }
        }
    }, err => console.log("Menu sync fallback:", err));

    db.collection("menu_categories").onSnapshot(snapshot => {
        if (!snapshot.empty) {
            let cloudCategories = [];
            snapshot.forEach(doc => cloudCategories.push({ ...doc.data(), docId: doc.id }));
            if (cloudCategories.length >= 3) {
                setData('sys_categories', cloudCategories);
                refreshActiveUI();
            }
        }
    }, err => console.log("Category sync fallback:", err));

    db.collection("customers").onSnapshot(snapshot => {
        if (!snapshot.empty) {
            let cloudCustomers = [];
            snapshot.forEach(doc => cloudCustomers.push({ ...doc.data(), id: doc.id }));
            setData('sys_customers', cloudCustomers);
            if (document.getElementById('adminCustomersTableBody')) renderAdminCustomers();
        }
    }, err => console.log("Customers sync fallback:", err));
}

function refreshActiveUI() {
    if (document.body.classList.contains('public-menu-body')) {
        if (typeof loadPublicMenu === 'function') loadPublicMenu();
    } else if (document.getElementById('posProductsGrid')) {
        if (typeof loadPosDirectMenu === 'function') loadPosDirectMenu('all');
        if (typeof listenForIncomingOrders === 'function') listenForIncomingOrders();
    } else if (document.getElementById('adminItemsTable')) {
        if (typeof renderAdminItems === 'function') renderAdminItems();
        if (typeof renderAdminDrivers === 'function') renderAdminDrivers();
        if (typeof renderAdminCustomers === 'function') renderAdminCustomers();
    } else if (document.getElementById('inventoryTableBody')) {
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
    }
}

async function globalSystemSync(btnElement) {
    let originalText = "";
    if (btnElement) {
        originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> جاري التحديث...';
        btnElement.disabled = true;
    }

    try {
        if (typeof db !== 'undefined' && db) {
            const itemSnap = await db.collection("menu_items").get();
            if (!itemSnap.empty) {
                let cloudItems = [];
                itemSnap.forEach(doc => cloudItems.push({ ...doc.data(), docId: doc.id }));
                if (cloudItems.length >= 5) setData('sys_items', cloudItems);
            }

            const catSnap = await db.collection("menu_categories").get();
            if (!catSnap.empty) {
                let cloudCategories = [];
                catSnap.forEach(doc => cloudCategories.push({ ...doc.data(), docId: doc.id }));
                if (cloudCategories.length >= 3) setData('sys_categories', cloudCategories);
            }

            const orderSnap = await db.collection("orders").get();
            if (!orderSnap.empty) {
                let cloudOrders = [];
                orderSnap.forEach(doc => cloudOrders.push({ ...doc.data(), docId: doc.id }));
                setData('sys_live_orders', cloudOrders);
            }

            const custSnap = await db.collection("customers").get();
            if (!custSnap.empty) {
                let cloudCustomers = [];
                custSnap.forEach(doc => cloudCustomers.push({ ...doc.data(), id: doc.id }));
                setData('sys_customers', cloudCustomers);
            }
        }
        refreshActiveUI();
        alert("✅ تم مزامنة وتحديث النظام بنجاح من السحابة!");
    } catch (error) {
        console.error("Global sync error:", error);
        refreshActiveUI();
        alert("⚠️ تم التحديث المحلي، تحقق من اتصال الإنترنت للبيانات السحابة.");
    } finally {
        if (btnElement) {
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
            }, 500);
        }
    }
}

/* ==========================================
   4. إدارة وحفظ دليل الزبائن السريع (Customer CRM)
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

    let matches = customers.filter(c => c.phone.includes(cleanPhone));

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

function renderAdminCustomers() {
    const tbody = document.getElementById('adminCustomersTableBody');
    if (!tbody) return;

    const customers = getData('sys_customers') || [];
    const searchVal = document.getElementById('adminCustomerSearchInput')?.value.toLowerCase() || '';

    const filtered = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(searchVal)) || 
        (c.phone && c.phone.includes(searchVal)) ||
        (c.area && c.area.toLowerCase().includes(searchVal))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888; padding:15px;">لا يوجد زبائن مسجلون حالياً</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((c, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>👤 ${c.name}</strong></td>
            <td><strong style="color:var(--gold-bright, #ffd700);">${c.phone}</strong></td>
            <td>${c.area || '-'}</td>
            <td>${c.address || '-'}</td>
            <td>
                <button class="gold-btn btn-danger btn-sm" onclick="deleteCustomerRecord('${c.id}')" style="padding:3px 8px; font-size:0.75rem;">حذف</button>
            </td>
        </tr>
    `).join('');
}

function deleteCustomerRecord(id) {
    if (confirm("هل أنت متأكد من حذف هذا الزبون من الدليل؟")) {
        let customers = getData('sys_customers') || [];
        const targetCust = customers.find(c => c.id === id);
        customers = customers.filter(c => c.id !== id);
        setData('sys_customers', customers);

        if (targetCust && db) {
            db.collection("customers").doc(targetCust.phone).delete().catch(console.error);
        }
        renderAdminCustomers();
    }
}

/* ==========================================
   5. المينيو الإلكتروني العام للزبائن (index.html)
   ========================================== */

window.openItemCustomizationModal = function(itemId) {
    let items = getData('sys_items');
    const item = items.find(i => cleanPrice(i.id) === cleanPrice(itemId));
    if (!item) return;

    currentDetailItem = item;
    
    const titleEl = document.getElementById('detailTitle');
    const ingEl = document.getElementById('detailIngredients');
    const imgEl = document.getElementById('detailImg');

    if (titleEl) titleEl.innerText = item.name;
    if (ingEl) ingEl.innerText = item.ingredients || item.desc || 'وجبة طازجة تحضر فوراً حسب طلبكم.';
    if (imgEl) imgEl.src = item.image || item.img || 'https://via.placeholder.com/300x200?text=MIM89+Fast+Food';

    const normalRadio = document.querySelector('input[name="mealSizeRadio"][value="عادي"]');
    if (normalRadio) normalRadio.checked = true;

    document.querySelectorAll('.extra-item-cb').forEach(cb => cb.checked = false);
    const notesInput = document.getElementById('detailSpecialNotes');
    if (notesInput) notesInput.value = '';

    recalculateItemDetailTotal();
    openModal('itemDetailModal');
};

window.recalculateItemDetailTotal = function() {
    if (!currentDetailItem) return 0;
    let total = cleanPrice(currentDetailItem.price) || 0;

    const selectedSize = document.querySelector('input[name="mealSizeRadio"]:checked');
    if (selectedSize) total += cleanPrice(selectedSize.getAttribute('data-extra-price')) || 0;

    document.querySelectorAll('.extra-item-cb:checked').forEach(cb => {
        total += cleanPrice(cb.getAttribute('data-price')) || 0;
    });

    const priceDisplay = document.getElementById('detailCalculatedPrice');
    if (priceDisplay) priceDisplay.innerText = total.toLocaleString('ar-IQ') + ' د.ع';
    return total;
};

window.addCustomizedItemToCart = function() {
    if (!currentDetailItem) return;

    const finalPrice = recalculateItemDetailTotal();
    let notesArr = [];
    
    const selectedSize = document.querySelector('input[name="mealSizeRadio"]:checked')?.value;
    if (selectedSize && selectedSize !== 'عادي') notesArr.push(`حجم: ${selectedSize}`);

    document.querySelectorAll('.extra-item-cb:checked').forEach(cb => notesArr.push(`+ ${cb.value}`));
    const customNotesInput = document.getElementById('detailSpecialNotes')?.value.trim();
    if (customNotesInput) notesArr.push(`ملاحظة: ${customNotesInput}`);

    cart.push({
        id: currentDetailItem.id,
        name: currentDetailItem.name,
        price: cleanPrice(finalPrice),
        qty: 1,
        customNotes: notesArr.join(' | ')
    });

    updateCartBadge();
    closeModal('itemDetailModal');
};

function loadPublicMenu() {
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const navContainer = document.getElementById('categoriesNav');
    const sectionsContainer = document.getElementById('menuSections');

    if (!navContainer || !sectionsContainer) return;
    navContainer.innerHTML = ''; sectionsContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'category-tab active';
    allBtn.innerText = 'الكل 🍔';
    allBtn.onclick = () => filterCategory('all', allBtn);
    navContainer.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-tab';
        btn.innerText = cat.name;
        btn.onclick = () => filterCategory(cat.id, btn);
        navContainer.appendChild(btn);

        const catItems = items.filter(i => cleanPrice(i.categoryId) === cleanPrice(cat.id));
        if (catItems.length > 0) {
            const sec = document.createElement('div');
            sec.className = 'menu-section';
            sec.id = `cat_${cat.id}`;
            sec.setAttribute('data-category', cat.id);
            sec.innerHTML = `
                <h2 class="section-title" style="color:var(--gold-bright); margin:18px 14px 8px 14px; font-weight:900;"><i class="fa-solid fa-utensils"></i> ${cat.name}</h2>
                <div class="items-grid">
                    ${catItems.map(item => `
                        <div class="item-card">
                            <img src="${item.image || item.img}" alt="${item.name}" class="item-img" onclick="openItemCustomizationModal(${item.id})" onerror="this.src='https://via.placeholder.com/300x200?text=MIM89+FAST+FOOD'">
                            <div class="item-details">
                                <h3 class="item-name" onclick="openItemCustomizationModal(${item.id})">${item.name}</h3>
                                <p class="item-desc">${item.ingredients || item.desc || 'وجبة طازجة من MIM89'}</p>
                                <div class="item-footer">
                                    <span class="item-price">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
                                    <button class="add-cart-btn" onclick="openItemCustomizationModal(${item.id})" title="تخصيص وإضافة للسلة">+</button>
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

function updateCartBadge() {
    const count = cart.reduce((sum, i) => sum + cleanPrice(i.qty), 0);
    const total = cart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);

    const badge = document.getElementById('cartBadgeCount');
    const floatingTotal = document.getElementById('floatingCartTotal');

    if (badge) badge.innerText = count;
    if (floatingTotal) floatingTotal.innerText = total.toLocaleString('ar-IQ') + ' د.ع';
}

function openCartModal() {
    renderCartModalItems();
    calculateDeliveryCost();
    openModal('cartModal');
}

function renderCartModalItems() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (!cart || cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#aaa; padding:20px;">السلة فارغة حالياً</p>`;
        return;
    }

    container.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:#181820; padding:10px 12px; border-radius:10px; border:1px solid #282835;">
            <div>
                <strong style="color:#fff; font-size:0.88rem;">${item.name}</strong>
                ${item.customNotes ? `<div style="font-size:0.72rem; color:var(--gold-bright, #ffd700); margin-top:2px;">🔹 ${item.customNotes}</div>` : ''}
                <small style="color:var(--gold-bright, #ffd700); display:block; margin-top:2px;">${(cleanPrice(item.price) * cleanPrice(item.qty)).toLocaleString('ar-IQ')} د.ع</small>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button onclick="changeCartIndexQty(${idx}, -1)" style="background:#222; color:var(--gold-bright); border:1px solid var(--gold-primary); width:28px; height:28px; border-radius:6px; font-weight:bold; cursor:pointer;">-</button>
                <span style="color:#fff; font-weight:bold;">${item.qty}</span>
                <button onclick="changeCartIndexQty(${idx}, 1)" style="background:var(--gold-primary); color:#000; border:none; width:28px; height:28px; border-radius:6px; font-weight:bold; cursor:pointer;">+</button>
            </div>
        </div>
    `).join('');
}

function changeCartIndexQty(index, change) {
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    updateCartBadge();
    renderCartModalItems();
    calculateDeliveryCost();
}

function toggleDeliveryFields() {
    const typeSelect = document.getElementById('orderTypeSelect');
    const type = typeSelect ? typeSelect.value : 'delivery';
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
    const subtotal = cart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    const orderType = document.getElementById('orderTypeSelect') ? document.getElementById('orderTypeSelect').value : 'delivery';
    
    let areaInput = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    let areaSelect = document.getElementById('custAreaSelect') ? document.getElementById('custAreaSelect').value : '';
    let finalArea = areaInput || (areaSelect !== 'custom' ? areaSelect : '');

    let deliveryFee = 0;
    if (orderType === 'delivery') {
        const normalizedInput = normalizeArabicArea(finalArea);
        if (normalizedInput.includes("قاهره") || normalizedInput.includes("قاهرة")) {
            deliveryFee = 0;
        } else if (finalArea !== "") {
            const areas = getData('sys_areas');
            const found = areas.find(a => {
                const normName = normalizeArabicArea(a.name);
                return normName === normalizedInput || normalizedInput.includes(normName);
            });
            deliveryFee = found ? cleanPrice(found.price) : 2500;
        } else {
            deliveryFee = 2500;
        }
    }

    const subtotalEl = document.getElementById('subtotalPrice');
    const feeEl = document.getElementById('deliveryFeePrice');
    const totalEl = document.getElementById('finalTotalPrice');

    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString('ar-IQ') + ' د.ع';
    if (feeEl) feeEl.innerText = (orderType === 'delivery' && (deliveryFee === 0 || finalArea.includes('القاهرة') || finalArea.includes('قاهرة') || finalArea.includes('قاهره'))) ? "مجاني 🎉" : deliveryFee.toLocaleString('ar-IQ') + ' د.ع';
    if (totalEl) totalEl.innerText = (subtotal + deliveryFee).toLocaleString('ar-IQ') + ' د.ع';
}

window.submitOrderToCashier = function() {
    try {
        if (!cart || cart.length === 0) return alert("⚠️ السلة فارغة! يرجى إضافة وجبات أولاً.");
        
        const nameInput = document.getElementById('custName');
        const phoneInput = document.getElementById('custPhone');
        const typeSelect = document.getElementById('orderTypeSelect');
        const areaInput = document.getElementById('custArea');
        const areaSelect = document.getElementById('custAreaSelect');
        const addressInput = document.getElementById('custAddress');
        const notesInput = document.getElementById('orderNotes');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
        const type = typeSelect ? typeSelect.value : 'delivery';
        
        let selectArea = areaSelect ? areaSelect.value : 'القاهرة';
        let area = selectArea;
        if (areaInput && areaInput.value.trim() !== '') {
            area += ` - شارع: ${areaInput.value.trim()}`;
        }

        const address = addressInput ? addressInput.value.trim() : 'غير محدد';
        const notes = notesInput ? notesInput.value.trim() : 'لا يوجد';

        if (!name || name === '') return alert("⚠️ يرجى كتابة اسمك الكريم لتأكيد الطلب!");
        if (!phone || phone === '') return alert("⚠️ يرجى إدخال رقم الهاتف المباشر لتأكيد الطلب!");

        if (type === 'delivery') {
            if (!selectArea || selectArea === '' || selectArea === '-- اختر المنطقة --') {
                return alert("⚠️ يرجى اختيار منطقة التوصيل!");
            }
        }

        saveCustomerRecord(name, phone, area, address);

        const submitBtn = document.getElementById('sendOrderBtn');
        if (submitBtn) {
            submitBtn.innerText = "⏳ جاري تحويل الطلب للكاشير والواتساب...";
            submitBtn.disabled = true;
        }

        const subtotal = cart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
        let deliveryFee = 0;
        if (type === 'delivery') {
            const normArea = normalizeArabicArea(area);
            deliveryFee = (normArea.includes("قاهره") || area.includes("قاهرة") || area.includes("القاهرة")) ? 0 : 2500;
        }
        const totalAmount = subtotal + deliveryFee;
        const orderId = "MIM-" + Math.floor(1000 + Math.random() * 9000);

        const orderData = {
            id: orderId,
            orderId: orderId,
            customerName: name,
            phone: phone,
            orderType: type === 'delivery' ? 'توصيل' : (type === 'takeaway' ? 'سفري' : 'داخل الصالة'),
            area: area || 'غير محدد',
            address: address || 'غير محدد',
            notes: notes,
            items: cart.map(i => ({ name: i.name, qty: cleanPrice(i.qty), price: cleanPrice(i.price), total: cleanPrice(i.price) * cleanPrice(i.qty), customNotes: i.customNotes || '' })),
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            totalAmount: totalAmount,
            status: 'جديد',
            dateDate: getTodayString(),
            timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
            createdTimestamp: Date.now()
        };

        saveOrderLocally(orderData);
        if (db) {
            db.collection("orders").add(orderData).catch(err => console.error("Firebase Order Sync Error:", err));
        }

        let typeText = '🛵 توصيل للمنزل';
        if (type === 'takeaway') typeText = '🛍️ استلام سفري من المطعم';
        if (type === 'dine_in') typeText = '🍽️ تناول داخل الصالة';

        let itemsListText = cart.map(item => `▫️ ${item.name}${item.customNotes ? ' ('+item.customNotes+')' : ''} × ${item.qty} = ${(cleanPrice(item.price) * cleanPrice(item.qty)).toLocaleString('ar-IQ')} د.ع`).join('\n');

        let waMessage = `🔥 *طلب جديد - MIM89 FAST FOOD* 🔥\n`;
        waMessage += `🏷️ *رقم الطلب:* ${orderId}\n`;
        waMessage += `----------------------------------\n`;
        waMessage += `👤 *الزبون:* ${name}\n`;
        waMessage += `📞 *الهاتف:* ${phone}\n`;
        waMessage += `📌 *الخدمة:* ${typeText}\n`;
        if (type === 'delivery') {
            waMessage += `📍 *المنطقة والشارع:* ${area}\n`;
            if (address && address !== 'غير محدد') waMessage += `🏠 *العنوان التفصيلي:* ${address}\n`;
        }
        if (notes && notes !== 'لا يوجد') {
            waMessage += `📝 *ملاحظات:* ${notes}\n`;
        }
        waMessage += `----------------------------------\n`;
        waMessage += `🛒 *الوجبات والطلبات:*\n${itemsListText}\n`;
        waMessage += `----------------------------------\n`;
        waMessage += `💵 *مجموع الوجبات:* ${subtotal.toLocaleString('ar-IQ')} د.ع\n`;
        if (type === 'delivery') {
            waMessage += `🛵 *أجور التوصيل:* ${deliveryFee === 0 ? 'مجاني 🎉' : deliveryFee.toLocaleString('ar-IQ') + ' د.ع'}\n`;
        }
        waMessage += `💰 *المجموع الكلي:* ${totalAmount.toLocaleString('ar-IQ')} د.ع\n`;

        const restaurantPhone = "9647750008630";
        const waUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(waMessage)}`;

        localStorage.setItem('sys_last_order_id', orderId);

        cart = [];
        updateCartBadge();
        closeModal('cartModal');

        if (submitBtn) {
            submitBtn.innerText = "تأكيد وإرسال الطلب عبر الواتساب 🚀";
            submitBtn.disabled = false;
        }

        window.location.href = waUrl;
    } catch (err) {
        alert("حدث خطأ أثناء إرسال الطلب: " + err.message);
    }
};

function saveOrderLocally(orderData) {
    const orders = getData('sys_live_orders');
    orders.push(orderData);
    setData('sys_live_orders', orders);
}
/* ==========================================================================
   MIM89 FAST FOOD - Master Core Engine (v21.3 Full Version - PART 2)
   صاحب النظام: منير مقداد
   ========================================================================== */

/* ==========================================
   6. نقطة البيع POS والدليفري والتطبيقات (cashier.html)
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

function logoutCashier() { 
    sessionStorage.removeItem('active_cashier');
    location.reload(); 
}

function switchCashierTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.pos-sidebar .toggle-btn').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'flex';
    if (btn) btn.classList.add('active');
}

function selectOrderType(btnElement) {
    document.querySelectorAll('#posOrderTypeGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosOrderType = btnElement.getAttribute('data-value');

    const driverBox = document.getElementById('driverSelectBox');
    if (driverBox) {
        driverBox.style.display = (selectedPosOrderType === 'delivery') ? 'block' : 'none';
    }
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
    const items = getData('sys_items');
    const catBar = document.getElementById('posCategoriesBar');
    const grid = document.getElementById('posProductsGrid');

    if (!catBar || !grid) return;

    catBar.innerHTML = `<button class="category-tab ${catId === 'all' ? 'active' : ''}" onclick="loadPosDirectMenu('all')">الكل</button>`;
    categories.forEach(c => {
        catBar.innerHTML += `<button class="category-tab ${catId == c.id ? 'active' : ''}" onclick="loadPosDirectMenu(${c.id})">${c.name}</button>`;
    });

    const filtered = catId === 'all' ? items : items.filter(i => cleanPrice(i.categoryId) === cleanPrice(catId));

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:20px;">لا توجد وجبات في هذا القسم</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image || item.img}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary, #ffd700); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
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
            <img src="${item.image || item.img}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary, #ffd700); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
        </div>
    `).join('');
}

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => cleanPrice(i.id) === cleanPrice(itemId));
    if (!item) return;

    const exist = posCart.find(c => cleanPrice(c.id) === cleanPrice(itemId));

    if (exist) {
        exist.qty += 1;
    } else {
        posCart.push({ ...item, price: cleanPrice(item.price), qty: 1, itemNotes: [] });
    }
    recalculateActiveDiscount();
    renderPosCart();
}

function changePosCartQty(id, change) {
    const item = posCart.find(c => cleanPrice(c.id) === cleanPrice(id));
    if (item) {
        item.qty += change;
        if (item.qty <= 0) posCart = posCart.filter(c => cleanPrice(c.id) !== cleanPrice(id));
    }
    recalculateActiveDiscount();
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    clearAllDiscounts();
    renderPosCart();
}

function addNoteToCartItem(cartIndex, noteText) {
    if (posCart[cartIndex]) {
        if (!posCart[cartIndex].itemNotes) posCart[cartIndex].itemNotes = [];
        if (!posCart[cartIndex].itemNotes.includes(noteText)) {
            posCart[cartIndex].itemNotes.push(noteText);
            renderPosCart();
        }
    }
}

function removeNoteFromCartItem(cartIndex, noteIdx) {
    if (posCart[cartIndex] && posCart[cartIndex].itemNotes) {
        posCart[cartIndex].itemNotes.splice(noteIdx, 1);
        renderPosCart();
    }
}

function addCustomItemNotePrompt(cartIndex) {
    const text = prompt("أدخل ملاحظة مخصصة لهذه الوجبة:");
    if (text && text.trim() !== "") {
        addNoteToCartItem(cartIndex, text.trim());
    }
}

function toggleFreeDiscount() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    if (subtotal === 0) return alert("السلة فارغة!");
    if (activeDiscountType === 'free') {
        clearAllDiscounts();
    } else {
        activeDiscountType = 'free';
        posDiscountAmount = subtotal;
        updateDiscountUIState('free', '🎉 طلب مجاني (100%)');
        renderPosCart();
    }
}

function togglePercentDiscount() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    if (subtotal === 0) return alert("السلة فارغة!");
    if (activeDiscountType === 'percent') {
        clearAllDiscounts();
    } else {
        const inputPercent = prompt("أدخل نسبة الخصم المئوية (مثال: 50):", currentPercentValue || "50");
        if (!inputPercent) return;
        const pVal = Math.min(100, Math.max(1, cleanPrice(inputPercent) || 0));
        currentPercentValue = pVal;
        activeDiscountType = 'percent';
        posDiscountAmount = (subtotal * pVal) / 100;
        updateDiscountUIState('percent', `🏷️ خصم ${pVal}%`);
        renderPosCart();
    }
}

function promptAmountDiscount() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    if (subtotal === 0) return alert("السلة فارغة!");
    if (activeDiscountType === 'amount') {
        clearAllDiscounts();
    } else {
        const inputAmt = prompt("أدخل قيمة الخصم بالمبلغ (د.ع):", posDiscountAmount || "1000");
        if (!inputAmt) return;
        const amt = Math.max(0, cleanPrice(inputAmt) || 0);
        activeDiscountType = 'amount';
        posDiscountAmount = amt;
        updateDiscountUIState('amount', `💵 خصم ${amt.toLocaleString('ar-IQ')} د.ع`);
        renderPosCart();
    }
}

function clearAllDiscounts() {
    activeDiscountType = null;
    posDiscountAmount = 0;
    currentPercentValue = 0;
    updateDiscountUIState(null, '');
    renderPosCart();
}

function recalculateActiveDiscount() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    if (subtotal === 0) { clearAllDiscounts(); return; }
    if (activeDiscountType === 'free') posDiscountAmount = subtotal;
    else if (activeDiscountType === 'percent') posDiscountAmount = (subtotal * currentPercentValue) / 100;
}

function updateDiscountUIState(type, badgeText) {
    const badge = document.getElementById('discountStatusBadge');
    if (badge) {
        if (badgeText) {
            badge.innerText = badgeText;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
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

        let quickButtons = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:4px;">` + 
            quickNotes.map(qn => `<button onclick="addNoteToCartItem(${index}, '${qn}')" style="font-size:0.65rem; background:#222; color:#ccc; border:1px solid #444; padding:2px 5px; border-radius:3px; cursor:pointer;">+ ${qn}</button>`).join('') +
            `<button onclick="addCustomItemNotePrompt(${index})" style="font-size:0.65rem; background:#333; color:var(--gold-bright, #ffd700); border:1px solid #555; padding:2px 5px; border-radius:3px; cursor:pointer;">✏️ مخصصة</button>` +
            `</div>`;

        return `
            <div style="background:#1c1c20; padding:8px; border-radius:6px; margin-bottom:6px; border:1px solid #333;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff; font-size:0.85rem;">${item.name}</strong>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button onclick="changePosCartQty(${item.id}, -1)" style="padding:1px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:3px;">-</button>
                        <span style="color:#ffd700; font-weight:bold;">${item.qty}</span>
                        <button onclick="changePosCartQty(${item.id}, 1)" style="padding:1px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:3px;">+</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; color:#aaa; font-size:0.75rem; margin-top:3px;">
                    <span>${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع × ${item.qty}</span>
                    <strong style="color:#ffd700;">${itemTotal.toLocaleString('ar-IQ')} د.ع</strong>
                </div>
                ${notesTags}
                ${quickButtons}
            </div>
        `;
    }).join('');

    cartContentHtml += `
        <div style="margin-top:8px; border-top:1px dashed #444; padding-top:6px;">
            <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:2px;">📝 ملاحظات عامة للطلب بالكامل:</label>
            <input type="text" id="posOrderNotesInput" placeholder="أدخل أي ملاحظات إضافية..." style="width:100%; padding:6px; background:#111; border:1px solid #444; border-radius:4px; color:#fff; font-size:0.8rem; box-sizing:border-box;">
        </div>
    `;

    list.innerHTML = cartContentHtml;

    const finalNetTotal = Math.max(0, subtotal - posDiscountAmount);
    if (totalEl) {
        if (posDiscountAmount > 0) {
            totalEl.innerHTML = `<span style="text-decoration:line-through; color:#888; font-size:0.85rem; margin-left:6px;">${subtotal.toLocaleString('ar-IQ')}</span> ${finalNetTotal === 0 ? '<span style="color:#10b981;">مجاني 🎉</span>' : finalNetTotal.toLocaleString('ar-IQ') + ' د.ع'}`;
        } else {
            totalEl.innerText = finalNetTotal.toLocaleString('ar-IQ') + ' د.ع';
        }
    }
}

/* ==========================================
   7. حاسبة النقد والطباعة بخيار الزرين المستقلين
   ========================================== */

function openQuickCashModal() {
    if (posCart.length === 0) {
        alert('⚠️ السلة فارغة! اختر الوجبات أولاً.');
        return;
    }

    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    const finalTotal = Math.max(0, subtotal - posDiscountAmount);

    const modalEl = document.getElementById('quickCashModal');
    const reqEl = document.getElementById('modalCashTotalReq');
    const givenInput = document.getElementById('cashGivenInput');
    const resEl = document.getElementById('cashChangeResult');

    if (modalEl && reqEl && givenInput && resEl) {
        reqEl.innerText = finalTotal.toLocaleString('ar-IQ') + ' د.ع';
        givenInput.value = '';
        resEl.innerText = '0 د.ع';
        openModal('quickCashModal');
    } else {
        prepareAndOpenPrintModal();
    }
}

function setCashGiven(amount) {
    const input = document.getElementById('cashGivenInput');
    if (input) {
        input.value = amount;
        calculateCashChange();
    }
}

function calculateCashChange() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    const req = Math.max(0, subtotal - posDiscountAmount);
    const given = cleanPrice(document.getElementById('cashGivenInput')?.value || 0);
    const change = given - req;
    const resEl = document.getElementById('cashChangeResult');
    if (resEl) {
        if (change < 0) {
            resEl.style.color = '#ff4d4d';
            resEl.innerText = 'متبقي للزبون: ' + Math.abs(change).toLocaleString('ar-IQ') + ' د.ع';
        } else {
            resEl.style.color = '#10b981';
            resEl.innerText = change.toLocaleString('ar-IQ') + ' د.ع';
        }
    }
}

function proceedToPrintAfterCash() {
    closeModal('quickCashModal');
    prepareAndOpenPrintModal();
}

function prepareAndOpenPrintModal() {
    if (posCart.length === 0) return alert("⚠️ السلة فارغة!");

    const custName = document.getElementById('posCustName')?.value.trim() || "زبون مباشر";
    const driverSelect = document.getElementById('posDriverSelect');
    const selectedDriver = driverSelect ? driverSelect.value : '';
    const generalNotes = document.getElementById('posOrderNotesInput')?.value.trim() || '';

    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    const finalTotal = Math.max(0, subtotal - posDiscountAmount);

    let typeText = 'صالة';
    if (selectedPosOrderType === 'takeaway') typeText = 'سفري';
    if (selectedPosOrderType === 'delivery') typeText = `توصيل (${selectedDriver || 'دليفري'})`;

    const pendingOrder = {
        id: 'POS_' + Date.now(),
        orderNum: getOrderSequence(),
        customerName: custName,
        phone: "-",
        orderType: selectedPosOrderType,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? 'كاش' : 'فيزا',
        area: typeText,
        driverName: selectedDriver || '-',
        address: "-",
        notes: generalNotes,
        items: JSON.parse(JSON.stringify(posCart)),
        subtotal: subtotal,
        discount: posDiscountAmount,
        totalAmount: finalTotal,
        cashierName: activeCashierUser ? activeCashierUser.name : 'الرئيسي',
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now()
    };

    window.activePendingPrintOrder = pendingOrder;

    const printModal = document.getElementById('printOptionsModal');
    if (printModal) {
        openModal('printOptionsModal');
    } else {
        executeCustomerPrintOnly();
    }
}

function executeCustomerPrintOnly() {
    if (window.activePendingPrintOrder) {
        printCustomerInvoiceOnly(null, window.activePendingPrintOrder);
        tryFinalizeAndClearOrder();
    }
}

function executeKitchenPrintOnly() {
    if (window.activePendingPrintOrder) {
        printKitchenTicketOnly(null, window.activePendingPrintOrder);
        tryFinalizeAndClearOrder();
    }
}

function tryFinalizeAndClearOrder() {
    const ord = window.activePendingPrintOrder;
    if (ord) {
        saveCompletedOrder(ord);
        deductInventoryFromRecipe(ord.items);
        incrementOrderSequence();
    }
    clearPosCart();
    if (document.getElementById('posCustName')) document.getElementById('posCustName').value = '';
    window.activePendingPrintOrder = null;
    closeModal('printOptionsModal');
}

function saveCompletedOrder(order) {
    let completed = getData('sys_completed_orders');
    completed.unshift(order);
    setData('sys_completed_orders', completed);

    if (order.customerName && order.phone && order.phone !== '-') {
        saveCustomerRecord(order.customerName, order.phone, order.area, order.address);
    }
}

function openCompletedOrdersModal() {
    const list = document.getElementById('completedOrdersList');
    const completed = getData('sys_completed_orders');

    if (!list) return;

    if (!completed || completed.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">لا توجد فواتير سابقة مطبوعة</p>`;
    } else {
        list.innerHTML = completed.map(ord => {
            const itemsText = (ord.items && Array.isArray(ord.items)) ? ord.items.map(i => `${i.name} (×${i.qty})`).join(' ، ') : 'طلب مباشر';
            return `
                <div style="background:#222; border:1px solid #444; border-radius:8px; padding:8px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#ffd700;">
                        <strong>👤 ${ord.customerName || 'زبون'} ${ord.driverName ? ' - 🛵 ' + ord.driverName : ''}</strong>
                        <span style="font-size:0.75rem; color:#aaa;">⏰ ${ord.timestamp || ''} (${ord.dateDate || ''})</span>
                    </div>
                    <div style="font-size:0.75rem; color:#888; margin:4px 0;">الوجبات: ${itemsText}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #333; padding-top:4px; margin-top:4px;">
                        <strong style="color:#ffd700; font-size:0.9rem;">${cleanPrice(ord.totalAmount || 0).toLocaleString('ar-IQ')} د.ع</strong>
                        <div style="display:flex; gap:4px;">
                            <button class="gold-btn" style="padding:2px 8px; font-size:0.75rem;" onclick="reprintCompletedOrder('${ord.id}', 'cashier')">🖨️ كاشير</button>
                            <button class="gold-btn" style="padding:2px 8px; font-size:0.75rem; background:#38bdf8; color:#000;" onclick="reprintCompletedOrder('${ord.id}', 'kitchen')">👨‍🍳 مطبخ</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    openModal('completedOrdersModal');
}

function reprintCompletedOrder(orderId, type = 'cashier') {
    const completed = getData('sys_completed_orders');
    const order = completed.find(o => o.id === orderId);
    if (order) {
        window.activePendingPrintOrder = order;
        closeModal('completedOrdersModal');
        if (type === 'cashier') {
            printCustomerInvoiceOnly(null, order);
        } else {
            printKitchenTicketOnly(null, order);
        }
    }
}

function clearCompletedOrdersHistory() {
    if (confirm("مسح جميع الفواتير من السجل؟")) {
        setData('sys_completed_orders', []);
        openCompletedOrdersModal();
    }
}

/* ==========================================
   8. إدارة الصرفيات وسُلف الموظفين
   ========================================== */

function openExpenseManagerModal() {
    const typeSelect = document.getElementById('expenseTypeSelect');
    const empSelect = document.getElementById('expenseEmployeeSelect');

    if (typeSelect) {
        typeSelect.innerHTML = `
            <option value="عامة">🔴 صرفيات عامة للمطعم</option>
            <option value="سلفة موظف">👤 سلفة / مسحوبات موظف</option>
            <option value="مشتريات طارئة">🛒 مشتريات وسوق طارئ</option>
        `;
    }

    if (empSelect) {
        const employees = getData('sys_employees') || DEFAULT_DATA.employees;
        empSelect.innerHTML = employees.map(emp => `<option value="${emp.name}">${emp.name}</option>`).join('');
    }

    renderExpensesTable();
    openModal('expenseManagerModal');
}

function toggleExpenseTypeFields() {
    const typeSelect = document.getElementById('expenseTypeSelect');
    const empSelect = document.getElementById('expenseEmployeeSelect');
    if (typeSelect && empSelect) {
        empSelect.style.display = (typeSelect.value === 'سلفة موظف') ? 'block' : 'none';
    }
}

function addNewExpenseRecord() {
    const typeSelect = document.getElementById('expenseTypeSelect');
    const empSelect = document.getElementById('expenseEmployeeSelect');
    const amtInput = document.getElementById('expenseAmountInput');
    const noteInput = document.getElementById('expenseNoteInput');

    const amount = cleanPrice(amtInput ? amtInput.value : 0);
    if (!amount || amount <= 0) return alert("⚠️ أدخل مبلغ الصرفية بشكل صحيح!");

    const expType = typeSelect ? typeSelect.value : 'عامة';
    let details = noteInput ? noteInput.value.trim() : '';

    if (expType === 'سلفة موظف' && empSelect) {
        details = `سلفة للموظف (${empSelect.value}) - ${details}`;
    }

    const newExpense = {
        id: 'EXP_' + Date.now(),
        type: expType,
        amount: amount,
        note: details || 'صرفية يومية',
        cashierName: activeCashierUser ? activeCashierUser.name : 'الرئيسي',
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now()
    };

    let expenses = getData('sys_expenses') || [];
    expenses.unshift(newExpense);
    setData('sys_expenses', expenses);

    if (amtInput) amtInput.value = '';
    if (noteInput) noteInput.value = '';

    renderExpensesTable();
    alert("✅ تم تسجيل الصرفية وخصمها من الصندوق بنجاح!");
}

function renderExpensesTable() {
    const tableEl = document.getElementById('expensesListTable');
    if (!tableEl) return;

    const expenses = getData('sys_expenses') || [];
    const today = getTodayString();
    const todayExpenses = expenses.filter(e => e.dateDate === today);

    if (todayExpenses.length === 0) {
        tableEl.innerHTML = `<p style="text-align:center; color:#777; padding:10px;">لا توجد صرفيات مسجلة اليوم</p>`;
        return;
    }

    tableEl.innerHTML = todayExpenses.map(exp => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#222; border-bottom:1px solid #333; padding:6px; margin-bottom:4px; border-radius:4px;">
            <div>
                <strong style="color:#ff4d4d; font-size:0.8rem;">${exp.type}</strong>
                <div style="font-size:0.75rem; color:#aaa;">${exp.note} (${exp.timestamp})</div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <strong style="color:#ffd700; font-size:0.85rem;">${cleanPrice(exp.amount).toLocaleString('ar-IQ')} د.ع</strong>
                <button onclick="deleteExpenseRecord('${exp.id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:0.8rem;">✕</button>
            </div>
        </div>
    `).join('');
}

function deleteExpenseRecord(expId) {
    if (confirm("هل تريد إلغاء وحذف هذه الصرفية؟")) {
        let expenses = getData('sys_expenses') || [];
        expenses = expenses.filter(e => e.id !== expId);
        setData('sys_expenses', expenses);
        renderExpensesTable();
    }
}

/* ==========================================
   9. إدارة ملاحظات المطبخ السريعة
   ========================================== */

function openKitchenNotesManagerModal() {
    renderKitchenNotesTable();
    openModal('kitchenNotesManagerModal');
}

function renderKitchenNotesTable() {
    const listEl = document.getElementById('kitchenNotesListTable');
    if (!listEl) return;

    const notes = getData('sys_quick_kitchen_notes') || [];
    if (notes.length === 0) {
        listEl.innerHTML = `<p style="text-align:center; color:#777; padding:10px;">لا توجد ملاحظات سريعة مسجلة</p>`;
        return;
    }

    listEl.innerHTML = notes.map((note, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#222; border-bottom:1px solid #333; padding:6px; margin-bottom:4px; border-radius:4px;">
            <span style="color:#fff; font-size:0.85rem;">● ${note}</span>
            <button onclick="deleteKitchenNoteItem(${idx})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:0.85rem;">✕ حذف</button>
        </div>
    `).join('');
}

function addKitchenNoteItem() {
    const input = document.getElementById('newKitchenNoteInput');
    const text = input ? input.value.trim() : '';
    if (!text) return alert("⚠️ أدخل نص الملاحظة!");

    let notes = getData('sys_quick_kitchen_notes') || [];
    if (!notes.includes(text)) {
        notes.push(text);
        setData('sys_quick_kitchen_notes', notes);
        renderKitchenNotesTable();
        renderPosCart();
    }
    if (input) input.value = '';
}

function deleteKitchenNoteItem(idx) {
    let notes = getData('sys_quick_kitchen_notes') || [];
    notes.splice(idx, 1);
    setData('sys_quick_kitchen_notes', notes);
    renderKitchenNotesTable();
    renderPosCart();
}

/* ==========================================
   10. التقارير اليومية والكشوفات المالية
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
    const expenses = getData('sys_expenses');

    const filteredOrders = completed.filter(o => o.dateDate === targetDate);
    const filteredExpenses = expenses.filter(e => e.dateDate === targetDate);

    let totalSales = 0, totalCash = 0, totalVisa = 0, totalDelivery = 0, subtotalFood = 0;
    let totalExpensesAmt = 0;

    filteredOrders.forEach(ord => {
        const orderTotal = cleanPrice(ord.totalAmount || 0);
        totalSales += orderTotal;
        totalDelivery += cleanPrice(ord.deliveryFee || 0);
        subtotalFood += cleanPrice(ord.subtotal || 0);

        if (ord.paymentMethod && ord.paymentMethod.includes("فيزا")) {
            totalVisa += orderTotal;
        } else {
            totalCash += orderTotal;
        }
    });

    filteredExpenses.forEach(exp => {
        totalExpensesAmt += cleanPrice(exp.amount || 0);
    });

    const netCashInHand = Math.max(0, totalCash - totalExpensesAmt);

    if (document.getElementById('reportDateText')) document.getElementById('reportDateText').innerText = "تاريخ الكشف: " + targetDate;
    if (document.getElementById('reportCashierText')) document.getElementById('reportCashierText').innerText = "الكاشير: " + (activeCashierUser ? activeCashierUser.name : "الرئيسي");
    if (document.getElementById('repTotalSales')) document.getElementById('repTotalSales').innerText = totalSales.toLocaleString('ar-IQ');
    if (document.getElementById('repOrdersCount')) document.getElementById('repOrdersCount').innerText = filteredOrders.length;
    if (document.getElementById('repTotalCash')) document.getElementById('repTotalCash').innerText = totalCash.toLocaleString('ar-IQ');
    if (document.getElementById('repTotalVisa')) document.getElementById('repTotalVisa').innerText = totalVisa.toLocaleString('ar-IQ');
    if (document.getElementById('repTotalDelivery')) document.getElementById('repTotalDelivery').innerText = totalDelivery.toLocaleString('ar-IQ');
    if (document.getElementById('repNetFood')) document.getElementById('repNetFood').innerText = subtotalFood.toLocaleString('ar-IQ');

    if (document.getElementById('repTotalExpenses')) document.getElementById('repTotalExpenses').innerText = totalExpensesAmt.toLocaleString('ar-IQ');
    if (document.getElementById('repNetCashBox')) document.getElementById('repNetCashBox').innerText = netCashInHand.toLocaleString('ar-IQ');

    openDriverSettlementModal();
}

function openItemsReportModal() {
    const dateInput = document.getElementById('itemsReportDateInput');
    const today = getTodayString();
    if (dateInput) dateInput.value = today;
    renderItemsReport(today);
    openModal('itemsReportModal');
}

function renderItemsReport(targetDate) {
    const completed = getData('sys_completed_orders');
    const filteredOrders = completed.filter(o => o.dateDate === targetDate);

    let itemsSoldMap = {};
    let totalItemsQtyCount = 0;

    filteredOrders.forEach(ord => {
        if (ord.items && Array.isArray(ord.items)) {
            ord.items.forEach(item => {
                const qty = cleanPrice(item.qty || 0);
                const price = cleanPrice(item.price || 0);
                if (!itemsSoldMap[item.name]) {
                    itemsSoldMap[item.name] = { qty: 0, totalPrice: 0 };
                }
                itemsSoldMap[item.name].qty += qty;
                itemsSoldMap[item.name].totalPrice += (price * qty);
                totalItemsQtyCount += qty;
            });
        }
    });

    if (document.getElementById('itemsReportDateText')) document.getElementById('itemsReportDateText').innerText = "تاريخ جرد الوجبات: " + targetDate;
    if (document.getElementById('repTotalItemsQty')) document.getElementById('repTotalItemsQty').innerText = totalItemsQtyCount.toLocaleString('ar-IQ') + " قطعة";

    const itemsListEl = document.getElementById('repItemsSoldListDetail');
    if (itemsListEl) {
        const itemNames = Object.keys(itemsSoldMap);
        if (itemNames.length === 0) {
            itemsListEl.innerHTML = `<p style="text-align:center; color:#777; padding:15px 0;">لا توجد مبيعات وجبات مسجلة اليوم</p>`;
        } else {
            itemsListEl.innerHTML = itemNames.map(name => `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:6px 0; align-items:center;">
                    <span>● <strong>${name}</strong></span>
                    <div>
                        <span style="background:#333; color:#ffd700; padding:2px 8px; border-radius:4px; font-size:0.8rem; margin-left:6px;">العدد: ${itemsSoldMap[name].qty}</span>
                        <strong style="color:#10b981; font-size:0.85rem;">${itemsSoldMap[name].totalPrice.toLocaleString('ar-IQ')} د.ع</strong>
                    </div>
                </div>
            `).join('');
        }
    }
}

function exportItemsReportPDFAndWhatsApp() {
    const dateInput = document.getElementById('itemsReportDateInput');
    const targetDate = dateInput ? dateInput.value : getTodayString();
    
    const completed = getData('sys_completed_orders');
    const filteredOrders = completed.filter(o => o.dateDate === targetDate);

    let itemsSoldMap = {};
    let totalItemsQtyCount = 0;

    filteredOrders.forEach(ord => {
        if (ord.items && Array.isArray(ord.items)) {
            ord.items.forEach(item => {
                const qty = cleanPrice(item.qty || 0);
                const price = cleanPrice(item.price || 0);
                if (!itemsSoldMap[item.name]) {
                    itemsSoldMap[item.name] = { qty: 0, totalPrice: 0 };
                }
                itemsSoldMap[item.name].qty += qty;
                itemsSoldMap[item.name].totalPrice += (price * qty);
                totalItemsQtyCount += qty;
            });
        }
    });

    const itemNames = Object.keys(itemsSoldMap);
    if (itemNames.length === 0) return alert("لا توجد مبيعات وجبات لتصديرها لهذا اليوم!");

    let waText = `📦 *جرد الوجبات المباعة - MIM89 FAST FOOD* 📦\n`;
    waText += `----------------------------------\n`;
    waText += `📅 *التاريخ:* ${targetDate}\n`;
    waText += `📊 *إجمالي القطع المباعة:* ${totalItemsQtyCount} قطعة\n`;
    waText += `----------------------------------\n`;

    itemNames.forEach(name => {
        waText += `• *${name}:* ${itemsSoldMap[name].qty} قطعة (${itemsSoldMap[name].totalPrice.toLocaleString('ar-IQ')} د.ع)\n`;
    });

    waText += `----------------------------------\n`;
    waText += `تم استخراج هذا التقرير آلياً من نظام الكاشير MIM89.`;

    const myPhone = "9647750008630";
    window.open(`https://api.whatsapp.com/send?phone=${myPhone}&text=${encodeURIComponent(waText)}`, '_blank');
}

function openShiftReportModal() {
    const activeUser = activeCashierUser || JSON.parse(sessionStorage.getItem('active_cashier') || '{"name":"الرئيسي"}');
    const shiftStartTs = Number(sessionStorage.getItem('shift_start_timestamp') || 0);
    const shiftStartStr = sessionStorage.getItem('shift_start_time') || "بداية الشيفت";

    const completed = getData('sys_completed_orders');
    const expenses = getData('sys_expenses');

    const shiftOrders = completed.filter(ord => {
        const orderTs = ord.createdTimestamp || 0;
        return orderTs >= shiftStartTs && (ord.cashierName === activeUser.name || !ord.cashierName);
    });

    const shiftExpenses = expenses.filter(exp => {
        const expTs = exp.createdTimestamp || 0;
        return expTs >= shiftStartTs;
    });

    let totalCash = 0, totalVisa = 0, grandTotal = 0, totalExpAmt = 0;

    shiftOrders.forEach(ord => {
        const amt = cleanPrice(ord.totalAmount || 0);
        grandTotal += amt;
        if (ord.paymentMethod && ord.paymentMethod.includes("فيزا")) {
            totalVisa += amt;
        } else {
            totalCash += amt;
        }
    });

    shiftExpenses.forEach(e => {
        totalExpAmt += cleanPrice(e.amount || 0);
    });

    const netCashInDrawer = Math.max(0, totalCash - totalExpAmt);

    if (document.getElementById('shiftCashierName')) document.getElementById('shiftCashierName').innerText = activeUser.name;
    if (document.getElementById('shiftStartTime')) document.getElementById('shiftStartTime').innerText = shiftStartStr;
    if (document.getElementById('shiftTotalCash')) document.getElementById('shiftTotalCash').innerText = totalCash.toLocaleString('ar-IQ');
    if (document.getElementById('shiftTotalExpenses')) document.getElementById('shiftTotalExpenses').innerText = totalExpAmt.toLocaleString('ar-IQ');
    if (document.getElementById('shiftNetDrawerCash')) document.getElementById('shiftNetDrawerCash').innerText = netCashInDrawer.toLocaleString('ar-IQ');
    if (document.getElementById('shiftTotalVisa')) document.getElementById('shiftTotalVisa').innerText = totalVisa.toLocaleString('ar-IQ');
    if (document.getElementById('shiftOrdersCount')) document.getElementById('shiftOrdersCount').innerText = shiftOrders.length;
    if (document.getElementById('shiftGrandTotal')) document.getElementById('shiftGrandTotal').innerText = grandTotal.toLocaleString('ar-IQ');

    openModal('shiftReportModal');
}

function confirmCloseShiftAndLogout() {
    if (confirm("هل أنت متأكد من تقفيل الشيفت وتصفير الصندوق وتسليمه للكاشير القادم؟")) {
        sessionStorage.removeItem('active_cashier');
        sessionStorage.removeItem('shift_start_time');
        sessionStorage.removeItem('shift_start_timestamp');
        location.reload();
    }
}

/* ==========================================
   11. الطباعة الحرارية للفواتير والمطبخ (مستقلة)
   ========================================== */

function printCustomerInvoiceOnly(event, customOrder) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const order = customOrder || window.activePendingPrintOrder;
    if (!order) return alert('⚠️ لا توجد بيانات للطباعة!');

    let itemsHtml = '';
    order.items.forEach(i => {
        const itemTotal = cleanPrice(i.price) * cleanPrice(i.qty);
        let notesText = (i.itemNotes && i.itemNotes.length > 0) ? `<br><small style="color:#000; font-weight:bold;">★ ملاحظة: ${i.itemNotes.join(' - ')}</small>` : '';
        itemsHtml += `
            <div style="font-size:13px; font-weight:bold; margin:3px 0; border-bottom:1px solid #000; padding-bottom:2px; color:#000;">
                <div style="display:flex; justify-content:space-between;">
                    <span>${i.name} (x${i.qty})</span>
                    <span>${itemTotal.toLocaleString('ar-IQ')} د.ع</span>
                </div>
                ${notesText}
            </div>`;
    });

    const printBox = document.getElementById('mim89ThermalPrintBox') || createThermalPrintContainer();
    printBox.innerHTML = `
        <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000;">
            <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px;">
                <h2 style="font-size:18px; margin:0; font-weight:900; color:#000;">MIM89 FAST FOOD</h2>
                <div style="font-size:10px; font-weight:bold; color:#000;">بغداد - القاهرة | فاتورة كاشير</div>
            </div>
            <div style="text-align:center; margin:4px 0; border:1px solid #000; padding:2px; background:#fff;">
                <div style="font-size:10px; font-weight:bold; color:#000;">رقم الطلب</div>
                <div style="font-size:28px; font-weight:900; color:#000;">#${order.orderNum}</div>
            </div>
            <div style="font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px; color:#000;">
                <div>التاريخ: ${order.dateDate} - ${order.timestamp}</div>
                <div>اسم الزبون: ${order.customerName}</div>
                <div>نوع الخدمة: ${order.area} | الدفع: ${order.paymentMethod}</div>
                ${order.notes ? `<div style="font-size:12px; font-weight:900; margin-top:2px;">ملاحظة عامة: ${order.notes}</div>` : ''}
            </div>
            <div style="border-bottom:1px dashed #000; padding:2px 0; margin-bottom:4px;">${itemsHtml}</div>
            <div style="font-size:12px; margin-top:4px;">
                <div style="display:flex; justify-content:space-between;"><span>المجموع الفرعي:</span> <span>${cleanPrice(order.subtotal || 0).toLocaleString('ar-IQ')} د.ع</span></div>
                ${order.discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>الخصم:</span> <span>- ${cleanPrice(order.discount).toLocaleString('ar-IQ')} د.ع</span></div>` : ''}
                <div style="font-size:14px; font-weight:900; display:flex; justify-content:space-between; border-top:1px solid #000; padding-top:4px; margin-top:2px;">
                    <span>المجموع الكلي:</span> <span>${cleanPrice(order.totalAmount || 0).toLocaleString('ar-IQ')} د.ع</span>
                </div>
            </div>
            <div style="text-align:center; margin-top:6px; font-size:10px; font-weight:bold;">شكراً لزيارتكم MIM89</div>
        </div>`;
    setTimeout(() => { window.print(); }, 150);
}

function printKitchenTicketOnly(event, customOrder) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const order = customOrder || window.activePendingPrintOrder;
    if (!order) return alert('⚠️ لا توجد بيانات للطباعة!');

    let itemsKitchenHtml = '';
    order.items.forEach(i => {
        let itemNotesStr = (i.itemNotes && i.itemNotes.length > 0) ? `<br><span style="font-size:14px; color:#000; font-weight:900;">⚠️ [${i.itemNotes.join(' ، ')}]</span>` : '';
        itemsKitchenHtml += `
            <div style="font-size:16px; font-weight:900; margin:6px 0; border-bottom:1px dashed #000; padding-bottom:4px; color:#000;">
                <div style="display:flex; justify-content:space-between;">
                    <span>- ${i.name}</span>
                    <span>[x${i.qty}]</span>
                </div>
                ${itemNotesStr}
            </div>`;
    });

    const printBox = document.getElementById('mim89ThermalPrintBox') || createThermalPrintContainer();
    printBox.innerHTML = `
        <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:6px;">
                <h2 style="font-size:22px; margin:0; font-weight:900; color:#000;">*** أمر تجهيز مطبخ ***</h2>
                <div style="font-size:12px; font-weight:bold;">الوقت: ${order.timestamp}</div>
            </div>
            <div style="text-align:center; margin:6px 0; border:2px solid #000; padding:4px;">
                <div style="font-size:12px; font-weight:bold;">رقم الطلب</div>
                <div style="font-size:38px; font-weight:900;">#${order.orderNum}</div>
            </div>
            <div style="font-size:13px; font-weight:bold; margin-bottom:8px; border-bottom:2px solid #000; padding-bottom:6px;">
                <div>الخدمة: ${order.area}</div>
                <div>الزبون: ${order.customerName}</div>
                ${order.notes ? `<div style="font-size:14px; font-weight:900; margin-top:4px;">⚠️ ملاحظة عامة: ${order.notes}</div>` : ''}
            </div>
            <div style="padding:4px 0;">${itemsKitchenHtml}</div>
        </div>`;
    setTimeout(() => { window.print(); }, 150);
}

function createThermalPrintContainer() {
    let box = document.getElementById('mim89ThermalPrintBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'mim89ThermalPrintBox';
        document.body.appendChild(box);
    }
    return box;
}

/* ==========================================
   12. التنبيهات الصوتية ومراقبة الطلبات الواردة
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
        alert("🔔 تم تفعيل جرس التنبيهات بنجاح على الجهاز!");
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

    const customers = getData('sys_customers') || [];
    const foundCust = customers.find(c => c.phone.includes(cleanPhone) || cleanPhone.includes(c.phone));
    if (foundCust) return { customerName: foundCust.name, area: foundCust.area, address: foundCust.address };

    const completed = getData('sys_completed_orders') || [];
    return completed.find(o => {
        if (!o.phone) return false;
        const oPhone = String(o.phone).replace(/[^0-9]/g, '');
        return oPhone && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone)) && o.customerName && o.customerName !== 'زبون مباشر';
    }) || null;
}

function listenForIncomingOrders() {
    const container = document.getElementById('liveOrdersContainer');

    const processOrdersList = (ordersList) => {
        let unhandledCount = 0;
        let html = '';
        let lastIncomingCall = null;

        ordersList.forEach(ord => {
            const isUnhandled = !ord.status || ord.status === 'جديد' || ord.status === 'new' || ord.status === 'pending' || ord.status === '';
            
            if (isUnhandled) {
                unhandledCount++;
                const orderKey = ord.docId || ord.id || ('temp_' + Math.random());
                if (!knownOrderIds.has(orderKey)) {
                    knownOrderIds.add(orderKey);
                }
                html += generateOrderCardHTML(ord, orderKey);
                lastIncomingCall = ord;
            }
        });

        if (container) {
            container.innerHTML = html || '<p style="color:#aaa; text-align:center; padding:20px; font-size:0.85rem;">لا توجد طلبات أو مكالمات جارية حالياً</p>';
        }
        
        const badge = document.getElementById('liveOrdersBadge');
        const alertBanner = document.getElementById('pendingOrdersAlertBanner');

        if (unhandledCount > 0) {
            if (badge) { 
                badge.innerText = unhandledCount; 
                badge.style.display = 'inline-block'; 
            }
            
            if (alertBanner && lastIncomingCall) {
                const phone = String(lastIncomingCall.phone || 'رقم غير معروف');
                const name = String(lastIncomingCall.customerName || 'مكالمة واردة');
                const docId = String(lastIncomingCall.docId || lastIncomingCall.id || '');
                const safeName = name.replace(/'/g, "\\'");

                alertBanner.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 10px;">
                        <span>📞 <strong>مكالمة واردة جديدة:</strong> ${name} (${phone})</span>
                        <button class="gold-btn btn-sm" style="background:#000; color:#fff; font-size:0.75rem;" 
                                onclick="loadIncomingCallToPos('${docId}', '${lastIncomingCall.id || ''}', '${phone}', '${safeName}', '', '')">
                            📥 نقل لكاشير المبيعات
                        </button>
                    </div>
                `;
                alertBanner.style.display = 'block';
            }
            startContinuousAlert();
        } else {
            if (badge) badge.style.display = 'none';
            if (alertBanner) alertBanner.style.display = 'none';
            stopContinuousAlert();
        }
    };

    if (db) {
        db.collection("orders").onSnapshot(snapshot => {
            let list = [];
            snapshot.forEach(doc => {
                list.push({ ...doc.data(), docId: doc.id, id: doc.data().id || doc.id });
            });
            processOrdersList(list);
        }, err => {
            processOrdersList(getData('sys_live_orders'));
        });
    } else {
        setInterval(() => processOrdersList(getData('sys_live_orders')), 2000);
    }
}

function loadIncomingCallToPos(docId, orderId, phone, name, area, address, itemsEncodedStr) {
    const btnDirect = document.querySelector(".pos-sidebar .toggle-btn");
    switchCashierTab('tabPosDirect', btnDirect);

    const infoText = `${name} | هاتف: ${phone} ${area ? '| ' + area : ''} ${address ? '- ' + address : ''}`;
    const custInput = document.getElementById('posCustName');
    if (custInput) custInput.value = infoText;

    posCart = [];
    if (itemsEncodedStr && itemsEncodedStr !== '') {
        try {
            const decodedItems = JSON.parse(decodeURIComponent(itemsEncodedStr));
            if (Array.isArray(decodedItems)) {
                decodedItems.forEach(i => {
                    posCart.push({
                        id: i.id || Date.now() + Math.random(),
                        name: i.name,
                        price: cleanPrice(i.price),
                        qty: cleanPrice(i.qty) || 1,
                        itemNotes: i.customNotes ? [i.customNotes] : (i.itemNotes || [])
                    });
                });
            }
        } catch (e) {
            console.error("Error decoding items for pos:", e);
        }
    }
    
    renderPosCart();

    if (db && docId && !docId.startsWith('temp_')) {
        db.collection("orders").doc(docId).update({ status: 'مقبول وكاشير' })
          .catch(err => console.error("Cloud update error:", err));
    }

    let liveOrders = getData('sys_live_orders') || [];
    liveOrders = liveOrders.filter(o => String(o.docId || o.id) !== String(docId) && String(o.id) !== String(orderId));
    setData('sys_live_orders', liveOrders);

    const cardEl = document.getElementById(`order_card_${docId}`) || document.getElementById(`order_card_${orderId}`);
    if (cardEl) cardEl.remove();

    if (phone && phone !== 'بدون رقم') {
        saveCustomerRecord(name, phone, area, address);
    }

    alert(`✅ تم نقل طلب الزبون (${name}) وجميع وجباته إلى الكاشير بنجاح!`);
}

function generateOrderCardHTML(ord, docId) {
    const itemsList = Array.isArray(ord.items) ? ord.items : [];
    const total = (ord.totalAmount !== undefined && ord.totalAmount !== null) ? cleanPrice(ord.totalAmount).toLocaleString('ar-IQ') : '0';

    const rawPhone = String(ord.phone || ord.number || ord.caller || ord.from || 'بدون رقم');
    const rawName = String(ord.customerName || ord.name || ord.caller_name || 'مكالمة واردة');
    const pastCustomer = getCustomerHistoryByPhone(rawPhone);

    const displayName = (rawName && rawName !== 'مكالمة' && rawName !== 'مكالمة واردة')
        ? rawName 
        : (pastCustomer && pastCustomer.customerName ? pastCustomer.customerName : 'زبون جديد (غير مسجل)');

    const displayArea = ord.area || (pastCustomer && pastCustomer.area) || '';
    const displayAddress = ord.address || (pastCustomer && pastCustomer.address) || '';

    const safeDocId = String(docId || '');
    const safeOrderId = String(ord.id || docId || '');
    const safePhone = String(rawPhone || '');
    const safeName = String(displayName || '').replace(/'/g, "\\'");
    const safeArea = String(displayArea || '').replace(/'/g, "\\'");
    const safeAddress = String(displayAddress || '').replace(/'/g, "\\'");
    
    const encodedItems = encodeURIComponent(JSON.stringify(itemsList));

    const isWebMenuOrder = itemsList.length > 0;
    const sourceBadge = isWebMenuOrder 
        ? `<span style="background:#10b981; color:#fff; font-size:0.7rem; font-weight:bold; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">🌐 طلب مباشر من المينيو الإلكتروني</span>`
        : `<span style="background:#f59e0b; color:#000; font-size:0.7rem; font-weight:bold; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">📞 مكالمة هاتفية واردة</span>`;

    return `
        <div id="order_card_${safeDocId}" style="background:#222228; border:1px solid ${isWebMenuOrder ? '#10b981' : 'var(--gold-primary, #ffd700)'}; padding:10px; margin-bottom:8px; border-radius:8px; width:100%;">
            ${sourceBadge}
            <div style="display:flex; justify-content:space-between; color:var(--gold-primary, #ffd700); font-size:0.85rem;">
                <strong>👤 ${displayName} (${rawPhone})</strong>
                <span>${ord.orderType === 'delivery' ? '🚗 توصيل' : (ord.orderType === 'سفري' ? '🛍️ سفري' : '🍽️ صالة')}</span>
            </div>
            ${pastCustomer ? '<span style="background:#ffd700; color:#000; font-size:0.7rem; font-weight:bold; padding:1px 6px; border-radius:4px; margin-top:2px; display:inline-block;">⭐ زبون مسجل سابقاً</span>' : '<span style="background:#444; color:#fff; font-size:0.7rem; padding:1px 6px; border-radius:4px; margin-top:2px; display:inline-block;">🆕 متصل جديد</span>'}
            <p style="font-size:0.8rem; color:#ccc; margin-top:4px;">${displayArea ? 'المنطقة: ' + displayArea : ''} ${displayAddress ? '- ' + displayAddress : ''}</p>
            <hr style="border-color:#333; margin:6px 0;">
            <ul style="padding-right:12px; font-size:0.8rem; color:#fff;">
                ${itemsList.length > 0 
                    ? itemsList.map(i => `<li>${i.name} × ${i.qty} ${i.customNotes ? ' <small style="color:var(--gold-bright);">('+i.customNotes+')</small>' : ''}</li>`).join('') 
                    : '<li style="color:#aaa;">(مكالمة هاتفية - اختر الوجبات يدوياً في الكاشير)</li>'}
            </ul>
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#ffd700; font-size:0.85rem;">المجموع الكلي: ${total} د.ع</strong>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="gold-btn" style="padding:4px 6px; font-size:0.7rem; background:#10b981; color:#fff; border:none; flex:1; font-weight:bold;" onclick="loadIncomingCallToPos('${safeDocId}', '${safeOrderId}', '${safePhone}', '${safeName}', '${safeArea}', '${safeAddress}', '${encodedItems}')">📥 نقل لكاشير المبيعات</button>
                    <button class="gold-btn" style="padding:4px 6px; font-size:0.7rem; background:#ff4d4d; color:#fff; flex:1;" onclick="cancelIncomingOrder('${safeDocId}', '${safeOrderId}')">❌ إلغاء وحذف</button>
                </div>
            </div>
        </div>
    `;
}

function cancelIncomingOrder(docId, orderId) {
    if (confirm("هل أنت متأكد من إلغاء وحذف هذا الطلب؟")) {
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

/* ==========================================
   13. محاسبة التوصيل والدليفري والتطبيقات
   ========================================== */

function getDriverDailySettlementReport(driverName) {
    const today = getTodayString();
    const completed = getData('sys_completed_orders') || [];
    
    const driverOrders = completed.filter(o => o.dateDate === today && o.driverName === driverName);

    let totalAmountCollected = 0;
    let totalDeliveryFees = 0;
    let ordersCount = driverOrders.length;

    driverOrders.forEach(ord => {
        totalAmountCollected += cleanPrice(ord.totalAmount || 0);
        totalDeliveryFees += cleanPrice(ord.deliveryFee || 0);
    });

    const netToPayToRestaurant = totalAmountCollected - totalDeliveryFees;

    return {
        driverName: driverName,
        ordersCount: ordersCount,
        totalAmountCollected: totalAmountCollected,
        totalDeliveryFees: totalDeliveryFees,
        netToPayToRestaurant: netToPayToRestaurant
    };
}

function openDriverSettlementModal() {
    const drivers = getData('sys_drivers') || [];
    const completed = getData('sys_completed_orders') || [];

    let html = `
        <div style="background:#121215; padding:10px; border-radius:8px; margin-bottom:10px;">
            <h4 style="color:var(--gold-primary); margin-bottom:8px;">🛵 تصفية حساب سائقي المطعم المباشرين (يومي / فوري)</h4>
    `;

    drivers.forEach(drv => {
        const rep = getDriverDailySettlementReport(drv.name);
        html += `
            <div style="background:#222228; border:1px solid #444; padding:8px; border-radius:6px; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff;">👤 ${drv.name}</strong>
                    <span style="background:#333; color:#ffd700; padding:1px 6px; border-radius:4px; font-size:0.75rem;">${rep.ordersCount} طلبات اليوم</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#aaa; margin-top:4px;">
                    <span>المقبوضات: ${rep.totalAmountCollected.toLocaleString('ar-IQ')} د.ع</span>
                    <span>أجور التوصيل: ${rep.totalDeliveryFees.toLocaleString('ar-IQ')} د.ع</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; border-top:1px dashed #444; padding-top:4px;">
                    <strong style="color:#10b981; font-size:0.85rem;">الصافي المطلوب تسليمه للصندوق: ${rep.netToPayToRestaurant.toLocaleString('ar-IQ')} د.ع</strong>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    let talabateyTotal = 0, totersTotal = 0, baleTotal = 0;
    completed.forEach(ord => {
        const dName = String(ord.driverName || '').toLowerCase();
        const amt = cleanPrice(ord.totalAmount || 0);

        if (dName.includes("طلباتي")) talabateyTotal += amt;
        else if (dName.includes("توترز")) totersTotal += amt;
        else if (dName.includes("بلي")) baleTotal += amt;
    });

    html += `
        <div style="background:#121215; padding:10px; border-radius:8px; border:1px solid #38bdf8;">
            <h4 style="color:#38bdf8; margin-bottom:8px;">📱 تراكم مستحقات الشركات (تصفية شهرية)</h4>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>📱 تطبيق طلباتي:</span> <strong style="color:#38bdf8;">${talabateyTotal.toLocaleString('ar-IQ')} د.ع</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>📱 تطبيق توترز:</span> <strong style="color:#a855f7;">${totersTotal.toLocaleString('ar-IQ')} د.ع</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                <span>📱 تطبيق بلي:</span> <strong style="color:#10b981;">${baleTotal.toLocaleString('ar-IQ')} د.ع</strong>
            </div>
        </div>
    `;

    const repContainer = document.getElementById('repDriversList');
    if (repContainer) repContainer.innerHTML = html;
}

/* ==========================================
   14. لوحة جرد المخزن (inventory.html)
   ========================================== */

function deductInventoryFromRecipe(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    let inventory = getData('sys_inventory');
    const allMenuItems = getData('sys_items');

    items.forEach(cartItem => {
        const menuItem = allMenuItems.find(m => cleanPrice(m.id) === cleanPrice(cartItem.id));
        if (menuItem && menuItem.recipe) {
            menuItem.recipe.forEach(ingredient => {
                const stockItem = inventory.find(inv => cleanPrice(inv.id) === cleanPrice(ingredient.invId));
                if (stockItem) {
                    const totalDeduct = (cleanPrice(ingredient.qty) || 0) * (cleanPrice(cartItem.qty) || 1);
                    stockItem.quantity = Math.max(0, cleanPrice(stockItem.quantity) - totalDeduct);
                }
            });
        }
    });

    setData('sys_inventory', inventory);
}

function initInventoryPage() { initData(); }

function loginInventory() {
    const pass = document.getElementById('invPassInput')?.value.trim();
    const validInvPass = getSystemPassword('inventory');
    const validAdminPass = getSystemPassword('admin');

    if (pass === validInvPass || pass === validAdminPass || pass === 'inv123' || pass === '123') {
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

    if (inv.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888; padding:20px;">لا توجد مواد في المخزن، قم بإضافة مواد جديدة أعلاه.</td></tr>`;
        return;
    }

    tbody.innerHTML = inv.map((item, index) => {
        const costPerUnit = (item.totalPrice && item.quantity && cleanPrice(item.quantity) > 0) 
            ? (cleanPrice(item.totalPrice) / cleanPrice(item.quantity)) 
            : (cleanPrice(item.costPerUnit) || 0);

        return `
            <tr>
                <td>${index + 1}</td>
                <td><input type="text" value="${item.name || ''}" onchange="updateInvField(${item.id}, 'name', this.value)" class="gold-input-inline"></td>
                <td><input type="number" value="${item.quantity || 0}" placeholder="الكمية" onchange="updateInvField(${item.id}, 'quantity', this.value)" class="gold-input-inline"></td>
                <td><input type="text" value="${item.unit || 'كغم'}" placeholder="كغم/قطعة" onchange="updateInvField(${item.id}, 'unit', this.value)" class="gold-input-inline"></td>
                <td><input type="number" value="${item.totalPrice || 0}" placeholder="إجمالي الشراء" onchange="updateInvField(${item.id}, 'totalPrice', this.value)" class="gold-input-inline"></td>
                <td style="color:var(--gold-bright, #ffd700); font-weight:bold;">${cleanPrice(costPerUnit.toFixed(0)).toLocaleString('ar-IQ')} د.ع / ${item.unit || 'وحدة'}</td>
                <td><button onclick="deleteInvItem(${item.id})" class="gold-btn btn-danger btn-sm" style="padding:2px 6px; font-size:0.75rem;">حذف</button></td>
            </tr>
        `;
    }).join('');
}

function addNewInventoryItem() {
    const name = document.getElementById('newInvName')?.value.trim();
    const qty = cleanPrice(document.getElementById('newInvQty')?.value);
    const unit = document.getElementById('newInvUnit')?.value.trim() || 'كغم';
    const totalPrice = cleanPrice(document.getElementById('newInvPrice')?.value) || 0;

    if (!name || !qty) return alert("يرجى إدخال اسم المادة والكمية الكلية على الأقل!");

    const inv = getData('sys_inventory');
    const costPerUnit = qty > 0 ? (totalPrice / qty) : 0;

    const newItem = {
        id: Date.now(),
        name: name,
        quantity: qty,
        unit: unit,
        totalPrice: totalPrice,
        costPerUnit: costPerUnit
    };

    inv.push(newItem);
    setData('sys_inventory', inv);

    if (document.getElementById('newInvName')) document.getElementById('newInvName').value = '';
    if (document.getElementById('newInvQty')) document.getElementById('newInvQty').value = '';
    if (document.getElementById('newInvUnit')) document.getElementById('newInvUnit').value = '';
    if (document.getElementById('newInvPrice')) document.getElementById('newInvPrice').value = '';

    renderInventoryTable();
}

function updateInvField(id, field, value) {
    let inv = getData('sys_inventory');
    let item = inv.find(i => cleanPrice(i.id) === cleanPrice(id));

    if (item) {
        if (field === 'quantity' || field === 'totalPrice') {
            item[field] = cleanPrice(value);
        } else {
            item[field] = value;
        }

        if (item.totalPrice && item.quantity && cleanPrice(item.quantity) > 0) {
            item.costPerUnit = cleanPrice(item.totalPrice) / cleanPrice(item.quantity);
        } else if (cleanPrice(item.quantity) === 0) {
            item.costPerUnit = 0;
        }

        setData('sys_inventory', inv);
        renderInventoryTable();
    }
}

function deleteInvItem(id) {
    if (confirm("حذف هذه المادة من الجرد والمخزن؟")) {
        let inv = getData('sys_inventory').filter(i => cleanPrice(i.id) !== cleanPrice(id));
        setData('sys_inventory', inv);
        renderInventoryTable();
    }
}

/* ==========================================
   15. لوحة تحكم الإدارة الكاملة Admin (admin.html)
   ========================================== */

function initAdminPage() { initData(); }

function loginAdmin() {
    const pass = document.getElementById('adminPassInput')?.value.trim();
    const validAdminPass = getSystemPassword('admin');

    if (pass === validAdminPass || pass === "admin123" || pass === "123") {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMainApp').style.display = 'block';
        loadAdminTabsData();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function switchAdminTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';
    if (btn) btn.classList.add('active');
}

function loadAdminTabsData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminDrivers();
    renderAdminCashiers();
    renderAdminAreas();
    renderAdminCustomers();
    loadPrinterSettings();
}

function loadPrinterSettings() {
    const settings = getData('sys_printer_settings');
    if (!settings) return;
    
    if (document.getElementById('enableIpPrinting')) document.getElementById('enableIpPrinting').checked = !!settings.enableIpPrinting;
    if (document.getElementById('cashierPrinterIp')) document.getElementById('cashierPrinterIp').value = settings.cashierIp || '192.168.0.218';
    if (document.getElementById('kitchenPrinter1Ip')) document.getElementById('kitchenPrinter1Ip').value = settings.kitchen1Ip || '192.168.0.200';
    if (document.getElementById('kitchenPrinter2Ip')) document.getElementById('kitchenPrinter2Ip').value = settings.kitchen2Ip || '';
    if (document.getElementById('printerPort')) document.getElementById('printerPort').value = settings.port || '9100';
}

function savePrinterSettings() {
    const enableIpPrinting = document.getElementById('enableIpPrinting').checked;
    const cashierIp = document.getElementById('cashierPrinterIp').value.trim();
    const kitchen1Ip = document.getElementById('kitchenPrinter1Ip').value.trim();
    const kitchen2Ip = document.getElementById('kitchenPrinter2Ip').value.trim();
    const port = document.getElementById('printerPort').value.trim() || '9100';

    const settings = { enableIpPrinting, cashierIp, kitchen1Ip, kitchen2Ip, port };
    setData('sys_printer_settings', settings);
    alert("تم حفظ إعدادات جميع الطابعات بنجاح!");
}

function renderAdminAreas() {
    const areas = getData('sys_areas');
    const tbody = document.getElementById('adminAreasTable');
    if (!tbody) return;
    tbody.innerHTML = areas.map((a, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${a.name}</strong></td>
            <td>${cleanPrice(a.price) === 0 ? 'مجاني 🎉' : cleanPrice(a.price).toLocaleString('ar-IQ') + ' د.ع'}</td>
            <td><button class="gold-btn btn-danger btn-sm" onclick="deleteArea('${a.name}')">حذف</button></td>
        </tr>
    `).join('');
}

function saveDeliveryArea() {
    const name = document.getElementById('areaNameInput').value.trim();
    const price = cleanPrice(document.getElementById('areaPriceInput').value);
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

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const scaleFactor = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleFactor;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            const preview = document.getElementById('imgPreview');
            if (preview) preview.src = compressedBase64;
            const urlInput = document.getElementById('itemImage');
            if (urlInput) urlInput.value = compressedBase64;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function triggerInlineImageUpload(itemId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                updateItemInline(itemId, 'image', evt.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function updateItemInline(id, field, value) {
    let items = getData('sys_items');
    let item = items.find(i => cleanPrice(i.id) === cleanPrice(id));

    if (item) {
        if (field === 'price') {
            item.price = cleanPrice(value) || 0;
        } else {
            item[field] = value.trim();
        }

        setData('sys_items', items);

        if (typeof db !== 'undefined' && db) {
            db.collection("menu_items").doc(String(id)).update({
                [field]: item[field]
            }).then(() => console.log(`تم تحديث ${field} فوراً في السحابة`))
              .catch(err => console.error("Cloud inline update error:", err));
        }

        refreshActiveUI();
    }
}

function renderAdminItems() {
    const items = getData('sys_items');
    const categories = getData('sys_categories');
    const tbody = document.getElementById('adminItemsTable');
    const select = document.getElementById('itemCategory');

    if (select) select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const cat = categories.find(c => cleanPrice(c.id) === cleanPrice(item.categoryId));
        return `
            <tr>
                <td style="text-align:center;">
                    <img src="${item.image || item.img}" width="45" height="45" style="object-fit:cover; border-radius:6px; cursor:pointer;" onclick="triggerInlineImageUpload(${item.id})" title="اضغط لتغيير الصورة مباشرة">
                </td>
                <td>
                    <input type="text" value="${item.name}" class="gold-input-inline" onchange="updateItemInline(${item.id}, 'name', this.value)" style="font-weight:bold;">
                </td>
                <td><span style="font-size:0.8rem; color:#aaa;">${cat ? cat.name : '-'}</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <input type="number" value="${cleanPrice(item.price)}" class="gold-input-inline" onchange="updateItemInline(${item.id}, 'price', this.value)" style="color:#ffd700; font-weight:bold; width:100px;">
                        <small style="color:#aaa;">د.ع</small>
                    </div>
                </td>
                <td>
                    <button onclick="editItem(${item.id})" class="gold-btn btn-sm" style="padding:4px 8px; font-size:0.75rem;">تعديل كامل</button>
                    <button onclick="deleteItem(${item.id})" class="gold-btn btn-danger btn-sm" style="padding:4px 8px; font-size:0.75rem;">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveItem() {
    const editId = document.getElementById('editItemId')?.value;
    const id = editId ? String(editId) : String(Date.now());
    const name = document.getElementById('itemName')?.value.trim();
    const price = cleanPrice(document.getElementById('itemPrice')?.value);
    const categoryId = String(document.getElementById('itemCategory')?.value || '1');
    const image = document.getElementById('itemImage')?.value || currentUploadedBase64 || 'https://via.placeholder.com/150';
    const ingredients = document.getElementById('itemIngredients')?.value.trim() || '';

    if (!name || !price) return alert("⚠️ يرجى إدخال اسم الصنف والسعر!");

    let items = getData('sys_items') || [];
    let existingItem = items.find(i => String(i.id) === String(id));

    const itemData = { 
        id: id, 
        name: name, 
        price: price, 
        categoryId: categoryId, 
        image: image, 
        ingredients: ingredients,
        recipe: (existingItem && existingItem.recipe) ? existingItem.recipe : []
    };

    const index = items.findIndex(i => String(i.id) === String(id));
    if (index !== -1) items[index] = itemData;
    else items.push(itemData);

    try {
        setData('sys_items', items);
    } catch (e) {
        return alert("⚠️ حجم الصورة كبير جداً، اختر صورة أصغر أو استخدم رابط خارجي!");
    }

    if (typeof db !== 'undefined' && db) {
        db.collection("menu_items").doc(String(id)).set(itemData, { merge: true })
            .then(() => console.log("✅ تم التحديث في السحابة"))
            .catch(err => console.error("❌ خطأ سحابي:", err));
    }

    resetItemForm();
    renderAdminItems();
    refreshActiveUI();
    alert("✅ تم حفظ وتعديل الصنف بنجاح في الأدمن والكاشير!");
}

function editItem(id) {
    const item = getData('sys_items').find(i => cleanPrice(i.id) === cleanPrice(id));
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = cleanPrice(item.price);
    document.getElementById('itemCategory').value = item.categoryId;
    document.getElementById('itemIngredients').value = item.ingredients || item.desc || '';

    const itemImg = item.image || item.img || '';

    if (itemImg && itemImg.startsWith('data:image')) {
        currentUploadedBase64 = itemImg;
        if (document.getElementById('itemImage')) document.getElementById('itemImage').value = '';
    } else {
        currentUploadedBase64 = '';
        if (document.getElementById('itemImage')) document.getElementById('itemImage').value = itemImg;
    }

    const preview = document.getElementById('imgPreview');
    if (preview) preview.src = itemImg || 'https://via.placeholder.com/150';
    
    document.getElementById('itemFormTitle').innerText = "تعديل: " + item.name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetItemForm() {
    if (document.getElementById('editItemId')) document.getElementById('editItemId').value = '';
    if (document.getElementById('itemName')) document.getElementById('itemName').value = '';
    if (document.getElementById('itemPrice')) document.getElementById('itemPrice').value = '';
    if (document.getElementById('itemImage')) document.getElementById('itemImage').value = '';
    if (document.getElementById('itemIngredients')) document.getElementById('itemIngredients').value = '';
    
    const fileInput = document.getElementById('itemImgFile');
    if (fileInput) fileInput.value = '';
    currentUploadedBase64 = '';
    
    const preview = document.getElementById('imgPreview');
    if (preview) preview.src = 'https://via.placeholder.com/150?text=معاينة+الصورة';
    
    if (document.getElementById('itemFormTitle')) document.getElementById('itemFormTitle').innerText = "إضافة / تعديل صنف للمينيو";
}

function deleteItem(id) {
    if (confirm("هل أنت متأكد من حذف هذا الصنف نهائياً من المينيو والكاشير؟")) {
        let items = getData('sys_items').filter(i => cleanPrice(i.id) !== cleanPrice(id));
        setData('sys_items', items);
        
        if (db) {
            db.collection("menu_items").doc(String(id)).delete();
        }
        renderAdminItems();
        refreshActiveUI();
    }
}

function renderAdminCategories() {}

function saveDeliveryDriver() {
    const name = document.getElementById('driverNameInput').value.trim();
    const phone = document.getElementById('driverPhoneInput').value.trim();

    if (!name) return alert("يرجى إدخال اسم السائق");

    let drivers = getData('sys_drivers');
    drivers.push({ id: 'drv_' + Date.now(), name, phone });
    setData('sys_drivers', drivers);

    document.getElementById('driverNameInput').value = '';
    document.getElementById('driverPhoneInput').value = '';
    renderAdminDrivers();
}

function renderAdminDrivers() {
    const drivers = getData('sys_drivers');
    const tbody = document.getElementById('adminDriversTable');
    if (!tbody) return;

    if (drivers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888;">لا يوجد سائقون مسجلون حالياً</td></tr>`;
        return;
    }

    tbody.innerHTML = drivers.map((d, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>🛵 ${d.name}</strong></td>
            <td>${d.phone || '-'}</td>
            <td><button onclick="deleteDriver('${d.id}')" class="gold-btn btn-danger btn-sm">حذف</button></td>
        </tr>
    `).join('');
}

function deleteDriver(id) {
    if (confirm("حذف هذا السائق؟")) {
        let drivers = getData('sys_drivers').filter(d => String(d.id) !== String(id));
        setData('sys_drivers', drivers);
        renderAdminDrivers();
    }
}

function renderAdminCashiers() {
    const cashiers = getData('sys_cashiers');
    const tbody = document.getElementById('adminCashiersTable');
    if (!tbody) return;

    tbody.innerHTML = cashiers.map((c, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${c.name}</td>
            <td>${c.password}</td>
            <td><button onclick="deleteCashier('${c.id}')" class="gold-btn btn-danger btn-sm">حذف</button></td>
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
        let cashiers = getData('sys_cashiers').filter(c => String(c.id) !== String(id));
        setData('sys_cashiers', cashiers);
        renderAdminCashiers();
    }
}

function updateAllSystemPasswords() {
    const adminPass = document.getElementById('newAdminPass').value.trim();
    const costingPass = document.getElementById('newCostingPass').value.trim();
    const invPass = document.getElementById('newInvPass').value.trim();
    const cashierPass = document.getElementById('newCashierPass').value.trim();

    let passes = getData('sys_passwords') || {};

    if (adminPass) passes.admin = adminPass;
    if (costingPass) passes.costing = costingPass;
    if (invPass) passes.inventory = invPass;
    if (cashierPass) passes.cashier = cashierPass;

    setData('sys_passwords', passes);
    alert("🔒 تم تحديث وتأمين كلمات المرور لكل أقسام النظام بنجاح!");
}

/* ==========================================
   16. التصدير والاسترجاع التلقائي للنسخ الاحتياطية
   ========================================== */

function exportFullSystemBackup() {
    try {
        const fullBackup = {
            version: "v21.3-MIM89",
            backupDate: new Date().toLocaleString('ar-IQ'),
            timestamp: Date.now(),
            categories: getData('sys_categories'),
            items: getData('sys_items'),
            inventory: getData('sys_inventory'),
            customers: getData('sys_customers'),
            drivers: getData('sys_drivers'),
            cashiers: getData('sys_cashiers'),
            expenses: getData('sys_expenses'),
            fixedExpenses: getData('sys_fixed_expenses'),
            completedOrders: getData('sys_completed_orders'),
            passwords: getData('sys_passwords'),
            capitalInvestment: localStorage.getItem('sys_capital_investment') || 0
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `MIM89_POS_BACKUP_${getTodayString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        let waMessage = `📦 *نسخة احتياطية لنظام MIM89 POS* 📦\n`;
        waMessage += `----------------------------------\n`;
        waMessage += `📅 *التاريخ:* ${fullBackup.backupDate}\n`;
        waMessage += `👥 *عدد الزبائن المسجلين:* ${fullBackup.customers.length} زبون\n`;
        waMessage += `🍔 *عدد وجبات المينيو:* ${fullBackup.items.length} وجبة\n`;
        waMessage += `🧾 *إجمالي الفواتير المنجزة:* ${fullBackup.completedOrders.length} فاتورة\n`;
        waMessage += `----------------------------------\n`;
        waMessage += `تم استخراج وتنزيل نسخة JSON الاحتياطية بنجاح على الجهاز.`;

        const myPhone = "9647750008630";
        window.open(`https://api.whatsapp.com/send?phone=${myPhone}&text=${encodeURIComponent(waMessage)}`, '_blank');

        alert("✅ تم تنزيل ملف النسخة الاحتياطية (JSON) وإرسال ملخص للواتساب بنجاح!");
    } catch (err) {
        console.error("Backup error:", err);
        alert("⚠️ حدث خطأ أثناء استخراج النسخة الاحتياطية.");
    }
}

function importFullSystemBackup(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.items && backup.customers) {
                if (confirm(`هل أنت متأكد من استرجاع النسخة الاحتياطية المؤرخة في (${backup.backupDate || 'سابقاً'})؟ ستقوم باستبدال البيانات الحالية.`)) {
                    if (backup.categories) setData('sys_categories', backup.categories);
                    if (backup.items) setData('sys_items', backup.items);
                    if (backup.inventory) setData('sys_inventory', backup.inventory);
                    if (backup.customers) setData('sys_customers', backup.customers);
                    if (backup.drivers) setData('sys_drivers', backup.drivers);
                    if (backup.cashiers) setData('sys_cashiers', backup.cashiers);
                    if (backup.expenses) setData('sys_expenses', backup.expenses);
                    if (backup.fixedExpenses) setData('sys_fixed_expenses', backup.fixedExpenses);
                    if (backup.completedOrders) setData('sys_completed_orders', backup.completedOrders);
                    if (backup.passwords) setData('sys_passwords', backup.passwords);
                    if (backup.capitalInvestment) localStorage.setItem('sys_capital_investment', backup.capitalInvestment);

                    refreshActiveUI();
                    alert("🎉 تم استرجاع كافة بيانات النظام بنجاح!");
                }
            } else {
                alert("❌ الملف المحدد غير صالح أو ليس نسخة احتياطية لنظام MIM89!");
            }
        } catch (err) {
            alert("❌ خطأ في قراءة ملف JSON!");
        }
    };
    reader.readAsText(file);
}

/* ==========================================
   17. النوافذ المنبثقة والدوال المساعدة
   ========================================== */

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

window.addEventListener('storage', (event) => {
    if (event.key === 'sys_items' || event.key === 'sys_categories') {
        if (typeof renderCashierItems === 'function') renderCashierItems();
        if (typeof renderAdminItems === 'function') renderAdminItems();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
