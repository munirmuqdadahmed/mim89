// دالة حساب وتجميع الفئات النقدية بدون أي فواصل عشرية
function calculateZDenominations() {
    let totalCashCounted = 0;
    
    document.querySelectorAll('.denom-in').forEach(input => {
        const val = cleanPrice(input.getAttribute('data-val'));
        const count = cleanPrice(input.value);
        totalCashCounted += (val * count);
    });

    const smallCoins = cleanPrice(document.getElementById('denomSmallCoins')?.value || 0);
    totalCashCounted += smallCoins;

    // إرجاع رقم صحيح مجرد بدون فواصل عشرية إطلاقاً
    return Math.floor(totalCashCounted);
}

// دالة تنفيذ تقفيل الشيفت Z واستخراج التقرير والطباعة
function executeZShiftClose() {
    const totalCashCounted = calculateZDenominations();

    const completed = getData('sys_completed_orders') || [];
    const expenses = getData('sys_expenses') || [];

    let totalSales = 0;
    completed.forEach(o => totalSales += cleanPrice(o.totalAmount || 0));

    let totalExp = 0;
    expenses.forEach(e => totalExp += cleanPrice(e.amount || 0));

    // الأرقام مقربة ومضمونة 100%
    totalSales = Math.floor(totalSales);
    totalExp = Math.floor(totalExp);
    
    const expectedCashInDrawer = Math.floor(currentOpeningFloat + totalSales - totalExp);
    const diff = Math.floor(totalCashCounted - expectedCashInDrawer);

    let resultStatus = "✅ مطابق تماماً";
    if (diff < 0) resultStatus = `🔴 عجز بمقدار (${Math.abs(diff).toLocaleString('ar-IQ')} د.ع)`;
    if (diff > 0) resultStatus = `🟡 زيادة بمقدار (+${diff.toLocaleString('ar-IQ')} د.ع)`;

    const zReportData = {
        shiftId: "Z-" + Date.now(),
        date: new Date().toLocaleDateString('ar-IQ'),
        time: new Date().toLocaleTimeString('ar-IQ'),
        cashier: activeCashierUser ? activeCashierUser.name : "الكاشير الرئيسي",
        openingFloat: currentOpeningFloat,
        totalSales: totalSales,
        totalExpenses: totalExp,
        expectedCash: expectedCashInDrawer,
        actualCash: totalCashCounted,
        diff: diff,
        status: resultStatus
    };

    // طباعة تقرير Z حرارياً
    printZReportThermal(zReportData);

    // إرسال نسخة للواتساب
    let zReportMsg = `📄 *تقرير Z المالي لتقفيل الشيفت - MIM89* 📄\n`;
    zReportMsg += `----------------------------------\n`;
    zReportMsg += `🕒 *الوقت:* ${zReportData.date} - ${zReportData.time}\n`;
    zReportMsg += `👤 *الكاشير:* ${zReportData.cashier}\n`;
    zReportMsg += `💰 *المداور الافتتاحي:* ${currentOpeningFloat.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `🛒 *إجمالي المبيعات:* ${totalSales.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `💸 *إجمالي المصاريف:* ${totalExp.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `📊 *المتوقع بالصندوق:* ${expectedCashInDrawer.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `💵 *العد الفعلي للكاشير:* ${totalCashCounted.toLocaleString('ar-IQ')} د.ع\n`;
    zReportMsg += `----------------------------------\n`;
    zReportMsg += `📌 *نتيجة التصفية:* ${resultStatus}\n`;

    const myPhone = "9647750008630";
    window.open(`https://api.whatsapp.com/send?phone=${myPhone}&text=${encodeURIComponent(zReportMsg)}`, '_blank');

    closeModalV2('closeShiftModalZ');
}

// دالة الطباعة الحرارية لتقرير Z
function printZReportThermal(z) {
    const printBox = createThermalPrintContainer();
    printBox.innerHTML = `
        <div style="width:100%; box-sizing:border-box; font-family:'Tajawal',sans-serif; text-align:right; direction:rtl; color:#000; padding:5px;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:5px;">
                <h2 style="font-size:18px; margin:0; font-weight:900;">*** تقرير Z لتقفيل الشيفت ***</h2>
                <div style="font-size:11px; font-weight:bold;">MIM89 FAST FOOD</div>
            </div>
            <div style="font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
                <div>التاريخ والوقت: ${z.date} - ${z.time}</div>
                <div>الكاشير المسؤول: ${z.cashier}</div>
                <div>رقم التقرير: ${z.shiftId}</div>
            </div>
            <div style="font-size:12px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:5px; margin-bottom:5px;">
                <div style="display:flex; justify-content:space-between;"><span>المداور الافتتاحي:</span> <span>${z.openingFloat.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>إجمالي المبيعات:</span> <span>${z.totalSales.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>إجمالي المصاريف:</span> <span>- ${z.totalExpenses.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between; border-top:1px dashed #000; padding-top:3px; margin-top:3px;"><span>المتوقع بالصندوق:</span> <span>${z.expectedCash.toLocaleString('ar-IQ')} د.ع</span></div>
                <div style="display:flex; justify-content:space-between;"><span>المحسوب فعلياً:</span> <span>${z.actualCash.toLocaleString('ar-IQ')} د.ع</span></div>
            </div>
            <div style="text-align:center; font-size:14px; font-weight:900; margin-top:5px; border:1px solid #000; padding:4px;">
                ${z.status}
            </div>
        </div>
    `;
    setTimeout(() => { window.print(); }, 150);
}
