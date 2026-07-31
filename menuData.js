// ==========================================
// ملف قائمة الطعام - المنيو (MIM89)
// يمكنك تغيير السعر، الاسم، الوصف، أو رابط الصورة من هنا بسهولة
// ==========================================

const menuCategories = [
    {
        id: "offers",
        title: "🔥 العروض الخاصة واليومية",
        items: [
            {
                id: "off1",
                name: "عرض الفردي (بركر 89 + فنكر + بيبسي)",
                price: 10000,
                oldPrice: 12000,
                desc: "بركر 89 الخاص + فنكر كلاسيك + بيبسي مبرد",
                image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=600&q=80",
                badge: "وفر 2,000 د.ع"
            },
            {
                id: "off2",
                name: "عرض ميكس الشاورما (وجبة عربي دبل + 2 بيبسي)",
                price: 10000,
                oldPrice: 11000,
                desc: "وجبة شاورما عربي دبل + ثومية ومخلل + 2 بيبسي",
                image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
                badge: "الأكثر طلباً"
            },
            {
                id: "off3",
                name: "عرض الثنائي (2 بركر كلاسيك + فنكر دبل + 2 بيبسي)",
                price: 13000,
                oldPrice: 14500,
                desc: "2 بركر لحم/دجاج كلاسيك + فنكر دبل + 2 بيبسي",
                image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
                badge: "عرض لشخصين"
            },
            {
                id: "off4",
                name: "عرض العائلة واللمة (4 بركر + كنتاكي 4 قطع + 2 فنكر + لتر بيبسي)",
                price: 32000,
                oldPrice: 37000,
                desc: "4 بركر كلاسيك + 4 قطع كنتاكي مقرمش + 2 فنكر كبير + لتر بيبسي",
                image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
                badge: "توفير عائلي ضخم"
            }
        ]
    },
    {
        id: "burger",
        title: "🍔 قسم البركر",
        items: [
            {
                id: "b1",
                name: "بركر كلاسيك",
                price: 5000,
                desc: "لحم طازج مع الصوص الخاص والخضار",
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b2",
                name: "بركر الجبن",
                price: 6000,
                desc: "شريحة لحم غنية بجبنة الشيدر الذائبة",
                image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b3",
                name: "دبل تشيز بركر",
                price: 8000,
                desc: "قطعتين لحم مع طبقات مضاعفة من الجبن",
                image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b4",
                name: "بركر 89 الخاص",
                price: 8500,
                desc: "الخلطة الخاصة المبتكرة من مطعم MIM89",
                image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b5",
                name: "تشكن فيليه",
                price: 5500,
                desc: "صدر دجاج مقرمش مع الصوص والمايونيز",
                image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b6",
                name: "بركر دجاج سبايسي",
                price: 6000,
                desc: "دجاج المقرمش الحار مع صوص الهالابينو",
                image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b7",
                name: "بركر كرسبي",
                price: 6000,
                desc: "دجاج مقرمش ذهبي الخلطة الممتازة",
                image: "https://images.unsplash.com/photo-1525164286253-04e68b9d94c3?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b8",
                name: "بركر مشروم",
                price: 7000,
                desc: "شريحة لحم مع صوص الفطر والجبن",
                image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b9",
                name: "بركر مكسيكي",
                price: 7000,
                desc: "نكهة حارة ولذيذة مع قطع الهالابينو",
                image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "b10",
                name: "بركر لحم مزدوج",
                price: 9000,
                desc: "وجبة مشبعة بقطعتين من اللحم المشوي",
                image: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=600&q=80"
            }
        ]
    },
    {
        id: "shawarma",
        title: "🌯 قسم الشاورما",
        items: [
            {
                id: "s1",
                name: "شاورما صاج عادي",
                price: 3500,
                desc: "خبز صاج، شاورما دجاج، ثوم، وبطاطا",
                image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s2",
                name: "شاورما صاج دبل",
                price: 5000,
                desc: "شاورما مضاعفة في خبز الصاج المميز",
                image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s3",
                name: "شاورما صاج سوبر",
                price: 6000,
                desc: "حجم كبير جداً مليء بالشاورما والجبن",
                image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s4",
                name: "شاورما وزن 250 غرام",
                price: 7000,
                desc: "شاورما دجاج صافي بالصحن",
                image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s5",
                name: "شاورما وزن 500 غرام",
                price: 13000,
                desc: "نصف كيلو شاورما دجاج صافي مع المرفقات",
                image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s6",
                name: "شاورما عربي",
                price: 6000,
                desc: "تقطيع عربي مع بطاطا، ثومية ومخلل",
                image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s7",
                name: "وجبة شاورما",
                price: 7000,
                desc: "وجبة متكاملة مع المشروب والبطاطا",
                image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s8",
                name: "وجبة شاورما دبل",
                price: 9000,
                desc: "وجبة دبل مشبعة مع مقبلات وثومية",
                image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "s9",
                name: "شاورما 89 الخاص",
                price: 8000,
                desc: "طبق الشاورما الخاص المضاف له الجبن والبطاطا والصوصات",
                image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80"
            }
        ]
    },
    {
        id: "rizo",
        title: "🍚 قسم الريزو",
        items: [
            {
                id: "r1",
                name: "ريزو كلاسيك",
                price: 5000,
                desc: "أرز الريزو المميز مع قطع الدجاج المقرمشة وصوص الريزو",
                image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "r2",
                name: "ريزو سبايسي",
                price: 5500,
                desc: "نكهة حارة ممتازة مع قطع الدجاج السبايسي",
                image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "r3",
                name: "ريزو جبنة",
                price: 6000,
                desc: "ريزو مغطى بصوص الجبن الذائب الشهي",
                image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "r4",
                name: "ريزو مشروم",
                price: 6500,
                desc: "ريزو مع قطع الفطر الطازج والصوص الكريمي",
                image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "r5",
                name: "ريزو 89 الخاص",
                price: 7500,
                desc: "خلطة الريزو الخاصة مع دبل دجاج، جبن ومشروم",
                image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "r6",
                name: "ريزو دبل تشكن",
                price: 7000,
                desc: "كمية مضاعفة من الدجاج المقرمش فوق أرز الريزو",
                image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
            }
        ]
    },
    {
        id: "kentucky",
        title: "🍗 قسم الكنتاكي",
        items: [
            {
                id: "k1",
                name: "كنتاكي قطعتين",
                price: 5000,
                desc: "قطعتين دجاج مقرمش + بطاطا وثومية",
                image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "k2",
                name: "كنتاكي 4 قطع",
                price: 9000,
                desc: "4 قطع دجاج ذهبي + بطاطا وثومية وخبز",
                image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "k3",
                name: "كنتاكي 6 قطع",
                price: 13000,
                desc: "6 قطع كنتاكي المقرمش مع السلطة والبطاطا",
                image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "k4",
                name: "وجبة كنتاكي",
                price: 10000,
                desc: "قطع كنتاكي مع المشروب، البطاطا، الكولسلو والثومية",
                image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80"
            }
        ]
    },
    {
        id: "appetizers",
        title: "🍟 قسم الفنكر والمقبلات والإضافات",
        items: [
            {
                id: "a1",
                name: "فنكر كلاسيك",
                price: 2500,
                desc: "بطاطا مقرمشة ذهبية",
                image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a2",
                name: "فنكر سبايسي",
                price: 3000,
                desc: "بطاطا مبهرة بالنكهة الحارة",
                image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a3",
                name: "فنكر جبنة",
                price: 3500,
                desc: "فنكر مغطى بجبنة الشيدر الذائبة",
                image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a4",
                name: "فنكر 89 الخاص",
                price: 4500,
                desc: "بطاطا مقرمشة محملة بالجبن والهالابينو والصوصات",
                image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a5",
                name: "أصابع موزاريلا",
                price: 4000,
                desc: "أصابع جبن الموزاريلا المقرمشة والذائبة",
                image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a6",
                name: "حلقات بصل",
                price: 3000,
                desc: "حلقات بصل مقرمشة بالخلطة الذهبية",
                image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a7",
                name: "إضافة جبنة",
                price: 1000,
                desc: "شريحة جبن أو صوص جبن إضافي",
                image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a8",
                name: "إضافة هالابينو",
                price: 1000,
                desc: "قطع فلفل هالابينو الحار",
                image: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "a9",
                name: "إضافة صوص خاص",
                price: 1000,
                desc: "علبة صوص مميز (ثومية / سبايسي / 89)",
                image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80"
            }
        ]
    },
    {
        id: "drinks",
        title: "🥤 قسم المشروبات",
        items: [
            {
                id: "d1",
                name: "بيبسي",
                price: 1000,
                desc: "مشروب غازي بارد",
                image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "d2",
                name: "سفن أب",
                price: 1000,
                desc: "مشروب غازي منعش",
                image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "d3",
                name: "ميرندا",
                price: 1000,
                desc: "مشروب غازي بنكهة البرتقال",
                image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "d4",
                name: "ديو",
                price: 1000,
                desc: "مشروب غازي منعش",
                image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80"
            },
            {
                id: "d5",
                name: "ماء",
                price: 500,
                desc: "قنينة ماء نقي مبرد",
                image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80"
            }
        ]
    }
];
