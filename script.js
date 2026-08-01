document.addEventListener("DOMContentLoaded", function () {
    // 1. إخفاء الشاشة التمهيدية (Loader)
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 500);
        }, 300);
    }

    // 2. القائمة الجانبية (Side Menu)
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

    // فتح وإغلاق النافذة
    if (cartBtn && cartModal) {
        cartBtn.addEventListener("click", () => cartModal.style.display = "flex");
    }
    if (closeCart && cartModal) {
        closeCart.addEventListener("click", () => cartModal.style.display = "none");
    }

    // أزرار تحديد نوع الطلب (توصيل / استلام)
    const btnDelivery = document.getElementById("btnDelivery");
    const btnTakeaway = document.getElementById("btnTakeaway");
    const areaSelectorBox = document.getElementById("areaSelectorBox");
    let isDelivery = true;

    if (btnDelivery && btnTakeaway) {
        btnDelivery.addEventListener("click", () => {
            isDelivery = true;
            btnDelivery.classList.add("active");
            btnTakeaway.classList.remove("active");
            if (areaSelectorBox) areaSelectorBox.style.display = "block";
            updateCartUI();
        });

        btnTakeaway.addEventListener("click", () => {
            isDelivery = false;
            btnTakeaway.classList.add("active");
            btnDelivery.classList.remove("active");
            if (areaSelectorBox) areaSelectorBox.style.display = "none";
            updateCartUI();
        });
    }

    // إضافة منتج عند الضغط على زر "إضافة" في الكروت
    document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const card = this.closest(".card");
            const name = card.getAttribute("data-name");
            const price = parseInt(card.getAttribute("data-price"));

            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({ name, price, qty: 1 });
            }

            updateCartUI();
            
            // تأثير بصري بسيط للزر عند الإضافة
            this.innerHTML = '<i class="fas fa-check"></i> تمت الإضافة';
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-cart-plus"></i> إضافة';
            }, 1000);
        });
    });

    // تحديث الواجهة للسلة
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
                <div class="cart-item-row" style="display:flex; justify-between; align-items:center; margin-bottom:10px;">
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

        // حساب رسوم التوصيل
        let deliveryFee = 0;
        const areaSelect = document.getElementById("deliveryArea");
        if (isDelivery && areaSelect) {
            deliveryFee = parseInt(areaSelect.value) || 0;
        }

        const grandTotal = itemsSubtotal + deliveryFee;
        if (cartTotal) cartTotal.innerText = grandTotal.toLocaleString() + " د.ع";
    }

    window.changeQty = function (index, change) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    // تغيير كلفة التوصيل عند تغيير المنطقة
    const deliveryArea = document.getElementById("deliveryArea");
    if (deliveryArea) {
        deliveryArea.addEventListener("change", updateCartUI);
    }

    // 5. إرسال الطلب للواتساب
    if (sendOrderBtn) {
        sendOrderBtn.addEventListener("click", function () {
            if (cart.length === 0) {
                alert("السلة فارغة! يرجى إضافة وجبة أولاً.");
                return;
            }

            const name = document.getElementById("custName")?.value || "غير محدد";
            const phone = document.getElementById("custPhone")?.value || "غير محدد";
            const address = document.getElementById("custAddress")?.value || "غير محدد";
            const notes = document.getElementById("custNotes")?.value || "لا يوجد";

            let msg = `*طلب جديد - MIM89 FAST FOOD* 🍔\n\n`;
            msg += `👤 *الاسم:* ${name}\n`;
            msg += `📞 *الهاتف:* ${phone}\n`;
            msg += `🛵 *نوع الطلب:* ${isDelivery ? "توصيل للمنزل" : "استلام من المطعم"}\n`;
            
            if (isDelivery) {
                const areaSelect = document.getElementById("deliveryArea");
                const areaName = areaSelect.options[areaSelect.selectedIndex].getAttribute("data-name");
                msg += `📍 *المنطقة:* ${areaName}\n`;
                msg += `🏠 *العنوان:* ${address}\n`;
            }
            
            if (notes !== "لا يوجد") msg += `📝 *ملاحظات:* ${notes}\n`;

            msg += `\n--- *تفاصيل الوجبات* ---\n`;
            let subtotal = 0;
            cart.forEach(item => {
                const itemTotal = item.price * item.qty;
                subtotal += itemTotal;
                msg += `• ${item.name} (${item.qty}x) = ${itemTotal.toLocaleString()} د.ع\n`;
            });

            let deliveryFee = 0;
            if (isDelivery) {
                const areaSelect = document.getElementById("deliveryArea");
                deliveryFee = parseInt(areaSelect.value) || 0;
            }

            msg += `\n💵 *المجموع:* ${subtotal.toLocaleString()} د.ع`;
            if (isDelivery) msg += `\n🛵 *التوصيل:* ${deliveryFee.toLocaleString()} د.ع`;
            msg += `\n💰 *الإجمالي الكلي:* ${(subtotal + deliveryFee).toLocaleString()} د.ع`;

            const whatsappNumber = "9647750008630";
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
        });
    }
});
