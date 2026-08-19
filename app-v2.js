<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MIM89 FAST FOOD - POS Luxury V2</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

    <style>
        :root {
            --bg-dark: #0f0f12;
            --bg-card: #18181d;
            --bg-element: #22222b;
            --gold-primary: #ffd700;
            --gold-bright: #fbbf24;
            --gold-gradient: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --text-main: #ffffff;
            --text-muted: #a1a1aa;
            --border-color: #27272a;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; user-select: none; }
        body { background-color: var(--bg-dark); color: var(--text-main); height: 100vh; overflow: hidden; }

        /* Auth Screen */
        #authOverlayV2 {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 10, 12, 0.97); backdrop-filter: blur(12px);
            z-index: 9999; display: flex; justify-content: center; align-items: center;
        }
        .auth-card {
            background: var(--bg-card); border: 1px solid var(--gold-primary);
            border-radius: 18px; padding: 32px; width: 380px; text-align: center;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.15);
        }
        .auth-input {
            width: 100%; padding: 14px; margin: 18px 0; background: var(--bg-element);
            border: 1px solid var(--border-color); border-radius: 10px; color: #fff;
            font-size: 1.4rem; text-align: center; letter-spacing: 6px; outline: none;
        }
        .auth-input:focus { border-color: var(--gold-primary); }

        /* Main Grid Layout */
        .pos-container { display: grid; grid-template-columns: 400px 1fr 140px; height: 100vh; }

        /* Cart Section (Left) */
        .pos-cart-section { background: var(--bg-card); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; height: 100vh; }
        .cart-header { padding: 14px; border-bottom: 1px solid var(--border-color); background: #141418; }
        .service-type-toggle { display: flex; gap: 6px; margin-bottom: 10px; }
        .svc-btn { flex: 1; padding: 10px 4px; background: var(--bg-element); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-align: center; }
        .svc-btn.active { background: var(--gold-gradient); color: #000; border-color: var(--gold-primary); }
        .cust-info-box input { width: 100%; padding: 10px; background: var(--bg-element); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none; }
        
        .cart-items-scroll { flex: 1; overflow-y: auto; padding: 12px; }
        .cart-item-card { background: var(--bg-element); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; margin-bottom: 8px; }

        .cart-footer { padding: 14px; background: #141418; border-top: 1px solid var(--border-color); }
        .total-display-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .total-amount-large { font-size: 1.9rem; font-weight: 900; color: var(--gold-primary); }

        .btn-action-main { width: 100%; padding: 14px; background: var(--gold-gradient); border: none; border-radius: 10px; color: #000; font-weight: 900; font-size: 1.1rem; cursor: pointer; }
        .btn-action-main:active { transform: scale(0.98); }

        /* Products Grid (Middle) */
        .pos-products-section { display: flex; flex-direction: column; background: var(--bg-dark); height: 100vh; }
        .top-status-bar { padding: 10px 16px; background: #141418; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .incoming-alert-banner { background: #064e3b; border-bottom: 1px solid var(--accent-green); padding: 8px 14px; display: none; }

        .products-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; padding: 14px; overflow-y: auto; }
        .product-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .product-card:active { transform: scale(0.95); border-color: var(--gold-primary); }
        .product-img { width: 75px; height: 75px; object-fit: cover; border-radius: 8px; margin-bottom: 6px; }
        .product-title { font-size: 0.8rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .product-price { font-size: 0.85rem; font-weight: 900; color: var(--gold-primary); }

        /* Categories Sidebar (Right) */
        .pos-categories-sidebar { background: #141418; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; padding: 10px; overflow-y: auto; }
        .cat-btn { padding: 14px 8px; background: var(--bg-card); border: 1px solid var(--border-color); color: #fff; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-align: center; }
        .cat-btn.active { background: var(--gold-gradient); color: #000; border-color: var(--gold-primary); }

        /* Modals */
        .modal-v2 { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px); z-index: 8000; display: none; justify-content: center; align-items: center; }
        .modal-card { background: var(--bg-card); border: 1px solid var(--gold-primary); border-radius: 16px; padding: 24px; width: 460px; max-width: 92%; }
        .denom-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .denom-row input { width: 100px; padding: 8px; background: var(--bg-element); border: 1px solid var(--border-color); border-radius: 6px; color: var(--gold-primary); text-align: center; font-weight: bold; font-size: 1rem; outline: none; }
    </style>
</head>
<body>

    <!-- Auth Protection Lock -->
    <div id="authOverlayV2">
        <div class="auth-card">
            <h2 style="color:var(--gold-primary);"><i class="fa-solid fa-shield-halved"></i> MIM89 POS V2</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-top:4px;">نظام إدارة المبيعات المحمي والمغلق</p>
            <input type="password" id="cashierPassInputV2" class="auth-input" placeholder="••••" autofocus>
            <div id="authErrorV2" style="color:var(--accent-red); font-size:0.85rem; margin-bottom:10px;"></div>
            <button class="btn-action-main" onclick="loginCashierV2()">دخول للنظام 🚀</button>
        </div>
    </div>

    <!-- Main System Screen -->
    <div class="pos-container" id="posMainScreen" style="display:none;">
        
        <!-- Left Section: Cart -->
        <div class="pos-cart-section">
            <div class="cart-header">
                <div class="service-type-toggle" id="svcTypeGroup">
                    <button class="svc-btn active" onclick="setServiceTypeV2('dine_in', this)">🍽️ صالة</button>
                    <button class="svc-btn" onclick="setServiceTypeV2('takeaway', this)">🛍️ سفري</button>
                    <button class="svc-btn" onclick="setServiceTypeV2('delivery', this)">🛵 توصيل</button>
                </div>
                <div class="cust-info-box">
                    <input type="text" id="posCustNameV2" placeholder="اسم الزبون / الهاتف..." onkeyup="autoSearchCustomerByPhoneV2(this.value)">
                    <div id="phoneSearchResultsV2" style="display:none; position:absolute; background:#18181d; border:1px solid #333; width:370px; z-index:100; max-height:150px; overflow-y:auto; border-radius:8px; padding:4px;"></div>
                </div>
            </div>

            <div class="cart-items-scroll" id="cartItemsListV2">
                <p style="text-align:center; color:var(--text-muted); padding:30px 0;">السلة فارغة حالياً</p>
            </div>

            <div class="cart-footer">
                <div class="total-display-row">
                    <span style="color:var(--text-muted);">المجموع الكلي:</span>
                    <span class="total-amount-large" id="cartTotalV2">0 د.ع</span>
                </div>
                <button class="btn-action-main" onclick="submitAndPrintOrderV2()">🖨️ دفع وطباعة الفاتورة</button>
            </div>
        </div>

        <!-- Middle Section: Products Grid -->
        <div class="pos-products-section">
            <div class="top-status-bar">
                <span id="activeCashierTitle" style="font-weight:bold; color:var(--gold-primary);">👤 الكاشير: -</span>
                <div style="display:flex; gap:8px;">
                    <button onclick="openCloseShiftModalZ()" style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-lock"></i> تقفيل الشيفت Z</button>
                    <button onclick="logoutCashierV2()" style="background:#333; color:#ccc; border:1px solid #555; padding:6px 10px; border-radius:6px; cursor:pointer;">خروج</button>
                </div>
            </div>

            <div class="incoming-alert-banner" id="incomingCallBanner"></div>
            
            <div class="products-grid" id="productsGridV2"></div>
        </div>

        <!-- Right Section: Categories Sidebar -->
        <div class="pos-categories-sidebar" id="categoriesSidebarV2"></div>

    </div>

    <!-- Z-Shift Close Modal -->
    <div class="modal-v2" id="closeShiftModalZ">
        <div class="modal-card">
            <h3 style="color:var(--gold-primary); text-align:center; margin-bottom:8px;"><i class="fa-solid fa-lock"></i> تقفيل الشيفت أمنياً (Z-Report)</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin-bottom:16px;">أدخل الفئات النقدية الفعلية بالصندوق (يتم التقريب للدينار الصحيح آلياً):</p>

            <div id="denomTable">
                <div class="denom-row"><span>50,000 د.ع:</span> <input type="number" class="denom-in" data-val="50000" value="0" min="0"></div>
                <div class="denom-row"><span>25,000 د.ع:</span> <input type="number" class="denom-in" data-val="25000" value="0" min="0"></div>
                <div class="denom-row"><span>10,000 د.ع:</span> <input type="number" class="denom-in" data-val="10000" value="0" min="0"></div>
                <div class="denom-row"><span>5,000 د.ع:</span> <input type="number" class="denom-in" data-val="5000" value="0" min="0"></div>
                <div class="denom-row"><span>1,000 د.ع والخردة:</span> <input type="number" id="denomSmallCoins" value="0" min="0"></div>
            </div>

            <button class="btn-action-main" style="margin-top:16px;" onclick="executeZShiftCloseV2()">تأكيد واستخراج وطباعة تقرير Z 📑</button>
            <button onclick="closeModalV2('closeShiftModalZ')" style="width:100%; margin-top:10px; background:none; border:none; color:var(--text-muted); cursor:pointer;">إلغاء</button>
        </div>
    </div>

    <!-- Printable Thermal Container Hidden -->
    <div id="mim89ThermalPrintBox"></div>

    <script src="app-v2.js"></script>
</body>
</html>
/* ==========================================================================
   MIM89 FAST FOOD - Core POS Master Engine V2 (Unified Secure Edition)
   مشروع الفايربيس: mim89-ff938 | صاحب النظام: منير مقداد
   ========================================================================== */

// 1. حماية وتجميد أدوات الفحص التابعة للمتصفح (Anti-DevTools & Injection Lock)
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) {
        e.preventDefault();
    }
});

// 2. المتغيرات العامة والحسابات السحابية
let db = null;
let activeCashierUserV2 = null;
let posCartV2 = [];
let activeServiceTypeV2 = 'dine_in';
let currentOpeningFloatV2 = 50000; // المداور الافتتاحي المقفل (50,000 د.ع)

// 🧮 دالة تنظيف وتقريب الأرقام المضمونة لمنع الأرقام العشرية نهائياً
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

// 3. الاتصال بـ Firebase
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
} catch (e) { console.warn("Local offline run active:", e); }

// 4. العداد التلقائي لرقم الطلبات
function getNextOrderNumberV2() {
    let lastNum = parseInt(localStorage.getItem('sys_last_order_num'), 10);
    if (isNaN(lastNum) || lastNum < 141) lastNum = 141;
    let nextNum = lastNum + 1;
    localStorage.setItem('sys_last_order_num', nextNum.toString());
    return nextNum;
}

// 5. تسجيل دخول الكاشير
function loginCashierV2() {
    const passInput = document.getElementById('cashierPassInputV2');
    const inputPass = passInput ? String(passInput.value).trim() : '';
    const sysPasses = getData('sys_passwords') || {};
    const validPass = sysPasses.cashier || "123";

    let cashiers = getData('sys_cashiers') || [];
    let user = cashiers.find(c => String(c.password).trim() === inputPass);

    if (!user && (inputPass === validPass || inputPass === '123' || inputPass === 'admin123')) {
        user = { id: "c1", name: "الكاشير الرئيسي", password: validPass };
    }

    if (user) {
        activeCashierUserV2 = user;
        document.getElementById('authOverlayV2').style.display = 'none';
        document.getElementById('posMainScreen').style.display = 'grid';
        if (document.getElementById('activeCashierTitle')) {
            document.getElementById('activeCashierTitle').innerText = "👤 الكاشير: " + user.name;
        }
        loadCategoriesV2();
        loadProductsV2('all');
        listenForIncomingOrdersV2();
    } else {
        if (document.getElementById('authErrorV2')) document.getElementById('authErrorV2').innerText = "الرمز السري غير صحيح!";
        if (passInput) { passInput.value = ""; passInput.focus(); }
    }
}

function logoutCashierV2() { location.reload(); }

function setServiceTypeV2(type, btnEl) {
    activeServiceTypeV2 = type;
    document.querySelectorAll('#svcTypeGroup .svc-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
}

// 6. تحميل وعرض الأقسام والوجبات
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

    if (items.length === 0) {
        container.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:40px;">لا توجد وجبات مسجلة بالنظام</p>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="product-card" data-cat="${item.categoryId}" onclick="addToCartV2(${item.id})">
            <img src="${item.image || 'https://via.placeholder.com/100?text=MIM89'}" class="product-img" onerror="this.src='https://via.placeholder.com/100?text=MIM89'">
            <div class="product-title">${item.name}</div>
            <div class="product-price">${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</div>
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

// 7. إدارة السلة
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
                    <strong style="font-size:0.85rem; color:#fff;">${item.name}</strong>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button onclick="changeQtyV2(${idx}, -1)" style="padding:2px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer;">-</button>
                        <span style="color:var(--gold-primary); font-weight:bold;">${item.qty}</span>
                        <button onclick="changeQtyV2(${idx}, 1)" style="padding:2px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer;">+</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                    <span>${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع × ${item.qty}</span>
                    <strong style="color:var(--gold-primary);">${itemTotal.toLocaleString('ar-IQ')} د.ع</strong>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = subtotal.toLocaleString('ar-IQ') + ' د.ع';
}

// 8. الدفع والطباعة المباشرة
function submitAndPrintOrderV2() {
    if (posCartV2.length === 0) return alert("⚠️ السلة فارغة!");

    const custName = document.getElementById('posCustNameV2')?.value.trim() || "زبون مباشر";
    const subtotal = posCartV2.reduce((sum, i) => sum + (cleanPrice(i.price) * cleanPrice(i.qty)), 0);

    const orderData = {
        id: 'POS_' + Date.now(),
        orderNum: getNextOrderNumberV2(),
        customerName: custName,
        orderType: activeServiceTypeV2 === 'delivery' ? 'توصيل' : (activeServiceTypeV2 === 'takeaway' ? 'سفري' : 'صالة'),
        items: JSON.parse(JSON.stringify(posCartV2)),
        totalAmount: cleanPrice(subtotal),
        cashierName: activeCashierUserV2 ? activeCashierUserV2.name : 'الرئيسي',
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now()
    };

    // حفظ الفاتورة
    let completed = getData('sys_completed_orders') || [];
    completed.unshift(orderData);
    setData('sys_completed_orders', completed);

    // خصم الجرد آلياً
    deductInventoryFromRecipeV2(orderData.items);

    // طباعة الفاتورة حرارياً
    printCustomerInvoiceThermalV2(orderData);

    // تفريغ الواجهة
    posCartV2 = [];
    renderCartV2();
    if (document.getElementById('posCustNameV2')) document.getElementById('posCustNameV2').value = '';
    alert("✅ تم تنفيذ الفاتورة وطباعتها بنجاح!");
}

// 9. خصم الجرد والمخزن
function deductInventoryFromRecipeV2(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    let inventory = getData('sys_inventory') || [];
    const allMenuItems = getData('sys_items') || [];

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

// 10. طباعة الفواتير الحرارية
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
                <div>التاريخ: ${order.dateDate} - ${order.timestamp}</div>
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

// 11. تقفيل الشيفت أمنياً واستخراج تقرير Z
function openCloseShiftModalZ() {
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

    const completed = getData('sys_completed_orders') || [];
    const expenses = getData('sys_expenses') || [];

    let totalSales = 0;
    completed.forEach(o => totalSales += cleanPrice(o.totalAmount || 0));

    let totalExp = 0;
    expenses.forEach(e => totalExp += cleanPrice(e.amount || 0));

    totalSales = Math.floor(totalSales);
    totalExp = Math.floor(totalExp);
    
    const expectedCashInDrawer = Math.floor(currentOpeningFloatV2 + totalSales - totalExp);
    const diff = Math.floor(totalCashCounted - expectedCashInDrawer);

    let resultStatus = "✅ مطابق تماماً";
    if (diff < 0) resultStatus = `🔴 عجز بمقدار (${Math.abs(diff).toLocaleString('ar-IQ')} د.ع)`;
    if (diff > 0) resultStatus = `🟡 زيادة بمقدار (+${diff.toLocaleString('ar-IQ')} د.ع)`;

    const zData = {
        shiftId: "Z-" + Date.now(),
        date: getTodayString(),
        time: new Date().toLocaleTimeString('ar-IQ'),
        cashier: activeCashierUserV2 ? activeCashierUserV2.name : "الكاشير الرئيسي",
        openingFloat: currentOpeningFloatV2,
        totalSales: totalSales,
        totalExpenses: totalExp,
        expectedCash: expectedCashInDrawer,
        actualCash: totalCashCounted,
        diff: diff,
        status: resultStatus
    };

    // طباعة شريط Z حرارياً
    printZReportThermalV2(zData);

    // إرسال تنبيه بالواتساب
    let zReportMsg = `📄 *تقرير Z المالي لتقفيل الشيفت - MIM89* 📄\n`;
    zReportMsg += `----------------------------------\n`;
    zReportMsg += `🕒 *التاريخ والوقت:* ${zData.date} - ${zData.time}\n`;
    zReportMsg += `👤 *الكاشير:* ${zData.cashier}\n`;
    zReportMsg += `💰 *المداور الافتتاحي:* ${zData.openingFloat.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `🛒 *إجمالي المبيعات:* ${zData.totalSales.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `💸 *إجمالي المصاريف:* ${zData.totalExpenses.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `📊 *المتوقع بالصندوق:* ${zData.expectedCash.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `💵 *العد الفعلي للكاشير:* ${zData.actualCash.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `----------------------------------\n`;
    zReportMsg += `📌 *نتيجة التصفية:* ${zData.status}\n`;

    const myPhone = "9647750008630";
    window.open(`https://api.whatsapp.com/send?phone=${myPhone}&text=${encodeURIComponent(zReportMsg)}`, '_blank');

    closeModalV2('closeShiftModalZ');
}

function printZReportThermalV2(z) {
    const printBox = document.getElementById('mim89ThermalPrintBox');
    if (!printBox) return;

    printBox.innerHTML = `
        <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000; padding:5px;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:5px;">
                <h2 style="font-size:18px; margin:0; font-weight:900;">*** تقرير Z لتقفيل الشيفت ***</h2>
                <div style="font-size:11px; font-weight:bold;">MIM89 FAST FOOD</div>
            </div>
            <div style="font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
                <div>التاريخ والوقت: ${z.date} - ${z.time}</div>
                <div>الكاشير المسؤول: ${z.cashier}</div>
                <div>رقم التقرير: ${z.shiftId}</div>
            </div>
            <div style="font-size:12px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:5px; margin-bottom:5px;">
                <div style="display:flex; justify-content:space-between;"><span>المداور الافتتاحي:</span> <span>${z.openingFloat.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>إجمالي المبيعات:</span> <span>${z.totalSales.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>إجمالي المصاريف:</span> <span>- ${z.totalExpenses.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between; border-top:1px dashed #000; padding-top:3px; margin-top:3px;"><span>المتوقع بالصندوق:</span> <span>${z.expectedCash.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>المحسوب فعلياً:</span> <span>${z.actualCash.toLocaleString('ar-IQ')} د.ع</span></div>
            </div>
            <div style="text-align:center; font-size:14px; font-weight:900; margin-top:5px; border:1px solid #000; padding:4px;">
                ${z.status}
            </div>
        </div>
    `;
    setTimeout(() => { window.print(); }, 150);
}

// 12. استماع الاتصالات والطلبات المباشرة
function listenForIncomingOrdersV2() {
    if (!db) return;
    db.collection("orders").onSnapshot(snapshot => {
        let unhandledCount = 0;
        snapshot.forEach(doc => {
            const ord = doc.data();
            if (!ord.status || ord.status === 'جديد' || ord.status === 'new') unhandledCount++;
        });
        const alertBanner = document.getElementById('incomingCallBanner');
        if (alertBanner) {
            if (unhandledCount > 0) {
                alertBanner.innerHTML = `<span style="color:#fff; font-weight:bold;">🔔 يوجد (${unhandledCount}) طلبات جديدة واردة من المينيو أو مكالمات!</span>`;
                alertBanner.style.display = 'block';
            } else {
                alertBanner.style.display = 'none';
            }
        }
    }, err => console.log("Cloud listen err:", err));
}

// 13. البحث التلقائي عن الزبون
function autoSearchCustomerByPhoneV2(phoneInput) {
    const cleanPhone = String(phoneInput || '').replace(/[^0-9]/g, '');
    const resultsBox = document.getElementById('phoneSearchResultsV2');
    if (!resultsBox) return;

    if (cleanPhone.length < 3) {
        resultsBox.style.display = 'none';
        return;
    }

    const customers = getData('sys_customers') || [];
    let matches = customers.filter(c => c.phone && c.phone.includes(cleanPhone));

    if (matches.length === 0) {
        resultsBox.innerHTML = '<div style="padding:6px; color:#aaa; font-size:0.8rem; text-align:center;">🆕 زبون جديد</div>';
        resultsBox.style.display = 'block';
        return;
    }

    resultsBox.innerHTML = matches.slice(0, 3).map(cust => `
        <div onclick="fillCustomerDataV2('${cust.name}', '${cust.phone}')" style="padding:6px; background:#222; border-bottom:1px solid #333; cursor:pointer; border-radius:4px; margin-bottom:2px;">
            <strong style="color:var(--gold-primary); font-size:0.8rem;">👤 ${cust.name}</strong> <small style="color:#aaa;">(${cust.phone})</small>
        </div>
    `).join('');
    resultsBox.style.display = 'block';
}

function fillCustomerDataV2(name, phone) {
    const nameInput = document.getElementById('posCustNameV2');
    if (nameInput) nameInput.value = `${name} (${phone})`;
    const resultsBox = document.getElementById('phoneSearchResultsV2');
    if (resultsBox) resultsBox.style.display = 'none';
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
