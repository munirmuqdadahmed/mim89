// ==========================================
// app.js - MIM89 FAST FOOD - v32.0
// الجزء 1: الأساسيات + Firebase + الأمان + PIN
// ==========================================

// منع القائمة عند الضغط بالزر الأيمن
document.addEventListener('contextmenu', event => event.preventDefault());

// منع اختصارات أدوات المطورين
document.addEventListener('keydown', event => {
    if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['I','J','C'].includes(event.key.toUpperCase())) ||
        (event.ctrlKey && event.key.toUpperCase() === 'U')
    ) { event.preventDefault(); }
});

const MIM89_VERSION     = "1100";
const MIM89_APP_VERSION = '1600';

/* ==========================================
   المتغيرات العامة
   ========================================== */
let db                      = null;
let activeCashierUser       = null;
let posCart                 = [];
let selectedPosOrderType    = 'dine_in';
let selectedPosPaymentMethod= 'cash';
let activeDiscountType      = null;
let posDiscountAmount       = 0;
let currentPercentValue     = 0;
let cart                    = [];
let activePendingPrintOrder = null;
let lastCompletedOrder      = null;
let isCustomerPrinted       = false;
let isKitchenPrinted        = false;
let currentUploadedBase64   = "";
let currentDetailItem       = null;
let currentPosCategory      = 'all';

/* ==========================================
   🔐 نظام PIN الأمان الموحد
   ========================================== */

// إنشاء لوحة PIN لمسية
function createPinOverlay(opts) {
    const {
        title      = 'تأكيد الهوية',
        subtitle   = 'أدخل رمز المرور',
        logo       = '🔐',
        pinLength  = 4,
        onSuccess,
        onCancel,
        validateFn  // دالة تتحقق من صحة الرمز
    } = opts;

    // إزالة أي لوحة سابقة
    const old = document.getElementById('_pinOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = '_pinOverlay';
    overlay.className = 'pin-overlay';

    overlay.innerHTML = `
        <div class="pin-card">
            <div class="pin-logo">${logo}</div>
            <h2>${title}</h2>
            <p>${subtitle}</p>
            <div class="pin-dots" id="_pinDots">
                ${Array(pinLength).fill('<span class="pin-dot"></span>').join('')}
            </div>
            <div class="pin-keypad">
                <button class="pin-key" data-n="3">3</button>
                <button class="pin-key" data-n="2">2</button>
                <button class="pin-key" data-n="1">1</button>
                <button class="pin-key" data-n="6">6</button>
                <button class="pin-key" data-n="5">5</button>
                <button class="pin-key" data-n="4">4</button>
                <button class="pin-key" data-n="9">9</button>
                <button class="pin-key" data-n="8">8</button>
                <button class="pin-key" data-n="7">7</button>
                <button class="pin-key pin-enter" data-n="enter">✓</button>
                <button class="pin-key" data-n="0">0</button>
                <button class="pin-key pin-clear" data-n="clear">⌫</button>
            </div>
            <div class="pin-error-msg" id="_pinError"></div>
            ${onCancel ? '<button onclick="closePinOverlay()" style="margin-top:12px; background:none; border:none; color:#666; font-size:0.8rem; cursor:pointer; font-family:Tajawal,sans-serif;">إلغاء</button>' : ''}
        </div>
    `;

    document.body.appendChild(overlay);

    let entered = '';

    function updateDots() {
        const dots = document.querySelectorAll('#_pinDots .pin-dot');
        dots.forEach((d, i) => {
            d.classList.toggle('filled', i < entered.length);
            d.classList.remove('error');
        });
        document.getElementById('_pinError').innerText = '';
    }

    function showError(msg) {
        const dots = document.querySelectorAll('#_pinDots .pin-dot');
        dots.forEach(d => {
            d.classList.remove('filled');
            d.classList.add('error');
        });
        document.getElementById('_pinError').innerText = msg;
        setTimeout(() => {
            dots.forEach(d => d.classList.remove('error'));
            entered = '';
            updateDots();
        }, 900);
    }

    function handleKey(n) {
        if (n === 'clear') {
            entered = entered.slice(0, -1);
            updateDots();
            return;
        }
        if (n === 'enter') {
            if (entered.length < 1) return;
            if (validateFn) {
                const result = validateFn(entered);
                if (result === true) {
                    closePinOverlay();
                    if (onSuccess) onSuccess();
                } else {
                    showError(result || 'رمز خاطئ!');
                }
            }
            return;
        }
        if (entered.length >= pinLength) return;
        entered += String(n);
        updateDots();

        // إذا اكتمل الرمز يُرسل تلقائياً
        if (entered.length === pinLength) {
            setTimeout(() => handleKey('enter'), 180);
        }
    }

    overlay.querySelectorAll('.pin-key').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 150);
            handleKey(btn.dataset.n);
        });
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            btn.classList.add('pressed');
        }, { passive: false });
        btn.addEventListener('touchend', e => {
            e.preventDefault();
            btn.classList.remove('pressed');
            handleKey(btn.dataset.n);
        }, { passive: false });
    });

    // دعم لوحة المفاتيح الفعلية
    overlay._keyHandler = (e) => {
        if (e.key >= '0' && e.key <= '9') handleKey(e.key);
        else if (e.key === 'Enter')     handleKey('enter');
        else if (e.key === 'Backspace') handleKey('clear');
        else if (e.key === 'Escape' && onCancel) closePinOverlay();
    };
    document.addEventListener('keydown', overlay._keyHandler);
}

function closePinOverlay() {
    const overlay = document.getElementById('_pinOverlay');
    if (overlay) {
        document.removeEventListener('keydown', overlay._keyHandler);
        overlay.remove();
    }
}

// طلب PIN المالك قبل عملية حساسة
function requireOwnerPin(actionName, onApproved) {
    createPinOverlay({
        title:    'تأكيد المالك مطلوب',
        subtitle: 'أدخل رمز المالك للموافقة على: ' + actionName,
        logo:     '🔒',
        pinLength: 6,
        onSuccess: onApproved,
        onCancel:  true,
        validateFn: (pin) => {
            if (verifySystemPassword('costing', pin) ||
                verifySystemPassword('admin', pin)) {
                logAudit('موافقة المالك', { action: actionName });
                return true;
            }
            return 'رمز المالك غير صحيح!';
        }
    });
}

// طلب PIN الأدمن
function requireAdminPin(actionName, onApproved) {
    createPinOverlay({
        title:    'تأكيد الأدمن',
        subtitle: 'أدخل رمز الأدمن للمتابعة',
        logo:     '🛡️',
        pinLength: 4,
        onSuccess: onApproved,
        onCancel:  true,
        validateFn: (pin) => {
            if (verifySystemPassword('admin', pin)) return true;
            return 'رمز الأدمن غير صحيح!';
        }
    });
}

/* ==========================================
   🔥 Firebase والاتصال السحابي
   ========================================== */
const DEFAULT_DATA = {
    passwords: {
        admin:     "1234",
        inventory: "2345",
        costing:   "9999",
        cashier:   "1111"
    },
    printerSettings: {
        enableIpPrinting: true,
        cashierIp:  "192.168.0.218",
        kitchen1Ip: "192.168.0.200",
        kitchen2Ip: "",
        port:       "9100"
    },
    // 🧾 تصميم فاتورة الزبون - قابل للتحكم الكامل من الأدمن
    invoiceDesign: {
        restaurantName:   "MIM89 FAST FOOD",
        addressLine:      "بغداد - حي القاهرة",
        footerText:       "شكراً لزيارتكم 🍔",
        logoDataUrl:      "",
        paperWidth:       "80",   // "58" أو "80" (مم)
        showLogo:         false,
        showAddress:      true,
        showPhone:        true,
        showCustomerName: true,
        showDriverArea:   true,
        showOrderNotes:   true,
        showItemNotes:    true
    },
    cashiers: [
        { id: "c1", name: "الكاشير الرئيسي", pin: "1111" }
    ],
    employees: [],
    drivers:   [],
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
        { name: "القاهرة",  price: 0    },
        { name: "البنوك",   price: 2000 },
        { name: "الأعظمية",price: 3000 },
        { name: "الشعب",   price: 2500 }
    ],
    inventory: [],
    items:     []
};

// 🔥 تهيئة Firebase
try {
    const firebaseConfig = {
        apiKey:            "AIzaSyAGpEDu0Sm2zG0AcG31XnudmC7wLsipqvI",
        authDomain:        "mim89-ff938.firebaseapp.com",
        projectId:         "mim89-ff938",
        storageBucket:     "mim89-ff938.firebasestorage.app",
        messagingSenderId: "8207632733",
        appId:             "1:8207632733:web:49cd53fe5dbf26216b80b4",
        measurementId:     "G-D9GK0G77ZD"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        if (localStorage.getItem('mim89_disable_persistence') !== '1') {
            db.enablePersistence({ synchronizeTabs: true }).catch(err => {
                console.log("Persistence:", err.code);
            });
        }
    }
} catch (e) {
    console.warn("Firebase init error:", e);
}

/* ==========================================
   🧮 دوال المساعدة
   ========================================== */

// 🛠️ إصلاح: cleanPrice تحافظ على الكسور العشرية
function cleanPrice(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    // تحويل الأرقام العربية
    let str = String(val)
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
        .replace(/[^0-9.]/g, '');
    // نحتفظ بأول نقطة عشرية فقط
    const parts = str.split('.');
    if (parts.length > 2) str = parts[0] + '.' + parts.slice(1).join('');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// قراءة قسم الصنف
function getItemCategory(item) {
    if (!item) return 0;
    const raw = item.categoryId !== undefined ? item.categoryId
              : item.catId      !== undefined ? item.catId
              : item.category;
    return cleanPrice(raw);
}

// تطبيع الأسماء العربية للبحث
function normalizeArabicArea(str) {
    if (!str) return '';
    return str.toString()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/^ال/, '')
        .trim()
        .toLowerCase();
}

// تحديد اليوم الحقيقي للعمل (الشيفت الليلي)
const BUSINESS_DAY_CUTOFF_HOUR = 6;

function getBusinessDayString(dateObj) {
    // 🛠️ إصلاح: نستخدم توقيت بغداد (UTC+3) وليس UTC
    const d = dateObj ? new Date(dateObj) : new Date();
    const baghdadOffset = 3 * 60;
    const localOffset   = d.getTimezoneOffset();
    const baghdadTime   = new Date(d.getTime() + (baghdadOffset + localOffset) * 60000);

    if (baghdadTime.getHours() < BUSINESS_DAY_CUTOFF_HOUR) {
        baghdadTime.setDate(baghdadTime.getDate() - 1);
    }
    const y  = baghdadTime.getFullYear();
    const m  = String(baghdadTime.getMonth() + 1).padStart(2, '0');
    const dd = String(baghdadTime.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
}

function getTodayString() {
    return getBusinessDayString();
}

/* ==========================================
   💾 قراءة وكتابة البيانات المحلية
   ========================================== */
function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// 📛 المفاتيح التي لا تُرفع كمستند واحد (كبيرة الحجم)
const NEVER_PUSH_WHOLE = [
    'sys_completed_orders',
    'sys_live_orders',
    'sys_items'
];

// 🛟 حفظ آمن مع معالجة امتلاء الذاكرة
function safeLocalSet(key, jsonText) {
    try {
        localStorage.setItem(key, jsonText);
        return { ok: true };
    } catch (e) {
        const isQuota = e && (
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            String(e).includes('quota')
        );
        if (!isQuota) return { ok: false, error: e, quota: false };

        console.warn('⚠️ ذاكرة ممتلئة — جاري تحرير مساحة...');

        // تقليص الفواتير
        try {
            const orders = JSON.parse(localStorage.getItem('sys_completed_orders') || '[]');
            if (Array.isArray(orders) && orders.length > 150) {
                localStorage.setItem('sys_completed_orders', JSON.stringify(orders.slice(0, 150)));
            }
        } catch (_) {}

        // تقليص الشيفتات
        try {
            const arch = JSON.parse(localStorage.getItem('sys_shift_archive') || '[]');
            if (Array.isArray(arch) && arch.length > 30) {
                localStorage.setItem('sys_shift_archive', JSON.stringify(arch.slice(0, 30)));
            }
        } catch (_) {}

        try { localStorage.removeItem('sys_live_orders'); } catch (_) {}

        // محاولة ثانية
        try {
            localStorage.setItem(key, jsonText);
            return { ok: true, freed: true };
        } catch (_) {
            // حذف صور base64 المحلية (تبقى بالسحابة)
            try {
                const items = JSON.parse(localStorage.getItem('sys_items') || '[]');
                const light = items.map(it => {
                    const c = { ...it };
                    // 🛡️ لا نحذف الصورة إلا إذا تأكدنا أنها مرفوعة للسحابة
                    if (typeof c.image === 'string' &&
                        c.image.startsWith('data:') &&
                        c._imageUploaded) {
                        c.image = '';
                    }
                    return c;
                });
                localStorage.setItem('sys_items', JSON.stringify(light));
                localStorage.setItem(key, jsonText);
                return { ok: true, freed: true, droppedImages: true };
            } catch (e4) {
                return { ok: false, error: e4, quota: true };
            }
        }
    }
}

function setData(key, val) {
    const res = safeLocalSet(key, JSON.stringify(val));
    if (!res.ok && res.quota) {
        alert('⚠️ ذاكرة المتصفح ممتلئة!\nافتح الأدمن ← النسخ الاحتياطي ← تنظيف الذاكرة.');
    }
    if (db && NEVER_PUSH_WHOLE.indexOf(key) === -1) {
        try {
            db.collection("system_store").doc(key)
                .set({ content: JSON.stringify(val), updatedAt: Date.now() })
                .catch(err => {
                    console.error("Cloud setData error [" + key + "]:", err);
                    if (typeof showCloudErrorBanner === 'function')
                        showCloudErrorBanner(translateFirestoreError(err));
                });
        } catch (_) {}
    }
}

/* ==========================================
   🔑 كلمات المرور والتحقق
   ========================================== */
function getSystemPassword(type) {
    const sysPasses = getData('sys_passwords') || {};
    return sysPasses[type] || DEFAULT_DATA.passwords[type] || '1234';
}

function verifySystemPassword(type, input) {
    const entered = String(input || '').trim();
    if (!entered) return false;

    const all      = getData('sys_passwords') || {};
    const saved    = all[type];
    const fallback = (DEFAULT_DATA.passwords || {})[type];

    if (saved    && entered === String(saved))    return true;
    if (all.admin && entered === String(all.admin)) return true;

    // مفتاح طوارئ (يُعطَّل بعد ضبط الكلمات)
    if (localStorage.getItem('mim89_disable_recovery') !== '1') {
        if (fallback && entered === String(fallback)) return true;
    }
    return false;
}

async function updateAllSystemPasswords() {
    const adminPass   = document.getElementById('newAdminPass')?.value.trim();
    const costingPass = document.getElementById('newCostingPass')?.value.trim();
    const invPass     = document.getElementById('newInvPass')?.value.trim();
    const cashierPass = document.getElementById('newCashierPass')?.value.trim();

    if (!adminPass && !costingPass && !invPass && !cashierPass)
        return alert("⚠️ لم تُدخل أي رمز جديد.");

    const weak = ['0000','1111','1234','4321','0000','9999'];
    for (const p of [adminPass,costingPass,invPass,cashierPass].filter(Boolean)) {
        if (p.length < 4) return alert('⚠️ الرمز يجب أن يكون 4 أرقام على الأقل.');
        if (weak.includes(p)) return alert('⚠️ الرمز "' + p + '" ضعيف جداً. اختر رمزاً أصعب.');
    }

    let passes = getData('sys_passwords') || {};
    if (adminPass)   passes.admin     = adminPass;
    if (costingPass) passes.costing   = costingPass;
    if (invPass)     passes.inventory = invPass;
    if (cashierPass) passes.cashier   = cashierPass;

    const savedTs = Date.now();
    localStorage.setItem('sys_passwords', JSON.stringify(passes));
    localStorage.setItem('sys_passwords_ts', String(savedTs));

    let cloudOk = false;
    if (db) {
        try {
            await db.collection("system_store").doc('sys_passwords')
                .set({ content: JSON.stringify(passes), updatedAt: savedTs });
            cloudOk = true;
        } catch (e) { console.error(e); }
    }

    logAudit('تغيير كلمات المرور', { note: 'تم التغيير' });

    ['newAdminPass','newCostingPass','newInvPass','newCashierPass'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    alert(cloudOk
        ? '🔒 تم تحديث الرموز وحفظها على السحابة.'
        : '⚠️ حُفظت على هذا الجهاز فقط — تحقق من الإنترنت.');
}

/* ==========================================
   ☁️ المزامنة السحابية - مُصلحة
   ========================================== */

// 🛠️ إصلاح: نتحقق من fromCache قبل الكتابة
function setupCloudRealtimeSync() {
    if (!db) return;

    db.collection("menu_items").onSnapshot(
        { includeMetadataChanges: true },
        snapshot => {
            // تجاهل اللقطات الفارغة أو القادمة من الكاش
            if (snapshot.empty) return;
            if (snapshot.metadata && snapshot.metadata.fromCache) return;

            const cloudItems = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                cloudItems.push({
                    ...data,
                    docId:      doc.id,
                    id:         data.id || doc.id,
                    categoryId: cleanPrice(data.categoryId || data.catId || data.category || 1)
                });
            });

            if (cloudItems.length > 0) {
                localStorage.setItem('sys_items', JSON.stringify(cloudItems));
                if (!isCashierBusy() && typeof refreshActiveUI === 'function')
                    refreshActiveUI();
            }
        },
        err => {
            console.error("خطأ مزامنة:", err);
            if (typeof showCloudErrorBanner === 'function')
                showCloudErrorBanner(translateFirestoreError(err));
        }
    );
}

function setupCategoriesRealtimeSync() {
    if (!db) return;
    db.collection("system_store").doc("sys_categories").onSnapshot(
        { includeMetadataChanges: true },
        docSnap => {
            if (!docSnap.exists) return;
            if (docSnap.metadata && docSnap.metadata.fromCache) return;
            try {
                const cats = JSON.parse(docSnap.data().content);
                if (Array.isArray(cats) && cats.length > 0) {
                    localStorage.setItem('sys_categories', JSON.stringify(cats));
                    if (!isCashierBusy() && typeof refreshActiveUI === 'function')
                        refreshActiveUI();
                }
            } catch (_) {}
        },
        err => console.log("خطأ مزامنة أقسام:", err)
    );
}

// 🧾 مزامنة لحظية لتصميم الفاتورة (شعار / نصوص / إظهار-إخفاء)
// أي تعديل من الأدمن ينعكس فوراً على كل أجهزة الكاشير المتصلة
function setupInvoiceDesignRealtimeSync() {
    if (!db) return;
    db.collection("system_store").doc("sys_invoice_design").onSnapshot(
        { includeMetadataChanges: true },
        docSnap => {
            if (!docSnap.exists) return;
            if (docSnap.metadata && docSnap.metadata.fromCache) return;
            try {
                const design = JSON.parse(docSnap.data().content);
                if (design && typeof design === 'object') {
                    localStorage.setItem('sys_invoice_design', JSON.stringify(design));
                    if (typeof loadInvoiceDesignForm === 'function' &&
                        document.getElementById('tabInvoiceDesignControl'))
                        loadInvoiceDesignForm();
                }
            } catch (_) {}
        },
        err => console.log("خطأ مزامنة تصميم الفاتورة:", err)
    );
}

// قراءة إعدادات تصميم الفاتورة مع دمجها مع الافتراضي (احتياطاً لأي حقل ناقص)
function getInvoiceDesign() {
    const saved = getData('sys_invoice_design') || {};
    return Object.assign({}, DEFAULT_DATA.invoiceDesign, saved);
}

// 🛠️ محاذاة سطر نصي بعمودين (يسار/يمين) بعرض ثابت — لطباعة حرارية أحادية الخط
// هذا التنسيق (text عادي) هو الوحيد المضمون دعمه من جسر الطباعة
function padReceiptLine(leftText, rightText, width) {
    leftText  = String(leftText  === null || leftText  === undefined ? '' : leftText);
    rightText = String(rightText === null || rightText === undefined ? '' : rightText);
    width = width || 32;
    let left = leftText;
    const maxLeft = Math.max(1, width - rightText.length - 1);
    if (left.length > maxLeft) left = left.slice(0, Math.max(0, maxLeft - 1)) + '…';
    const gap = Math.max(1, width - left.length - rightText.length);
    return left + ' '.repeat(gap) + rightText;
}

// 🛠️ إصلاح: pullLatestFromCloud لا تكتب فوق تعديل محلي أحدث
async function pullLatestFromCloud() {
    if (!db) return { ok: false };
    let changed = false;

    // الأصناف
    try {
        const snap = await db.collection("menu_items").get({ source: 'server' });
        if (!snap.empty) {
            const cloudItems = [];
            snap.forEach(doc => {
                const d = doc.data();
                cloudItems.push({
                    ...d,
                    docId:      doc.id,
                    id:         d.id || doc.id,
                    categoryId: cleanPrice(d.categoryId || d.catId || d.category || 1)
                });
            });
            const before = localStorage.getItem('sys_items');
            const after  = JSON.stringify(cloudItems);
            if (before !== after) {
                localStorage.setItem('sys_items', after);
                changed = true;
            }
        }
    } catch (e) { console.warn("تعذّر سحب الأصناف:", e); }

    // الأقسام
    try {
        const catDoc = await db.collection("system_store").doc("sys_categories")
            .get({ source: 'server' });
        if (catDoc.exists && catDoc.data() && catDoc.data().content) {
            const cats = JSON.parse(catDoc.data().content);
            if (Array.isArray(cats) && cats.length > 0) {
                const before = localStorage.getItem('sys_categories');
                const after  = JSON.stringify(cats);
                if (before !== after) {
                    localStorage.setItem('sys_categories', after);
                    changed = true;
                }
            }
        }
    } catch (e) { console.warn("تعذّر سحب الأقسام:", e); }

    // الفواتير
    try {
        const ordSnap = await db.collection("completed_orders")
            .orderBy("createdTimestamp", "desc").limit(200).get({ source: 'server' });
        if (!ordSnap.empty) {
            const cloudOrders = [];
            ordSnap.forEach(d => cloudOrders.push(d.data()));
            const localOrders = getData('sys_completed_orders') || [];
            const byKey = {};
            cloudOrders.concat(localOrders).forEach(o => {
                const key = String(o.id || (o.orderNum + '_' + o.createdTimestamp));
                const stamp = cleanPrice(o.lastModified) || cleanPrice(o.createdTimestamp);
                const prev  = byKey[key];
                if (!prev) { byKey[key] = o; return; }
                const prevStamp = cleanPrice(prev.lastModified) || cleanPrice(prev.createdTimestamp);
                if (stamp > prevStamp) byKey[key] = o;
                else if (stamp === prevStamp && o.isSettled && !prev.isSettled) byKey[key] = o;
            });
            const merged  = Object.values(byKey).sort((a,b) =>
                cleanPrice(b.createdTimestamp) - cleanPrice(a.createdTimestamp)
            ).slice(0, 300);
            const after = JSON.stringify(merged);
            if (after !== JSON.stringify(localOrders)) {
                safeLocalSet('sys_completed_orders', after);
                changed = true;
            }
        }
    } catch (e) { console.warn("تعذّر سحب الفواتير:", e); }

    // الإعدادات المشتركة
    const SHARED_KEYS = [
        'sys_working_hours', 'sys_areas', 'sys_out_of_stock',
        'sys_coupons', 'sys_cashiers', 'sys_drivers', 'sys_quick_kitchen_notes',
        'sys_invoice_design'
    ];
    try {
        const pDoc = await db.collection("system_store").doc('sys_passwords')
            .get({ source: 'server' });
        if (pDoc.exists && pDoc.data() && pDoc.data().content) {
            const cloudTs = cleanPrice(pDoc.data().updatedAt);
            const localTs = cleanPrice(localStorage.getItem('sys_passwords_ts'));
            if (cloudTs > localTs) {
                localStorage.setItem('sys_passwords', pDoc.data().content);
                localStorage.setItem('sys_passwords_ts', String(cloudTs));
            }
        }
    } catch (_) {}

    for (const key of SHARED_KEYS) {
        try {
            const d = await db.collection("system_store").doc(key).get({ source: 'server' });
            if (d.exists && d.data() && d.data().content) {
                const before = localStorage.getItem(key);
                if (before !== d.data().content) {
                    localStorage.setItem(key, d.data().content);
                    changed = true;
                }
            }
        } catch (_) {}
    }

    localStorage.setItem('mim89_last_pull', String(Date.now()));
    if (typeof renderStatusBadge === 'function') renderStatusBadge();
    if (changed && !isCashierBusy() && typeof refreshActiveUI === 'function')
        refreshActiveUI();

    return { ok: true, changed };
}

/* ==========================================
   🔄 تهيئة البيانات
   ========================================== */
async function initData() {
    // 🛠️ إصلاح: لا نكتب الأقسام الافتراضية إذا كانت السحابة تحتوي بيانات
    // نضع علامة انتظار مؤقتة فقط
    if (!localStorage.getItem('sys_inventory'))
        localStorage.setItem('sys_inventory', JSON.stringify(DEFAULT_DATA.inventory));
    if (!localStorage.getItem('sys_passwords'))
        localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_printer_settings'))
        localStorage.setItem('sys_printer_settings', JSON.stringify(DEFAULT_DATA.printerSettings));
    if (!localStorage.getItem('sys_invoice_design'))
        localStorage.setItem('sys_invoice_design', JSON.stringify(DEFAULT_DATA.invoiceDesign));
    if (!localStorage.getItem('sys_cashiers') ||
        JSON.parse(localStorage.getItem('sys_cashiers')).length === 0)
        localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    if (!localStorage.getItem('sys_employees'))
        localStorage.setItem('sys_employees', JSON.stringify(DEFAULT_DATA.employees));
    if (!localStorage.getItem('sys_drivers'))
        localStorage.setItem('sys_drivers', JSON.stringify(DEFAULT_DATA.drivers));
    if (!localStorage.getItem('sys_areas'))
        localStorage.setItem('sys_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
    if (!localStorage.getItem('sys_quick_kitchen_notes'))
        localStorage.setItem('sys_quick_kitchen_notes', JSON.stringify(DEFAULT_DATA.quickKitchenNotes));
    if (!localStorage.getItem('sys_expenses'))
        localStorage.setItem('sys_expenses', JSON.stringify([]));
    if (!localStorage.getItem('sys_salaries'))
        localStorage.setItem('sys_salaries', JSON.stringify([]));
    if (!localStorage.getItem('sys_completed_orders'))
        localStorage.setItem('sys_completed_orders', JSON.stringify([]));
    if (!localStorage.getItem('sys_customers'))
        localStorage.setItem('sys_customers', JSON.stringify([]));
    if (!localStorage.getItem('sys_working_hours'))
        localStorage.setItem('sys_working_hours', JSON.stringify({ open:"10:00", close:"23:59", enabled:false }));
    if (!localStorage.getItem('sys_out_of_stock'))
        localStorage.setItem('sys_out_of_stock', JSON.stringify([]));
    if (!localStorage.getItem('sys_coupons'))
        localStorage.setItem('sys_coupons', JSON.stringify([]));
    if (!localStorage.getItem('sys_items'))
        localStorage.setItem('sys_items', JSON.stringify([]));

    // الأقسام: لا نكتب الافتراضية إلا إذا كانت السحابة فارغة فعلاً
    if (!localStorage.getItem('sys_categories')) {
        // ضع placeholder مؤقت ريثما نسحب من السحابة
        localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    }

    refreshActiveUI();

    // سحب من السحابة يتفوق على المحلي
    await pullLatestFromCloud();

    setupCloudRealtimeSync();
    setupCategoriesRealtimeSync();
    setupInvoiceDesignRealtimeSync();
    setTimeout(() => runSilentStorageMaintenance(), 3000);
    startPeriodicCloudPull();
    updateSyncIndicator(false);
    if (typeof renderStatusBadge === 'function') renderStatusBadge();
}

// صيانة صامتة للذاكرة
function runSilentStorageMaintenance() {
    try {
        const usage = getStorageUsage();
        if (usage.totalBytes > 4 * 1024 * 1024) { // أكثر من 4MB
            const orders = getData('sys_completed_orders') || [];
            if (orders.length > 200)
                safeLocalSet('sys_completed_orders', JSON.stringify(orders.slice(0, 200)));
        }
    } catch (_) {}
}

// 🔁 سحب دوري كل 60 ثانية
let cloudPullTimer = null;
function startPeriodicCloudPull() {
    if (cloudPullTimer) clearInterval(cloudPullTimer);
    cloudPullTimer = setInterval(() => {
        if (!isCashierBusy() && navigator.onLine) {
            pullLatestFromCloud().then(r => updateSyncIndicator(!!(r && r.changed)));
        }
    }, 60000);

    window.addEventListener('online', () =>
        pullLatestFromCloud().then(() => updateSyncIndicator(true)));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) pullLatestFromCloud().then(() => updateSyncIndicator(false));
    });
}

/* ==========================================
   🕐 نظام الشيفت
   ========================================== */
function getLastShiftCloseTs() {
    try {
        const arch = getData('sys_shift_archive');
        if (Array.isArray(arch) && arch.length > 0)
            return cleanPrice(arch[0].closedTs) || 0;
    } catch (_) {}
    return 0;
}

// 🛠️ إصلاح: getShiftStartTs لا تغير الوقت تلقائياً
function getShiftStartTs() {
    const stored    = cleanPrice(localStorage.getItem('sys_shift_start_ts'));
    const lastClose = getLastShiftCloseTs();
    const explicit  = localStorage.getItem('sys_shift_explicit') === '1';

    // إذا كان الوقت المحفوظ صريحاً (بعد تقفيل) نحترمه
    if (stored > 0 && explicit) return stored;

    // إذا كان بعد آخر تقفيل نستخدمه
    if (stored > 0 && stored > lastClose) return stored;

    // وقت افتراضي: بداية يوم العمل الحالي
    const d = new Date();
    const baghdadOffset = 3 * 60;
    const localOffset   = d.getTimezoneOffset();
    const baghdadTime   = new Date(d.getTime() + (baghdadOffset + localOffset) * 60000);
    if (baghdadTime.getHours() < BUSINESS_DAY_CUTOFF_HOUR)
        baghdadTime.setDate(baghdadTime.getDate() - 1);
    baghdadTime.setHours(BUSINESS_DAY_CUTOFF_HOUR, 0, 0, 0);
    const fallback = baghdadTime.getTime();

    localStorage.setItem('sys_shift_start_ts', String(fallback));
    return fallback;
}

function getShiftStartLabel() {
    const meta = getData('sys_shift_meta');
    if (meta && meta.startedAt) return meta.startedAt;
    return new Date(getShiftStartTs()).toLocaleString('ar-IQ');
}

function startNewShift() {
    const now = Date.now();
    localStorage.setItem('sys_shift_start_ts', String(now));
    localStorage.setItem('sys_shift_explicit', '1');
    setData('sys_shift_meta', {
        startTs:   now,
        startedAt: new Date().toLocaleString('ar-IQ'),
        cashier:   activeCashierUser ? activeCashierUser.name : 'الرئيسي'
    });
}

function getShiftOrders() {
    const startTs = getShiftStartTs();
    const all     = getData('sys_completed_orders') || [];
    return all.filter(o => {
        const ts = cleanPrice(o.createdTimestamp);
        if (!ts) return o.dateDate >= getBusinessDayString(new Date(startTs));
        return ts >= startTs;
    });
}

function getShiftExpenses() {
    const startTs = getShiftStartTs();
    const all     = getData('sys_expenses') || [];
    return all.filter(e => {
        const ts = cleanPrice(e.createdTimestamp);
        if (!ts) return e.dateDate >= getBusinessDayString(new Date(startTs));
        return ts >= startTs;
    });
}

// 🆕 صرفيات الرواتب منفصلة
function getShiftSalaries() {
    const startTs = getShiftStartTs();
    const all     = getData('sys_salaries') || [];
    return all.filter(s => {
        const ts = cleanPrice(s.createdTimestamp);
        if (!ts) return s.dateDate >= getBusinessDayString(new Date(startTs));
        return ts >= startTs;
    });
}

/* ==========================================
   📊 قياس الذاكرة
   ========================================== */
function getStorageUsage() {
    let total = 0;
    const breakdown = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const v = localStorage.getItem(k) || '';
            const size = (k.length + v.length) * 2;
            total += size;
            breakdown[k] = size;
        }
    } catch (_) {}
    return {
        totalBytes: total,
        totalMB:    (total / 1048576).toFixed(2),
        breakdown
    };
}

/* ==========================================
   🟢 مؤشرات الحالة
   ========================================== */
function renderStatusBadge() {
    if (document.body && document.body.classList.contains('public-menu-body')) return;
    let el = document.getElementById('mim89StatusBadge');
    if (!el) {
        el = document.createElement('div');
        el.id = 'mim89StatusBadge';
        el.style.cssText =
            'position:fixed;bottom:6px;left:6px;z-index:99998;' +
            'background:rgba(16,185,129,0.9);color:#fff;' +
            'font-family:Tajawal,sans-serif;font-size:0.66rem;' +
            'font-weight:800;padding:3px 9px;border-radius:7px;' +
            'cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.6);';
        el.title = 'اضغط لتحديث من السحابة';
        el.onclick = () => {
            el.innerHTML = '⏳';
            pullLatestFromCloud().then(() => renderStatusBadge());
        };
        document.body.appendChild(el);
    }
    const items = (getData('sys_items') || []).length;
    const cats  = (getData('sys_categories') || []).length;
    const last  = cleanPrice(localStorage.getItem('mim89_last_pull'));
    const t     = last ? new Date(last).toLocaleTimeString('ar-IQ',
        { hour:'2-digit', minute:'2-digit' }) : '--:--';
    el.innerHTML = 'v' + MIM89_APP_VERSION +
        ' • 🍔 ' + items + ' • 🗂️ ' + cats + ' • ☁️ ' + t;
}

function updateSyncIndicator(highlight) {
    const el = document.getElementById('cloudSyncIndicator');
    if (!el) return;
    const t = new Date().toLocaleTimeString('ar-IQ',
        { hour:'2-digit', minute:'2-digit' });
    el.innerHTML = '<i class="fa-solid fa-cloud" style="color:#10b981;"></i> ' + t;
    if (highlight) {
        el.style.background = 'rgba(16,185,129,0.3)';
        setTimeout(() => el.style.background = 'transparent', 1500);
    }
}

/* ==========================================
   🚦 هل الكاشير مشغول؟
   ========================================== */
function isCashierBusy() {
    try {
        if (typeof posCart !== 'undefined' && posCart && posCart.length > 0) return true;
        if (typeof activePendingPrintOrder !== 'undefined' && activePendingPrintOrder) return true;
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return true;
        const modals = document.querySelectorAll('.modal-overlay');
        for (let i = 0; i < modals.length; i++) {
            const s = modals[i].style.display;
            if (s === 'flex' || s === 'block') return true;
        }
        const pinOverlay = document.getElementById('_pinOverlay');
        if (pinOverlay) return true;
    } catch (_) {}
    return false;
}

/* ==========================================
   🔄 تحديث الواجهة
   ========================================== */
function refreshActiveUI() {
    if (document.body.classList.contains('public-menu-body')) {
        if (typeof renderPublicMenuUI === 'function') renderPublicMenuUI();
    } else if (document.getElementById('posProductsGrid')) {
        if (!isCashierBusy()) {
            if (typeof loadPosDirectMenu === 'function')
                loadPosDirectMenu(currentPosCategory);
        }
        if (typeof listenForIncomingOrders === 'function') listenForIncomingOrders();
    } else if (document.getElementById('adminItemsTable')) {
        if (typeof renderAdminCategories === 'function') renderAdminCategories();
        if (typeof renderAdminItems      === 'function') renderAdminItems();
        if (typeof renderCategoriesManagementList === 'function') renderCategoriesManagementList();
    } else if (document.getElementById('inventoryTableBody')) {
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
    }
}

/* ==========================================
   📋 سجل التدقيق (الأمان)
   ========================================== */
function logAudit(action, details) {
    const entry = {
        action,
        details: details || {},
        cashier:  (activeCashierUser) ? activeCashierUser.name : 'غير محدد',
        at:       Date.now(),
        atText:   new Date().toLocaleString('ar-IQ'),
        dateDate: getTodayString(),
        device:   navigator.userAgent.includes('Windows') ? 'كمبيوتر' :
                  (navigator.userAgent.includes('iPhone') ||
                   navigator.userAgent.includes('iPad')) ? 'آيفون/آيباد' : 'جهاز آخر'
    };

    try {
        let local = getData('sys_audit_log');
        if (!Array.isArray(local)) local = [];
        local.unshift(entry);
        safeLocalSet('sys_audit_log', JSON.stringify(local.slice(0, 300)));
    } catch (_) {}

    if (db) {
        db.collection("audit_log").add(entry)
            .catch(err => console.error('تعذّر التدقيق:', err));
    }
}

/* ==========================================
   🔗 قناة المزامنة بين التبويبات
   ========================================== */
const posSyncChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('mim89_menu_sync') : null;

if (posSyncChannel) {
    posSyncChannel.onmessage = (event) => {
        if (event.data === 'menu_updated' && !isCashierBusy()) {
            if (typeof refreshActiveUI === 'function') refreshActiveUI();
        }
    };
}

function notifyMenuUpdated() {
    localStorage.setItem('mim89_last_menu_update', Date.now());
    if (posSyncChannel) posSyncChannel.postMessage('menu_updated');
    if (!isCashierBusy() && typeof refreshActiveUI === 'function')
        refreshActiveUI();
}

/* ==========================================
   🌐 أخطاء Firebase - ترجمة عربية
   ========================================== */
function translateFirestoreError(err) {
    const code = (err && err.code) ? String(err.code) : '';
    if (code.includes('permission-denied'))
        return "🚫 قواعد الأمان ترفض العملية.\nالحل: Firebase Console → Firestore → Rules";
    if (code.includes('deadline-exceeded'))
        return "⏱️ الخادم لم يرد — تحقق من قواعد الأمان (Rules).";
    if (code.includes('unavailable'))
        return "📡 لا يوجد اتصال بـ Firebase.";
    if (code.includes('unauthenticated'))
        return "🔑 القواعد تشترط تسجيل دخول.";
    return "⚠️ خطأ: " + code + " — " + ((err && err.message) ? err.message : 'غير معروف');
}

function showCloudErrorBanner(message) {
    let banner = document.getElementById('mim89CloudErrorBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'mim89CloudErrorBanner';
        banner.style.cssText =
            'position:fixed;bottom:0;left:0;right:0;background:#7f1d1d;color:#fff;' +
            'padding:10px 16px;font-family:Tajawal,sans-serif;font-size:0.82rem;' +
            'font-weight:bold;z-index:99999;box-shadow:0 -4px 20px rgba(0,0,0,0.6);' +
            'direction:rtl;text-align:right;white-space:pre-line;line-height:1.6;';
        document.body.appendChild(banner);
    }
    banner.innerHTML =
        '<span style="float:left;cursor:pointer;font-size:1.1rem;padding:0 8px;" ' +
        'onclick="this.parentElement.remove()">✕</span>' +
        '⚠️ <strong>لم يُرفع للسحابة!</strong> (محفوظ محلياً فقط)\n' + message;
}

// ==========================================
// نهاية الجزء 1 - app.js
// ==========================================

// ==========================================
// app.js - الجزء 2: الكاشير + السلة + الطباعة
// ==========================================

/* ==========================================
   🔢 رقم الطلب
   ========================================== */
let prefetchedOrderNumber = null;
let prefetchInFlight      = false;

function prefetchOrderNumber() {
    if (prefetchInFlight || prefetchedOrderNumber !== null) return;
    prefetchInFlight = true;
    getNextOrderNumberFromCloud()
        .then(num  => { prefetchedOrderNumber = num; })
        .catch(()  => { prefetchedOrderNumber = null; })
        .finally(() => { prefetchInFlight = false; });
}

function consumePrefetchedOrderNumber() {
    const n = prefetchedOrderNumber;
    prefetchedOrderNumber = null;
    return n;
}

// 🛠️ إصلاح: رقم محلي فوري + مزامنة السحابة في الخلفية
function getOrderSequenceLocal() {
    const completed  = getData('sys_completed_orders') || [];
    const todayStr   = getTodayString();
    const todayOrders = completed.filter(o => o.dateDate === todayStr);
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

async function getNextOrderNumberFromCloud() {
    const today = getTodayString();
    if (!db) return getOrderSequenceLocal();

    const counterRef = db.collection("system_counters").doc("daily_order_counter");
    try {
        const newNumber = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let currentDate  = today;
            let currentValue = 100;
            if (counterDoc.exists) {
                const data = counterDoc.data();
                if (data.date === today) {
                    currentDate  = data.date;
                    currentValue = cleanPrice(data.lastNumber) || 100;
                } else {
                    currentDate  = today;
                    currentValue = 100;
                }
            }
            const nextValue = currentValue + 1;
            transaction.set(counterRef, {
                date:       currentDate,
                lastNumber: nextValue,
                updatedAt:  Date.now()
            });
            return nextValue;
        });
        return newNumber;
    } catch (err) {
        console.error("فشل رقم الطلب من السحابة:", err);
        return getOrderSequenceLocal();
    }
}

/* ==========================================
   🧾 الكاشير - تسجيل الدخول
   ========================================== */
function initCashierPage() {
    initData();
    sessionStorage.removeItem('active_cashier');
    showCashierLoginPin();
}

// 🛠️ إصلاح: PIN لمسي للكاشير
function showCashierLoginPin() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.style.display = 'flex';
    const app = document.getElementById('cashierMainApp');
    if (app) app.style.display = 'none';
}

function loginCashier() {
    const passInput = document.getElementById('cashierPassInput');
    const inputPass = passInput ? String(passInput.value).trim() : '';
    if (!inputPass) return;

    const cashiers = getData('sys_cashiers') || [];
    let user = cashiers.find(c =>
        String(c.pin || c.password || '').trim() === inputPass
    );

    if (!user && verifySystemPassword('cashier', inputPass)) {
        user = { id: "c1", name: "الكاشير الرئيسي", pin: inputPass };
    }

    if (user) {
        activeCashierUser = user;
        sessionStorage.setItem('active_cashier', JSON.stringify(activeCashierUser));
        sessionStorage.setItem('shift_start_time', new Date().toLocaleString('ar-IQ'));
        sessionStorage.setItem('shift_start_timestamp', Date.now());

        logAudit('تسجيل دخول', {
            cashier: user.name,
            device:  navigator.userAgent.slice(0, 60)
        });

        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.style.display = 'none';
        const app = document.getElementById('cashierMainApp');
        if (app) app.style.display = 'flex';

        const nameEl = document.getElementById('activeCashierName');
        if (nameEl) nameEl.innerText = "الكاشير: " + user.name;

        const errEl = document.getElementById('authError');
        if (errEl) errEl.innerText = '';
        if (passInput) passInput.value = '';

        loadPosDirectMenu('all');
        loadDriversAndAppDropdowns();
        loadPosDeliveryAreas();
        listenForIncomingOrders();
        prefetchOrderNumber();
    } else {
        const errEl = document.getElementById('authError');
        if (errEl) errEl.innerText = "الرمز غير صحيح!";
        logAudit('محاولة دخول فاشلة', { attempt: inputPass.slice(0,2) + '**' });
    }
}

function logoutCashier() {
    logAudit('تسجيل خروج', { cashier: activeCashierUser ? activeCashierUser.name : '-' });
    sessionStorage.removeItem('active_cashier');
    location.reload();
}

/* ==========================================
   🛒 السلة
   ========================================== */
function switchCashierTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.pos-sidebar .toggle-btn').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'flex';
    if (btn) btn.classList.add('active');
}

function selectOrderType(btnElement) {
    document.querySelectorAll('#posOrderTypeGroup .toggle-btn')
        .forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosOrderType = btnElement.getAttribute('data-value');

    const driverBox = document.getElementById('driverSelectBox');
    if (driverBox) driverBox.style.display =
        selectedPosOrderType === 'delivery' ? 'block' : 'none';

    const areaBox = document.getElementById('posAreaBox');
    if (areaBox) {
        areaBox.style.display =
            selectedPosOrderType === 'delivery' ? 'block' : 'none';
        if (selectedPosOrderType === 'delivery') loadPosDeliveryAreas();
    }
    renderPosCart();
}

function selectPaymentMethod(btnElement) {
    document.querySelectorAll('#posPaymentGroup .toggle-btn')
        .forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosPaymentMethod = btnElement.getAttribute('data-value');
}

function getPosCustomerInfo() {
    const name  = (document.getElementById('posCustName')?.value  || '').trim();
    const phone = (document.getElementById('posCustPhone')?.value || '').trim();
    return {
        name:    name  || 'زبون مباشر',
        phone:   phone || '-',
        display: name ? (phone ? name + ' | هاتف: ' + phone : name)
                      : (phone ? 'هاتف: ' + phone : 'زبون مباشر')
    };
}

// 🗺️ أجور التوصيل حسب المنطقة
function getPosDeliveryFee() {
    if (selectedPosOrderType !== 'delivery') return 0;
    const areaSelect  = document.getElementById('posAreaSelect');
    const selectedArea = areaSelect ? areaSelect.value : '';
    const areas        = getData('sys_areas') || [];

    if (selectedArea && selectedArea !== '__other__') {
        const found = areas.find(a => String(a.name) === String(selectedArea));
        if (found) return cleanPrice(found.price);
    }

    const custInput = document.getElementById('posCustName')?.value || '';
    if (custInput) {
        const norm    = normalizeArabicArea(custInput);
        const matched = areas.find(a => {
            const an = normalizeArabicArea(a.name);
            return an && norm && (norm === an || norm.includes(an));
        });
        if (matched) return cleanPrice(matched.price);
    }
    return 2500;
}

function loadPosDeliveryAreas() {
    const select = document.getElementById('posAreaSelect');
    if (!select) return;
    const areas    = getData('sys_areas') || [];
    const previous = select.value;
    let html = '';
    areas.forEach(a => {
        const price = cleanPrice(a.price);
        const label = price === 0 ? 'مجاني 🎉' : price.toLocaleString('ar-IQ') + ' د.ع';
        html += '<option value="' + a.name + '">📍 ' + a.name + ' — ' + label + '</option>';
    });
    html += '<option value="__other__">✏️ منطقة أخرى (2,500 د.ع)</option>';
    select.innerHTML = html;
    if (previous) select.value = previous;
}

function onPosAreaChanged() { renderPosCart(); }

let custLookupTimer = null;
function lookupCustomerByPhone(phone) {
    const hint  = document.getElementById('custLookupHint');
    const nameEl = document.getElementById('posCustName');
    if (!hint) return;
    phone = String(phone || '').trim();
    if (custLookupTimer) clearTimeout(custLookupTimer);
    if (phone.length < 7) { hint.innerHTML = ''; return; }

    custLookupTimer = setTimeout(() => {
        const customers = getData('sys_customers') || [];
        const found = customers.find(c =>
            String(c.phone || '').replace(/\D/g,'') === phone.replace(/\D/g,'')
        );
        if (found) {
            if (nameEl && !nameEl.value.trim()) nameEl.value = found.name || '';
            const areaSel = document.getElementById('posAreaSelect');
            if (areaSel && found.area) {
                for (let i = 0; i < areaSel.options.length; i++) {
                    if (areaSel.options[i].value === found.area) {
                        areaSel.selectedIndex = i; break;
                    }
                }
                renderPosCart();
            }
            hint.innerHTML =
                '<span style="color:#10b981;">✅ زبون معروف: ' + (found.name || '') +
                (found.area ? ' — ' + found.area : '') + '</span>';
        } else {
            hint.innerHTML =
                '<span style="color:#888;">زبون جديد — سيُحفظ تلقائياً</span>';
        }
    }, 350);
}

// إضافة صنف للسلة
function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item  = items.find(i =>
        String(i.id) === String(itemId) || cleanPrice(i.id) === cleanPrice(itemId)
    );
    if (!item) return;

    const exist = posCart.find(c =>
        String(c.id) === String(itemId) || cleanPrice(c.id) === cleanPrice(itemId)
    );

    if (exist) {
        exist.qty += 1;
    } else {
        posCart.push({ ...item, price: cleanPrice(item.price), qty: 1, itemNotes: [] });
    }

    recalculateActiveDiscount();
    renderPosCart();
    prefetchOrderNumber();
}

function changePosCartQty(id, change) {
    const item = posCart.find(c =>
        String(c.id) === String(id) || cleanPrice(c.id) === cleanPrice(id)
    );
    if (item) {
        item.qty += change;
        if (item.qty <= 0)
            posCart = posCart.filter(c =>
                String(c.id) !== String(id) && cleanPrice(c.id) !== cleanPrice(id)
            );
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
    if (!posCart[cartIndex]) return;
    if (!posCart[cartIndex].itemNotes) posCart[cartIndex].itemNotes = [];
    if (!posCart[cartIndex].itemNotes.includes(noteText)) {
        posCart[cartIndex].itemNotes.push(noteText);
        renderPosCart();
    }
}

function removeNoteFromCartItem(cartIndex, noteIdx) {
    if (posCart[cartIndex] && posCart[cartIndex].itemNotes) {
        posCart[cartIndex].itemNotes.splice(noteIdx, 1);
        renderPosCart();
    }
}

function addCustomItemNotePrompt(cartIndex) {
    const text = prompt("أدخل ملاحظة مخصصة:");
    if (text && text.trim()) addNoteToCartItem(cartIndex, text.trim());
}

/* ==========================================
   🏷️ الخصومات - مع تأكيد المالك
   ========================================== */
function toggleFreeDiscount() {
    const subtotal = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    if (subtotal === 0) return alert("السلة فارغة!");

    if (activeDiscountType === 'free') {
        clearAllDiscounts();
        return;
    }

    // 🔐 يحتاج موافقة المالك
    requireOwnerPin('خصم مجاني (100%)', () => {
        activeDiscountType = 'free';
        posDiscountAmount  = subtotal;
        logAudit('خصم مجاني', {
            amount:     subtotal,
            cashier:    activeCashierUser ? activeCashierUser.name : '-',
            itemsCount: posCart.length
        });
        updateDiscountUIState('free', '🎉 مجاني (100%)');
        renderPosCart();
    });
}

function togglePercentDiscount() {
    const subtotal = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    if (subtotal === 0) return alert("السلة فارغة!");

    if (activeDiscountType === 'percent') {
        clearAllDiscounts();
        return;
    }

    const inputPercent = prompt("أدخل نسبة الخصم (1-100):", currentPercentValue || "10");
    if (!inputPercent) return;
    const pVal = Math.min(100, Math.max(1, cleanPrice(inputPercent) || 0));

    // 🔐 أكثر من 20% يحتاج موافقة المالك
    const doApply = () => {
        currentPercentValue = pVal;
        activeDiscountType  = 'percent';
        posDiscountAmount   = (subtotal * pVal) / 100;
        logAudit('خصم نسبة', {
            pct:    pVal,
            amount: posDiscountAmount,
            cashier: activeCashierUser ? activeCashierUser.name : '-'
        });
        updateDiscountUIState('percent', '🏷️ خصم ' + pVal + '%');
        renderPosCart();
    };

    if (pVal > 20) {
        requireOwnerPin('خصم ' + pVal + '%', doApply);
    } else {
        doApply();
    }
}

function promptAmountDiscount() {
    const subtotal = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    if (subtotal === 0) return alert("السلة فارغة!");

    if (activeDiscountType === 'amount') {
        clearAllDiscounts();
        return;
    }

    const inputAmt = prompt("أدخل قيمة الخصم (د.ع):", posDiscountAmount || "1000");
    if (!inputAmt) return;
    const amt = Math.max(0, cleanPrice(inputAmt) || 0);

    const doApply = () => {
        activeDiscountType = 'amount';
        posDiscountAmount  = amt;
        logAudit('خصم مبلغ', {
            amount:  amt,
            cashier: activeCashierUser ? activeCashierUser.name : '-'
        });
        updateDiscountUIState('amount', '💵 خصم ' + amt.toLocaleString('ar-IQ') + ' د.ع');
        renderPosCart();
    };

    // خصم أكثر من 5000 يحتاج موافقة
    if (amt > 5000) {
        requireOwnerPin('خصم مبلغ ' + amt.toLocaleString('ar-IQ') + ' د.ع', doApply);
    } else {
        doApply();
    }
}

function clearAllDiscounts() {
    activeDiscountType  = null;
    posDiscountAmount   = 0;
    currentPercentValue = 0;
    updateDiscountUIState(null, '');
    const clearBtn = document.getElementById('btnClearDiscountX');
    if (clearBtn) clearBtn.style.display = 'none';
    renderPosCart();
}

function recalculateActiveDiscount() {
    const subtotal = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    if (subtotal === 0) { clearAllDiscounts(); return; }
    if (activeDiscountType === 'free')    posDiscountAmount = subtotal;
    if (activeDiscountType === 'percent') posDiscountAmount = (subtotal * currentPercentValue) / 100;
}

function updateDiscountUIState(type, badgeText) {
    const badge    = document.getElementById('discountStatusBadge');
    const clearBtn = document.getElementById('btnClearDiscountX');
    if (badge) {
        badge.innerText      = badgeText || '';
        badge.style.display  = badgeText ? 'inline-block' : 'none';
    }
    if (clearBtn) clearBtn.style.display = type ? 'inline-flex' : 'none';
}

function applyCouponAtCashier() {
    const subtotal = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    if (subtotal === 0) return alert("السلة فارغة!");
    if (activeDiscountType === 'coupon') { clearAllDiscounts(); return; }

    const codeRaw = prompt("أدخل كود الكوبون:");
    if (!codeRaw) return;
    const code    = codeRaw.trim().toUpperCase();
    const coupons = getData('sys_coupons') || [];
    const found   = coupons.find(c => c.code === code && c.active !== false);

    if (!found) return alert("⚠️ الكود غير صحيح أو غير مفعّل!");

    activeDiscountType = 'coupon';
    posDiscountAmount  = found.type === 'percent'
        ? (subtotal * cleanPrice(found.value)) / 100
        : cleanPrice(found.value);
    logAudit('كوبون خصم', { code, amount: posDiscountAmount });
    updateDiscountUIState('coupon', '🏷️ كوبون ' + found.code);
    renderPosCart();
}

/* ==========================================
   🛒 عرض السلة
   ========================================== */
function renderPosCart() {
    const list    = document.getElementById('posCartList');
    const totalEl = document.getElementById('posTotalAmount');
    if (!list) return;

    if (posCart.length === 0) {
        list.innerHTML =
            '<p style="text-align:center;color:#555;font-size:0.8rem;padding:14px;">' +
            'اختر الوجبات للإضافة</p>';
        if (totalEl) totalEl.innerText = "0 د.ع";
        return;
    }

    const quickNotes = getData('sys_quick_kitchen_notes') ||
        ["بدون ثوم 🧄","سبايسي 🌶️","صوص زيادة 🧀","بدون مخلل 🥒"];
    let subtotal = 0;

    let html = posCart.map((item, index) => {
        const itemTotal = cleanPrice(item.price) * cleanPrice(item.qty);
        subtotal += itemTotal;

        const notesTags = (item.itemNotes && item.itemNotes.length > 0)
            ? '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:3px;">' +
              item.itemNotes.map((n,nIdx) =>
                '<span style="background:#1e1e28;color:#fbbf24;font-size:0.68rem;' +
                'padding:1px 6px;border-radius:4px;border:1px solid #333;">' + n +
                ' <b onclick="removeNoteFromCartItem(' + index + ',' + nIdx + ')" ' +
                'style="cursor:pointer;color:#ef4444;">×</b></span>'
              ).join('') + '</div>'
            : '';

        const quickBtns =
            '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px;">' +
            quickNotes.map(qn =>
                '<button onclick="addNoteToCartItem(' + index + ',\'' +
                qn.replace(/'/g,"\\'") + '\')" ' +
                'style="font-size:0.62rem;background:#111116;color:#aaa;' +
                'border:1px solid #2a2a36;padding:2px 5px;border-radius:3px;cursor:pointer;">' +
                qn + '</button>'
            ).join('') +
            '<button onclick="addCustomItemNotePrompt(' + index + ')" ' +
            'style="font-size:0.62rem;background:#1e1e28;color:#fbbf24;' +
            'border:1px solid #333;padding:2px 5px;border-radius:3px;cursor:pointer;">' +
            '✏️</button></div>';

        return '<div style="background:#111116;padding:7px;border-radius:7px;' +
            'margin-bottom:5px;border:1px solid #1e1e28;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<strong style="color:#fff;font-size:0.82rem;">' + item.name + '</strong>' +
            '<div style="display:flex;gap:4px;align-items:center;">' +
            '<button onclick="changePosCartQty(\'' + item.id + '\',-1)" ' +
            'style="width:26px;height:26px;background:#1e1e28;color:#fff;' +
            'border:1px solid #333;border-radius:5px;cursor:pointer;font-size:1rem;">−</button>' +
            '<span style="color:#fbbf24;font-weight:900;font-size:0.9rem;">' + item.qty + '</span>' +
            '<button onclick="changePosCartQty(\'' + item.id + '\',1)" ' +
            'style="width:26px;height:26px;background:#1e1e28;color:#fff;' +
            'border:1px solid #333;border-radius:5px;cursor:pointer;font-size:1rem;">+</button>' +
            '</div></div>' +
            '<div style="display:flex;justify-content:space-between;color:#888;' +
            'font-size:0.72rem;margin-top:2px;">' +
            '<span>' + cleanPrice(item.price).toLocaleString('ar-IQ') +
            ' × ' + item.qty + '</span>' +
            '<strong style="color:#fbbf24;">' +
            itemTotal.toLocaleString('ar-IQ') + ' د.ع</strong>' +
            '</div>' + notesTags + quickBtns + '</div>';
    }).join('');

    // حقل الملاحظات العامة
    html += '<div style="margin-top:6px;border-top:1px dashed #222;padding-top:5px;">' +
        '<input type="text" id="posOrderNotesInput" placeholder="ملاحظات الطلب..." ' +
        'style="width:100%;padding:6px;background:#0d0d11;border:1px solid #2a2a36;' +
        'border-radius:5px;color:#fff;font-size:0.78rem;box-sizing:border-box;"></div>';

    list.innerHTML = html;

    const deliveryFee = getPosDeliveryFee();
    const finalTotal  = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;

    if (totalEl) {
        if (posDiscountAmount > 0) {
            totalEl.innerHTML =
                '<span style="text-decoration:line-through;color:#555;font-size:0.82rem;' +
                'margin-left:5px;">' +
                (subtotal + deliveryFee).toLocaleString('ar-IQ') + '</span> ' +
                (finalTotal === 0
                    ? '<span style="color:#10b981;">مجاني 🎉</span>'
                    : finalTotal.toLocaleString('ar-IQ') + ' د.ع');
        } else {
            totalEl.innerText = finalTotal.toLocaleString('ar-IQ') + ' د.ع';
        }
    }
}

/* ==========================================
   🖥️ شبكة المنتجات بالكاشير
   ========================================== */
function renderPosCategoriesBar() {
    const catBar = document.getElementById('posCategoriesBar');
    if (!catBar) return;
    const categories = getData('sys_categories') || [];
    const cur = String(currentPosCategory);

    let html = '<button class="category-tab' + (cur==='all'?' active':'') +
        '" onclick="loadPosDirectMenu(\'all\',this)">الكل 🍔</button>';
    categories.forEach(c => {
        const isActive = String(c.id) === cur;
        html += '<button class="category-tab' + (isActive?' active':'') +
            '" onclick="loadPosDirectMenu(\'' + c.id + '\',this)">' +
            c.name + '</button>';
    });
    catBar.innerHTML = html;
}

function loadPosDirectMenu(catId = 'all', btnElement = null) {
    currentPosCategory = catId;
    if (btnElement) {
        document.querySelectorAll('#posCategoriesBar .category-tab')
            .forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
        renderPosCategoriesBar();
    }

    const items = getData('sys_items') || [];
    const grid  = document.getElementById('posProductsGrid');
    if (!grid) return;

    const active   = items.filter(i => !i.isPaused);
    let   filtered = catId === 'all' ? active
        : active.filter(i => String(getItemCategory(i)) === String(catId));
    filtered.sort((a,b) => cleanPrice(a.price) - cleanPrice(b.price));

    if (filtered.length === 0) {
        grid.innerHTML =
            '<p style="color:#555;grid-column:1/-1;text-align:center;padding:20px;">' +
            'لا توجد وجبات في هذا القسم</p>';
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const isOut = isItemOutOfStock(item.id);
        return '<div class="pos-product-card"' +
            (isOut ? ' style="opacity:0.45;"' : '') +
            (isOut ? '' : ' onclick="addToPosCart(\'' + item.id + '\')"') + '>' +
            (isOut ? '<span style="position:absolute;top:4px;left:4px;background:#ef4444;' +
                'color:#fff;font-size:0.6rem;font-weight:900;padding:2px 6px;' +
                'border-radius:4px;">نافذ</span>' : '') +
            '<img src="' + (item.image || item.img || '') +
            '" class="pos-product-img" onerror="this.src=\'\';">' +
            '<div style="font-size:0.78rem;color:#fff;margin:4px 0 2px;' +
            'font-weight:700;line-height:1.25;">' + item.name + '</div>' +
            '<span style="font-size:0.8rem;color:#fbbf24;font-weight:900;">' +
            cleanPrice(item.price).toLocaleString('ar-IQ') + ' د.ع</span>' +
            '</div>';
    }).join('');
}

function filterPosProducts() {
    const query  = document.getElementById('posSearchInput')?.value.toLowerCase() || '';
    const items  = getData('sys_items');
    const grid   = document.getElementById('posProductsGrid');
    if (!grid) return;
    let filtered = items.filter(i => i.name.toLowerCase().includes(query));
    filtered.sort((a,b) => cleanPrice(a.price) - cleanPrice(b.price));
    grid.innerHTML = filtered.map(item => {
        const isOut = isItemOutOfStock(item.id);
        return '<div class="pos-product-card"' +
            (isOut ? ' style="opacity:0.45;"' : '') +
            (isOut ? '' : ' onclick="addToPosCart(\'' + item.id + '\')"') + '>' +
            '<img src="' + (item.image || item.img || '') +
            '" class="pos-product-img" onerror="this.src=\'\';">' +
            '<div style="font-size:0.78rem;color:#fff;margin:4px 0 2px;font-weight:700;">' +
            item.name + '</div>' +
            '<span style="font-size:0.8rem;color:#fbbf24;font-weight:900;">' +
            cleanPrice(item.price).toLocaleString('ar-IQ') + ' د.ع</span>' +
            '</div>';
    }).join('');
}

function loadDriversAndAppDropdowns() {
    const drivers = getData('sys_drivers');
    const select  = document.getElementById('posDriverSelect');
    if (!select) return;
    select.innerHTML =
        '<option value="">-- اختر سائق / تطبيق --</option>' +
        '<optgroup label="🛵 سائقو المطعم">' +
        drivers.map(d =>
            '<option value="' + d.name + '">' + d.name +
            ' (' + (d.phone || 'مطعم') + ')</option>'
        ).join('') +
        '</optgroup>' +
        '<optgroup label="📱 تطبيقات">' +
        '<option value="تطبيق طلباتي">📱 طلباتي</option>' +
        '<option value="تطبيق توترز">📱 توترز</option>' +
        '<option value="تطبيق بلي">📱 بلي</option>' +
        '</optgroup>';
}

/* ==========================================
   💰 حاسبة النقد
   ========================================== */
function openQuickCashModal() {
    if (!posCart || posCart.length === 0)
        return alert("⚠️ السلة فارغة!");

    if (selectedPosOrderType === 'delivery') {
        const driver = document.getElementById('posDriverSelect')?.value;
        if (!driver) return alert("⚠️ اختر سائق التوصيل أولاً!");
    }

    const subtotal    = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    const deliveryFee = getPosDeliveryFee();
    const netTotal    = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;

    const reqEl = document.getElementById('modalCashTotalReq');
    if (reqEl) reqEl.innerText = netTotal.toLocaleString('ar-IQ') + " د.ع";

    const cashInput = document.getElementById('cashGivenInput');
    if (cashInput) cashInput.value = netTotal;

    calculateCashChange();
    openModal('quickCashModal');
}

function setCashGiven(amount) {
    const cashInput = document.getElementById('cashGivenInput');
    if (cashInput) { cashInput.value = amount; calculateCashChange(); }
}

function calculateCashChange() {
    const subtotal    = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    const deliveryFee = getPosDeliveryFee();
    const netTotal    = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;
    const cashGiven   = cleanPrice(document.getElementById('cashGivenInput')?.value || 0);
    const change      = cashGiven - netTotal;

    const changeEl = document.getElementById('cashChangeResult');
    if (changeEl) {
        if (change < 0) {
            changeEl.innerText    = 'ناقص ' + Math.abs(change).toLocaleString('ar-IQ') + ' د.ع';
            changeEl.style.color  = '#ef4444';
        } else {
            changeEl.innerText    = change.toLocaleString('ar-IQ') + ' د.ع';
            changeEl.style.color  = '#10b981';
        }
    }
}

/* ==========================================
   🖨️ الطباعة - مُصلحة (خطوتان فقط)
   ========================================== */

// 🛠️ إصلاح كبير: رقم الطلب يُحضَّر محلياً فوراً
// ثم يُزامن مع السحابة في الخلفية
async function proceedToPrintAfterCash() {
    const subtotal    = posCart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    const deliveryFee = getPosDeliveryFee();
    const netTotal    = Math.max(0, subtotal - posDiscountAmount) + deliveryFee;
    const cashGiven   = cleanPrice(document.getElementById('cashGivenInput')?.value || 0);

    if (cashGiven < netTotal && selectedPosPaymentMethod === 'cash') {
        return alert("⚠️ المبلغ المستلم أقل من المطلوب!");
    }

    const custInfo   = getPosCustomerInfo();
    const driverName = selectedPosOrderType === 'delivery'
        ? (document.getElementById('posDriverSelect')?.value || 'غير محدد') : '-';
    const areaVal    = document.getElementById('posAreaSelect')?.value || '';
    const area       = areaVal === '__other__' ? 'منطقة أخرى'
        : (areaVal || (selectedPosOrderType === 'delivery' ? 'توصيل' : 'داخل المطعم'));

    // ✅ رقم الطلب محلي فوري - لا انتظار
    let orderNumSeq = consumePrefetchedOrderNumber();
    if (orderNumSeq === null) orderNumSeq = getOrderSequenceLocal();

    // مزامنة السحابة في الخلفية بدون توقف
    getNextOrderNumberFromCloud()
        .then(cloudNum => {
            if (activePendingPrintOrder && cloudNum > orderNumSeq) {
                activePendingPrintOrder.orderNum = cloudNum;
            }
        })
        .catch(() => {});

    activePendingPrintOrder = {
        id:            "ORD_" + Date.now(),
        orderNum:      orderNumSeq,
        customerName:  custInfo.name,
        phone:         custInfo.phone,
        orderType:     selectedPosOrderType === 'delivery' ? 'توصيل'
                     : selectedPosOrderType === 'takeaway' ? 'سفري' : 'صالة',
        area:          area,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? 'كاش' : 'فيزا',
        driverName:    driverName,
        items: posCart.map(i => ({
    id:        i.id,
    name:      String(i.name || ''),
    qty:       parseInt(i.qty) || 1,
    price:     parseInt(cleanPrice(i.price)) || 0,
    itemNotes: Array.isArray(i.itemNotes) ? i.itemNotes : []
})),
        subtotal:      subtotal,
        discount:      posDiscountAmount,
        deliveryFee:   deliveryFee,
        totalAmount:   netTotal,
        cashGiven:     cashGiven,
        cashChange:    Math.max(0, cashGiven - netTotal),
        dateDate:      getTodayString(),
        timestamp:     new Date().toLocaleTimeString('ar-IQ',
            { hour:'2-digit', minute:'2-digit' }),
        createdTimestamp: Date.now(),
        cashierName:   activeCashierUser ? activeCashierUser.name : 'الرئيسي',
        isSettled:     false,
        orderNotes:    document.getElementById('posOrderNotesInput')?.value.trim() || ''
    };

    // حفظ بيانات الزبون
    if (custInfo.phone !== '-') {
        saveCustomerRecord(custInfo.name, custInfo.phone, area, '');
    }

    isCustomerPrinted = false;
    isKitchenPrinted  = false;
    updatePrintStatusBadges();
    closeModal('quickCashModal');

    // 🚀 طباعة مباشرة فوراً عبر الجسر
    await printBothViaBridge(null);
}

function updatePrintStatusBadges() {
    const custBadge = document.getElementById('custPrintBadge');
    const kitBadge  = document.getElementById('kitchenPrintBadge');
    if (custBadge) {
        custBadge.innerText    = isCustomerPrinted ? "✅ تمت" : "(لم تُطبع)";
        custBadge.style.color  = isCustomerPrinted ? "#10b981" : "#888";
    }
    if (kitBadge) {
        kitBadge.innerText    = isKitchenPrinted ? "✅ تمت" : "(لم تُطبع)";
        kitBadge.style.color  = isKitchenPrinted ? "#10b981" : "#888";
    }
}

/* ==========================================
   🖨️ بناء الفواتير - مُبسّطة ونظيفة
   ========================================== */

// فاتورة الزبون - نظيفة وقصيرة
// 🛠️ إصلاح جوهري: كانت الأصناف تُرسل بصيغة أعمدة (cols/ratios/aligns) لجسر
// الطباعة، وهذه الصيغة غير مدعومة فعلياً هناك (كل الأسطر الأخرى الناجحة في
// الفاتورة وورقة المطبخ وصفحة الاختبار تستخدم "text" بسيطة فقط). لذلك كانت
// الأصناف تختفي من الفاتورة المطبوعة فعلياً رغم ظهور العنوان والمجموع.
// الحل: كل صنف الآن سطر "text" واحد، محاذى يدوياً بعرض ثابت (padReceiptLine)
// بنفس الأسلوب المُثبت نجاحه في باقي الفاتورة.
function buildCustomerReceiptLines(ord) {
    const L = [];
    const money  = n => Math.round(cleanPrice(n)).toLocaleString('ar-IQ');
    const design = getInvoiceDesign();
    const lineWidth = design.paperWidth === '58' ? 32 : 42;

    // 🛠️ إصلاح: التأكد من وجود الأصناف
    const items = Array.isArray(ord.items) ? ord.items : [];

    // الترويسة (قابلة للتحكم من الأدمن)
    L.push({ text: design.restaurantName || 'MIM89 FAST FOOD', size:'big', align:'center', bold:true });
    if (design.showAddress && design.addressLine)
        L.push({ text: design.addressLine, size:'normal', align:'center' });
    L.push({ separator: 'solid' });

    // رقم الطلب
    L.push({ text: 'رقم الطلب', size:'normal', align:'center' });
    L.push({ text: '#' + ord.orderNum, size:'huge', align:'center', bold:true });
    L.push({ separator: 'dash' });

    // بيانات الفاتورة
    L.push({ text: ord.timestamp + ' — ' + ord.dateDate, size:'normal', align:'center' });
    L.push({ text: 'الكاشير: ' + (ord.cashierName||'الرئيسي'), size:'normal', align:'right' });
    L.push({ separator: 'dash' });

    // نوع الخدمة
    L.push({ text: ord.orderType, size:'big', align:'center', bold:true });
    if (design.showCustomerName && ord.customerName && ord.customerName !== 'زبون مباشر')
        L.push({ text: 'الزبون: ' + ord.customerName, size:'normal', align:'right' });
    if (design.showPhone && ord.phone && ord.phone !== '-')
        L.push({ text: 'الهاتف: ' + ord.phone, size:'normal', align:'right' });
    if (design.showDriverArea && ord.orderType === 'توصيل') {
        if (ord.area) L.push({ text: 'المنطقة: ' + ord.area, size:'normal', align:'right' });
        if (ord.driverName && ord.driverName !== '-')
            L.push({ text: 'السائق: ' + ord.driverName, size:'normal', align:'right' });
    }
    L.push({ separator: 'solid' });

    // ✅ الأصناف - أسطر نصية بسيطة (الصيغة المضمون دعمها فعلياً)
    L.push({ text: padReceiptLine('الوجبة', 'المبلغ', lineWidth), size:'normal', align:'right', bold:true });
    L.push({ separator: 'dash' });

    let totalQty = 0;
    items.forEach(i => {
        const qty  = cleanPrice(i.qty) || 1;
        const line = cleanPrice(i.price) * qty;
        totalQty  += qty;
        const nameQty = String(i.name || '') + '  ×' + qty;
        L.push({ text: padReceiptLine(nameQty, money(line), lineWidth), size:'normal', align:'right', bold:true });
        if (design.showItemNotes && i.itemNotes && i.itemNotes.length)
            L.push({ text: '← ' + i.itemNotes.join(' • '), size:'normal', align:'right' });
    });

    L.push({ separator: 'dash' });
    L.push({ text: 'عدد القطع: ' + totalQty, size:'normal', align:'right' });
    L.push({ separator: 'solid' });

    // الحساب
    L.push({ text: 'مجموع الوجبات: ' + money(ord.subtotal) + ' د.ع',
        size:'normal', align:'right' });
    if (cleanPrice(ord.discount) > 0)
        L.push({ text: 'خصم: -' + money(ord.discount) + ' د.ع',
            size:'normal', align:'right' });
    if (cleanPrice(ord.deliveryFee) > 0)
        L.push({ text: 'التوصيل: +' + money(ord.deliveryFee) + ' د.ع',
            size:'normal', align:'right' });
    L.push({ separator: 'dash' });
    L.push({ text: 'المطلوب: ' + money(ord.totalAmount) + ' د.ع',
        size:'big', align:'center', bold:true });
    if (cleanPrice(ord.cashGiven) > 0) {
        L.push({ text: 'المدفوع: ' + money(ord.cashGiven) + ' د.ع',
            size:'normal', align:'right' });
        L.push({ text: 'الباقي: ' + money(ord.cashChange) + ' د.ع',
            size:'normal', align:'right', bold:true });
    }
    L.push({ text: 'الدفع: ' + (ord.paymentMethod||'كاش'),
        size:'normal', align:'right' });

    if (design.showOrderNotes && ord.orderNotes)
        L.push({ text: 'ملاحظة: ' + ord.orderNotes, size:'normal', align:'right' });

    // التذييل (قابل للتحكم من الأدمن)
    L.push({ separator: 'solid' });
    L.push({ text: design.footerText || 'شكراً لزيارتكم 🍔', size:'big', align:'center', bold:true });
    L.push({ separator: 'space' });

    return L;
}

// ورقة المطبخ - رقم كبير + أصناف واضحة
function buildKitchenTicketLines(ord) {
    const L = [];
    L.push({ text: '*** مطبخ MIM89 ***', size:'big', align:'center', bold:true });
    L.push({ text: ord.timestamp, size:'normal', align:'center' });
    L.push({ separator: 'solid' });
    L.push({ text: '#' + ord.orderNum, size:'huge', align:'center', bold:true });
    L.push({ separator: 'solid' });
    L.push({ text: ord.orderType, size:'big', align:'center', bold:true });
    if (ord.orderType === 'توصيل' && ord.area)
        L.push({ text: '📍 ' + ord.area, size:'big', align:'center', bold:true });
    if (ord.customerName && ord.customerName !== 'زبون مباشر')
        L.push({ text: ord.customerName, size:'normal', align:'center' });
    L.push({ separator: 'solid' });

    (ord.items||[]).forEach(i => {
        L.push({
            text: '● ' + i.name + '  ×' + i.qty,
            size:'big', align:'right', bold:true
        });
        if (i.itemNotes && i.itemNotes.length)
            L.push({ text: '⚠ ' + i.itemNotes.join(' — '),
                size:'normal', align:'right', bold:true });
        L.push({ separator: 'dash' });
    });

    if (ord.orderNotes)
        L.push({ text: 'ملاحظة: ' + ord.orderNotes, size:'big', align:'right', bold:true });

    return L;
}

/* ==========================================
   🖨️🚀 الطباعة عبر جسر Python
   ========================================== */
function getPrintBridgeUrl() {
    const saved = localStorage.getItem('sys_print_bridge_url');
    if (saved && saved.trim()) return saved.trim().replace(/\/$/,'');
    return 'http://localhost:8899';
}

function setPrintBridgeUrl(url) {
    localStorage.setItem('sys_print_bridge_url', String(url||'').trim());
}

// 🛠️ إصلاح: طباعة مباشرة بخطوة واحدة
async function printBothViaBridge(btnElement) {
    if (!activePendingPrintOrder) {
        // إذا لم تكن هناك فاتورة جاهزة نفتح نافذة الطباعة اليدوية
        openModal('printOptionsModal');
        return;
    }

    const ord = activePendingPrintOrder;

    if (btnElement) {
        btnElement.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري الطباعة...';
        btnElement.disabled = true;
    }

    let payload;
    try {
        payload = {
            jobs: [
                {
                    printer:    'cashier',
                    lines:      buildCustomerReceiptLines(ord),
                    openDrawer: true
                },
                {
                    printer:    'kitchen',
                    lines:      buildKitchenTicketLines(ord),
                    openDrawer: false
                }
            ]
        };
    } catch (prepErr) {
        console.error('خطأ تجهيز الفاتورة:', prepErr);
        if (btnElement) {
            btnElement.innerHTML = '🖨️ طباعة مباشرة';
            btnElement.disabled  = false;
        }
        openModal('printOptionsModal');
        return;
    }

    try {
        // 🛠️ timeout أقصر لويندوز 7
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 12000);

        const resp = await fetch(getPrintBridgeUrl(), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
            signal:  controller.signal
        });
        clearTimeout(timeoutId);

        const result = await resp.json();

        if (result.success) {
            isCustomerPrinted = true;
            isKitchenPrinted  = true;

            // ✅ إتمام الطلب تلقائياً بعد الطباعة
            setTimeout(() => {
                if (btnElement) {
                    btnElement.innerHTML = '✅ تمت الطباعة';
                    btnElement.disabled  = false;
                }
                tryFinalizeAndClearOrder(true);
            }, 600);

        } else {
            // طباعة جزئية - نفتح النافذة اليدوية
            (result.results||[]).forEach(r => {
                if (r.ok && r.printer === 'cashier') isCustomerPrinted = true;
                if (r.ok && r.printer === 'kitchen') isKitchenPrinted  = true;
            });
            updatePrintStatusBadges();
            openModal('printOptionsModal');

            const details = (result.results||[])
                .map(r => (r.ok?'✅ ':'❌ ') + r.message).join('\n');
            alert('⚠️ طباعة جزئية:\n' + details);

            if (btnElement) {
                btnElement.innerHTML = '🖨️ طباعة مباشرة';
                btnElement.disabled  = false;
            }
        }

    } catch (e) {
        // الجسر غير متاح - نفتح الطباعة اليدوية
        openModal('printOptionsModal');
        if (btnElement) {
            btnElement.innerHTML = '🖨️ طباعة مباشرة';
            btnElement.disabled  = false;
        }
    }
}

// طباعة الزبون يدوياً (احتياطي)
// ==========================================
// ✅ الدالة المُصلحة - انسخها والصقها في app.js
// ابحث عن: function executeCustomerPrintOnly()
// واستبدل الدالة كاملة بهذه
// ==========================================

function executeCustomerPrintOnly() {
    if (!activePendingPrintOrder) return alert("لا توجد فاتورة!");
    const ord      = activePendingPrintOrder;
    const printBox = document.getElementById('mim89ThermalPrintBox');
    const money    = n => Math.round(cleanPrice(n)).toLocaleString('ar-IQ');
    const design   = getInvoiceDesign();
    const widthMm  = design.paperWidth === '58' ? '48mm' : '76mm';

    const items = Array.isArray(ord.items) ? ord.items : [];

    // ✅ الإصلاح: كل خلية لها عرض صريح بالـ style مباشرة
    const itemsHtml = items.length > 0
        ? items.map(i => {
            const nm  = String(i.name || '');
            const qty = String(i.qty  || 1);
            const tot = money(cleanPrice(i.price) * cleanPrice(i.qty));
            const notes = (design.showItemNotes && i.itemNotes && i.itemNotes.length)
                ? '<br><small style="font-size:10px;color:#444;display:block;">(' +
                  i.itemNotes.join(', ') + ')</small>'
                : '';
            return '<tr style="border-bottom:1px dashed #ccc;">' +

                // عمود الاسم 55%
                '<td style="width:55%;padding:5px 3px;font-weight:900;font-size:13px;' +
                'text-align:right;word-wrap:break-word;overflow-wrap:break-word;' +
                'white-space:normal;">' + nm + notes + '</td>' +

                // عمود الكمية 15%
                '<td style="width:15%;padding:5px 2px;text-align:center;' +
                'font-weight:900;font-size:15px;white-space:nowrap;">' + qty + '</td>' +

                // عمود المبلغ 30%
                '<td style="width:30%;padding:5px 3px;text-align:right;' +
                'font-weight:900;font-size:13px;white-space:nowrap;">' + tot + '</td>' +

                '</tr>';
          }).join('')
        : '<tr><td colspan="3" style="text-align:center;font-size:12px;' +
          'padding:8px;color:#666;">لا توجد أصناف</td></tr>';

    const logoHtml = (design.showLogo && design.logoDataUrl)
        ? '<img src="' + design.logoDataUrl + '" ' +
          'style="max-width:80%;max-height:70px;display:block;margin:0 auto 5px auto;">'
        : '';

    printBox.innerHTML =
        '<div style="width:' + widthMm + ';font-family:Tajawal,sans-serif;direction:rtl;' +
        'text-align:right;color:#000;padding:1mm;">' +

        // الترويسة (شعار + اسم + عنوان - قابلة للتحكم من الأدمن)
        '<div style="text-align:center;border-bottom:2px dashed #000;' +
        'padding-bottom:5px;margin-bottom:6px;">' +
        logoHtml +
        '<h2 style="margin:0;font-size:20px;font-weight:900;">' +
        (design.restaurantName || 'MIM89 FAST FOOD') + '</h2>' +
        (design.showAddress && design.addressLine
            ? '<div style="font-size:11px;font-weight:bold;">' + design.addressLine + '</div>'
            : '') +
        '</div>' +

        // رقم الطلب
        '<div style="text-align:center;border:2px solid #000;padding:4px;' +
        'margin-bottom:6px;">' +
        '<div style="font-size:11px;font-weight:bold;">رقم الطلب</div>' +
        '<div style="font-size:40px;font-weight:900;line-height:1;">#' +
        ord.orderNum + '</div>' +
        '</div>' +

        // بيانات الفاتورة
        '<div style="font-size:11px;font-weight:bold;border-bottom:1px solid #000;' +
        'padding-bottom:4px;margin-bottom:5px;line-height:1.7;">' +
        '<div>' + ord.dateDate + ' - ' + (ord.timestamp || '') + '</div>' +
        '<div>الخدمة: <strong>' + (ord.orderType || '') + '</strong></div>' +
        (design.showCustomerName && ord.customerName && ord.customerName !== 'زبون مباشر'
            ? '<div>الزبون: <strong>' + ord.customerName + '</strong></div>' : '') +
        (design.showPhone && ord.phone && ord.phone !== '-'
            ? '<div>الهاتف: <strong>' + ord.phone + '</strong></div>' : '') +
        (design.showDriverArea && ord.orderType === 'توصيل' && ord.area && ord.area !== 'داخل المطعم'
            ? '<div>المنطقة: <strong>' + ord.area + '</strong></div>' : '') +
        (design.showDriverArea && ord.orderType === 'توصيل' && ord.driverName && ord.driverName !== '-'
            ? '<div>السائق: <strong>' + ord.driverName + '</strong></div>' : '') +
        '<div>الدفع: <strong>' + (ord.paymentMethod || 'كاش') + '</strong></div>' +
        '</div>' +

        // ✅ جدول الأصناف - مُصلح بـ table-layout:fixed + colgroup
        '<table style="width:100%;border-collapse:collapse;margin-bottom:6px;' +
        'table-layout:fixed;">' +
        '<colgroup>' +
        '<col style="width:55%;">' +
        '<col style="width:15%;">' +
        '<col style="width:30%;">' +
        '</colgroup>' +
        '<thead>' +
        '<tr style="border-bottom:2px solid #000;background:#f0f0f0;">' +
        '<th style="text-align:right;font-size:12px;padding:4px 3px;' +
        'font-weight:900;">الوجبة</th>' +
        '<th style="text-align:center;font-size:12px;padding:4px 2px;' +
        'font-weight:900;">ك</th>' +
        '<th style="text-align:right;font-size:12px;padding:4px 3px;' +
        'font-weight:900;">د.ع</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' + itemsHtml + '</tbody>' +
        '</table>' +

        // الملاحظات العامة
        (design.showOrderNotes && ord.orderNotes
            ? '<div style="font-size:11px;border-bottom:1px dashed #ccc;' +
              'padding-bottom:3px;margin-bottom:4px;">📝 ' + ord.orderNotes + '</div>'
            : '') +

        // الحساب
        '<div style="border-top:2px dashed #000;padding-top:4px;margin-top:4px;' +
        'font-size:12px;font-weight:900;line-height:1.8;">' +

        (cleanPrice(ord.discount) > 0
            ? '<div style="display:flex;justify-content:space-between;">' +
              '<span>خصم:</span><span>-' + money(ord.discount) + ' د.ع</span></div>'
            : '') +

        (cleanPrice(ord.deliveryFee) > 0
            ? '<div style="display:flex;justify-content:space-between;">' +
              '<span>التوصيل:</span><span>+' + money(ord.deliveryFee) + ' د.ع</span></div>'
            : '') +

        '<div style="display:flex;justify-content:space-between;font-size:17px;' +
        'border-top:2px solid #000;padding-top:4px;margin-top:3px;">' +
        '<span>المطلوب:</span>' +
        '<strong>' + money(ord.totalAmount) + ' د.ع</strong>' +
        '</div>' +

        (cleanPrice(ord.cashGiven) > 0
            ? '<div style="font-size:11px;color:#333;margin-top:2px;">' +
              'مدفوع: ' + money(ord.cashGiven) +
              ' | باقي: ' + money(ord.cashChange) + ' د.ع</div>'
            : '') +

        '</div>' +

        // التذييل (نص قابل للتحكم من الأدمن)
        '<div style="text-align:center;margin-top:8px;font-size:11px;' +
        'border-top:1px solid #000;padding-top:4px;">' +
        (design.footerText || 'شكراً لزيارتكم 🍔') + '</div>' +

        '</div>';

    isCustomerPrinted = true;
    updatePrintStatusBadges();
    setTimeout(() => window.print(), 150);
}

// طباعة المطبخ يدوياً (احتياطي)
function executeKitchenPrintOnly() {
    if (!activePendingPrintOrder) return alert("لا توجد فاتورة!");
    const ord      = activePendingPrintOrder;
    const printBox = document.getElementById('mim89ThermalPrintBox');

    const itemsHtml = (ord.items||[]).map(i =>
        '<div style="border-bottom:2px dashed #000;padding:5px 0;' +
        'font-size:17px;font-weight:900;">' +
        '<div style="display:flex;justify-content:space-between;">' +
        '<span>● ' + i.name + '</span>' +
        '<span style="font-size:22px;">[×' + i.qty + ']</span></div>' +
        (i.itemNotes&&i.itemNotes.length
            ? '<div style="font-size:13px;background:#eee;padding:2px 4px;">' +
              '⚠ ' + i.itemNotes.join(' — ') + '</div>' : '') +
        '</div>'
    ).join('');

    printBox.innerHTML =
        '<div style="width:76mm;font-family:Tajawal,sans-serif;direction:rtl;' +
        'text-align:right;color:#000;padding:2mm;">' +
        '<div style="text-align:center;border-bottom:3px solid #000;' +
        'padding-bottom:4px;margin-bottom:5px;">' +
        '<h1 style="margin:0;font-size:22px;font-weight:900;">🔥 أمر المطبخ</h1>' +
        '<div style="font-size:12px;">' + ord.timestamp + '</div>' +
        '</div>' +
        '<div style="text-align:center;border:3px solid #000;padding:4px;' +
        'margin-bottom:5px;">' +
        '<div style="font-size:12px;">رقم الطلب</div>' +
        '<div style="font-size:52px;font-weight:900;line-height:1;">#' + ord.orderNum + '</div>' +
        '</div>' +
        '<div style="font-size:14px;font-weight:900;margin-bottom:6px;' +
        'border-bottom:2px solid #000;padding-bottom:3px;">' +
        '<div>النوع: <strong>' + ord.orderType + '</strong></div>' +
        (ord.orderType==='توصيل'&&ord.area
            ? '<div>📍 ' + ord.area + '</div>' : '') +
        (ord.customerName&&ord.customerName!=='زبون مباشر'
            ? '<div>' + ord.customerName + '</div>' : '') +
        '</div>' +
        itemsHtml +
        (ord.orderNotes
            ? '<div style="margin-top:6px;font-size:14px;font-weight:900;' +
              'border:2px solid #000;padding:4px;">' +
              '⚠ ملاحظة: ' + ord.orderNotes + '</div>' : '') +
        '</div>';

    isKitchenPrinted = true;
    updatePrintStatusBadges();
    setTimeout(() => window.print(), 120);
}

/* ==========================================
   ✅ إتمام الطلب
   ========================================== */
function tryFinalizeAndClearOrder(silentMode) {
    if (!activePendingPrintOrder) return;

    if (activePendingPrintOrder.isReprint) {
        activePendingPrintOrder = null;
        isCustomerPrinted = false;
        isKitchenPrinted  = false;
        closeModal('printOptionsModal');
        return;
    }

    if (!isCustomerPrinted || !isKitchenPrinted) {
        if (!confirm("⚠️ لم تكتمل الطباعة! هل تريد إنهاء الطلب؟")) return;
    }

    const orderToSave = activePendingPrintOrder;
    let   completed   = getData('sys_completed_orders') || [];
    completed.unshift(orderToSave);
    safeLocalSet('sys_completed_orders', JSON.stringify(completed));

    // رفع الفاتورة للسحابة
    if (db) {
        db.collection("completed_orders")
            .doc(String(orderToSave.id))
            .set(orderToSave, { merge: true })
            .then(() => {
                try {
                    const cnt = cleanPrice(localStorage.getItem('mim89_save_counter')) + 1;
                    localStorage.setItem('mim89_save_counter', String(cnt));
                    if (cnt % 10 === 0) setTimeout(runSilentStorageMaintenance, 2000);
                } catch (_) {}
            })
            .catch(err => console.error('تعذّر رفع الفاتورة:', err));
    }

    // خصم المواد من المخزن
    if (typeof deductInventoryFromRecipe === 'function') {
        try { deductInventoryFromRecipe(orderToSave.items); } catch (_) {}
    }

    // تفريغ السلة
    posCart             = [];
    activeDiscountType  = null;
    posDiscountAmount   = 0;
    currentPercentValue = 0;
    activePendingPrintOrder = null;
    isCustomerPrinted   = false;
    isKitchenPrinted    = false;

    const fields = ['posCustName','posCustPhone','posOrderNotesInput','cashGivenInput'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    clearAllDiscounts();
    renderPosCart();
    closeModal('printOptionsModal');
    if (typeof renderDrawerDriverSettlement === 'function')
        renderDrawerDriverSettlement();

    prefetchOrderNumber(); // جهّز رقم الطلب القادم مسبقاً
}

/* ==========================================
   🖨️ إعادة طباعة من السجل
   ========================================== */
function reprintCompletedOrder(orderId) {
    const completed = getData('sys_completed_orders') || [];
    const ord = completed.find(o => o.id === orderId);
    if (ord) {
        activePendingPrintOrder = { ...ord, isReprint: true };
        isCustomerPrinted = true;
        isKitchenPrinted  = true;
        updatePrintStatusBadges();
        closeModal('completedOrdersModal');
        openModal('printOptionsModal');
    }
}

async function reprintKitchenOnly(orderId, btnElement) {
    const ord = (getData('sys_completed_orders')||[])
        .find(o => String(o.id) === String(orderId));
    if (!ord) return alert("لم يُعثر على الفاتورة!");

    let orig = '';
    if (btnElement) { orig = btnElement.innerHTML; btnElement.innerHTML='⏳'; btnElement.disabled=true; }

    try {
        const resp = await fetch(getPrintBridgeUrl(), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ jobs:[{
                printer:    'kitchen',
                lines:      buildKitchenTicketLines(ord),
                openDrawer: false
            }]})
        });
        const r = await resp.json();
        alert(r.success
            ? "✅ أُعيدت طباعة المطبخ للطلب #" + ord.orderNum
            : "⚠️ فشلت: " + (r.results||[]).map(x=>x.message).join('\n'));
    } catch (_) {
        activePendingPrintOrder = { ...ord, isReprint: true };
        executeKitchenPrintOnly();
    } finally {
        if (btnElement) { btnElement.innerHTML=orig; btnElement.disabled=false; }
    }
}

async function reprintCustomerOnly(orderId, btnElement) {
    const ord = (getData('sys_completed_orders')||[])
        .find(o => String(o.id) === String(orderId));
    if (!ord) return alert("لم يُعثر على الفاتورة!");

    let orig = '';
    if (btnElement) { orig = btnElement.innerHTML; btnElement.innerHTML='⏳'; btnElement.disabled=true; }

    try {
        const resp = await fetch(getPrintBridgeUrl(), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ jobs:[{
                printer:    'cashier',
                lines:      buildCustomerReceiptLines(ord),
                openDrawer: false
            }]})
        });
        const r = await resp.json();
        alert(r.success
            ? "✅ أُعيدت طباعة فاتورة الزبون #" + ord.orderNum
            : "⚠️ فشلت: " + (r.results||[]).map(x=>x.message).join('\n'));
    } catch (_) {
        activePendingPrintOrder = { ...ord, isReprint: true };
        executeCustomerPrintOnly();
    } finally {
        if (btnElement) { btnElement.innerHTML=orig; btnElement.disabled=false; }
    }
}

// نهاية الجزء 2

// ==========================================
// app.js - الجزء 3: التقفيل + الرواتب + التقارير + الدليفري
// ==========================================

/* ==========================================
   💰 الصندوق والمدوّر
   ========================================== */
function getDrawerOpeningFloat(dateStr) {
    const target = dateStr || getTodayString();
    const all    = getData('sys_drawer_float') || {};
    return cleanPrice(all[target]) || 0;
}

function setDrawerOpeningFloat(amount, dateStr) {
    const target = dateStr || getTodayString();
    let all = getData('sys_drawer_float');
    if (!all || Array.isArray(all)) all = {};
    all[target] = cleanPrice(amount);
    setData('sys_drawer_float', all);
}

function promptDrawerFloat() {
    const current = getDrawerOpeningFloat();
    const input   = prompt("💰 أدخل المدوّر (المبلغ الموجود بالصندوق قبل البيع):", current || "0");
    if (input === null) return;
    const amount = cleanPrice(input);
    setDrawerOpeningFloat(amount);
    logAudit('تسجيل مدوّر', { amount, cashier: activeCashierUser ? activeCashierUser.name : '-' });
    alert("✅ تم حفظ المدوّر: " + amount.toLocaleString('ar-IQ') + " د.ع");
}

/* ==========================================
   💸 الصرفيات
   ========================================== */
function openExpenseManagerModal() {
    renderExpensesList();
    loadExpenseDropdowns();
    openModal('expenseManagerModal');
}

function loadExpenseDropdowns() {
    const typeSelect = document.getElementById('expenseTypeSelect');
    if (!typeSelect) return;
    typeSelect.innerHTML =
        '<option value="عامة">صرفيات نثرية عامة</option>' +
        '<option value="مشتريات">مشتريات طارئة</option>' +
        '<option value="سلفة">سلفة موظف</option>';

    const empSelect  = document.getElementById('expenseEmployeeSelect');
    const employees  = getData('sys_employees') || [];
    if (empSelect) {
        empSelect.innerHTML = employees.map(e =>
            '<option value="' + e.name + '">' + e.name + '</option>'
        ).join('');
    }
}

function toggleExpenseTypeFields() {
    const type      = document.getElementById('expenseTypeSelect')?.value;
    const empSelect = document.getElementById('expenseEmployeeSelect');
    if (empSelect) empSelect.style.display = (type === 'سلفة') ? 'block' : 'none';
}

function addNewExpenseRecord() {
    const type    = document.getElementById('expenseTypeSelect')?.value || 'عامة';
    const amount  = cleanPrice(document.getElementById('expenseAmountInput')?.value);
    const note    = document.getElementById('expenseNoteInput')?.value.trim() || 'بدون تفاصيل';
    const empName = (type === 'سلفة')
        ? document.getElementById('expenseEmployeeSelect')?.value : '';

    if (amount <= 0) return alert("يرجى إدخال مبلغ الصرفية!");

    const expData = {
        id:               "EXP_" + Date.now(),
        type,
        amount,
        note:             (type === 'سلفة' ? 'سلفة: ' + empName + ' | ' : '') + note,
        employee:         empName || '',
        dateDate:         getTodayString(),
        createdTimestamp: Date.now(),
        cashierName:      activeCashierUser ? activeCashierUser.name : 'الرئيسي'
    };

    let expenses = getData('sys_expenses') || [];
    expenses.unshift(expData);
    setData('sys_expenses', expenses);

    logAudit('صرفية', {
        amount,
        type,
        note:    expData.note,
        cashier: activeCashierUser ? activeCashierUser.name : '-'
    });

    document.getElementById('expenseAmountInput').value = '';
    document.getElementById('expenseNoteInput').value   = '';

    renderExpensesList();
    alert("✅ تم تسجيل الصرفية!");
}

function renderExpensesList() {
    const container = document.getElementById('expensesListTable');
    if (!container) return;

    const today    = getTodayString();
    const expenses = (getData('sys_expenses') || []).filter(e => e.dateDate === today);

    if (expenses.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;color:#666;padding:10px;">لا توجد صرفيات اليوم</p>';
        return;
    }

    container.innerHTML = expenses.map(exp =>
        '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'background:#111116;padding:6px 10px;border-radius:7px;margin-bottom:4px;">' +
        '<div>' +
        '<strong style="color:#ef4444;font-size:0.85rem;">' +
        exp.amount.toLocaleString('ar-IQ') + ' د.ع</strong>' +
        '<div style="font-size:0.74rem;color:#888;">' + exp.type + ' — ' + exp.note + '</div>' +
        '</div>' +
        '<button onclick="deleteExpenseRecord(\'' + exp.id + '\')" ' +
        'style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;">✕</button>' +
        '</div>'
    ).join('');
}

function deleteExpenseRecord(id) {
    if (!confirm("حذف هذه الصرفية؟")) return;
    let expenses = getData('sys_expenses') || [];
    expenses     = expenses.filter(e => e.id !== id);
    setData('sys_expenses', expenses);
    renderExpensesList();
}

/* ==========================================
   👥 نظام الرواتب - جديد ومنفصل
   ========================================== */
function openSalaryManagerModal() {
    renderSalaryForm();
    renderSalariesList();
    openModal('salaryManagerModal');
}

function renderSalaryForm() {
    const employees = getData('sys_employees') || [];
    const empSel    = document.getElementById('salaryEmployeeSelect');
    if (empSel) {
        empSel.innerHTML =
            '<option value="">-- اختر الموظف --</option>' +
            employees.map(e =>
                '<option value="' + e.name + '">' + e.name + '</option>'
            ).join('');
    }
}

function addSalaryRecord() {
    const employee = document.getElementById('salaryEmployeeSelect')?.value;
    const amount   = cleanPrice(document.getElementById('salaryAmountInput')?.value);
    const type     = document.getElementById('salaryTypeSelect')?.value || 'راتب';
    const note     = document.getElementById('salaryNoteInput')?.value.trim() || '';

    if (!employee) return alert("⚠️ اختر الموظف أولاً!");
    if (amount <= 0) return alert("⚠️ أدخل المبلغ!");

    // 🔐 الرواتب تحتاج موافقة المالك
    requireOwnerPin('صرف ' + type + ' للموظف ' + employee, () => {
        const salaryData = {
            id:               "SAL_" + Date.now(),
            employee,
            amount,
            type,
            note,
            dateDate:         getTodayString(),
            createdTimestamp: Date.now(),
            cashierName:      activeCashierUser ? activeCashierUser.name : 'الرئيسي'
        };

        let salaries = getData('sys_salaries') || [];
        salaries.unshift(salaryData);
        setData('sys_salaries', salaries);

        // 🔐 تسجيل في سجل التدقيق
        logAudit('راتب / صرفية موظف', {
            employee,
            amount,
            type,
            approvedBy: 'المالك'
        });

        document.getElementById('salaryAmountInput').value = '';
        document.getElementById('salaryNoteInput').value   = '';

        renderSalariesList();
        alert("✅ تم صرف " + type + " لـ " + employee +
            ": " + amount.toLocaleString('ar-IQ') + " د.ع");
    });
}

function renderSalariesList() {
    const container = document.getElementById('salariesListTable');
    if (!container) return;

    const today    = getTodayString();
    const salaries = (getData('sys_salaries') || []).filter(s => s.dateDate === today);

    const total = salaries.reduce((s, x) => s + cleanPrice(x.amount), 0);

    if (salaries.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;color:#666;padding:10px;">لا توجد رواتب صُرفت اليوم</p>';
        return;
    }

    container.innerHTML =
        '<div style="background:#0d1a14;border:1px solid #10b981;border-radius:8px;' +
        'padding:8px 12px;margin-bottom:10px;display:flex;justify-content:space-between;">' +
        '<span style="color:#888;font-size:0.8rem;">إجمالي الرواتب اليوم:</span>' +
        '<strong style="color:#10b981;">' + total.toLocaleString('ar-IQ') + ' د.ع</strong>' +
        '</div>' +
        salaries.map(s =>
            '<div style="display:flex;justify-content:space-between;align-items:center;' +
            'background:#111116;padding:8px 11px;border-radius:7px;margin-bottom:5px;' +
            'border-right:3px solid #10b981;">' +
            '<div>' +
            '<strong style="color:#fff;font-size:0.85rem;">👤 ' + s.employee + '</strong>' +
            '<div style="font-size:0.73rem;color:#888;">' + s.type +
            (s.note ? ' — ' + s.note : '') + '</div>' +
            '</div>' +
            '<strong style="color:#10b981;">' +
            cleanPrice(s.amount).toLocaleString('ar-IQ') + ' د.ع</strong>' +
            '</div>'
        ).join('');
}

/* ==========================================
   📊 ملخص مبيعات الشيفت
   ========================================== */
function computeTodaySalesSummary() {
    const orders   = getShiftOrders();
    const expenses = getShiftExpenses();
    const salaries = getShiftSalaries();

    let totalSales = 0, totalCash = 0, totalVisa = 0,
        totalDelivery = 0, totalExp = 0, totalSal = 0;

    orders.forEach(o => {
        const amt = cleanPrice(o.totalAmount);
        totalSales    += amt;
        totalDelivery += cleanPrice(o.deliveryFee);
        if (o.paymentMethod && String(o.paymentMethod).includes('فيزا'))
            totalVisa += amt;
        else
            totalCash += amt;
    });

    expenses.forEach(e => totalExp += cleanPrice(e.amount));
    salaries.forEach(s => totalSal += cleanPrice(s.amount));

    const float = getDrawerOpeningFloat(getTodayString());

    return {
        ordersCount:   orders.length,
        totalSales,
        totalCash,
        totalVisa,
        totalDelivery,
        totalExpenses: totalExp,
        totalSalaries: totalSal,
        openingFloat:  float,
        netInDrawer:   Math.max(0, float + totalCash - totalExp - totalSal)
    };
}

function updateLiveShiftSalesBadge() {
    const badge = document.getElementById('liveShiftSalesBadge');
    if (!badge) return;
    const s = computeTodaySalesSummary();
    badge.innerHTML =
        s.totalSales.toLocaleString('ar-IQ') + ' د.ع' +
        ' <span style="font-size:0.72rem;color:#aaa;font-weight:normal;">(' +
        s.ordersCount + ' فاتورة)</span>';
}

let liveSalesBadgeTimer = null;
function startLiveSalesBadgeUpdater() {
    if (!document.getElementById('liveShiftSalesBadge')) return;
    updateLiveShiftSalesBadge();
    if (liveSalesBadgeTimer) clearInterval(liveSalesBadgeTimer);
    liveSalesBadgeTimer = setInterval(updateLiveShiftSalesBadge, 20000);
}

/* ==========================================
   🔒 تقفيل الشيفت - مُصلح
   ========================================== */
function openShiftReportModal() {
    renderShiftClosingReport();
    openModal('shiftReportModal');
}

function renderShiftClosingReport() {
    const container = document.getElementById('shiftReportBody');
    if (!container) return;

    const orders   = getShiftOrders();
    const expenses = getShiftExpenses();
    const salaries = getShiftSalaries();
    const float    = getDrawerOpeningFloat(getTodayString());

    let totalSales = 0, cash = 0, visa = 0, deliveryFees = 0, discounts = 0;
    let dineIn = 0, takeaway = 0, delivery = 0;

    orders.forEach(o => {
        const amt = cleanPrice(o.totalAmount);
        totalSales    += amt;
        deliveryFees  += cleanPrice(o.deliveryFee);
        discounts     += cleanPrice(o.discount);
        if (o.paymentMethod && String(o.paymentMethod).includes('فيزا'))
            visa += amt;
        else
            cash += amt;
        if (o.orderType === 'توصيل')  delivery++;
        else if (o.orderType === 'سفري') takeaway++;
        else dineIn++;
    });

    const totalExp = expenses.reduce((s,e) => s + cleanPrice(e.amount), 0);
    const totalSal = salaries.reduce((s,x) => s + cleanPrice(x.amount), 0);

    // الطلبات المعلقة مع السائقين
    const pending = getUnsettledDeliveryOrders();
    const pendingCash = pending
        .filter(o => !(o.paymentMethod && String(o.paymentMethod).includes('فيزا')))
        .reduce((s,o) => s + cleanPrice(o.totalAmount), 0);

    const expectedCash = float + cash - totalExp - totalSal - pendingCash;

    const row = (label, value, color, bold) =>
        '<div style="display:flex;justify-content:space-between;padding:4px 0;' +
        'border-bottom:1px solid #1a1a22;' + (bold ? 'font-weight:900;' : '') + '">' +
        '<span style="color:#bbb;">' + label + '</span>' +
        '<strong style="color:' + (color || '#fff') + ';">' + value + '</strong></div>';

    const money = n => cleanPrice(Math.round(n)).toLocaleString('ar-IQ') + ' د.ع';

    let html = '';

    // بيانات الشيفت
    html += '<div style="background:#111116;padding:10px;border-radius:9px;margin-bottom:10px;">';
    html += '<div style="color:#fbbf24;font-weight:900;margin-bottom:6px;text-align:center;">🕐 الشيفت</div>';
    html += row('الكاشير:', activeCashierUser ? activeCashierUser.name : 'الرئيسي');
    html += row('بدأ في:', getShiftStartLabel(), '#aaa');
    html += row('الفواتير:', orders.length + ' فاتورة', '#fbbf24', true);
    html += '</div>';

    // المبيعات
    html += '<div style="background:#111116;padding:10px;border-radius:9px;margin-bottom:10px;">';
    html += '<div style="color:#fbbf24;font-weight:900;margin-bottom:6px;text-align:center;">💰 المبيعات</div>';
    html += row('🍽️ صالة:', dineIn + ' طلب', '#ccc');
    html += row('🛍️ سفري:', takeaway + ' طلب', '#ccc');
    html += row('🛵 توصيل:', delivery + ' طلب', '#ccc');
    html += row('إجمالي المبيعات:', money(totalSales), '#fbbf24', true);
    html += row('كاش:', money(cash), '#10b981');
    html += row('فيزا:', money(visa), '#38bdf8');
    if (discounts > 0)
        html += row('⚠️ الخصومات:', '−' + money(discounts), '#ef4444');
    html += row('أجور التوصيل:', money(deliveryFees), '#aaa');
    html += '</div>';

    // الصرفيات
    html += '<div style="background:#111116;padding:10px;border-radius:9px;margin-bottom:10px;">';
    html += '<div style="color:#ef4444;font-weight:900;margin-bottom:6px;text-align:center;">💸 الصرفيات</div>';
    if (expenses.length === 0) {
        html += '<p style="color:#666;text-align:center;font-size:0.8rem;">لا توجد صرفيات</p>';
    } else {
        expenses.slice(0, 8).forEach(e =>
            html += row(e.type + ' — ' + e.note,
                '−' + cleanPrice(e.amount).toLocaleString('ar-IQ'), '#ef4444')
        );
        if (expenses.length > 8)
            html += '<p style="font-size:0.72rem;color:#666;text-align:center;">+' +
                (expenses.length - 8) + ' صرفية أخرى</p>';
    }
    html += row('إجمالي الصرفيات:', '−' + money(totalExp), '#ef4444', true);
    html += '</div>';

    // الرواتب منفصلة
    html += '<div style="background:#0d1a14;padding:10px;border-radius:9px;' +
        'margin-bottom:10px;border:1px solid rgba(16,185,129,0.3);">';
    html += '<div style="color:#10b981;font-weight:900;margin-bottom:6px;text-align:center;">👥 الرواتب والسُلف</div>';
    if (salaries.length === 0) {
        html += '<p style="color:#666;text-align:center;font-size:0.8rem;">لا توجد رواتب صُرفت</p>';
    } else {
        salaries.forEach(s =>
            html += row('👤 ' + s.employee + ' — ' + s.type,
                '−' + cleanPrice(s.amount).toLocaleString('ar-IQ'), '#10b981')
        );
    }
    html += row('إجمالي الرواتب:', '−' + money(totalSal), '#10b981', true);
    html += '</div>';

    // الدليفري المعلق
    if (pending.length > 0) {
        html += '<div style="background:#1a0d0d;padding:10px;border-radius:9px;' +
            'margin-bottom:10px;border:1px solid rgba(239,68,68,0.4);">';
        html += '<div style="color:#ef4444;font-weight:900;margin-bottom:6px;text-align:center;">' +
            '🛵 طلبات بذمة السائقين</div>';
        pending.forEach(o =>
            html += row('#' + o.orderNum + ' — ' + (o.driverName||''),
                money(o.totalAmount), '#fbbf24')
        );
        html += row('مبالغ لم تصل الصندوق:', '−' + money(pendingCash), '#ef4444', true);
        html += '</div>';
    }

    // تسوية الصندوق
    html += '<div style="background:#1a1608;padding:12px;border-radius:9px;' +
        'border:2px solid #f59e0b;">';
    html += '<div style="color:#fbbf24;font-weight:900;margin-bottom:8px;text-align:center;">🧮 تسوية الصندوق</div>';
    html += row('المدوّر:', '+' + money(float), '#10b981');
    html += row('مبيعات كاش:', '+' + money(cash), '#10b981');
    html += row('الصرفيات:', '−' + money(totalExp), '#ef4444');
    html += row('الرواتب:', '−' + money(totalSal), '#10b981');
    if (pendingCash > 0)
        html += row('مع السائقين:', '−' + money(pendingCash), '#ef4444');
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0 4px;' +
        'border-top:2px solid #f59e0b;margin-top:4px;font-size:1rem;font-weight:900;">' +
        '<span>💵 المتوقع بالدرج:</span>' +
        '<strong style="color:#fbbf24;">' + money(expectedCash) + '</strong></div>';

    html += '<label style="font-size:0.78rem;color:#aaa;display:block;margin-top:10px;margin-bottom:4px;">✋ النقد المعدود فعلياً:</label>';
    html += '<input type="number" id="actualCashInput" ' +
        'style="width:100%;padding:9px;background:#0d0d11;border:1px solid #333;' +
        'border-radius:7px;color:#fff;font-size:1rem;text-align:center;box-sizing:border-box;" ' +
        'placeholder="اعدد النقد واكتب..." ' +
        'oninput="calculateCashDifference(' + expectedCash + ')">';
    html += '<div id="cashDifferenceResult" style="margin-top:8px;text-align:center;' +
        'font-size:0.95rem;font-weight:900;min-height:24px;"></div>';
    html += '</div>';

    container.innerHTML = html;
}

function calculateCashDifference(expected) {
    const el    = document.getElementById('cashDifferenceResult');
    const input = document.getElementById('actualCashInput');
    if (!el || !input || !input.value) { if (el) el.innerHTML = ''; return; }

    const actual = cleanPrice(input.value);
    const diff   = actual - cleanPrice(expected);

    if (diff === 0)
        el.innerHTML = '<span style="color:#10b981;">✅ الصندوق مطابق تماماً</span>';
    else if (diff > 0)
        el.innerHTML = '<span style="color:#f59e0b;">⬆️ زيادة: ' +
            diff.toLocaleString('ar-IQ') + ' د.ع</span>';
    else
        el.innerHTML = '<span style="color:#ef4444;">⬇️ عجز: ' +
            Math.abs(diff).toLocaleString('ar-IQ') + ' د.ع</span>';
}

// 🔐 التقفيل يحتاج PIN المالك
function confirmCloseShiftAndLogout() {
    const pending = getUnsettledDeliveryOrders();
    if (pending.length > 0) {
        if (!confirm('⚠️ يوجد ' + pending.length +
            ' طلب بذمة السائقين!\nهل تريد التقفيل رغم ذلك؟')) return;
    }

    requireOwnerPin('تقفيل الشيفت والصندوق', () => {
        const actualEl   = document.getElementById('actualCashInput');
        const actualCash = actualEl ? cleanPrice(actualEl.value) : 0;

        if (!actualCash) {
            if (!confirm('لم تُدخل النقد المعدود.\nهل تريد المتابعة؟')) return;
        }

        const s          = computeTodaySalesSummary();
        const pendingCash = getUnsettledDeliveryOrders()
            .filter(o => !(o.paymentMethod && String(o.paymentMethod).includes('فيزا')))
            .reduce((sum,o) => sum + cleanPrice(o.totalAmount), 0);

        const expected = s.openingFloat + s.totalCash -
            s.totalExpenses - s.totalSalaries - pendingCash;

        // أرشفة الشيفت
        let archive = getData('sys_shift_archive');
        if (!Array.isArray(archive)) archive = [];
        archive.unshift({
            id:                   'SHIFT_' + Date.now(),
            cashier:              activeCashierUser ? activeCashierUser.name : 'الرئيسي',
            startedAt:            getShiftStartLabel(),
            closedAt:             new Date().toLocaleString('ar-IQ'),
            closedTs:             Date.now(),
            dateDate:             getTodayString(),
            ordersCount:          s.ordersCount,
            totalSales:           s.totalSales,
            totalCash:            s.totalCash,
            totalVisa:            s.totalVisa,
            totalExpenses:        s.totalExpenses,
            totalSalaries:        s.totalSalaries,
            openingFloat:         s.openingFloat,
            pendingDelivery:      pendingCash,
            expectedCash:         expected,
            actualCash:           actualCash,
            difference:           actualCash ? (actualCash - expected) : null
        });
        if (archive.length > 200) archive = archive.slice(0, 200);
        setData('sys_shift_archive', archive);

        logAudit('تقفيل شيفت', {
            amount:    s.totalSales,
            expected:  expected,
            actual:    actualCash,
            diff:      actualCash ? (actualCash - expected) : 'لم يُدخل',
            approvedBy:'المالك'
        });

        startNewShift();
        sessionStorage.clear();
        alert('✅ تم تقفيل الشيفت.\nالفواتير محفوظة بالسجل.');
        location.reload();
    });
}

/* ==========================================
   🛵 الدليفري وحسابات السائقين
   ========================================== */
function getUnsettledDeliveryOrders() {
    return getShiftOrders().filter(o =>
        o.orderType === 'توصيل' &&
        o.driverName && o.driverName !== '-' &&
        !o.isSettled
    );
}

function markDeliveryOrderSettled(orderId) {
    let all = getData('sys_completed_orders') || [];
    const ord = all.find(o => String(o.id) === String(orderId));
    if (!ord) return;

    if (!confirm('تأكيد استلام مبلغ #' + ord.orderNum +
        ' (' + cleanPrice(ord.totalAmount).toLocaleString('ar-IQ') +
        ' د.ع) من السائق ' + ord.driverName + '؟')) return;

    ord.isSettled        = true;
    ord.settledTimestamp = Date.now();
    ord.settledBy        = activeCashierUser ? activeCashierUser.name : 'الرئيسي';
    ord.lastModified     = Date.now();
    setData('sys_completed_orders', all);

    logAudit('تصفية دليفري', {
        orderNum: ord.orderNum,
        amount:   cleanPrice(ord.totalAmount),
        driver:   ord.driverName
    });

    if (db) {
        db.collection("completed_orders").doc(String(ord.id))
            .set({
                isSettled:        true,
                settledTimestamp: ord.settledTimestamp,
                settledBy:        ord.settledBy,
                lastModified:     ord.lastModified
            }, { merge: true })
            .catch(err => showCloudErrorBanner(translateFirestoreError(err)));
    }

    renderPendingDeliveriesList();
    renderDrawerDriverSettlement();
    alert('✅ تم تسجيل استلام المبلغ — الطلب #' + ord.orderNum);
}

function openPendingDeliveriesModal() {
    renderPendingDeliveriesList();
    openModal('pendingDeliveriesModal');
}

function renderPendingDeliveriesList() {
    const container  = document.getElementById('pendingDeliveriesList');
    const summaryEl  = document.getElementById('pendingDeliveriesSummary');
    if (!container) return;

    const pending = getUnsettledDeliveryOrders();

    if (summaryEl) {
        const total = pending.reduce((s,o) => s + cleanPrice(o.totalAmount), 0);
        const fees  = pending.reduce((s,o) => s + cleanPrice(o.deliveryFee),  0);
        summaryEl.innerHTML =
            '<div style="display:flex;justify-content:space-around;text-align:center;' +
            'flex-wrap:wrap;gap:8px;">' +
            '<div><div style="font-size:0.7rem;color:#aaa;">طلبات بالشارع</div>' +
            '<strong style="color:#ef4444;font-size:1.1rem;">' + pending.length + '</strong></div>' +
            '<div><div style="font-size:0.7rem;color:#aaa;">مبالغ لم تُستلم</div>' +
            '<strong style="color:#fbbf24;font-size:1.1rem;">' +
            total.toLocaleString('ar-IQ') + '</strong></div>' +
            '<div><div style="font-size:0.7rem;color:#aaa;">أجور توصيل</div>' +
            '<strong style="color:#aaa;font-size:1.1rem;">' +
            fees.toLocaleString('ar-IQ') + '</strong></div>' +
            '</div>';
    }

    if (pending.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;color:#10b981;padding:18px;font-weight:bold;">' +
            '✅ لا توجد طلبات معلقة</p>';
        return;
    }

    // تجميع حسب السائق
    const byDriver = {};
    pending.forEach(o => {
        const d = o.driverName || 'غير محدد';
        if (!byDriver[d]) byDriver[d] = [];
        byDriver[d].push(o);
    });

    container.innerHTML = Object.keys(byDriver).map(driver => {
        const dOrders = byDriver[driver];
        const dTotal  = dOrders.reduce((s,o) => s + cleanPrice(o.totalAmount), 0);
        const dFees   = dOrders.reduce((s,o) => s + cleanPrice(o.deliveryFee),  0);

        const rows = dOrders.map(o => {
            const mins = Math.floor((Date.now() - cleanPrice(o.createdTimestamp)) / 60000);
            const tColor = mins > 45 ? '#ef4444' : (mins > 25 ? '#f59e0b' : '#888');
            return '<div style="display:flex;justify-content:space-between;align-items:center;' +
                'background:#0d0d11;padding:8px 10px;border-radius:7px;margin-bottom:4px;">' +
                '<div>' +
                '<strong style="color:#fbbf24;font-size:0.85rem;">#' + o.orderNum + '</strong>' +
                '<span style="font-size:0.75rem;color:#ccc;"> — ' + (o.customerName||'') + '</span>' +
                '<div style="font-size:0.72rem;color:' + tColor + ';">⏱ ' + mins + ' دقيقة</div>' +
                '<div style="font-size:0.8rem;color:#10b981;font-weight:bold;">' +
                cleanPrice(o.totalAmount).toLocaleString('ar-IQ') + ' د.ع</div>' +
                '</div>' +
                '<button onclick="markDeliveryOrderSettled(\'' + o.id + '\')" ' +
                'class="gold-btn btn-sm" ' +
                'style="background:#10b981;color:#fff;border:none;padding:7px 10px;' +
                'font-size:0.72rem;font-weight:900;white-space:nowrap;">✅ تسليم</button>' +
                '</div>';
        }).join('');

        return '<div style="background:#111116;border:1px solid #f59e0b;' +
            'border-radius:9px;padding:10px;margin-bottom:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;' +
            'margin-bottom:7px;border-bottom:1px dashed #333;padding-bottom:5px;">' +
            '<strong style="color:#fff;">🛵 ' + driver + '</strong>' +
            '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;' +
            'font-size:0.72rem;font-weight:bold;">' + dOrders.length + ' طلب</span>' +
            '</div>' + rows +
            '<div style="border-top:1px dashed #333;padding-top:7px;margin-top:5px;' +
            'display:flex;justify-content:space-between;align-items:center;">' +
            '<div style="font-size:0.75rem;color:#aaa;">' +
            'المقبوض: <strong style="color:#fff;">' +
            dTotal.toLocaleString('ar-IQ') + '</strong> — ' +
            'توصيل: <strong style="color:#fff;">' +
            dFees.toLocaleString('ar-IQ') + '</strong><br>' +
            '<span style="color:#10b981;font-weight:bold;">الصافي: ' +
            (dTotal - dFees).toLocaleString('ar-IQ') + ' د.ع</span></div>' +
            '<button onclick="settleDriverAccount(\'' + driver + '\')" ' +
            'class="gold-btn btn-sm" ' +
            'style="background:#f59e0b;color:#000;border:none;padding:8px 10px;' +
            'font-weight:900;font-size:0.72rem;white-space:nowrap;">تصفية الكل</button>' +
            '</div></div>';
    }).join('');
}

function settleDriverAccount(driverName) {
    const rep = getDriverDailySettlementReport(driverName);
    if (rep.ordersCount === 0)
        return alert("لا توجد طلبات معلقة لهذا السائق!");

    if (!confirm('تأكيد استلام ' + rep.netToPayToRestaurant.toLocaleString('ar-IQ') +
        ' د.ع من السائق ' + driverName + '؟')) return;

    let completed = getData('sys_completed_orders') || [];
    const nowTs   = Date.now();
    const changed = [];

    completed.forEach(o => {
        if (o.orderType === 'توصيل' && o.driverName === driverName && !o.isSettled) {
            o.isSettled        = true;
            o.settledTimestamp = nowTs;
            o.lastModified     = nowTs;
            changed.push(o);
        }
    });

    setData('sys_completed_orders', completed);
    logAudit('تصفية سائق', {
        driver: driverName,
        amount: rep.netToPayToRestaurant,
        orders: rep.ordersCount
    });

    if (db) {
        changed.forEach(o => {
            db.collection("completed_orders").doc(String(o.id))
                .set({ isSettled:true, settledTimestamp:nowTs, lastModified:nowTs },
                    { merge:true })
                .catch(() => {});
        });
    }

    renderPendingDeliveriesList();
    renderDrawerDriverSettlement();
    alert('✅ تمت تصفية حساب السائق ' + driverName);
}

function getDriverDailySettlementReport(driverName) {
    const orders = getShiftOrders().filter(o =>
        o.orderType === 'توصيل' && o.driverName === driverName && !o.isSettled
    );
    const totalCollected = orders.reduce((s,o) => s + cleanPrice(o.totalAmount), 0);
    const totalFees      = orders.reduce((s,o) => s + cleanPrice(o.deliveryFee),  0);

    return {
        driverName,
        ordersCount:            orders.length,
        ordersList:             orders,
        totalAmountCollected:   totalCollected,
        totalDeliveryFees:      totalFees,
        netToPayToRestaurant:   totalCollected - totalFees
    };
}

function renderDrawerDriverSettlement() {
    const container = document.getElementById('drawerDeliverySettlementBox');
    if (!container) return;

    const drivers   = getData('sys_drivers') || [];
    const today     = getTodayString();
    const completed = getData('sys_completed_orders') || [];

    let html     = '<h4 style="color:#f59e0b;font-size:0.88rem;margin-bottom:8px;' +
        'border-bottom:1px solid #222;padding-bottom:4px;">🛵 حسابات السائقين:</h4>';
    let hasOrders = false;

    drivers.forEach(drv => {
        const driverOrders = completed.filter(o =>
            o.dateDate === today && o.orderType === 'توصيل' &&
            o.driverName === drv.name && !o.isSettled
        );

        if (driverOrders.length > 0) {
            hasOrders = true;
            const totalCollected = driverOrders.reduce((s,o) => s + cleanPrice(o.totalAmount), 0);
            const totalDelivery  = driverOrders.reduce((s,o) => s + cleanPrice(o.deliveryFee),  0);
            const netBox         = totalCollected - totalDelivery;

            html +=
                '<div style="background:#111116;border:1px solid #333;border-radius:7px;' +
                'padding:7px;margin-bottom:6px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#fff;">' +
                '<strong>👤 ' + drv.name + '</strong>' +
                '<span style="background:#ef4444;color:#fff;padding:1px 5px;border-radius:3px;' +
                'font-size:0.7rem;">' + driverOrders.length + ' طلب</span></div>' +
                '<div style="font-size:0.74rem;color:#888;margin:4px 0;">' +
                'مقبوض: ' + totalCollected.toLocaleString('ar-IQ') +
                ' | توصيل: ' + totalDelivery.toLocaleString('ar-IQ') + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;' +
                'border-top:1px dashed #333;padding-top:4px;">' +
                '<strong style="color:#10b981;font-size:0.8rem;">' +
                'صافي: ' + netBox.toLocaleString('ar-IQ') + ' د.ع</strong>' +
                '<button onclick="confirmDriverSettlement(\'' + drv.name + '\')" ' +
                'style="background:#10b981;color:#fff;border:none;padding:3px 8px;' +
                'border-radius:5px;font-size:0.72rem;cursor:pointer;font-weight:bold;">' +
                '✅ تصفية</button></div></div>';
        }
    });

    if (!hasOrders) {
        html += '<p style="color:#555;font-size:0.75rem;text-align:center;margin:0;">' +
            'لا توجد حسابات معلقة</p>';
    }

    container.innerHTML = html;
}

function confirmDriverSettlement(driverName) {
    if (confirm('تأكيد تصفية ذمة السائق (' + driverName + ')؟')) {
        settleDriverAccount(driverName);
    }
}

/* ==========================================
   📊 التقارير
   ========================================== */
function openCompletedOrdersModal() {
    const dateInput = document.getElementById('ordersLogDateInput');
    if (dateInput && !dateInput.value) dateInput.value = getTodayString();
    renderCompletedOrdersLog();
    openModal('completedOrdersModal');
}

function renderCompletedOrdersLog() {
    const container  = document.getElementById('completedOrdersList');
    if (!container) return;

    const targetDate = document.getElementById('ordersLogDateInput')?.value || getTodayString();
    const searchRaw  = (document.getElementById('ordersLogSearchInput')?.value || '').toLowerCase();
    const completed  = getData('sys_completed_orders') || [];
    let   list       = completed.filter(o => o.dateDate === targetDate);

    if (searchRaw) {
        list = list.filter(o =>
            String(o.orderNum  || '').includes(searchRaw) ||
            String(o.customerName || '').toLowerCase().includes(searchRaw) ||
            String(o.phone || '').includes(searchRaw)
        );
    }

    const summaryEl = document.getElementById('ordersLogSummary');
    if (summaryEl) {
        const total = list.reduce((s,o) => s + cleanPrice(o.totalAmount), 0);
        summaryEl.innerHTML =
            'الفواتير: <strong style="color:#fbbf24;">' + list.length + '</strong>' +
            ' &nbsp;|&nbsp; الإجمالي: <strong style="color:#10b981;">' +
            total.toLocaleString('ar-IQ') + ' د.ع</strong>';
    }

    if (list.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;color:#666;padding:14px;">لا توجد فواتير</p>';
        return;
    }

    container.innerHTML = list.map(o => {
        const typeIcon = o.orderType==='توصيل' ? '🛵' :
                         o.orderType==='سفري'  ? '🛍️' : '🍽️';
        return '<div style="background:#111116;border:1px solid #1e1e28;padding:9px;' +
            'border-radius:9px;margin-bottom:6px;display:flex;justify-content:space-between;' +
            'align-items:center;gap:8px;">' +
            '<div style="min-width:0;">' +
            '<strong style="color:#fbbf24;font-size:0.88rem;">#' + o.orderNum +
            ' ' + typeIcon + ' ' + o.orderType + '</strong>' +
            '<div style="font-size:0.73rem;color:#bbb;margin-top:2px;">' +
            (o.timestamp||'') + ' • ' + (o.customerName||'زبون') +
            (o.driverName && o.driverName!=='-' ? ' • 🛵 '+o.driverName : '') +
            '</div>' +
            '<div style="font-size:0.78rem;color:#10b981;font-weight:bold;margin-top:2px;">' +
            cleanPrice(o.totalAmount).toLocaleString('ar-IQ') + ' د.ع' +
            '<span style="color:#888;font-size:0.7rem;"> (' + (o.paymentMethod||'كاش') + ')</span>' +
            '</div></div>' +
            '<div style="display:flex;flex-direction:column;gap:4px;">' +
            '<button onclick="reprintCustomerOnly(\'' + o.id + '\',this)" ' +
            'class="gold-btn btn-sm" ' +
            'style="background:#1e1e28;color:#fbbf24;border:1px solid #333;' +
            'font-size:0.7rem;padding:5px 8px;white-space:nowrap;">🧾 فاتورة</button>' +
            '<button onclick="reprintKitchenOnly(\'' + o.id + '\',this)" ' +
            'class="gold-btn btn-sm" ' +
            'style="background:#3d0000;color:#ff9b9b;border:none;' +
            'font-size:0.7rem;padding:5px 8px;white-space:nowrap;">🔥 مطبخ</button>' +
            '</div></div>';
    }).join('');
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
    const completed = (getData('sys_completed_orders')||[])
        .filter(o => o.dateDate === targetDate);
    const expenses  = (getData('sys_expenses')||[])
        .filter(e => e.dateDate === targetDate);
    const salaries  = (getData('sys_salaries')||[])
        .filter(s => s.dateDate === targetDate);

    let totalSales=0, totalCash=0, totalVisa=0,
        totalDelivery=0, netFood=0, totalExp=0, totalSal=0;

    completed.forEach(o => {
        const amt = cleanPrice(o.totalAmount);
        totalSales    += amt;
        totalDelivery += cleanPrice(o.deliveryFee);
        netFood       += cleanPrice(o.subtotal);
        if (o.paymentMethod && o.paymentMethod.includes('فيزا')) totalVisa += amt;
        else totalCash += amt;
    });

    expenses.forEach(e => totalExp += cleanPrice(e.amount));
    salaries.forEach(s => totalSal += cleanPrice(s.amount));

    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    setTxt('reportDateText',    'تاريخ: ' + targetDate);
    setTxt('repTotalSales',     totalSales.toLocaleString('ar-IQ'));
    setTxt('repOrdersCount',    completed.length);
    setTxt('repTotalCash',      totalCash.toLocaleString('ar-IQ'));
    setTxt('repTotalVisa',      totalVisa.toLocaleString('ar-IQ'));
    setTxt('repTotalDelivery',  totalDelivery.toLocaleString('ar-IQ'));
    setTxt('repNetFood',        netFood.toLocaleString('ar-IQ'));
    setTxt('repTotalExpenses',  totalExp.toLocaleString('ar-IQ'));
    setTxt('repTotalSalaries',  totalSal.toLocaleString('ar-IQ'));

    const openFloat = getDrawerOpeningFloat(targetDate);
    setTxt('repOpeningFloat',   openFloat.toLocaleString('ar-IQ'));
    setTxt('repNetCashBox',
        Math.max(0, openFloat + totalCash - totalExp - totalSal).toLocaleString('ar-IQ'));

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
    const completed = (getData('sys_completed_orders')||[])
        .filter(o => o.dateDate === targetDate);
    const itemsMap  = {};
    let   grandQty  = 0;

    completed.forEach(o => {
        (o.items||[]).forEach(i => {
            const qty = cleanPrice(i.qty);
            if (!itemsMap[i.name]) itemsMap[i.name] = { qty:0, total:0 };
            itemsMap[i.name].qty   += qty;
            itemsMap[i.name].total += cleanPrice(i.price) * qty;
            grandQty += qty;
        });
    });

    const setTxt = (id,txt) => { const el=document.getElementById(id); if(el) el.innerText=txt; };
    setTxt('itemsReportDateText', 'جرد يوم: ' + targetDate);
    setTxt('repTotalItemsQty',    grandQty + ' قطعة');

    const container = document.getElementById('repItemsSoldListDetail');
    if (!container) return;

    if (Object.keys(itemsMap).length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:14px;">لا توجد مبيعات</p>';
        return;
    }

    container.innerHTML = Object.keys(itemsMap).map(name =>
        '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'background:#111116;padding:7px 10px;border-radius:7px;margin-bottom:4px;">' +
        '<strong style="color:#fff;">● ' + name + '</strong>' +
        '<div>' +
        '<span style="color:#fbbf24;font-weight:bold;">' + itemsMap[name].qty + ' قطعة</span>' +
        '<span style="color:#888;font-size:0.74rem;"> (' +
        itemsMap[name].total.toLocaleString('ar-IQ') + ' د.ع)</span>' +
        '</div></div>'
    ).join('');
}

function exportItemsReportPDFAndWhatsApp() {
    const targetDate = document.getElementById('itemsReportDateInput')?.value || getTodayString();
    const completed  = (getData('sys_completed_orders')||[]).filter(o => o.dateDate === targetDate);
    const itemsMap   = {};
    let   grandQty   = 0;

    completed.forEach(o => {
        (o.items||[]).forEach(i => {
            const qty = cleanPrice(i.qty);
            if (!itemsMap[i.name]) itemsMap[i.name] = { qty:0, total:0 };
            itemsMap[i.name].qty   += qty;
            itemsMap[i.name].total += cleanPrice(i.price) * qty;
            grandQty += qty;
        });
    });

    let msg = '📦 *جرد الوجبات — MIM89*\n';
    msg += '📅 ' + targetDate + '\n';
    msg += '📊 إجمالي: ' + grandQty + ' قطعة\n';
    msg += '——————————————\n';
    Object.keys(itemsMap).forEach(name => {
        msg += '• *' + name + ':* ' + itemsMap[name].qty + ' قطعة (' +
            itemsMap[name].total.toLocaleString('ar-IQ') + ' د.ع)\n';
    });

    window.open('https://api.whatsapp.com/send?phone=9647750008630&text=' +
        encodeURIComponent(msg), '_blank');
}

function openDriverSettlementModal() {
    const drivers      = getData('sys_drivers') || [];
    const repContainer = document.getElementById('repDriversList');
    if (!repContainer) return;

    let html = '<div style="background:#111116;padding:10px;border-radius:9px;margin-top:10px;">' +
        '<h4 style="color:#f59e0b;margin-bottom:8px;font-size:0.9rem;">' +
        '🛵 تصفية السائقين:</h4>';

    drivers.forEach(drv => {
        const rep = getDriverDailySettlementReport(drv.name);
        html +=
            '<div style="background:#0d0d11;border:1px solid #1e1e28;padding:8px;' +
            'border-radius:8px;margin-bottom:8px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<strong style="color:#fff;font-size:0.88rem;">👤 ' + drv.name + '</strong>' +
            '<span style="background:#333;color:#fbbf24;padding:1px 7px;border-radius:4px;' +
            'font-size:0.74rem;font-weight:bold;">' + rep.ordersCount + ' طلبات</span>' +
            '</div>' +
            '<div style="font-size:0.77rem;color:#aaa;margin:5px 0;">' +
            'مقبوض: ' + rep.totalAmountCollected.toLocaleString('ar-IQ') +
            ' | توصيل: ' + rep.totalDeliveryFees.toLocaleString('ar-IQ') +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;' +
            'border-top:1px dashed #333;padding-top:5px;">' +
            '<strong style="color:#10b981;font-size:0.88rem;">' +
            'الصافي: ' + rep.netToPayToRestaurant.toLocaleString('ar-IQ') + ' د.ع</strong>' +
            (rep.ordersCount > 0
                ? '<button class="gold-btn btn-sm" ' +
                  'onclick="settleDriverAccount(\'' + drv.name + '\')" ' +
                  'style="background:#10b981;color:#fff;border:none;padding:5px 10px;' +
                  'font-size:0.74rem;">✅ استلام وتصفية</button>'
                : '') +
            '</div></div>';
    });

    html += '</div>';
    repContainer.innerHTML = html;
}

/* ==========================================
   🔔 التنبيهات الصوتية
   ========================================== */
let knownOrderIds      = new Set();
let continuousAlertTimer = null;
let globalAudioCtx     = null;

function unlockIpadAudio() {
    try {
        if (!globalAudioCtx)
            globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
        const osc  = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        gain.gain.value = 0.01;
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.start(0);
        osc.stop(0.1);
        alert("🔔 تم تفعيل التنبيه الصوتي!");
    } catch (e) { console.log("Audio unlock:", e); }
}

document.addEventListener('touchstart', () => {
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
}, { once: true });

function startContinuousAlert() {
    if (continuousAlertTimer) return;
    playSingleBeep();
    continuousAlertTimer = setInterval(playSingleBeep, 1500);
}

function stopContinuousAlert() {
    if (continuousAlertTimer) { clearInterval(continuousAlertTimer); continuousAlertTimer = null; }
}

function playSingleBeep() {
    try {
        if (!globalAudioCtx)
            globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
        const osc  = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, globalAudioCtx.currentTime);
        gain.gain.setValueAtTime(0.35, globalAudioCtx.currentTime);
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.start();
        osc.stop(globalAudioCtx.currentTime + 0.25);
    } catch (_) {}
}

// نهاية الجزء 3

// ==========================================
// app.js - الجزء 4: الأدمن + المينيو + الأقسام + الزبائن
// ==========================================

/* ==========================================
   📱 الطلبات الواردة والمينيو الإلكتروني
   ========================================== */
function listenForIncomingOrders() {
    const container = document.getElementById('liveOrdersContainer');

    const processOrdersList = (ordersList) => {
        let unhandledCount = 0;
        let html = '';
        let lastIncomingOrder = null;

        ordersList.forEach(ord => {
            const st = ord.status || '';
            const isUnhandled = !st || st === 'جديد' || st === 'new' ||
                st === 'مقبول وكاشير' || st === 'قيد التحضير' ||
                st === 'خرج للتوصيل';

            if (isUnhandled) {
                unhandledCount++;
                const orderKey = ord.docId || ord.id || ('temp_' + Math.random());
                knownOrderIds.add(orderKey);
                html += generateOrderCardHTML(ord, orderKey);
                lastIncomingOrder = ord;
            }
        });

        if (container) {
            container.innerHTML = html ||
                '<p style="color:#555;text-align:center;padding:18px;font-size:0.82rem;">' +
                'لا توجد طلبات واردة حالياً</p>';
        }

        const badge       = document.getElementById('liveOrdersBadge');
        const alertBanner = document.getElementById('pendingOrdersAlertBanner');

        if (unhandledCount > 0) {
            if (badge) { badge.innerText = unhandledCount; badge.style.display = 'inline-block'; }

            if (alertBanner && lastIncomingOrder) {
                const phone   = String(lastIncomingOrder.phone ||
                    lastIncomingOrder.customerPhone || '-');
                const name    = String(lastIncomingOrder.customerName || 'طلب جديد');
                const docId   = String(lastIncomingOrder.docId || lastIncomingOrder.id || '');
                const items   = Array.isArray(lastIncomingOrder.items)
                    ? lastIncomingOrder.items
                    : (Array.isArray(lastIncomingOrder.cart) ? lastIncomingOrder.cart : []);
                const encoded = encodeURIComponent(JSON.stringify(items));
                const area    = String(lastIncomingOrder.area || '').replace(/'/g, "\\'");
                const addr    = String(lastIncomingOrder.address || '').replace(/'/g, "\\'");
                // 🛠️ إصلاح: نقل orderType للكاشير
                const oType   = String(lastIncomingOrder.orderType || 'delivery');
                const dFee    = cleanPrice(lastIncomingOrder.deliveryFee || 0);
                const safeName = name.replace(/'/g, "\\'");

                alertBanner.innerHTML =
                    '<div style="display:flex;justify-content:space-between;' +
                    'align-items:center;padding:4px 10px;gap:8px;">' +
                    '<span>' + (items.length > 0 ? '🌐' : '📞') +
                    ' <strong>' + name + '</strong> (' + phone + ')' +
                    (items.length > 0 ? ' — ' + items.length + ' وجبات' : '') + '</span>' +
                    '<button class="gold-btn btn-sm" ' +
                    'style="background:#000;color:#fff;font-size:0.75rem;white-space:nowrap;" ' +
                    'onclick="loadIncomingCallToPos(\'' + docId + '\',\'' +
                    (lastIncomingOrder.id||'') + '\',\'' + phone + '\',\'' +
                    safeName + '\',\'' + area + '\',\'' + addr + '\',\'' +
                    encoded + '\',\'' + oType + '\',' + dFee + ')">' +
                    '📥 نقل للكاشير</button></div>';
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
            const list = [];
            snapshot.forEach(doc =>
                list.push({ ...doc.data(), docId: doc.id, id: doc.data().id || doc.id })
            );
            processOrdersList(list);
        }, () => processOrdersList(getData('sys_live_orders')));
    } else {
        setInterval(() => processOrdersList(getData('sys_live_orders')), 2000);
    }
}

// 🛠️ إصلاح كبير: نقل كل بيانات الطلب للكاشير بما فيها orderType وdeliveryFee
function loadIncomingCallToPos(docId, orderId, phone, name,
                                area, address, itemsEncodedStr,
                                orderType, deliveryFee) {
    // الانتقال لتبويب البيع المباشر
    const btnDirect = document.querySelector(".pos-sidebar .toggle-btn");
    switchCashierTab('tabPosDirect', btnDirect);

    // تعبئة بيانات الزبون
    const custName  = document.getElementById('posCustName');
    const custPhone = document.getElementById('posCustPhone');
    if (custName)  custName.value  = name  || '';
    if (custPhone) custPhone.value = phone || '';

    // 🛠️ تحديد نوع الطلب تلقائياً
    const oType = orderType || 'delivery';
    const typeMap = {
        'delivery': 'توصيل',
        'توصيل':   'توصيل',
        'takeaway': 'سفري',
        'سفري':    'سفري',
        'dine_in':  'صالة',
        'صالة':    'صالة'
    };
    const mappedType = typeMap[oType] || 'توصيل';

    // ضبط زر نوع الطلب
    document.querySelectorAll('#posOrderTypeGroup .toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        const val = btn.getAttribute('data-value');
        if (
            (val === 'delivery' && mappedType === 'توصيل') ||
            (val === 'takeaway' && mappedType === 'سفري')  ||
            (val === 'dine_in'  && mappedType === 'صالة')
        ) {
            btn.classList.add('active');
            selectedPosOrderType = val;
        }
    });

    // إظهار/إخفاء حقول الدليفري
    const driverBox = document.getElementById('driverSelectBox');
    const areaBox   = document.getElementById('posAreaBox');
    if (driverBox) driverBox.style.display = (mappedType === 'توصيل') ? 'block' : 'none';
    if (areaBox)   areaBox.style.display   = (mappedType === 'توصيل') ? 'block' : 'none';

    // ضبط المنطقة
    if (area && mappedType === 'توصيل') {
        loadPosDeliveryAreas();
        const areaSel = document.getElementById('posAreaSelect');
        if (areaSel) {
            let found = false;
            for (let i = 0; i < areaSel.options.length; i++) {
                if (areaSel.options[i].value === area) {
                    areaSel.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) areaSel.value = '__other__';
        }
    }

    // تحميل الوجبات في السلة
    posCart = [];
    if (itemsEncodedStr && itemsEncodedStr !== '') {
        try {
            const decoded = JSON.parse(decodeURIComponent(itemsEncodedStr));
            if (Array.isArray(decoded)) {
                decoded.forEach(i => {
                    posCart.push({
                        id:        i.id || Date.now() + Math.random(),
                        name:      i.name,
                        price:     cleanPrice(i.price),
                        qty:       cleanPrice(i.qty) || 1,
                        itemNotes: i.customNotes
                            ? [i.customNotes] : (i.itemNotes || [])
                    });
                });
            }
        } catch (e) { console.error("خطأ تحميل الوجبات:", e); }
    }

    renderPosCart();

    if (posCart.length === 0 && itemsEncodedStr && itemsEncodedStr !== '') {
        alert("⚠️ تم نقل بيانات الزبون لكن لم تُقرأ الوجبات!\nأضفها يدوياً.");
    }

    // تحديث حالة الطلب بالسحابة
    if (db && docId && !docId.startsWith('temp_')) {
        db.collection("orders").doc(docId)
            .update({ status: 'مقبول وكاشير' })
            .catch(() => {});
    }

    // حذف من الطلبات المحلية
    let liveOrders = getData('sys_live_orders') || [];
    liveOrders = liveOrders.filter(o =>
        String(o.docId || o.id) !== String(docId) &&
        String(o.id) !== String(orderId)
    );
    setData('sys_live_orders', liveOrders);

    if (phone && phone !== '-')
        saveCustomerRecord(name, phone, area, address);

    alert('✅ تم نقل طلب ' + name + ' للكاشير!');
}

function generateOrderCardHTML(ord, docId) {
    const itemsList = Array.isArray(ord.items) ? ord.items
        : (Array.isArray(ord.cart) ? ord.cart : []);
    const total     = cleanPrice(ord.totalAmount || 0).toLocaleString('ar-IQ');
    const rawPhone  = String(ord.phone || ord.customerPhone || '-');
    const rawName   = String(ord.customerName || 'طلب جديد');
    const oType     = String(ord.orderType || 'delivery');
    const area      = String(ord.area    || '').replace(/'/g, "\\'");
    const addr      = String(ord.address || '').replace(/'/g, "\\'");
    const dFee      = cleanPrice(ord.deliveryFee || 0);
    const encoded   = encodeURIComponent(JSON.stringify(itemsList));
    const safeName  = rawName.replace(/'/g, "\\'");
    const safeDocId = String(docId || '');
    const safeOrdId = String(ord.id || docId || '');

    const isWebOrder = itemsList.length > 0;
    const srcBadge   = isWebOrder
        ? '<span style="background:#10b981;color:#fff;font-size:0.7rem;font-weight:bold;' +
          'padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:4px;">' +
          '🌐 مينيو إلكتروني</span>'
        : '<span style="background:#f59e0b;color:#000;font-size:0.7rem;font-weight:bold;' +
          'padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:4px;">' +
          '📞 مكالمة هاتفية</span>';

    const statusMap = {
        'جديد':           { t:'🆕 جديد',        c:'#f59e0b' },
        'مقبول وكاشير':  { t:'📥 بالكاشير',     c:'#38bdf8' },
        'قيد التحضير':   { t:'🍳 بالتحضير',     c:'#f59e0b' },
        'خرج للتوصيل':   { t:'🛵 بالطريق',      c:'#38bdf8' }
    };
    const stInfo = statusMap[ord.status||''] || { t: ord.status||'جديد', c:'#888' };

    return '<div id="order_card_' + safeDocId + '" ' +
        'style="background:#111116;border:1px solid ' +
        (isWebOrder ? '#10b981' : '#f59e0b') +
        ';padding:10px;margin-bottom:8px;border-radius:9px;">' +
        srcBadge +
        '<span style="background:' + stInfo.c + '22;border:1px solid ' + stInfo.c +
        ';color:' + stInfo.c + ';font-size:0.7rem;font-weight:900;padding:2px 8px;' +
        'border-radius:5px;margin-right:5px;">' + stInfo.t + '</span>' +
        '<div style="margin-top:5px;">' +
        '<strong style="color:#fbbf24;font-size:0.85rem;">👤 ' + rawName +
        ' (' + rawPhone + ')</strong>' +
        (area ? '<div style="font-size:0.78rem;color:#bbb;">📍 ' + area + '</div>' : '') +
        '</div>' +
        '<ul style="padding-right:14px;font-size:0.8rem;color:#fff;margin:6px 0;">' +
        (itemsList.length > 0
            ? itemsList.map(i =>
                '<li>' + i.name + ' × ' + (i.qty||1) +
                (i.customNotes ? ' <small style="color:#fbbf24;">(' + i.customNotes + ')</small>' : '') +
                '</li>'
              ).join('')
            : '<li style="color:#666;">(مكالمة — أضف الوجبات يدوياً)</li>') +
        '</ul>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'margin-bottom:8px;">' +
        '<strong style="color:#fbbf24;">' + total + ' د.ع</strong>' +
        '</div>' +
        '<div style="display:flex;gap:5px;margin-bottom:6px;">' +
        '<button class="gold-btn btn-sm" ' +
        'style="flex:1;background:#10b981;color:#fff;border:none;" ' +
        'onclick="loadIncomingCallToPos(\'' + safeDocId + '\',\'' + safeOrdId +
        '\',\'' + rawPhone + '\',\'' + safeName + '\',\'' + area + '\',\'' +
        addr + '\',\'' + encoded + '\',\'' + oType + '\',' + dFee + ')">' +
        '📥 نقل للكاشير</button>' +
        '<button class="gold-btn btn-sm" ' +
        'style="flex:1;background:#ef4444;color:#fff;border:none;" ' +
        'onclick="cancelIncomingOrder(\'' + safeDocId + '\',\'' + safeOrdId + '\')">' +
        '❌ إلغاء</button>' +
        '</div>' +
        '<div style="border-top:1px dashed #222;padding-top:6px;">' +
        '<div style="font-size:0.68rem;color:#666;margin-bottom:4px;">📲 تحديث الحالة:</div>' +
        '<div style="display:flex;gap:4px;">' +
        '<button class="gold-btn btn-sm" ' +
        'style="flex:1;background:#f59e0b;color:#000;border:none;font-size:0.66rem;" ' +
        'onclick="markOrderPreparing(\'' + safeDocId + '\',\'' + safeOrdId + '\')">🍳 تحضير</button>' +
        '<button class="gold-btn btn-sm" ' +
        'style="flex:1;background:#38bdf8;color:#000;border:none;font-size:0.66rem;" ' +
        'onclick="updateOrderStatus(\'' + safeDocId + '\',\'' + safeOrdId +
        '\',\'خرج للتوصيل\')">🛵 خرج</button>' +
        '<button class="gold-btn btn-sm" ' +
        'style="flex:1;background:#10b981;color:#fff;border:none;font-size:0.66rem;" ' +
        'onclick="updateOrderStatus(\'' + safeDocId + '\',\'' + safeOrdId +
        '\',\'تم التسليم\')">✅ سُلّم</button>' +
        '</div></div></div>';
}

function updateOrderStatus(docId, orderId, newStatus, prepMinutes) {
    if (!db) { alert("⚠️ لا يوجد اتصال."); return; }
    const payload = {
        status:          newStatus,
        statusUpdatedAt: Date.now(),
        statusBy:        activeCashierUser ? activeCashierUser.name : 'الكاشير'
    };
    if (prepMinutes) {
        payload.prepMinutes = cleanPrice(prepMinutes);
        payload.readyAt     = Date.now() + (cleanPrice(prepMinutes) * 60000);
    }
    db.collection("orders").doc(String(docId)).set(payload, { merge: true })
        .then(() => listenForIncomingOrders())
        .catch(err => alert('⚠️ تعذّر: ' + (err.message || err)));
}

function markOrderPreparing(docId, orderId) {
    const m = prompt("كم دقيقة للتجهيز؟", "20");
    if (m === null) return;
    updateOrderStatus(docId, orderId, 'قيد التحضير', cleanPrice(m) || 20);
}

function cancelIncomingOrder(docId, orderId) {
    if (!confirm("حذف هذا الطلب؟")) return;
    if (db) db.collection("orders").doc(docId).delete().catch(() => {});
    let orders = getData('sys_live_orders');
    orders = orders.filter(o =>
        String(o.id) !== String(orderId) && String(o.docId) !== String(docId)
    );
    setData('sys_live_orders', orders);
    listenForIncomingOrders();
}

/* ==========================================
   👥 دليل الزبائن CRM
   ========================================== */
function saveCustomerRecord(name, phone, area, address) {
    if (!phone || phone === '-' || phone === 'بدون رقم') return;
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 5) return;

    let customers    = getData('sys_customers') || [];
    let existingIdx  = customers.findIndex(c =>
        c && c.phone && String(c.phone).replace(/[^0-9]/g,'') === cleanPhone
    );

    const cData = {
        id:            existingIdx !== -1 ? customers[existingIdx].id : 'CUST_' + Date.now(),
        name:          (name && name !== 'زبون مباشر') ? name
                     : (existingIdx !== -1 ? customers[existingIdx].name : 'زبون هاتف'),
        phone:         cleanPhone,
        area:          area    || (existingIdx !== -1 ? customers[existingIdx].area    : ''),
        address:       address || (existingIdx !== -1 ? customers[existingIdx].address : ''),
        lastOrderDate: getTodayString(),
        updatedAt:     Date.now()
    };

    if (existingIdx !== -1) customers[existingIdx] = { ...customers[existingIdx], ...cData };
    else customers.unshift(cData);

    setData('sys_customers', customers);

    if (db) {
        db.collection("customers").doc(cleanPhone)
            .set(cData, { merge: true })
            .catch(() => {});
    }
}

function autoSearchCustomerByPhone(phoneInput) {
    const cleanPhone = String(phoneInput || '').replace(/[^0-9]/g, '');
    const resultsBox = document.getElementById('phoneSearchResults');
    if (!resultsBox) return;

    if (cleanPhone.length < 3) { resultsBox.style.display = 'none'; return; }

    const customers = getData('sys_customers') || [];
    const completed = getData('sys_completed_orders') || [];
    let   matches   = customers.filter(c => c.phone.includes(cleanPhone));

    if (matches.length === 0) {
        completed.forEach(o => {
            if (o.phone && String(o.phone).includes(cleanPhone)) {
                if (!matches.some(m => m.phone === o.phone)) {
                    matches.push({
                        name:    o.customerName || 'زبون سابق',
                        phone:   o.phone,
                        area:    o.area    || '',
                        address: o.address || ''
                    });
                }
            }
        });
    }

    if (matches.length === 0) {
        resultsBox.innerHTML =
            '<div style="padding:8px;color:#888;font-size:0.8rem;text-align:center;">' +
            '🆕 زبون جديد</div>';
        resultsBox.style.display = 'block';
        return;
    }

    resultsBox.innerHTML = matches.slice(0, 4).map(cust =>
        '<div onclick="fillCustomerData(\'' +
        (cust.name||'').replace(/'/g,"\\'") + '\',\'' + cust.phone + '\',\'' +
        (cust.area||'').replace(/'/g,"\\'") + '\',\'' +
        (cust.address||'').replace(/'/g,"\\'") + '\')" ' +
        'style="padding:8px 12px;background:#111116;border-bottom:1px solid #1e1e28;' +
        'cursor:pointer;border-radius:6px;margin-bottom:3px;">' +
        '<strong style="color:#fbbf24;font-size:0.84rem;">👤 ' + cust.name + '</strong>' +
        '<small style="color:#888;"> (' + cust.phone + ')</small><br>' +
        '<span style="font-size:0.74rem;color:#ccc;">📍 ' +
        (cust.area || 'بدون منطقة') + '</span>' +
        '</div>'
    ).join('');
    resultsBox.style.display = 'block';
}

function fillCustomerData(name, phone, area, address) {
    const nameEl  = document.getElementById('posCustName');
    const phoneEl = document.getElementById('posCustPhone');
    if (nameEl)  nameEl.value  = name  || '';
    if (phoneEl) phoneEl.value = phone || '';

    if (area) {
        const areaSel = document.getElementById('posAreaSelect');
        if (areaSel) {
            for (let i = 0; i < areaSel.options.length; i++) {
                if (areaSel.options[i].value === area) {
                    areaSel.selectedIndex = i; break;
                }
            }
        }
    }

    const resultsBox = document.getElementById('phoneSearchResults');
    if (resultsBox) resultsBox.style.display = 'none';
    renderPosCart();
}

function renderAdminCustomers() {
    const tbody    = document.getElementById('adminCustomersTableBody');
    if (!tbody) return;
    const customers = getData('sys_customers') || [];
    const searchVal = document.getElementById('adminCustomerSearchInput')?.value.toLowerCase() || '';
    const filtered  = customers.filter(c =>
        (c.name  && c.name.toLowerCase().includes(searchVal))  ||
        (c.phone && c.phone.includes(searchVal)) ||
        (c.area  && c.area.toLowerCase().includes(searchVal))
    );

    if (filtered.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;color:#666;padding:14px;">' +
            'لا يوجد زبائن</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((c, idx) =>
        '<tr>' +
        '<td>' + (idx+1) + '</td>' +
        '<td><strong>👤 ' + c.name + '</strong></td>' +
        '<td><strong style="color:#fbbf24;">' + c.phone + '</strong></td>' +
        '<td>' + (c.area    || '-') + '</td>' +
        '<td>' + (c.address || '-') + '</td>' +
        '<td><button class="gold-btn btn-danger btn-sm" ' +
        'onclick="deleteCustomerRecord(\'' + c.id + '\')">حذف</button></td>' +
        '</tr>'
    ).join('');
}

function deleteCustomerRecord(id) {
    if (!confirm("حذف هذا الزبون؟")) return;
    let customers   = getData('sys_customers') || [];
    const target    = customers.find(c => c.id === id);
    customers       = customers.filter(c => c.id !== id);
    setData('sys_customers', customers);
    if (target && db)
        db.collection("customers").doc(target.phone).delete().catch(() => {});
    renderAdminCustomers();
}

/* ==========================================
   🗂️ إدارة الأقسام
   ========================================== */
async function saveCategoriesToCloud(categories) {
    localStorage.setItem('sys_categories', JSON.stringify(categories));
    if (typeof renderAdminCategories        === 'function') renderAdminCategories();
    if (typeof renderCategoriesManagementList === 'function') renderCategoriesManagementList();
    if (typeof renderPosCategoriesBar       === 'function') renderPosCategoriesBar();
    refreshActiveUI();

    if (!db) return { ok: false, error: 'لا اتصال' };

    try {
        await db.collection("system_store").doc("sys_categories")
            .set({ content: JSON.stringify(categories), updatedAt: Date.now() });
        return { ok: true };
    } catch (e) {
        showCloudErrorBanner(translateFirestoreError(e));
        return { ok: false, error: e.message || String(e) };
    }
}

async function addNewMenuCategory() {
    const input = document.getElementById('newCategoryNameInput');
    const name  = input ? input.value.trim() : '';
    if (!name) return alert("⚠️ أدخل اسم القسم!");

    let categories = getData('sys_categories') || [];
    if (categories.some(c => String(c.name).trim() === name))
        return alert("⚠️ يوجد قسم بنفس الاسم!");

    const newId = categories.length > 0
        ? Math.max(...categories.map(c => cleanPrice(c.id))) + 1 : 1;
    categories.push({ id: newId, name });

    const res = await saveCategoriesToCloud(categories);
    if (input) input.value = '';
    alert(res.ok
        ? "✅ تم إضافة القسم على السحابة."
        : "⚠️ حُفظ محلياً فقط! " + (res.error || ''));
}

async function addNewMenuCategoryFromAdminTab() {
    await addNewMenuCategory();
    renderCategoriesManagementList();
}

async function renameMenuCategory(catId) {
    let categories = getData('sys_categories') || [];
    const cat = categories.find(c => cleanPrice(c.id) === cleanPrice(catId));
    if (!cat) return;
    const newName = prompt("الاسم الجديد:", cat.name);
    if (!newName || !newName.trim()) return;
    cat.name = newName.trim();
    const res = await saveCategoriesToCloud(categories);
    alert(res.ok ? "✅ تم التعديل." : "⚠️ حُفظ محلياً فقط!");
}

function deleteMenuCategory(catId) {
    const items   = getData('sys_items') || [];
    const hasItems = items.some(i => getItemCategory(i) === cleanPrice(catId));
    if (hasItems)
        return alert("⚠️ لا يمكن حذف قسم مرتبط بأصناف!");

    if (confirm("حذف هذا القسم؟")) {
        let categories = getData('sys_categories') || [];
        categories = categories.filter(c => cleanPrice(c.id) !== cleanPrice(catId));
        saveCategoriesToCloud(categories).then(res => {
            alert(res.ok ? "✅ تم الحذف." : "⚠️ حُفظ محلياً فقط!");
        });
    }
}

function renderCategoriesManagementList() {
    const tbody = document.getElementById('categoriesManagementTable');
    if (!tbody) return;
    const categories = getData('sys_categories') || [];
    const items      = getData('sys_items')      || [];

    if (categories.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="4" style="text-align:center;color:#666;padding:14px;">' +
            'لا توجد أقسام</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map((cat, idx) => {
        const count = items.filter(i => getItemCategory(i) === cleanPrice(cat.id)).length;
        return '<tr>' +
            '<td>' + (idx+1) + '</td>' +
            '<td><strong>' + cat.name + '</strong></td>' +
            '<td><span style="color:#888;font-size:0.8rem;">' + count + ' صنف</span></td>' +
            '<td>' +
            '<button class="gold-btn btn-sm" ' +
            'onclick="renameMenuCategory(\'' + cat.id + '\')" ' +
            'style="padding:4px 8px;font-size:0.74rem;">✏️ تعديل</button> ' +
            '<button class="gold-btn btn-danger btn-sm" ' +
            'onclick="deleteMenuCategory(\'' + cat.id + '\')" ' +
            'style="padding:4px 8px;font-size:0.74rem;">حذف</button>' +
            '</td></tr>';
    }).join('');
}

/* ==========================================
   🍔 إدارة الأصناف (الأدمن)
   ========================================== */
function renderAdminCategories() {
    const selectEl = document.getElementById('itemCategory');
    if (!selectEl) return;
    const categories = getData('sys_categories') || [];
    selectEl.innerHTML = categories.map(c =>
        '<option value="' + c.id + '">' + c.name + '</option>'
    ).join('');
}

function renderAdminItems() {
    const items      = getData('sys_items')      || [];
    const categories = getData('sys_categories') || [];
    const tbody      = document.getElementById('adminItemsTable');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;color:#666;padding:16px;">' +
            'لا توجد أصناف</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => {
        const cat = categories.find(c => cleanPrice(c.id) === getItemCategory(item));
        return '<tr style="' + (item.isPaused ? 'opacity:0.5;' : '') + '">' +
            '<td style="text-align:center;position:relative;">' +
            (item.isPaused
                ? '<div style="position:absolute;top:0;right:0;background:#f59e0b;' +
                  'color:#000;font-size:0.58rem;font-weight:900;padding:1px 5px;' +
                  'border-radius:0 0 0 5px;">موقوف</div>' : '') +
            '<img src="' + (item.image || item.img || '') +
            '" width="44" height="44" style="object-fit:cover;border-radius:7px;' +
            'cursor:pointer;background:#0d0d11;" ' +
            'onclick="triggerInlineImageUpload(\'' + item.id + '\')" ' +
            'onerror="this.style.display=\'none\'">' +
            '</td>' +
            '<td><input type="text" value="' + (item.name||'') +
            '" class="gold-input-inline" style="font-weight:bold;" ' +
            'onchange="updateItemInline(\'' + item.id + '\',\'name\',this.value)"></td>' +
            '<td><span style="font-size:0.78rem;color:#888;">' +
            (cat ? cat.name : '-') + '</span></td>' +
            '<td><div style="display:flex;align-items:center;gap:4px;">' +
            '<input type="number" value="' + cleanPrice(item.price) +
            '" class="gold-input-inline" ' +
            'style="color:#fbbf24;font-weight:bold;width:95px;" ' +
            'onchange="updateItemInline(\'' + item.id + '\',\'price\',this.value)"> د.ع' +
            '</div></td>' +
            '<td>' +
            '<button onclick="toggleItemPublish(\'' + item.id + '\')" ' +
            'class="gold-btn btn-sm" ' +
            'style="background:' + (item.isPaused ? '#10b981' : '#f59e0b') +
            ';color:' + (item.isPaused ? '#fff' : '#000') +
            ';border:none;margin-left:4px;">' +
            (item.isPaused ? '▶️' : '⏸️') + '</button>' +
            '<button onclick="editItem(\'' + item.id + '\')" ' +
            'class="gold-btn btn-sm" style="margin-left:4px;">تعديل</button>' +
            '<button onclick="deleteItem(\'' + item.id + '\')" ' +
            'class="gold-btn btn-danger btn-sm">حذف</button>' +
            '</td></tr>';
    }).join('');
}

function triggerInlineImageUpload(itemId) {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            const img       = new Image();
            img.onload      = () => {
                const MAX   = 420;
                const ratio = Math.min(MAX/img.width, MAX/img.height, 1);
                const w     = Math.round(img.width  * ratio);
                const h     = Math.round(img.height * ratio);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                let quality = 0.75;
                let out     = canvas.toDataURL('image/jpeg', quality);
                while (out.length > 60*1024*1.37 && quality > 0.35) {
                    quality -= 0.1;
                    out = canvas.toDataURL('image/jpeg', quality);
                }
                updateItemInline(itemId, 'image', out);
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function updateItemInline(id, field, value) {
    let items = getData('sys_items') || [];
    let item  = items.find(i =>
        String(i.id) === String(id) || String(i.docId) === String(id)
    );
    if (!item) return;

    if (field === 'price') {
        const oldPrice = cleanPrice(item.price);
        const newPrice = cleanPrice(value) || 0;
        if (oldPrice !== newPrice)
            logAudit('تعديل سعر', { itemName: item.name, oldPrice, newPrice });
        item.price = newPrice;
    } else if (field === 'categoryId') {
        item.categoryId = cleanPrice(value);
        item.catId      = cleanPrice(value);
        item.category   = cleanPrice(value);
    } else {
        item[field] = typeof value === 'string' ? value.trim() : value;
        if (field === 'image') item._imageUploaded = true;
    }

    item.updatedAt = Date.now();
    localStorage.setItem('sys_items', JSON.stringify(items));

    if (db) {
        db.collection("menu_items").doc(String(id))
            .set(item, { merge: true })
            .catch(err => showCloudErrorBanner(translateFirestoreError(err)));
    }
    notifyMenuUpdated();
}

function toggleItemPublish(id) {
    const items = getData('sys_items') || [];
    const item  = items.find(i =>
        String(i.id) === String(id) || String(i.docId) === String(id)
    );
    if (!item) return;

    const nowPaused = !item.isPaused;
    if (!confirm((nowPaused ? 'إيقاف' : 'إعادة نشر') + ' «' + item.name + '»؟')) return;

    item.isPaused  = nowPaused;
    item.updatedAt = Date.now();
    localStorage.setItem('sys_items', JSON.stringify(items));

    if (db) {
        db.collection("menu_items").doc(String(item.id))
            .set({ isPaused: nowPaused, updatedAt: item.updatedAt }, { merge: true })
            .catch(() => {});
    }

    logAudit(nowPaused ? 'إيقاف صنف' : 'إعادة نشر', { itemName: item.name });
    refreshActiveUI();
    renderAdminItems();
}

async function saveItem() {
    const editId     = document.getElementById('editItemId')?.value;
    const id         = editId ? String(editId) : 'item_' + Date.now();
    const name       = document.getElementById('itemName')?.value.trim();
    const price      = cleanPrice(document.getElementById('itemPrice')?.value);
    const categoryId = cleanPrice(document.getElementById('itemCategory')?.value || 1);

    const urlField   = (document.getElementById('itemImage')?.value || '').trim();
    const previewSrc = document.getElementById('imgPreview')?.src || '';
    let   image;
    if (urlField && /^https?:\/\//i.test(urlField)) image = urlField;
    else if (previewSrc.startsWith('data:'))         image = previewSrc;
    else if (previewSrc && !previewSrc.includes('placeholder')) image = previewSrc;
    else image = '';

    const ingredients = document.getElementById('itemIngredients')?.value.trim() || '';

    if (!name || !price)
        return alert("⚠️ أدخل اسم الصنف والسعر!");

    const itemData = {
        id, docId: id, name, price, categoryId,
        catId:       categoryId,
        category:    categoryId,
        image,
        ingredients,
        updatedAt:   Date.now(),
        _imageUploaded: !!image
    };

    let items = getData('sys_items') || [];
    const idx = items.findIndex(i =>
        String(i.id) === String(id) || String(i.docId) === String(id)
    );
    if (idx !== -1) items[idx] = itemData;
    else items.unshift(itemData);
    localStorage.setItem('sys_items', JSON.stringify(items));

    if (db) {
        const itemRef   = db.collection("menu_items").doc(String(id));
        let   ackDone   = false;

        const ackTimer  = setTimeout(() => {
            if (!ackDone) {
                ackDone = true;
                showCloudErrorBanner("لم يصل تأكيد من Firebase خلال 12 ثانية.");
            }
        }, 12000);

        const unsubAck  = itemRef.onSnapshot(
            { includeMetadataChanges: true },
            snap => {
                if (!ackDone && snap.metadata && !snap.metadata.hasPendingWrites) {
                    ackDone = true;
                    clearTimeout(ackTimer);
                    unsubAck();
                    refreshActiveUI();
                    resetItemForm();
                    alert("🎉 تم حفظ الصنف ورفعه للسحابة!");
                }
            },
            err => {
                if (!ackDone) {
                    ackDone = true;
                    clearTimeout(ackTimer);
                    showCloudErrorBanner(translateFirestoreError(err));
                }
            }
        );

        itemRef.set(itemData, { merge: true }).catch(e => {
            if (!ackDone) {
                ackDone = true;
                clearTimeout(ackTimer);
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
    const item  = items.find(i =>
        String(i.id) === String(id) || String(i.docId) === String(id)
    );
    if (!item) return;

    renderAdminCategories();
    document.getElementById('editItemId').value     = item.id;
    document.getElementById('itemName').value       = item.name;
    document.getElementById('itemPrice').value      = item.price;
    document.getElementById('itemCategory').value   = getItemCategory(item);
    document.getElementById('itemImage').value      = item.image || '';
    document.getElementById('imgPreview').src       = item.image ||
        'https://via.placeholder.com/150';
    document.getElementById('itemIngredients').value = item.ingredients || '';
    document.getElementById('itemFormTitle').innerText = "تعديل: " + item.name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetItemForm() {
    ['editItemId','itemName','itemPrice','itemImage','itemIngredients'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    currentUploadedBase64 = '';
    const preview = document.getElementById('imgPreview');
    if (preview) preview.src = 'https://via.placeholder.com/150?text=معاينة';
    const title = document.getElementById('itemFormTitle');
    if (title) title.innerText = 'إضافة / تعديل صنف';
}

function deleteItem(id) {
    // 🔐 حذف الصنف يحتاج تأكيد الأدمن
    requireAdminPin('حذف صنف من المينيو', () => {
        const gone = (getData('sys_items')||[]).find(i =>
            String(i.id) === String(id) || String(i.docId) === String(id)
        );
        if (gone) logAudit('حذف صنف', { itemName: gone.name, price: cleanPrice(gone.price) });

        let items = (getData('sys_items')||[]).filter(i =>
            String(i.id) !== String(id) && String(i.docId) !== String(id)
        );
        localStorage.setItem('sys_items', JSON.stringify(items));
        if (db) db.collection("menu_items").doc(String(id)).delete().catch(() => {});
        renderAdminItems();
        notifyMenuUpdated();
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!String(file.type).startsWith('image/')) return alert('⚠️ اختر صورة.');

    const preview = document.getElementById('imgPreview');
    const infoEl  = document.getElementById('imgCompressInfo');
    if (infoEl) infoEl.innerHTML = '<span style="color:#f59e0b;">⏳ جاري الضغط...</span>';

    const reader = new FileReader();
    reader.onload = evt => {
        const img = new Image();
        img.onload = () => {
            const MAX   = 420;
            const ratio = Math.min(MAX/img.width, MAX/img.height, 1);
            const w     = Math.round(img.width  * ratio);
            const h     = Math.round(img.height * ratio);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(img, 0, 0, w, h);
            let quality = 0.75;
            let out     = canvas.toDataURL('image/jpeg', quality);
            while (out.length > 60*1024*1.37 && quality > 0.35) {
                quality -= 0.1;
                out = canvas.toDataURL('image/jpeg', quality);
            }
            if (preview) preview.src = out;
            const itemImgInput = document.getElementById('itemImage');
            if (itemImgInput) itemImgInput.value = out;
            const kb      = Math.round(out.length * 0.75 / 1024);
            const origKB  = Math.round(file.size / 1024);
            const saved   = origKB > 0 ? Math.round((1 - kb/origKB)*100) : 0;
            if (infoEl) infoEl.innerHTML =
                '<span style="color:#10b981;">✅ ' + origKB + 'KB → ' +
                kb + 'KB (توفير ' + saved + '%)</span>';
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

let imgUrlCheckTimer = null;
function onImageUrlChanged(url) {
    const statusEl = document.getElementById('imgUrlStatus');
    const preview  = document.getElementById('imgPreview');
    const infoEl   = document.getElementById('imgCompressInfo');
    if (infoEl) infoEl.innerHTML = '';
    url = String(url || '').trim();
    if (imgUrlCheckTimer) clearTimeout(imgUrlCheckTimer);
    if (!url) { if (statusEl) statusEl.innerHTML = ''; return; }
    if (!/^https?:\/\//i.test(url)) {
        if (statusEl) statusEl.innerHTML =
            '<span style="color:#ef4444;">⚠️ الرابط يجب أن يبدأ بـ https://</span>';
        return;
    }
    if (statusEl) statusEl.innerHTML =
        '<span style="color:#f59e0b;">⏳ جاري التحقق...</span>';
    imgUrlCheckTimer = setTimeout(() => {
        const t = new Image();
        let done = false;
        const to = setTimeout(() => {
            if (done) return; done = true;
            if (statusEl) statusEl.innerHTML =
                '<span style="color:#ef4444;">❌ لا يستجيب</span>';
        }, 9000);
        t.onload = () => {
            if (done) return; done = true; clearTimeout(to);
            if (preview) preview.src = url;
            if (statusEl) statusEl.innerHTML =
                '<span style="color:#10b981;">✅ تعمل (' +
                t.naturalWidth + '×' + t.naturalHeight + ')</span>';
        };
        t.onerror = () => {
            if (done) return; done = true; clearTimeout(to);
            if (statusEl) statusEl.innerHTML =
                '<span style="color:#ef4444;">❌ لا تعرض صورة</span>';
        };
        t.src = url;
    }, 400);
}

/* ==========================================
   🏷️ النفاد والكوبونات وأوقات العمل
   ========================================== */
function isItemOutOfStock(itemId) {
    const outIds = getData('sys_out_of_stock') || [];
    return outIds.some(id => String(id) === String(itemId));
}

function openOutofStockModal() {
    renderOutOfStockList();
    openModal('outOfStockModal');
}

function renderOutOfStockList() {
    const container = document.getElementById('outOfStockListContainer');
    if (!container) return;
    const items  = getData('sys_items')        || [];
    const outIds = getData('sys_out_of_stock') || [];

    container.innerHTML = items.map(item => {
        const isOut = outIds.some(id => String(id) === String(item.id));
        return '<div style="display:flex;justify-content:space-between;align-items:center;' +
            'background:#111116;padding:6px 10px;border-radius:7px;margin-bottom:4px;">' +
            '<span style="color:#fff;font-size:0.82rem;">' + item.name + '</span>' +
            '<button onclick="toggleItemStockStatus(\'' + item.id + '\')" ' +
            'class="gold-btn btn-sm" ' +
            'style="background:' + (isOut ? '#10b981' : '#ef4444') +
            ';color:#fff;border:none;padding:4px 10px;">' +
            (isOut ? '✅ متوفر' : '🚫 نافذ') +
            '</button></div>';
    }).join('');
}

function toggleItemStockStatus(itemId) {
    let outIds = getData('sys_out_of_stock') || [];
    const idx  = outIds.findIndex(id => String(id) === String(itemId));
    if (idx !== -1) outIds.splice(idx, 1);
    else            outIds.push(itemId);
    setData('sys_out_of_stock', outIds);
    renderOutOfStockList();
    notifyMenuUpdated();
}

function openCouponsManagerModal() {
    renderCouponsList();
    openModal('couponsManagerModal');
}

function renderCouponsList() {
    const container = document.getElementById('couponsListContainer');
    if (!container) return;
    const coupons = getData('sys_coupons') || [];
    if (coupons.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;color:#666;padding:10px;">لا توجد كوبونات</p>';
        return;
    }
    container.innerHTML = coupons.map(c =>
        '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'background:#111116;padding:6px 10px;border-radius:7px;margin-bottom:4px;">' +
        '<div>' +
        '<strong style="color:#fbbf24;">' + c.code + '</strong>' +
        '<span style="font-size:0.74rem;color:#888;"> — ' +
        (c.type === 'percent'
            ? cleanPrice(c.value) + '%'
            : cleanPrice(c.value).toLocaleString('ar-IQ') + ' د.ع') +
        '</span></div>' +
        '<button onclick="deleteCouponItem(\'' + c.code + '\')" ' +
        'style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button>' +
        '</div>'
    ).join('');
}

function addNewCoupon() {
    const code  = document.getElementById('newCouponCodeInput')?.value.trim().toUpperCase();
    const type  = document.getElementById('newCouponTypeSelect')?.value || 'percent';
    const value = cleanPrice(document.getElementById('newCouponValueInput')?.value);

    if (!code)     return alert("⚠️ أدخل كود الكوبون!");
    if (value <= 0) return alert("⚠️ أدخل قيمة الخصم!");

    let coupons = getData('sys_coupons') || [];
    if (coupons.some(c => c.code === code))
        return alert("⚠️ الكود مستخدم مسبقاً!");

    coupons.push({ code, type, value, active: true });
    setData('sys_coupons', coupons);
    if (document.getElementById('newCouponCodeInput'))
        document.getElementById('newCouponCodeInput').value = '';
    if (document.getElementById('newCouponValueInput'))
        document.getElementById('newCouponValueInput').value = '';
    renderCouponsList();
}

function deleteCouponItem(code) {
    if (!confirm("حذف هذا الكوبون؟")) return;
    let coupons = (getData('sys_coupons')||[]).filter(c => c.code !== code);
    setData('sys_coupons', coupons);
    renderCouponsList();
}

function openWorkingHoursModal() {
    const settings = getData('sys_working_hours') ||
        { open:"10:00", close:"23:59", enabled:false };
    const openEl   = document.getElementById('workHoursOpenInput');
    const closeEl  = document.getElementById('workHoursCloseInput');
    const enableEl = document.getElementById('workHoursEnabledCheckbox');
    if (openEl)   openEl.value    = settings.open;
    if (closeEl)  closeEl.value   = settings.close;
    if (enableEl) enableEl.checked = !!settings.enabled;
    openModal('workingHoursModal');
}

function saveWorkingHours() {
    const open    = document.getElementById('workHoursOpenInput')?.value  || "10:00";
    const close   = document.getElementById('workHoursCloseInput')?.value || "23:59";
    const enabled = document.getElementById('workHoursEnabledCheckbox')?.checked || false;
    setData('sys_working_hours', { open, close, enabled });
    alert("✅ تم حفظ أوقات الدوام.");
    closeModal('workingHoursModal');
}

function isRestaurantCurrentlyOpen() {
    const settings = getData('sys_working_hours') ||
        { open:"10:00", close:"23:59", enabled:false };
    if (!settings.enabled) return true;

    const now = new Date();
    const [oh, om] = String(settings.open).split(':').map(Number);
    const [ch, cm] = String(settings.close).split(':').map(Number);
    const openM  = (oh||0)*60 + (om||0);
    const closeM = (ch||0)*60 + (cm||0);
    const nowM   = now.getHours()*60 + now.getMinutes();

    if (closeM > openM) return nowM >= openM && nowM < closeM;
    return nowM >= openM || nowM < closeM;
}

function openKitchenNotesManagerModal() {
    renderKitchenNotesList();
    openModal('kitchenNotesManagerModal');
}

function renderKitchenNotesList() {
    const container = document.getElementById('kitchenNotesListTable');
    if (!container) return;
    const notes = getData('sys_quick_kitchen_notes') || [];

    container.innerHTML = notes.length === 0
        ? '<p style="text-align:center;color:#666;padding:10px;">لا توجد ملاحظات</p>'
        : notes.map((n, idx) =>
            '<div style="display:flex;justify-content:space-between;align-items:center;' +
            'background:#111116;padding:6px 10px;border-radius:7px;margin-bottom:4px;">' +
            '<span style="color:#fff;font-size:0.83rem;">' + n + '</span>' +
            '<button onclick="deleteKitchenNoteItem(' + idx + ')" ' +
            'style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button>' +
            '</div>'
          ).join('');
}

function addKitchenNoteItem() {
    const input = document.getElementById('newKitchenNoteInput');
    const text  = input ? input.value.trim() : '';
    if (!text) return alert("⚠️ اكتب الملاحظة أولاً!");
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

/* ==========================================
   🔧 إعدادات الطابعات والأدمن
   ========================================== */
function initAdminPage() { initData(); }

function loadAdminTabsData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminDrivers();
    renderAdminCashiers();
    renderAdminAreas();
    renderAdminCustomers();
    loadPrinterSettings();
    loadInvoiceDesignForm();
    if (typeof startLiveSalesBadgeUpdater === 'function')
        startLiveSalesBadgeUpdater();
}

function loadPrinterSettings() {
    const s = getData('sys_printer_settings');
    if (!s) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    setVal('cashierPrinterIp',  s.cashierIp  || '192.168.0.218');
    setVal('kitchenPrinter1Ip', s.kitchen1Ip || '192.168.0.200');
    setVal('kitchenPrinter2Ip', s.kitchen2Ip || '');
}

function savePrinterSettings() {
    const cashierIp  = document.getElementById('cashierPrinterIp')?.value.trim();
    const kitchen1Ip = document.getElementById('kitchenPrinter1Ip')?.value.trim();
    const kitchen2Ip = document.getElementById('kitchenPrinter2Ip')?.value.trim();
    const settings   = { cashierIp, kitchen1Ip, kitchen2Ip, port: '9100' };
    setData('sys_printer_settings', settings);
    alert("✅ تم حفظ إعدادات الطابعات!");
}

function savePrintBridgeSettings() {
    const el  = document.getElementById('printBridgeUrlInput');
    const val = el ? el.value.trim() : '';
    setPrintBridgeUrl(val || 'http://localhost:8899');
    // حفظ بالسحابة لمزامنة الأجهزة
    setData('sys_print_bridge_url_shared', val || 'http://localhost:8899');
    alert("✅ تم حفظ عنوان جسر الطباعة!");
}

/* ==========================================
   🧾 تصميم الفاتورة من الأدمن (شعار / نصوص / إظهار-إخفاء)
   ========================================== */

// تحميل القيم الحالية داخل نموذج الأدمن
function loadInvoiceDesignForm() {
    const d = getInvoiceDesign();
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

    setVal('invoiceRestaurantName', d.restaurantName || '');
    setVal('invoiceAddressLine',    d.addressLine    || '');
    setVal('invoiceFooterText',     d.footerText     || '');
    setVal('invoicePaperWidth',     d.paperWidth     || '80');
    setVal('invoiceLogoDataUrl',    d.logoDataUrl    || '');

    setChk('invoiceShowLogo',         d.showLogo);
    setChk('invoiceShowAddress',      d.showAddress);
    setChk('invoiceShowPhone',        d.showPhone);
    setChk('invoiceShowCustomerName', d.showCustomerName);
    setChk('invoiceShowDriverArea',   d.showDriverArea);
    setChk('invoiceShowOrderNotes',   d.showOrderNotes);
    setChk('invoiceShowItemNotes',    d.showItemNotes);

    const preview = document.getElementById('invoiceLogoPreview');
    if (preview) {
        if (d.logoDataUrl) { preview.src = d.logoDataUrl; preview.style.display = 'inline-block'; }
        else               { preview.src = '';            preview.style.display = 'none'; }
    }

    renderInvoiceDesignPreview();
}

// رفع شعار (لوكو) وتصغيره تلقائياً قبل الحفظ
function handleInvoiceLogoUpload(inputEl) {
    const file = inputEl && inputEl.files ? inputEl.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
        const img = new Image();
        img.onload = () => {
            const MAX   = 320;
            const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
            const w     = Math.max(1, Math.round(img.width  * ratio));
            const h     = Math.max(1, Math.round(img.height * ratio));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            let out = canvas.toDataURL('image/png');
            // إذا كانت الصورة كبيرة نحولها لـ jpeg مضغوط
            if (out.length > 120 * 1024 * 1.37) {
                out = canvas.toDataURL('image/jpeg', 0.82);
            }

            const hidden  = document.getElementById('invoiceLogoDataUrl');
            const preview = document.getElementById('invoiceLogoPreview');
            if (hidden)  hidden.value = out;
            if (preview) { preview.src = out; preview.style.display = 'inline-block'; }
            renderInvoiceDesignPreview();
        };
        img.onerror = () => alert('⚠️ تعذّر قراءة الصورة، جرّب صورة أخرى.');
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

// إزالة الشعار الحالي
function removeInvoiceLogo() {
    const hidden  = document.getElementById('invoiceLogoDataUrl');
    const preview = document.getElementById('invoiceLogoPreview');
    const fileEl  = document.getElementById('invoiceLogoFileInput');
    if (hidden)  hidden.value = '';
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (fileEl)  fileEl.value = '';
    renderInvoiceDesignPreview();
}

// حفظ تصميم الفاتورة (محلياً + سحابياً، ينعكس فوراً على كل الأجهزة)
function saveInvoiceDesign() {
    const getVal = id => (document.getElementById(id)?.value || '').trim();
    const getChk = id => !!document.getElementById(id)?.checked;

    const design = {
        restaurantName:   getVal('invoiceRestaurantName') || 'MIM89 FAST FOOD',
        addressLine:      getVal('invoiceAddressLine'),
        footerText:       getVal('invoiceFooterText') || 'شكراً لزيارتكم 🍔',
        paperWidth:       getVal('invoicePaperWidth') || '80',
        logoDataUrl:      getVal('invoiceLogoDataUrl'),
        showLogo:         getChk('invoiceShowLogo'),
        showAddress:      getChk('invoiceShowAddress'),
        showPhone:        getChk('invoiceShowPhone'),
        showCustomerName: getChk('invoiceShowCustomerName'),
        showDriverArea:   getChk('invoiceShowDriverArea'),
        showOrderNotes:   getChk('invoiceShowOrderNotes'),
        showItemNotes:    getChk('invoiceShowItemNotes')
    };

    setData('sys_invoice_design', design);
    if (typeof logAudit === 'function') logAudit('تعديل تصميم الفاتورة', {});
    renderInvoiceDesignPreview();
    alert('✅ تم حفظ تصميم الفاتورة!\nسينعكس تلقائياً على كل أجهزة الكاشير المتصلة بالإنترنت.');
}

// استعادة التصميم الافتراضي
function resetInvoiceDesignToDefault() {
    if (!confirm('استعادة تصميم الفاتورة الافتراضي؟ سيُلغى الشعار والنصوص المخصصة.')) return;
    setData('sys_invoice_design', DEFAULT_DATA.invoiceDesign);
    loadInvoiceDesignForm();
    alert('✅ تمت الاستعادة للتصميم الافتراضي.');
}

// معاينة حيّة لشكل الفاتورة أثناء التعديل (قبل الحفظ)
function renderInvoiceDesignPreview() {
    const box = document.getElementById('invoiceDesignPreviewBox');
    if (!box) return;

    const getVal = id => (document.getElementById(id)?.value || '').trim();
    const getChk = id => !!document.getElementById(id)?.checked;

    const name    = getVal('invoiceRestaurantName') || 'MIM89 FAST FOOD';
    const addr    = getVal('invoiceAddressLine');
    const footer  = getVal('invoiceFooterText') || 'شكراً لزيارتكم 🍔';
    const logo    = getVal('invoiceLogoDataUrl');

    const showLogo         = getChk('invoiceShowLogo');
    const showAddress      = getChk('invoiceShowAddress');
    const showPhone        = getChk('invoiceShowPhone');
    const showCustomerName = getChk('invoiceShowCustomerName');
    const showDriverArea   = getChk('invoiceShowDriverArea');
    const showOrderNotes   = getChk('invoiceShowOrderNotes');

    box.innerHTML =
        '<div style="width:240px;margin:0 auto;background:#fff;color:#000;' +
        'font-family:Tajawal,sans-serif;direction:rtl;text-align:right;' +
        'padding:10px;border-radius:6px;box-shadow:0 0 14px rgba(0,0,0,0.45);">' +

        (showLogo && logo
            ? '<img src="' + logo + '" style="max-width:80%;max-height:60px;' +
              'display:block;margin:0 auto 6px auto;">'
            : '') +

        '<div style="text-align:center;border-bottom:2px dashed #000;' +
        'padding-bottom:5px;margin-bottom:6px;">' +
        '<div style="font-size:15px;font-weight:900;">' + name + '</div>' +
        (showAddress && addr
            ? '<div style="font-size:10px;font-weight:bold;">' + addr + '</div>' : '') +
        '</div>' +

        '<div style="text-align:center;border:2px solid #000;padding:4px;margin-bottom:6px;">' +
        '<div style="font-size:10px;font-weight:bold;">رقم الطلب</div>' +
        '<div style="font-size:24px;font-weight:900;">#1024</div>' +
        '</div>' +

        '<div style="font-size:10px;font-weight:bold;line-height:1.6;' +
        'border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:5px;">' +
        (showCustomerName ? '<div>الزبون: أحمد</div>' : '') +
        (showPhone        ? '<div>الهاتف: 07701234567</div>' : '') +
        (showDriverArea   ? '<div>المنطقة: القاهرة</div>' : '') +
        '</div>' +

        '<table style="width:100%;font-size:11px;border-collapse:collapse;margin-bottom:6px;">' +
        '<tr style="border-bottom:1px dashed #ccc;">' +
        '<td style="text-align:right;font-weight:900;padding:2px 0;">شاورما لحم ×2</td>' +
        '<td style="text-align:left;font-weight:900;padding:2px 0;">6,000</td></tr>' +
        '<tr style="border-bottom:1px dashed #ccc;">' +
        '<td style="text-align:right;font-weight:900;padding:2px 0;">بيبسي ×1</td>' +
        '<td style="text-align:left;font-weight:900;padding:2px 0;">1,000</td></tr>' +
        '</table>' +

        (showOrderNotes
            ? '<div style="font-size:10px;border-bottom:1px dashed #ccc;' +
              'padding-bottom:3px;margin-bottom:4px;">📝 بدون بصل</div>'
            : '') +

        '<div style="border-top:2px dashed #000;padding-top:4px;text-align:center;' +
        'font-size:13px;font-weight:900;">المطلوب: 7,000 د.ع</div>' +

        '<div style="text-align:center;margin-top:8px;font-size:10px;' +
        'border-top:1px solid #000;padding-top:4px;">' + footer + '</div>' +

        '</div>';
}

function renderAdminAreas() {
    const areas = getData('sys_areas') || [];
    const tbody = document.getElementById('adminAreasTable');
    if (!tbody) return;
    tbody.innerHTML = areas.map((a, idx) =>
        '<tr>' +
        '<td>' + (idx+1) + '</td>' +
        '<td><strong>' + a.name + '</strong></td>' +
        '<td>' + (cleanPrice(a.price) === 0 ? 'مجاني 🎉'
            : cleanPrice(a.price).toLocaleString('ar-IQ') + ' د.ع') + '</td>' +
        '<td><button class="gold-btn btn-danger btn-sm" ' +
        'onclick="deleteArea(\'' + a.name + '\')">حذف</button></td>' +
        '</tr>'
    ).join('');
}

function saveDeliveryArea() {
    const name  = document.getElementById('areaNameInput')?.value.trim();
    const price = cleanPrice(document.getElementById('areaPriceInput')?.value);
    if (!name) return alert("أدخل اسم المنطقة");
    let areas = getData('sys_areas') || [];
    areas.push({ name, price });
    setData('sys_areas', areas);
    if (document.getElementById('areaNameInput'))
        document.getElementById('areaNameInput').value = '';
    if (document.getElementById('areaPriceInput'))
        document.getElementById('areaPriceInput').value = '';
    renderAdminAreas();
}

function deleteArea(name) {
    let areas = (getData('sys_areas')||[]).filter(a => a.name !== name);
    setData('sys_areas', areas);
    renderAdminAreas();
}

function renderAdminDrivers() {
    const drivers = getData('sys_drivers') || [];
    const tbody   = document.getElementById('adminDriversTable');
    if (!tbody) return;
    tbody.innerHTML = drivers.length === 0
        ? '<tr><td colspan="4" style="text-align:center;color:#666;padding:14px;">لا يوجد سائقون</td></tr>'
        : drivers.map((d, idx) =>
            '<tr>' +
            '<td>' + (idx+1) + '</td>' +
            '<td><strong>🛵 ' + d.name + '</strong></td>' +
            '<td>' + (d.phone || '-') + '</td>' +
            '<td><button onclick="deleteDriver(\'' + d.id + '\')" ' +
            'class="gold-btn btn-danger btn-sm">حذف</button></td>' +
            '</tr>'
          ).join('');
}

function saveDeliveryDriver() {
    const name  = document.getElementById('driverNameInput')?.value.trim();
    const phone = document.getElementById('driverPhoneInput')?.value.trim();
    if (!name) return alert("⚠️ أدخل اسم السائق!");
    const drivers = getData('sys_drivers') || [];
    drivers.push({ id: 'drv_' + Date.now(), name, phone: phone || '' });
    setData('sys_drivers', drivers);
    if (document.getElementById('driverNameInput'))
        document.getElementById('driverNameInput').value = '';
    if (document.getElementById('driverPhoneInput'))
        document.getElementById('driverPhoneInput').value = '';
    renderAdminDrivers();
    alert("✅ تم إضافة السائق!");
}

function deleteDriver(id) {
    if (!confirm("حذف هذا السائق؟")) return;
    let drivers = (getData('sys_drivers')||[]).filter(d => String(d.id) !== String(id));
    setData('sys_drivers', drivers);
    renderAdminDrivers();
}

function renderAdminCashiers() {
    const cashiers = getData('sys_cashiers') || [];
    const tbody    = document.getElementById('adminCashiersTable');
    if (!tbody) return;
    tbody.innerHTML = cashiers.map((c, i) =>
        '<tr>' +
        '<td>' + (i+1) + '</td>' +
        '<td>' + c.name + '</td>' +
        '<td>' + '••••' + '</td>' +
        '<td><button onclick="deleteCashier(\'' + c.id + '\')" ' +
        'class="gold-btn btn-danger btn-sm">حذف</button></td>' +
        '</tr>'
    ).join('');
}

function saveCashier() {
    const name = document.getElementById('cashierNameInput')?.value.trim();
    const pin  = document.getElementById('cashierPassNew')?.value.trim();
    if (!name || !pin) return alert("أدخل الاسم والرمز");
    if (pin.length < 4) return alert("الرمز يجب أن يكون 4 أرقام على الأقل");

    const cashiers = getData('sys_cashiers') || [];
    cashiers.push({ id: 'c_' + Date.now(), name, pin, password: pin });
    setData('sys_cashiers', cashiers);
    if (document.getElementById('cashierNameInput'))
        document.getElementById('cashierNameInput').value = '';
    if (document.getElementById('cashierPassNew'))
        document.getElementById('cashierPassNew').value = '';
    renderAdminCashiers();
}

function deleteCashier(id) {
    if (!confirm("حذف الكاشير؟")) return;
    let cashiers = (getData('sys_cashiers')||[]).filter(c => String(c.id) !== String(id));
    setData('sys_cashiers', cashiers);
    renderAdminCashiers();
}

/* ==========================================
   🛡️ سجل التدقيق
   ========================================== */
async function renderAuditLog() {
    const box = document.getElementById('auditLogBox');
    if (!box) return;
    box.innerHTML = '<p style="color:#666;text-align:center;padding:14px;">⏳ جاري...</p>';

    const from       = document.getElementById('auditFrom')?.value || '';
    const to         = document.getElementById('auditTo')?.value   || '';
    const typeFilter = document.getElementById('auditType')?.value || 'all';

    let entries = [];
    if (db) {
        try {
            const snap = await db.collection("audit_log")
                .orderBy("at","desc").limit(400).get();
            snap.forEach(d => entries.push(d.data()));
        } catch (_) {
            entries = getData('sys_audit_log') || [];
        }
    } else {
        entries = getData('sys_audit_log') || [];
    }

    if (from) entries = entries.filter(e => (e.dateDate||'') >= from);
    if (to)   entries = entries.filter(e => (e.dateDate||'') <= to);
    if (typeFilter !== 'all') entries = entries.filter(e => e.action === typeFilter);

    const freeCount  = entries.filter(e => e.action === 'خصم مجاني').length;
    const freeVal    = entries.filter(e => e.action === 'خصم مجاني')
        .reduce((s,e) => s + cleanPrice(e.details && e.details.amount), 0);
    const expCount   = entries.filter(e => e.action === 'صرفية').length;
    const salCount   = entries.filter(e => e.action === 'راتب / صرفية موظف').length;

    const sumEl = document.getElementById('auditSummary');
    if (sumEl) {
        sumEl.innerHTML =
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));' +
            'gap:10px;text-align:center;">' +
            '<div><div style="font-size:0.7rem;color:#888;">خصومات مجانية</div>' +
            '<strong style="color:' + (freeCount > 0 ? '#ef4444' : '#10b981') +
            ';font-size:1.1rem;">' + freeCount + '</strong>' +
            '<div style="font-size:0.7rem;color:#888;">' +
            freeVal.toLocaleString('ar-IQ') + '</div></div>' +
            '<div><div style="font-size:0.7rem;color:#888;">صرفيات</div>' +
            '<strong style="color:#f59e0b;font-size:1.1rem;">' + expCount + '</strong></div>' +
            '<div><div style="font-size:0.7rem;color:#888;">رواتب</div>' +
            '<strong style="color:#10b981;font-size:1.1rem;">' + salCount + '</strong></div>' +
            '<div><div style="font-size:0.7rem;color:#888;">إجمالي</div>' +
            '<strong style="color:#fff;font-size:1.1rem;">' + entries.length + '</strong></div>' +
            '</div>';
    }

    if (entries.length === 0) {
        box.innerHTML = '<p style="color:#666;text-align:center;padding:16px;">لا توجد عمليات</p>';
        return;
    }

    const colorOf = a =>
        a === 'خصم مجاني'           ? '#ef4444' :
        a === 'تعديل سعر'           ? '#f59e0b' :
        a === 'صرفية'               ? '#f59e0b' :
        a === 'راتب / صرفية موظف'  ? '#10b981' :
        a === 'حذف صنف'             ? '#ef4444' :
        a === 'تقفيل شيفت'          ? '#38bdf8' :
        a === 'تسجيل دخول'          ? '#888'    : '#10b981';

    box.innerHTML = entries.slice(0, 200).map(e => {
        const d = e.details || {};
        let detail = '';
        if (d.itemName) detail += d.itemName;
        if (d.amount)   detail += (detail ? ' — ' : '') + cleanPrice(d.amount).toLocaleString('ar-IQ') + ' د.ع';
        if (d.oldPrice !== undefined && d.newPrice !== undefined)
            detail += ' (' + cleanPrice(d.oldPrice).toLocaleString('ar-IQ') +
                ' ← ' + cleanPrice(d.newPrice).toLocaleString('ar-IQ') + ')';
        if (d.note)     detail += (detail ? ' — ' : '') + d.note;
        if (d.employee) detail += ' — ' + d.employee;

        return '<div style="display:flex;justify-content:space-between;align-items:flex-start;' +
            'gap:8px;background:#0d0d11;padding:8px 10px;border-radius:7px;margin-bottom:4px;' +
            'border-right:3px solid ' + colorOf(e.action) + ';">' +
            '<div>' +
            '<strong style="color:' + colorOf(e.action) + ';font-size:0.82rem;">' +
            e.action + '</strong>' +
            (detail ? '<div style="font-size:0.75rem;color:#ccc;margin-top:2px;">' + detail + '</div>' : '') +
            '<div style="font-size:0.7rem;color:#666;margin-top:2px;">' +
            '👤 ' + (e.cashier||'-') + ' • ' + (e.device||'') + '</div>' +
            '</div>' +
            '<div style="font-size:0.7rem;color:#666;white-space:nowrap;">' +
            (e.atText||'') + '</div>' +
            '</div>';
    }).join('');
}

/* ==========================================
   🌐 تشخيص الاتصال السحابي
   ========================================== */
async function runCloudDiagnostics(btnElement) {
    const lines = [];
    let orig = '';
    if (btnElement) {
        orig = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> فحص...';
        btnElement.disabled  = true;
    }

    if (typeof firebase === 'undefined') {
        lines.push("❌ مكتبة Firebase غير محمّلة.");
        finishDiagnostics(lines, btnElement, orig);
        return;
    }
    lines.push("✅ Firebase محمّلة.");
    if (!db) { lines.push("❌ لم تتم تهيئة قاعدة البيانات."); finishDiagnostics(lines,btnElement,orig); return; }
    lines.push("✅ قاعدة البيانات جاهزة.");
    lines.push(navigator.onLine ? "✅ الإنترنت متصل." : "❌ لا يوجد إنترنت!");

    try {
        const snap = await db.collection("menu_items").limit(1).get({ source:'server' });
        lines.push("✅ القراءة من السحابة تعمل (" + (snap.empty ? "0" : "1+") + " أصناف).");
    } catch (err) {
        lines.push("❌ القراءة فشلت:\n" + translateFirestoreError(err));
        finishDiagnostics(lines,btnElement,orig); return;
    }

    // اختبار الكتابة
    let writeOk = false;
    try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 12000);
        const resp = await fetch(
            'https://firestore.googleapis.com/v1/projects/mim89-ff938/' +
            'databases/(default)/documents/system_store/_diag?key=AIzaSyAGpEDu0Sm2zG0AcG31XnudmC7wLsipqvI',
            {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ fields:{ content:{ stringValue:"diag" } } }),
                signal:  controller.signal
            }
        );
        clearTimeout(to);
        if (resp.ok) { writeOk = true; lines.push("✅ الكتابة تعمل!"); }
        else lines.push("❌ الكتابة مرفوضة. رمز: " + resp.status);
    } catch (e) {
        lines.push("❌ تعذّر الوصول لـ Firebase REST.\n" +
            "تحقق من الإنترنت أو قواعد Firestore Rules.");
    }

    lines.push("\n═══ الخلاصة ═══");
    lines.push(writeOk ? "🎉 كل شيء سليم!" : "⚠️ توجد مشكلة في الكتابة — راجع Firestore Rules.");
    finishDiagnostics(lines, btnElement, orig);
}

async function repairCloudSync(btnElement) {
    if (!confirm("سيُعاد ضبط المزامنة وتحديث الصفحة. هل تريد المتابعة؟")) return;
    let orig = '';
    if (btnElement) {
        orig = btnElement.innerHTML;
        btnElement.innerHTML = '⏳ إصلاح...';
        btnElement.disabled  = true;
    }
    localStorage.setItem('mim89_disable_persistence', '1');
    if (db) {
        try { await db.disableNetwork(); } catch (_) {}
        try { await db.enableNetwork();  } catch (_) {}
    }
    alert("✅ تم — سيُعاد تحميل الصفحة.");
    location.reload();
}

function finishDiagnostics(lines, btnElement, originalText) {
    if (btnElement) { btnElement.innerHTML = originalText; btnElement.disabled = false; }
    alert("🩺 نتيجة الفحص:\n\n" + lines.join("\n"));
}

async function testPrintBridge(btnElement) {
    let orig = '';
    if (btnElement) {
        orig = btnElement.innerHTML;
        btnElement.innerHTML = '⏳ فحص...';
        btnElement.disabled  = true;
    }
    try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(getPrintBridgeUrl(), { signal: controller.signal });
        clearTimeout(to);
        if (resp.ok) {
            const data = await resp.json();
            alert('✅ الجسر يعمل!\n\nطابعة الكاشير: ' +
                (data.printers && data.printers.cashier ? data.printers.cashier : '-') +
                '\nطابعة المطبخ: ' +
                (data.printers && data.printers.kitchen ? data.printers.kitchen : '-'));
        } else {
            alert('⚠️ الجسر رد برمز ' + resp.status);
        }
    } catch (_) {
        alert('❌ الجسر غير متاح.\n\nتأكد أن برنامج الجسر مشغّل على الكمبيوتر.');
    } finally {
        if (btnElement) { btnElement.innerHTML = orig; btnElement.disabled = false; }
    }
}

async function runTestPrint(btnElement) {
    let orig = '';
    if (btnElement) {
        orig = btnElement.innerHTML;
        btnElement.innerHTML = '⏳ طباعة اختبار...';
        btnElement.disabled  = true;
    }
    const testLines = [
        { text: 'MIM89 FAST FOOD',     size:'big',    align:'center', bold:true },
        { separator: 'dash' },
        { text: 'صفحة اختبار الطباعة', size:'normal', align:'center' },
        { text: '#TEST',               size:'huge',   align:'center', bold:true },
        { separator: 'solid' },
        { text: 'شاورما صاج  × 2',    size:'normal', align:'right', bold:true },
        { text: 'وجبة بركر  × 1',     size:'normal', align:'right', bold:true },
        { separator: 'dash' },
        { text: 'المجموع: 12,000 د.ع', size:'big',   align:'right', bold:true },
        { separator: 'dash' },
        { text: 'الطباعة تعمل ✓',     size:'normal', align:'center', bold:true }
    ];
    const payload = {
        jobs: [
            { printer:'cashier', lines:testLines, openDrawer:false },
            { printer:'kitchen', lines:testLines, openDrawer:false }
        ]
    };
    try {
        const resp   = await fetch(getPrintBridgeUrl(), {
            method:  'POST',
            headers: { 'Content-Type':'application/json' },
            body:    JSON.stringify(payload)
        });
        const result = await resp.json();
        const details = (result.results||[]).map(r => (r.ok?'✅ ':'❌ ') + r.message).join('\n');
        alert(result.success
            ? '✅ نجحت الطباعة!\n\n' + details
            : '⚠️ نتيجة الاختبار:\n\n' + details);
    } catch (_) {
        alert('❌ تعذّر الوصول للجسر.\nتأكد أنه مشغّل.');
    } finally {
        if (btnElement) { btnElement.innerHTML = orig; btnElement.disabled = false; }
    }
}

/* ==========================================
   💾 النسخ الاحتياطي
   ========================================== */
function exportFullSystemBackup() {
    try {
        const backup = {
            version:         "v32.0-MIM89",
            backupDate:      new Date().toLocaleString('ar-IQ'),
            timestamp:       Date.now(),
            categories:      getData('sys_categories'),
            items:           getData('sys_items'),
            inventory:       getData('sys_inventory'),
            customers:       getData('sys_customers'),
            drivers:         getData('sys_drivers'),
            cashiers:        getData('sys_cashiers'),
            expenses:        getData('sys_expenses'),
            salaries:        getData('sys_salaries'),
            completedOrders: getData('sys_completed_orders'),
            passwords:       getData('sys_passwords')
        };

        const jsonText = JSON.stringify(backup, null, 2);
        const blob     = new Blob([jsonText], { type:'application/json;charset=utf-8' });
        const url      = URL.createObjectURL(blob);
        const a        = document.createElement('a');
        a.href         = url;
        a.download     = 'MIM89_BACKUP_' + getTodayString() + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);

        alert("✅ تم تنزيل النسخة الاحتياطية!\n\n" +
            "🍔 الأصناف: " + backup.items.length + "\n" +
            "🧾 الفواتير: " + backup.completedOrders.length);
    } catch (err) {
        alert("⚠️ خطأ: " + err.message);
    }
}

function importFullSystemBackup(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.items && backup.customers) {
                if (confirm('استرجاع النسخة من ' + (backup.backupDate||'سابق') + '؟')) {
                    if (backup.categories)      setData('sys_categories',      backup.categories);
                    if (backup.items)           localStorage.setItem('sys_items', JSON.stringify(backup.items));
                    if (backup.inventory)       setData('sys_inventory',       backup.inventory);
                    if (backup.customers)       setData('sys_customers',       backup.customers);
                    if (backup.drivers)         setData('sys_drivers',         backup.drivers);
                    if (backup.cashiers)        setData('sys_cashiers',        backup.cashiers);
                    if (backup.expenses)        setData('sys_expenses',        backup.expenses);
                    if (backup.salaries)        setData('sys_salaries',        backup.salaries);
                    if (backup.completedOrders) setData('sys_completed_orders', backup.completedOrders);
                    if (backup.passwords)       setData('sys_passwords',       backup.passwords);
                    refreshActiveUI();
                    alert("🎉 تم الاسترجاع بنجاح!");
                }
            } else {
                alert("❌ الملف غير صالح!");
            }
        } catch (_) {
            alert("❌ خطأ في قراءة الملف!");
        }
    };
    reader.readAsText(file);
}

function renderStorageDiagnostics() {
    const box = document.getElementById('storageDiagBox');
    if (!box) return;
    const u   = getStorageUsage();
    const pct = Math.min(100, Math.round((u.totalBytes / 5242880) * 100));
    const col = pct > 85 ? '#ef4444' : (pct > 60 ? '#f59e0b' : '#10b981');
    const orders = (getData('sys_completed_orders')||[]).length;

    box.innerHTML =
        '<div style="font-weight:900;color:' + col + ';margin-bottom:6px;">' +
        'المساحة: ' + u.totalMB + ' MB (' + pct + '%)</div>' +
        '<div style="background:#0d0d12;border-radius:5px;height:12px;overflow:hidden;margin-bottom:8px;">' +
        '<div style="width:' + pct + '%;height:100%;background:' + col + ';"></div></div>' +
        '<div style="font-size:0.8rem;color:#ccc;">🧾 فواتير محفوظة: <strong>' + orders + '</strong></div>' +
        (pct > 80
            ? '<p style="font-size:0.78rem;color:#ef4444;margin-top:6px;">' +
              '⚠️ الذاكرة شبه ممتلئة — اضغط تنظيف</p>' : '');
}

async function migrateOrdersToCloud(btnElement) {
    if (!db) return alert("⚠️ لا اتصال بالسحابة.");
    const orders = getData('sys_completed_orders') || [];
    if (orders.length === 0) return alert("لا توجد فواتير.");

    if (!confirm("رفع " + orders.length + " فاتورة للسحابة؟")) return;

    let orig = '';
    if (btnElement) { orig = btnElement.innerHTML; btnElement.disabled = true; }

    let done = 0, failed = 0;
    for (let i = 0; i < orders.length; i++) {
        const o  = orders[i];
        const id = String(o.id || ('ORD_' + o.orderNum + '_' + o.createdTimestamp));
        try {
            await db.collection("completed_orders").doc(id).set(o, { merge:true });
            done++;
        } catch (_) { failed++; }
        if (btnElement && i % 5 === 0)
            btnElement.innerHTML = '⏳ ' + (i+1) + ' / ' + orders.length;
    }

    if (btnElement) { btnElement.innerHTML = orig; btnElement.disabled = false; }
    alert(failed === 0
        ? "✅ تم رفع كل الفواتير (" + done + ")."
        : "⚠️ رُفعت " + done + " وفشلت " + failed + ".");
}

function cleanupStorage() {
    const orders = getData('sys_completed_orders') || [];
    if (orders.length > 150 && !confirm(
        'سيُحذف ' + (orders.length - 150) + ' فاتورة قديمة محلياً.\n' +
        '(تبقى بالسحابة)\n\nهل تريد المتابعة؟'
    )) return;

    try {
        if (orders.length > 150)
            localStorage.setItem('sys_completed_orders', JSON.stringify(orders.slice(0, 150)));

        const items = getData('sys_items') || [];
        const light = items.map(it => {
            const c = { ...it };
            if (typeof c.image === 'string' && c.image.startsWith('data:') && c._imageUploaded)
                c.image = '';
            return c;
        });
        localStorage.setItem('sys_items', JSON.stringify(light));
        try { localStorage.removeItem('sys_live_orders'); } catch (_) {}
    } catch (_) {}

    renderStorageDiagnostics();
    alert("✅ تم تنظيف الذاكرة.");
    refreshActiveUI();
}

/* ==========================================
   🌐 المينيو الإلكتروني للزبائن
   ========================================== */
function setupPublicMenuRealtimeListener() {
    if (db) {
        db.collection("menu_items").onSnapshot(
            { includeMetadataChanges: true },
            snapshot => {
                if (snapshot.empty) return;
                if (snapshot.metadata && snapshot.metadata.fromCache) return;
                const cloudItems = [];
                snapshot.forEach(doc => {
                    cloudItems.push({ ...doc.data(), docId:doc.id, id:doc.data().id||doc.id });
                });
                if (cloudItems.length > 0) {
                    localStorage.setItem('sys_items', JSON.stringify(cloudItems));
                    renderPublicMenuUI();
                }
            },
            () => renderPublicMenuUI()
        );
    } else {
        renderPublicMenuUI();
    }
}

function loadPublicMenu() {
    setupPublicMenuRealtimeListener();
}

function renderPublicMenuUI() {
    const categories     = getData('sys_categories');
    const items          = getData('sys_items');
    const navContainer   = document.getElementById('categoriesNav');
    const sectionsContainer = document.getElementById('menuSections');
    if (!navContainer || !sectionsContainer) return;

    navContainer.innerHTML    = '';
    sectionsContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'category-tab active';
    allBtn.innerText  = 'الكل 🍔';
    allBtn.onclick    = () => filterCategory('all', allBtn);
    navContainer.appendChild(allBtn);

    categories.forEach(cat => {
        const btn      = document.createElement('button');
        btn.className  = 'category-tab';
        btn.innerText  = cat.name;
        btn.onclick    = () => filterCategory(cat.id, btn);
        navContainer.appendChild(btn);

        const catItems = items.filter(i =>
            getItemCategory(i) === cleanPrice(cat.id) && !i.isPaused
        );
        catItems.sort((a,b) => cleanPrice(a.price) - cleanPrice(b.price));

        if (catItems.length > 0) {
            const sec = document.createElement('div');
            sec.className = 'menu-section';
            sec.id = 'cat_' + cat.id;
            sec.setAttribute('data-category', cat.id);

            sec.innerHTML =
                '<h2 class="section-title">' + cat.name + '</h2>' +
                '<div class="items-grid">' +
                catItems.map(item => {
                    const isOut = isItemOutOfStock(item.id);
                    return '<div class="item-card' + (isOut ? ' sold-out' : '') + '">' +
                        (isOut ? '<span class="sold-out-badge">نافذ 🚫</span>' : '') +
                        '<img src="' + (item.image||item.img||'') +
                        '" alt="' + item.name + '" class="item-img" ' +
                        (isOut ? '' : 'onclick="openItemCustomizationModal(\'' + item.id + '\')"') +
                        ' onerror="this.style.display=\'none\'">' +
                        '<div class="item-details">' +
                        '<h3 class="item-name" ' +
                        (isOut ? '' : 'onclick="openItemCustomizationModal(\'' + item.id + '\')"') + '>' +
                        item.name + '</h3>' +
                        '<p class="item-desc">' + (item.ingredients||item.desc||'') + '</p>' +
                        '<div class="item-footer">' +
                        '<span class="item-price">' +
                        cleanPrice(item.price).toLocaleString('ar-IQ') + ' د.ع</span>' +
                        (isOut ? ''
                            : '<button class="add-cart-btn" ' +
                              'onclick="openItemCustomizationModal(\'' + item.id + '\')">+</button>') +
                        '</div></div></div>';
                }).join('') +
                '</div>';
            sectionsContainer.appendChild(sec);
        }
    });
}

function filterCategory(catId, btnElement) {
    document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    document.querySelectorAll('.menu-section').forEach(sec => {
        sec.style.display = (catId === 'all' ||
            sec.getAttribute('data-category') == catId) ? 'block' : 'none';
    });
}

window.openItemCustomizationModal = function(itemId) {
    const items = getData('sys_items');
    const item  = items.find(i =>
        String(i.id) === String(itemId) || cleanPrice(i.id) === cleanPrice(itemId)
    );
    if (!item) return;
    currentDetailItem = item;

    const titleEl = document.getElementById('detailTitle');
    const ingEl   = document.getElementById('detailIngredients');
    const imgEl   = document.getElementById('detailImg');
    if (titleEl) titleEl.innerText = item.name;
    if (ingEl)   ingEl.innerText   = item.ingredients || item.desc || 'وجبة طازجة.';
    if (imgEl)   imgEl.src         = item.image || item.img || '';

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
    const notesArr   = [];
    const selectedSize = document.querySelector('input[name="mealSizeRadio"]:checked')?.value;
    if (selectedSize && selectedSize !== 'عادي') notesArr.push('حجم: ' + selectedSize);
    document.querySelectorAll('.extra-item-cb:checked').forEach(cb =>
        notesArr.push('+ ' + cb.value)
    );
    const customNotes = document.getElementById('detailSpecialNotes')?.value.trim();
    if (customNotes) notesArr.push('ملاحظة: ' + customNotes);

    cart.push({
        id:          currentDetailItem.id,
        name:        currentDetailItem.name,
        price:       cleanPrice(finalPrice),
        qty:         1,
        customNotes: notesArr.join(' | ')
    });

    updateCartBadge();
    closeModal('itemDetailModal');
};

function updateCartBadge() {
    const count        = cart.reduce((s,i) => s + cleanPrice(i.qty), 0);
    const total        = cart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    const badge        = document.getElementById('cartBadgeCount');
    const floatingTotal = document.getElementById('floatingCartTotal');
    if (badge)        badge.innerText        = count;
    if (floatingTotal) floatingTotal.innerText = total.toLocaleString('ar-IQ') + ' د.ع';
}

function openCartModal() {
    renderCartModalItems();
    calculateDeliveryCostPublic();
    openModal('cartModal');
}

function renderCartModalItems() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;
    if (!cart || cart.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;color:#888;padding:18px;">السلة فارغة</p>';
        return;
    }
    container.innerHTML = cart.map((item, idx) =>
        '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'margin-bottom:7px;background:#0d0d11;padding:9px 11px;border-radius:9px;">' +
        '<div>' +
        '<strong style="color:#fff;font-size:0.88rem;">' + item.name + '</strong>' +
        (item.customNotes ? '<div style="font-size:0.72rem;color:#fbbf24;margin-top:2px;">🔹 ' +
            item.customNotes + '</div>' : '') +
        '<small style="color:#fbbf24;display:block;margin-top:2px;">' +
        (cleanPrice(item.price)*cleanPrice(item.qty)).toLocaleString('ar-IQ') + ' د.ع</small>' +
        '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
        '<button onclick="changeCartIndexQty(' + idx + ',-1)" ' +
        'style="background:#1e1e28;color:#fbbf24;border:1px solid #333;' +
        'width:28px;height:28px;border-radius:6px;cursor:pointer;font-weight:bold;">−</button>' +
        '<span style="color:#fff;font-weight:bold;">' + item.qty + '</span>' +
        '<button onclick="changeCartIndexQty(' + idx + ',1)" ' +
        'style="background:#f59e0b;color:#000;border:none;' +
        'width:28px;height:28px;border-radius:6px;cursor:pointer;font-weight:bold;">+</button>' +
        '</div></div>'
    ).join('');
}

function changeCartIndexQty(index, change) {
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    updateCartBadge();
    renderCartModalItems();
    calculateDeliveryCostPublic();
}

function calculateDeliveryCostPublic() {
    const subtotal  = cart.reduce((s,i) => s + cleanPrice(i.price)*cleanPrice(i.qty), 0);
    const orderType = document.getElementById('orderTypeSelect')?.value || 'delivery';
    const selectArea = document.getElementById('custAreaSelect')?.value || '';

    let fee = 0;
    if (orderType === 'delivery') {
        let areas = [];
        try { areas = getData('sys_areas') || []; } catch (_) {}
        const found = areas.find(a => String(a.name) === String(selectArea));
        fee = found ? cleanPrice(found.price) : 2500;
    }

    const subtotalEl  = document.getElementById('subtotalPrice');
    const feeEl       = document.getElementById('deliveryFeePrice');
    const totalEl     = document.getElementById('finalTotalPrice');
    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString('ar-IQ') + ' د.ع';
    if (feeEl)      feeEl.innerText      = (orderType==='delivery' && fee===0)
        ? 'مجاني 🎉' : fee.toLocaleString('ar-IQ') + ' د.ع';
    if (totalEl)    totalEl.innerText    = (subtotal + fee).toLocaleString('ar-IQ') + ' د.ع';
}

function saveOrderLocally(orderData) {
    const orders = getData('sys_live_orders');
    orders.push(orderData);
    setData('sys_live_orders', orders);
}

/* ==========================================
   🔧 دوال مساعدة عامة
   ========================================== */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function showVersionBadge() {
    let el = document.getElementById('mim89StatusBadge');
    if (el) { el.innerText = 'v' + MIM89_APP_VERSION; return; }
    el = document.createElement('div');
    el.id = 'mim89StatusBadge';
    el.style.cssText =
        'position:fixed;bottom:6px;left:6px;z-index:99998;' +
        'background:rgba(16,185,129,0.9);color:#fff;' +
        'font-size:0.66rem;font-weight:800;padding:3px 9px;' +
        'border-radius:7px;pointer-events:none;';
    el.innerText = 'v' + MIM89_APP_VERSION;
    document.body.appendChild(el);
}

function getCustomerHistoryByPhone(phone) {
    if (!phone || phone === '-') return null;
    const cleanPhone = String(phone).replace(/[^0-9]/g,'');
    if (cleanPhone.length < 5) return null;
    const customers = getData('sys_customers') || [];
    return customers.find(c =>
        String(c.phone||'').replace(/\D/g,'') === cleanPhone
    ) || null;
}

function getSystemPassword(type) {
    const sysPasses = getData('sys_passwords') || {};
    return sysPasses[type] || DEFAULT_DATA.passwords[type] || '1234';
}

function calculateItemCost(item) {
    const inventory = getData('sys_inventory');
    if (!item || !Array.isArray(item.recipe)) return 0;
    let totalCost = 0;
    item.recipe.forEach(ingredient => {
        const stockItem = inventory.find(inv =>
            cleanPrice(inv.id) === cleanPrice(ingredient.invId)
        );
        if (stockItem) {
            const q = cleanPrice(stockItem.quantity);
            const uc = cleanPrice(stockItem.costPerUnit) ||
                (q > 0 ? cleanPrice(stockItem.totalPrice)/q : 0);
            totalCost += uc * (parseFloat(ingredient.qty) || 0);
        }
    });
    return totalCost;
}

function deductInventoryFromRecipe(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    let inventory     = getData('sys_inventory') || [];
    const allMenuItems = getData('sys_items')    || [];
    if (inventory.length === 0) return;

    let anyDeducted = false;
    const lowAlerts = [];

    items.forEach(cartItem => {
        let menuItem = allMenuItems.find(m => String(m.id) === String(cartItem.id));
        if (!menuItem)
            menuItem = allMenuItems.find(m =>
                String(m.name).trim() === String(cartItem.name).trim()
            );
        if (!menuItem || !Array.isArray(menuItem.recipe)) return;

        const soldQty = parseFloat(cartItem.qty) || 1;
        menuItem.recipe.forEach(ing => {
            const stockItem = inventory.find(inv =>
                cleanPrice(inv.id) === cleanPrice(ing.invId)
            );
            if (!stockItem) return;
            const perUnit = parseFloat(ing.qty) || 0;
            if (perUnit <= 0) return;
            const deduct  = perUnit * soldQty;
            const before  = parseFloat(stockItem.quantity) || 0;
            const after   = Math.max(0, before - deduct);
            stockItem.quantity   = Math.round(after * 1000) / 1000;
            const q = parseFloat(stockItem.quantity) || 0;
            const uc = cleanPrice(stockItem.costPerUnit) ||
                (before > 0 ? cleanPrice(stockItem.totalPrice)/before : 0);
            stockItem.totalPrice = uc * q;
            anyDeducted = true;

            const minLimit = parseFloat(stockItem.minLimit) || 0;
            if (minLimit > 0 && before > minLimit && stockItem.quantity <= minLimit)
                lowAlerts.push(stockItem.name);
        });
    });

    if (anyDeducted) setData('sys_inventory', inventory);
    if (lowAlerts.length > 0) {
        setTimeout(() => alert(
            '📦 تنبيه المخزن:\n\n• ' + lowAlerts.join('\n• ') +
            '\n\nوصلت للحد الأدنى — أعد التجهيز.'
        ), 1000);
    }
}

// تحديث مؤشر الدليفري المعلق
function refreshPendingDeliveryBadge() {
    const badge = document.getElementById('pendingDeliveryBadge');
    if (!badge) return;
    try {
        const n = getUnsettledDeliveryOrders().length;
        badge.innerText      = n;
        badge.style.display  = n > 0 ? 'inline-block' : 'none';
    } catch (_) {}
}

// تهيئة الكاشير عند تحميل الصفحة
function initCashierPage() {
    initData();
    sessionStorage.removeItem('active_cashier');
}

// تهيئة الأدمن
function initAdminPage() {
    initData();
}

// تهيئة المخزن
function initInventoryPage() {
    initData();
}

// 🔁 مزامنة بين التبويبات
window.addEventListener('storage', (event) => {
    if (event.key === 'sys_items' ||
        event.key === 'sys_categories' ||
        event.key === 'mim89_last_menu_update') {
        if (!isCashierBusy()) refreshActiveUI();
    }
});

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (typeof showVersionBadge === 'function') showVersionBadge();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});

// ==========================================
// نهاية الجزء 4 - نهاية app.js الكامل
// ==========================================
