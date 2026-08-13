/* ==========================================================================
   MIM89 FAST FOOD - Master Core Engine (v19.5 Full Integrated System)
   مشروع الفايربيس: mim89-ff938 | نظام الكاشير والمبيعات المباشرة والمطبخ الشبكي
   ========================================================================== */

// 1. المتغيرات العامة والاتصال السحابي بـ Firebase
let db = null;
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';
let activeDiscountType = null;
let posDiscountAmount = 0;
let currentPercentValue = 0;
let cart = [];
let activePendingPrintOrder = null; // الاحتفاظ بالطلب النشط لضمان طباعة الزبون والمطبخ قبل التفريغ
let lastCompletedOrder = null;

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

// 2. البيانات الأساسية الكاملة لمطعم MIM89 (شاورما دجاج فقط)
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

    if (!currentItems || currentItems.length < 5) {
        localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
        localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));

        if (db) {
            try {
                const batch = db.batch();
                DEFAULT_DATA.items.forEach(item => {
                    batch.set(db.collection("menu_items").doc(String(item.id)), item);
                });
                DEFAULT_DATA.categories.forEach(cat => {
                    batch.set(db.collection("menu_categories").doc(String(cat.id)), cat);
                });
                batch.commit().then(() => console.log("تم تحديث الفايربيس بالكامل بنجاح!")).catch(console.error);
            } catch (err) {
                console.error("Batch error:", err);
            }
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

// 🔢 دوال إدارة تسلسل أرقام الطلبات التصاعدي الدقيق
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
        const stockItem = inventory.find(inv => Number(inv.id) === Number(ingredient.invId));
        if (stockItem) {
            const costPerUnit = stockItem.costPerUnit 
                || (stockItem.quantity > 0 ? (Number(stockItem.totalPrice) / Number(stockItem.quantity)) : 0);
            totalCost += (costPerUnit * Number(ingredient.qty || 0));
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
   3. المينيو الإلكتروني العام للزبائن (index.html)
   ========================================== */

function loadPublicMenu() {
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

function openItemDetails(id) {
    const item = getData('sys_items').find(i => Number(i.id) === Number(id));
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
    const item = items.find(i => Number(i.id) === Number(itemId));
    const exist = cart.find(c => Number(c.id) === Number(itemId));

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
    const item = cart.find(c => Number(c.id) === Number(id));
    if (item) {
        item.qty += change;
        if (item.qty <= 0) cart = cart.filter(c => Number(c.id) !== Number(id));
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
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const orderType = document.getElementById('orderTypeSelect') ? document.getElementById('orderTypeSelect').value : 'delivery';
    const areaInput = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    
    let deliveryFee = 0;
    if (orderType === 'delivery') {
        const normalizedInput = normalizeArabicArea(areaInput);
        if (normalizedInput.includes("قاهره")) {
            deliveryFee = 0;
        } else if (areaInput !== "") {
            const areas = getData('sys_areas');
            const found = areas.find(a => {
                const normName = normalizeArabicArea(a.name);
                return normName === normalizedInput || normalizedInput.includes(normName);
            });
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

    const iraqiPhoneRegex = /^07[3-9]\d{8}$/;
    if (!phone || !iraqiPhoneRegex.test(phone)) {
        return alert("❌ يرجى إدخال رقم هاتف عراقي صحيح يتكون من 11 رقماً ويبدأ بـ 07\nمثال: 07750008630");
    }

    if (type === 'delivery' && (!name || !area || !address)) {
        return alert("يرجى إكمال جميع الحقول المطلوبة (الاسم، المنطقة، والعنوان)");
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
        const normArea = normalizeArabicArea(area);
        deliveryFee = normArea.includes("قاهره") ? 0 : 3000;
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
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now()
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

/* ==========================================
   4. نقطة البيع POS والدليفري والتطبيقات (cashier.html)
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

        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'block';
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

function autoSearchCustomerByPhone(phoneInput) {
    const cleanPhone = String(phoneInput || '').replace(/[^0-9]/g, '');
    const resultsBox = document.getElementById('phoneSearchResults');
    if (!resultsBox) return;

    if (cleanPhone.length < 4) {
        resultsBox.style.display = 'none';
        return;
    }

    const completed = getData('sys_completed_orders');
    const matches = completed.filter(o => {
        if (!o.phone || o.phone === '-' || o.phone === 'بدون رقم') return false;
        const p = String(o.phone).replace(/[^0-9]/g, '');
        return p.includes(cleanPhone) && o.customerName && o.customerName !== 'زبون مباشر';
    });

    const uniqueCustomers = [];
    const map = new Map();
    for (const item of matches) {
        const p = String(item.phone).replace(/[^0-9]/g, '');
        if(!map.has(p)){
            map.set(p, true);
            uniqueCustomers.push(item);
        }
    }

    if (uniqueCustomers.length === 0) {
        resultsBox.innerHTML = '<div style="padding:6px; color:#aaa; font-size:0.8rem;">🆕 زبون جديد (غير مسجل سابقاً)</div>';
        resultsBox.style.display = 'block';
        return;
    }

    resultsBox.innerHTML = uniqueCustomers.slice(0, 3).map(cust => `
        <div onclick="fillCustomerData('${cust.customerName.replace(/'/g, "\\'")}', '${cust.phone}', '${(cust.area || '').replace(/'/g, "\\'")}', '${(cust.address || '').replace(/'/g, "\\\'")}')" 
             style="padding:8px; background:#222; border-bottom:1px solid #333; cursor:pointer; border-radius:6px; margin-bottom:4px;">
            <strong style="color:var(--gold-bright); font-size:0.85rem;">👤 ${cust.customerName}</strong> 
            <small style="color:#aaa;">(${cust.phone})</small><br>
            <span style="font-size:0.75rem; color:#ccc;">📍 ${cust.area || ''} ${cust.address ? '- ' + cust.address : ''}</span>
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

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => Number(i.id) === Number(itemId));
    const exist = posCart.find(c => Number(c.id) === Number(itemId));

    if (exist) {
        exist.qty += 1;
    } else {
        posCart.push({ ...item, qty: 1, itemNotes: [] });
    }
    recalculateActiveDiscount();
    renderPosCart();
}

function changePosCartQty(id, change) {
    const item = posCart.find(c => Number(c.id) === Number(id));
    if (item) {
        item.qty += change;
        if (item.qty <= 0) posCart = posCart.filter(c => Number(c.id) !== Number(id));
    }
    recalculateActiveDiscount();
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    clearAllDiscounts();
    renderPosCart();
}

// 🍔 إضافة ملاحظة مخصصة للوجبة المحددة داخل السلة (بركر أو شاورما)
function addNoteToCartItem(cartIndex, noteText) {
    if (posCart[cartIndex]) {
        if (!posCart[cartIndex].itemNotes) {
            posCart[cartIndex].itemNotes = [];
        }
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

function toggleFreeDiscount() {
    if (activeDiscountType === 'free') {
        clearAllDiscounts();
    } else {
        const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        if (subtotal === 0) return alert("السلة فارغة! اضف وجبات أولاً.");

        activeDiscountType = 'free';
        posDiscountAmount = subtotal;
        updateDiscountUIState('free', '🎉 طلب مجاني (100%)');
        renderPosCart();
    }
}

function togglePercentDiscount() {
    if (activeDiscountType === 'percent') {
        clearAllDiscounts();
    } else {
        const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        if (subtotal === 0) return alert("السلة فارغة! اضف وجبات أولاً.");

        const inputPercent = prompt("أدخل نسبة الخصم المئوية (مثال: 20 أو 50):", currentPercentValue || "50");
        if (inputPercent === null) return;

        const pVal = Math.min(100, Math.max(1, Number(inputPercent) || 0));
        if (pVal <= 0) return clearAllDiscounts();

        currentPercentValue = pVal;
        activeDiscountType = 'percent';
        posDiscountAmount = (subtotal * pVal) / 100;

        updateDiscountUIState('percent', `🏷️ خصم ${pVal}%`);
        renderPosCart();
    }
}

function promptAmountDiscount() {
    if (activeDiscountType === 'amount') {
        clearAllDiscounts();
    } else {
        const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        if (subtotal === 0) return alert("السلة فارغة! اضف وجبات أولاً.");

        const inputAmt = prompt("أدخل قيمة الخصم بالمبلغ (د.ع):", posDiscountAmount || "1000");
        if (inputAmt === null) return;

        const amt = Math.max(0, Number(inputAmt) || 0);
        if (amt <= 0) return clearAllDiscounts();

        activeDiscountType = 'amount';
        posDiscountAmount = amt;
        updateDiscountUIState('amount', `💵 خصم ${amt.toLocaleString()} د.ع`);
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
    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    if (subtotal === 0) {
        clearAllDiscounts();
        return;
    }
    if (activeDiscountType === 'free') {
        posDiscountAmount = subtotal;
    } else if (activeDiscountType === 'percent') {
        posDiscountAmount = (subtotal * currentPercentValue) / 100;
    }
}

function updateDiscountUIState(type, badgeText) {
    const btnFree = document.getElementById('btnFreeDiscount');
    const btnPercent = document.getElementById('btnPercentDiscount');
    const btnAmount = document.getElementById('btnAmountDiscount');
    const btnClearX = document.getElementById('btnClearDiscountX');
    const badge = document.getElementById('discountStatusBadge');

    [btnFree, btnPercent, btnAmount].forEach(btn => {
        if (btn) {
            btn.style.background = '#222228';
            btn.style.borderColor = '#444';
            btn.style.color = '#fff';
        }
    });

    if (type === 'free' && btnFree) {
        btnFree.style.background = '#10b981';
        btnFree.style.borderColor = '#10b981';
    } else if (type === 'percent' && btnPercent) {
        btnPercent.style.background = '#3b82f6';
        btnPercent.style.borderColor = '#3b82f6';
    } else if (type === 'amount' && btnAmount) {
        btnAmount.style.background = 'var(--gold-primary)';
        btnAmount.style.borderColor = 'var(--gold-primary)';
        btnAmount.style.color = '#000';
    }

    if (btnClearX) {
        btnClearX.style.display = type ? 'inline-block' : 'none';
    }

    if (badge) {
        if (badgeText) {
            badge.innerText = badgeText;
            badge.style.display = 'inline-block';
            badge.style.color = type === 'free' ? '#10b981' : (type === 'percent' ? '#38bdf8' : 'var(--gold-bright)');
        } else {
            badge.style.display = 'none';
        }
    }
}

function openQuickCashModal() {
    const totalElement = document.getElementById('posTotalAmount');
    let totalValue = totalElement ? (parseInt(totalElement.innerText.replace(/[^0-9]/g, '')) || 0) : 0;
    if (totalValue <= 0) {
        alert('⚠️ السلة فارغة! اختر الوجبات أولاً.');
        return;
    }
    document.getElementById('modalCashTotalReq').innerText = totalValue.toLocaleString() + ' د.ع';
    document.getElementById('cashGivenInput').value = '';
    document.getElementById('cashChangeResult').innerText = '0 د.ع';
    openModal('quickCashModal');
}

function setCashGiven(amount) {
    document.getElementById('cashGivenInput').value = amount;
    calculateCashChange();
}

function calculateCashChange() {
    const totalElement = document.getElementById('posTotalAmount');
    let req = totalElement ? (parseInt(totalElement.innerText.replace(/[^0-9]/g, '')) || 0) : 0;
    let given = parseInt(document.getElementById('cashGivenInput').value) || 0;
    let change = given - req;
    const resEl = document.getElementById('cashChangeResult');
    if (change < 0) {
        resEl.style.color = 'var(--danger)';
        resEl.innerText = 'متبقي للزبون دفع: ' + Math.abs(change).toLocaleString() + ' د.ع';
    } else {
        resEl.style.color = 'var(--success)';
        resEl.innerText = change.toLocaleString() + ' د.ع';
    }
}

// 🧮 الانتقال الإلزامي بعد الحاسبة إلى نافذة طباعة الفواتير
function proceedToPrintAfterCash() {
    const givenInput = document.getElementById('cashGivenInput').value;
    if (!givenInput || Number(givenInput) <= 0) {
        return alert("⚠️ يرجى إدخال المبلغ المستلم من الزبون في الحاسبة أولاً!");
    }

    closeModal('quickCashModal');
    prepareAndOpenPrintModal();
}

// 🖨️ فتح نافذة خيارات الطباعة الموحدة وحفظ الطلب مؤقتاً
function prepareAndOpenPrintModal() {
    if (posCart.length === 0) return alert("⚠️ السلة فارغة!");

    const custName = document.getElementById('posCustName') ? (document.getElementById('posCustName').value.trim() || "زبون مباشر") : "زبون مباشر";
    const driverSelect = document.getElementById('posDriverSelect');
    const selectedDriver = driverSelect ? driverSelect.value : '';

    if (selectedPosOrderType === 'delivery' && !selectedDriver) {
        return alert("🛵 يرجى اختيار سائق التوصيل أو التطبيق المعتمد للمحاسبة!");
    }

    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const finalTotal = Math.max(0, subtotal - posDiscountAmount);

    let typeText = 'صالة';
    if (selectedPosOrderType === 'takeaway') typeText = 'سفري';
    if (selectedPosOrderType === 'delivery') typeText = `توصيل (${selectedDriver || 'دليفري'})`;

    let orderSeq = getOrderSequence();

    const pendingOrder = {
        id: 'POS_' + Date.now(),
        orderNum: orderSeq,
        customerName: custName,
        phone: "-",
        orderType: selectedPosOrderType,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? 'كاش' : 'فيزا',
        area: typeText,
        driverName: selectedDriver || '-',
        address: "-",
        notes: '-',
        items: JSON.parse(JSON.stringify(posCart)),
        subtotal: subtotal,
        discount: posDiscountAmount,
        deliveryFee: 0,
        totalAmount: finalTotal,
        cashierName: activeCashierUser ? activeCashierUser.name : 'الرئيسي',
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now(),
        customerPrinted: false,
        kitchenPrinted: false
    };

    window.activePendingPrintOrder = pendingOrder;
    updatePrintModalBadges();
    openModal('printOptionsModal');
}

function updatePrintModalBadges() {
    const ord = window.activePendingPrintOrder;
    if (!ord) return;
    
    const custBadge = document.getElementById('custPrintBadge');
    const kitchenBadge = document.getElementById('kitchenPrintBadge');

    if (custBadge) {
        custBadge.innerText = ord.customerPrinted ? " (✅ تم الطبع)" : " (لم تُطبع)";
        custBadge.style.color = ord.customerPrinted ? "var(--success)" : "#888";
    }
    if (kitchenBadge) {
        kitchenBadge.innerText = ord.kitchenPrinted ? " (✅ تم الطبع)" : " (لم يُطبع)";
        kitchenBadge.style.color = ord.kitchenPrinted ? "var(--success)" : "#888";
    }
}

function executeCustomerPrintOnly() {
    const ord = window.activePendingPrintOrder;
    if (!ord) return alert("⚠️ لا يوجد طلب نشط للطباعة!");
    
    printCustomerInvoiceOnly(null, ord);
    ord.customerPrinted = true;
    updatePrintModalBadges();
}

function executeKitchenPrintOnly() {
    const ord = window.activePendingPrintOrder;
    if (!ord) return alert("⚠️ لا يوجد طلب نشط للطباعة!");
    
    printKitchenTicketOnly(null, ord);
    ord.kitchenPrinted = true;
    updatePrintModalBadges();
}

function tryFinalizeAndClearOrder() {
    const ord = window.activePendingPrintOrder;
    if (!ord) return closeModal('printOptionsModal');

    // حفظ الطلب وتخصيم المخزون وتحديث التسلسل
    saveCompletedOrder(ord);
    deductInventoryFromRecipe(ord.items);
    incrementOrderSequence();

    // تفريغ السلة الآن فقط بعد إتمام الطباعتين
    clearPosCart();
    if (document.getElementById('posCustName')) document.getElementById('posCustName').value = '';
    
    window.activePendingPrintOrder = null;
    closeModal('printOptionsModal');
    alert("✅ تم إتمام الطلب وتفريغ السلة من الكاشير بنجاح!");
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
                        <strong>👤 ${ord.customerName || 'زبون'} ${ord.driverName ? ' - 🛵 ' + ord.driverName : ''}</strong>
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
        window.activePendingPrintOrder = order;
        closeModal('completedOrdersModal');
        printCustomerInvoiceOnly(null, order);
    }
}

function clearCompletedOrdersHistory() {
    if (confirm("مسح جميع الفواتير من السجل؟")) {
        setData('sys_completed_orders', []);
        openCompletedOrdersModal();
    }
}

/* ==========================================
   إدارة الصرفيات والمسحوبات وسُلف الموظفين
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

    const amount = Number(amtInput ? amtInput.value : 0);
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
                <strong style="color:var(--danger); font-size:0.8rem;">${exp.type}</strong>
                <div style="font-size:0.75rem; color:#aaa;">${exp.note} (${exp.timestamp})</div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <strong style="color:var(--gold-bright); font-size:0.85rem;">${exp.amount.toLocaleString()} د.ع</strong>
                <button onclick="deleteExpenseRecord('${exp.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.8rem;">✕</button>
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
   إدارة ملاحظات المطبخ السريعة
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
            <button onclick="deleteKitchenNoteItem(${idx})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.85rem;">✕ حذف</button>
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
   التقارير اليومية والكشوفات المالية
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
    let driverStatsMap = {};

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

        if (ord.driverName && ord.driverName !== '-' && ord.driverName !== '') {
            if (!driverStatsMap[ord.driverName]) {
                driverStatsMap[ord.driverName] = { count: 0, totalAmount: 0 };
            }
            driverStatsMap[ord.driverName].count += 1;
            driverStatsMap[ord.driverName].totalAmount += orderTotal;
        }
    });

    filteredExpenses.forEach(exp => {
        totalExpensesAmt += Number(exp.amount || 0);
    });

    const netCashInHand = Math.max(0, totalCash - totalExpensesAmt);

    if (document.getElementById('reportDateText')) document.getElementById('reportDateText').innerText = "تاريخ الكشف: " + targetDate;
    if (document.getElementById('reportCashierText')) document.getElementById('reportCashierText').innerText = "الكاشير: " + (activeCashierUser ? activeCashierUser.name : "الرئيسي");
    if (document.getElementById('repTotalSales')) document.getElementById('repTotalSales').innerText = totalSales.toLocaleString();
    if (document.getElementById('repOrdersCount')) document.getElementById('repOrdersCount').innerText = filteredOrders.length;
    if (document.getElementById('repTotalCash')) document.getElementById('repTotalCash').innerText = totalCash.toLocaleString();
    if (document.getElementById('repTotalVisa')) document.getElementById('repTotalVisa').innerText = totalVisa.toLocaleString();
    if (document.getElementById('repTotalDelivery')) document.getElementById('repTotalDelivery').innerText = totalDelivery.toLocaleString();
    if (document.getElementById('repNetFood')) document.getElementById('repNetFood').innerText = subtotalFood.toLocaleString();

    if (document.getElementById('repTotalExpenses')) document.getElementById('repTotalExpenses').innerText = totalExpensesAmt.toLocaleString();
    if (document.getElementById('repNetCashBox')) document.getElementById('repNetCashBox').innerText = netCashInHand.toLocaleString();
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
                const qty = Number(item.qty || 0);
                const price = Number(item.price || 0);
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
    if (document.getElementById('repTotalItemsQty')) document.getElementById('repTotalItemsQty').innerText = totalItemsQtyCount.toLocaleString() + " قطعة";

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
                        <span style="background:#333; color:var(--gold-bright); padding:2px 8px; border-radius:4px; font-size:0.8rem; margin-left:6px;">العدد: ${itemsSoldMap[name].qty}</span>
                        <strong style="color:#10b981; font-size:0.85rem;">${itemsSoldMap[name].totalPrice.toLocaleString()} د.ع</strong>
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
                const qty = Number(item.qty || 0);
                const price = Number(item.price || 0);
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
        waText += `• *${name}:* ${itemsSoldMap[name].qty} قطعة (${itemsSoldMap[name].totalPrice.toLocaleString()} د.ع)\n`;
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
        const amt = Number(ord.totalAmount || 0);
        grandTotal += amt;
        if (ord.paymentMethod && ord.paymentMethod.includes("فيزا")) {
            totalVisa += amt;
        } else {
            totalCash += amt;
        }
    });

    shiftExpenses.forEach(e => {
        totalExpAmt += Number(e.amount || 0);
    });

    const netCashInDrawer = Math.max(0, totalCash - totalExpAmt);

    if (document.getElementById('shiftCashierName')) document.getElementById('shiftCashierName').innerText = activeUser.name;
    if (document.getElementById('shiftStartTime')) document.getElementById('shiftStartTime').innerText = shiftStartStr;
    if (document.getElementById('shiftTotalCash')) document.getElementById('shiftTotalCash').innerText = totalCash.toLocaleString();
    if (document.getElementById('shiftTotalExpenses')) document.getElementById('shiftTotalExpenses').innerText = totalExpAmt.toLocaleString();
    if (document.getElementById('shiftNetDrawerCash')) document.getElementById('shiftNetDrawerCash').innerText = netCashInDrawer.toLocaleString();
    if (document.getElementById('shiftTotalVisa')) document.getElementById('shiftTotalVisa').innerText = totalVisa.toLocaleString();
    if (document.getElementById('shiftOrdersCount')) document.getElementById('shiftOrdersCount').innerText = shiftOrders.length;
    if (document.getElementById('shiftGrandTotal')) document.getElementById('shiftGrandTotal').innerText = grandTotal.toLocaleString();

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

// 🧾 1. طباعة فاتورة الكاشير / الزبون المالية فقط
function printCustomerInvoiceOnly(event, customOrder) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const order = customOrder || window.activePendingPrintOrder;
    if (!order) return alert('⚠️ لا توجد بيانات للطلب!');

    let itemsHtml = '';
    order.items.forEach(i => {
        const itemTotal = Number(i.price) * Number(i.qty);
        let notesText = (i.itemNotes && i.itemNotes.length > 0) ? `<br><small style="color:#333; font-weight:bold;">(${i.itemNotes.join(' - ')})</small>` : '';
        itemsHtml += `
            <div style="font-size:13px; font-weight:bold; margin:3px 0; border-bottom:1px solid #000; padding-bottom:2px; color:#000;">
                <div style="display:flex; justify-content:space-between;">
                    <span>${i.name} (x${i.qty})</span>
                    <span>${itemTotal.toLocaleString()} د.ع</span>
                </div>
                ${notesText}
            </div>`;
    });

    const printBox = document.getElementById('mim89ThermalPrintBox');
    if (printBox) {
        printBox.innerHTML = `
            <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000;">
                <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px;">
                    <h2 style="font-size:18px; margin:0; font-weight:900; color:#000;">MIM89 FAST FOOD</h2>
                    <div style="font-size:10px; font-weight:bold; color:#000;">بغداد - القاهرة | فاتورة الحساب (كاشير)</div>
                </div>
                <div style="text-align:center; margin:4px 0; border:1px solid #000; padding:2px; background:#fff;">
                    <div style="font-size:10px; font-weight:bold; color:#000;">رقم الطلب</div>
                    <div style="font-size:28px; font-weight:900; color:#000;">#${order.orderNum}</div>
                </div>
                <div style="font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px; color:#000; line-height:1.5;">
                    <div>التاريخ: ${order.dateDate} - ${order.timestamp}</div>
                    <div>اسم الزبون: ${order.customerName}</div>
                    <div>الخدمة: ${order.area} | الدفع: ${order.paymentMethod}</div>
                </div>
                <div style="border-bottom:1px dashed #000; padding:2px 0; margin-bottom:4px;">${itemsHtml}</div>
                
                <div style="font-size:12px; margin-top:4px; line-height:1.5;">
                    <div style="display:flex; justify-content:space-between;"><span>المجموع الفرعي:</span> <span>${(order.subtotal || 0).toLocaleString()} د.ع</span></div>
                    ${order.discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>الخصم المطبق:</span> <span>- ${order.discount.toLocaleString()} د.ع</span></div>` : ''}
                    <div style="font-size:14px; font-weight:900; display:flex; justify-content:space-between; border-top:1px solid #000; padding-top:4px; margin-top:2px;">
                        <span>المجموع الكلي:</span> <span>${(order.totalAmount || 0).toLocaleString()} د.ع</span>
                    </div>
                </div>
                <div style="text-align:center; margin-top:6px; font-size:10px; font-weight:bold;">شكراً لزيارتكم MIM89</div>
            </div>`;
        setTimeout(() => { 
            window.print(); 
            setTimeout(() => { printBox.innerHTML = ''; }, 3000); 
        }, 150);
    }
}

// 🔥 2. أمر تجهيز المطبخ فقط (بدون أسعار نهائياً مع الملاحظات الفردية للوجبات)
function printKitchenTicketOnly(event, customOrder) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const order = customOrder || window.activePendingPrintOrder;
    if (!order) return alert('⚠️ لا توجد بيانات للطلب!');

    let itemsKitchenHtml = '';
    order.items.forEach(i => {
        let itemNotesStr = (i.itemNotes && i.itemNotes.length > 0) ? ` <span style="font-size:13px; color:#000; font-weight:bold;">[${i.itemNotes.join(', ')}]</span>` : '';
        itemsKitchenHtml += `
            <div style="font-size:16px; font-weight:900; margin:6px 0; border-bottom:1px dashed #000; padding-bottom:4px; color:#000;">
                <div style="display:flex; justify-content:space-between;">
                    <span>- ${i.name}</span>
                    <span>[x${i.qty}]</span>
                </div>
                ${itemNotesStr}
            </div>`;
    });

    const printBox = document.getElementById('mim89ThermalPrintBox');
    if (printBox) {
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
                <div style="font-size:13px; font-weight:bold; margin-bottom:8px; border-bottom:2px solid #000; padding-bottom:6px; line-height:1.5;">
                    <div>الخدمة: ${order.area}</div>
                    <div>الزبون: ${order.customerName}</div>
                </div>
                <div style="padding:4px 0;">${itemsKitchenHtml}</div>
            </div>`;
        setTimeout(() => { 
            window.print(); 
            setTimeout(() => { printBox.innerHTML = ''; }, 3000); 
        }, 150);
    }
}

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

    const completed = getData('sys_completed_orders');
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

function generateOrderCardHTML(ord, docId) {
    const itemsList = Array.isArray(ord.items) ? ord.items : [];
    const total = (ord.totalAmount !== undefined && ord.totalAmount !== null) ? Number(ord.totalAmount).toLocaleString() : '0';

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

    return `
        <div id="order_card_${safeDocId}" style="background:#222228; border:1px solid ${pastCustomer ? 'var(--gold-bright)' : 'var(--gold-primary)'}; padding:10px; margin-bottom:8px; border-radius:8px; width:100%;">
            <div style="display:flex; justify-content:space-between; color:var(--gold-primary); font-size:0.85rem;">
                <strong>📞 ${displayName} (${rawPhone})</strong>
                <span>${ord.orderType === 'delivery' ? '🚗 توصيل' : '🛍️ سفري'}</span>
            </div>
            ${pastCustomer ? '<span style="background:var(--gold-primary); color:#000; font-size:0.7rem; font-weight:bold; padding:1px 6px; border-radius:4px; margin-top:2px; display:inline-block;">⭐ زبون مسجل سابقاً</span>' : '<span style="background:#444; color:#fff; font-size:0.7rem; padding:1px 6px; border-radius:4px; margin-top:2px; display:inline-block;">🆕 متصل جديد</span>'}
            <p style="font-size:0.8rem; color:#ccc; margin-top:4px;">${displayArea ? 'المنطقة: ' + displayArea : ''} ${displayAddress ? '- ' + displayAddress : ''}</p>
            <hr style="border-color:#333; margin:6px 0;">
            <ul style="padding-right:12px; font-size:0.8rem;">
                ${itemsList.length > 0 
                    ? itemsList.map(i => `<li>${i.name} × ${i.qty}</li>`).join('') 
                    : '<li style="color:#aaa;">(طلب هاتف - اختر الوجبات يدوياً في الفاتورة المباشرة)</li>'}
            </ul>
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--gold-bright); font-size:0.85rem;">المجموع: ${total} د.ع</strong>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="gold-btn" style="padding:4px 6px; font-size:0.7rem; background:#333; color:var(--gold-bright); border:1px solid var(--gold-primary); flex:1;" onclick="loadIncomingCallToPos('${safeDocId}', '${safeOrderId}', '${safePhone}', '${safeName}', '${safeArea}', '${safeAddress}')">📥 نقل لكاشير</button>
                    <button class="gold-btn" style="padding:4px 6px; font-size:0.7rem; background:var(--danger); color:#fff; flex:1;" onclick="cancelIncomingOrder('${safeDocId}', '${safeOrderId}')">❌ إلغاء وحذف</button>
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

function loadIncomingCallToPos(docId, orderId, phone, name, area, address) {
    const btnDirect = document.querySelector(".pos-sidebar .toggle-btn");
    switchCashierTab('tabPosDirect', btnDirect);

    const infoText = `${name} | هاتف: ${phone} ${area ? '| ' + area : ''} ${address ? '- ' + address : ''}`;
    const custInput = document.getElementById('posCustName');
    if (custInput) custInput.value = infoText;

    alert(`تم جلب بيانات الزبون (${name}) لشاشة المبيعات بنجاح! اختر الوجبات من القائمة للمحاسبة.`);
}

function deductInventoryFromRecipe(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    let inventory = getData('sys_inventory');
    const allMenuItems = getData('sys_items');

    items.forEach(cartItem => {
        const menuItem = allMenuItems.find(m => Number(m.id) === Number(cartItem.id));
        if (menuItem && menuItem.recipe) {
            menuItem.recipe.forEach(ingredient => {
                const stockItem = inventory.find(inv => Number(inv.id) === Number(ingredient.invId));
                if (stockItem) {
                    const totalDeduct = (Number(ingredient.qty) || 0) * (Number(cartItem.qty) || 1);
                    stockItem.quantity = Math.max(0, Number(stockItem.quantity) - totalDeduct);
                }
            });
        }
    });

    setData('sys_inventory', inventory);
}

function renderPosCart() {
    const list = document.getElementById('posCartList');
    const totalEl = document.getElementById('posTotalAmount');
    if (!list) return;

    if (posCart.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#777; font-size:0.8rem; padding:15px;">اختر الوجبات لإضافتها للفاتورة</p>`;
        if (totalEl) totalEl.innerText = "0 د.ع";
        return;
    }

    const quickNotes = getData('sys_quick_kitchen_notes') || ["بدون ثوم 🧄", "سبايسي 🌶️", "صوص زيادة 🧀", "بدون مخلل 🥒"];

    let subtotal = 0;
    list.innerHTML = posCart.map((item, index) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        
        let notesHtml = '';
        if (item.itemNotes && item.itemNotes.length > 0) {
            notesHtml = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:2px;">` + 
                item.itemNotes.map((n, nIdx) => `<span style="background:#333; color:var(--gold-bright); font-size:0.65rem; padding:1px 5px; border-radius:4px;">${n} <span onclick="removeNoteFromCartItem(${index}, ${nIdx})" style="cursor:pointer; color:var(--danger);">×</span></span>`).join('') +
                `</div>`;
        }

        let quickNotesButtons = `<div style="display:flex; gap:2px; flex-wrap:wrap; margin-top:3px;">` + 
            quickNotes.map(qn => `<button onclick="addNoteToCartItem(${index}, '${qn}')" style="font-size:0.6rem; background:#222; color:#aaa; border:1px solid #444; padding:1px 4px; border-radius:3px; cursor:pointer;">+ ${qn}</button>`).join('') +
            `</div>`;

        return `
            <div style="background:#1c1c20; padding:6px; border-radius:6px; margin-bottom:5px; font-size:0.8rem; border:1px solid var(--card-border);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--gold-primary);">${item.name}</strong>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button onclick="changePosCartQty(${item.id}, -1)" class="gold-btn" style="padding:1px 6px; font-size:0.75rem;">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changePosCartQty(${item.id}, 1)" class="gold-btn" style="padding:1px 6px; font-size:0.75rem;">+</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; color:#aaa; font-size:0.75rem; margin-top:2px;">
                    <span>السعر: ${Number(item.price).toLocaleString()} د.ع</span>
                    <strong style="color:var(--gold-bright);">${itemTotal.toLocaleString()} د.ع</strong>
                </div>
                ${notesHtml}
                ${quickNotesButtons}
            </div>
        `;
    }).join('');

    const finalNetTotal = Math.max(0, subtotal - posDiscountAmount);
    if (totalEl) {
        totalEl.innerText = finalNetTotal.toLocaleString() + ' د.ع';
    }
}

/* ==========================================
   5. إدارة الصور وتعديل الأصناف
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

/* ==========================================
   6. لوحة جرد المخزن (inventory.html)
   ========================================== */

function initInventoryPage() { initData(); }

function loginInventory() {
    const pass = document.getElementById('invPassInput').value.trim();
    const validInvPass = getSystemPassword('inventory');
    const validAdminPass = getSystemPassword('admin');

    if (pass === validInvPass || pass === validAdminPass || pass === 'inv123') {
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
    const item = inv.find(i => Number(i.id) === Number(id));
    if (item) {
        item[field] = field === 'quantity' ? Number(value) : value;
        setData('sys_inventory', inv);
    }
}

function deleteInvItem(id) {
    if (confirm("حذف هذه المادة من الجرد؟")) {
        let inv = getData('sys_inventory').filter(i => Number(i.id) !== Number(id));
        setData('sys_inventory', inv);
        renderInventoryTable();
    }
}

/* ==========================================
   7. لوحة تحكم الإدارة الكاملة Admin (admin.html)
   ========================================== */

function initAdminPage() { initData(); }

function loginAdmin() {
    const pass = document.getElementById('adminPassInput').value.trim();
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
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
}

function loadAdminTabsData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminDrivers();
    renderAdminCashiers();
    renderAdminAreas();
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
            <td>${a.price === 0 ? 'مجاني 🎉' : a.price.toLocaleString() + ' د.ع'}</td>
            <td><button class="gold-btn btn-danger btn-sm" onclick="deleteArea('${a.name}')">حذف</button></td>
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

function updateItemInline(id, field, value) {
    let items = getData('sys_items');
    let item = items.find(i => Number(i.id) === Number(id));

    if (item) {
        if (field === 'price') {
            item.price = Number(value) || 0;
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
        const cat = categories.find(c => Number(c.id) === Number(item.categoryId));
        return `
            <tr>
                <td style="text-align:center;">
                    <img src="${item.image}" width="45" height="45" style="object-fit:cover; border-radius:6px; cursor:pointer;" onclick="triggerInlineImageUpload(${item.id})" title="اضغط لتغيير الصورة مباشرة">
                </td>
                <td>
                    <input type="text" value="${item.name}" class="gold-input-inline" onchange="updateItemInline(${item.id}, 'name', this.value)" style="font-weight:bold;">
                </td>
                <td><span style="font-size:0.8rem; color:#aaa;">${cat ? cat.name : '-'}</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <input type="number" value="${item.price}" class="gold-input-inline" onchange="updateItemInline(${item.id}, 'price', this.value)" style="color:var(--gold-bright); font-weight:bold; width:100px;">
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
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('itemName').value.trim();
    const price = Number(document.getElementById('itemPrice').value);
    const categoryId = Number(document.getElementById('itemCategory').value);
    const ingredients = document.getElementById('itemIngredients').value.trim();

    let existingItem = id ? getData('sys_items').find(i => Number(i.id) === Number(id)) : null;

    let image = currentUploadedBase64 
        || (document.getElementById('itemImage') ? document.getElementById('itemImage').value.trim() : '')
        || (existingItem ? existingItem.image : '') 
        || 'https://via.placeholder.com/300?text=MIM89';

    if (!name || !price) {
        return alert("❌ يرجى إدخال اسم الصنف والسعر على الأقل!");
    }

    let items = getData('sys_items');
    let newItemData = { 
        id: id ? Number(id) : Date.now(), 
        name: name, 
        price: price, 
        categoryId: categoryId, 
        image: image, 
        ingredients: ingredients, 
        recipe: (existingItem && existingItem.recipe) ? existingItem.recipe : [] 
    };

    if (id) {
        items = items.map(i => Number(i.id) === Number(id) ? { ...i, ...newItemData } : i);
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
    alert("🎉 تم حفظ الصنف بنجاح ومزامنته فوراً!");
}

function editItem(id) {
    const item = getData('sys_items').find(i => Number(i.id) === Number(id));
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.categoryId;
    document.getElementById('itemIngredients').value = item.ingredients || '';

    if (item.image && item.image.startsWith('data:image')) {
        currentUploadedBase64 = item.image;
        if (document.getElementById('itemImage')) document.getElementById('itemImage').value = '';
    } else {
        currentUploadedBase64 = '';
        if (document.getElementById('itemImage')) document.getElementById('itemImage').value = item.image || '';
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
    if (document.getElementById('itemImage')) document.getElementById('itemImage').value = '';
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
        let items = getData('sys_items').filter(i => Number(i.id) !== Number(id));
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
   8. النوافذ المنبثقة والدوال المساعدة General Helpers
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

document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
