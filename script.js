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

    // 3. البحث السريع عن أصناف المينيو
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
    window.cart = cart; // ربط السلة لتكون متاحة عامة

    const cartBtn = document.getElementById("cartBtn");
    const cartModal = document.getElementById("cartModal");
    const closeCart = document.getElementById("closeCart");
    const cartCount = document.getElementById("cartCount");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    
    // دعم كلا المعرفين (ID) لزر الإرسال لضمان عدم حدوث أي خطأ
    const sendOrderBtn = document.getElementById("sendOrderBtn") || document.getElementById("sendOrderDirectBtn");

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
                const name = card.getAttribute("data-name") || card.querySelector("h3").innerText;
                const priceAttr = card.getAttribute("data-price");
                const price = priceAttr ? parseInt(priceAttr) : parseInt(card.querySelector(".card-price-row span").innerText.replace(/[^0-9]/g, '')) || 0;

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
            cartItems.innerHTML = '<p class="empty-msg" style="color:#777; text-align:center; font-size:12px;">السلة فارغة حالياً</p>';
            if (cartTotal) cartTotal.innerText = "0 د.ع";
            return;
        }

        let itemsHTML = "";
        let itemsSubtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            itemsSubtotal += itemTotal;
            itemsHTML += `
                <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; background:#222; padding:8px 12px; border-radius:6px; margin-bottom:8px; font-size:13px;">
                    <div>
                        <strong style="color:#fff;">${item.name}</strong><br>
                        <small style="color:#ff9f00;">${item.price.toLocaleString()} د.ع × ${item.qty}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button type="button" onclick="changeQty(${index}, -1)" style="background:#e63946; color:#fff; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">-</button>
                        <span style="margin:0 5px; font-weight:bold; color:#fff;">${item.qty}</span>
                        <button type="button" onclick="changeQty(${index}, 1)" style="background:#25d366; color:#fff; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">+</button>
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

    window.updateCartUI = updateCartUI;

    window.changeQty = function (index, change) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    // 5. إرسال الطلب المباشر والسحابي إلى Firebase (الكاشير والمطبخ)
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
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const grandTotal = subtotal + (isDelivery ? deliveryFee : 0);

            // تجهيز كائن الطلب ليرتبط مباشرة بقاعدة بيانات الكاشير
            const orderObj = {
                id: Date.now(),
                customerName: name,
                phone: phone,
                address: isDelivery ? address : "استلام من المطعم",
                notes: notes,
                items: cart,
                total: grandTotal.toLocaleString() + " د.ع",
                type: isDelivery ? "توصيل للمنزل" : "استلام من المطعم",
                time: new Date().toLocaleTimeString('ar-IQ', {hour: '2-digit', minute:'2-digit'}),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            // الإرسال السحابي الفوري
            if (typeof db !== 'undefined') {
                db.collection("mim89_orders").add(orderObj)
                .then(() => {
                    cart = [];
                    updateCartUI();
                    if (cartModal) cartModal.style.display = "none";
                    
                    // إظهار نافذة نجاح الطلب
                    const alertModal = document.getElementById("orderAlertModal");
                    if (alertModal) {
                        alertModal.style.display = "flex";
                    } else {
                        alert("🎉 تم إرسال طلبك بنجاح إلى المطعم وجاري تحضيره!");
                    }

                    // تفريغ الحقول بعد الإرسال الناجح
                    if (nameInput) nameInput.value = "";
                    if (phoneInput) phoneInput.value = "";
                    if (addressInput) addressInput.value = "";
                    if (notesInput) notesInput.value = "";
                })
                .catch((error) => {
                    alert("⚠️ تعذر إرسال الطلب، تحقق من اتصالك بالإنترنت.");
                });
            } else {
                alert("⚠️ قاعدة البيانات غير متصلة، تأكد من إعدادات الاتصال.");
            }
        });
    }
});
