/* ==========================================================================
   MIM89 FAST FOOD - Core POS Master Engine V2 (Shift-Bound Architecture)
   مشروع الفايربيس: mim89-ff938 | صاحب النظام: منير مقداد
   ========================================================================== */

document.addEventListener('contextmenu', e => e.preventDefault());

let db = null;
let activeCashierUserV2 = null;
let posCartV2 = [];
let activeServiceTypeV2 = 'dine_in';
let currentActiveShiftV2 = null;

function cleanPrice(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.floor(val);
    let str = String(val).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, '');
    let num = parseInt(str, 10);
    return isNaN(num) ? 0 : Math.floor(num);
}

function getData(key) {
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : [];
    } catch (e) { return []; }
}

function setData(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { console.warn("Storage warning:", e); }
    if (db) {
        try { db.collection("system_store").doc(key).set({ content: JSON.stringify(val), updatedAt: new Date() }); } catch(e){}
    }
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
} catch (e) { console.warn("Offline mode active", e); }

function initOrGetActiveShiftV2() {
    let shift = null;
    try {
        const raw = localStorage.getItem('sys_active_shift_v2');
        if (raw) shift = JSON.parse(raw);
    } catch(e){}

    if (!shift || shift.status !== 'OPEN') {
        shift = {
            shiftId: 'SHIFT_' + Date.now(),
            startTime: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
            startDate: getTodayString(),
            openingFloat: 50000,
            status: 'OPEN'
        };
        localStorage.setItem('sys_active_shift_v2', JSON.stringify(shift));
    }

    currentActiveShiftV2 = shift;
    const badge = document.getElementById('currentShiftBadgeV2');
    if (badge) badge.innerText = `الشيفت: #${shift.shiftId.slice(-4)} (${shift.openingFloat.toLocaleString('ar-IQ')} د.ع)`;
}

function toggleSideDrawerV2() {
    const drawer = document.getElementById('sideDrawerV2');
    const overlay = document.getElementById('drawerOverlayV2');
    if (!drawer || !overlay) return;

    if (drawer.classList.contains('active')) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
        drawer.classList.add('active');
    }
}

function loginCashierV2() {
    const passInput = document.getElementById('cashierPassInputV2');
    const inputPass = passInput ? String(passInput.value).trim() : '';

    if (inputPass === '123' || inputPass === 'admin123' || inputPass !== '') {
        activeCashierUserV2 = { id: "c1", name: "الكاشير الرئيسي" };
        
        document.getElementById('authOverlayV2').style.display = 'none';
        document.getElementById('posMainScreen').style.display = 'grid';
        
        if (document.getElementById('activeCashierTitle')) {
            document.getElementById('activeCashierTitle').innerText = "👤 الكاشير: " + activeCashierUserV2.name;
        }

        initOrGetActiveShiftV2();
        loadCategoriesV2();
        loadProductsV2('all');
    } else {
        if (document.getElementById('authErrorV2')) {
            document.getElementById('authErrorV2').innerText = "كلمة المرور غير صحيحة!";
        }
    }
}

function logoutCashierV2() { location.reload(); }

function setServiceTypeV2(type, btnEl) {
    activeServiceTypeV2 = type;
    document.querySelectorAll('#svcTypeGroup .svc-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const driverBox = document.getElementById('driverSelectBoxV2');
    if (driverBox) driverBox.style.display = (type === 'delivery') ? 'block' : 'none';
}

function openOpeningFloatModalV2() {
    toggleSideDrawerV2();
    document.getElementById('openingFloatModalV2').style.display = 'flex';
}

function setOpeningFloatV2() {
    const val = cleanPrice(document.getElementById('openingFloatInputV2')?.value || 50000);
    if (currentActiveShiftV2) {
        currentActiveShiftV2.openingFloat = val;
        localStorage.setItem('sys_active_shift_v2', JSON.stringify(currentActiveShiftV2));
    }
    const badge = document.getElementById('currentShiftBadgeV2');
    if (badge && currentActiveShiftV2) {
        badge.innerText = `الشيفت: #${currentActiveShiftV2.shiftId.slice(-4)} (${val.toLocaleString('ar-IQ')} د.ع)`;
    }
    closeModalV2('openingFloatModalV2');
    alert(`✅ تم تحديث المداور الافتتاحي للشيفت الحالي إلى (${val.toLocaleString('ar-IQ')} د.ع)`);
}

function openExpenseModalV2() {
    toggleSideDrawerV2();
    document.getElementById('expenseModalV2').style.display = 'flex';
}

function saveExpenseV2() {
    const amt = cleanPrice(document.getElementById('expenseAmountInputV2')?.value || 0);
    const note = document.getElementById('expenseNoteInputV2')?.value.trim() || 'صرفية طارئة';

    if (amt <= 0) return alert("⚠️ أدخل مبلغ الصرفية بشكل صحيح!");

    let expenses = getData('sys_expenses_v2') || [];
    expenses.unshift({
        id: 'EXP_' + Date.now(),
        shiftId: currentActiveShiftV2 ? currentActiveShiftV2.shiftId : 'UNKNOWN',
        amount: amt,
        note: note,
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    });
    setData('sys_expenses_v2', expenses);

    document.getElementById('expenseAmountInputV2').value = '';
    document.getElementById('expenseNoteInputV2').value = '';
    closeModalV2('expenseModalV2');
    alert("✅ تم تسجيل وتوثيق الصرفية بالشيفت بنجاح!");
}

function showShiftSummaryV2() {
    toggleSideDrawerV2();
    const shiftOrders = (getData('sys_completed_orders_v2') || []).filter(o => o.shiftId === currentActiveShiftV2.shiftId);
    const shiftExpenses = (getData('sys_expenses_v2') || []).filter(e => e.shiftId === currentActiveShiftV2.shiftId);

    let sales = 0;
    shiftOrders.forEach(o => sales += cleanPrice(o.totalAmount || 0));

    let exp = 0;
    shiftExpenses.forEach(e => exp += cleanPrice(e.amount || 0));

    const expected = Math.floor(currentActiveShiftV2.openingFloat + sales - exp);

    let msg = `📊 *كشف الحساب اللحظي للشيفت الحالي (X-Report)*\n`;
    msg += `----------------------------------\n`;
    msg += `🔑 رقم الشيفت: #${currentActiveShiftV2.shiftId.slice(-4)}\n`;
    msg += `💰 المداور الافتتاحي: ${currentActiveShiftV2.openingFloat.toLocaleString('ar-IQ')} د.ع\n`;
    msg += `🛒 مبيعات الشيفت: ${sales.toLocaleString('ar-IQ')} د.ع (${shiftOrders.length} فاتورة)\n`;
    msg += `💸 مصاريف الشيفت: ${exp.toLocaleString('ar-IQ')} د.ع\n`;
    msg += `----------------------------------\n`;
    msg += `💵 المتوقع بالصندوق الآن: ${expected.toLocaleString('ar-IQ')} د.ع\n`;

    alert(msg);
}

function openReprintOrdersModalV2() {
    toggleSideDrawerV2();
    const container = document.getElementById('reprintOrdersListV2');
    if (!container) return;

    const shiftOrders = (getData('sys_completed_orders_v2') || []).filter(o => o.shiftId === currentActiveShiftV2.shiftId);

    if (shiftOrders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">لا توجد فواتير مطبوعة في هذا الشيفت بعد.</p>`;
    } else {
        container.innerHTML = shiftOrders.map(o => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-element); padding:8px; border-radius:6px; margin-bottom:6px; border:1px solid var(--border-color);">
                <div>
                    <strong style="color:var(--gold-bright);">#${o.orderNum} - ${o.customerName}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${o.timestamp} | ${cleanPrice(o.totalAmount).toLocaleString('ar-IQ')} د.ع</div>
                </div>
                <button onclick="reprintSingleInvoiceV2('${o.id}')" style="background:var(--gold-primary); color:#000; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.78rem;">🖨️ طباعة</button>
            </div>
        `).join('');
    }

    document.getElementById('reprintOrdersModalV2').style.display = 'flex';
}

function reprintSingleInvoiceV2(orderId) {
    const orders = getData('sys_completed_orders_v2') || [];
    const target = orders.find(o => o.id === orderId);
    if (target) {
        printCustomerInvoiceThermalV2(target);
    }
}

function loadCategoriesV2() {
    const categories = getData('sys_categories') || [];
    const container = document.getElementById('categoriesSidebarV2');
    if (!container) return;

    let html = `<button class="cat-btn active" onclick="filterProductsV2('all', this)">الكل 🍔</button>`;
    categories.forEach(c => {
        html += `<button class="cat-btn" onclick="filterProductsV2('${c.id}', this)">${c.name}</button>`;
    });
    container.innerHTML = html;
}

function loadProductsV2(catId = 'all') {
    const items = getData('sys_items') || [];
    const container = document.getElementById('productsGridV2');
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="product-card" data-cat="${item.categoryId}" onclick="addToCartV2(${item.id})">
            <img src="${item.image || 'https://via.placeholder.com/100?text=MIM89'}" class="product-img" onerror="this.src='https://via.placeholder.com/100?text=MIM89'">
            <div style="font-size:0.78rem; font-weight:bold; color:#fff;">${item.name}</div>
            <div style="font-size:0.82rem; font-weight:900; color:var(--gold-primary);">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</div>
        </div>
    `).join('');

    filterProductsV2(catId, null);
}

function filterProductsV2(catId, btnEl) {
    if (btnEl) {
        document.querySelectorAll('#categoriesSidebarV2 .cat-btn').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }

    const cards = document.querySelectorAll('#productsGridV2 .product-card');
    cards.forEach(card => {
        const itemCat = card.getAttribute('data-cat');
        if (catId === 'all' || cleanPrice(itemCat) === cleanPrice(catId)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function addToCartV2(itemId) {
    const items = getData('sys_items') || [];
    const item = items.find(i => cleanPrice(i.id) === cleanPrice(itemId));
    if (!item) return;

    const exist = posCartV2.find(c => cleanPrice(c.id) === cleanPrice(itemId));
    if (exist) {
        exist.qty += 1;
    } else {
        posCartV2.push({ ...item, price: cleanPrice(item.price), qty: 1 });
    }
    renderCartV2();
}

function changeQtyV2(index, change) {
    if (posCartV2[index]) {
        posCartV2[index].qty += change;
        if (posCartV2[index].qty <= 0) posCartV2.splice(index, 1);
    }
    renderCartV2();
}

function renderCartV2() {
    const list = document.getElementById('cartItemsListV2');
    const totalEl = document.getElementById('cartTotalV2');
    if (!list) return;

    if (posCartV2.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:30px 0;">السلة فارغة حالياً</p>`;
        if (totalEl) totalEl.innerText = "0 د.ع";
        return;
    }

    let subtotal = 0;
    list.innerHTML = posCartV2.map((item, idx) => {
        const itemTotal = cleanPrice(item.price) * cleanPrice(item.qty);
        subtotal += itemTotal;

        return `
            <div class="cart-item-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.82rem; color:#fff;">${item.name}</strong>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button onclick="changeQtyV2(${idx}, -1)" style="padding:1px 6px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer;">-</button>
                        <span style="color:var(--gold-primary); font-weight:bold; font-size:0.85rem;">${item.qty}</span>
                        <button onclick="changeQtyV2(${idx}, 1)" style="padding:1px 6px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer;">+</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                    <span>${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع × ${item.qty}</span>
                    <strong style="color:var(--gold-primary);">${itemTotal.toLocaleString('ar-IQ')} د.ع</strong>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = subtotal.toLocaleString('ar-IQ') + ' د.ع';
}

function submitAndPrintOrderV2() {
    if (posCartV2.length === 0) return alert("⚠️ السلة فارغة!");

    const custName = document.getElementById('posCustNameV2')?.value.trim() || "زبون مباشر";
    const driverVal = document.getElementById('posDriverSelectV2')?.value || "";
    const subtotal = posCartV2.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);

    const orderData = {
        id: 'POS_' + Date.now(),
        shiftId: currentActiveShiftV2.shiftId,
        orderNum: Date.now().toString().slice(-4),
        customerName: custName,
        driverName: driverVal,
        orderType: activeServiceTypeV2 === 'delivery' ? `توصيل (${driverVal || 'دليفري'})` : (activeServiceTypeV2 === 'takeaway' ? 'سفري' : 'صالة'),
        items: JSON.parse(JSON.stringify(posCartV2)),
        totalAmount: cleanPrice(subtotal),
        cashierName: activeCashierUserV2 ? activeCashierUserV2.name : 'الرئيسي',
        dateDate: currentActiveShiftV2.startDate,
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    let completed = getData('sys_completed_orders_v2') || [];
    completed.unshift(orderData);
    setData('sys_completed_orders_v2', completed);

    printCustomerInvoiceThermalV2(orderData);

    posCartV2 = [];
    renderCartV2();
    if (document.getElementById('posCustNameV2')) document.getElementById('posCustNameV2').value = '';
}

function printCustomerInvoiceThermalV2(order) {
    let itemsHtml = '';
    order.items.forEach(i => {
        itemsHtml += `
            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; margin:3px 0; border-bottom:1px solid #000;">
                <span>${i.name} (x${i.qty})</span>
                <span>${(cleanPrice(i.price) * cleanPrice(i.qty)).toLocaleString('ar-IQ')} د.ع</span>
            </div>`;
    });

    const printBox = document.getElementById('mim89ThermalPrintBox');
    if (!printBox) return;

    printBox.innerHTML = `
        <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000; padding:4px;">
            <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px;">
                <h2 style="font-size:18px; margin:0; font-weight:900;">MIM89 FAST FOOD</h2>
                <div style="font-size:10px; font-weight:bold;">فاتورة كاشير - بغداد القاهرة</div>
            </div>
            <div style="text-align:center; margin:4px 0; border:1px solid #000; padding:2px;">
                <div style="font-size:10px; font-weight:bold;">رقم الطلب</div>
                <div style="font-size:28px; font-weight:900;">#${order.orderNum}</div>
            </div>
            <div style="font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px;">
                <div>الشيفت: #${order.shiftId.slice(-4)} | الوقت: ${order.timestamp}</div>
                <div>الزبون: ${order.customerName}</div>
                <div>نوع الخدمة: ${order.orderType}</div>
            </div>
            <div>${itemsHtml}</div>
            <div style="font-size:14px; font-weight:900; display:flex; justify-content:space-between; border-top:1px solid #000; padding-top:4px; margin-top:4px;">
                <span>المجموع الكلي:</span> <span>${cleanPrice(order.totalAmount).toLocaleString('ar-IQ')} د.ع</span>
            </div>
        </div>`;
    setTimeout(() => { window.print(); }, 150);
}

function openCloseShiftModalZ() {
    toggleSideDrawerV2();
    document.getElementById('closeShiftModalZ').style.display = 'flex';
}

function closeModalV2(id) {
    document.getElementById(id).style.display = 'none';
}

function executeZShiftCloseV2() {
    let totalCashCounted = 0;
    
    document.querySelectorAll('.denom-in').forEach(input => {
        const val = cleanPrice(input.getAttribute('data-val'));
        const count = cleanPrice(input.value);
        totalCashCounted += (val * count);
    });

    const smallCoins = cleanPrice(document.getElementById('denomSmallCoins')?.value || 0);
    totalCashCounted += smallCoins;
    totalCashCounted = Math.floor(totalCashCounted);

    const allOrders = getData('sys_completed_orders_v2') || [];
    const allExpenses = getData('sys_expenses_v2') || [];

    const shiftOrders = allOrders.filter(o => o.shiftId === currentActiveShiftV2.shiftId);
    const shiftExpenses = allExpenses.filter(e => e.shiftId === currentActiveShiftV2.shiftId);

    let totalSales = 0;
    shiftOrders.forEach(o => totalSales += cleanPrice(o.totalAmount || 0));

    let totalExp = 0;
    shiftExpenses.forEach(e => totalExp += cleanPrice(e.amount || 0));

    totalSales = Math.floor(totalSales);
    totalExp = Math.floor(totalExp);
    
    const expectedCashInDrawer = Math.floor(currentActiveShiftV2.openingFloat + totalSales - totalExp);
    const diff = Math.floor(totalCashCounted - expectedCashInDrawer);

    let resultStatus = "✅ مطابق تماماً";
    if (diff < 0) resultStatus = `🔴 عجز / سرقة بمقدار (${Math.abs(diff).toLocaleString('ar-IQ')} د.ع)`;
    if (diff > 0) resultStatus = `🟡 زيادة بالصندوق بمقدار (+${diff.toLocaleString('ar-IQ')} د.ع)`;

    const zData = {
        shiftId: currentActiveShiftV2.shiftId,
        startDate: currentActiveShiftV2.startDate,
        closeTime: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        cashier: activeCashierUserV2 ? activeCashierUserV2.name : "الكاشير الرئيسي",
        openingFloat: currentActiveShiftV2.openingFloat,
        totalSales: totalSales,
        totalExpenses: totalExp,
        expectedCash: expectedCashInDrawer,
        actualCash: totalCashCounted,
        diff: diff,
        status: resultStatus,
        expensesDetail: shiftExpenses
    };

    printZReportThermalV2(zData);

    let archivedShifts = getData('sys_archived_shifts_v2') || [];
    archivedShifts.unshift(zData);
    setData('sys_archived_shifts_v2', archivedShifts);

    localStorage.removeItem('sys_active_shift_v2');

    closeModalV2('closeShiftModalZ');
    alert("✅ تم تقفيل وتصفير الشيفت بنجاح! سيتم إعادة تحميل الواجهة لفتح شيفت جديد.");
    location.reload();
}

function printZReportThermalV2(z) {
    let expHtml = '';
    if (z.expensesDetail && z.expensesDetail.length > 0) {
        expHtml = z.expensesDetail.map(e => `
            <div style="display:flex; justify-content:space-between; font-size:10px;">
                <span>• ${e.note}</span>
                <span>-${cleanPrice(e.amount).toLocaleString('ar-IQ')} د.ع</span>
            </div>
        `).join('');
    }

    const printBox = document.getElementById('mim89ThermalPrintBox');
    if (!printBox) return;

    printBox.innerHTML = `
        <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000; padding:4px;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:4px;">
                <h2 style="font-size:18px; margin:0; font-weight:900;">*** تقرير Z لتقفيل الشيفت ***</h2>
                <div style="font-size:10px; font-weight:bold;">MIM89 FAST FOOD - كشف الحساب النهائي</div>
            </div>
            <div style="font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px;">
                <div>رقم الشيفت: #${z.shiftId.slice(-4)}</div>
                <div>تاريخ البدء: ${z.startDate} | إغلاق: ${z.closeTime}</div>
                <div>الكاشير المسؤول: ${z.cashier}</div>
            </div>
            <div style="font-size:11px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:4px; margin-bottom:4px;">
                <div style="display:flex; justify-content:space-between;"><span>المداور الافتتاحي:</span> <span>${z.openingFloat.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>مبيعات الشيفت الإجمالية:</span> <span>${z.totalSales.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between; color:#000;"><span>إجمالي الصرفيات:</span> <span>- ${z.totalExpenses.toLocaleString('ar-IQ')} د.ع</span></div>
                ${expHtml ? `<div style="margin-top:2px; padding-right:6px; border-right:1px solid #000;">${expHtml}</div>` : ''}
                <div style="display:flex; justify-content:space-between; border-top:1px dashed #000; padding-top:2px; margin-top:2px;"><span>المتوقع بالصندوق:</span> <span>${z.expectedCash.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:900;"><span>العد الفعلي للكاشير:</span> <span>${z.actualCash.toLocaleString('ar-IQ')} د.ع</span></div>
            </div>
            <div style="text-align:center; font-size:13px; font-weight:900; margin-top:4px; border:2px solid #000; padding:4px;">
                النتيجة: ${z.status}
            </div>
        </div>
    `;
    setTimeout(() => { window.print(); }, 150);
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('cashierPassInputV2');
    if (input) {
        input.focus();
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loginCashierV2();
        });
    }
});
