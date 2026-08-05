/* ==========================================
   MIM89 FAST FOOD - Complete Core Engine
   ========================================== */

// 1. الاتصال بـ Firebase
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
        console.log("تم الاتصال بـ Firebase بنجاح! 🚀");
    }
} catch (e) {
    console.warn("جاري التشغيل بالنظام المحلي:", e);
}

// 2. البيانات الافتراضية
const DEFAULT_DATA = {
    passwords: { admin: "admin123", inventory: "inv123" },
    cashiers: [
        { id: "c1", name: "الكاشير الرئيسي", password: "123" }
    ],
    categories: [
        { id: 1, name: "وجبات الشاورما الدجاج" },
        { id: 2, name: "الوجبات المقرمشة" },
        { id: 3, name: "المقبلات والمشروبات" }
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
        { id: 4, name: "صلصة ثومية", quantity: 30, unit: "علبة" }
    ],
    items: [
        {
            id: 101, categoryId: 1, name: "شاورما دجاج مميزة", price: 5000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "خبز صاج، شرائح دجاج طازجة، صلصة ثومية، مخلل، بطاطس",
            recipe: [ { invId: 1, qty: 0.15 }, { invId: 2, qty: 1 }, { invId: 4, qty: 0.05 } ]
        },
        {
            id: 102, categoryId: 2, name: "وجبة دجاج مقرمش (كريسبي)", price: 6500,
            image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500",
            ingredients: "قطع دجاج مقرمشة، بطاطس، صلصة ثوم، خبز طازج",
            recipe: [ { invId: 1, qty: 0.25 }, { invId: 3, qty: 0.15 }, { invId: 4, qty: 0.1 } ]
        },
        {
            id: 201, categoryId: 3, name: "بطاطس مقلية ذهبية", price: 2000,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "بطاطس ذهبية مقرمشة مع البهارات الخاصة",
            recipe: [ { invId: 3, qty: 0.2 } ]
        },
        {
            id: 301, categoryId: 3, name: "عصير برتقال طبيعي", price: 2500,
            image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500",
            ingredients: "عصير برتقال طبيعي طازج 100%",
            recipe: []
        }
    ]
};

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify(DEFAULT_DATA.inventory));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_cashiers') || JSON.parse(localStorage.getItem('sys_cashiers')).length === 0) {
        localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    }
    if (!localStorage.getItem('sys_areas')) localStorage.setItem('sys_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* ==========================================
   3. المينيو العام وتجربة الزبون (index.html)
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
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const type = document.getElementById('orderTypeSelect').value;
    const area = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    const address = document.getElementById('custAddress') ? document.getElementById('custAddress').value.trim() : '';
    const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';

    if (!name || !phone) return alert("يرجى إدخال الاسم ورقم الهاتف");

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let deliveryFee = 0;
    if (type === 'delivery') {
        deliveryFee = (area.includes("القاهرة") || area.includes("قاهرة")) ? 0 : 3000;
    }

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
        totalAmount: subtotal + deliveryFee,
        status: 'جديد',
        timestamp: new Date().toISOString()
    };

    if (db) {
        db.collection("orders").add(orderData).then(() => {
            alert("تم إرسال طلبك بنجاح لمطعم MIM89 FAST FOOD!");
            cart = [];
            updateCartBadge();
            closeModal('cartModal');
        }).catch(err => {
            saveOrderLocally(orderData);
        });
    } else {
        saveOrderLocally(orderData);
    }
}

function saveOrderLocally(orderData) {
    const orders = getData('sys_live_orders');
    orders.push(orderData);
    setData('sys_live_orders', orders);
    alert("تم إرسال طلبك بنجاح لمطعم MIM89 FAST FOOD!");
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
   4. نقطة البيع بالرمز المباشر (cashier.html)
   ========================================== */
let activeCashierUser = null;
let posCart = [];
let selectedPosOrderType = 'dine_in';
let selectedPosPaymentMethod = 'cash';

function initCashierPage() {
    initData();
}

// الدخول التلقائي فور كتابة الرمز السري لشخص مسجل
function loginCashier() {
    const inputPass = document.getElementById('cashierPassInput').value.trim();
    const cashiers = getData('sys_cashiers');
    const user = cashiers.find(c => c.password === inputPass);

    if (user) {
        activeCashierUser = user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'block';
        document.getElementById('activeCashierName').innerText = "الكاشير الحالي: " + user.name;
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
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
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

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:20px;">لا توجد وجبات في هذا القسم</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="pos-product-card" onclick="addToPosCart(${item.id})">
            <img src="${item.image}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.85rem; color:#fff; margin:4px 0 2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.85rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
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
            <img src="${item.image}" class="pos-product-img" onerror="this.src='https://via.placeholder.com/120?text=MIM89'">
            <h4 style="font-size:0.85rem; color:#fff; margin:4px 0 2px 0; font-weight:700;">${item.name}</h4>
            <span style="font-size:0.85rem; color:var(--gold-primary); font-weight:bold;">${Number(item.price).toLocaleString()} د.ع</span>
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
        list.innerHTML = `<p style="text-align:center; color:#777; font-size:0.85rem; padding:15px;">انقر على الوجبة لإضافتها للفاتورة</p>`;
        totalEl.innerText = "0 د.ع";
        return;
    }

    let total = 0;
    list.innerHTML = posCart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; background:#1c1c20; padding:6px; border-radius:6px; font-size:0.85rem;">
                <div>
                    <strong style="color:var(--gold-primary);">${item.name}</strong><br>
                    <small style="color:#aaa;">${Number(item.price).toLocaleString()} × ${item.qty}</small>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button onclick="changePosCartQty(${item.id}, -1)" class="gold-btn" style="padding:1px 8px; font-size:0.8rem;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changePosCartQty(${item.id}, 1)" class="gold-btn" style="padding:1px 8px; font-size:0.8rem;">+</button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.innerText = Number(total).toLocaleString() + ' د.c';
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
        paymentMethod: selectedPosPaymentMethod === 'cash' ? '💵 كاش (نقداً)' : '💳 فيزا / ماستركارد',
        area: typeText,
        address: "-",
        notes: "-",
        items: posCart,
        subtotal: subtotal,
        deliveryFee: 0,
        totalAmount: subtotal
    };

    deductInventoryFromRecipe(directOrder.items);
    printReceipt(directOrder);
    clearPosCart();
    document.getElementById('posCustName').value = '';
}

function listenForIncomingOrders() {
    if (db) {
        db.collection("orders").where("status", "==", "جديد").onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    playNewOrderSound();
                }
            });
            renderLiveOrdersList();
        });
    } else {
        renderLiveOrdersList();
        setInterval(renderLiveOrdersList, 4000);
    }
}

function playNewOrderSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
}

function renderLiveOrdersList() {
    const container = document.getElementById('liveOrdersContainer');
    if (!container) return;

    if (db) {
        db.collection("orders").where("status", "==", "جديد").get().then(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const ord = doc.data();
                html += generateOrderCardHTML(ord, doc.id);
            });
            container.innerHTML = html || '<p style="color:#aaa;">لا توجد طلبات جارية حالياً</p>';
        });
    } else {
        const orders = getData('sys_live_orders');
        container.innerHTML = orders.map(ord => generateOrderCardHTML(ord, ord.id)).join('') || '<p style="color:#aaa;">لا توجد طلبات جارية حالياً</p>';
    }
}

function generateOrderCardHTML(ord, docId) {
    return `
        <div style="background:#222228; border:1px solid var(--gold-primary); padding:12px; margin-bottom:10px; border-radius:10px;">
            <div style="display:flex; justify-content:space-between; color:var(--gold-primary);">
                <strong>${ord.customerName} (${ord.phone})</strong>
                <span>${ord.orderType === 'delivery' ? '🚗 توصيل' : '🛍️ سفري'}</span>
            </div>
            <p style="font-size:0.85rem; color:#ccc; margin-top:4px;">${ord.area ? 'المنطقة: ' + ord.area : ''} ${ord.address}</p>
            <p style="font-size:0.85rem; color:#f59e0b;">ملاحظات: ${ord.notes || 'لا يوجد'}</p>
            <hr style="border-color:#333; margin:8px 0;">
            <ul style="padding-right:15px; font-size:0.9rem;">
                ${ord.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}
            </ul>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <strong style="color:var(--gold-bright);">المجموع: ${ord.totalAmount.toLocaleString()} د.ع</strong>
                <button class="gold-btn" onclick="fulfillAndPrintOrder('${docId}', '${ord.id}')">تجهيز وطباعة الفاتورة</button>
            </div>
        </div>
    `;
}

function fulfillAndPrintOrder(docId, orderId) {
    if (db) {
        db.collection("orders").doc(docId).get().then(doc => {
            const order = doc.data();
            deductInventoryFromRecipe(order.items);
            db.collection("orders").doc(docId).update({ status: 'تم التجهيز' });
            printReceipt(order);
            renderLiveOrdersList();
        });
    } else {
        let orders = getData('sys_live_orders');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            deductInventoryFromRecipe(order.items);
            orders = orders.filter(o => o.id !== orderId);
            setData('sys_live_orders', orders);
            printReceipt(order);
            renderLiveOrdersList();
        }
    }
}

function deductInventoryFromRecipe(items) {
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
    document.getElementById('receiptCashierName').innerText = "اسم الكاشير: " + (activeCashierUser ? activeCashierUser.name : "الرئيسي");
    document.getElementById('receiptCustInfo').innerText = `الزبون: ${order.customerName}`;
    document.getElementById('receiptPaymentInfo').innerText = `طريقة الدفع: ${order.paymentMethod || '💵 كاش'}`;
    document.getElementById('receiptTypeInfo').innerText = `نوع الخدمة: ${order.area || 'سفري'}`;
    
    document.getElementById('receiptItemsBody').innerHTML = order.items.map(i => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${i.name} (×${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()} د.ع</span>
        </div>
    `).join('');

    document.getElementById('receiptSubtotal').innerText = order.subtotal.toLocaleString() + ' د.ع';
    document.getElementById('receiptDeliveryFee').innerText = (order.deliveryFee || 0).toLocaleString() + ' د.ع';
    document.getElementById('receiptGrandTotal').innerText = order.totalAmount.toLocaleString() + ' د.ع';

    openModal('receiptModal');
}

/* ==========================================
   5. إدارة المخزن والإدارة العامة
   ========================================== */
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
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function loadAdminTabsData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminCashiers();
    renderAdminAreas();
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
                <td><img src="${item.image}" width="40" height="40" style="object-fit:cover; border-radius:4px;"></td>
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
    const name = document.getElementById('itemName').value;
    const price = Number(document.getElementById('itemPrice').value);
    const categoryId = Number(document.getElementById('itemCategory').value);
    const image = document.getElementById('itemImage').value || 'https://via.placeholder.com/300';
    const ingredients = document.getElementById('itemIngredients').value;

    if (!name || !price) return alert("أدخل الاسم والسعر");

    let items = getData('sys_items');
    if (id) {
        items = items.map(i => i.id == id ? { ...i, name, price, categoryId, image, ingredients } : i);
    } else {
        items.push({ id: Date.now(), name, price, categoryId, image, ingredients, recipe: [] });
    }

    setData('sys_items', items);
    resetItemForm();
    renderAdminItems();
}

function editItem(id) {
    const item = getData('sys_items').find(i => i.id === id);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.categoryId;
    document.getElementById('itemImage').value = item.image;
    document.getElementById('itemIngredients').value = item.ingredients;
    document.getElementById('itemFormTitle').innerText = "تعديل: " + item.name;
}

function resetItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemImage').value = '';
    document.getElementById('itemIngredients').value = '';
    document.getElementById('itemFormTitle').innerText = "إضافة / تعديل صنف للمينيو";
}

function deleteItem(id) {
    if (confirm("حذف الصنف؟")) {
        let items = getData('sys_items').filter(i => i.id !== id);
        setData('sys_items', items);
        renderAdminItems();
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

/* الأدوات العامة */
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

// البدء عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
