/* ==========================================
   نظام نقطة البيع والبيع المباشر (cashier.html)
   ========================================== */
let activeCashierUser = null;
let posCart = [];

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
        activeCashierUser = user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'block';
        document.getElementById('activeCashierName').innerText = "الكاشير الحالي: " + user.name;
        
        loadPosDirectMenu('all');
        listenForIncomingOrders();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function logoutCashier() { location.reload(); }

function switchCashierTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

/* تحميل المينيو المباشر للكاشير مع الصور والأسعار */
function loadPosDirectMenu(catId = 'all') {
    initData(); // التأكد من تحميل البيانات الافتراضية
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const catBar = document.getElementById('posCategoriesBar');
    const grid = document.getElementById('posProductsGrid');

    if (!catBar || !grid) return;

    // شريط الأقسام
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
            <h4 style="font-size:0.85rem; color:#fff; margin:5px 0 2px 0;">${item.name}</h4>
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
            <h4 style="font-size:0.85rem; color:#fff; margin:5px 0 2px 0;">${item.name}</h4>
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

    totalEl.innerText = Number(total).toLocaleString() + ' د.ع';
}

function processPosDirectCheckout() {
    if (posCart.length === 0) return alert("اختر وجبات أولاً للفاتورة!");
    
    const type = document.getElementById('posOrderType').value;
    const payment = document.getElementById('posPaymentMethod').value;
    const custName = document.getElementById('posCustName').value.trim() || "زبون مباشر";
    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const directOrder = {
        id: 'POS_' + Date.now(),
        customerName: custName,
        phone: "-",
        orderType: type,
        paymentMethod: payment === 'cash' ? '💵 كاش (نقداً)' : '💳 فيزا / ماستركارد',
        area: type === 'dine_in' ? 'تناول داخل المطعم' : (type === 'delivery' ? 'توصيل' : 'سفري'),
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
