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
// 2. SIDE MENU TOGGLE & OVERLAY
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
            
            btn.style.background = "#25D366";
            btn.style.color = "#fff";
            setTimeout(() => {
                btn.style.background = "#ff9800";
                btn.style.color = "#000";
            }, 300);
        }
    }
});

// التبديل الديناميكي لإخفاء/إظهار حقل العنوان وقائمة كلفة التوصيل عند اختيار (استلام من المطعم)
document.addEventListener("change", function(e) {
    if (e.target.name === "orderType") {
        const addressInput = document.getElementById("custAddress");
        const areaSelectorBox = document.getElementById("areaSelectorBox");
        
        if (e.target.value === "استلام من المطعم") {
            if (addressInput) {
                addressInput.style.display = "none";
                addressInput.removeAttribute("required");
            }
            if (areaSelectorBox) areaSelectorBox.style.display = "none";
        } else {
            if (addressInput) {
                addressInput.style.display = "block";
                addressInput.setAttribute("required", "required");
            }
            if (areaSelectorBox) areaSelectorBox.style.display = "block";
        }
        updateCartUI();
    }
    
    if (e.target.id === "deliveryArea") {
        updateCartUI();
    }
});

// تحديث واجهة السلة وتضمين كلفة التوصيل
function updateCartUI() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems) return;

    cartItems.innerHTML = "";
    let itemsSubtotal = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-msg">السلة فارغة حالياً</p>';
    } else {
        cart.forEach((item, index) => {
            const sum = item.price * item.qty;
            itemsSubtotal += sum;
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

    let deliveryFee = 0;
    const orderTypeRadio = document.querySelector('input[name="orderType"]:checked');
    const isDelivery = orderTypeRadio ? orderTypeRadio.value === "توصيل للمنزل" : true;
    const areaSelect = document.getElementById("deliveryArea");

    if (isDelivery && areaSelect && cart.length > 0) {
        deliveryFee = parseFloat(areaSelect.value) || 0;
    }

    const finalTotal = itemsSubtotal + deliveryFee;

    if (cartCount) cartCount.textContent = count;
    if (cartTotal) {
        if (deliveryFee > 0 && cart.length > 0) {
            cartTotal.innerHTML = `${finalTotal.toLocaleString()} د.ع <small style="font-size: 11px; color: #aaa;">(شامل التوصيل ${deliveryFee.toLocaleString()} د.ع)</small>`;
        } else {
            cartTotal.textContent = `${finalTotal.toLocaleString()} د.ع`;
        }
    }
}

// تغيير الكمية (+ / -)
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
        
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const payType = document.querySelector('input[name="payType"]:checked').value;
        
        const areaSelect = document.getElementById("deliveryArea");
        const selectedAreaOption = areaSelect ? areaSelect.options[areaSelect.selectedIndex] : null;
        const areaName = selectedAreaOption ? selectedAreaOption.getAttribute("data-name") : "";
        const deliveryFee = (orderType === "توصيل للمنزل" && areaSelect) ? parseFloat(areaSelect.value) : 0;

        if (!name) {
            alert("يرجى كتابة الاسم لإكمال الطلب.");
            return;
        }

        if (orderType === "توصيل للمنزل" && !address) {
            alert("يرجى كتابة العنوان التفصيلي للتوصيل.");
            return;
        }

        let message = `*طلب جديد من مطعم MIM89* 🍔\n\n`;
        message += `*الاسم:* ${name}\n`;
        message += `*نوع الطلب:* ${orderType}\n`;
        if (orderType === "توصيل للمنزل") {
            message += `*المنطقة:* ${areaName}\n`;
            message += `*العنوان:* ${address}\n`;
        }
        message += `*طريقة الدفع:* ${payType}\n`;
        if (notes) message += `*ملاحظات:* ${notes}\n`;
        
        message += `\n*تفاصيل الوجبات:*\n`;

        let itemsSubtotal = 0;
        cart.forEach(item => {
            const sum = item.price * item.qty;
            itemsSubtotal += sum;
            message += `• ${item.name} (عدد ${item.qty}) = ${sum.toLocaleString()} د.ع\n`;
        });

        if (orderType === "توصيل للمنزل") {
            message += `• كلفة التوصيل = ${deliveryFee > 0 ? deliveryFee.toLocaleString() + " د.ع" : "مجاناً"}\n`;
        }

        const grandTotal = itemsSubtotal + deliveryFee;
        message += `\n*المجموع الكلي:* ${grandTotal.toLocaleString()} د.ع`;

        if (payType.includes("زين كاش")) {
            message += `\n\n*(يرجى تزويدنا بتأكيد تحويل زين كاش لإكمال تجهيز الطلب)*`;
        }

        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`, "_blank");
    };
}
