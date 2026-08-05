/* ==========================================
   MIM89 FAST FOOD - Complete System Engine
   (Public Menu + POS + CRM + Live Caller ID)
   ========================================== */

// 1️⃣ تهيئة Firebase
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
    console.log("Firebase Init Error:", e);
}

// 2️⃣ البيانات الافتراضية للسيستم
const DEFAULT_DATA = {
    passwords: { admin: "admin123", inventory: "inv123" },
    cashiers: [{ id: "c1", name: "الكاشير الرئيسي", password: "123" }],
    categories: [
        { id: 1, name: "وجبات الشاورما الدجاج" },
        { id: 2, name: "الوجبات المقرمشة" },
        { id: 3, name: "المقبلات والمشروبات" }
    ],
    items: [
        {
            id: 101, categoryId: 1, name: "شاورما دجاج مميزة", price: 5000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "خبز صاج، شرائح دجاج طازجة، صلصة ثومية، مخلل، بطاطس"
        },
        {
            id: 102, categoryId: 2, name: "وجبة دجاج مقرمش (كريسبي)", price: 6500,
            image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500",
            ingredients: "قطع دجاج مقرمشة، بطاطس، صلصة ثوم، خبز طازج"
        },
        {
            id: 201, categoryId: 3, name: "بطاطس مقلية ذهبية", price: 2000,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "بطاطس ذهبية مقرمشة مع البهارات الخاصة"
        },
        {
            id: 301, categoryId: 3, name: "عصير برتقال طبيعي", price: 2500,
            image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500",
            ingredients: "عصير برتقال طبيعي طازج 100%"
        }
    ]
};

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_cashiers')) localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    if (!localStorage.getItem('sys_completed_orders')) localStorage.setItem('sys_completed_orders', JSON.stringify([]));
    if (!localStorage.getItem('sys_customers')) localStorage.setItem('sys_customers', JSON.stringify({}));
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ==========================================
   3️⃣ إدارة سجل الزبائن الذكي (CRM)
   ========================================== */
function saveOrUpdateCustomer(phone, name, area, address) {
    if (!phone || phone === "-") return;
    let customers = JSON.parse(localStorage.getItem('sys_customers')) || {};
    
    if (customers[phone]) {
        customers[phone].name = name || customers[phone].name;
        customers[phone].area = area || customers[phone].area;
        customers[phone].address = address || customers[phone].address;
        customers[phone].orderCount = (customers[phone].orderCount || 1) + 1;
        customers[phone].lastOrder = getTodayString();
    } else {
        customers[phone] = {
            name: name,
            area: area,
            address: address,
            orderCount: 1,
            firstOrder: getTodayString()
        };
    }
    localStorage.setItem('sys_customers', JSON.stringify(customers));
}

function lookupCustomerByPhone(phone) {
    if (!phone) return null;
    let customers = JSON.parse(localStorage.getItem('sys_customers')) || {};
    return customers[phone] || null;
}

function onCashierPhoneInput(phone) {
    const cust = lookupCustomerByPhone(phone);
    const infoSpan = document.getElementById('cashierCustHistoryBadge');
    
    if (cust) {
        if (document.getElementById('posCustName')) document.getElementById('posCustName').value = cust.name;
        if (infoSpan) {
            infoSpan.style.display = "block";
            infoSpan.innerHTML = `🟢 زبون دائم (طلب ${cust.orderCount} مرات سابقاً)`;
        }
    } else {
        if (infoSpan) {
            infoSpan.style.display = "block";
            infoSpan.innerHTML = `🟡 زبون جديد (أول مرة)`;
        }
    }
}

/* ==========================================
   4️⃣ الربط الفوري المباشر للمكالمات الواردة (Caller ID)
   ========================================== */
function listenToIncomingCalls() {
    if (!db) return;

    db.collection("incoming_calls")
      .orderBy("timestamp", "desc")
      .limit(1)
      .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                  const callData = change.doc.data();
                  const now = Date.now();
                  if (now - callData.timestamp < 30000) { // تنبيه إذا كان الاتصال حديثاً (آخر 30 ثانية)
                      triggerIncomingCallPopup(callData.phone, callData.source);
                  }
              }
          });
      });
}

function triggerIncomingCallPopup(phone, source) {
    const cust = lookupCustomerByPhone(phone);
    
    try {
        let audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play();
    } catch(e) {}

    const name = cust ? cust.name : "زبون جديد (غير مسجل)";
    const area = cust ? (cust.area + ' - ' + cust.address) : "لا يوجد عنوان سابق";
    const badge = cust ? `🟢 زبون دائم (طلب ${cust.orderCount} مرات)` : `🟡 زبون جديد`;

    const popupHtml = `
        <div id="callerIdAlert" style="position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:9999; background:#1c1c24; border:2px solid var(--gold-primary); border-radius:16px; padding:15px 20px; box-shadow:0 10px 30px rgba(0,0,0,0.85); color:#fff; width:90%; max-width:400px; text-align:center; animation: bounce 0.4s;">
            <div style="font-size:0.8rem; color:var(--gold-bright); font-weight:bold; margin-bottom:5px;">
                📞 اتصال وارد الآن (${source === 'whatsapp' ? 'واتساب' : 'شريحة'})
            </div>
            <h3 style="margin:4px 0; font-size:1.2rem; color:#fff;">${name}</h3>
            <p style="font-size:0.9rem; color:var(--gold-primary); font-weight:bold; margin:2px 0;">${phone}</p>
            <p style="font-size:0.8rem; color:#aaa; margin-bottom:8px;">${area}</p>
            <span style="font-size:0.75rem; background:#222; padding:3px 8px; border-radius:8px; display:inline-block; margin-bottom:10px;">${badge}</span>
            
            <div style="display:flex; gap:8px;">
                <button onclick="applyCallToPOS('${phone}', '${name}')" class="gold-btn btn-block" style="padding:8px; font-size:0.85rem;">
                    ➕ فتح فاتورة باسمه
                </button>
                <button onclick="document.getElementById('callerIdAlert').remove()" class="gold-btn" style="background:#ef4444; color:#fff; padding:8px;">
                    إغلاق
                </button>
            </div>
        </div>
    `;

    const oldAlert = document.getElementById('callerIdAlert');
    if (oldAlert) oldAlert.remove();
    document.body.insertAdjacentHTML('beforeend', popupHtml);
}

function applyCallToPOS(phone, name) {
    if (document.getElementById('posCustName')) {
        document.getElementById('posCustName').value = name;
    }
    onCashierPhoneInput(phone);
    const alertBox = document.getElementById('callerIdAlert');
    if (alertBox) alertBox.remove();
}

/* ==========================================
   5️⃣ محرك المينيو الإلكتروني للزبائن
   ========================================== */
let cart = [];

function loadPublicMenu() {
    initData();
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
            moreCatsList.innerHTML += `<button class="more-cat-chip" onclick="closeModal('moreModal'); filterCategory(${cat.id}, null);">${cat.name}</button>`;
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
                            <img src="${item.image}" class="item-img" onclick="openItemDetails(${item.id})">
                            <div class="item-details">
                                <h3 class="item-name" onclick="openItemDetails(${item.id})">${item.name}</h3>
                                <p class="item-desc">${item.ingredients || ''}</p>
                                <div class="item-footer">
                                    <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                                    <button class="add-cart-btn" onclick="addToCart(${item.id})">+</button>
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
                    <img src="${item.image}" class="item-img" onclick="openItemDetails(${item.id})">
                    <div class="item-details">
                        <h3 class="item-name">${item.name}</h3>
                        <p class="item-desc">${item.ingredients}</p>
                        <div class="item-footer">
                            <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                            <button class="add-cart-btn" onclick="addToCart(${item.id})">+</button>
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

    if (exist) { exist.qty += 1; }
    else { cart.push({ ...item, qty: 1 }); }
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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#202028; padding:10px 12px; border-radius:12px;">
            <div>
                <strong style="color:var(--gold-primary); font-size:0.95rem;">${item.name}</strong><br>
                <small style="color:#aaa;">${Number(item.price).toLocaleString()} د.ع</small>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button onclick="changeCartQty(${item.id}, -1)" class="gold-btn" style="padding:2px 10px;">-</button>
                <span style="font-weight:bold;">${item.qty}</span>
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
        } else {
            deliveryFee = areaInput !== "" ? 2500 : 3000;
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
    
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const type = document.getElementById('orderTypeSelect').value;
    const area = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    const address = document.getElementById('custAddress') ? document.getElementById('custAddress').value.trim() : '';
    const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';

    if (!name || !phone) return alert("يرجى إدخال الاسم ورقم الهاتف الكريمتين");

    // حفظ الزبون تلقائياً
    saveOrUpdateCustomer(phone, name, area, address);

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let deliveryFee = (type === 'delivery') ? ((area.includes("القاهرة") || area.includes("قاهرة")) ? 0 : 2500) : 0;
    const totalAmount = subtotal + deliveryFee;

    // توثيق الطلب عبر الواتساب لمنع الطلبات الوهمية
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

    const waUrl = `https://wa.me/964775008630?text=${encodeURIComponent(waText)}`;
    
    alert("شكرًا لك! سيتم فتح الواتساب لإرسال تأكيد الطلب المباشر للمطعم.");
    window.open(waUrl, '_blank');

    cart = [];
    updateCartBadge();
    closeModal('cartModal');
}

function sendRestaurantFeedback() {
    const msg = document.getElementById('feedbackMsg').value;
    if (!msg) return alert("اكتب ملاحظتك أولاً");
    alert("شكراً لك! تم إرسال ملاحظتك لإدارة المطعم.");
    document.getElementById('feedbackMsg').value = '';
    closeModal('moreModal');
}

/* ==========================================
   6️⃣ كاشير البيع المباشر (cashier.html)
   ========================================== */
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';

function initCashierPage() { initData(); }

function loginCashier() {
    const inputPass = String(document.getElementById('cashierPassInput').value).trim();
    let cashiers = getData('sys_cashiers');

    let user = cashiers.find(c => String(c.password).trim() === inputPass) || (inputPass === "123" ? { id: "c1", name: "الكاشير الرئيسي" } : null);

    if (user) {
        activeCashierUser = user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'block';
        document.getElementById('activeCashierName').innerText = "الكاشير الحالي: " + user.name;
        loadPosDirectMenu('all');
        listenToIncomingCalls(); // تشغيل استماع الاتصالات فور الدخول
    } else {
        document.getElementById('authError').innerText = "الرمز السري غير صحيح!";
    }
}

function logoutCashier() { location.reload(); }

function switchCashierTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
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
    initData();
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

    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image}" class="pos-product-img">
            <h4 style="font-size:0.82rem; color:#fff; margin:4px 0 2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.82rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
        </div>
    `).join('');
}

function filterPosProducts() {
    const query = document.getElementById('posSearchInput').value.toLowerCase();
    const items = getData('sys_items');
    const grid = document.getElementById('posProductsGrid');
    
    const filtered = items.filter(i => i.name.toLowerCase().includes(query));
    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image}" class="pos-product-img">
            <h4 style="font-size:0.82rem; color:#fff; margin:4px 0 2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.82rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
        </div>
    `).join('');
}

function addToPosCart(itemId) {
    const items = getData('sys_items');
    const item = items.find(i => i.id === itemId);
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
        totalEl.innerText = "0 د.ع";
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
                    <button onclick="changePosCartQty(${item.id}, -1)" class="gold-btn" style="padding:1px 8px;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changePosCartQty(${item.id}, 1)" class="gold-btn" style="padding:1px 8px;">+</button>
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

    const directOrder = {
        id: 'POS_' + Date.now(),
        customerName: custName,
        phone: "-",
        orderType: selectedPosOrderType,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? '💵 كاش' : '💳 فيزا',
        area: selectedPosOrderType === 'takeaway' ? '🛍️ سفري' : (selectedPosOrderType === 'delivery' ? '🚗 توصيل' : '🍽️ صالة'),
        items: posCart,
        subtotal: subtotal,
        deliveryFee: 0,
        totalAmount: subtotal,
        dateDate: getTodayString(),
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    saveCompletedOrder(directOrder);
    printReceipt(directOrder);
    clearPosCart();
    document.getElementById('posCustName').value = '';
}

function saveCompletedOrder(order) {
    let completed = getData('sys_completed_orders');
    completed.unshift(order);
    setData('sys_completed_orders', completed);
}

function openCompletedOrdersModal() {
    const list = document.getElementById('completedOrdersList');
    const completed = getData('sys_completed_orders');
    if (!list) return;

    if (completed.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">لا توجد فواتير مطبوعة حتى الآن</p>`;
    } else {
        list.innerHTML = completed.map(ord => `
            <div style="background:#202028; border:1px solid var(--card-border); border-radius:12px; padding:10px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; color:var(--gold-primary);">
                    <strong>${ord.customerName}</strong>
                    <small style="color:#aaa;">${ord.timestamp}</small>
                </div>
                <div style="font-size:0.82rem; color:#ccc; margin-top:4px;">
                    ${ord.items.map(i => `${i.name} (×${i.qty})`).join('، ')}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
                    <strong style="color:var(--gold-bright);">${Number(ord.totalAmount).toLocaleString()} د.ع</strong>
                    <button class="gold-btn" style="padding:4px 10px; font-size:0.78rem; border-radius:6px;" onclick="printReceipt(${JSON.stringify(ord).replace(/"/g, '&quot;')})">🖨️ إعادة طباعة</button>
                </div>
            </div>
        `).join('');
    }

    openModal('completedOrdersModal');
}

function openDailyReportModal() {
    renderDailyReport(getTodayString());
    openModal('dailyReportModal');
}

function renderDailyReport(targetDate) {
    const completed = getData('sys_completed_orders');
    const filteredOrders = completed.filter(o => o.dateDate === targetDate || (!o.dateDate && targetDate === getTodayString()));

    let totalSales = 0, totalCash = 0, totalVisa = 0;
    filteredOrders.forEach(ord => {
        const amt = Number(ord.totalAmount || 0);
        totalSales += amt;
        if (ord.paymentMethod && ord.paymentMethod.includes("فيزا")) totalVisa += amt;
        else totalCash += amt;
    });

    document.getElementById('reportDateText').innerText = "تاريخ الكشف: " + targetDate;
    document.getElementById('repTotalSales').innerText = totalSales.toLocaleString();
    document.getElementById('repOrdersCount').innerText = filteredOrders.length;
    document.getElementById('repTotalCash').innerText = totalCash.toLocaleString();
    document.getElementById('repTotalVisa').innerText = totalVisa.toLocaleString();
}

function printReceipt(order) {
    document.getElementById('receiptCustInfo').innerText = `الزبون: ${order.customerName || 'مباشر'}`;
    document.getElementById('receiptTypeInfo').innerText = `الخدمة: ${order.area || 'صالة'} | الدفع: ${order.paymentMethod || 'كاش'}`;
    
    document.getElementById('receiptItemsBody').innerHTML = (order.items || []).map(i => `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px; font-size:0.85rem;">
            <span>${i.name} (×${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()} د.ع</span>
        </div>
    `).join('');

    document.getElementById('receiptGrandTotal').innerText = (order.totalAmount || 0).toLocaleString() + ' د.ع';
    openModal('receiptModal');
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
