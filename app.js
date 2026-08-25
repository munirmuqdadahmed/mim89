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
   MIM89 FAST FOOD - Master Core Engine (v31.0 - Order Sequence & Menu Sync Fix)
   مشروع الفايربيس: mim89-ff938 | نظام الكاشير المباشر والمينيو ودليل الزبائن CRM
   صاحب النظام: منير مقداد
   ========================================================================== */

/* ==========================================
   1. المتغيرات العامة والاتصال السحابي بـ Firebase
   ========================================== */
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

// 🍔 دالة فتح وإغلاق البردة الجانبية مع تحديث أجور السائقين تلقائياً
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
        if (typeof renderDrawerDriverSettlement === 'function') {
            renderDrawerDriverSettlement();
        }
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

/* ==========================================
   2. البيانات الأساسية الكاملة والأقسام
   ========================================== */
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
        { id: 5, name: "خبز بركر", quantity: 100, unit: "قطع", totalPrice: 25000, costPerUnit: 250 },
        { id: 6, name: "شرائح سكالوب دجاج", quantity: 50, unit: "كغم", totalPrice: 300000, costPerUnit: 6000 },
        { id: 7, name: "شرائح زنجر سبايسي", quantity: 50, unit: "كغم", totalPrice: 325000, costPerUnit: 6500 }
    ],
    items: [
        { id: 101, categoryId: 1, catId: 1, category: 1, name: "عرض ليمتد 89 العائلي", price: 15000, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500", ingredients: "تشكيلة عائلية مميزة من وجبات MIM89", recipe: [] },
        { id: 102, categoryId: 1, catId: 1, category: 1, name: "عرض شاورما دبل دجاج", price: 10000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبتين شاورما دجاج دبل مع صوص وبطاطس", recipe: [{ invId: 1, qty: 0.3 }, { invId: 2, qty: 2 }] },
        { id: 301, categoryId: 8, catId: 8, category: 8, name: "شاورما صاج عادي", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج، شاورما دجاج طازجة، صلصة ثومية، مخلل", recipe: [{ invId: 1, qty: 0.12 }, { invId: 2, qty: 1 }, { invId: 3, qty: 0.1 }, { invId: 4, qty: 1 }] },
        { id: 302, categoryId: 8, catId: 8, category: 8, name: "وجبة شاورما", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج، بطاطس مقلية، ثومية، خبز طازج", recipe: [{ invId: 1, qty: 0.12 }, { invId: 3, qty: 0.1 }] },
        { id: 303, categoryId: 8, catId: 8, category: 8, name: "شاورما صاج دبل", price: 4500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج دبل مع كمية دجاج مضاعفة", recipe: [{ invId: 1, qty: 0.2 }, { invId: 2, qty: 2 }] },
        { id: 304, categoryId: 8, catId: 8, category: 8, name: "شاورما صاج سوبر", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "شاورما دجاج حجم سوبر مع الصوصات والبطاطس", recipe: [{ invId: 1, qty: 0.22 }, { invId: 2, qty: 2 }] },
        { id: 305, categoryId: 8, catId: 8, category: 8, name: "شاورما عربي", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "قطع شاورما عربي مقطعة مع بطاطس وثومية", recipe: [{ invId: 1, qty: 0.2 }, { invId: 2, qty: 1.5 }] },
        { id: 306, categoryId: 8, catId: 8, category: 8, name: "شاورما 89 الخاص", price: 5000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خلطة شاورما MIM89 الخاصة مع الجبن والصوص", recipe: [{ invId: 1, qty: 0.25 }, { invId: 2, qty: 2 }] },
        { id: 307, categoryId: 8, catId: 8, category: 8, name: "وجبة شاورما دبل", price: 7500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "وجبة شاورما مضاعفة الدجاج مع المقبلات", recipe: [{ invId: 1, qty: 0.3 }, { invId: 3, qty: 0.2 }] },
        { id: 308, categoryId: 8, catId: 8, category: 8, name: "شاورما وزن 250 غرام", price: 7000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "ربع كغم شاورما دجاج صافي بدون خبز", recipe: [{ invId: 1, qty: 0.25 }] },
        { id: 309, categoryId: 8, catId: 8, category: 8, name: "شاورما وزن 500 غرام", price: 13000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "نصف كغم شاورما دجاج صافي طازج", recipe: [{ invId: 1, qty: 0.5 }] }
    ]
};

// 🧠 التصنيف الذكي الآلي مع احترام خيار المستخدم
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
        if (name.includes('صوص') || name.includes('ثومية') || name.includes('مقبلات') || name.includes('مخلل') || name.includes('كاتشب') || name.includes('مايونيز')) return 9; 
        if (name.includes('سندويش') || name.includes('ساندويش') || name.includes('صاج') || name.includes('زنجر') || name.includes('سكالوب') || name.includes('فاهيتا') || name.includes('تورتيلا')) return 4; 
        if (name.includes('عرض') || name.includes('عائلي') || name.includes('ليمتد')) return 1; 
        if (name.includes('إضافة') || name.includes('اضافة') || name.includes('جبن') || name.includes('شريحة')) return 10; 
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
                    localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
                    localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
                    // 🌱 تهيئة Firebase بكل العناصر الافتراضية حتى تصير هي المصدر الموحّد لكل الأجهزة
                    DEFAULT_DATA.items.forEach(defItem => {
                        db.collection("menu_items").doc(String(defItem.id)).set(defItem, { merge: true }).catch(()=>{});
                    });
                }
            }).catch(err => console.error("Error fetching initial cloud data:", err));
        } else {
            localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
        }
    }

    // 🛠️ إصلاح خطأ عدم توحيد الأقسام: لا نمسح الأقسام المحفوظة محلياً/سحابياً بعد كل تحميل صفحة.
    // نزرع القيم الافتراضية فقط أول مرة (عندما لا توجد بيانات إطلاقاً)، ثم نعتمد على السحابة كمصدر موحّد.
    if (!localStorage.getItem('sys_categories')) {
        if (db) {
            db.collection("system_store").doc("sys_categories").get().then(docSnap => {
                if (docSnap.exists && docSnap.data() && docSnap.data().content) {
                    try {
                        const cloudCats = JSON.parse(docSnap.data().content);
                        if (Array.isArray(cloudCats) && cloudCats.length > 0) {
                            localStorage.setItem('sys_categories', JSON.stringify(cloudCats));
                            refreshActiveUI();
                            return;
                        }
                    } catch (e) {}
                }
                // لا يوجد شيء بالسحابة بعد: نزرع الافتراضي محلياً وسحابياً معاً
                localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
                setData('sys_categories', DEFAULT_DATA.categories);
            }).catch(() => {
                localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
            });
        } else {
            localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
        }
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
    if (!localStorage.getItem('sys_working_hours')) localStorage.setItem('sys_working_hours', JSON.stringify({ open: "10:00", close: "23:59", enabled: false }));
    if (!localStorage.getItem('sys_out_of_stock')) localStorage.setItem('sys_out_of_stock', JSON.stringify([]));
    if (!localStorage.getItem('sys_coupons')) localStorage.setItem('sys_coupons', JSON.stringify([]));

    setupCloudRealtimeSync();
    setupCategoriesRealtimeSync();
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
            db.collection("system_store").doc(key).set({ content: JSON.stringify(val), updatedAt: Date.now() })
                .catch(err => {
                    console.error("Cloud setData error [" + key + "]:", err);
                    if (typeof showCloudErrorBanner === 'function') showCloudErrorBanner(translateFirestoreError(err));
                });
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

// 🔢 [نسخة احتياطية محلية] احتساب رقم الطلب من واقع طلبات اليوم المكتملة محلياً
// تُستخدم فقط كحل بديل إذا تعذّر الاتصال بالسحابة (أوفلاين). المصدر الأساسي أصبح getNextOrderNumberFromCloud().
function getOrderSequence(customOrder) {
    if (customOrder) {
        if (customOrder.orderNum && !isNaN(customOrder.orderNum)) return parseInt(customOrder.orderNum);
        if (customOrder.orderNumber && !isNaN(customOrder.orderNumber)) return parseInt(customOrder.orderNumber);
    }
    
    const completed = getData('sys_completed_orders') || [];
    const todayOrders = completed.filter(o => o.dateDate === getTodayString());

    if (todayOrders.length > 0) {
        let maxNum = 0;
        todayOrders.forEach(o => {
            const num = cleanPrice(o.orderNum || o.orderNumber);
            if (num > maxNum) maxNum = num;
        });
        if (maxNum > 0) return maxNum + 1;
    }
    return 101;
}

// 🔢🌐 [المصدر الموحّد الجديد] عدّاد طلبات مركزي وآمن عبر Firestore Transaction.
// يمنع تكرار نفس رقم الطلب حتى لو كان أكثر من كاشير/جهاز يبيع بنفس اللحظة بالضبط،
// لأن Firestore Transaction يضمن قراءة وكتابة العداد بشكل ذَرّي (atomic) لا يمكن تصادمه.
async function getNextOrderNumberFromCloud() {
    const today = getTodayString();

    // لا يوجد اتصال سحابي: نستخدم الحساب المحلي كحل بديل مؤقت (أوفلاين)
    if (!db) {
        return getOrderSequence();
    }

    const counterRef = db.collection("system_counters").doc("daily_order_counter");

    try {
        const newNumber = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            let currentDate = today;
            let currentValue = 100; // يبدأ العد الفعلي من 101

            if (counterDoc.exists) {
                const data = counterDoc.data();
                if (data.date === today) {
                    currentDate = data.date;
                    currentValue = cleanPrice(data.lastNumber) || 100;
                } else {
                    // يوم جديد: نصفر العداد تلقائياً على بداية اليوم الجديد
                    currentDate = today;
                    currentValue = 100;
                }
            }

            const nextValue = currentValue + 1;
            transaction.set(counterRef, { date: currentDate, lastNumber: nextValue, updatedAt: Date.now() });
            return nextValue;
        });

        return newNumber;
    } catch (err) {
        console.error("⚠️ فشل الحصول على رقم الطلب من العداد المركزي، سيتم استخدام الحساب المحلي كبديل:", err);
        return getOrderSequence();
    }
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

// 🔄 المزامنة اللحظية الحية بين الادارة والمينيو والكاشير
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
            
            localStorage.setItem('sys_items', JSON.stringify(cloudItems));
            if (typeof refreshActiveUI === 'function') refreshActiveUI();
        }
    }, err => {
        console.error("خطأ بالمزامنة السحابية:", err);
        if (typeof showCloudErrorBanner === 'function') {
            showCloudErrorBanner("تعذّر استقبال تحديثات المينيو من السحابة.\n" + translateFirestoreError(err));
        }
    });
}

// 🔄🗂️ مزامنة لحظية موحّدة للأقسام (Categories) بين لوحة الإدارة، المينيو، والكاشير.
// هذا يحل مشكلة "المينيو لم يتم توحيده مع إدارة المينيو" لأن أي إضافة/تعديل/حذف قسم
// من أي جهاز، ينعكس فوراً على جميع الأجهزة الأخرى المفتوحة بنفس اللحظة.
function setupCategoriesRealtimeSync() {
    if (!db) return;

    db.collection("system_store").doc("sys_categories").onSnapshot(docSnap => {
        if (docSnap.exists && docSnap.data() && docSnap.data().content) {
            try {
                const cloudCats = JSON.parse(docSnap.data().content);
                if (Array.isArray(cloudCats)) {
                    localStorage.setItem('sys_categories', JSON.stringify(cloudCats));
                    if (typeof refreshActiveUI === 'function') refreshActiveUI();
                }
            } catch (e) {}
        }
    }, err => console.log("خطأ بمزامنة الأقسام السحابية:", err));
}

// ➕ إضافة قسم جديد للمينيو (يظهر فوراً في الإدارة، الكاشير، والمينيو الإلكتروني)
function addNewMenuCategory() {
    const input = document.getElementById('newCategoryNameInput');
    const name = input ? input.value.trim() : '';
    if (!name) return alert("⚠️ يرجى كتابة اسم القسم أولاً!");

    let categories = getData('sys_categories') || [];
    const newId = categories.length > 0 ? Math.max(...categories.map(c => cleanPrice(c.id))) + 1 : 1;
    categories.push({ id: newId, name: name });

    setData('sys_categories', categories);
    if (input) input.value = '';

    if (typeof renderAdminCategories === 'function') renderAdminCategories();
    if (typeof renderPosCategoriesBar === 'function') renderPosCategoriesBar();
    alert("✅ تم إضافة القسم وتوحيده على كل الأجهزة بنجاح!");
}

// ✏️ تعديل اسم قسم موجود
function renameMenuCategory(catId) {
    let categories = getData('sys_categories') || [];
    const cat = categories.find(c => cleanPrice(c.id) === cleanPrice(catId));
    if (!cat) return;

    const newName = prompt("أدخل الاسم الجديد للقسم:", cat.name);
    if (!newName || !newName.trim()) return;

    cat.name = newName.trim();
    setData('sys_categories', categories);

    if (typeof renderAdminCategories === 'function') renderAdminCategories();
    if (typeof renderPosCategoriesBar === 'function') renderPosCategoriesBar();
}

// 🗑️ حذف قسم (بشرط عدم وجود أصناف مرتبطة به لتفادي أصناف بلا قسم)
function deleteMenuCategory(catId) {
    const items = getData('sys_items') || [];
    const hasItems = items.some(i => getItemCategory(i) === cleanPrice(catId));

    if (hasItems) {
        return alert("⚠️ لا يمكن حذف هذا القسم لوجود أصناف مرتبطة به! انقلها لقسم آخر أولاً.");
    }

    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
        let categories = getData('sys_categories') || [];
        categories = categories.filter(c => cleanPrice(c.id) !== cleanPrice(catId));
        setData('sys_categories', categories);

        if (typeof renderAdminCategories === 'function') renderAdminCategories();
        if (typeof renderPosCategoriesBar === 'function') renderPosCategoriesBar();
        if (typeof renderCategoriesManagementList === 'function') renderCategoriesManagementList();
    }
}

// 📋 عرض جدول إدارة الأقسام الكامل بلوحة الإدارة (تبويب "الأقسام")
function renderCategoriesManagementList() {
    const tbody = document.getElementById('categoriesManagementTable');
    if (!tbody) return;

    const categories = getData('sys_categories') || [];
    const items = getData('sys_items') || [];

    if (categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888; padding:15px;">لا توجد أقسام مسجلة حالياً</td></tr>`;
        return;
    }

    tbody.innerHTML = categories.map((cat, idx) => {
        const itemsCount = items.filter(i => getItemCategory(i) === cleanPrice(cat.id)).length;
        return `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${cat.name}</strong></td>
                <td><span style="font-size:0.8rem; color:#aaa;">${itemsCount} صنف</span></td>
                <td>
                    <button class="gold-btn btn-sm" onclick="renameMenuCategory('${cat.id}')" style="padding:4px 8px; font-size:0.75rem;">✏️ تعديل</button>
                    <button class="gold-btn btn-danger btn-sm" onclick="deleteMenuCategory('${cat.id}')" style="padding:4px 8px; font-size:0.75rem;">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ➕ إضافة قسم من نافذة تبويب الإدارة (نسخة مرتبطة بحقل tabCategoriesControl) ثم تحديث الجدول فوراً
function addNewMenuCategoryFromAdminTab() {
    addNewMenuCategory();
    renderCategoriesManagementList();
}

// ⚡ قناة المزامنة الفورية اللحظية بين التبويبات المفتوحة
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
        if (typeof renderCategoriesManagementList === 'function') renderCategoriesManagementList();
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
                itemSnap.forEach(doc => {
                    const data = doc.data();
                    cloudItems.push({ ...data, docId: doc.id, id: data.id || doc.id });
                });
                if (cloudItems.length > 0) localStorage.setItem('sys_items', JSON.stringify(cloudItems));
            }

            const catDoc = await db.collection("system_store").doc("sys_categories").get();
            if (catDoc.exists && catDoc.data() && catDoc.data().content) {
                try {
                    const cloudCats = JSON.parse(catDoc.data().content);
                    if (Array.isArray(cloudCats) && cloudCats.length > 0) {
                        localStorage.setItem('sys_categories', JSON.stringify(cloudCats));
                    }
                } catch (e) {}
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
   2.9 🩺 أداة تشخيص الاتصال السحابي (تكشف سبب عدم وصول التعديلات للأجهزة الأخرى)
   ========================================== */

// 🈺 ترجمة أكواد أخطاء Firestore لرسائل عربية واضحة تشرح السبب والحل
function translateFirestoreError(err) {
    const code = (err && err.code) ? String(err.code) : '';
    if (code.includes('permission-denied')) {
        return "🚫 قواعد الأمان بـ Firestore ترفض العملية.\nالسبب الأشهر: قواعد الوضع التجريبي (Test mode) انتهت صلاحيتها.\nالحل: Firebase Console → Firestore Database → Rules → عدّل التاريخ أو القواعد وانشرها.";
    }
    if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
        return "📡 تعذّر الوصول لخوادم Firebase (الجهاز أوفلاين أو الشبكة تحجب الاتصال).";
    }
    if (code.includes('unauthenticated')) {
        return "🔑 القواعد تشترط تسجيل دخول، والنظام حالياً يعمل بدون تسجيل دخول Firebase.";
    }
    if (code.includes('not-found')) {
        return "❓ قاعدة البيانات أو المستند غير موجود.";
    }
    return "⚠️ خطأ: " + code + " — " + ((err && err.message) ? err.message : 'غير معروف');
}

// 🔔 عرض تنبيه مرئي واضح عند فشل أي رفع سحابي (بدل ابتلاع الخطأ بصمت كما كان سابقاً)
function showCloudErrorBanner(message) {
    let banner = document.getElementById('mim89CloudErrorBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'mim89CloudErrorBanner';
        banner.style.cssText = 'position:fixed; bottom:0; left:0; right:0; background:#7f1d1d; color:#fff; padding:12px 16px; font-family:Tajawal,sans-serif; font-size:0.85rem; font-weight:bold; z-index:99999; box-shadow:0 -4px 20px rgba(0,0,0,0.6); direction:rtl; text-align:right; white-space:pre-line; line-height:1.6;';
        document.body.appendChild(banner);
    }
    banner.innerHTML = '<span style="float:left; cursor:pointer; font-size:1.1rem; padding:0 8px;" onclick="this.parentElement.remove()">✕</span>⚠️ <strong>التعديل لم يُرفع للسحابة!</strong> (محفوظ على هذا الجهاز فقط)\n' + message;
}

// 🩺 الفحص الشامل: يختبر القراءة والكتابة الفعلية على خوادم Firebase ويقرّر أين الخلل بدقة
async function runCloudDiagnostics(btnElement) {
    const lines = [];
    let originalText = '';
    if (btnElement) {
        originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الفحص...';
        btnElement.disabled = true;
    }

    // 1) هل مكتبة Firebase محمّلة أصلاً؟
    if (typeof firebase === 'undefined') {
        lines.push("❌ مكتبة Firebase غير محمّلة بهذه الصفحة إطلاقاً (تحقق من الإنترنت أو من وسوم <script>).");
        finishDiagnostics(lines, btnElement, originalText);
        return;
    }
    lines.push("✅ مكتبة Firebase محمّلة.");

    // 2) هل تم تهيئة الاتصال بقاعدة البيانات؟
    if (!db) {
        lines.push("❌ لم يتم تهيئة الاتصال بقاعدة البيانات (db غير جاهز).");
        finishDiagnostics(lines, btnElement, originalText);
        return;
    }
    lines.push("✅ الاتصال بقاعدة البيانات مُهيّأ.");

    // 3) هل الجهاز متصل بالإنترنت؟
    lines.push(navigator.onLine ? "✅ الجهاز متصل بالإنترنت." : "❌ الجهاز غير متصل بالإنترنت حالياً!");

    // 4) اختبار قراءة حقيقية من الخادم (وليس من الكاش المحلي)
    try {
        const snap = await db.collection("menu_items").limit(1).get({ source: 'server' });
        lines.push("✅ القراءة من السحابة تعمل (عدد الأصناف بالسحابة: " + (snap.empty ? "0" : "1 على الأقل") + ").");
    } catch (err) {
        lines.push("❌ فشل القراءة من السحابة:\n" + translateFirestoreError(err));
        finishDiagnostics(lines, btnElement, originalText);
        return;
    }

    // 5) اختبار كتابة حقيقية مع انتظار تأكيد الخادم فعلياً
    //    (هذه أهم خطوة: الكتابة قد "تنجح" محلياً وتفشل على الخادم بصمت)
    try {
        const testRef = db.collection("system_store").doc("_mim89_diagnostic");
        const ackPromise = new Promise((resolve, reject) => {
            const timer = setTimeout(() => { unsub(); reject({ code: 'deadline-exceeded' }); }, 12000);
            const unsub = testRef.onSnapshot({ includeMetadataChanges: true }, snap => {
                if (snap.metadata && snap.metadata.hasPendingWrites === false && snap.exists) {
                    clearTimeout(timer); unsub(); resolve(true);
                }
            }, err => { clearTimeout(timer); unsub(); reject(err); });
        });

        testRef.set({ content: "diagnostic", updatedAt: Date.now() }).catch(() => {});
        await ackPromise;
        lines.push("✅ الكتابة على السحابة تعمل وتم تأكيدها من الخادم.");
        lines.push("\n🎉 الاتصال سليم بالكامل. إذا التعديل ما زال لا يصل لجهاز آخر، اضغط زر (مزامنة السحابة) على الجهاز الآخر أو أغلق الصفحة وافتحها من جديد.");
    } catch (err) {
        lines.push("❌ فشل تأكيد الكتابة على السحابة:\n" + translateFirestoreError(err));
        lines.push("\n⚠️ هذا هو سبب عدم وصول تعديلاتك للكاشير والمينيو الإلكتروني: التعديل يُحفظ على جهازك فقط ولا يُرفع للسحابة.");
    }

    finishDiagnostics(lines, btnElement, originalText);
}

function finishDiagnostics(lines, btnElement, originalText) {
    if (btnElement) {
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }
    alert("🩺 نتيجة فحص الاتصال السحابي:\n\n" + lines.join("\n"));
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
   4. المينيو الإلكتروني العام للزبائن (index.html)
   ========================================== */

window.openItemCustomizationModal = function(itemId) {
    let items = getData('sys_items');
    const item = items.find(i => String(i.id) === String(itemId) || cleanPrice(i.id) === cleanPrice(itemId));
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

function setupPublicMenuRealtimeListener() {
    if (typeof db !== 'undefined' && db) {
        db.collection("menu_items").onSnapshot(snapshot => {
            let cloudItems = [];
            snapshot.forEach(doc => {
                cloudItems.push({ ...doc.data(), docId: doc.id, id: doc.data().id || doc.id });
            });
            if (cloudItems.length > 0) {
                localStorage.setItem('sys_items', JSON.stringify(cloudItems));
                renderPublicMenuUI();
            }
        }, err => {
            console.error("خطأ في المزامنة اللحظية للمينيو:", err);
            renderPublicMenuUI();
        });
    } else {
        renderPublicMenuUI();
    }
}

function loadPublicMenu() {
    setupPublicMenuRealtimeListener();
}

function renderPublicMenuUI() {
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const navContainer = document.getElementById('categoriesNav');
    const sectionsContainer = document.getElementById('menuSections');

    if (!navContainer || !sectionsContainer) return;
    navContainer.innerHTML = ''; 
    sectionsContainer.innerHTML = '';

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

        let catItems = items.filter(i => getItemCategory(i) === cleanPrice(cat.id));
        catItems.sort((a, b) => (cleanPrice(a.price) || 0) - (cleanPrice(b.price) || 0));

        if (catItems.length > 0) {
            const sec = document.createElement('div');
            sec.className = 'menu-section';
            sec.id = `cat_${cat.id}`;
            sec.setAttribute('data-category', cat.id);
            sec.innerHTML = `
                <h2 class="section-title" style="color:var(--gold-bright); margin:18px 14px 8px 14px; font-weight:900;"><i class="fa-solid fa-utensils"></i> ${cat.name}</h2>
                <div class="items-grid">
                    ${catItems.map(item => {
                        const isOut = isItemOutOfStock(item.id);
                        if (isOut) {
                            return `
                        <div class="item-card" style="opacity:0.5; position:relative;">
                            <span style="position:absolute; top:6px; left:6px; background:#ef4444; color:#fff; font-size:0.65rem; font-weight:900; padding:3px 8px; border-radius:5px; z-index:2;">نافذ حالياً 🚫</span>
                            <img src="${item.image || item.img}" alt="${item.name}" class="item-img" onerror="this.src='https://via.placeholder.com/300x200?text=MIM89+FAST+FOOD'">
                            <div class="item-details">
                                <h3 class="item-name">${item.name}</h3>
                                <p class="item-desc">${item.ingredients || item.desc || 'وجبة طازجة من MIM89'}</p>
                                <div class="item-footer">
                                    <span class="item-price">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
                                </div>
                            </div>
                        </div>
                    `;
                        }
                        return `
                        <div class="item-card">
                            <img src="${item.image || item.img}" alt="${item.name}" class="item-img" onclick="openItemCustomizationModal('${item.id}')" onerror="this.src='https://via.placeholder.com/300x200?text=MIM89+FAST+FOOD'">
                            <div class="item-details">
                                <h3 class="item-name" onclick="openItemCustomizationModal('${item.id}')">${item.name}</h3>
                                <p class="item-desc">${item.ingredients || item.desc || 'وجبة طازجة من MIM89'}</p>
                                <div class="item-footer">
                                    <span class="item-price">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
                                    <button class="add-cart-btn" onclick="openItemCustomizationModal('${item.id}')" title="تخصيص وإضافة للسلة">+</button>
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
        const phone = phoneInput ? phoneInput.value.trim().replace(/[^\d+]/g, '') : '';
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

        saveCustomerRecord(name, phone, area, address);

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
            customerPhone: phone,
            number: phone,
            caller: phone,
            orderType: type === 'delivery' ? 'توصيل' : (type === 'takeaway' ? 'سفري' : 'داخل الصالة'),
            area: area || 'غير محدد',
            address: address || 'غير محدد',
            notes: notes,
            items: cart.map(i => ({ name: i.name, qty: cleanPrice(i.qty), price: cleanPrice(i.price), total: cleanPrice(i.price) * cleanPrice(i.qty), customNotes: i.customNotes || '' })),
            cart: cart,
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

        localStorage.setItem('sys_last_order_id', orderId);

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

        cart = [];
        if (typeof updateCartBadge === 'function') updateCartBadge();
        if (typeof closeModal === 'function') closeModal('cartModal');

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

/* ==========================================
   5. نقطة البيع POS والدليفري (cashier.html)
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

// 🗂️ دالة توليد أقسام الكاشير الموحدة من الإدارة والمينيو
function renderPosCategoriesBar() {
    const catBar = document.getElementById('posCategoriesBar');
    if (!catBar) return;

    const categories = getData('sys_categories') || [];
    let html = `<button class="category-tab active" onclick="loadPosDirectMenu('all', this)">الكل 🍔</button>`;
    categories.forEach(c => {
        html += `<button class="category-tab" onclick="loadPosDirectMenu('${c.id}', this)">${c.name}</button>`;
    });
    catBar.innerHTML = html;
}

function loadPosDirectMenu(catId = 'all', btnElement = null) {
    if (btnElement) {
        document.querySelectorAll('#posCategoriesBar .category-tab').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
        renderPosCategoriesBar();
    }

    const items = getData('sys_items') || [];
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;

    let filtered = (catId === 'all') ? items : items.filter(i => String(getItemCategory(i)) === String(catId));
    filtered.sort((a, b) => cleanPrice(a.price) - cleanPrice(b.price));

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:20px;">لا توجد وجبات في هذا القسم حالياً</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const isOut = isItemOutOfStock(item.id);
        return `
        <div class="pos-product-card" style="${isOut ? 'opacity:0.45;' : ''}" onclick="${isOut ? '' : `addToPosCart('${item.id}')`}">
            ${isOut ? '<span style="position:absolute; top:4px; left:4px; background:var(--danger); color:#fff; font-size:0.6rem; font-weight:900; padding:2px 6px; border-radius:4px;">نافذ</span>' : ''}
            <img src="${item.image || item.img}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary, #ffd700); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
        </div>
    `;
    }).join('');
}

function filterPosProducts() {
    const query = document.getElementById('posSearchInput') ? document.getElementById('posSearchInput').value.toLowerCase() : '';
    const items = getData('sys_items');
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;
    
    let filtered = items.filter(i => i.name.toLowerCase().includes(query));
    filtered.sort((a, b) => (cleanPrice(a.price) || 0) - (cleanPrice(b.price) || 0));

    grid.innerHTML = filtered.map(item => {
        const isOut = isItemOutOfStock(item.id);
        return `
        <div class="pos-product-card" style="${isOut ? 'opacity:0.45;' : ''}" onclick="${isOut ? '' : `addToPosCart('${item.id}')`}">
            ${isOut ? '<span style="position:absolute; top:4px; left:4px; background:var(--danger); color:#fff; font-size:0.6rem; font-weight:900; padding:2px 6px; border-radius:4px;">نافذ</span>' : ''}
            <img src="${item.image || item.img}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.8rem; color:#fff; margin:2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.8rem; color:var(--gold-primary, #ffd700); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
        </div>
    `;
    }).join('');
}

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => String(i.id) === String(itemId) || cleanPrice(i.id) === cleanPrice(itemId));
    if (!item) return;

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

    let deliveryFee = 0;
    if (selectedPosOrderType === 'delivery') {
        const custInput = document.getElementById('posCustName')?.value || '';
        const normInput = normalizeArabicArea(custInput);
        deliveryFee = (normInput.includes('قاهره') || normInput.includes('قاهرة')) ? 0 : 2500;
    }

    const finalNetTotal = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;
    if (totalEl) {
        if (posDiscountAmount > 0) {
            totalEl.innerHTML = `<span style="text-decoration:line-through; color:#888; font-size:0.85rem; margin-left:6px;">${(subtotal + deliveryFee).toLocaleString('ar-IQ')}</span> ${finalNetTotal === 0 ? '<span style="color:#10b981;">مجاني 🎉</span>' : finalNetTotal.toLocaleString('ar-IQ') + ' د.ع'}`;
        } else {
            totalEl.innerText = finalNetTotal.toLocaleString('ar-IQ') + ' د.ع';
        }
    }
}

/* ==========================================
   6. حاسبة النقد وإجراءات الطباعة والإنهاء
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

// 🖨️🔢 [مُعدّلة] الانتقال لشاشة الطباعة: أصبحت الدالة async وتنتظر رقم الطلب
// من العدّاد المركزي الموحّد بالسحابة (getNextOrderNumberFromCloud) بدل الحساب المحلي وحده،
// هذا يمنع نهائياً تكرار نفس رقم الطلب (مثل مشكلة تكرار #301 سابقاً).
async function proceedToPrintAfterCash() {
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

    // ⏳ إظهار حالة انتظار بسيطة أثناء طلب الرقم من السحابة لمنع الضغط المزدوج
    const confirmBtn = document.querySelector('#quickCashModal button[onclick="proceedToPrintAfterCash()"]');
    let originalBtnText = '';
    if (confirmBtn) {
        originalBtnText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تجهيز رقم الطلب...';
        confirmBtn.disabled = true;
    }

    let orderNumSeq;
    try {
        orderNumSeq = await getNextOrderNumberFromCloud();
    } catch (e) {
        orderNumSeq = getOrderSequence();
    } finally {
        if (confirmBtn) {
            confirmBtn.innerHTML = originalBtnText;
            confirmBtn.disabled = false;
        }
    }

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
        isSettled: false
    };

    if (custNameRaw.includes('هاتف:')) {
        saveCustomerRecord(
            custNameRaw.split('|')[0].trim(),
            activePendingPrintOrder.phone,
            activePendingPrintOrder.area,
            ''
        );
    }

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
   7. المحرك الحراري المباشر للطباعة 80mm
   ========================================== */

function executeCustomerPrintOnly() {
    if (!activePendingPrintOrder) return alert("لا توجد فاتورة جاهزة للطباعة!");

    const ord = activePendingPrintOrder;
    let itemsHtml = ord.items.map(i => `
        <tr style="border-bottom:1px solid #000;">
            <td style="padding:4px 0; font-weight:bold; font-size:14px; text-align:right;">${i.name} ${i.itemNotes && i.itemNotes.length ? '<br><small style="font-size:11px;">('+i.itemNotes.join(', ')+')</small>' : ''}</td>
            <td style="padding:4px 0; font-weight:bold; font-size:14px; text-align:center;">${i.qty}</td>
            <td style="padding:4px 0; font-weight:bold; font-size:14px; text-align:left;">${(i.price * i.qty).toLocaleString()}</td>
        </tr>
    `).join('');

    const printBox = document.getElementById('mim89ThermalPrintBox');
    printBox.innerHTML = `
        <div style="width:76mm; font-family:'Tajawal', sans-serif; text-align:right; direction:rtl; color:#000; padding:1mm;">
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
            ${i.itemNotes && i.itemNotes.length ? `<div style="font-size:15px; color:#000; margin-top:2px; background:#eee; padding:2px;">⚠️ ملاحظة: ${i.itemNotes.join(' - ')}</div>` : ''}
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

// 🧹 إتمام وتفريغ السلة القسري الشامل (Hard Clear)
// 🛡️ [مُعدّلة] أُضيفت حماية ضد إعادة حفظ الطلب من جديد عند "إعادة طباعة" طلب قديم من السجل،
// وأُزيلت إعادة حساب رقم الطلب هنا لأنه أصبح يُحسب مرة واحدة فقط عند proceedToPrintAfterCash().
function tryFinalizeAndClearOrder() {
    if (!activePendingPrintOrder) return;

    // 🛡️ منع تكرار حفظ نفس رقم الطلب القديم عند الضغط بالغلط أثناء إعادة الطباعة
    if (activePendingPrintOrder.isReprint) {
        activePendingPrintOrder = null;
        isCustomerPrinted = false;
        isKitchenPrinted = false;
        closeModal('printOptionsModal');
        alert("ℹ️ هذا طلب مُعاد طباعته من السجل فقط، تم الإغلاق بدون تكرار حفظه بالتقارير.");
        return;
    }

    if (!isCustomerPrinted || !isKitchenPrinted) {
        if (!confirm("⚠️ لم تقم بطباعة الفاتورتين! هل تريد إنهاء الطلب وتفريغ السلة؟")) return;
    }

    let completed = getData('sys_completed_orders') || [];
    completed.unshift(activePendingPrintOrder);
    setData('sys_completed_orders', completed);

    // 📦 [إصلاح] خصم المواد الأولية من المخزن تلقائياً حسب وصفة كل صنف مباع
    if (typeof deductInventoryFromRecipe === 'function') {
        try { deductInventoryFromRecipe(activePendingPrintOrder.items); } catch (e) { console.error('خطأ بخصم المخزون:', e); }
    }

    posCart = [];
    activeDiscountType = null;
    posDiscountAmount = 0;
    currentPercentValue = 0;
    activePendingPrintOrder = null;
    isCustomerPrinted = false;
    isKitchenPrinted = false;

    if (document.getElementById('posCustName')) document.getElementById('posCustName').value = '';
    if (document.getElementById('posOrderNotesInput')) document.getElementById('posOrderNotesInput').value = '';
    if (document.getElementById('cashGivenInput')) document.getElementById('cashGivenInput').value = '';

    renderPosCart();
    closeModal('printOptionsModal');
    renderDrawerDriverSettlement();

    alert("🎉 تم إتمام وسحب الطلب بنجاح وتفريغ السلة بالكامل!");
}

/* ==========================================
   8. ترتيب وتصفية حساب سائقي التوصيل (الدليفري)
   ========================================== */

function renderDrawerDriverSettlement() {
    const container = document.getElementById('drawerDeliverySettlementBox');
    if (!container) return;

    const drivers = getData('sys_drivers') || [];
    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();

    let html = `<h4 style="color:var(--gold-primary); font-size:0.88rem; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">🛵 حسابات السائقين المعلقة:</h4>`;
    let hasOrders = false;

    drivers.forEach(drv => {
        const driverOrders = completed.filter(o => o.dateDate === today && o.orderType === 'توصيل' && o.driverName === drv.name && !o.isSettled);

        if (driverOrders.length > 0) {
            hasOrders = true;
            let totalCollected = 0, totalDelivery = 0;
            driverOrders.forEach(o => {
                totalCollected += cleanPrice(o.totalAmount);
                totalDelivery += cleanPrice(o.deliveryFee);
            });
            const netBox = totalCollected - totalDelivery;

            html += `
                <div style="background:#1c1c24; border:1px solid #444; border-radius:6px; padding:6px; margin-bottom:6px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#fff;">
                        <strong>👤 ${drv.name}</strong>
                        <span style="background:#ff4d4d; color:#fff; padding:1px 4px; border-radius:3px; font-size:0.7rem;">${driverOrders.length} طلبات</span>
                    </div>
                    <div style="font-size:0.75rem; color:#aaa; margin:4px 0;">
                        المقبوض: ${totalCollected.toLocaleString()} | التوصيل: ${totalDelivery.toLocaleString()}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #444; padding-top:4px;">
                        <strong style="color:var(--success); font-size:0.8rem;">الصافي: ${netBox.toLocaleString()} د.ع</strong>
                        <button onclick="confirmDriverSettlement('${drv.name}')" style="background:var(--success); color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:0.72rem; cursor:pointer; font-weight:bold;">✅ تصفية</button>
                    </div>
                </div>
            `;
        }
    });

    if (!hasOrders) {
        html += `<p style="color:#777; font-size:0.75rem; text-align:center; margin:0;">لا توجد حسابات معلقة للسائقين حالياً</p>`;
    }
    container.innerHTML = html;
}

function confirmDriverSettlement(driverName) {
    if (confirm(`هل تم استلام المبالغ وتصفية ذمة السائق (${driverName})؟`)) {
        let completed = getData('sys_completed_orders') || [];
        const today = getTodayString();
        completed.forEach(o => {
            if (o.dateDate === today && o.driverName === driverName && !o.isSettled) {
                o.isSettled = true;
            }
        });
        setData('sys_completed_orders', completed);
        renderDrawerDriverSettlement();
        alert(`✅ تم تصفية حساب السائق (${driverName}) بنجاح!`);
    }
}

function getDriverDailySettlementReport(driverName) {
    const today = getTodayString();
    const completed = getData('sys_completed_orders') || [];
    
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
   9. الصرفيات والتقارير المالية المجمعة
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
    const dateInput = document.getElementById('ordersLogDateInput');
    if (dateInput && !dateInput.value) dateInput.value = getTodayString();
    renderCompletedOrdersLog();
    openModal('completedOrdersModal');
}

// 📜 [مطوّر] سجل الفواتير مع اختيار التاريخ، البحث برقم الطلب/اسم الزبون/الهاتف، وملخص إجمالي
function renderCompletedOrdersLog() {
    const container = document.getElementById('completedOrdersList');
    if (!container) return;

    const targetDate = document.getElementById('ordersLogDateInput')?.value || getTodayString();
    const searchRaw = (document.getElementById('ordersLogSearchInput')?.value || '').trim().toLowerCase();

    const completed = getData('sys_completed_orders') || [];
    let list = completed.filter(o => o.dateDate === targetDate);

    if (searchRaw) {
        list = list.filter(o =>
            String(o.orderNum || '').includes(searchRaw) ||
            String(o.customerName || '').toLowerCase().includes(searchRaw) ||
            String(o.phone || '').includes(searchRaw)
        );
    }

    const summaryEl = document.getElementById('ordersLogSummary');
    if (summaryEl) {
        const totalSum = list.reduce((s, o) => s + cleanPrice(o.totalAmount), 0);
        summaryEl.innerHTML = `عدد الفواتير: <strong style="color:var(--gold-bright);">${list.length}</strong> &nbsp;|&nbsp; الإجمالي: <strong style="color:var(--success);">${totalSum.toLocaleString('ar-IQ')} د.ع</strong>`;
    }

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#aaa; padding:15px;">لا توجد فواتير مطابقة بهذا التاريخ</p>`;
        return;
    }

    container.innerHTML = list.map(o => {
        const typeIcon = o.orderType === 'توصيل' ? '🛵' : (o.orderType === 'سفري' ? '🛍️' : '🍽️');
        return `
        <div style="background:#181822; border:1px solid #333; padding:9px 10px; border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div style="min-width:0;">
                <strong style="color:var(--gold-bright); font-size:0.88rem;">#${o.orderNum} ${typeIcon} ${o.orderType}</strong>
                <div style="font-size:0.74rem; color:#bbb; margin-top:2px;">
                    ${o.timestamp || ''} • ${o.customerName || 'زبون مباشر'}
                    ${o.driverName && o.driverName !== '-' ? ' • 🛵 ' + o.driverName : ''}
                </div>
                <div style="font-size:0.78rem; color:var(--success); font-weight:bold; margin-top:2px;">
                    ${cleanPrice(o.totalAmount).toLocaleString('ar-IQ')} د.ع
                    <span style="color:#888; font-weight:normal; font-size:0.72rem;">(${o.paymentMethod || 'كاش'})</span>
                </div>
            </div>
            <button onclick="reprintCompletedOrder('${o.id}')" class="gold-btn btn-sm" style="width:auto; padding:6px 10px; font-size:0.75rem; white-space:nowrap;">🖨️ إعادة طباعة</button>
        </div>
        `;
    }).join('');
}

// 🖨️🛡️ [مُعدّلة] إعادة الطباعة أصبحت تضع علامة isReprint:true على الطلب المؤقت،
// بحيث لو ضغط الكاشير بالغلط على "إتمام وتفريغ السلة" بعد إعادة الطباعة، لا يتكرر حفظ نفس الطلب القديم من جديد.
function reprintCompletedOrder(orderId) {
    const completed = getData('sys_completed_orders') || [];
    const ord = completed.find(o => o.id === orderId);
    if (ord) {
        activePendingPrintOrder = { ...ord, isReprint: true };
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

function openDailyReportModal() {
    const dateInput = document.getElementById('reportDateInput');
    if (dateInput) {
        dateInput.value = getTodayString();
        renderDailyReport(getTodayString());
    }
    openModal('dailyReportModal');
}

function renderDailyReport(targetDate) {
    const completed = (getData('sys_completed_orders') || []).filter(o => o.dateDate === targetDate);
    const expenses = (getData('sys_expenses') || []).filter(e => e.dateDate === targetDate);

    let totalSales = 0, totalCash = 0, totalVisa = 0, totalDelivery = 0, netFood = 0, totalExp = 0;

    completed.forEach(o => {
        const amt = cleanPrice(o.totalAmount);
        totalSales += amt;
        totalDelivery += cleanPrice(o.deliveryFee);
        netFood += cleanPrice(o.subtotal);
        if (o.paymentMethod && o.paymentMethod.includes('فيزا')) {
            totalVisa += amt;
        } else {
            totalCash += amt;
        }
    });

    expenses.forEach(e => totalExp += cleanPrice(e.amount));

    if (document.getElementById('reportDateText')) document.getElementById('reportDateText').innerText = "تاريخ الكشف: " + targetDate;
    if (document.getElementById('repTotalSales')) document.getElementById('repTotalSales').innerText = totalSales.toLocaleString('ar-IQ');
    if (document.getElementById('repOrdersCount')) document.getElementById('repOrdersCount').innerText = completed.length;
    if (document.getElementById('repTotalCash')) document.getElementById('repTotalCash').innerText = totalCash.toLocaleString('ar-IQ');
    if (document.getElementById('repTotalVisa')) document.getElementById('repTotalVisa').innerText = totalVisa.toLocaleString('ar-IQ');
    if (document.getElementById('repTotalDelivery')) document.getElementById('repTotalDelivery').innerText = totalDelivery.toLocaleString('ar-IQ');
    if (document.getElementById('repNetFood')) document.getElementById('repNetFood').innerText = netFood.toLocaleString('ar-IQ');
    if (document.getElementById('repTotalExpenses')) document.getElementById('repTotalExpenses').innerText = totalExp.toLocaleString('ar-IQ');
    if (document.getElementById('repNetCashBox')) document.getElementById('repNetCashBox').innerText = Math.max(0, totalCash - totalExp).toLocaleString('ar-IQ');

    openDriverSettlementModal();
}

function openItemsReportModal() {
    const dateInput = document.getElementById('itemsReportDateInput');
    if (dateInput) {
        dateInput.value = getTodayString();
        renderItemsReport(getTodayString());
    }
    openModal('itemsReportModal');
}

function renderItemsReport(targetDate) {
    const completed = (getData('sys_completed_orders') || []).filter(o => o.dateDate === targetDate);
    let itemsMap = {};
    let grandQty = 0;

    completed.forEach(o => {
        if (o.items && Array.isArray(o.items)) {
            o.items.forEach(i => {
                const qty = cleanPrice(i.qty);
                const price = cleanPrice(i.price);
                if (!itemsMap[i.name]) itemsMap[i.name] = { qty: 0, total: 0 };
                itemsMap[i.name].qty += qty;
                itemsMap[i.name].total += (price * qty);
                grandQty += qty;
            });
        }
    });

    if (document.getElementById('itemsReportDateText')) document.getElementById('itemsReportDateText').innerText = "جرد يوم: " + targetDate;
    if (document.getElementById('repTotalItemsQty')) document.getElementById('repTotalItemsQty').innerText = grandQty + " قطعة";

    const container = document.getElementById('repItemsSoldListDetail');
    if (!container) return;

    if (Object.keys(itemsMap).length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#777; padding:15px;">لا توجد وجبات مباعة بهذا التاريخ</p>`;
        return;
    }

    container.innerHTML = Object.keys(itemsMap).map(name => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#181822; padding:6px 10px; border-radius:6px; margin-bottom:4px;">
            <strong style="color:#fff;">● ${name}</strong>
            <div>
                <span style="color:var(--gold-bright); font-weight:bold;">${itemsMap[name].qty} قطعة</span>
                <span style="color:#888; font-size:0.75rem;"> (${itemsMap[name].total.toLocaleString()} د.ع)</span>
            </div>
        </div>
    `).join('');
}

function exportItemsReportPDFAndWhatsApp() {
    const targetDate = document.getElementById('itemsReportDateInput')?.value || getTodayString();
    const completed = (getData('sys_completed_orders') || []).filter(o => o.dateDate === targetDate);
    let itemsMap = {};
    let grandQty = 0;

    completed.forEach(o => {
        if (o.items && Array.isArray(o.items)) {
            o.items.forEach(i => {
                const qty = cleanPrice(i.qty);
                const price = cleanPrice(i.price);
                if (!itemsMap[i.name]) itemsMap[i.name] = { qty: 0, total: 0 };
                itemsMap[i.name].qty += qty;
                itemsMap[i.name].total += (price * qty);
                grandQty += qty;
            });
        }
    });

    let msg = `📦 *تقرير جرد الوجبات المباعة - مطعم MIM89*\n📅 *التاريخ:* ${targetDate}\n📊 *إجمالي القطع المباعة:* ${grandQty} قطعة\n----------------------------------\n`;
    Object.keys(itemsMap).forEach(name => {
        msg += `• *${name}:* ${itemsMap[name].qty} قطعة (${itemsMap[name].total.toLocaleString()} د.ع)\n`;
    });

    window.open(`https://api.whatsapp.com/send?phone=9647750008630&text=${encodeURIComponent(msg)}`, '_blank');
}

function openShiftReportModal() {
    const cashierName = activeCashierUser ? activeCashierUser.name : 'الرئيسي';
    const startTime = sessionStorage.getItem('shift_start_time') || '--:--';
    // 🕐 [إصلاح] الحساب يبدأ من لحظة بدء الشيفت الحالي فقط، وليس من بداية اليوم بالكامل،
    // حتى لا يرى الكاشير الثاني مبيعات الكاشير الذي قبله عند التناوب بنفس اليوم.
    const shiftStartTs = cleanPrice(sessionStorage.getItem('shift_start_timestamp')) || 0;

    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();
    const todayOrders = completed.filter(o =>
        o.dateDate === today &&
        (!shiftStartTs || cleanPrice(o.createdTimestamp) >= shiftStartTs)
    );
    const expenses = (getData('sys_expenses') || []).filter(e =>
        e.dateDate === today &&
        (!shiftStartTs || cleanPrice(e.createdTimestamp) >= shiftStartTs)
    );

    let totalSales = 0, totalCash = 0, totalVisa = 0, totalExp = 0;

    todayOrders.forEach(o => {
        const amt = cleanPrice(o.totalAmount);
        totalSales += amt;
        if (o.paymentMethod && o.paymentMethod.includes('فيزا')) {
            totalVisa += amt;
        } else {
            totalCash += amt;
        }
    });

    expenses.forEach(e => totalExp += cleanPrice(e.amount));

    if (document.getElementById('shiftCashierName')) document.getElementById('shiftCashierName').innerText = cashierName;
    if (document.getElementById('shiftStartTime')) document.getElementById('shiftStartTime').innerText = startTime;
    if (document.getElementById('shiftOrdersCount')) document.getElementById('shiftOrdersCount').innerText = todayOrders.length;
    if (document.getElementById('shiftGrandTotal')) document.getElementById('shiftGrandTotal').innerText = totalSales.toLocaleString('ar-IQ');
    if (document.getElementById('shiftTotalCash')) document.getElementById('shiftTotalCash').innerText = totalCash.toLocaleString('ar-IQ');
    if (document.getElementById('shiftTotalVisa')) document.getElementById('shiftTotalVisa').innerText = totalVisa.toLocaleString('ar-IQ');
    if (document.getElementById('shiftTotalExpenses')) document.getElementById('shiftTotalExpenses').innerText = totalExp.toLocaleString('ar-IQ');
    if (document.getElementById('shiftNetDrawerCash')) document.getElementById('shiftNetDrawerCash').innerText = Math.max(0, totalCash - totalExp).toLocaleString('ar-IQ');

    openModal('shiftReportModal');
}

function confirmCloseShiftAndLogout() {
    if (confirm("هل أنت متأكد من إغلاق الشيفت وتسليم الصندوق الخزينة؟")) {
        sessionStorage.clear();
        location.reload();
    }
}

/* ==========================================
   10. التنبيهات الصوتية ومراقبة الطلبات الواردة
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
                const phone = String(lastIncomingCall.phone || lastIncomingCall.customerPhone || lastIncomingCall.number || lastIncomingCall.caller || 'رقم غير معروف');
                const name = String(lastIncomingCall.customerName || lastIncomingCall.name || 'مكالمة واردة');
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
    const itemsList = Array.isArray(ord.items) ? ord.items : (Array.isArray(ord.cart) ? ord.cart : []);
    const total = (ord.totalAmount !== undefined && ord.totalAmount !== null) ? cleanPrice(ord.totalAmount).toLocaleString('ar-IQ') : '0';

    const rawPhone = String(ord.phone || ord.customerPhone || ord.number || ord.caller || ord.from || 'بدون رقم');
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
                    ? itemsList.map(i => `<li>${i.name} × ${i.qty || i.quantity || 1} ${i.customNotes ? ' <small style="color:var(--gold-bright);">('+i.customNotes+')</small>' : ''}</li>`).join('') 
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
        orders = orders.filter(o => String(o.id) !== String(orderId) && String(o.docId) !== String(docId));
        setData('sys_live_orders', orders);
        
        const card = document.getElementById(`order_card_${docId}`) || document.getElementById(`order_card_${orderId}`);
        if (card) card.remove();
        
        listenForIncomingOrders();
    }
}

/* ==========================================
   11. لوحة جرد المخزن (inventory.html)
   ========================================== */

function deductInventoryFromRecipe(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    let inventory = getData('sys_inventory');
    const allMenuItems = getData('sys_items');

    items.forEach(cartItem => {
        const menuItem = allMenuItems.find(m => String(m.id) === String(cartItem.id) || cleanPrice(m.id) === cleanPrice(cartItem.id));
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
        if (document.getElementById('authOverlay')) document.getElementById('authOverlay').style.display = 'none';
        if (document.getElementById('invMainApp')) document.getElementById('invMainApp').style.display = 'block';
        renderInventoryTable();
    } else {
        if (document.getElementById('authError')) document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
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
   12. لوحة تحكم الإدارة الكاملة Admin (admin.html)
   ========================================== */

function initAdminPage() {
    initData();
    // 🌱🔧 إصلاح ومزامنة تلقائية: تزرع فقط الوجبات الافتراضية الناقصة من Firebase
    // (اللي مو موجودة أصلاً بقاعدة البيانات) — تتحقق أول قبل الكتابة فلا تمس
    // ولا تُرجع أي وجبة موجودة أو مُعدَّلة مسبقاً إلى قيمها القديمة إطلاقاً.
    setTimeout(() => {
        if (typeof db !== 'undefined' && db) {
            DEFAULT_DATA.items.forEach(defItem => {
                const ref = db.collection("menu_items").doc(String(defItem.id));
                ref.get().then(docSnap => {
                    if (!docSnap.exists) {
                        ref.set(defItem, { merge: true }).catch(()=>{});
                    }
                }).catch(()=>{});
            });
        }
    }, 1500);
}

function loginAdmin() {
    const pass = document.getElementById('adminPassInput')?.value.trim();
    const validAdminPass = getSystemPassword('admin');

    if (pass === validAdminPass || pass === "admin123" || pass === "123") {
        if (document.getElementById('authOverlay')) document.getElementById('authOverlay').style.display = 'none';
        if (document.getElementById('adminMainApp')) document.getElementById('adminMainApp').style.display = 'block';
        loadAdminTabsData();
    } else {
        if (document.getElementById('authError')) document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
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
    let items = getData('sys_items') || [];
    let item = items.find(i => String(i.id) === String(id) || String(i.docId) === String(id));

    if (item) {
        if (field === 'price') {
            item.price = cleanPrice(value) || 0;
        } else if (field === 'categoryId') {
            item.categoryId = cleanPrice(value);
            item.catId = cleanPrice(value);
            item.category = cleanPrice(value);
        } else {
            item[field] = typeof value === 'string' ? value.trim() : value;
        }

        item.updatedAt = Date.now();
        localStorage.setItem('sys_items', JSON.stringify(items));

        if (db) {
            db.collection("menu_items").doc(String(id)).set(item, { merge: true })
                .catch(err => {
                    console.error("Cloud inline update error:", err);
                    showCloudErrorBanner(translateFirestoreError(err));
                });
        }

        notifyMenuUpdated();
    }
}

function renderAdminItems() {
    const items = getData('sys_items');
    const categories = getData('sys_categories');
    const tbody = document.getElementById('adminItemsTable');

    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const cat = categories.find(c => cleanPrice(c.id) === getItemCategory(item));
        return `
            <tr>
                <td style="text-align:center;">
                    <img src="${item.image || item.img}" width="45" height="45" style="object-fit:cover; border-radius:6px; cursor:pointer;" onclick="triggerInlineImageUpload('${item.id}')" title="اضغط لتغيير الصورة مباشرة">
                </td>
                <td>
                    <input type="text" value="${item.name}" class="gold-input-inline" onchange="updateItemInline('${item.id}', 'name', this.value)" style="font-weight:bold;">
                </td>
                <td><span style="font-size:0.8rem; color:#aaa;">${cat ? cat.name : '-'}</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <input type="number" value="${cleanPrice(item.price)}" class="gold-input-inline" onchange="updateItemInline('${item.id}', 'price', this.value)" style="color:#ffd700; font-weight:bold; width:100px;">
                        <small style="color:#aaa;">د.ع</small>
                    </div>
                </td>
                <td>
                    <button onclick="editItem('${item.id}')" class="gold-btn btn-sm" style="padding:4px 8px; font-size:0.75rem;">تعديل كامل</button>
                    <button onclick="deleteItem('${item.id}')" class="gold-btn btn-danger btn-sm" style="padding:4px 8px; font-size:0.75rem;">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAdminCategories() {
    const categories = getData('sys_categories') || [];
    const selectEl = document.getElementById('itemCategory');
    if (!selectEl) return;

    selectEl.innerHTML = categories.map(c => 
        `<option value="${c.id}">${c.name}</option>`
    ).join('');
}

// 💾 حفظ وتعديل الصنف مع البث السحابي المباشر لكل الأجهزة
function saveItem() {
    const editId = document.getElementById('editItemId')?.value;
    const id = editId ? String(editId) : 'item_' + Date.now();
    const name = document.getElementById('itemName')?.value.trim();
    const price = cleanPrice(document.getElementById('itemPrice')?.value);
    const categoryId = cleanPrice(document.getElementById('itemCategory')?.value || 1);
    const image = document.getElementById('itemImage')?.value || document.getElementById('imgPreview')?.src || 'https://via.placeholder.com/150';
    const ingredients = document.getElementById('itemIngredients')?.value.trim() || '';

    if (!name || !price) {
        alert("⚠️ يرجى كتابة اسم الصنف والسعر بشكل صحيح!");
        return;
    }

    const itemData = {
        id: id,
        docId: id,
        name: name,
        price: price,
        categoryId: categoryId,
        catId: categoryId,
        category: categoryId,
        image: image,
        ingredients: ingredients,
        updatedAt: Date.now()
    };

    let items = getData('sys_items') || [];
    const index = items.findIndex(i => String(i.id) === String(id) || String(i.docId) === String(id));
    if (index !== -1) {
        items[index] = itemData;
    } else {
        items.unshift(itemData);
    }
    localStorage.setItem('sys_items', JSON.stringify(items));

    if (db) {
        // ⚠️ ملاحظة مهمة: مع تفعيل الحفظ دون اتصال، وعد set() قد ينجح محلياً حتى لو رفضه الخادم.
        // لذلك ننتظر تأكيد الخادم الفعلي (hasPendingWrites === false) قبل إعلان النجاح.
        const itemRef = db.collection("menu_items").doc(String(id));
        let ackDone = false;

        const ackTimer = setTimeout(() => {
            if (!ackDone) {
                ackDone = true;
                if (typeof unsubAck === 'function') unsubAck();
                showCloudErrorBanner("لم يصل تأكيد من خوادم Firebase خلال 12 ثانية.\nتحقق من الإنترنت أو من قواعد الأمان (Rules).");
            }
        }, 12000);

        const unsubAck = itemRef.onSnapshot({ includeMetadataChanges: true }, snap => {
            if (!ackDone && snap.metadata && snap.metadata.hasPendingWrites === false) {
                ackDone = true;
                clearTimeout(ackTimer);
                unsubAck();
                localStorage.setItem('mim89_last_menu_update', Date.now());
                refreshActiveUI();
                resetItemForm();
                alert("🎉 تم حفظ الصنف ورفعه للسحابة بنجاح! سيظهر على الكاشير والمينيو الإلكتروني خلال ثوانٍ.");
            }
        }, err => {
            if (!ackDone) {
                ackDone = true;
                clearTimeout(ackTimer);
                showCloudErrorBanner(translateFirestoreError(err));
            }
        });

        itemRef.set(itemData, { merge: true }).catch(e => {
            if (!ackDone) {
                ackDone = true;
                clearTimeout(ackTimer);
                if (typeof unsubAck === 'function') unsubAck();
                showCloudErrorBanner(translateFirestoreError(e));
            }
        });
    } else {
        refreshActiveUI();
        resetItemForm();
        alert("تم الحفظ محلياً.");
    }
}

function editItem(id) {
    const items = getData('sys_items') || [];
    const item = items.find(i => String(i.id) === String(id) || String(i.docId) === String(id));
    if (!item) return;

    renderAdminCategories();

    document.getElementById('editItemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = getItemCategory(item);
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('imgPreview').src = item.image || 'https://via.placeholder.com/150';
    document.getElementById('itemIngredients').value = item.ingredients || '';
    document.getElementById('itemFormTitle').innerText = "تعديل صنف: " + item.name;
    
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
        let items = getData('sys_items').filter(i => String(i.id) !== String(id) && String(i.docId) !== String(id));
        localStorage.setItem('sys_items', JSON.stringify(items));
        
        if (db) {
            db.collection("menu_items").doc(String(id)).delete().catch(console.error);
        }
        renderAdminItems();
        notifyMenuUpdated();
    }
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
    const name = document.getElementById('cashierNameInput')?.value;
    const pass = document.getElementById('cashierPassNew')?.value;
    if (!name || !pass) return alert("أدخل الاسم وكلمة المرور");

    const cashiers = getData('sys_cashiers');
    cashiers.push({ id: 'c_' + Date.now(), name, password: pass });
    setData('sys_cashiers', cashiers);

    if (document.getElementById('cashierNameInput')) document.getElementById('cashierNameInput').value = '';
    if (document.getElementById('cashierPassNew')) document.getElementById('cashierPassNew').value = '';
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
    const adminPass = document.getElementById('newAdminPass')?.value.trim();
    const costingPass = document.getElementById('newCostingPass')?.value.trim();
    const invPass = document.getElementById('newInvPass')?.value.trim();
    const cashierPass = document.getElementById('newCashierPass')?.value.trim();

    let passes = getData('sys_passwords') || {};

    if (adminPass) passes.admin = adminPass;
    if (costingPass) passes.costing = costingPass;
    if (invPass) passes.inventory = invPass;
    if (cashierPass) passes.cashier = cashierPass;

    setData('sys_passwords', passes);
    alert("🔒 تم تحديث وتأمين كلمات المرور لكل أقسام النظام بنجاح!");
}

/* ==========================================
   13. التصدير والاسترجاع التلقائي للنسخ الاحتياطية
   ========================================== */

function exportFullSystemBackup() {
    try {
        const fullBackup = {
            version: "v31.0-MIM89",
            backupDate: new Date().toLocaleString('ar-IQ'),
            timestamp: Date.now(),
            categories: getData('sys_categories'),
            items: getData('sys_items'),
            inventory: getData('sys_inventory'),
            customers: getData('sys_customers'),
            drivers: getData('sys_drivers'),
            cashiers: getData('sys_cashiers'),
            expenses: getData('sys_expenses'),
            completedOrders: getData('sys_completed_orders'),
            passwords: getData('sys_passwords')
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
                    if (backup.items) localStorage.setItem('sys_items', JSON.stringify(backup.items));
                    if (backup.inventory) setData('sys_inventory', backup.inventory);
                    if (backup.customers) setData('sys_customers', backup.customers);
                    if (backup.drivers) setData('sys_drivers', backup.drivers);
                    if (backup.cashiers) setData('sys_cashiers', backup.cashiers);
                    if (backup.expenses) setData('sys_expenses', backup.expenses);
                    if (backup.completedOrders) setData('sys_completed_orders', backup.completedOrders);
                    if (backup.passwords) setData('sys_passwords', backup.passwords);

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
   14. مزايا إضافية: السائقين، ملاحظات المطبخ، أوقات العمل، النفاد، الكوبونات
   ========================================== */

// 🛵 إضافة سائق دليفري جديد من لوحة الإدارة
function saveDeliveryDriver() {
    const nameInput = document.getElementById('driverNameInput');
    const phoneInput = document.getElementById('driverPhoneInput');
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!name) return alert("⚠️ يرجى إدخال اسم السائق على الأقل!");

    const drivers = getData('sys_drivers') || [];
    drivers.push({ id: 'drv_' + Date.now(), name: name, phone: phone || '' });
    setData('sys_drivers', drivers);

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    if (typeof renderAdminDrivers === 'function') renderAdminDrivers();
    alert("✅ تم إضافة السائق بنجاح!");
}

// ✏️ محرر ملاحظات المطبخ السريعة
function openKitchenNotesManagerModal() {
    renderKitchenNotesList();
    openModal('kitchenNotesManagerModal');
}

function renderKitchenNotesList() {
    const container = document.getElementById('kitchenNotesListTable');
    if (!container) return;

    const notes = getData('sys_quick_kitchen_notes') || [];
    if (notes.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#777; padding:10px;">لا توجد ملاحظات مسجلة حالياً</p>`;
        return;
    }

    container.innerHTML = notes.map((n, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#181822; padding:6px 10px; border-radius:6px; margin-bottom:4px;">
            <span style="color:#fff; font-size:0.85rem;">${n}</span>
            <button onclick="deleteKitchenNoteItem(${idx})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1rem;">✕</button>
        </div>
    `).join('');
}

function addKitchenNoteItem() {
    const input = document.getElementById('newKitchenNoteInput');
    const text = input ? input.value.trim() : '';
    if (!text) return alert("⚠️ اكتب نص الملاحظة أولاً!");

    let notes = getData('sys_quick_kitchen_notes') || [];
    notes.push(text);
    setData('sys_quick_kitchen_notes', notes);

    if (input) input.value = '';
    renderKitchenNotesList();
}

function deleteKitchenNoteItem(index) {
    let notes = getData('sys_quick_kitchen_notes') || [];
    notes.splice(index, 1);
    setData('sys_quick_kitchen_notes', notes);
    renderKitchenNotesList();
}

// 🕐 إدارة أوقات فتح وإغلاق استقبال الطلبات
function openWorkingHoursModal() {
    const settings = getData('sys_working_hours') || { open: "10:00", close: "23:59", enabled: false };
    if (document.getElementById('workHoursOpenInput')) document.getElementById('workHoursOpenInput').value = settings.open;
    if (document.getElementById('workHoursCloseInput')) document.getElementById('workHoursCloseInput').value = settings.close;
    if (document.getElementById('workHoursEnabledCheckbox')) document.getElementById('workHoursEnabledCheckbox').checked = !!settings.enabled;
    openModal('workingHoursModal');
}

function saveWorkingHours() {
    const open = document.getElementById('workHoursOpenInput')?.value || "10:00";
    const close = document.getElementById('workHoursCloseInput')?.value || "23:59";
    const enabled = document.getElementById('workHoursEnabledCheckbox')?.checked || false;

    setData('sys_working_hours', { open, close, enabled });
    alert("✅ تم حفظ أوقات الفتح والإغلاق بنجاح!");
    closeModal('workingHoursModal');
}

// يتحقق هل المطعم يستقبل طلبات بالوقت الحالي (يفيد بالمينيو الإلكتروني)
function isRestaurantCurrentlyOpen() {
    const settings = getData('sys_working_hours') || { open: "10:00", close: "23:59", enabled: false };
    if (!settings.enabled) return true;

    const now = new Date();
    const [oh, om] = String(settings.open).split(':').map(Number);
    const [ch, cm] = String(settings.close).split(':').map(Number);
    const openMinutes = (oh || 0) * 60 + (om || 0);
    const closeMinutes = (ch || 0) * 60 + (cm || 0);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (closeMinutes > openMinutes) {
        return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
    } else {
        return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }
}

// 🚫 إدارة الوجبات النافذة/المنتهية مؤقتاً
function openOutofStockModal() {
    renderOutOfStockList();
    openModal('outOfStockModal');
}

function renderOutOfStockList() {
    const container = document.getElementById('outOfStockListContainer');
    if (!container) return;

    const items = getData('sys_items') || [];
    const outIds = getData('sys_out_of_stock') || [];

    if (items.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#777; padding:10px;">لا توجد أصناف بالمينيو حالياً</p>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const isOut = outIds.some(id => String(id) === String(item.id));
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#181822; padding:6px 10px; border-radius:6px; margin-bottom:4px;">
                <span style="color:#fff; font-size:0.82rem;">${item.name}</span>
                <button onclick="toggleItemStockStatus('${item.id}')" class="gold-btn btn-sm" style="width:auto; padding:4px 10px; background:${isOut ? 'var(--danger)' : 'var(--success)'}; color:#fff; border:none;">
                    ${isOut ? '🚫 نافذ (اضغط للإرجاع)' : '✅ متوفر (اضغط لتحديد النفاد)'}
                </button>
            </div>
        `;
    }).join('');
}

function toggleItemStockStatus(itemId) {
    let outIds = getData('sys_out_of_stock') || [];
    const idx = outIds.findIndex(id => String(id) === String(itemId));
    if (idx !== -1) {
        outIds.splice(idx, 1);
    } else {
        outIds.push(itemId);
    }
    setData('sys_out_of_stock', outIds);
    renderOutOfStockList();
    notifyMenuUpdated();
}

function isItemOutOfStock(itemId) {
    const outIds = getData('sys_out_of_stock') || [];
    return outIds.some(id => String(id) === String(itemId));
}

// 🏷️ إدارة الكوبونات وأكواد الخصم
function openCouponsManagerModal() {
    renderCouponsList();
    openModal('couponsManagerModal');
}

function renderCouponsList() {
    const container = document.getElementById('couponsListContainer');
    if (!container) return;

    const coupons = getData('sys_coupons') || [];
    if (coupons.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#777; padding:10px;">لا توجد كوبونات مسجلة حالياً</p>`;
        return;
    }

    container.innerHTML = coupons.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#181822; padding:6px 10px; border-radius:6px; margin-bottom:4px;">
            <div>
                <strong style="color:var(--gold-bright, #ffd700);">${c.code}</strong>
                <span style="font-size:0.75rem; color:#aaa;"> - ${c.type === 'percent' ? cleanPrice(c.value) + '%' : cleanPrice(c.value).toLocaleString('ar-IQ') + ' د.ع'}</span>
            </div>
            <button onclick="deleteCouponItem('${c.code}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1rem;">✕</button>
        </div>
    `).join('');
}

function addNewCoupon() {
    const codeInput = document.getElementById('newCouponCodeInput');
    const typeSelect = document.getElementById('newCouponTypeSelect');
    const valueInput = document.getElementById('newCouponValueInput');

    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    const type = typeSelect ? typeSelect.value : 'percent';
    const value = cleanPrice(valueInput ? valueInput.value : 0);

    if (!code) return alert("⚠️ أدخل كود الكوبون!");
    if (value <= 0) return alert("⚠️ أدخل قيمة الخصم بشكل صحيح!");

    let coupons = getData('sys_coupons') || [];
    if (coupons.some(c => c.code === code)) return alert("⚠️ هذا الكود مستخدم مسبقاً!");

    coupons.push({ code: code, type: type, value: value, active: true });
    setData('sys_coupons', coupons);

    if (codeInput) codeInput.value = '';
    if (valueInput) valueInput.value = '';
    renderCouponsList();
}

function deleteCouponItem(code) {
    if (confirm("هل تريد حذف هذا الكوبون؟")) {
        let coupons = getData('sys_coupons') || [];
        coupons = coupons.filter(c => c.code !== code);
        setData('sys_coupons', coupons);
        renderCouponsList();
    }
}

// 🏷️ تطبيق كوبون خصم مباشرة على فاتورة الكاشير الحالية
function applyCouponAtCashier() {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    if (subtotal === 0) return alert("السلة فارغة!");

    if (activeDiscountType === 'coupon') {
        clearAllDiscounts();
        return;
    }

    const codeRaw = prompt("أدخل كود الكوبون:");
    if (!codeRaw) return;
    const code = codeRaw.trim().toUpperCase();

    const coupons = getData('sys_coupons') || [];
    const found = coupons.find(c => c.code === code && c.active);
    if (!found) return alert("⚠️ الكود غير صحيح أو غير مفعّل!");

    activeDiscountType = 'coupon';
    posDiscountAmount = found.type === 'percent' ? (subtotal * cleanPrice(found.value)) / 100 : cleanPrice(found.value);
    updateDiscountUIState('coupon', `🏷️ كوبون ${found.code}`);
    renderPosCart();
}

/* ==========================================
   15. النوافذ المنبثقة والدوال المساعدة General Helpers
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
            const itemImgInput = document.getElementById('itemImage');
            
            if (preview) preview.src = compressedBase64;
            if (itemImgInput) itemImgInput.value = compressedBase64;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.addEventListener('storage', (event) => {
    if (event.key === 'sys_items' || event.key === 'sys_categories' || event.key === 'mim89_last_menu_update') {
        refreshActiveUI();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
