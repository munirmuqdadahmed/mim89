// ==========================================
// 1. SAFE LOADER HIDE (إخفاء الـ Loader بأمان)
// ==========================================
function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.4s ease";
        setTimeout(() => {
            loader.style.display = "none";
        }, 400);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(hideLoader, 1000); // إخفاء بعد ثانية بحد أقصى
});

window.addEventListener("load", hideLoader);

// ==========================================
// 2. SMOOTH SCROLL (التنقل السلس)
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        const id = this.getAttribute("href");
        if (id && id.startsWith("#") && id !== "#" && document.querySelector(id)) {
            e.preventDefault();
            document.querySelector(id).scrollIntoView({ behavior: "smooth" });

            const sideMenu = document.getElementById("sideMenu");
            if (sideMenu) sideMenu.classList.remove("active");
        }
    });
});

// ==========================================
// 3. SLIDER (سلايدر الصور)
// ==========================================
const slides = document.querySelectorAll(".slide");
if (slides.length > 0) {
    let current = 0;
    setInterval(() => {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, 4000);
}

// ==========================================
// 4. LIVE MENU SEARCH (البحث في القائمة)
// ==========================================
const search = document.getElementById("search");
if (search) {
    search.addEventListener("keyup", function () {
        const val = this.value.toLowerCase().trim();
        document.querySelectorAll(".card").forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(val) ? "inline-block" : "none";
        });
    });
}

// ==========================================
// 5. COUNTDOWN TIMER (العداد التنازلي)
// ==========================================
const daysElem = document.getElementById("days");
if (daysElem) {
    let total = 172800;
    setInterval(() => {
        let d = Math.floor(total / 86400);
        let h = Math.floor((total % 86400) / 3600);
        let m = Math.floor((total % 3600) / 60);
        let s = total % 60;

        document.getElementById("days").textContent = String(d).padStart(2, '0');
        document.getElementById("hours").textContent = String(h).padStart(2, '0');
        document.getElementById("minutes").textContent = String(m).padStart(2, '0');
        document.getElementById("seconds").textContent = String(s).padStart(2, '0');

        if (total > 0) total--;
    }, 1000);
}

// ==========================================
// 6. SIDE MENU (القائمة الجانبية)
// ==========================================
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
if (menuBtn && sideMenu) {
    menuBtn.onclick = (e) => {
        e.preventDefault();
        sideMenu.classList.toggle("active");
    };
}

// ==========================================
// 7. SHOPPING CART SYSTEM (سلة الطلبات والواتساب)
// ==========================================
let cart = [];
const whatsappNumber = "9647750008630"; // رقم الواتساب المخصص لاستلام الطلبات

const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");

if (cartBtn) cartBtn.onclick = () => cartModal.classList.add("open");
if (closeCart) closeCart.onclick = () => cartModal.classList.remove("open");

// إضافة عنصر للسلة
document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        const card = this.closest(".card");
        const name = card.getAttribute("data-name");
        const price = parseFloat(card.getAttribute("data-price"));

        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ name, price, qty: 1 });
        }
        updateCartUI();
    });
});

// تحديث الواجهة
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
                        <h4>${item.name}</h4>
                        <small>${item.price.toLocaleString()} د.ع</small>
                    </div>
                    <div class="item-qty">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
            `;
        });
    }

    if (cartCount) cartCount.textContent = count;
    if (cartTotal) cartTotal.textContent = total.toLocaleString() + " د.ع";
}

// تغيير الكمية
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
