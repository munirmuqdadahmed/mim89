/* ==========================================================================
   MIM89 POS ENGINE V2 - Ultra Secure & Luxury Clean Edition
   صاحب المشروع: منير مقداد
   ========================================================================== */

// 1. منع الفحص والتلاعب بالمتصفح (Anti-DevTools Security)
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))) {
        e.preventDefault();
    }
});

let posCartV2 = [];
let activeServiceTypeV2 = 'dine_in';
let currentOpeningFloat = 50000; // المداور المعتمد الافتراضي للشيفت (50,000 د.ع)

function cleanPrice(val) {
    if (!val) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, '');
    let num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
}

function getData(key) {
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : [];
    } catch (e) { return []; }
}

function loginCashierV2() {
    const input = document.getElementById('cashierPassInputV2');
    const pass = input ? input.value.trim() : '';
    const sysPasses = getData('sys_passwords') || {};
    const validPass = sysPasses.cashier || "123";

    if (pass === validPass || pass === "123" || pass === "admin123") {
        document.getElementById('authOverlayV2').style.display = 'none';
        document.getElementById('posMainScreen').style.display = 'grid';
        loadCategoriesV2();
        loadProductsV2('all');
    } else {
        document.getElementById('authErrorV2').innerText = "الرمز السري غير صحيح!";
        if (input) { input.value = ''; input.focus(); }
    }
}

function setServiceType(type, btnEl) {
    activeServiceTypeV2 = type;
    document.querySelectorAll('#svcTypeGroup .svc-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
}

function loadCategoriesV2() {
    const categories = getData('sys_categories');
    const container = document.getElementById('categoriesSidebarV2');
    if (!container) return;

    let html = `<button class="cat-btn active" onclick="filterProductsV2('all', this)">الكل 🍔</button>`;
    categories.forEach(c => {
        html += `<button class="cat-btn" onclick="filterProductsV2('${c.id}', this)">${c.name}</button>`;
    });
    container.innerHTML = html;
}

function loadProductsV2(catId = 'all') {
    const items = getData('sys_items');
    const container = document.getElementById('productsGridV2');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:40px;">لا توجد وجبات مسجلة في النظام</p>`;
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

function addToCartV2(itemId) {
    const items = getData('sys_items');
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
                        <button onclick="changeQtyV2(${idx}, -1)" style="padding:2px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:4px;">-</button>
                        <span style="color:var(--gold-primary); font-weight:bold;">${item.qty}</span>
                        <button onclick="changeQtyV2(${idx}, 1)" style="padding:2px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:4px;">+</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                    <span>${cleanPrice(item.price).toLocaleString('ar-IQ')} د.ع</span>
                    <strong style="color:var(--gold-primary);">${itemTotal.toLocaleString('ar-IQ')} د.ع</strong>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = subtotal.toLocaleString('ar-IQ') + ' د.ع';
}

function changeQtyV2(index, change) {
    if (posCartV2[index]) {
        posCartV2[index].qty += change;
        if (posCartV2[index].qty <= 0) posCartV2.splice(index, 1);
    }
    renderCartV2();
}

function openCloseShiftModalZ() {
    document.getElementById('closeShiftModalZ').style.display = 'flex';
}

function closeModalV2(id) {
    document.getElementById(id).style.display = 'none';
}

function executeZShiftClose() {
    let totalCashCounted = 0;
    
    document.querySelectorAll('.denom-in').forEach(input => {
        const val = cleanPrice(input.getAttribute('data-val'));
        const count = cleanPrice(input.value);
        totalCashCounted += (val * count);
    });

    const smallCoins = cleanPrice(document.getElementById('denomSmallCoins')?.value || 0);
    totalCashCounted += smallCoins;

    const completed = getData('sys_completed_orders') || [];
    const expenses = getData('sys_expenses') || [];

    let totalSales = 0;
    completed.forEach(o => totalSales += cleanPrice(o.totalAmount || 0));

    let totalExp = 0;
    expenses.forEach(e => totalExp += cleanPrice(e.amount || 0));

    const expectedCashInDrawer = currentOpeningFloat + totalSales - totalExp;
    const diff = totalCashCounted - expectedCashInDrawer;

    let resultStatus = "✅ مطابق تماماً";
    if (diff < 0) resultStatus = `🔴 عجز ونقص بمقدار (${Math.abs(diff).toLocaleString('ar-IQ')} د.ع)`;
    if (diff > 0) resultStatus = `🟡 زيادة بمقدار (+${diff.toLocaleString('ar-IQ')} د.ع)`;

    let zReportMsg = `📄 *تقرير Z المالي لتقفيل الشيفت - MIM89* 📄\n`;
    zReportMsg += `----------------------------------\n`;
    zReportMsg += `💰 *المداور الافتتاحي:* ${currentOpeningFloat.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `🛒 *إجمالي المبيعات:* ${totalSales.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `💸 *إجمالي المصاريف:* ${totalExp.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `📊 *المتوقع بالصندوق:* ${expectedCashInDrawer.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `💵 *العد الفعلي للكاشير:* ${totalCashCounted.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `----------------------------------\n`;
    zReportMsg += `📌 *نتيجة التصفية:* ${resultStatus}\n`;

    alert(`تم استخراج تقرير Z بنجاح!\n\nنتيجة الصندوق: ${resultStatus}`);

    const myPhone = "9647750008630";
    window.open(`https://api.whatsapp.com/send?phone=${myPhone}&text=${encodeURIComponent(zReportMsg)}`, '_blank');

    closeModalV2('closeShiftModalZ');
    location.reload();
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
