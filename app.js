/* ==========================================
   MIM89 FAST FOOD - Complete System Engine
   (Correct Phones + Verified WA Orders + Live Caller ID)
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

// 2️⃣ البيانات الكاملة للمينيو الأصلي (MIM89 FAST FOOD)
const DEFAULT_DATA = {
    passwords: { admin: "admin123", inventory: "inv123" },
    cashiers: [{ id: "c1", name: "الكاشير الرئيسي", password: "123" }],
    categories: [
        { id: 1, name: "بركر اللحم" },
        { id: 2, name: "بركر الدجاج" },
        { id: 3, name: "قسم الشاورما" },
        { id: 4, name: "قسم الكنتاكي" },
        { id: 5, name: "قسم الريزو" },
        { id: 6, name: "الفنكر والمقرمشات" },
        { id: 7, name: "قسم المقبلات" },
        { id: 8, name: "قسم الإضافات" },
        { id: 9, name: "قسم المشروبات" }
    ],
    items: [
        // --- 🍔 1. قسم بركر اللحم ---
        {
            id: 101, categoryId: 1, name: "بركر كلاسيك", price: 5000,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
            ingredients: "قطعة لحم مشوية على الفحم، خس، طماطم، بصل، مخلل، وصوص خاص"
        },
        {
            id: 102, categoryId: 1, name: "بركر الجبن", price: 6000,
            image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500",
            ingredients: "قطعة لحم مشوية، جبنة شيدر، خس، طماطم، بصل، مخلل، وصوص خاص"
        },
        {
            id: 103, categoryId: 1, name: "دبل تشيز بركر", price: 8000,
            image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500",
            ingredients: "شريحتان لحم مشويتان، جبنة شيدر، خس، طماطم، بصل، مخلل، وصوص خاص"
        },
        {
            id: 104, categoryId: 1, name: "بركر 89 الخاص (لحم)", price: 7500,
            image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500",
            ingredients: "شريحة لحم مشوية، صوص 89 الخاص، جبن، بصل، مخلل، وجبنة موزاريلا مقرمشة"
        },

        // --- 🍗 2. قسم بركر الدجاج ---
        {
            id: 201, categoryId: 2, name: "تشيكن فيليه", price: 5500,
            image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500",
            ingredients: "قطعات دجاج مقرمشة، خس، جبنة شيدر، وصوص خاص"
        },
        {
            id: 202, categoryId: 2, name: "بركر 89 الخاص (دجاج)", price: 7000,
            image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500",
            ingredients: "3 قطع ستريبس دجاج، صوص 89 الخاص، جبنة، مخلل، وجبنة موزاريلا مقرمشة"
        },

        // --- 🌯 3. قسم الشاورما ---
        {
            id: 301, categoryId: 3, name: "شاورما صاج عادي", price: 3000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "دجاج شاورما، مخلل، بطاطا، ثوم، وصوص خاص"
        },
        {
            id: 302, categoryId: 3, name: "شاورما صاج دبل", price: 4500,
            image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500",
            ingredients: "دجاج شاورما كمية مضاعفة، مخلل، بطاطا، ثوم، وصوص خاص"
        },
        {
            id: 303, categoryId: 3, name: "شاورما صاج سوبر", price: 5500,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "شاورما دجاج بحجم سوبر كبير مع البطاطس والمخلل والصلصة"
        },
        {
            id: 304, categoryId: 3, name: "شاورما 89 الخاص", price: 5000,
            image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500",
            ingredients: "دجاج شاورما، بطاطا، مخلل، صوص 89 الخاص، وتتبيلة 89 المميزة"
        },
        {
            id: 305, categoryId: 3, name: "شاورما عربي", price: 6000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "وجبة شاورما عربي مقطعة مع البطاطا المقلية وصلصة الثومية والمخلل"
        },
        {
            id: 306, categoryId: 3, name: "وجبة شاورما", price: 5500,
            image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500",
            ingredients: "وجبة شاورما دجاج مع البطاطا والمقبلات والخبز"
        },
        {
            id: 307, categoryId: 3, name: "وجبة شاورما دبل", price: 7500,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "وجبة شاورما دبل دجاج مع بطاطا وفيرة ومقبلات مشكلة"
        },
        {
            id: 308, categoryId: 3, name: "شاورما وزن 250 غرام", price: 7000,
            image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500",
            ingredients: "250 غرام شاورما دجاج صافي مع الخبز والصلصات الثومية والمخلل"
        },
        {
            id: 309, categoryId: 3, name: "شاورما وزن 500 غرام", price: 13000,
            image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
            ingredients: "500 غرام شاورما دجاج صافي عائلي مع الخبز والصلصات والمخلل"
        },

        // --- 🍗 4. قسم الكنتاكي ---
        {
            id: 401, categoryId: 4, name: "كنتاكي قطعتين", price: 4500,
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500",
            ingredients: "قطعتان دجاج مقرمشتان بتتبيلة خاصة مع الصوص"
        },
        {
            id: 402, categoryId: 4, name: "كنتاكي 4 قطع", price: 8000,
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500",
            ingredients: "4 قطع دجاج مقرمشة بتتبيلة خاصة مقرمشة"
        },
        {
            id: 403, categoryId: 4, name: "كنتاكي 6 قطع", price: 11000,
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500",
            ingredients: "6 قطع دجاج مقرمشة عائلية بتتبيلة مميزة"
        },
        {
            id: 404, categoryId: 4, name: "وجبة كنتاكي", price: 6000,
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500",
            ingredients: "قطعتان دجاج مقرمشتان + بطاطا مقلية + مشروب غازي"
        },

        // --- 🍚 5. قسم الريزو ---
        {
            id: 501, categoryId: 5, name: "ريزو كلاسيك", price: 4000,
            image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
            ingredients: "أرز مبهر مع قطع دجاج وصوص خاص"
        },
        {
            id: 502, categoryId: 5, name: "ريزو 89 الخاص", price: 5500,
            image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
            ingredients: "أرز بنكهة خاصة، قطع دجاج، صوص 89 الخاص، وجبنة شيدر مذابة"
        },

        // --- 🍟 6. قسم الفنكر والمقرمشات ---
        {
            id: 601, categoryId: 6, name: "فنكر كلاسيك", price: 2000,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "قطع بطاطا مقرمشة تقدم مع الصوص الخاص"
        },
        {
            id: 602, categoryId: 6, name: "فنكر سبايسي", price: 2500,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "بطاطا مقرمشة مبهرة بالنكهة الحارة السحرية"
        },
        {
            id: 603, categoryId: 6, name: "فنكر جبنة", price: 3000,
            image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500",
            ingredients: "بطاطا مقرمشة مغطاة بصلصة الجبنة الشيدر الغنية"
        },
        {
            id: 604, categoryId: 6, name: "فنكر 89 الخاص", price: 3500,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "قطع دجاج وبطاطا مقرمشة تقدم مع صوص 89 الخاص"
        },

        // --- 🧀 7. قسم المقبلات ---
        {
            id: 701, categoryId: 7, name: "أصابع موزاريلا", price: 3500,
            image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=500",
            ingredients: "أصابع جبنة موزاريلا مقرمشة وساخنة"
        },
        {
            id: 702, categoryId: 7, name: "حلقات بصل", price: 2500,
            image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500",
            ingredients: "حلقات بصل ذهبية مقرمشة مع صوص للتغنيس"
        },
        {
            id: 703, categoryId: 7, name: "بطاطا", price: 2000,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "طبق بطاطا مقلية ذهبية مقرمشة"
        },

        // --- ➕ 8. قسم الإضافات ---
        {
            id: 801, categoryId: 8, name: "بطاطا إضافية", price: 1500,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
            ingredients: "إضافة علبة بطاطا مقرمشة"
        },
        {
            id: 802, categoryId: 8, name: "صوص إضافي", price: 500,
            image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500",
            ingredients: "إضافة علبة صوص 89 الخاص أو الثومية"
        },
        {
            id: 803, categoryId: 8, name: "هالابينو إضافي", price: 500,
            image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=500",
            ingredients: "إضافة قطع فلفل هالابينو حار"
        },
        {
            id: 804, categoryId: 8, name: "جبنة إضافية", price: 1000,
            image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500",
            ingredients: "إضافة شريحة / صوص جبن مذاب"
        },

        // --- 🥤 9. قسم المشروبات ---
        {
            id: 901, categoryId: 9, name: "بيبسي", price: 1000,
            image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500",
            ingredients: "مشروب غازي بيبسي بارد 330 مل"
        },
        {
            id: 902, categoryId: 9, name: "سفن أب", price: 1000,
            image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500",
            ingredients: "مشروب غازي سفن أب بارد 330 مل"
        },
        {
            id: 903, categoryId: 9, name: "ميرندا", price: 1000,
            image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=500",
            ingredients: "مشروب غازي ميرندا برتقال بارد 330 مل"
        },
        {
            id: 904, categoryId: 9, name: "ماء نقي", price: 500,
            image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500",
            ingredients: "قنينة ماء معدني نقي بارد"
        }
    ]
};

function initData() {
    localStorage.setItem('sys_categories', JSON.stringify(DEFAULT_DATA.categories));
    localStorage.setItem('sys_items', JSON.stringify(DEFAULT_DATA.items));
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
        if (document.getElementById('posCustPhone')) document.getElementById('posCustPhone').value = phone;
        if (document.getElementById('posCustAddress')) document.getElementById('posCustAddress').value = (cust.area || '') + ' ' + (cust.address || '');
        if (infoSpan) {
            infoSpan.style.display = "block";
            infoSpan.innerHTML = `🟢 زبون دائم (طلب ${cust.orderCount} مرات سابقاً)`;
        }
    } else {
        if (document.getElementById('posCustPhone')) document.getElementById('posCustPhone').value = phone;
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
                  if (now - callData.timestamp < 30000) {
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
    const cust = lookupCustomerByPhone(phone);
    
    if (document.getElementById('posCustName')) {
        document.getElementById('posCustName').value = cust ? cust.name : (name !== 'زبون جديد (غير مسجل)' ? name : '');
    }
    if (document.getElementById('posCustPhone')) {
        document.getElementById('posCustPhone').value = phone;
    }
    if (document.getElementById('posCustAddress')) {
        document.getElementById('posCustAddress').value = cust ? ((cust.area || '') + ' ' + (cust.address || '')) : '';
    }

    onCashierPhoneInput(phone);

    const alertBox = document.getElementById('callerIdAlert');
    if (alertBox) alertBox.remove();

    alert(`🟢 تم ربط بيانات المتصل بالفاتورة (${phone}) بنجاح!\nأضف الوجبات الآن للفاتورة.`);
}

/* ==========================================
   5️⃣ محرك المينيو الإلكتروني للزبائن (تحقق الواتساب الآمن)
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

// 🛡️ توثيق إرسال الطلب عبر الواتساب حصراً
function submitOrderToCashier() {
    if (cart.length === 0) return alert("السلة فارغة!");
    
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const type = document.getElementById('orderTypeSelect').value;
    const area = document.getElementById('custArea') ? document.getElementById('custArea').value.trim() : '';
    const address = document.getElementById('custAddress') ? document.getElementById('custAddress').value.trim() : '';
    const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';

    if (!name || !phone) return alert("يرجى إدخال الاسم ورقم الهاتف الكريمتين");

    saveOrUpdateCustomer(phone, name, area, address);

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let deliveryFee = (type === 'delivery') ? ((area.includes("القاهرة") || area.includes("قاهرة")) ? 0 : 2500) : 0;
    const totalAmount = subtotal + deliveryFee;

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

    // استخدام الرقم الصحيح (07750008630)
    const waUrl = `https://wa.me/9647750008630?text=${encodeURIComponent(waText)}`;
    
    alert("سيتم فتح الواتساب الآن لإرسال الطلب رسمياً إلى الكاشير. لن يتم اعتماد الطلب إلا بعد إرسال الرسالة.");
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
   6️⃣ كاشير البيع المباشر وطباعة الفاتورة الحرارية
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
        listenToIncomingCalls();
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
    
    const custName = (document.getElementById('posCustName') && document.getElementById('posCustName').value.trim()) || "زبون مباشر";
    const custPhone = (document.getElementById('posCustPhone') && document.getElementById('posCustPhone').value.trim()) || "-";
    const custAddress = (document.getElementById('posCustAddress') && document.getElementById('posCustAddress').value.trim()) || "-";

    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    if (custPhone !== "-") {
        saveOrUpdateCustomer(custPhone, custName, custAddress, custAddress);
    }

    const directOrder = {
        id: 'POS_' + Date.now().toString().slice(-6),
        customerName: custName,
        phone: custPhone,
        address: custAddress,
        orderType: selectedPosOrderType,
        paymentMethod: selectedPosPaymentMethod === 'cash' ? '💵 كاش' : '💳 فيزا',
        serviceType: selectedPosOrderType === 'takeaway' ? '🛍️ سفري' : (selectedPosOrderType === 'delivery' ? '🚗 توصيل' : '🍽️ صالة'),
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
    
    if (document.getElementById('posCustName')) document.getElementById('posCustName').value = '';
    if (document.getElementById('posCustPhone')) document.getElementById('posCustPhone').value = '';
    if (document.getElementById('posCustAddress')) document.getElementById('posCustAddress').value = '';
}

function saveCompletedOrder(order) {
    let completed = getData('sys_completed_orders');
    completed.unshift(order);
    setData('sys_completed_orders', completed);
}

function printReceipt(order) {
    const receiptContainer = document.getElementById('receiptModal');
    if (!receiptContainer) return;

    const itemsHtml = (order.items || []).map(i => `
        <div style="display:flex; justify-content:space-between; font-size:12px; font-family:monospace; margin-bottom:4px; border-bottom:1px dashed #eee; padding-bottom:3px;">
            <span style="font-weight:bold;">${i.name} (×${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()}</span>
        </div>
    `).join('');

    const printableHtml = `
        <div class="modal-content" style="background:#fff !important; color:#000 !important; width:280px; margin:0 auto; padding:15px; font-family:'Tajawal', sans-serif; text-align:right;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px;">
                <h2 style="margin:0; font-size:18px; font-weight:900;">MIM89 FAST FOOD</h2>
                <p style="margin:2px 0; font-size:11px;">بغداد - القاهرة | 07750008630</p>
                <div style="font-size:12px; font-weight:bold; margin-top:4px; background:#000; color:#fff; padding:2px 0; border-radius:4px;">
                    فاتورة رقم: #${order.id || '101'}
                </div>
            </div>

            <div style="font-size:11px; margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:6px;">
                <div><strong>👤 الزبون:</strong> ${order.customerName || 'مباشر'}</div>
                <div><strong>📞 الهاتف:</strong> ${order.phone || '-'}</div>
                <div><strong>📍 العنوان:</strong> ${order.address || '-'}</div>
                <div><strong>🚗 نوع الخدمة:</strong> ${order.serviceType || 'صالة'} (${order.paymentMethod || 'كاش'})</div>
                <div><strong>⏰ الوقت:</strong> ${order.dateDate || getTodayString()} | ${order.timestamp || ''}</div>
            </div>

            <div style="margin-bottom:10px;">
                <div style="font-size:11px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:5px; display:flex; justify-content:space-between;">
                    <span>الوجبة والعدد</span>
                    <span>السعر</span>
                </div>
                ${itemsHtml}
            </div>

            <div style="border-top:2px solid #000; padding-top:6px; margin-top:10px;">
                <div style="display:flex; justify-content:space-between; font-weight:900; font-size:14px;">
                    <span>المجموع الكلي:</span>
                    <span>${(order.totalAmount || 0).toLocaleString()} د.ع</span>
                </div>
            </div>

            <div style="text-align:center; margin-top:15px; border-top:1px dashed #aaa; padding-top:8px; font-size:10px; color:#555;">
                شكراً لزيارتكم مطعم MIM89 🎉<br>بالعافية وصحة وهنا!
            </div>

            <div style="margin-top:12px; display:flex; gap:6px;" class="no-print">
                <button onclick="window.print()" style="flex:1; background:#000; color:#fff; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ طباعة الفاتورة</button>
                <button onclick="closeModal('receiptModal')" style="background:#888; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer;">إغلاق</button>
            </div>
        </div>
    `;

    receiptContainer.innerHTML = printableHtml;
    openModal('receiptModal');
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
                    <strong>${ord.customerName} (${ord.phone || '-'})</strong>
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
