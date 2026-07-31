// ==========================================
// 1. LOADER
// ==========================================
function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.3s ease";
        setTimeout(() => {
            loader.style.display = "none";
        }, 300);
    }
}
document.addEventListener("DOMContentLoaded", hideLoader);
window.addEventListener("load", hideLoader);

// ==========================================
// 2. SIDE MENU TOGGLE & OVERLAY (إغلاق القائمة عند النقر في أي مكان)
// ==========================================
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

function closeSideMenu() {
    if (sideMenu) sideMenu.classList.remove("active");
    if (menuOverlay) menuOverlay.classList.remove("active");
}

if (menuBtn) {
    menuBtn.onclick = (e) => {
        e.preventDefault();
        sideMenu.classList.toggle("active");
        menuOverlay.classList.toggle("active");
    };
}

if (menuOverlay) {
    menuOverlay.onclick = closeSideMenu;
}

// ==========================================
// 3. SMOOTH SCROLL
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        const id = this.getAttribute("href");
        if (id && id.startsWith("#") && id !== "#" && document.querySelector(id)) {
            e.preventDefault();
            document.querySelector(id).scrollIntoView({ behavior: "smooth" });
            closeSideMenu();
        }
    });
});

// ==========================================
// 4. SEARCH MENU
// ==========================================
const search = document.getElementById("search");
if (search) {
    search.addEventListener("keyup", function () {
        const val = this.value.toLowerCase().trim();
        document.querySelectorAll(".card").forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(val) ? "flex" : "none";
        });
    });
}

// ==========================================
// 5. SHOPPING CART SYSTEM
// ==========================================
let cart = [];
const whatsappNumber = "9647750008630";

const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");

if (cartBtn) {
    cartBtn.onclick = () => {
        cartModal.classList.add("open");
    };
}

if (closeCart) {
    closeCart.onclick = () => {
        cartModal.classList.remove("open");
    };
}

// إغلاق نافذة السلة عند النقر خارج صندوق المحتوى
window.onclick = (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove("open");
    }
};

// إضافة الوجبات للسلة
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".add-to-cart-btn");
    if (btn) {
        const card = btn.closest(".card");
        if (card) {
            const name = card.getAttribute("data-name");
            const price = parseFloat(card.getAttribute("data-price"));

            const existing = cart.find(item => item.name === name);
            if (existing) {
                existing.qty++;
            } else {
                cart.push({ name, price, qty: 1 });
            }
            updateCartUI();
            
            // إشعار بسيط بالزر عند الإضافة
            btn.style.background = "#25D366";
            btn.style.color = "#fff";
            setTimeout(() => {
                btn.style.background = "#ff9800";
                btn.style.color = "#000";
            }, 300);
        }
    }
});

// تحديث واجهة السلة
function updateCartUI() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems) return;

    cartItems.innerHTML = "";
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-msg">السلة فارغة حالياً</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price * item.qty;
            count += item.qty;

            cartItems.innerHTML += `
                <div class="cart-item">
                    <div>
                        <h4 style="color:#fff;">${item.name}</h4>
                        <small style="color:#ff9800;">${item.price.toLocaleString()} د.ع</small>
                    </div>
                    <div class="item-qty">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <span style="color:#fff; font-weight:bold;">${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
            `;
        });
    }

    if (cartCount) cartCount.textContent = count;
    if (cartTotal) cartTotal.textContent = total.toLocaleString() + " د.ع";
}

// تغيير الكميات (+ / -)
window.changeQty = function (index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
};

// إرسال الطلب للواتساب
const sendOrderBtn = document.getElementById("sendOrderBtn");
if (sendOrderBtn) {
    sendOrderBtn.onclick = function () {
        if (cart.length === 0) {
            alert("السلة فارغة! يرجى إضافة وجبات أولاً.");
            return;
        }

        const name = document.getElementById("custName").value.trim();
        const address = document.getElementById("custAddress").value.trim();
        const notes = document.getElementById("custNotes").value.trim();

        if (!name || !address) {
            alert("يرجى كتابة الاسم والعنوان لإكمال الطلب.");
            return;
        }

        let message = `*طلب جديد من مطعم MIM89* 🍔\n\n`;
        message += `*الاسم:* ${name}\n`;
        message += `*العنوان:* ${address}\n`;
        if (notes) message += `*ملاحظات:* ${notes}\n`;
        message += `\n*تفاصيل الطلب:*\n`;

        let total = 0;
        cart.forEach(item => {
            const sum = item.price * item.qty;
            total += sum;
            message += `• ${item.name} (عدد ${item.qty}) = ${sum.toLocaleString()} د.ع\n`;
        });

        message += `\n*المجموع الكلي:* ${total.toLocaleString()} د.ع`;

        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`, "_blank");
    };
}
