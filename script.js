document.addEventListener("DOMContentLoaded", function () {
    // 1. إخفاء الشاشة التمهيدية (Loader)
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 500);
        }, 300);
    }

    // 2. القائمة الجانبية (Side Menu) بدون أي قفل للتمرير
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

if (menuBtn && sideMenu && menuOverlay) {
    menuBtn.addEventListener("click", () => {
        sideMenu.classList.add("active");
        menuOverlay.classList.add("active");
    });

    menuOverlay.addEventListener("click", () => {
        sideMenu.classList.remove("active");
        menuOverlay.classList.remove("active");
    });
}


    // 3. البحث الأحيائي عن أصناف المينيو
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("keyup", function () {
            const filter = this.value.toLowerCase();
            const cards = document.querySelectorAll(".card");

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(filter) ? "block" : "none";
            });
        });
    }

    // 4. إدارة سلة الطلبات (Cart System)
    let cart = [];
    const cartBtn = document.getElementById("cartBtn");
    const cartModal = document.getElementById("cartModal");
    const closeCart = document.getElementById("closeCart");
    const cartCount = document.getElementById("cartCount");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const sendOrderBtn = document.getElementById("sendOrderBtn");

    if (cartBtn && cartModal) {
        cartBtn.addEventListener("click", () => cartModal.style.display = "flex");
    }
    if (closeCart && cartModal) {
        closeCart.addEventListener("click", () => cartModal.style.display = "none");
    }

    const btnDelivery = document.getElementById("btnDelivery");
    const btnTakeaway = document.getElementById("btnTakeaway");
    let isDelivery = true;

    if (btnDelivery && btnTakeaway) {
        btnDelivery.addEventListener("click", () => {
            isDelivery = true;
            btnDelivery.classList.add("active");
            btnTakeaway.classList.remove("active");
            updateCartUI();
        });

        btnTakeaway.addEventListener("click", () => {
            isDelivery = false;
            btnTakeaway.classList.add("active");
            btnDelivery.classList.remove("active");
            updateCartUI();
        });
    }

    document.addEventListener("click", function (e) {
        if (e.target && (e.target.classList.contains("add-to-cart-btn") || e.target.closest(".add-to-cart-btn"))) {
            const btn = e.target.classList.contains("add-to-cart-btn") ? e.target : e.target.closest(".add-to-cart-btn");
            const card = btn.closest(".card");
            if (card) {
                const name = card.getAttribute("data-name");
                const price = parseInt(card.getAttribute("data-price"));

                const existingItem = cart.find(item => item.name === name);
                if (existingItem) {
                    existingItem.qty += 1;
                } else {
                    cart.push({ name, price, qty: 1 });
                }

                updateCartUI();
                
                btn.innerHTML = '<i class="fas fa-check"></i> تمت الإضافة';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-cart-plus"></i> إضافة';
                }, 1000);
            }
        }
    });

    function calculateDeliveryFee() {
        if (!isDelivery) return 0;

        const addressInput = document.getElementById("custAddress");
        const addressText = addressInput ? addressInput.value.trim().toLowerCase() : "";

        if (addressText.includes("القاهرة") || addressText.includes("قاهرة") || addressText.includes("القاهره")) {
            return 0;
        } else {
            return 3000;
        }
    }

    const custAddressInput = document.getElementById("custAddress");
    if (custAddressInput) {
        custAddressInput.addEventListener("input", updateCartUI);
    }

    function updateCartUI() {
        if (!cartItems) return;

        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        if (cartCount) cartCount.innerText = totalQty;

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-msg">السلة فارغة حالياً</p>';
            if (cartTotal) cartTotal.innerText = "0 د.ع";
            return;
        }

        let itemsHTML = "";
        let itemsSubtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            itemsSubtotal += itemTotal;
            itemsHTML += `
                <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>${item.price.toLocaleString()} د.ع × ${item.qty}</small>
                    </div>
                    <div>
                        <button onclick="changeQty(${index}, -1)" style="padding:2px 8px;">-</button>
                        <span style="margin:0 5px;">${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)" style="padding:2px 8px;">+</button>
                    </div>
                </div>
            `;
        });

        cartItems.innerHTML = itemsHTML;

        const deliveryFee = calculateDeliveryFee();
        const grandTotal = itemsSubtotal + deliveryFee;

        let totalText = grandTotal.toLocaleString() + " د.ع";
        
        if (isDelivery) {
            const currentAddress = custAddressInput ? custAddressInput.value.trim() : "";
            if (deliveryFee === 0 && currentAddress !== "") {
                totalText += ` <span style="color: #25d366; font-size: 13px; font-weight: bold;">(التوصيل مجاني 🛵)</span>`;
            } else if (deliveryFee > 0 && currentAddress !== "") {
                totalText += ` <span style="color: #ff9f00; font-size: 12px;">(+ 3,000 توصيل 🛵)</span>`;
            }
        }

        if (cartTotal) cartTotal.innerHTML = totalText;
    }

    window.changeQty = function (index, change) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    if (sendOrderBtn) {
        sendOrderBtn.addEventListener("click", function (e) {
            e.preventDefault();

            if (cart.length === 0) {
                alert("⚠️ السلة فارغة! يرجى إضافة وجبة أولاً.");
                return;
            }

            const nameInput = document.getElementById("custName");
            const phoneInput = document.getElementById("custPhone");
            const addressInput = document.getElementById("custAddress");
            const notesInput = document.getElementById("custNotes");

            const name = nameInput ? nameInput.value.trim() : "";
            const phone = phoneInput ? phoneInput.value.trim() : "";
            const address = addressInput ? addressInput.value.trim() : "";
            const notes = notesInput && notesInput.value.trim() !== "" ? notesInput.value.trim() : "لا يوجد";

            if (!name) {
                alert("⚠️ يرجى كتابة الاسم الكامل أولاً لتأكيد الطلب!");
                if (nameInput) nameInput.focus();
                return;
            }

            if (!phone) {
                alert("⚠️ يرجى كتابة رقم الهاتف للتواصل والدليفري!");
                if (phoneInput) phoneInput.focus();
                return;
            }

            if (isDelivery && !address) {
                alert("⚠️ يرجى كتابة العنوان التفصيلي / المنطقة لتوصيل الطلب!");
                if (addressInput) addressInput.focus();
                return;
            }

            const deliveryFee = calculateDeliveryFee();
            const isFreeDelivery = (deliveryFee === 0 && isDelivery);

            let msg = `*طلب جديد - MIM89 FAST FOOD* 🍔\n\n`;
            msg += `👤 *الاسم:* ${name}\n`;
            msg += `📞 *الهاتف:* ${phone}\n`;
            msg += `🛵 *نوع الطلب:* ${isDelivery ? "توصيل للمنزل" : "استلام من المطعم"}\n`;
            
            if (isDelivery) {
                msg += `🏠 *العنوان والمنطقة:* ${address}\n`;
                msg += `🛵 *حالة التوصيل:* ${isFreeDelivery ? "مجاني (منطقة القاهرة)" : "3,000 د.ع (باقي المناطق)"}\n`;
            }
            
            if (notes !== "لا يوجد") msg += `📝 *ملاحظات:* ${notes}\n`;

            msg += `\n--- *تفاصيل الوجبات* -- me\n`;
            let subtotal = 0;
            cart.forEach(item => {
                const itemTotal = item.price * item.qty;
                subtotal += itemTotal;
                msg += `• ${item.name} (${item.qty}x) = ${itemTotal.toLocaleString()} د.ع\n`;
            });

            msg += `\n💵 *مجموع الوجبات:* ${subtotal.toLocaleString()} د.ع`;
            if (isDelivery) msg += `\n🛵 *كلفة التوصيل:* ${isFreeDelivery ? "مجاناً" : "3,000 د.ع"}`;
            msg += `\n💰 *الإجمالي الكلي:* ${(subtotal + (isDelivery ? deliveryFee : 0)).toLocaleString()} د.ع`;

            const whatsappNumber = "9647750008630";
            window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
        });
    }
});
