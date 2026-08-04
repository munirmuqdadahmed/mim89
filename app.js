/* ==========================================
   MIM89 FAST FOOD - Core Engine & Data Link
   ========================================== */

// 1. إعدادات Firebase (قم باستبدالها ببيانات مشروعك في Firebase)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "mim89-fastfood.firebaseapp.com",
    projectId: "mim89-fastfood",
    storageBucket: "mim89-fastfood.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// تهيئة الفايربيس إن وجد
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

/* ==========================================
   2. البيانات الافتراضية للسيستم
   ========================================== */
const DEFAULT_DATA = {
    passwords: { admin: "admin123", inventory: "inv123" },
    cashiers: [
        { id: "c1", name: "كاشير الصالة", password: "123" },
        { id: "c2", name: "كاشير السفري والتوصيل", password: "456" }
    ],
    categories: [
        { id: 1, name: "وجبات الدجاج الشاورما" },
        { id: 2, name: "الوجبات المقرمشة" },
        { id: 3, name: "المقبلات والمشروبات" }
    ],
    // أسعار التوصيل للمناطق
    deliveryAreas: [
        { name: "القاهرة", price: 0 },
        { name: "البنوك", price: 2000 },
        { name: "الأعظمية", price: 3000 },
        { name: "الشعب", price: 2500 }
    ],
    // المواد الخام في المخزن
    inventory: [
        { id: 1, name: "صدور دجاج طازجة", quantity: 100, unit: "كغم" },
        { id: 2, name: "خبز صاج", quantity: 200, unit: "قطع" },
        { id: 3, name: "بطاطس جافة", quantity: 150, unit: "كغم" },
        { id: 4, name: "صلصة ثومية", quantity: 30, unit: "علبة" },
        { id: 5, name: "علب مشروبات غازية", quantity: 300, unit: "علبة" }
    ],
    // الأصناف ومكوناتها الوصفية للمخزن (Recipe)
    items: [
        {
            id: 101, categoryId: 1, name: "شاورما دجاج صاج كلاسيك", price: 4000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "خبز صاج، دجاج شاورما، صلصة ثومية، مخلل، بطاطس",
            recipe: [ { invId: 1, qty: 0.15 }, { invId: 2, qty: 1 }, { invId: 4, qty: 0.05 } ] // يسحب 150غم دجاج وخبزة صاج
        },
        {
            id: 102, categoryId: 2, name: "وجبة دجاج مقرمش (كريسبي)", price: 6500,
            image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500",
            ingredients: "4 قطع دجاج مقرمش، بطاطس، ثومية، خبز",
            recipe: [ { invId: 1, qty: 0.25 }, { invId: 3, qty: 0.15 }, { invId: 4, qty: 0.1 } ]
        },
        {
            id: 201, categoryId: 3, name: "بطاطس مقلية ذهبية", price: 2000,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "بطاطس مبهرة طازجة",
            recipe: [ { invId: 3, qty: 0.2 } ]
        },
        {
            id: 301, categoryId: 3, name: "عصير برتقال طبيعي", price: 2500,
            image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500",
            ingredients: "عصير برتقال طازج 100%",
            recipe: []
        }
    ]
};

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify(DEFAULT_DATA.inventory));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_cashiers')) localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
    if (!localStorage.getItem('sys_areas')) localStorage.setItem('sys_areas', JSON.stringify(DEFAULT_DATA.deliveryAreas));
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* ==========================================
   3. المينيو العام والسلة (index.html)
   ========================================== */
let cart = [];

function loadPublicMenu() {
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const navContainer = document.getElementById('categoriesNav');
    const sectionsContainer = document.getElementById('menuSections');
    const moreCatsList = document.getElementById('moreCategoriesList');

    if (!navContainer || !sectionsContainer) return;
    navContainer.innerHTML = ''; sectionsContainer.innerHTML = '';
    if(moreCatsList) moreCatsList.innerHTML = '';

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

        if(moreCatsList) {
            moreCatsList.innerHTML += `<button class="gold-btn" onclick="closeModal('moreModal'); filterCategory(${cat.id}, null);">${cat.name}</button>`;
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
    if(btnElement) {
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

    const filtered = items.filter(i => i.name.toLowerCase().includes(q) || i.ingredients.toLowerCase().includes(q));
    
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

/* إدارة السلة وحساب المناطق */
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
        <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#222; padding:8px 12px; border-radius:8px;">
            <div>
                <strong style="color:#d4af37;">${item.name}</strong><br>
                <small style="color:#aaa;">${Number(item.price).toLocaleString()} د.ع</small>
            </div>
            <div class="qty-controls" style="display:flex; gap:8px; align-items:center;">
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
        group.style.display = 'block';
        feeLine.style.display = 'flex';
    } else {
        group.style.display = 'none';
        feeLine.style.display = 'none';
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
            deliveryFee = 0; // القاهرة توصيل مجاني
        } else if (areaInput !== "") {
            const areas = getData('sys_areas');
            const found = areas.find(a => areaInput.includes(a.name));
            deliveryFee = found ? found.price : 4000; // السعر الافتراضي للمناطق الأبعد
        } else {
            deliveryFee = 3000; // تقديري
        }
    }

    const subtotalEl = document.getElementById('subtotalPrice');
    const feeEl = document.getElementById('deliveryFeePrice');
    const totalEl = document.getElementById('finalTotalPrice');

    if(subtotalEl) subtotalEl.innerText = subtotal.toLocaleString() + ' د.ع';
    if(feeEl) feeEl.innerText = deliveryFee === 0 ? "مجاني 🎉" : deliveryFee.toLocaleString() + ' د.ع';
    if(totalEl) totalEl.innerText = (subtotal + deliveryFee).toLocaleString() + ' د.ع';
}

function submitOrderToCashier() {
    if (cart.length === 0) return alert("السلة فارغة!");
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const type = document.getElementById('orderTypeSelect').value;
    const area = document.getElementById('custArea').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();

    if (!name || !phone) return alert("يرجى كتابة الاسم ورقم الهاتف على الأقل");

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

    // إرسال عبر Firebase إن كان مفعلاً أو حفظ محلي
    if (db) {
        db.collection("orders").add(orderData).then(() => {
            alert("تم إرسال طلبك بنجاح لمطعم MIM89 FAST FOOD! جاري التجهيز...");
            cart = [];
            updateCartBadge();
            closeModal('cartModal');
        }).catch(err => {
            console.error("Firebase error, fallback to local:", err);
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
    alert("تم إرسال طلبك بنجاح! جاري التجهيز...");
    cart = [];
    updateCartBadge();
    closeModal('cartModal');
}

function sendRestaurantFeedback() {
    const msg = document.getElementById('feedbackMsg').value;
    if(!msg) return alert("اكتب ملاحظتك أولاً");
    alert("شكراً لك! تم إرسال ملاحظتك لإدارة المطعم مباشرة.");
    document.getElementById('feedbackMsg').value = '';
    closeModal('moreModal');
}

/* ==========================================
   4. نقطة البيع واستقبال الطلبات (cashier.html)
   ========================================== */
let currentCashier = null;

function initCashierPage() {
    initData();
    const cashiers = getData('sys_cashiers');
    const select = document.getElementById('cashierSelect');
    if (select) {
        select.innerHTML = cashiers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

function loginCashier() {
    const cashiers = getData('sys_cashiers');
    const selectedId = document.getElementById('cashierSelect').value;
    const pass = document.getElementById('cashierPassInput').value;
    const user = cashiers.find(c => c.id === selectedId && c.password === pass);

    if (user) {
        currentCashier = user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'flex';
        document.getElementById('activeCashierName').innerText = "الكاشير: " + user.name;
        listenForIncomingOrders();
        loadCashierPosMenu();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function listenForIncomingOrders() {
    if (db) {
        db.collection("orders").where("status", "==", "جديد").onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    playNewOrderSound();
                    renderLiveOrdersList();
                }
            });
        });
    } else {
        setInterval(renderLiveOrdersList, 5000); // الفحص المحلي
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
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
}

function renderLiveOrdersList() {
    const container = document.getElementById('liveOrdersContainer');
    if (!container) return;

    if (db) {
        db.collection("orders").get().then(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const ord = doc.data();
                html += generateOrderCardHTML(ord, doc.id);
            });
            container.innerHTML = html || '<p>لا توجد طلبات جارية</p>';
        });
    } else {
        const orders = getData('sys_live_orders');
        container.innerHTML = orders.map(ord => generateOrderCardHTML(ord, ord.id)).join('') || '<p>لا توجد طلبات جارية</p>';
    }
}

function generateOrderCardHTML(ord, docId) {
    return `
        <div class="order-live-card" style="background:#222; border:1px solid #d4af37; padding:12px; margin-bottom:10px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; color:#d4af37;">
                <strong>${ord.customerName} (${ord.phone})</strong>
                <span>${ord.orderType === 'delivery' ? '🚗 توصيل' : '🛍️ سفري'}</span>
            </div>
            <p style="font-size:0.85rem; color:#ccc;">${ord.area ? 'المنطقة: ' + ord.area : ''} ${ord.address}</p>
            <p style="font-size:0.85rem; color:#f4a261;">ملاحظات: ${ord.notes || 'لا يوجد'}</p>
            <hr style="border-color:#333; margin:6px 0;">
            <ul style="padding-right:15px; font-size:0.9rem;">
                ${ord.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}
            </ul>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <strong style="color:#2a9d8f;">المجموع: ${ord.totalAmount.toLocaleString()} د.ع</strong>
                <button class="gold-btn" onclick="fulfillAndPrintOrder('${docId}', '${ord.id}')">تجهيز وطباعة الفاتورة</button>
            </div>
        </div>
    `;
}

function fulfillAndPrintOrder(docId, orderId) {
    let order = null;
    
    // إحضار تفاصيل الطلب وخصم المخزن بالتفصيل
    if (db) {
        db.collection("orders").doc(docId).get().then(doc => {
            order = doc.data();
            deductInventoryFromRecipe(order.items);
            db.collection("orders").doc(docId).update({ status: 'تم التجهيز' });
            printReceipt(order);
        });
    } else {
        let orders = getData('sys_live_orders');
        order = orders.find(o => o.id === orderId);
        if (order) {
            deductInventoryFromRecipe(order.items);
            orders = orders.filter(o => o.id !== orderId);
            setData('sys_live_orders', orders);
            printReceipt(order);
        }
    }
}

/* الخصم الدقيق من المخزن بناءً على المكونات (Recipe) */
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
    document.getElementById('receiptCashierName').innerText = "اسم الكاشير: " + currentCashier.name;
    document.getElementById('receiptCustInfo').innerText = `الزبون: ${order.customerName} | الهاتف: ${order.phone}`;
    document.getElementById('receiptTypeInfo').innerText = `نوع الطلب: ${order.orderType === 'delivery' ? 'توصيل منزلي' : 'استلام من المطعم'} | العنوان: ${order.area || ''} - ${order.address || ''}`;
    
    document.getElementById('receiptItemsBody').innerHTML = order.items.map(i => `
        <div style="display:flex; justify-between; margin-bottom:4px;">
            <span>${i.name} (×${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()} د.ع</span>
        </div>
    `).join('');

    document.getElementById('receiptSubtotal').innerText = order.subtotal.toLocaleString() + ' د.ع';
    document.getElementById('receiptDeliveryFee').innerText = order.deliveryFee.toLocaleString() + ' د.ع';
    document.getElementById('receiptGrandTotal').innerText = order.totalAmount.toLocaleString() + ' د.ع';

    openModal('receiptModal');
}

/* ==========================================
   5. لوحة الإدارة والمخزن (admin.html & inventory.html)
   ========================================== */
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

function loadAdminTabsData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminCashiers();
    renderAdminInventory();
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
    if(!name) return alert("أدخل اسم المنطقة");

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

// دالة فتح/إغلاق النوافذ المساعدة
function openModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// البدء التلقائي عند فتح أي صفحة
document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
