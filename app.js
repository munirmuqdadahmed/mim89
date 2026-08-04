/* ==========================================
   1. تهيئة البيانات الأساسية في LocalStorage
   ========================================== */

const DEFAULT_DATA = {
    passwords: {
        admin: "admin123",
        inventory: "inv123"
    },
    cashiers: [
        { id: "c1", name: "الكاشير 1", password: "123" }
    ],
    categories: [
        { id: 1, name: "الوجبات الرئيسية" },
        { id: 2, name: "المقبلات والإضافات" },
        { id: 3, name: "المشروبات" }
    ],
    items: [
        { id: 101, categoryId: 1, name: "شاورما دجاج مميزة", price: 5000, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500", ingredients: "خبز صاج، شرائح دجاج طازجة، صلصة ثومية، مخلل، بطاطس" },
        { id: 102, categoryId: 1, name: "وجبة دجاج مقرمش", price: 6500, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500", ingredients: "قطع دجاج مقرمشة، بطاطس، صلصة ثوم، خبز طازج" },
        { id: 201, categoryId: 2, name: "بطاطس مقلية", price: 2000, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", ingredients: "بطاطس ذهبية مقرمشة مع البهارات الخاصة" },
        { id: 301, categoryId: 3, name: "عصير برتقال طبيعي", price: 2500, image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500", ingredients: "عصير برتقال طبيعي طازج 100%" }
    ],
    inventory: [
        { id: 1, name: "صدور دجاج", quantity: 50, unit: "كغم" },
        { id: 2, name: "خبز صاج", quantity: 30, unit: "ربطة" },
        { id: 3, name: "بطاطس", quantity: 40, unit: "كغم" }
    ]
};

function initData() {
    if (!localStorage.getItem('sys_categories')) localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    if (!localStorage.getItem('sys_items')) localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
    if (!localStorage.getItem('sys_inventory')) localStorage.setItem('sys_inventory', JSON.stringify(DEFAULT_DATA.inventory));
    if (!localStorage.getItem('sys_passwords')) localStorage.setItem('sys_passwords', JSON.stringify(DEFAULT_DATA.passwords));
    if (!localStorage.getItem('sys_cashiers')) localStorage.setItem('sys_cashiers', JSON.stringify(DEFAULT_DATA.cashiers));
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* ==========================================
   2. المينيو العام (index.html)
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
                <h2 class="section-title">${cat.name}</h2>
                <div class="items-grid">
                    ${catItems.map(item => `
                        <div class="item-card" onclick="openModal(${item.id})">
                            <img src="${item.image}" alt="${item.name}" class="item-img" onerror="this.src='https://via.placeholder.com/300x200?text=لا+توجد+صورة'">
                            <div class="item-details">
                                <h3 class="item-name">${item.name}</h3>
                                <p class="item-desc">${item.ingredients || 'بدون تفاصيل'}</p>
                                <div class="item-footer">
                                    <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
                                    <button class="view-btn">التفاصيل</button>
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
    document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    document.querySelectorAll('.menu-section').forEach(sec => {
        sec.style.display = (catId === 'all' || sec.getAttribute('data-category') == catId) ? 'block' : 'none';
    });
}

function openModal(itemId) {
    const item = getData('sys_items').find(i => Number(i.id) === Number(itemId));
    if (!item) return;
    document.getElementById('modalImage').src = item.image;
    document.getElementById('modalTitle').innerText = item.name;
    document.getElementById('modalPrice').innerText = Number(item.price).toLocaleString() + ' د.ع';
    document.getElementById('modalIngredients').innerText = item.ingredients || 'لا توجد تفاصيل إضافية';
    document.getElementById('itemModal').style.display = 'flex';
}

function closeModal(modalId = 'itemModal') {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

/* ==========================================
   3. نظام نقطة البيع (cashier.html)
   ========================================== */
let cart = [];
let activeCashier = null;

function initCashierPage() {
    initData();
    const cashiers = getData('sys_cashiers');
    const select = document.getElementById('cashierSelect');
    if (!select) return;
    select.innerHTML = cashiers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function loginCashier() {
    const cashiers = getData('sys_cashiers');
    const selectedId = document.getElementById('cashierSelect').value;
    const pass = document.getElementById('cashierPassInput').value;
    const user = cashiers.find(c => c.id === selectedId && c.password === pass);

    if (user) {
        activeCashier = user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('cashierMainApp').style.display = 'flex';
        document.getElementById('activeCashierName').innerText = `الكاشير: ${user.name}`;
        loadCashierProducts();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function logoutCashier() {
    location.reload();
}

function loadCashierProducts(catId = 'all') {
    const categories = getData('sys_categories');
    const items = getData('sys_items');
    const nav = document.getElementById('cashierCatNav');
    const grid = document.getElementById('cashierProductsGrid');

    nav.innerHTML = `<button class="category-tab ${catId === 'all' ? 'active' : ''}" onclick="loadCashierProducts('all')">الكل</button>`;
    categories.forEach(c => {
        nav.innerHTML += `<button class="category-tab ${catId == c.id ? 'active' : ''}" onclick="loadCashierProducts(${c.id})">${c.name}</button>`;
    });

    const filtered = catId === 'all' ? items : items.filter(i => i.categoryId == catId);
    grid.innerHTML = filtered.map(item => `
        <div class="item-card" onclick="addToCart(${item.id})">
            <img src="${item.image}" class="item-img" onerror="this.src='https://via.placeholder.com/150'">
            <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
            </div>
        </div>
    `).join('');
}

function filterCashierItems() {
    const query = document.getElementById('cashierSearch').value.toLowerCase();
    const items = getData('sys_items');
    const grid = document.getElementById('cashierProductsGrid');
    const filtered = items.filter(i => i.name.toLowerCase().includes(query));
    
    grid.innerHTML = filtered.map(item => `
        <div class="item-card" onclick="addToCart(${item.id})">
            <img src="${item.image}" class="item-img" onerror="this.src='https://via.placeholder.com/150'">
            <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <span class="item-price">${Number(item.price).toLocaleString()} د.ع</span>
            </div>
        </div>
    `).join('');
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
    renderCart();
}

function updateQty(itemId, change) {
    const exist = cart.find(c => c.id === itemId);
    if (exist) {
        exist.qty += change;
        if (exist.qty <= 0) {
            cart = cart.filter(c => c.id !== itemId);
        }
    }
    renderCart();
}

function clearCart() {
    cart = [];
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotal');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `<p class="empty-cart-msg">السلة فارغة حالياً</p>`;
        totalEl.innerText = "0 د.ع";
        return;
    }

    let total = 0;
    list.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${Number(item.price).toLocaleString()} × ${item.qty}</small>
                </div>
                <div class="qty-controls">
                    <button onclick="updateQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.innerText = Number(total).toLocaleString() + ' د.ع';
}

function processCheckout() {
    if (cart.length === 0) return alert("السلة فارغة!");
    
    let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    document.getElementById('receiptDate').innerText = "التاريخ: " + new Date().toLocaleString('ar-IQ');
    document.getElementById('receiptCashier').innerText = "الكاشير: " + activeCashier.name;
    document.getElementById('receiptTotal').innerText = Number(total).toLocaleString() + ' د.ع';

    const body = document.getElementById('receiptBody');
    body.innerHTML = cart.map(i => `
        <div style="display:flex; justify-between; margin-bottom: 5px;">
            <span>${i.name} (${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()} د.ع</span>
        </div>
    `).join('');

    document.getElementById('receiptModal').style.display = 'flex';
    clearCart();
}

/* ==========================================
   4. إدارة المخزن (inventory.html)
   ========================================== */
function initInventoryPage() {
    initData();
}

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

function logoutInventory() { location.reload(); }

function renderInventoryTable() {
    const inv = getData('sys_inventory');
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = inv.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><input type="text" value="${item.name}" onchange="updateInvField(${item.id}, 'name', this.value)" class="form-control"></td>
            <td><input type="number" value="${item.quantity}" onchange="updateInvField(${item.id}, 'quantity', this.value)" class="form-control"></td>
            <td><input type="text" value="${item.unit}" onchange="updateInvField(${item.id}, 'unit', this.value)" class="form-control"></td>
            <td><button onclick="deleteInvItem(${item.id})" class="btn-sm btn-danger">حذف</button></td>
        </tr>
    `).join('');
}

function addNewInventoryItem() {
    const name = document.getElementById('newInvName').value;
    const qty = Number(document.getElementById('newInvQty').value);
    const unit = document.getElementById('newInvUnit').value;

    if (!name || !qty) return alert("يرجى كتابة الاسم والكمية");

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
    if (confirm("هل أنت تأكد من الحذف؟")) {
        let inv = getData('sys_inventory');
        inv = inv.filter(i => i.id !== id);
        setData('sys_inventory', inv);
        renderInventoryTable();
    }
}

/* ==========================================
   5. الإدارة المركزية (admin.html)
   ========================================== */
function initAdminPage() {
    initData();
}

function loginAdmin() {
    const pass = document.getElementById('adminPassInput').value;
    const sysPasses = getData('sys_passwords');

    if (pass === sysPasses.admin) {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMainApp').style.display = 'block';
        loadAdminData();
    } else {
        document.getElementById('authError').innerText = "كلمة المرور غير صحيحة!";
    }
}

function logoutAdmin() { location.reload(); }

function switchAdminTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function loadAdminData() {
    renderAdminCategories();
    renderAdminItems();
    renderAdminCashiers();
    renderAdminInventory();
}

// إدارة الأصناف
function renderAdminItems() {
    const items = getData('sys_items');
    const categories = getData('sys_categories');
    const tbody = document.getElementById('adminItemsTable');
    const select = document.getElementById('itemCategory');

    select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    tbody.innerHTML = items.map(item => {
        const cat = categories.find(c => c.id == item.categoryId);
        return `
            <tr>
                <td><img src="${item.image}" width="50" height="40" style="object-fit:cover; border-radius:4px;"></td>
                <td>${item.name}</td>
                <td>${cat ? cat.name : 'غير محدد'}</td>
                <td>${Number(item.price).toLocaleString()} د.ع</td>
                <td><small>${item.ingredients || '-'}</small></td>
                <td>
                    <button onclick="editItem(${item.id})" class="btn-sm btn-primary">تعديل</button>
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

    if (!name || !price) return alert("يرجى ملء الاسم والسعر");

    let items = getData('sys_items');

    if (id) {
        items = items.map(i => i.id == id ? { id: Number(id), name, price, categoryId, image, ingredients } : i);
    } else {
        items.push({ id: Date.now(), name, price, categoryId, image, ingredients });
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
    document.getElementById('itemFormTitle').innerText = "تعديل صنف: " + item.name;
}

function resetItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemImage').value = '';
    document.getElementById('itemIngredients').value = '';
    document.getElementById('itemFormTitle').innerText = "إضافة صنف جديد للمينيو";
}

function deleteItem(id) {
    if (confirm("تأكيد حذف الصنف؟")) {
        let items = getData('sys_items').filter(i => i.id !== id);
        setData('sys_items', items);
        renderAdminItems();
    }
}

// إدارة الأقسام
function renderAdminCategories() {
    const categories = getData('sys_categories');
    const tbody = document.getElementById('adminCategoriesTable');

    tbody.innerHTML = categories.map((cat, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${cat.name}</td>
            <td>
                <button onclick="editCategory(${cat.id}, '${cat.name}')" class="btn-sm btn-primary">تعديل</button>
                <button onclick="deleteCategory(${cat.id})" class="btn-sm btn-danger">حذف</button>
            </td>
        </tr>
    `).join('');
}

function saveCategory() {
    const id = document.getElementById('editCatId').value;
    const name = document.getElementById('catNameInput').value;
    if (!name) return alert("أدخل اسم القسم");

    let categories = getData('sys_categories');
    if (id) {
        categories = categories.map(c => c.id == id ? { ...c, name } : c);
    } else {
        categories.push({ id: Date.now(), name });
    }

    setData('sys_categories', categories);
    document.getElementById('editCatId').value = '';
    document.getElementById('catNameInput').value = '';
    renderAdminCategories();
    renderAdminItems();
}

function editCategory(id, name) {
    document.getElementById('editCatId').value = id;
    document.getElementById('catNameInput').value = name;
}

function deleteCategory(id) {
    if (confirm("عند حذف القسم سيتم الاحتفاظ بالأصناف الحالية بدون قسم. هل تريد الاستمرار؟")) {
        let categories = getData('sys_categories').filter(c => c.id !== id);
        setData('sys_categories', categories);
        renderAdminCategories();
    }
}

// إدارة الكاشيرية
function renderAdminCashiers() {
    const cashiers = getData('sys_cashiers');
    const tbody = document.getElementById('adminCashiersTable');

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
    if (!name || !pass) return alert("يرجى ملء الاسم وكلمة المرور");

    const cashiers = getData('sys_cashiers');
    cashiers.push({ id: 'c_' + Date.now(), name, password: pass });
    setData('sys_cashiers', cashiers);

    document.getElementById('cashierNameInput').value = '';
    document.getElementById('cashierPassNew').value = '';
    renderAdminCashiers();
}

function deleteCashier(id) {
    if (confirm("حذف هذا الكاشير؟")) {
        let cashiers = getData('sys_cashiers').filter(c => c.id !== id);
        setData('sys_cashiers', cashiers);
        renderAdminCashiers();
    }
}

// عرض وتحديث المخزن من الإدارة
function renderAdminInventory() {
    const inv = getData('sys_inventory');
    const tbody = document.getElementById('adminInventoryTable');
    if (!tbody) return;

    tbody.innerHTML = inv.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td><button onclick="deleteInvItem(${item.id}); renderAdminInventory();" class="btn-sm btn-danger">حذف</button></td>
        </tr>
    `).join('');
}

// تغيير كلمات سر النظام
function updateSystemPasswords() {
    const newAdmin = document.getElementById('newAdminPass').value;
    const newInv = document.getElementById('newInvPass').value;
    const passes = getData('sys_passwords');

    if (newAdmin) passes.admin = newAdmin;
    if (newInv) passes.inventory = newInv;

    setData('sys_passwords', passes);
    alert("تم تحديث كلمات السر بنجاح!");
    document.getElementById('newAdminPass').value = '';
    document.getElementById('newInvPass').value = '';
}

// البدء عند تحميل أي صفحة
document.addEventListener('DOMContentLoaded', () => {
    initData();
    if (document.body.classList.contains('public-menu-body')) {
        loadPublicMenu();
    }
});
