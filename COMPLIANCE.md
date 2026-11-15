# IT Set Desk v3.2 — التوافق مع ITIL وISO

> **تنبيه مهم:** شهادة ISO بتتمنح **للمؤسسة** ونظام الإدارة بتاعها (ISMS أو SMS) بعد مراجعة من جهة مانحة معتمدة. مفيش برنامج لوحده "حاصل على ISO".
> اللي IT Set Desk بيقدمه: **أدوات وسجلات تدعم الضوابط دي، وتطلع دليل (Evidence) وقت المراجعة**. السياسات والإجراءات المكتوبة والمراجعة الدورية مسؤولية الشركة.

## ITIL (Version 5)

- **الإصدار:** PeopleCert بتطرح ITIL (Version 5) على مراحل خلال 2026، وهي امتداد لـ ITIL 4 مش إعادة بناء.
- **الممارسات:** الـ Practice Guides الـ 34 متاحة. باقات التخصص المعلنة بتجمع:
  - Incident وProblem.
  - Change Enablement وService Configuration Management وIT Asset Management.
  - Service Level Management.
- **ملحوظة:** الجدول تحت مبني على أسماء الممارسات دي. التفاصيل الكاملة لكل ممارسة في الإصدار الخامس لسه بتنزل، فراجع الجدول تاني لما تكتمل.

| الممارسة (ITIL) | اللي بيغطيها النظام | التغطية |
|---|---|---|
| **IT Asset Management** | <ul><li>سجل أصول بدورة حياة كاملة: في المخزن، قيد الاستخدام، في الصيانة، خارج الخدمة، تم التخلص منه.</li><li>بيانات كل جهاز: المالك، الموقع، السيريال، المورد، تاريخ الشراء، الضمان، والأهمية للشغل.</li><li>سجل تغييرات تلقائي لكل جهاز.</li></ul> | كاملة للأجهزة. **التراخيص (SAM) والتكلفة/الإهلاك مش موجودين.** |
| **Service Configuration Management** | <ul><li>ربط كل تذكرة بالجهاز.</li><li>صفحة لكل جهاز فيها تاريخه وأرقامه.</li></ul> | **جزئية:** مفيش علاقات بين الأجهزة (CI relationships) زي "اللابتوب ده متوصل بالسويتش ده". |
| **Incident Management** | تذاكر Incident بأولوية من مصفوفة Impact × Urgency، SLA بساعات العمل، تصعيد، وتقييم CSAT. | كاملة |
| **Problem Management** | نوع Problem، وربط التذاكر ببعض، وMTBF لكل جهاز بيكشف الأعطال المتكررة. | جزئية: مفيش Known Error Database منفصلة. قاعدة المعرفة بتقوم بالدور ده. |
| **Service Request Management** | نوع Service Request، والـ Portal للموظفين. | كاملة |
| **Change Enablement** | <ul><li>نوع Change.</li><li>خطط الصيانة الوقائية تقدر تفتح Change (Standard Change متوافق عليه مسبقاً) ومعاها Checklist ثابت.</li></ul> | **جزئية:** مفيش مسار موافقات (CAB/Approval) قبل التنفيذ. |
| **Service Level Management** | SLA لكل أولوية، ساعات عمل وإجازات، تقارير الالتزام. | كاملة |
| **Monitoring & Event Management** | إيقاف مؤقت للـ SLA وتنبيهات قبل وبعد التأخير. | جزئية: مفيش استقبال تنبيهات من أنظمة المراقبة. |

## ISO/IEC 27001:2022 — Annex A

| الضابط | الاسم | اللي بيغطيه النظام |
|---|---|---|
| **A.5.9** | Inventory of information and other associated assets | <ul><li>سجل الأصول، والمالك المسؤول عن كل جهاز.</li><li>تصدير البيانات (Export).</li></ul> |
| **A.5.11** | Return of assets | <ul><li>سجل الجهاز بيحفظ كل تسليم واستلام (من مين لمين وإمتى).</li><li>لما موظف يمشي، بتعرف عهدته من صفحته في "مقدمي الطلبات".</li></ul> |
| **A.7.13** | Equipment maintenance | <ul><li>خطط صيانة وقائية بتفتح تذاكر في ميعادها لوحدها.</li><li>الخطوات بتتنسخ Checklist في كل تذكرة.</li><li>مين نفّذ وإمتى بيتسجل في التذكرة.</li></ul> |
| **A.7.14** | Secure disposal or re-use of equipment | <ul><li>حالة "تم التخلص منه" ما بتتحفظش من غير طريقة وتاريخ.</li><li>تأكيد مسح وسائط التخزين، ورقم الشهادة.</li><li>الجهاز اللي مسح بياناته مش متأكَّد بيظهر بعلامة حمرا.</li></ul> |
| **A.8.13** | Information backup | <ul><li>نسخ احتياطي تلقائي للنظام نفسه، مع فحص سلامة.</li><li>خطة "اختبار استرجاع النسخة الاحتياطية" كمثال جاهز لاختبار الاسترجاع بشكل دوري.</li></ul> |
| **A.8.15** | Logging | Audit Log بسلسلة Hash بتكشف أي تعديل، ويشمل: تعديل الأصول، الخطط، تشغيل الصيانة، الدخول، والإعدادات. |
| **A.8.32** | Change management | تذاكر Change بخطوات Backup وRollback، وخطط صيانة بنوع Change. |
| **A.5.24 / A.5.26** | Incident management planning / response | تصنيف Security Incident، فريق Security، قاعدة معرفة بخطوات الاستجابة. |

## ISO/IEC 20000-1 (إدارة الخدمات)

النظام بيدعم العمليات التشغيلية اللي المعيار بيطلبها:

- **دعم كامل:** إدارة الأعطال، وطلبات الخدمة، ومستوى الخدمة (SLA)، والأصول.
- **دعم جزئي:** المشاكل، والتغيير، والإعدادات.

أما متطلبات نظام الإدارة نفسه، زي السياسات، وتقييم الأداء، والمراجعة الداخلية، ومراجعة الإدارة، فدي مسؤولية الشركة، والنظام بيوفر التقارير والسجلات اللي بتدعمها.

## الناقص قبل ما تقول "تغطية كاملة"

1. **Software Asset Management:** التراخيص وعددها وتاريخ انتهائها.
2. **علاقات الأجهزة (CI relationships):** الجهاز ده متوصل بإيه، ولو وقع إيه اللي هيتأثر.
3. **مسار موافقات للـ Change:** طلب، موافقة، تنفيذ، ثم مراجعة.
4. **إقرار استلام العهدة:** الموظف يوقّع إنه استلم الجهاز.

دي كلها ممكن تتضاف في إصدارات جاية حسب احتياج العميل.

## المصادر

- [ITIL Version 5 in 2026 — what is confirmed](https://www.advisedskills.com/blog/it-service-management/itil-version-5-in-2026-what-is-confirmed-what-is-available-and-what-comes-next.md)
- [ITIL — Wikipedia](https://en.wikipedia.org/wiki/ITIL)
- [ISO/IEC 27001:2022 controls — Open Security Architecture](https://opensecurityarchitecture.org/frameworks/iso-27001-2022)
- [ISO 27001:2022 A.7.13 Equipment maintenance — ISMS.online](https://www.isms.online/iso-27001/annex-a-2022/7-13-equipment-maintenance-2022/)
- [ISO 27001:2022 A.7.14 Secure disposal or re-use of equipment — ISMS.online](https://www.isms.online/iso-27001/annex-a-2022/7-14-secure-disposal-or-re-use-of-equipment-2022/)
