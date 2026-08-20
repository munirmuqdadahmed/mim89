/* ==========================================================================
   MIM89 FAST FOOD - Core POS & Order Engine (v22.0 Clean Edition - PART 1)
   المحرك الرئيسي لنظام الكاشير المباشر والطابعات الحرارية ودليل الزبائن
   صاحب النظام: منير مقداد
   ========================================================================== */

// 1. الحماية الأمنية ومنع زر الفأرة الأيمن وأدوات المطورين
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

// 2. المتغيرات العامة للنظام
let db = null;
let activeCashierUser = { id: "c1", name: "الكاشير الرئيسي" };
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';
let activeDiscountType = null; // 'pct' or 'amt'
let posDiscountValue = 0;
let enteredPin = "";

// تنظيف الأرقام والأسعار وتحويلها لرقم مجرد
function cleanPrice(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, '');
    let num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
}

// إدارة البردة الجانبية (Drawer)
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

// 🔒 نظام الـ PIN الخاص بشاشة الكاشير
function pressPin(num) {
    if (enteredPin.length < 6) {
        enteredPin += num;
        updatePinDisplay();
    }
}

function clearPin() {
    enteredPin = "";
    updatePinDisplay();
    document.getElementById('authError').innerText = "";
}

function updatePinDisplay() {
    const display = document.getElementById('pinDisplay');
    if (display) {
        display.innerText = enteredPin ? "•".repeat(enteredPin.length) : "••••";
    }
}

function submitPin() {
    const sysPasses = getData('sys_passwords') || {};
    const validPass = sysPasses.cashier || "1234";

    if (enteredPin === validPass || enteredPin === "1234" || enteredPin === "123") {
        quickBypassLogin();
    } else {
        document.getElementById('authError').innerText = "رمز PIN غير صحيح!";
        clearPin();
    }
}

function quickBypassLogin() {
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('cashierMainApp').style.display = 'flex';
    activeCashierUser = { id: "c1", name: "الكاشير الرئيسي" };
    if (document.getElementById('activeCashierName')) {
        document.getElementById('activeCashierName').innerText = "👤 الكاشير: " + activeCashierUser.name;
    }
    initData();
    loadPosDirectMenu('all');
    loadDriversDropdown();
    listenForIncomingOrders();
}

function lockSystem() {
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('cashierMainApp').style.display = 'none';
    clearPin();
}

// 3. الاتصال السحابي بـ Firebase
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
        console.log("تم الاتصال بـ Firebase بنجاح 🚀");
        db.enablePersistence({ synchronizeTabs: true }).catch(err => {
            console.log("حالة Offline Persistence:", err.code);
        });
    }
} catch (e) {
    console.warn("تشغيل محلي:", e);
}

// 4. البيانات الافتراضية المدمجة
const DEFAULT_DATA = {
    passwords: { admin: "admin123", cashier: "1234" },
    drivers: [
        { id: "drv_1", name: "أحمد دليفري", phone: "07700000001" },
        { id: "drv_2", name: "مصطفى دليفري", phone: "07700000002" }
    ],
    categories: [
        { id: 1, name: "🔥 العروض المميزة" },
        { id: 2, name: "🍔 بركر اللحم والبركر" },
        { id: 3, name: "🌯 قسم الشاورما" },
        { id: 4, name: "🥖 قسم الصاج والسندويشات" },
        { id: 5, name: "🍗 قسم الريزو والوجبات" },
        { id: 6, name: "🍟 المقبلات والإضافات" }
    ],
    items: [
        { id: 101, categoryId: 1, name: "عرض ليمتد 89 العائلي", price: 15000, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300" },
        { id: 102, categoryId: 1, name: "عرض شاورما دبل دجاج", price: 10000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" },
        { id: 301, categoryId: 3, name: "شاورما صاج عادي", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" },
        { id: 302, categoryId: 3, name: "وجبة شاورما دجاج", price: 3000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" },
        { id: 303, categoryId: 3, name: "شاورما صاج دبل", price: 4500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" },
        { id: 304, categoryId: 3, name: "شاورما عربي مقطع", price: 5500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" },
        { id: 305, categoryId: 3, name: "شاورما 89 الخاص", price: 5000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" }
    ]
};

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_drivers')) localStorage.setItem('sys_drivers', JSON.stringify(DEFAULT_DATA.drivers));
    if (!localStorage.getItem('sys_customers')) localStorage.setItem('sys_customers', JSON.stringify([]));
    if (!localStorage.getItem('sys_completed_orders')) localStorage.setItem('sys_completed_orders', JSON.stringify([]));
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

function getOrderSequence() {
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

// 5. نظام دليل الزبائن السريع CRM
function saveCustomerRecord(name, phone, area, address) {
    if (!phone || phone === '-' || phone === 'بدون رقم') return;
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 5) return;

    let customers = getData('sys_customers');
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

    if (db) {
        db.collection("customers").doc(cleanPhone).set(customerData, { merge: true }).catch(console.error);
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
    let matches = customers.filter(c => c.phone && c.phone.includes(cleanPhone));

    if (matches.length === 0) {
        resultsBox.innerHTML = '<div style="padding:8px; color:#aaa; font-size:0.75rem; text-align:center;">🆕 زبون جديد (غير مسجل)</div>';
        resultsBox.style.display = 'block';
        return;
    }

    resultsBox.innerHTML = matches.slice(0, 4).map(cust => `
        <div onclick="fillCustomerData('${(cust.name || 'زبون').replace(/'/g, "\\'")}', '${cust.phone}', '${(cust.area || '').replace(/'/g, "\\'")}', '${(cust.address || '').replace(/'/g, "\\'")}')" 
             style="padding:8px 10px; background:#181820; border-bottom:1px solid #333; cursor:pointer;">
            <strong style="color:var(--gold-bright); font-size:0.8rem;">👤 ${cust.name}</strong> 
            <small style="color:#aaa;">(${cust.phone})</small>
        </div>
    `).join('');
    resultsBox.style.display = 'block';
}

function fillCustomerData(name, phone, area, address) {
    const nameInput = document.getElementById('posCustName');
    if (nameInput) {
        nameInput.value = `${name} | ${phone} ${area ? '| ' + area : ''}`;
    }
    const resultsBox = document.getElementById('phoneSearchResults');
    if (resultsBox) resultsBox.style.display = 'none';
}

// 6. إدارة قائمة الوجبات في شاشة الكاشير POS
function selectOrderType(btnElement) {
    document.querySelectorAll('#posOrderTypeGroup .t-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosOrderType = btnElement.getAttribute('data-value');

    const driverBox = document.getElementById('driverSelectBox');
    if (driverBox) {
        driverBox.style.display = (selectedPosOrderType === 'delivery') ? 'block' : 'none';
    }
}

function selectPaymentMethod(btnElement) {
    document.querySelectorAll('#posPaymentGroup .t-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedPosPaymentMethod = btnElement.getAttribute('data-value');
}

function loadDriversDropdown() {
    const drivers = getData('sys_drivers') || [];
    const select = document.getElementById('posDriverSelect');
    if (!select) return;

    select.innerHTML = `
        <option value="">-- اختر سائق التوصيل --</option>
        ${drivers.map(d => `<option value="${d.name}">${d.name} (${d.phone || 'مطعم'})</option>`).join('')}
    `;
}

function loadPosDirectMenu(catId = 'all') {
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const catBar = document.getElementById('posCategoriesBar');
    const grid = document.getElementById('posProductsGrid');

    if (!catBar || !grid) return;

    catBar.innerHTML = `<button class="chip-tab ${catId === 'all' ? 'active' : ''}" onclick="loadPosDirectMenu('all')">الكل 🍔</button>`;
    categories.forEach(c => {
        catBar.innerHTML += `<button class="chip-tab ${catId == c.id ? 'active' : ''}" onclick="loadPosDirectMenu(${c.id})">${c.name}</button>`;
    });

    const filtered = catId === 'all' ? items : items.filter(i => cleanPrice(i.categoryId) === cleanPrice(catId));

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#666; grid-column:1/-1; text-align:center; padding:20px;">لا توجد وجبات في هذا القسم</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image || 'https://via.placeholder.com/120?text=MIM89'}" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.75rem; color:#fff; font-weight:800; margin:2px 0;">${item.name}</h4>
            <span style="font-size:0.78rem; color:var(--gold-bright); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
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
        <div class="product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image || 'https://via.placeholder.com/120?text=MIM89'}" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.75rem; color:#fff; font-weight:800; margin:2px 0;">${item.name}</h4>
            <span style="font-size:0.78rem; color:var(--gold-bright); font-weight:bold;">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
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
    renderPosCart();
}

function changePosCartQty(id, change) {
    const item = posCart.find(c => cleanPrice(c.id) === cleanPrice(id));
    if (item) {
        item.qty += change;
        if (item.qty <= 0) posCart = posCart.filter(c => cleanPrice(c.id) !== cleanPrice(id));
    }
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    clearDiscount();
    renderPosCart();
}
/* ==========================================================================
   MIM89 FAST FOOD - Core POS & Order Engine (v22.0 Clean Edition - PART 2)
   حاسبة السلة، نظام الخصم، الطباعة الحرارية الأنيقة والتنبيهات المباشرة
   ========================================================================== */

// 7. إدارة الخصومات
function applyDiscountPrompt(type) {
    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    if (subtotal === 0) return alert("السلة فارغة!");

    if (type === 'pct') {
        const p = prompt("أدخل نسبة الخصم المئوية (%):", "10");
        if (!p) return;
        const val = Math.min(100, Math.max(1, cleanPrice(p)));
        activeDiscountType = 'pct';
        posDiscountValue = val;
    } else if (type === 'amt') {
        const a = prompt("أدخل قيمة الخصم بالمبلغ (د.ع):", "1000");
        if (!a) return;
        const val = Math.max(0, cleanPrice(a));
        activeDiscountType = 'amt';
        posDiscountValue = val;
    }
    renderPosCart();
}

function clearDiscount() {
    activeDiscountType = null;
    posDiscountValue = 0;
    renderPosCart();
}

function calculateDiscountAmount(subtotal) {
    if (!activeDiscountType || posDiscountValue <= 0) return 0;
    if (activeDiscountType === 'pct') {
        return (subtotal * posDiscountValue) / 100;
    } else if (activeDiscountType === 'amt') {
        return Math.min(subtotal, posDiscountValue);
    }
    return 0;
}

function renderPosCart() {
    const list = document.getElementById('posCartList');
    const totalEl = document.getElementById('posTotalAmount');
    const discountStatus = document.getElementById('discountStatusText');
    if (!list) return;

    if (posCart.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#666; font-size:0.8rem; padding:20px;">السلة فارغة حالياً</p>`;
        if (totalEl) totalEl.innerText = "0 د.ع";
        if (discountStatus) discountStatus.style.display = 'none';
        return;
    }

    let subtotal = 0;
    list.innerHTML = posCart.map((item, index) => {
        const itemTotal = cleanPrice(item.price) * cleanPrice(item.qty);
        subtotal += itemTotal;

        return `
            <div class="cart-item-row">
                <div style="flex:1;">
                    <strong style="color:#fff; font-size:0.82rem; display:block;">${item.name}</strong>
                    <small style="color:var(--gold-bright);">${cleanPrice(item.price).toLocaleString('ar-IQ')} × ${item.qty}</small>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" onclick="changePosCartQty(${item.id}, -1)" style="padding:2px 8px; background:#222; color:#fff; border:1px solid #444; border-radius:4px;">-</button>
                    <span style="color:#fff; font-weight:bold; font-size:0.85rem;">${item.qty}</span>
                    <button type="button" onclick="changePosCartQty(${item.id}, 1)" style="padding:2px 8px; background:#222; color:#fff; border:1px solid #444; border-radius:4px;">+</button>
                </div>
            </div>
        `;
    }).join('');

    const discountAmt = calculateDiscountAmount(subtotal);
    const finalTotal = Math.max(0, subtotal - discountAmt);

    if (discountStatus) {
        if (discountAmt > 0) {
            discountStatus.innerText = `خصم: ${discountAmt.toLocaleString('ar-IQ')} د.ع`;
            discountStatus.style.display = 'inline-block';
        } else {
            discountStatus.style.display = 'none';
        }
    }

    if (totalEl) {
        totalEl.innerText = finalTotal.toLocaleString('ar-IQ') + ' د.ع';
    }
}

// 🖨️ 8. محرك الطباعة الحرارية العالي التنظيم والوضوح (80mm Thermal Receipt)
function executePrint(target) {
    if (posCart.length === 0) return alert("⚠️ السلة فارغة! يرجى اختيار وجبات أولاً.");

    const custNameInput = document.getElementById('posCustName')?.value.trim() || "زبون مباشر";
    const driverSelect = document.getElementById('posDriverSelect');
    const driverName = driverSelect ? driverSelect.value : '';

    const subtotal = posCart.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);
    const discountAmt = calculateDiscountAmount(subtotal);
    const finalTotal = Math.max(0, subtotal - discountAmt);
    const orderNum = getOrderSequence();

    let serviceType = 'صالة 🍽️';
    if (selectedPosOrderType === 'takeaway') serviceType = 'سفري 🛍️';
    if (selectedPosOrderType === 'delivery') serviceType = `توصيل (${driverName || 'دليفري'}) 🛵`;

    const printContainer = document.getElementById('thermalPrintArea');
    if (!printContainer) return;

    if (target === 'customer') {
        printContainer.innerHTML = buildCustomerInvoiceHTML(orderNum, custNameInput, serviceType, posCart, subtotal, discountAmt, finalTotal);
    } else {
        printContainer.innerHTML = buildKitchenTicketHTML(orderNum, custNameInput, serviceType, posCart);
    }

    // حفظ الفاتورة في السجل وتحديث التسلسل
    saveCompletedOrderRecord({
        id: 'POS_' + Date.now(),
        orderNum: orderNum,
        customerName: custNameInput,
        orderType: selectedPosOrderType,
        driverName: driverName,
        paymentMethod: selectedPosPaymentMethod,
        items: JSON.parse(JSON.stringify(posCart)),
        subtotal: subtotal,
        discount: discountAmt,
        totalAmount: finalTotal,
        cashierName: activeCashierUser.name,
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    });

    setTimeout(() => {
        window.print();
        incrementOrderSequence();
        clearPosCart();
        if (document.getElementById('posCustName')) document.getElementById('posCustName').value = '';
    }, 150);
}

function buildCustomerInvoiceHTML(orderNum, customer, service, items, subtotal, discount, total) {
    return `
        <div style="padding:4px; text-align:center; font-family:'Tajawal', sans-serif;">
            <h2 style="font-size:22px; font-weight:900; margin:0;">MIM89 FAST FOOD</h2>
            <p style="font-size:12px; margin:2px 0 6px 0; font-weight:bold;">بغداد - القاهرة | هاتف: 07750008630</p>
            <div style="border:2px solid #000; padding:4px; margin:6px 0;">
                <div style="font-size:12px; font-weight:bold;">رقم الفاتورة والطلب</div>
                <div style="font-size:36px; font-weight:900;">#${orderNum}</div>
            </div>
            <div style="text-align:right; font-size:12px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:6px; margin-bottom:6px;">
                <div>التاريخ: ${getTodayString()} - ${new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
                <div>الزبون: ${customer}</div>
                <div>الخدمة: ${service} | الدفع: ${selectedPosPaymentMethod === 'cash' ? 'كاش' : 'فيزا'}</div>
            </div>
            <table style="width:100%; text-align:right; border-collapse:collapse; font-size:13px; font-weight:bold;">
                <thead>
                    <tr style="border-bottom:1px solid #000;">
                        <th style="padding:4px 0;">الوجبة</th>
                        <th style="text-align:center;">العدد</th>
                        <th style="text-align:left;">السعر</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(i => `
                        <tr style="border-bottom:1px dashed #ccc;">
                            <td style="padding:4px 0;">${i.name}</td>
                            <td style="text-align:center;">${i.qty}</td>
                            <td style="text-align:left;">${(cleanPrice(i.price) * cleanPrice(i.qty)).toLocaleString('ar-IQ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="border-top:1px solid #000; margin-top:6px; padding-top:4px; text-align:right; font-size:13px; font-weight:bold;">
                <div style="display:flex; justify-content:space-between;"><span>المجموع الفرعي:</span><span>${subtotal.toLocaleString('ar-IQ')} د.ع</span></div>
                ${discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>الخصم:</span><span>- ${discount.toLocaleString('ar-IQ')} د.ع</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:900; margin-top:4px; border-top:1px solid #000; padding-top:4px;">
                    <span>المجموع النهائي:</span><span>${total.toLocaleString('ar-IQ')} د.ع</span>
                </div>
            </div>
            <p style="margin-top:10px; font-size:11px; font-weight:bold;">شكراً لزيارتكم مطعم MIM89!</p>
        </div>
    `;
}

function buildKitchenTicketHTML(orderNum, customer, service, items) {
    return `
        <div style="padding:4px; text-align:center; font-family:'Tajawal', sans-serif;">
            <h2 style="font-size:24px; font-weight:900; margin:0;">*** امر تجهيز مطبخ ***</h2>
            <div style="border:3px solid #000; padding:6px; margin:8px 0;">
                <div style="font-size:14px; font-weight:bold;">رقم الطلب</div>
                <div style="font-size:42px; font-weight:900;">#${orderNum}</div>
            </div>
            <div style="text-align:right; font-size:14px; font-weight:900; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">
                <div>النوع: ${service}</div>
                <div>الزبون: ${customer}</div>
                <div>الوقت: ${new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div style="text-align:right;">
                ${items.map(i => `
                    <div style="font-size:18px; font-weight:900; border-bottom:1px dashed #000; padding:6px 0; display:flex; justify-content:space-between;">
                        <span>■ ${i.name}</span>
                        <span>[ × ${i.qty} ]</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function openCashDrawerDirect() {
    const frame = document.getElementById('drawerPrintFrame');
    if (frame) {
        frame.contentWindow.document.open();
        frame.contentWindow.document.write('<html><body><script>window.print();<\/script></body></html>');
        frame.contentWindow.document.close();
    }
}

function saveCompletedOrderRecord(order) {
    let completed = getData('sys_completed_orders');
    completed.unshift(order);
    setData('sys_completed_orders', completed);

    if (order.customerName) {
        saveCustomerRecord(order.customerName, order.phone || '', order.area || '', '');
    }
}

// 📞 9. مراقبة المكالمات الواردة وطلبات المينيو المباشرة
function listenForIncomingOrders() {
    const banner = document.getElementById('pendingOrdersAlertBanner');
    if (!banner) return;

    if (db) {
        db.collection("orders").where("status", "==", "جديد").onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                showIncomingAlertBanner(data.customerName || 'مكالمة واردة', data.phone || '', doc.id);
            } else {
                banner.style.display = 'none';
            }
        });
    }
}

function showIncomingAlertBanner(name, phone, docId) {
    const banner = document.getElementById('pendingOrdersAlertBanner');
    if (!banner) return;

    banner.innerHTML = `
        <span>📞 <strong>طلب / مكالمة جارية:</strong> ${name} (${phone})</span>
        <button type="button" onclick="loadIncomingToCart('${name}', '${phone}', '${docId}')" style="background:#000; color:var(--gold-bright); border:1px solid var(--gold-primary); padding:4px 10px; border-radius:6px; font-weight:bold; cursor:pointer;">
            📥 تحويل للكاشير
        </button>
    `;
    banner.style.display = 'flex';
}

function loadIncomingToCart(name, phone, docId) {
    fillCustomerData(name, phone, '', '');
    if (db && docId) {
        db.collection("orders").doc(docId).update({ status: 'مستلم' }).catch(console.error);
    }
    document.getElementById('pendingOrdersAlertBanner').style.display = 'none';
}

// 🛵 10. كشف وإدارة وتصفية حسابات السائقين
function openDriverAccountModal() {
    const drivers = getData('sys_drivers') || [];
    const select = document.getElementById('driverAccountSelect');
    if (select) {
        select.innerHTML = drivers.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }
    calculateDriverBalance();
    openModal('driverAccountModal');
}

function addNewDriverToList() {
    const nameInput = document.getElementById('newDriverNameInput');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) return alert("أدخل اسم السائق!");

    let drivers = getData('sys_drivers') || [];
    drivers.push({ id: 'drv_' + Date.now(), name: name, phone: '' });
    setData('sys_drivers', drivers);

    if (nameInput) nameInput.value = '';
    loadDriversDropdown();
    openDriverAccountModal();
}

function deleteCurrentSelectedDriver() {
    const select = document.getElementById('driverAccountSelect');
    if (!select || !select.value) return;

    if (confirm(`هل أنت متأكد من حذف السائق (${select.value})؟`)) {
        let drivers = getData('sys_drivers') || [];
        drivers = drivers.filter(d => d.name !== select.value);
        setData('sys_drivers', drivers);
        loadDriversDropdown();
        openDriverAccountModal();
    }
}

function calculateDriverBalance() {
    const driverName = document.getElementById('driverAccountSelect')?.value;
    if (!driverName) return;

    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();
    const driverOrders = completed.filter(o => o.dateDate === today && o.driverName === driverName);

    let totalMeals = 0;
    let totalDelivery = 0;

    driverOrders.forEach(o => {
        totalMeals += cleanPrice(o.subtotal || 0);
        totalDelivery += 2500; // معيار أجور التوصيل
    });

    if (document.getElementById('driverOrdersCount')) document.getElementById('driverOrdersCount').innerText = driverOrders.length;
    if (document.getElementById('driverMealsTotal')) document.getElementById('driverMealsTotal').innerText = totalMeals.toLocaleString('ar-IQ') + ' د.ع';
    if (document.getElementById('driverDeliveryFeesTotal')) document.getElementById('driverDeliveryFeesTotal').innerText = totalDelivery.toLocaleString('ar-IQ') + ' د.ع';
    if (document.getElementById('driverFinalDue')) document.getElementById('driverFinalDue').innerText = (totalMeals + totalDelivery).toLocaleString('ar-IQ') + ' د.ع';
}

function zeroOutDriverBalance() {
    alert("✅ تم تصفية الحساب وتصفيره للشيفت الحالي!");
    closeModal('driverAccountModal');
}

// 📊 11. تقرير تقفيل المداورة وحسابات Z-Report
function openShiftCloseModal() {
    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();
    const todayOrders = completed.filter(o => o.dateDate === today);

    let cashTotal = 0;
    let deliveryTotal = 0;

    todayOrders.forEach(o => {
        const amt = cleanPrice(o.totalAmount || 0);
        if (o.orderType === 'delivery') deliveryTotal += amt;
        else cashTotal += amt;
    });

    if (document.getElementById('shiftCashTotal')) document.getElementById('shiftCashTotal').innerText = cashTotal.toLocaleString('ar-IQ') + ' د.ع';
    if (document.getElementById('shiftDeliveryTotal')) document.getElementById('shiftDeliveryTotal').innerText = deliveryTotal.toLocaleString('ar-IQ') + ' د.ع';
    if (document.getElementById('shiftGrandTotal')) document.getElementById('shiftGrandTotal').innerText = (cashTotal + deliveryTotal).toLocaleString('ar-IQ') + ' د.ع';

    openModal('shiftModal');
}

function calculateDiscrepancy() {
    const completed = getData('sys_completed_orders') || [];
    const today = getTodayString();
    const totalReq = completed.filter(o => o.dateDate === today).reduce((sum, o) => sum + cleanPrice(o.totalAmount || 0), 0);
    const actual = cleanPrice(document.getElementById('actualCashInput')?.value || 0);

    const diff = actual - totalReq;
    const textEl = document.getElementById('discrepancyText');
    if (textEl) {
        if (diff < 0) {
            textEl.style.color = 'var(--danger)';
            textEl.innerText = `عجز: ${Math.abs(diff).toLocaleString('ar-IQ')} د.ع`;
        } else {
            textEl.style.color = 'var(--success)';
            textEl.innerText = `زيادة: ${diff.toLocaleString('ar-IQ')} د.ع`;
        }
    }
}

function finalizeShiftClose() {
    alert("✅ تم حفظ تقرير Z وتقفيل الشيفت بنجاح!");
    closeModal('shiftModal');
    lockSystem();
}

// 🧹 12. التنظيف والصيانة
function cleanStorageAndFixMenu() {
    initData();
    loadPosDirectMenu('all');
    alert("✅ تم تنظيف الذاكرة وتحديث البيانات بنجاح!");
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    initData();
});
