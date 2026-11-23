/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
(function(){
'use strict';
const C=window.ITCore;
/* ================= i18n ================= */
const L={
 app:['IT Set Desk','IT Set Desk'], suite:['إدارة طلبات الدعم الفني','IT service management'],
 about:['عن النظام','About'], version:['الإصدار','Version'], edition:['النسخة','Edition'], ed_team:['نسخة الفريق (سيرفر)','Team edition (server)'], ed_offline:['نسخة Offline (جهاز واحد)','Offline edition (single device)'],
 licensedTo:['مرخّص لـ','Licensed to'], evalCopy:['نسخة تقييم','Evaluation copy'], designedBy:['تصميم وتطوير','Designed & built by'], devName:['م. عبدالله عامر','Eng. Abdullah Amer'],
 devTitle:['مستشار تكنولوجيا المعلومات والتحول الرقمي','IT & Digital Transformation Consultant'], contact:['للتواصل','Contact'],
 rights:['© 2026 عبدالله عامر. جميع الحقوق محفوظة.','© 2026 Abdullah Amer. All rights reserved.'],
 licenseNote:['برنامج مملوك ومرخّص للاستخدام حسب اتفاقية الترخيص. نسخه أو توزيعه أو تعديله محتاج إذن كتابي.','Proprietary software, licensed for use under the license agreement. Copying, redistribution or modification requires written permission.'],
 builtWith:['مبني بـ Node.js وSQLite من غير أي مكتبات خارجية. الخطوط: IBM Plex (رخصة SIL Open Font License).','Built with Node.js and SQLite, no third-party packages. Fonts: IBM Plex (SIL Open Font License).'],
 dashboard:['لوحة التحكم','Dashboard'], tickets:['التذاكر','Tickets'], board:['لوحة Kanban','Kanban Board'],
 assets:['الأصول (CMDB)','Assets (CMDB)'], kb:['قاعدة المعرفة','Knowledge Base'], reports:['التقارير','Reports'], settings:['الإعدادات','Settings'],
 search:['ابحث برقم التذكرة، العنوان، مقدم الطلب، الوسوم…','Search key, title, requester, tags…'],
 newTicket:['تذكرة جديدة','New ticket'], demo:['بيانات تجريبية','Demo data'],
 shortcuts:['اختصارات','Shortcuts'], sc_new:['تذكرة جديدة','new ticket'], sc_search:['بحث','search'], sc_esc:['إغلاق','close'],
 st_new:['جديدة','New'], st_progress:['قيد التنفيذ','In progress'], st_pending:['بانتظار الرد','Pending'], st_resolved:['تم الحل','Resolved'], st_closed:['مغلقة','Closed'],
 ty_incident:['Incident — عطل','Incident'], ty_request:['Service Request — طلب خدمة','Service request'], ty_problem:['Problem — مشكلة جذرية','Problem'], ty_change:['Change — طلب تغيير','Change'],
 tys_incident:['عطل','Incident'], tys_request:['طلب خدمة','Request'], tys_problem:['مشكلة','Problem'], tys_change:['تغيير','Change'],
 impact:['التأثير (Impact)','Impact'], urgency:['الأولوية الزمنية (Urgency)','Urgency'], lvl1:['عالي','High'], lvl2:['متوسط','Medium'], lvl3:['منخفض','Low'],
 priority:['الأولوية','Priority'], status:['الحالة','Status'], type:['النوع','Type'], category:['التصنيف','Category'], team:['الفريق','Team'], assignee:['المسؤول','Assignee'],
 requester:['مقدم الطلب','Requester'], reqName:['اسم مقدم الطلب','Requester name'], reqEmail:['البريد الإلكتروني','Email'], reqDept:['القسم','Department'],
 title:['العنوان','Title'], description:['الوصف','Description'], tags:['الوسوم','Tags'], tagsHint:['افصل بفاصلة: vpn, remote','Comma separated: vpn, remote'], asset:['الأصل المرتبط','Linked asset'],
 none:['— بدون —','— None —'], unassigned:['غير مُسند','Unassigned'], all:['الكل','All'], autoAssign:['إسناد تلقائي','Auto-assign'],
 created:['تاريخ الإنشاء','Created'], updated:['آخر تحديث','Updated'], key:['الرقم','Key'],
 q_all:['كل التذاكر','All'], q_open:['المفتوحة','Open'], q_mine:['تذاكري','My open'], q_unassigned:['غير مُسندة','Unassigned'], q_overdue:['متأخرة SLA','SLA breached'], q_risk:['معرضة للتأخير','At risk'], q_today:['اليوم','Created today'],
 k_open:['تذاكر مفتوحة','Open tickets'], k_unassigned:['غير مُسندة','Unassigned'], k_breached:['تجاوزت SLA','SLA breached'], k_risk:['معرضة للتأخير','At risk'], k_resolved7:['تم حلها (7 أيام)','Resolved (7d)'], k_compliance:['الالتزام بـ SLA','SLA compliance'],
 k_click:['اضغط للعرض','Click to view'], k_30:['آخر 30 يوم','Last 30 days'],
 needsAttn:['تحتاج انتباه الآن','Needs attention now'], needsAttnSub:['المتأخرة والمعرضة للتأخير، مرتبة بالأقرب للخرق','Breached and at-risk, nearest deadline first'],
 workload:['ضغط العمل على الفريق','Team workload'], byCat:['المفتوحة حسب التصنيف','Open by category'], byPrio:['المفتوحة حسب الأولوية','Open by priority'],
 trend:['المُنشأة مقابل المحلولة — آخر 14 يوم','Created vs resolved — last 14 days'], createdL:['مُنشأة','Created'], resolvedL:['محلولة','Resolved'],
 allClear:['لا توجد تذاكر متأخرة أو معرضة للتأخير','No breached or at-risk tickets'],
 noTickets:['لا توجد تذاكر مطابقة للفلاتر','No tickets match these filters'], clearFilters:['مسح الفلاتر','Clear filters'],
 selected:['محدد','selected'], assignTo:['إسناد إلى…','Assign to…'], setStatus:['تغيير الحالة…','Set status…'], del:['حذف','Delete'], apply:['تطبيق','Apply'],
 showClosed:['إظهار المغلقة','Show closed'], dragHint:['اسحب الكارت بين الأعمدة لتغيير الحالة','Drag cards between columns to change status'],
 edit:['تعديل','Edit'], save:['حفظ','Save'], cancel:['إلغاء','Cancel'], create:['إنشاء','Create'], close:['إغلاق','Close'], confirm:['تأكيد','Confirm'], add:['إضافة','Add'],
 assignMe:['إسناد لي','Assign to me'], startWork:['بدء العمل','Start work'], resolve:['حل التذكرة','Resolve'], closeT:['إغلاق التذكرة','Close ticket'], reopen:['إعادة فتح','Reopen'], waitReq:['انتظار رد مقدم الطلب','Wait for requester'],
 conv:['المحادثة','Conversation'], worklog:['سجل الوقت','Worklog'], checklist:['قائمة المهام','Checklist'], links:['تذاكر مرتبطة','Linked'], activity:['سجل النشاط','Activity'],
 reply:['رد على مقدم الطلب','Reply to requester'], note:['ملاحظة داخلية','Internal note'], reqReply:['تسجيل رد من مقدم الطلب','Log requester reply'],
 writeHere:['اكتب هنا…','Write here…'], canned:['رد جاهز…','Canned reply…'], send:['إضافة','Add'], noComments:['لا توجد ردود بعد','No replies yet'],
 internalBadge:['داخلي','Internal'], reqBadge:['مقدم الطلب','Requester'],
 minutes:['الدقائق','Minutes'], logTime:['تسجيل وقت','Log time'], totalLogged:['إجمالي الوقت المسجل','Total logged'], noWork:['لم يُسجل وقت بعد','No time logged yet'], workNote:['ماذا تم؟','What was done?'],
 addItem:['أضف مهمة…','Add an item…'], noItems:['لا توجد مهام','No items'],
 linkTicket:['ربط بتذكرة…','Link a ticket…'], noLinks:['لا توجد تذاكر مرتبطة','No linked tickets'],
 respSla:['أول رد (Response)','First response'], resSla:['الحل (Resolution)','Resolution'], due:['الموعد','Due'], met:['ضمن SLA','Met'], breach:['خارج SLA','Breached'],
 left:['متبقي','left'], late:['متأخر','late'], paused:['متوقف مؤقتاً','Paused'],
 csat:['تقييم رضا العميل (CSAT)','Customer rating (CSAT)'], csatHint:['يُسجَّل يدوياً نيابةً عن مقدم الطلب','Entered manually on behalf of the requester'],
 suggested:['مقالات مقترحة','Suggested articles'], insertLink:['إدراج في الرد','Insert in reply'],
 ticketDeleted:['تم حذف التذكرة','Ticket deleted'], ticketCreated:['تم إنشاء التذكرة','Ticket created'], saved:['تم الحفظ','Saved'],
 confirmDel:['حذف التذكرة نهائياً؟ لا يمكن التراجع.','Delete this ticket permanently? This cannot be undone.'],
 confirmBulkDel:['حذف التذاكر المحددة نهائياً؟','Delete the selected tickets permanently?'],
 v_title:['العنوان مطلوب (5 أحرف على الأقل)','Title is required (at least 5 characters)'], v_req:['الاسم مطلوب','Name is required'], v_email:['صيغة البريد غير صحيحة','Email format is invalid'], v_cat:['اختر التصنيف','Choose a category'], v_req2:['هذا الحقل مطلوب أو قيمته غير صالحة','This field is required or invalid'],
 matrix:['مصفوفة الأولوية (ITIL)','Priority matrix (ITIL)'], computed:['الأولوية المحسوبة','Computed priority'],
 assetsSub:['دورة حياة كل جهاز من الشراء للتخلص منه، مربوطة بالتذاكر والصيانة الوقائية','Each device from purchase to disposal, linked to tickets and preventive maintenance'],
 assetTag:['كود الأصل','Asset tag'], assetName:['الاسم / الموديل','Name / model'], assetType:['النوع','Type'], assetUser:['المستخدم','User'], location:['الموقع','Location'], aStatus:['الحالة','Status'], tCount:['التذاكر','Tickets'],
 newAsset:['أصل جديد','New asset'], viewTickets:['عرض التذاكر','View tickets'], a_stock:['في المخزن','In stock'], a_active:['قيد الاستخدام','In use'], a_repair:['في الصيانة','In repair'], a_retired:['خارج الخدمة','Retired'], a_disposed:['تم التخلص منه','Disposed'],
 assetsList:['سجل الأصول','Asset register'], pmPlans:['خطط الصيانة الوقائية','Preventive maintenance plans'], newPlan:['خطة صيانة جديدة','New maintenance plan'],
 k_assets:['أصول في الخدمة','Live assets'], k_assetsSub:['من غير الخارج والمتخلَّص منه','Excludes retired and disposed'], k_warranty:['ضمان منتهي أو قرب','Warranty ending'], k_warrantySub:['منتهي أو خلال 30 يوم','Expired or within 30 days'],
 k_pmDue:['صيانة مستحقة','Maintenance due'], k_pmDueSub:['خلال 7 أيام','Within 7 days'], k_pmOpen:['تذاكر صيانة مفتوحة','Open maintenance tickets'],
 asSearch:['ابحث بالكود، الموديل، السيريال، المستخدم…','Search tag, model, serial, owner…'], aAllLive:['كل الحالات (من غير المتخلَّص منه)','All statuses (excl. disposed)'], allTypes:['كل الأنواع','All types'],
 owner:['المستخدم / المالك','Owner'], noOwner:['— مش مسلَّم لشخص —','— Not assigned to a person —'], ownerHint:['الموظف المسلَّم له الجهاز (من سجل مقدمي الطلبات)','The employee the device is issued to (from Requesters)'],
 userHint:['لو الجهاز مش لشخص: قسم أو مكان عام','If not issued to a person: a department or shared area'],
 serial:['الرقم التسلسلي','Serial number'], vendor:['الشركة المصنعة / المورد','Vendor'], purchaseDate:['تاريخ الشراء','Purchase date'], warrantyEnd:['نهاية الضمان','Warranty end'],
 crit:['الأهمية للشغل','Business criticality'], crit_high:['عالية','High'], crit_medium:['متوسطة','Medium'], crit_low:['منخفضة','Low'], critShort:['حرج','Critical'],
 notes:['ملاحظات','Notes'], noAssets:['لسه مفيش أصول متسجلة','No assets registered yet'], noAssetsMatch:['مفيش أصول مطابقة للفلاتر','No assets match these filters'],
 wExpired:['الضمان منتهي','Warranty expired'], wSoon:['الضمان ينتهي خلال {n} يوم','Warranty ends in {n} days'],
 overdueN:['متأخرة {n} يوم','{n} days overdue'], dueToday:['مستحقة النهارده','Due today'], inNDays:['بعد {n} يوم','in {n} days'],
 h_created:['اتسجّل','Registered'], h_status:['الحالة','Status'], h_owner:['اتسلّم لـ','Owner'], h_location:['اتنقل','Moved'],
 nextPm:['الصيانة الجاية','Next maintenance'], svcFigures:['أرقام الخدمة','Service figures'], incidentsN:['أعطال (Incidents)','Incidents'],
 mtbfNeed:['محتاج عطلين على الأقل','Needs at least two incidents'], mtHint:['MTTR = متوسط وقت إصلاح الأعطال. MTBF = متوسط الوقت بين بداية كل عطل والعطل اللي بعده.','MTTR = mean time to resolve incidents. MTBF = mean time between the start of one incident and the next.'],
 assetTimeline:['سجل الجهاز','Asset history'], pmChip:['صيانة وقائية','Preventive'],
 disposal:['التخلص من الجهاز','Disposal'], dMethod:['طريقة التخلص','Method'], dDate:['التاريخ','Date'], dWiped:['مسح البيانات','Data wiped'], dNote:['ملاحظة / رقم الشهادة','Note / certificate no.'],
 dNotePh:['مثلاً: شهادة التدوير رقم …','e.g. recycling certificate no. …'], dWipedLbl:['اتأكدت إن أي وسيط تخزين اتمسح بشكل آمن أو اتدمّر قبل ما الجهاز يخرج (ISO/IEC 27001 – A.7.14)','I confirm all storage media were securely wiped or destroyed before the device left (ISO/IEC 27001 – A.7.14)'],
 dm_recycled:['تدوير','Recycled'], dm_sold:['بيع','Sold'], dm_donated:['تبرع','Donated'], dm_destroyed:['إتلاف','Destroyed'], dm_returned:['رجوع للمورد / الإيجار','Returned to vendor / lessor'],
 yes:['نعم','Yes'], notConfirmed:['مش متأكَّد','Not confirmed'],
 pmSub:['كل خطة بتفتح تذكرة لكل جهاز في ميعادها لوحدها. لو فيه تذكرة مفتوحة من نفس الخطة لنفس الجهاز، مش بتتكرر.','Each plan opens one ticket per device when due. No duplicate is opened while one from the same plan is still open.'],
 planTitle:['اسم الخطة','Plan'], planTitlePh:['مثلاً: تنظيف وفحص الطابعات','e.g. Printer cleaning and inspection'], pmTarget:['الأجهزة','Devices'], pmSpecific:['أجهزة محددة','Specific devices'], pmByType:['كل أجهزة نوع معيّن','All devices of a type'],
 pmTypeTargetHint:['أي جهاز جديد من النوع ده هيدخل الخطة تلقائياً','New devices of this type join the plan automatically'], allOfType:['كل','All'],
 every:['التكرار','Every'], everyN:['كل {n} يوم','Every {n} days'], nextDue:['الميعاد الجاي','Next due'], leadDays:['افتح التذكرة قبلها بـ (أيام)','Open the ticket (days) early'], leadHint:['0 = يوم الميعاد نفسه','0 = on the due date'],
 lastRun:['آخر تشغيل','Last run'], runRes:['اتفتح {c} · اتأجل {s}','{c} opened · {s} skipped'], runNow:['شغّل دلوقتي','Run now'], runDone:['اتفتح {c} تذكرة، واتأجل {s} علشان ليهم تذكرة مفتوحة','{c} ticket(s) opened, {s} skipped (already open)'],
 ckItems:['{n} خطوات','{n} steps'], nAssets:['{n} جهاز حالياً','{n} device(s) now'], planPaused:['موقوفة','Paused'], byTeam:['حسب الفريق (تلقائي)','By team (auto)'],
 pmTypeHint:['التغيير المعتاد المتوافق عليه مسبقاً = Standard Change','Routine pre-approved work = standard change'], ckPh:['خطوة في كل سطر','One step per line'], ckHint:['الخطوات بتتنسخ في كل تذكرة كـ Checklist، وده دليل التنفيذ وقت المراجعة','Steps are copied into each ticket as a checklist — your evidence at audit time'],
 planActive:['الخطة شغالة','Plan active'], noPlans:['لسه مفيش خطط صيانة','No maintenance plans yet'],
 bad_dates:['نهاية الضمان قبل تاريخ الشراء','Warranty end is before the purchase date'], v_disposal:['طريقة التخلص والتاريخ مطلوبين','Disposal method and date are required'],
 v_target:['اختار جهاز واحد على الأقل أو نوع أجهزة','Pick at least one device or a device type'], v_every:['التكرار من 1 لـ 730 يوم، والميعاد مطلوب، والفترة المسبقة من 0 لـ 30','Every 1–730 days, a due date, and 0–30 lead days'], v_date:['التاريخ غير صحيح','Invalid date'],
 kbSub:['حلول موثقة يرجع لها الفريق ويقترحها النظام داخل التذكرة','Documented fixes the team reuses, suggested inside tickets'],
 newArticle:['مقال جديد','New article'], body:['المحتوى','Content'], kbSearch:['ابحث في المقالات…','Search articles…'], noArticles:['لا توجد مقالات','No articles'],
 reportsSub:['أداء الفريق والالتزام بالـ SLA','Team performance and SLA compliance'], period:['الفترة','Period'], d7:['7 أيام','7 days'], d30:['30 يوم','30 days'], d90:['90 يوم','90 days'], dall:['كل الفترات','All time'],
 agentPerf:['أداء الفريق','Agent performance'], agent:['الموظف','Agent'], assigned:['المُسندة','Assigned'], resolved:['المحلولة','Resolved'], avgRes:['متوسط وقت الحل','Avg resolution'], avgResp:['متوسط أول رد','Avg first response'], logged:['الوقت المسجل','Time logged'], csatAvg:['متوسط CSAT','Avg CSAT'],
 slaByPrio:['الالتزام بالـ SLA حسب الأولوية','SLA compliance by priority'], compliance:['نسبة الالتزام','Compliance'], breachedN:['خارج SLA','Breached'], metN:['ضمن SLA','Met'],
 catBreak:['التذاكر حسب التصنيف','Tickets by category'], total:['الإجمالي','Total'], openN:['مفتوحة','Open'],
 rqAssets:['الأجهزة في العهدة','Assets in custody'], rqNoAssets:['مفيش أجهزة في عهدته','No assets in custody'], exportCsv:['تصدير CSV','Export CSV'], exportJson:['تصدير نسخة احتياطية JSON','Export JSON backup'], importJson:['استيراد JSON','Import JSON'],
 general:['إعدادات النظام','System settings'], language:['اللغة','Language'], theme:['المظهر','Theme'], th_system:['حسب النظام','System'], apiTokens:['مفاتيح API (للـ MCP والسكربتات)','API tokens (for MCP and scripts)'],
 apiTokensDesc:['المفتاح بيشتغل بصلاحياتك أنت. "قراءة فقط" مايقدرش يعدّل أي حاجة. المفتاح مايقدرش يغيّر كلمات السر ولا يعمل مفاتيح ولا يصدّر أو يستورد بيانات. أي استخدام بيتسجل في سجل التدقيق باسمك.','A token acts with your own permissions. "Read only" cannot change anything. Tokens can never change passwords, create tokens, or export/import data. Everything a token does is logged under your name.'],
 tokOnce:['انسخ المفتاح دلوقتي، مش هيظهر تاني:','Copy this token now, it will not be shown again:'], tokDone:['خلاص نسخته','Done'],
 tokName:['اسم المفتاح','Token name'], tokNamePh:['مثلاً: Claude Desktop على لابتوبي','e.g. Claude Desktop on my laptop'], tokScope:['الصلاحية','Scope'], tok_read:['قراءة فقط','Read only'], tok_write:['قراءة وتعديل','Read & write'],
 tokDays:['مدة الصلاحية','Expires after'], nDays:['{n} يوم','{n} days'], tokCreate:['إنشاء مفتاح','Create token'], tokExpires:['ينتهي','Expires'], tokLastUsed:['آخر استخدام','Last used'], never:['لم يُستخدم','Never'],
 tokRevoke:['إلغاء','Revoke'], tokRevokeQ:['إلغاء المفتاح ده؟ أي برنامج بيستخدمه هيتوقف فوراً.','Revoke this token? Anything using it stops working immediately.'], noTokens:['مفيش مفاتيح','No tokens yet'],
 e_too_many_tokens:['الحد الأقصى 10 مفاتيح لكل مستخدم','Maximum 10 tokens per user'], e_token_read_only:['المفتاح ده قراءة فقط','This token is read-only'], th_white:['أبيض (Carbon White)','White (Carbon White)'], th_g90:['داكن متوسط (Carbon Gray 90)','Medium dark (Carbon Gray 90)'], th_light:['فاتح (Carbon Gray 10)','Light (Carbon Gray 10)'], th_dark:['داكن (Carbon Gray 100)','Dark (Carbon Gray 100)'],
 prefix:['بادئة رقم التذكرة','Ticket key prefix'], autoAssignDesc:['إسناد التذكرة الجديدة للفريق حسب التصنيف، ثم للموظف الأقل ضغطاً','Route new tickets to the category team, then to the least-loaded agent'],
 autoClose:['إغلاق تلقائي بعد الحل (أيام)','Auto-close after resolved (days)'], autoCloseDesc:['0 = إيقاف','0 = off'],
 slaPol:['سياسات SLA','SLA policies'], slaPolDesc:['بالدقائق، تقويم 24/7. حالة "بانتظار الرد" توقف عداد الحل.','Minutes, 24/7 calendar. "Pending" pauses the resolution clock.'],
 respMin:['أول رد (دقيقة)','Response (min)'], resMin:['الحل (دقيقة)','Resolution (min)'],
 teams:['الفرق','Teams'], agents:['فريق العمل والصلاحيات','Agents & access'], categories:['التصنيفات','Categories'], cannedR:['الردود الجاهزة','Canned replies'], name:['الاسم','Name'], email:['البريد','Email'], active:['نشط','Active'],
 data:['البيانات والنسخ الاحتياطي','Data & backup'],
 dataNote:['البيانات محفوظة على السيرفر (SQLite). خد نسخة احتياطية من الـ Volume بانتظام، أو صدّر JSON من هنا.','Data lives on the server (SQLite). Back up the volume regularly, or export JSON here.'],
 importNote:['اختر ملف JSON صادر من النظام (نسخة السيرفر أو النسخة Offline). سيتم استبدال التذاكر والأصول والإعدادات. الحسابات اللي ليها دخول بتفضل زي ما هي.','Pick a JSON backup (server or offline edition). Tickets, assets and settings are replaced; accounts with logins are kept.'],
 importOk:['تم استيراد البيانات','Data imported'], importBad:['الملف غير صالح: لازم يكون نسخة JSON من نفس النظام','Invalid file: it must be a JSON backup from this system'],
 copy:['نسخ','Copy'], copied:['تم النسخ','Copied'], download:['تحميل الملف','Download file'],
 openTickets:['تذكرة مفتوحة','open'], loadNone:['لا يوجد موظفين نشطين','No active agents'],
 a_created:['أنشأ التذكرة','created the ticket'], a_status:['غيّر الحالة','changed status'], a_assign:['أسند التذكرة إلى','assigned to'], a_unassign:['ألغى الإسناد','unassigned the ticket'],
 a_prio:['غيّر الأولوية','changed priority'], a_field:['عدّل','updated'], a_comment:['أضاف رداً','added a reply'], a_internal:['أضاف ملاحظة داخلية','added an internal note'], a_req:['سجّل رد مقدم الطلب','logged a requester reply'],
 a_work:['سجّل وقت','logged time'], a_autoclose:['أُغلقت تلقائياً بعد فترة الحل','auto-closed after the resolved period'], a_autoreopen:['أُعيدت للتنفيذ تلقائياً بعد رد مقدم الطلب','moved back to In progress after requester reply'],
 a_autoassign:['إسناد تلقائي إلى','auto-assigned to'], a_link:['ربط بالتذكرة','linked to'], a_csat:['سجّل تقييم','recorded rating'], a_edit:['عدّل بيانات التذكرة','edited ticket details'], a_check:['حدّث قائمة المهام','updated the checklist'],
 system:['النظام','System'], u_d:['ي','d'], u_h:['س','h'], u_m:['د','m'],
 bulkDone:['تم التطبيق على التذاكر المحددة','Applied to selected tickets'], noneSelected:['اختر إجراء أولاً','Choose an action first'],
 confirmDelGeneric:['حذف هذا العنصر نهائياً؟','Delete this item permanently?'],
 tg:['تذاكر','tickets'], rateFirst:['متاح بعد حل التذكرة','Available once resolved'], reqInfo:['بيانات مقدم الطلب','Requester'],
 /* auth & team */
 signIn:['تسجيل الدخول','Sign in'], signInSub:['ادخل ببريدك وكلمة المرور اللي حددها مدير النظام','Use the email and password set by your admin'],
 password:['كلمة المرور','Password'], password2:['تأكيد كلمة المرور','Confirm password'], pwMismatch:['كلمتا المرور غير متطابقتين','Passwords do not match'], pwHint:['8 أحرف على الأقل','At least 8 characters'],
 setupTitle:['إعداد النظام لأول مرة','First-time setup'], setupSub:['أنشئ حساب مدير النظام (Admin). باقي الفريق تضيفهم بعد كده من الإعدادات.','Create the admin account. Add the rest of the team later from Settings.'],
 loadDemo:['تحميل بيانات تجريبية للتجربة (تذاكر وأصول وموظفين وهميين)','Load demo data to explore (sample tickets, assets and agents)'], startBtn:['ابدأ','Get started'],
 logout:['تسجيل الخروج','Sign out'], myAccount:['حسابي','My account'], changePw:['تغيير كلمة المرور','Change password'], currentPw:['كلمة المرور الحالية','Current password'], newPw:['كلمة المرور الجديدة','New password'],
 pwChanged:['تم تغيير كلمة المرور. الجلسات الأخرى اتقفلت.','Password changed. Other sessions were signed out.'],
 role:['الصلاحية','Role'], r_admin:['مدير النظام','Admin'], r_agent:['موظف دعم','Agent'], noLogin:['بدون دخول','No login'], access:['الدخول','Access'],
 setAccess:['الصلاحية وكلمة المرور','Role & password'], revoke:['إلغاء الدخول','Revoke login'], newAgent:['إضافة موظف','Add agent'],
 pwOptional:['اختياري — اتركها فارغة لإضافة الموظف بدون دخول','Optional — leave empty to add without a login'], pwKeep:['اتركها فارغة للإبقاء على كلمة المرور الحالية','Leave empty to keep the current password'],
 confirmRevoke:['إلغاء دخول هذا الموظف؟ هيتعمل له تسجيل خروج فوراً.','Revoke this agent\'s login? They will be signed out immediately.'],
 live:['متصل — تحديث لحظي','Live'], offlineS:['غير متصل — جاري إعادة الاتصال','Reconnecting…'],
 adminOnly:['الإعدادات دي متاحة لمدير النظام فقط.','Only admins can change these settings.'], prefs:['تفضيلاتي على هذا الجهاز','My preferences on this device'],
 remoteDeleted:['التذكرة اتحذفت بواسطة مستخدم آخر','This ticket was deleted by another user'], reloaded:['تم تحديث البيانات من السيرفر','Data refreshed from the server'],
 loading:['جاري التحميل…','Loading…'], you:['أنت','you'],
 /* server error codes */
 e_v_pw:['كلمة المرور لازم تكون 8 أحرف على الأقل','Password must be at least 8 characters'], e_dup_email:['البريد مستخدم لموظف آخر','Email already used by another agent'],
 e_dup_tag:['كود الأصل مستخدم بالفعل','Asset tag already exists'], e_in_use:['لا يمكن الحذف: العنصر مستخدم. عطّله أو انقل التذاكر أولاً.','Cannot delete: it is in use. Deactivate it or move its tickets first.'],
 e_forbidden:['ليس لديك صلاحية لهذا الإجراء','You do not have permission for this action'], e_last_admin:['لازم يفضل مدير نظام واحد على الأقل','At least one admin must remain'],
 e_self:['لا يمكن تنفيذ هذا على حسابك الحالي','You cannot do this to your own account'], e_bad_login:['البريد أو كلمة المرور غير صحيحة','Incorrect email or password'],
 e_locked:['محاولات خاطئة كثيرة. جرّب بعد شوية','Too many failed attempts. Try again shortly'],
 e_locked_n:['محاولات خاطئة كثيرة على الحساب ده. جرّب بعد {n} دقيقة','Too many failed attempts for this account. Try again in {n} min'],
 e_bad_setup_code:['كود الإعداد غير صحيح. هتلاقيه في الـ logs بتاعة السيرفر','Wrong setup code. You will find it in the server logs'],
 setupCode:['كود الإعداد (Setup code)','Setup code'],
 setupCodeHint:['مكتوب في الـ logs بتاعة السيرفر. شغّل الأمر ده على السيرفر:','Printed in the server log. Run this on the server:'], e_bad_current:['كلمة المرور الحالية غير صحيحة','Current password is incorrect'],
 e_offline:['تعذر الاتصال بالسيرفر','Cannot reach the server'], e_server_error:['خطأ في السيرفر — راجع الـ logs','Server error — check the logs'],
 e_csat_open:['التقييم متاح بعد حل التذكرة','Rating is available once resolved'], e_v_min:['الدقائق من 1 إلى 1440','Minutes must be between 1 and 1440'],
 e_not_found:['العنصر غير موجود (ربما اتحذف)','Item not found (it may have been deleted)'], e_already_setup:['النظام متعمل له إعداد بالفعل — سجّل دخول','Already set up — please sign in'],
 e_too_large:['الملف كبير جداً','File too large'],
 requesters:['مقدمو الطلبات','Requesters'], audit:['سجل التدقيق','Audit log'], langToggle:['English','العربية'],
 rqSub:['كل الأشخاص اللي فتحوا تذاكر، وتاريخ طلباتهم','Everyone who opened tickets, with their history'], newRequester:['مقدم طلب جديد','New requester'],
 rqSearch:['ابحث بالاسم أو البريد أو القسم…','Search name, email or department…'], phone:['التليفون','Phone'], totalTickets:['التذاكر','Tickets'], lastTicket:['آخر طلب','Last request'],
 noRequesters:['مفيش مقدمي طلبات','No requesters'], history:['سجل الطلبات','Request history'], mergeInto:['دمج في…','Merge into…'], merge:['دمج','Merge'],
 mergeHint:['هيتم نقل كل تذاكر الشخص ده للشخص اللي هتختاره، وبعدين يتمسح السجل المكرر','All tickets move to the selected person, then this duplicate is removed'],
 confirmMerge:['دمج "{a}" في "{b}"؟ كل التذاكر هتتنقل ومش هتقدر ترجع الدمج.','Merge "{a}" into "{b}"? All tickets will move. This cannot be undone.'], merged:['تم الدمج — اتنقلت {n} تذكرة','Merged — {n} ticket(s) moved'],
 pickRequester:['اكتب اسم أو بريد، أو اختار من القايمة','Type a name or email, or pick from the list'], ticketsN:['{n} تذكرة','{n} tickets'],
 portalLink:['رابط المتابعة لمقدم الطلب','Requester tracking link'], fromPortal:['من البوابة','Portal'],
 bizHours:['ساعات العمل والإجازات','Business hours & holidays'], bizSub:['الـ SLA بيتحسب في ساعات العمل بس لما تختار "ساعات العمل"','SLA counts only working time when "Business hours" is selected'],
 calMode:['حساب الـ SLA','SLA clock'], cal24:['24/7 — على مدار الساعة','24/7 — around the clock'], calBiz:['ساعات العمل بس','Business hours only'], tz:['المنطقة الزمنية','Time zone'],
 workday:['يوم عمل','Working day'], from:['من','From'], to:['إلى','To'], holidays:['الإجازات الرسمية','Holidays'], holidayName:['اسم الإجازة','Holiday name'], addHoliday:['إضافة إجازة','Add holiday'],
 noHolidays:['مفيش إجازات مضافة','No holidays added'], saveCal:['حفظ ساعات العمل','Save business hours'], calPreview:['مثال: تذكرة P3 مفتوحة دلوقتي هتستحق الحل في','Example: a P3 ticket opened now would be due'],
 e_bad_tz:['المنطقة الزمنية غير صحيحة','Unknown time zone'], e_bad_hours:['وقت البداية لازم يكون قبل وقت النهاية','Start time must be before end time'], e_no_workdays:['اختار يوم عمل واحد على الأقل','Pick at least one working day'],
 d0:['الأحد','Sunday'], d1:['الإثنين','Monday'], d2:['الثلاثاء','Tuesday'], d3:['الأربعاء','Wednesday'], d4:['الخميس','Thursday'], d5:['الجمعة','Friday'], d6:['السبت','Saturday'],
 workingLeft:['متبقي من وقت العمل','working time left'],
 portal:['بوابة الطلبات (Portal)','Request portal'], portalSub:['صفحة للموظفين يفتحوا منها طلباتهم ويتابعوها من غير حساب','A page where employees open and track their requests without an account'],
 portalOn:['تشغيل البوابة','Enable the portal'], portalUrl:['رابط البوابة','Portal address'], allowedDomains:['النطاقات المسموح بيها (اختياري)','Allowed email domains (optional)'],
 allowedHint:['مثلاً: company.com — لو سبتها فاضية أي بريد يقدر يفتح طلب','e.g. company.com — leave empty to accept any email'],
 portalMailNote:['متابعة "طلباتي" بكود على الإيميل، وإشعار مقدم الطلب بالردود، محتاجين إعدادات SMTP','"My requests" sign-in and requester emails need SMTP settings'],
 open:['فتح','Open'], auditSub:['سجل غير قابل للتعديل لكل تصرفات الإدارة والأمان','A tamper-evident record of admin and security actions'],
 verify:['التحقق من سلامة السجل','Verify integrity'], verifyOk:['السجل سليم — {n} سجل، ومفيش أي تعديل','Intact — {n} entries, no tampering detected'],
 verifyBad:['تحذير: السجل اتعدّل عند السطر رقم {n}','Warning: the log was altered at entry #{n}'], loadMore:['تحميل المزيد','Load more'],
 actor:['المنفّذ','Actor'], action:['الإجراء','Action'], target:['العنصر','Target'], details:['التفاصيل','Details'], ip:['IP','IP'], when:['الوقت','Time'], allActions:['كل الإجراءات','All actions'],
 retention:['السجلات بتتحفظ {n} يوم','Entries are kept for {n} days'], retentionForever:['السجلات بتتحفظ للأبد','Entries are kept forever'],
 g_auth:['الدخول والأمان','Sign-in & security'], g_settings:['الإعدادات','Settings'], g_agent:['الموظفين والصلاحيات','Agents & access'], g_ticket:['التذاكر','Tickets'], g_trash:['السلة','Trash'],
 g_data:['البيانات والنسخ','Data & backups'], g_portal:['البوابة','Portal'], g_requester:['مقدمو الطلبات','Requesters'], g_team:['الفرق','Teams'], g_category:['التصنيفات','Categories'], g_canned:['الردود الجاهزة','Canned replies'],
 offlineEd:['نسخة Offline — جهاز واحد','Offline edition — single device'], workingAs:['أعمل باسم','Working as'],
 offlineNote:['البيانات محفوظة في المتصفح على الجهاز ده بس. صدّر نسخة JSON بانتظام، وتقدر تستوردها في نسخة الفريق.','Data is stored in this browser on this device only. Export JSON regularly; you can import it into the team edition.'],
 e_offline_unsupported:['الخاصية دي متاحة في نسخة الفريق بس','This feature is available in the team edition only'], e_storage:['تعذر الحفظ في المتصفح — صدّر نسخة احتياطية','Browser storage failed — export a backup'],
 e_rate_limited:['طلبات كتير ورا بعض، استنى شوية وجرّب تاني','Too many requests, please wait and try again'],
 fileCol:['الملف','File'], sizeCol:['الحجم','Size'],
 files:['المرفقات','Attachments'], dropHere:['اسحب الملفات هنا، أو الصق Screenshot بـ Ctrl+V، أو','Drop files here, paste a screenshot with Ctrl+V, or'], chooseFiles:['اختار ملفات','choose files'],
 noFiles:['مفيش مرفقات','No attachments'], uploading:['جاري رفع {n} ملف…','Uploading {n} file(s)…'], uploaded:['تم رفع {n} ملف','{n} file(s) uploaded'], maxSize:['أقصى حجم للملف {n} MB','Max {n} MB per file'],
 e_blocked_type:['نوع الملف ده ممنوع لأسباب أمنية (ملفات تشغيلية زي exe وbat)','This file type is blocked for security (executables like exe, bat)'],
 e_too_many_files:['وصلت للحد الأقصى من المرفقات على التذكرة دي','This ticket reached the attachment limit'], e_empty_file:['الملف فاضي','The file is empty'],
 e_file_missing:['الملف مش موجود على السيرفر','The file is missing on the server'], fileTooBig:['"{f}" أكبر من {n} MB','"{f}" is larger than {n} MB'],
 confirmDelFile:['حذف المرفق ده؟','Delete this attachment?'], download:['تحميل','Download'], copyLink:['نسخ رابط التذكرة','Copy ticket link'], linkCopied:['تم نسخ الرابط','Link copied'],
 notifications:['الإشعارات','Notifications'], markAllRead:['تعليم الكل كمقروء','Mark all as read'], noNotifs:['مفيش إشعارات','No notifications'],
 n_assigned:['{by} أسند لك {key}','{by} assigned {key} to you'], n_assigned_auto:['اتسندت لك {key} تلقائياً','{key} was auto-assigned to you'], n_comment:['{by} أضاف رد على {key}','{by} replied on {key}'],
 n_requester:['رد جديد من مقدم الطلب على {key}','New requester reply on {key}'], n_attachment:['{by} أرفق "{name}" في {key}','{by} attached "{name}" to {key}'],
 n_sla_risk:['{key} قربت تخرق الـ SLA','{key} is close to breaching SLA'], n_sla_breach:['{key} خرقت الـ SLA','{key} breached SLA'], n_urgent:['تذكرة عاجلة P{p} من غير مسؤول: {key}','Urgent P{p} ticket with no assignee: {key}'],
 notifSettings:['الإشعارات','Notifications'], desktopNotif:['إشعارات سطح المكتب (لما التاب مش ظاهر)','Desktop notifications (when the tab is in the background)'],
 desktopNeedsHttps:['المتصفح بيسمح بالإشعارات دي على HTTPS بس (مثلاً عن طريق Cloudflare) أو localhost.','Browsers allow these only over HTTPS (e.g. via Cloudflare) or on localhost.'],
 desktopDenied:['الإشعارات متقفلة من إعدادات المتصفح للموقع ده','Notifications are blocked in this browser for this site'], emailNotif:['إشعارات بالإيميل (إسناد، رد مقدم الطلب، خرق SLA، تذكرة عاجلة)','Email notifications (assignment, requester reply, SLA breach, urgent ticket)'],
 emailSection:['الإيميل (SMTP)','Email (SMTP)'], mailOn:['مُفعّل — الإشعارات المهمة بتتبعت بالإيميل','Enabled — important notifications are emailed'], mailOff:['مش مُفعّل. حط إعدادات SMTP في ملف .env (README ← الإشعارات)','Not configured. Add SMTP settings to .env (README → Notifications)'],
 mailNoLinks:['حط APP_URL في .env علشان الإيميلات يبقى فيها رابط التذكرة','Set APP_URL in .env so emails include the ticket link'], mailTest:['إرسال إيميل تجريبي لنفسي','Send me a test email'],
 mailTestOk:['اتبعت إيميل تجريبي على {to}','Test email sent to {to}'], e_mail_failed:['فشل الإرسال','Sending failed'], e_mail_off:['الإيميل مش مُفعّل','Email is not configured'],
 a_attach:['أرفق','attached'], a_attdel:['حذف المرفق','removed attachment'],
 e_exists:['العنصر موجود بالفعل — مش محتاج استرجاع','The item already exists — nothing to restore'],
 e_backup_failed:['فشل عمل نسخة احتياطية — العملية اتلغت. راجع الـ logs','Backup failed — the operation was cancelled. Check the logs'],
 trash:['سلة المحذوفات','Trash'], trashSub:['العناصر المحذوفة بتفضل هنا {n} يوم وبعدين بتتمسح نهائياً تلقائياً','Deleted items stay here for {n} days, then are removed permanently'],
 trashSubForever:['العناصر المحذوفة بتفضل هنا لحد ما تمسحها بنفسك','Deleted items stay here until you remove them'],
 trashEmpty:['السلة فاضية','Trash is empty'], restore:['استرجاع','Restore'], purge:['حذف نهائي','Delete forever'], emptyTrash:['تفريغ السلة','Empty trash'],
 restored:['تم الاسترجاع','Restored'], movedToTrash:['اتنقل لسلة المحذوفات','Moved to trash'], deletedBy:['حذفه','Deleted by'], deletedAt:['وقت الحذف','Deleted'], purgeIn:['يتمسح بعد','Removed in'],
 confirmTrash:['نقل لسلة المحذوفات؟ تقدر تسترجعه من السلة.','Move to trash? You can restore it from the Trash.'],
 confirmPurge:['حذف نهائي؟ مش هتقدر تسترجعه تاني (إلا من نسخة احتياطية).','Delete forever? It cannot be restored (except from a backup).'],
 confirmEmpty:['تفريغ السلة بالكامل نهائياً؟','Permanently delete everything in the trash?'],
 c_tickets:['تذكرة','Ticket'], c_assets:['أصل','Asset'], c_kb:['مقال','Article'], days:['يوم','days'],
 backups:['النسخ الاحتياطية','Backups'], backupNow:['Backup الآن','Back up now'], backupDone:['تم عمل نسخة احتياطية','Backup created'],
 autoBackupOn:['نسخة تلقائية كل {h} ساعة · بيتحفظ آخر {k} نسخة من كل نوع','Automatic backup every {h}h · newest {k} kept per kind'], autoBackupOff:['النسخ التلقائي متوقف (AUTO_BACKUP_HOURS=0)','Automatic backup is off (AUTO_BACKUP_HOURS=0)'],
 noBackups:['لسه مفيش نسخ احتياطية','No backups yet'], bk_manual:['يدوي','Manual'], bk_auto:['تلقائي','Automatic'], bk_preimport:['قبل الاستيراد','Before import'],
 restoreHint:['الاسترجاع من نسخة بيتعمل من السيرفر (README ← الاسترجاع) علشان يتعمل والنظام واقف.','Restoring a backup is done on the server (README → Restore) so it happens while the app is stopped.'],
 importDone:['تم الاستيراد. نسخة الأمان قبل الاستيراد: {f}','Imported. Safety backup taken before import: {f}'],
 a_restored:['استرجع التذكرة من سلة المحذوفات','restored the ticket from the trash'], e_bad_op:['طلب غير صالح','Invalid request'], e_csrf:['طلب مرفوض','Request rejected'],
};
const prefs=(()=>{try{return JSON.parse(localStorage.getItem('itset.sd.prefs')||'{}')}catch(e){return{}}})();
function savePrefs(){try{localStorage.setItem('itset.sd.prefs',JSON.stringify(prefs))}catch(e){}}
let lang=prefs.lang==='en'?'en':'ar';
const t=k=>L[k]?L[k][lang==='ar'?0:1]:k;
const errMsg=(c,x)=>{if(c==='locked'&&x&&x.retryAfter){const m=Math.max(1,Math.ceil(x.retryAfter/60));return t('e_locked_n').replace('{n}',m)}return L['e_'+c]?t('e_'+c):L[c]?t(c):t('e_server_error')};
const loc=()=>lang==='ar'?'ar-EG-u-nu-latn':'en-GB';

/* ================= helpers ================= */
const {MIN,HR,DAY,STATUSES,TYPES,isOpen,prio}=C;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let skew=0;const now=()=>Date.now()+skew;
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
function fmtDate(ts){if(!ts)return'—';try{return new Intl.DateTimeFormat(loc(),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(ts)}catch(e){return new Date(ts).toLocaleString()}}
function rel(ts){const d=ts-now(),a=Math.abs(d);const rtf=new Intl.RelativeTimeFormat(loc(),{numeric:'auto'});if(a<HR)return rtf.format(Math.round(d/MIN),'minute');if(a<DAY)return rtf.format(Math.round(d/HR),'hour');return rtf.format(Math.round(d/DAY),'day')}
function dur(ms){ms=Math.abs(ms);const d=Math.floor(ms/DAY),h=Math.floor(ms%DAY/HR),m=Math.floor(ms%HR/MIN);
 if(d)return `${d}${t('u_d')} ${h}${t('u_h')}`;if(h)return `${h}${t('u_h')} ${m}${t('u_m')}`;return `${m}${t('u_m')}`}
function minsTxt(m){m=Math.round(m||0);const h=Math.floor(m/60),r=m%60;return h?`${h}${t('u_h')} ${r}${t('u_m')}`:`${r}${t('u_m')}`}

/* ================= API ================= */
const OFF=!!window.ITSET_LOCAL;
const F=k=>!!(U.features&&U.features[k]);
async function api(method,url,body){
 if(OFF)return window.ITSET_LOCAL.handle(method,url,body);
 const opt={method,headers:{},credentials:'same-origin'};
 if(method!=='GET'){opt.headers['x-itset']='1';if(body!==undefined){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}}
 let r;try{r=await fetch(url,opt)}catch(e){throw{code:'offline'}}
 let j={};try{j=await r.json()}catch(_){}
 if(r.status===401&&!['/api/login','/api/setup','/api/me/password'].includes(url)){showAuth();throw{code:'auth',silent:true}}
 if(!r.ok)throw{code:j.error||'server_error',status:r.status,retryAfter:j.retryAfter,detail:j.detail};
 return j;
}
const fail=e=>{if(!e||!e.silent)toast(errMsg(e&&e.code,e),'err')};

/* ================= state ================= */
let S=null;
const U={view:'dashboard',f:{q:'',status:'',priority:'',assignee:'',category:'',type:'',asset:'',quick:'open'},sort:{k:'updatedAt',d:-1},sel:new Set(),open:null,tab:'conv',kind:'reply',showClosed:false,kbq:'',period:30,form:null,me:null,live:false,busy:false};
const viewHash=['dashboard','tickets','board','requesters','assets','kb','reports','trash','audit','settings'];
try{const h=location.hash.replace('#','');if(viewHash.includes(h))U.view=h}catch(e){}
const agent=id=>S.agents.find(a=>a.id===id);
const cat=id=>S.categories.find(c=>c.id===id);
const team=id=>S.teams.find(x=>x.id===id);
const asset=id=>S.assets.find(a=>a.id===id);
const tk=id=>S.tickets.find(x=>x.id===id);
const meId=()=>U.me&&U.me.id;
const isAdmin=()=>U.me&&U.me.role==='admin';
const agentName=id=>id==='requester'?t('requester'):id==='system'?t('system'):(id&&agent(id)?.name)||(id?'—':t('unassigned'));
const sla=x=>C.sla(S,x,now()), resp=x=>C.resp(S,x,now()), openLoad=id=>C.openLoad(S,id);

/* built-in default/demo texts are shown in the viewer's language; stored data is not changed */
const loc10n=o=>C.localize(o,lang);
function upsert(coll,d){loc10n(d);const a=S[coll];const i=a.findIndex(o=>o.id===d.id);if(i>=0)a[i]=d;else a.push(d)}
function remove(coll,id){S[coll]=S[coll].filter(o=>o.id!==id)}

/* ================= live updates (SSE) ================= */
let es=null,rTimer=null;
function connectEvents(){
 if(es){try{es.close()}catch(e){}}
 es=new EventSource('/api/events');
 es.onopen=()=>{const was=U.live;U.live=true;setLive();if(was===false&&U.wasDown){U.wasDown=false;refresh(true)}};
 es.onerror=()=>{U.live=false;U.wasDown=true;setLive();if(es.readyState===2){setTimeout(()=>{if(U.me)refresh(true).then(ok=>{if(ok===true)connectEvents()})},4000)}};
 es.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
  if(m.t==='ticket')upsert('tickets',m.d);
  else if(m.t==='ticket-del'){remove('tickets',m.id);U.sel.delete(m.id);if(U.open===m.id){U.open=null;toast(t('remoteDeleted'),'err')}}
  else if(m.t==='ent'){upsert(m.coll,m.d);if(m.coll==='agents'&&m.d.id===meId()&&m.d.role&&m.d.role!==U.me.role){U.me.role=m.d.role;scheduleRender(true);return}}
  else if(m.t==='ent-del')remove(m.coll,m.id);
  else if(m.t==='notif'){onNotif(m.d);return}
  else if(m.t==='trash'){if(S.trash)upsert('trash',m.d)}
  else if(m.t==='trash-del'){if(S.trash)remove('trash',m.id)}
  else if(m.t==='settings'){S.settings=m.settings;S.sla=m.sla}
  else if(m.t==='reload'){refresh(true).then(()=>toast(t('reloaded')));return}
  scheduleRender();
 };
}
function setLive(){const d=$('#liveDot');if(d){d.className='live '+(U.live?'on':'off');d.title=U.live?t('live'):t('offlineS');d.querySelector('span').textContent=U.live?t('live'):t('offlineS')}}
function scheduleRender(full){clearTimeout(rTimer);rTimer=setTimeout(()=>{if(full)return render();softRender()},120)}
function editing(scope){const ae=document.activeElement;return ae&&scope&&scope.contains(ae)&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)}
function softRender(){if(!S||!$('#main'))return;renderNav();if(!editing($('#main')))renderMain();if(!editing($('#drawer')))renderDrawer()}

async function refresh(silent){
 try{const j=await api('GET','/api/bootstrap');S=j.state;U.me=j.me;U.features=j.features||{};U.version=j.version;U.license=j.license||{};skew=j.serverTime-Date.now();if(j.storageOk===false)setTimeout(()=>toast(t('e_storage'),'err'),300);
  if(U.me.prefs&&(U.me.prefs.lang==='ar'||U.me.prefs.lang==='en')&&U.me.prefs.lang!==lang){lang=U.me.prefs.lang;prefs.lang=lang;savePrefs()}
  loc10n(S);U.notifs=j.notifications||{items:[],unread:0};U.mail=j.mail||{};U.limits=j.limits||{maxUploadMB:15};if(U.open&&!tk(U.open))U.open=null;render();return true}
 catch(e){if(e&&e.code==='auth')return 'auth';if(!silent)fail(e);return false}
}

/* ================= icons ================= */
const I={
 dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
 tickets:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 5v12" stroke-dasharray="2 2"/></svg>',
 board:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>',
 requesters:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>',
 audit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
 assets:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>',
 kb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6M9 11h6"/></svg>',
 reports:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
 clip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg>',
 file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 x:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>'};

/* ================= UI atoms ================= */
const stChip=s=>`<span class="chip st-${s}">${t('st_'+s)}</span>`;
const pChip=p=>`<span class="chip plain p${p} mono">P${p}</span>`;
const tyLbl=y=>`<span class="type ty-${y}"><i></i>${t('tys_'+y)}</span>`;
const who=id=>id?`<span class="who"><span class="av">${esc(initials(agentName(id)))}</span>${esc(agentName(id))}</span>`:`<span class="muted">${t('unassigned')}</span>`;
const opt=(v,l,sel)=>`<option value="${esc(v)}"${String(sel)===String(v)?' selected':''}>${esc(l)}</option>`;
const agentOpts=(sel,withNone=true)=>(withNone?opt('',t('unassigned'),sel||''):'')+S.agents.filter(a=>a.active||a.id===sel).map(a=>opt(a.id,a.name+(a.active?'':' (—)'),sel)).join('');
const catOpts=sel=>S.categories.map(c=>opt(c.id,c.name,sel)).join('');
function toast(msg,type){const el=document.createElement('div');el.className='toast'+(type==='err'?' err':'');el.textContent=msg;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),3600)}
function slaChip(x){const s=sla(x);if(s.remWork!=null&&!s.done&&s.st!=='breached'&&s.st!=='paused')s.rem=s.remWork;
 if(s.done)return `<span class="chip sla-${s.st==='met'?'met':'breached'}">${s.st==='met'?'✓ '+t('met'):t('breach')}</span>`;
 if(s.st==='breached')return `<span class="chip sla-breached num">${t('late')} ${dur(s.rem)}</span>`;
 if(s.st==='paused')return `<span class="chip sla-paused">${t('paused')}</span>`;
 return `<span class="chip sla-${s.st} num">${dur(s.rem)} ${t('left')}</span>`}

/* ================= filtering ================= */
function quickMatch(x,q){const me=meId();
 switch(q){case'open':return isOpen(x);case'mine':return isOpen(x)&&x.assigneeId===me;case'unassigned':return isOpen(x)&&!x.assigneeId;
  case'overdue':return isOpen(x)&&sla(x).st==='breached';case'risk':return isOpen(x)&&sla(x).st==='risk';
  case'today':return new Date(x.createdAt).toDateString()===new Date(now()).toDateString();default:return true}}
function filtered(ignoreQuick){
 const f=U.f,q=f.q.trim().toLowerCase();
 let a=S.tickets.filter(x=>(ignoreQuick||quickMatch(x,f.quick))
  &&(!f.status||x.status===f.status)&&(!f.priority||String(x.priority)===f.priority)&&(!f.type||x.type===f.type)
  &&(!f.category||x.categoryId===f.category)&&(!f.asset||x.assetId===f.asset)
  &&(!f.assignee||(f.assignee==='none'?!x.assigneeId:x.assigneeId===f.assignee))
  &&(!q||[x.key,x.title,x.desc,x.requester?.name,x.requester?.email,(x.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)));
 const {k,d}=U.sort;
 const val=x=>k==='sla'?(isOpen(x)?sla(x).rem:Infinity):k==='assignee'?agentName(x.assigneeId):k==='category'?(cat(x.categoryId)?.name||''):k==='key'?(+(String(x.key).match(/(\d+)$/)||[0,0])[1]):x[k];
 a.sort((p,r)=>{const A=val(p),B=val(r);return(A>B?1:A<B?-1:0)*d});
 return a;
}

/* ================= theme ================= */
function applyTheme(){const th=prefs.theme||'system';const r=document.documentElement;
 if(th==='system'){if(r.dataset.itsetTheme){r.removeAttribute('data-theme');delete r.dataset.itsetTheme}}else{r.setAttribute('data-theme',th);r.dataset.itsetTheme='1'}
 r.lang=lang;r.dir=lang==='ar'?'rtl':'ltr'}
function setLang(l){lang=l==='en'?'en':'ar';prefs.lang=lang;savePrefs();if(S){loc10n(S);U.cal=null;render()}else showAuth();
 if(S&&!OFF)api('PUT','/api/me/prefs',{lang}).then(j=>{if(U.me)U.me.prefs=j.prefs}).catch(()=>{})}

/* ================= auth screens ================= */
async function showAuth(){
 if(es){try{es.close()}catch(e){}es=null}
 U.me=null;S=null;U.open=null;$('#drawer').innerHTML='';$('#modal').innerHTML='';
 applyTheme();
 let st={needsSetup:false};try{st=await api('GET','/api/status')}catch(e){}
 const setup=st.needsSetup;
 $('#app').innerHTML=`<div class="auth"><form class="auth-card" id="authForm" novalidate>
  <div class="brand"><div class="brand-mark">IT</div><div><b>${t('app')}</b><small>${t('suite')}</small></div></div>
  <div><h1>${setup?t('setupTitle'):t('signIn')}</h1><p class="muted" style="margin:4px 0 0">${setup?t('setupSub'):t('signInSub')}</p></div>
  ${setup?`<label class="field"><span>${t('setupCode')}</span><input type="text" id="auCode" maxlength="40" autocomplete="off" dir="ltr" class="mono" placeholder="XXXX-XXXX" required><small class="muted">${t('setupCodeHint')}</small><code class="cmd" dir="ltr">docker compose logs servicedesk | grep "SETUP CODE"</code></label>
  <label class="field"><span>${t('name')}</span><input type="text" id="auName" maxlength="60" autocomplete="name" required></label>`:''}
  <label class="field"><span>${t('email')}</span><input type="email" id="auEmail" maxlength="120" autocomplete="username" dir="ltr" required></label>
  <label class="field"><span>${t('password')}</span><input type="password" id="auPw" maxlength="200" autocomplete="${setup?'new-password':'current-password'}" dir="ltr" required>${setup?`<small class="muted">${t('pwHint')}</small>`:''}</label>
  ${setup?`<label class="field"><span>${t('password2')}</span><input type="password" id="auPw2" maxlength="200" autocomplete="new-password" dir="ltr" required></label>
   <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px"><input type="checkbox" id="auDemo" style="margin-top:3px"> ${t('loadDemo')}</label>`:''}
  <small class="ferr" id="auErr" role="alert"></small>
  <button class="btn pri" type="submit" id="auBtn" style="justify-content:center">${setup?t('startBtn'):t('signIn')}</button>
  <div class="auth-foot"><button type="button" class="btn sm ghost" data-act="toggleLang">${lang==='ar'?'English':'العربية'}</button></div>
  <div class="credit">${t('app')}${st.version?` v${esc(st.version)}`:''} · ${t('designedBy')} ${t('devName')}${st.licensee?`<br>${t('licensedTo')} ${esc(st.licensee)}`:''}</div>
 </form></div>`;
 $('#authForm').addEventListener('submit',async e=>{e.preventDefault();const er=$('#auErr');er.textContent='';
  const email=$('#auEmail').value.trim(),pw=$('#auPw').value;
  if(!C.EMAIL_RE.test(email)){er.textContent=t('v_email');return}
  let body,url;
  if(setup){const code=$('#auCode').value.trim();if(!code){er.textContent=t('e_bad_setup_code');return}
   const name=$('#auName').value.trim();if(!name){er.textContent=t('v_req');return}
   if(pw.length<8){er.textContent=t('e_v_pw');return}if(pw!==$('#auPw2').value){er.textContent=t('pwMismatch');return}
   url='/api/setup';body={setupCode:code,name,email,password:pw,demo:$('#auDemo').checked,lang}}
  else{if(!pw){er.textContent=t('v_req2');return}url='/api/login';body={email,password:pw}}
  $('#auBtn').disabled=true;
  try{await api('POST',url,body);await start()}catch(x){er.textContent=errMsg(x.code,x);if(x.code==='already_setup')setTimeout(showAuth,1200)}
  finally{const b=$('#auBtn');if(b)b.disabled=false}
 });
 setTimeout(()=>$(setup?'#auCode':'#auEmail')?.focus(),30);
}
async function start(){
 $('#app').innerHTML=`<div class="auth"><div class="muted">${t('loading')}</div></div>`;
 const r=await refresh(true);
 if(r===true){openFromHash();if(!F('live')){U.live=null;return}return connectEvents()}
 if(r!=='auth')showAuth();
}

/* ================= shell ================= */
function render(){if(!S)return;applyTheme();
 const me=agent(meId());
 $('#app').innerHTML=`<div class="app"><aside class="side" id="side"></aside><div class="mainwrap">
  <header class="top">
   <div class="search">${I.search}<input type="search" id="gsearch" placeholder="${t('search')}" value="${esc(U.f.q)}" aria-label="${t('search')}"></div>
   <div class="grow"></div>
   ${F('live')?`<span id="liveDot" class="live ${U.live?'on':'off'}" title="${U.live?t('live'):t('offlineS')}"><i></i><span>${U.live?t('live'):t('offlineS')}</span></span>`:`<span class="demo-pill offline-pill">${t('offlineEd')}</span>`}
   ${S.demo?`<span class="demo-pill">${t('demo')}</span>`:''}
   <button class="btn ghost langbtn" data-act="lang" title="${t('language')}" aria-label="${t('language')}: ${t('langToggle')}" lang="${lang==='ar'?'en':'ar'}">${lang==='ar'?'EN':'ع'}</button>
   ${F('live')?`<button class="btn ghost bell" data-act="notifs" aria-label="${t('notifications')}" title="${t('notifications')}">${I.bell}<span class="bcnt num" id="bellCnt"${U.notifs.unread?'':' hidden'}>${U.notifs.unread>99?'99+':U.notifs.unread}</span></button>`:''}
   ${F('auth')?`<button class="btn ghost userbtn" data-act="account"><span class="av">${esc(initials(me?.name))}</span><span class="un">${esc(me?.name||'')}<small>${t('r_'+(U.me.role))}</small></span></button>`
    :`<label class="me-sel">${t('workingAs')} <select data-ch="localMe" aria-label="${t('workingAs')}">${S.agents.filter(a=>a.active||a.id===meId()).map(a=>opt(a.id,a.name,meId())).join('')}</select></label>`}
   <button class="btn pri" data-act="new">${I.plus}${t('newTicket')}</button>
  </header><main id="main"></main></div></div>`;
 renderNav();renderMain();renderDrawer();updateBell();
}
function renderNav(){
 const side=$('#side');if(!side)return;
 const open=S.tickets.filter(isOpen).length;
 const items=[['dashboard'],['tickets',open],['board'],['requesters',(S.requesters||[]).length],['assets',S.assets.length],['kb',S.kb.length],['reports']];
 if(isAdmin())items.push(['trash',(S.trash||[]).length]);if(isAdmin()&&F('audit'))items.push(['audit']);items.push(['settings']);
 side.innerHTML=`<div class="brand"><div class="brand-mark">IT</div><div><b>${t('app')}</b><small>${t('suite')}</small></div></div>
 <nav class="nav">${items.map(([v,c])=>`<button class="${U.view===v?'on':''}" data-act="view" data-v="${v}">${I[v]}<span class="lb">${t(v)}</span>${c!=null?`<span class="cnt num">${c}</span>`:''}</button>`).join('')}</nav>
 <div class="side-foot">${t('shortcuts')}: <kbd>N</kbd> ${t('sc_new')} · <kbd>/</kbd> ${t('sc_search')} · <kbd>Esc</kbd> ${t('sc_esc')}
  <div class="side-credit"><button class="linkish" data-act="about">${t('about')} ${t('app')}</button><span>v${esc(U.version||'')} · © Abdullah Amer</span></div></div>`;
}
function renderMain(){const m=$('#main');if(!m)return;
 if((U.view==='trash'&&!isAdmin())||(U.view==='audit'&&!(isAdmin()&&F('audit'))))U.view='dashboard';
 const v={dashboard:vDash,tickets:vList,board:vBoard,requesters:vRequesters,assets:vAssets,kb:vKB,reports:vReports,trash:vTrash,audit:vAudit,settings:vSettings}[U.view]||vDash;
 if(U.view==='audit'&&!U.audLoaded)loadAudit();
 if(U.view==='settings'&&isAdmin()&&F('backups')&&!U.bkLoaded)loadBackups();
 m.innerHTML=v();
 if(U.view==='board')bindDnD();
}

/* ================= Dashboard ================= */
function vDash(){
 const open=S.tickets.filter(isOpen);
 const breached=open.filter(x=>sla(x).st==='breached'),risk=open.filter(x=>sla(x).st==='risk');
 const unassigned=open.filter(x=>!x.assigneeId);
 const res7=S.tickets.filter(x=>x.resolvedAt&&now()-x.resolvedAt<7*DAY);
 const res30=S.tickets.filter(x=>x.resolvedAt&&now()-x.resolvedAt<30*DAY);
 const comp=res30.length?Math.round(res30.filter(x=>sla(x).st==='met').length/res30.length*100):null;
 const attn=[...breached,...risk].sort((a,b)=>sla(a).rem-sla(b).rem).slice(0,8);
 const active=S.agents.filter(a=>a.active);const maxL=Math.max(1,...active.map(a=>openLoad(a.id)));
 const byCat=S.categories.map(c=>[c.name,open.filter(x=>x.categoryId===c.id).length]).filter(r=>r[1]).sort((a,b)=>b[1]-a[1]);const maxC=Math.max(1,...byCat.map(r=>r[1]));
 const pcol=['','var(--crit)','var(--warn)','var(--info)','var(--muted)'];
 const byP=[1,2,3,4].map(p=>[p,open.filter(x=>x.priority===p).length]);const maxP=Math.max(1,...byP.map(r=>r[1]));
 const kpi=(k,val,sub,cls,q)=>`<button class="kpi ${cls||''}" data-act="quick" data-q="${q}"><span>${t(k)}</span><b>${val}</b><small>${sub}</small></button>`;
 return `<div class="head"><div><h1>${t('dashboard')}</h1><p>${new Intl.DateTimeFormat(loc(),{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now())}</p></div></div>
 <div class="kpis">
  ${kpi('k_open',open.length,t('k_click'),'','open')}
  ${kpi('k_unassigned',unassigned.length,t('k_click'),unassigned.length?'warnk':'','unassigned')}
  ${kpi('k_breached',breached.length,t('k_click'),breached.length?'alert':'good','overdue')}
  ${kpi('k_risk',risk.length,t('k_click'),risk.length?'warnk':'','risk')}
  ${kpi('k_resolved7',res7.length,t('k_click'),'','all')}
  ${kpi('k_compliance',comp==null?'—':comp+'%',t('k_30'),comp==null?'':comp>=90?'good':comp>=75?'warnk':'alert','all')}
 </div>
 <div class="dash">
  <section class="card"><div class="ch"><div><h2>${t('needsAttn')}</h2><div class="muted" style="font-size:12px">${t('needsAttnSub')}</div></div></div>
   <div class="attn">${attn.length?attn.map(x=>`<button data-act="open" data-id="${x.id}">${pChip(x.priority)}<span class="t"><span class="mono muted">${esc(x.key)}</span> ${esc(x.title)}</span>${slaChip(x)}</button>`).join(''):`<div class="empty">✓ ${t('allClear')}</div>`}</div>
  </section>
  <section class="card"><div class="ch"><h2>${t('workload')}</h2></div>
   <div class="bars">${active.length?active.map(a=>{const n=openLoad(a.id);return `<div class="bar-row"><span class="lbl">${esc(a.name)}</span><span class="track"><i style="width:${n/maxL*100}%;background:var(--accent)"></i></span><b class="num">${n}</b></div>`}).join(''):`<div class="empty">${t('loadNone')}</div>`}</div>
  </section>
 </div>
 <div class="dash">
  <section class="card chart"><div class="ch"><h2>${t('trend')}</h2><div class="legend"><span><i style="background:var(--info)"></i>${t('createdL')}</span><span><i style="background:var(--ok)"></i>${t('resolvedL')}</span></div></div>${trendSvg()}</section>
  <section class="card"><div class="ch"><h2>${t('byPrio')}</h2></div>
   <div class="bars">${byP.map(([p,n])=>`<div class="bar-row"><span class="lbl mono">P${p}</span><span class="track"><i style="width:${n/maxP*100}%;background:${pcol[p]}"></i></span><b class="num">${n}</b></div>`).join('')}</div>
   <div class="ch" style="margin-top:18px"><h2>${t('byCat')}</h2></div>
   <div class="bars">${byCat.length?byCat.map(([nm,n])=>`<div class="bar-row"><span class="lbl" title="${esc(nm)}">${esc(nm)}</span><span class="track"><i style="width:${n/maxC*100}%;background:var(--accent)"></i></span><b class="num">${n}</b></div>`).join(''):`<div class="empty">—</div>`}</div>
  </section>
 </div>`;
}
function trendSvg(){
 const days=14,W=700,Hh=220,pl=34,pb=26,pt=10,pr=10;const start=new Date(now());start.setHours(0,0,0,0);
 const ds=[];for(let i=days-1;i>=0;i--){const d0=start.getTime()-i*DAY;ds.push({d0,c:S.tickets.filter(x=>x.createdAt>=d0&&x.createdAt<d0+DAY).length,r:S.tickets.filter(x=>x.resolvedAt&&x.resolvedAt>=d0&&x.resolvedAt<d0+DAY).length})}
 const max=Math.max(2,...ds.map(d=>Math.max(d.c,d.r)));const step=Math.ceil(max/4);const top=step*4;
 const cw=(W-pl-pr)/days,bw=Math.min(14,cw/3),y=v=>pt+(Hh-pt-pb)*(1-v/top);
 let g='';for(let v=0;v<=top;v+=step)g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-8}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)" font-family="var(--f-mono)">${v}</text>`;
 const fmt=new Intl.DateTimeFormat(loc(),{day:'numeric',month:'numeric'});
 let b='';ds.forEach((d,i)=>{const cx=pl+cw*i+cw/2;
  b+=`<rect x="${cx-bw-1}" y="${y(d.c)}" width="${bw}" height="${Math.max(0,y(0)-y(d.c))}" rx="2" fill="var(--info)"><title>${d.c}</title></rect>`;
  b+=`<rect x="${cx+1}" y="${y(d.r)}" width="${bw}" height="${Math.max(0,y(0)-y(d.r))}" rx="2" fill="var(--ok)"><title>${d.r}</title></rect>`;
  if(i%2===days%2||i===days-1)b+=`<text x="${cx}" y="${Hh-8}" font-size="10.5" text-anchor="middle" fill="var(--muted)" font-family="var(--f-mono)">${fmt.format(d.d0)}</text>`});
 return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${t('trend')}" direction="ltr">${g}${b}</svg>`;
}

/* ================= List ================= */
function vList(){
 const rows=filtered();const all=filtered(true);
 const qs=['open','mine','unassigned','overdue','risk','today','all'];
 const cnt=q=>all.filter(x=>quickMatch(x,q)).length;
 const f=U.f;const anyF=f.status||f.priority||f.assignee||f.category||f.type||f.asset||f.q;
 const sh=(k,l)=>`<th class="sortable" data-act="sort" data-k="${k}">${l}${U.sort.k===k?(U.sort.d>0?' ↑':' ↓'):''}</th>`;
 const allSel=rows.length&&rows.every(x=>U.sel.has(x.id));
 return `<div class="head"><div><h1>${t('tickets')}</h1><p class="num">${rows.length} ${t('tg')}</p></div>
  <div class="row-acts"><button class="btn sm" data-act="exportCsv">${t('exportCsv')}</button></div></div>
 <div class="quick">${qs.map(q=>`<button class="${f.quick===q?'on':''}" data-act="quick" data-q="${q}">${t('q_'+q)}<span class="c num">${cnt(q)}</span></button>`).join('')}</div>
 ${filterBar(true)}
 ${U.sel.size?`<div class="bulk"><b class="num">${U.sel.size}</b> ${t('selected')}
   <select id="bulkAssign" aria-label="${t('assignTo')}"><option value="">${t('assignTo')}</option>${opt('none',t('unassigned'))}${S.agents.filter(a=>a.active).map(a=>opt(a.id,a.name)).join('')}</select>
   <select id="bulkStatus" aria-label="${t('setStatus')}"><option value="">${t('setStatus')}</option>${STATUSES.map(s=>opt(s,t('st_'+s))).join('')}</select>
   <button class="btn sm pri" data-act="bulkApply">${t('apply')}</button>${isAdmin()?`<button class="btn sm danger" data-act="bulkDel">${t('del')}</button>`:''}
   <button class="btn sm ghost" data-act="bulkClear">${t('cancel')}</button></div>`:''}
 <div class="tbl-wrap">${rows.length?`<table><thead><tr>
   <th style="width:34px"><input type="checkbox" data-ch="selAll" ${allSel?'checked':''} aria-label="select all"></th>
   ${sh('key',t('key'))}${sh('title',t('title'))}<th>${t('type')}</th>${sh('priority',t('priority'))}${sh('status',t('status'))}${sh('assignee',t('assignee'))}${sh('category',t('category'))}${sh('sla','SLA')}${sh('updatedAt',t('updated'))}
  </tr></thead><tbody>${rows.map(x=>`<tr class="row ${U.sel.has(x.id)?'sel':''}" data-act="open" data-id="${x.id}">
   <td data-stop="1"><input type="checkbox" data-ch="sel" data-id="${x.id}" ${U.sel.has(x.id)?'checked':''} aria-label="${esc(x.key)}"></td>
   <td class="mono">${esc(x.key)}</td>
   <td><span class="ttl">${esc(x.title)}</span><span class="sub"><span class="muted" style="font-size:12px">${esc(x.requester?.name||'')}</span>${(x.attachments||[]).length?`<span class="tag clip">📎 ${x.attachments.length}</span>`:''}${(x.tags||[]).slice(0,3).map(g=>`<span class="tag">${esc(g)}</span>`).join('')}</span></td>
   <td>${tyLbl(x.type)}</td><td>${pChip(x.priority)}</td><td>${stChip(x.status)}</td><td>${who(x.assigneeId)}</td>
   <td style="white-space:nowrap">${esc(cat(x.categoryId)?.name||'—')}</td><td>${slaChip(x)}</td><td class="muted num" style="white-space:nowrap">${rel(x.updatedAt)}</td></tr>`).join('')}</tbody></table>`
   :`<div class="empty">${t('noTickets')}${anyF?`<div style="margin-top:10px"><button class="btn sm" data-act="clearF">${t('clearFilters')}</button></div>`:''}</div>`}</div>`;
}
function filterBar(withStatus){const f=U.f;
 return `<div class="toolbar">
  ${withStatus?`<select data-ch="f" data-k="status" aria-label="${t('status')}"><option value="">${t('status')}: ${t('all')}</option>${STATUSES.map(s=>opt(s,t('st_'+s),f.status)).join('')}</select>`:''}
  <select data-ch="f" data-k="priority" aria-label="${t('priority')}"><option value="">${t('priority')}: ${t('all')}</option>${[1,2,3,4].map(p=>opt(p,'P'+p,f.priority)).join('')}</select>
  <select data-ch="f" data-k="type" aria-label="${t('type')}"><option value="">${t('type')}: ${t('all')}</option>${TYPES.map(y=>opt(y,t('tys_'+y),f.type)).join('')}</select>
  <select data-ch="f" data-k="assignee" aria-label="${t('assignee')}"><option value="">${t('assignee')}: ${t('all')}</option>${opt('none',t('unassigned'),f.assignee)}${S.agents.map(a=>opt(a.id,a.name,f.assignee)).join('')}</select>
  <select data-ch="f" data-k="category" aria-label="${t('category')}"><option value="">${t('category')}: ${t('all')}</option>${catOpts(f.category)}</select>
  ${f.asset?`<button class="btn sm" data-act="clearAsset">${esc(asset(f.asset)?.tag||'')} ✕</button>`:''}
  ${(f.status||f.priority||f.type||f.assignee||f.category||f.asset||f.q)?`<button class="btn sm ghost" data-act="clearF">${t('clearFilters')}</button>`:''}
 </div>`}

/* ================= Board ================= */
function vBoard(){
 const cols=U.showClosed?STATUSES:STATUSES.filter(s=>s!=='closed');
 const rows=filtered(true);
 return `<div class="head"><div><h1>${t('board')}</h1><p>${t('dragHint')}</p></div>
  <label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" data-ch="showClosed" ${U.showClosed?'checked':''}> ${t('showClosed')}</label></div>
 ${filterBar(false)}
 <div class="board" style="--cols:${cols.length}">${cols.map(s=>{const items=rows.filter(x=>x.status===s).sort((a,b)=>a.priority-b.priority||sla(a).rem-sla(b).rem);
  return `<div class="col" data-col="${s}"><div class="col-h">${stChip(s)}<span class="muted num">${items.length}</span></div>
  ${items.map(x=>{const dn=x.checklist.filter(c=>c.done).length;return `<div class="kcard" draggable="true" data-id="${x.id}" data-act="open" tabindex="0" role="button">
   <div class="km"><span class="mono muted">${esc(x.key)}</span>${pChip(x.priority)}</div>
   <div class="kt">${esc(x.title)}</div>
   <div class="km">${tyLbl(x.type)}${x.checklist.length?`<span class="prog num">☑ ${dn}/${x.checklist.length}</span>`:''}</div>
   <div class="km"><span class="av" title="${esc(agentName(x.assigneeId))}">${x.assigneeId?esc(initials(agentName(x.assigneeId))):'—'}</span>${slaChip(x)}</div></div>`}).join('')}</div>`}).join('')}</div>`;
}
function bindDnD(){
 document.querySelectorAll('.kcard').forEach(c=>{c.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',c.dataset.id);c.classList.add('dragging')});c.addEventListener('dragend',()=>c.classList.remove('dragging'))});
 document.querySelectorAll('.col').forEach(col=>{
  col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('over')});
  col.addEventListener('dragleave',()=>col.classList.remove('over'));
  col.addEventListener('drop',async e=>{e.preventDefault();col.classList.remove('over');const x=tk(e.dataTransfer.getData('text/plain'));if(!x)return;
   const to=col.dataset.col;if(x.status!==to&&await ops(x.id,[{op:'set',key:'status',value:to}]))toast(`${x.key} → ${t('st_'+to)}`)});
 });
}

/* ================= ticket operations via API ================= */
async function ops(id,list){
 try{const j=await api('POST',`/api/tickets/${encodeURIComponent(id)}/ops`,{ops:list});j.tickets.forEach(x=>upsert('tickets',x));softRender();return true}
 catch(e){fail(e);return false}
}

/* ================= Drawer (ticket detail) ================= */
function renderDrawer(){
 const d=$('#drawer');if(!d)return;const x=U.open&&S&&tk(U.open);
 if(!x){d.innerHTML='';U.open=null;return}
 const draft=$('#cmBody')?.value||'';
 const s=sla(x),r=resp(x);
 const logged=x.worklogs.reduce((a,w)=>a+(+w.min||0),0);
 const sug=S.kb.filter(k=>k.category===x.categoryId).slice(0,3);
 const tabs=[['conv',x.comments.length]].concat(F('attachments')?[['files',(x.attachments||[]).length]]:[]).concat([['work',x.worklogs.length],['check',x.checklist.length],['links',x.links.length],['act',x.activity.length]]);
 if(U.tab==='files'&&!F('attachments'))U.tab='conv';
 const tabName={conv:'conv',files:'files',work:'worklog',check:'checklist',links:'links',act:'activity'};
 const actions=[];
 if(x.assigneeId!==meId()&&isOpen(x))actions.push(`<button class="btn sm" data-act="assignMe">${t('assignMe')}</button>`);
 if(x.status==='new')actions.push(`<button class="btn sm pri" data-act="st" data-v="progress">${t('startWork')}</button>`);
 if(x.status==='progress')actions.push(`<button class="btn sm" data-act="st" data-v="pending">${t('waitReq')}</button>`);
 if(isOpen(x))actions.push(`<button class="btn sm pri" data-act="st" data-v="resolved">${t('resolve')}</button>`);
 if(x.status==='resolved')actions.push(`<button class="btn sm" data-act="st" data-v="closed">${t('closeT')}</button>`);
 if(!isOpen(x))actions.push(`<button class="btn sm" data-act="st" data-v="progress">${t('reopen')}</button>`);
 d.innerHTML=`<div class="scrim" data-act="closeDrawer"></div>
 <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(x.key)}">
  <div class="dr-head">
   <div class="row1"><span class="mono muted">${esc(x.key)}</span>${tyLbl(x.type)}${stChip(x.status)}${pChip(x.priority)}${x.planId?`<span class="chip st-new" title="${esc(((S.plans||[]).find(p=>p.id===x.planId)||{}).title||'')}">${t('pmChip')}${x.pmDue?' · '+fmtDay(x.pmDue):''}</span>`:''}<span style="flex:1"></span>
    <button class="btn sm ghost" data-act="copyLink" title="${t('copyLink')}">🔗</button><button class="btn sm ghost" data-act="edit">${t('edit')}</button>${isAdmin()?`<button class="btn sm ghost" data-act="delT" style="color:var(--crit)">${t('del')}</button>`:''}
    <button class="icon-btn" data-act="closeDrawer" aria-label="${t('close')}">${I.x}</button></div>
   <h2>${esc(x.title)}</h2>
   <div class="row-acts">${actions.join('')}</div>
  </div>
  <div class="dr-body">
   <div style="min-width:0">
    <div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:8px">${t('description')}</h3><div class="desc">${esc(x.desc)||'<span class="muted">—</span>'}</div>
     ${(x.tags||[]).length?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px">${x.tags.map(g=>`<span class="tag">${esc(g)}</span>`).join('')}</div>`:''}</div>
    <div class="tabs" role="tablist">${tabs.map(([k,n])=>`<button role="tab" class="${U.tab===k?'on':''}" data-act="tab" data-v="${k}">${t(tabName[k])} <span class="muted num">${n}</span></button>`).join('')}</div>
    ${drTab(x,draft,logged)}
   </div>
   <div class="props">
    <div class="card slabox"><h3>SLA</h3>
     <div class="ln"><span>${t('respSla')}</span>${r.st==='met'?`<span class="chip sla-met">✓ ${t('met')}</span>`:r.st==='breached'?`<span class="chip sla-breached">${t('breach')}</span>`:`<span class="chip sla-ok num">${dur(r.rem)} ${t('left')}</span>`}</div>
     <div class="ln"><span>${t('resSla')}</span>${slaChip(x)}</div>
     <div class="ln muted"><span>${t('due')}</span><span class="num">${fmtDate(s.due)}</span></div>
     <div class="ln muted"><span>${t('created')}</span><span class="num">${fmtDate(x.createdAt)}</span></div>
    </div>
    <div class="card props">
     <label class="field"><span>${t('status')}</span><select data-ch="tf" data-k="status">${STATUSES.map(z=>opt(z,t('st_'+z),x.status)).join('')}</select></label>
     <label class="field"><span>${t('assignee')}</span><select data-ch="tf" data-k="assigneeId">${agentOpts(x.assigneeId||'',true)}</select></label>
     <div class="grid2"><label class="field"><span>${t('impact')}</span><select data-ch="tf" data-k="impact">${[1,2,3].map(v=>opt(v,t('lvl'+v),x.impact)).join('')}</select></label>
      <label class="field"><span>${t('urgency')}</span><select data-ch="tf" data-k="urgency">${[1,2,3].map(v=>opt(v,t('lvl'+v),x.urgency)).join('')}</select></label></div>
     <label class="field"><span>${t('type')}</span><select data-ch="tf" data-k="type">${TYPES.map(y=>opt(y,t('ty_'+y),x.type)).join('')}</select></label>
     <label class="field"><span>${t('category')}</span><select data-ch="tf" data-k="categoryId">${catOpts(x.categoryId)}</select></label>
     <div class="field"><span>${t('team')}</span><div>${esc(team(x.teamId)?.name||'—')}</div></div>
     <label class="field"><span>${t('asset')}</span><select data-ch="tf" data-k="assetId">${opt('',t('none'),x.assetId||'')}${S.assets.map(a=>opt(a.id,a.tag+' — '+a.name,x.assetId)).join('')}</select></label>
    </div>
    <div class="card props"><h3>${t('reqInfo')}${x.source==='portal'?` <span class="tag">${t('fromPortal')}</span>`:''}</h3>
     <div>${x.requesterId&&rqById(x.requesterId)?`<button class="linkish" data-act="rqOpen" data-id="${esc(x.requesterId)}"><b>${esc(x.requester?.name||'—')}</b></button>`:`<b>${esc(x.requester?.name||'—')}</b>`}
      <div class="muted" style="font-size:13px;overflow-wrap:anywhere">${esc(x.requester?.email||'')}</div><div class="muted" style="font-size:13px">${esc(x.requester?.dept||'')}</div>
      ${x.requesterId?`<div class="muted" style="font-size:12px;margin-top:4px">${t('ticketsN').replace('{n}',S.tickets.filter(z=>z.requesterId===x.requesterId).length)}</div>`:''}</div>
     ${F('portal')&&x.portalToken&&S.settings.portal&&S.settings.portal.enabled?`<button class="btn sm" data-act="copyPortal">🔗 ${t('portalLink')}</button>`:''}
    </div>
    <div class="card props"><h3>${t('csat')}</h3>
     ${!isOpen(x)?`<div class="stars">${[1,2,3,4,5].map(v=>`<button data-act="csat" data-v="${v}" class="${x.csat>=v?'on':''}" aria-label="${v}">★</button>`).join('')}</div><div class="muted" style="font-size:12px">${t('csatHint')}</div>`:`<div class="muted" style="font-size:13px">${t('rateFirst')}</div>`}
    </div>
    ${sug.length?`<div class="card props"><h3>${t('suggested')}</h3><div class="kbs">${sug.map(k=>`<button data-act="kbOpen" data-id="${k.id}">📄 ${esc(k.title)}</button>`).join('')}</div></div>`:''}
   </div>
  </div>
 </aside>`;
}
function drTab(x,draft,logged){
 if(U.tab==='conv'){
  return `<div>${x.comments.length?x.comments.slice().sort((a,b)=>a.at-b.at).map(c=>{const isReq=c.kind==='requester';const nm=isReq?(x.requester?.name||t('requester')):agentName(c.by);
   return `<div class="cm ${c.kind==='internal'?'internal':isReq?'req':''}"><span class="av">${esc(initials(nm))}</span><div class="bd"><div class="meta"><b style="color:var(--fg)">${esc(nm)}</b>${c.kind==='internal'?`<span class="chip p2 plain">${t('internalBadge')}</span>`:''}${isReq?`<span class="chip p3 plain">${t('reqBadge')}</span>`:''}<span class="num">${fmtDate(c.at)}</span></div><div class="tx">${esc(c.body)}</div></div></div>`}).join(''):`<div class="empty">${t('noComments')}</div>`}</div>
  <div class="composer">
   <div class="row"><div class="seg" role="radiogroup">${['reply','internal','requester'].map(k=>`<button class="${U.kind===k?'on':''}" data-act="kind" data-v="${k}">${t(k==='reply'?'reply':k==='internal'?'note':'reqReply')}</button>`).join('')}</div>
    ${U.kind==='reply'&&S.canned.length?`<select data-ch="canned" aria-label="${t('canned')}"><option value="">${t('canned')}</option>${S.canned.map(c=>opt(c.id,c.title)).join('')}</select>`:''}</div>
   <textarea id="cmBody" placeholder="${t('writeHere')}" rows="4" maxlength="10000">${esc(draft)}</textarea>
   <div class="row" style="justify-content:flex-end"><button class="btn pri sm" data-act="addCm">${t('send')}</button></div>
  </div>`;
 }
 if(U.tab==='files'){
  const list=(x.attachments||[]).slice().sort((a,b)=>b.at-a.at);const url=a=>`/api/tickets/${encodeURIComponent(x.id)}/attachments/${encodeURIComponent(a.id)}`;
  const isImg=a=>/^image\/(png|jpeg|gif|webp)$/.test(a.type);
  return `<div class="dropzone" id="dropzone">${I.clip}<span>${t('dropHere')} <label class="linkbtn">${t('chooseFiles')}<input type="file" id="attInput" multiple hidden></label></span><small class="muted">${t('maxSize').replace('{n}',U.limits.maxUploadMB)}</small></div>
  ${list.length?`<div class="att-grid">${list.map(a=>`<div class="att">
    ${isImg(a)?`<a class="thumb" href="${url(a)}?inline=1" target="_blank" rel="noopener"><img src="${url(a)}?inline=1" alt="${esc(a.name)}" loading="lazy"></a>`:`<div class="thumb ficon">${I.file}<b>${esc((a.name.split('.').pop()||'').slice(0,5).toUpperCase())}</b></div>`}
    <div class="att-meta"><span class="att-name" title="${esc(a.name)}">${esc(a.name)}</span><span class="muted num">${fsize(a.size)} · ${esc(agentName(a.by))} · ${rel(a.at)}</span></div>
    <div class="att-acts"><a class="btn sm ghost" href="${url(a)}" download="${esc(a.name)}">${t('download')}</a>${a.by===meId()||isAdmin()?`<button class="icon-btn" data-act="delFile" data-id="${a.id}" aria-label="${t('del')}">✕</button>`:''}</div>
  </div>`).join('')}</div>`:`<div class="empty">${t('noFiles')}</div>`}`;
 }
 if(U.tab==='work'){
  return `<div class="note" style="margin-bottom:10px">${t('totalLogged')}: <b class="num">${minsTxt(logged)}</b></div>
   ${x.worklogs.length?x.worklogs.slice().sort((a,b)=>b.at-a.at).map(w=>`<div class="cm"><span class="av">${esc(initials(agentName(w.by)))}</span><div class="bd"><div class="meta"><b style="color:var(--fg)">${esc(agentName(w.by))}</b><span class="chip plain p3 num">${minsTxt(w.min)}</span><span class="num">${fmtDate(w.at)}</span><span style="flex:1"></span>${w.by===meId()||isAdmin()?`<button class="icon-btn" data-act="delWork" data-id="${w.id}" aria-label="${t('del')}">✕</button>`:''}</div><div class="tx">${esc(w.note)}</div></div></div>`).join(''):`<div class="empty">${t('noWork')}</div>`}
   <div class="composer"><div class="grid3"><label class="field"><span>${t('minutes')}</span><input type="number" id="wlMin" min="1" max="1440" step="5" value="30"></label>
    <label class="field" style="grid-column:span 2"><span>${t('workNote')}</span><input type="text" id="wlNote" maxlength="300"></label></div>
    <div class="row" style="justify-content:flex-end"><button class="btn sm pri" data-act="addWork">${t('logTime')}</button></div></div>`;
 }
 if(U.tab==='check'){
  return `${x.checklist.length?x.checklist.map(c=>`<div class="ck ${c.done?'done':''}"><label><input type="checkbox" data-ch="ck" data-id="${c.id}" ${c.done?'checked':''}> ${esc(c.text)}</label><button class="icon-btn" data-act="delCk" data-id="${c.id}" aria-label="${t('del')}">✕</button></div>`).join(''):`<div class="empty">${t('noItems')}</div>`}
   <div class="composer"><div class="row"><input type="text" id="ckNew" placeholder="${t('addItem')}" maxlength="200" style="flex:1"><button class="btn sm pri" data-act="addCk">${t('add')}</button></div></div>`;
 }
 if(U.tab==='links'){
  const others=S.tickets.filter(o=>o.id!==x.id&&!x.links.includes(o.id));
  return `${x.links.length?x.links.map(id=>{const o=tk(id);if(!o)return'';return `<div class="ck"><label data-act="open" data-id="${o.id}" style="cursor:pointer"><span class="mono muted">${esc(o.key)}</span> ${esc(o.title)} ${stChip(o.status)}</label><button class="icon-btn" data-act="unlink" data-id="${o.id}" aria-label="${t('del')}">✕</button></div>`}).join(''):`<div class="empty">${t('noLinks')}</div>`}
   <div class="composer"><div class="row"><select id="linkSel" style="flex:1"><option value="">${t('linkTicket')}</option>${others.map(o=>opt(o.id,o.key+' — '+o.title)).join('')}</select><button class="btn sm pri" data-act="link">${t('add')}</button></div></div>`;
 }
 return `<div>${x.activity.slice().sort((a,b)=>b.at-a.at).map(a=>`<div class="act"><time class="num">${fmtDate(a.at)}</time><div><b>${esc(agentName(a.by))}</b> ${actText(a)}</div></div>`).join('')}</div>`;
}
function actText(a){
 switch(a.k){case'created':return t('a_created');case'status':return `${t('a_status')}: ${t('st_'+a.f)} → ${t('st_'+a.v)}`;
  case'assign':return `${t('a_assign')} ${esc(agentName(a.v))}`;case'autoassign':return `${t('a_autoassign')} ${esc(agentName(a.v))}`;case'unassign':return t('a_unassign');
  case'prio':return `${t('a_prio')}: P${a.f} → P${a.v}`;case'field':return `${t('a_field')} ${esc(t(a.v))}`;
  case'reply':return t('a_comment');case'internal':return t('a_internal');case'requester':return t('a_req');
  case'work':return `${t('a_work')} (${minsTxt(a.v)})`;case'autoclose':return t('a_autoclose');case'autoreopen':return t('a_autoreopen');
  case'link':return `${t('a_link')} ${esc(a.v)}`;case'csat':return `${t('a_csat')} ${'★'.repeat(a.v)}`;case'edit':return t('a_edit');case'check':return t('a_check');case'attach':return `${t('a_attach')} "${esc(a.v)}"`;case'att-del':return `${t('a_attdel')} "${esc(a.v)}"`;case'restored':return t('a_restored');default:return esc(a.k)}
}
function openTicket(id){U.open=id;U.tab='conv';U.kind='reply';$('#drawer').innerHTML='';renderDrawer()}

/* ================= Modal ================= */
function modal(title,body,foot,small){$('#modal').innerHTML=`<div class="modal" data-act="mbg"><div class="mbox ${small==='lg'?'lg':small?'sm':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mh"><h2>${esc(title)}</h2><button class="icon-btn" data-act="mclose" aria-label="${t('close')}">${I.x}</button></div><div class="mb">${body}</div>${foot?`<div class="mf">${foot}</div>`:''}</div></div>`;
 const f=$('#modal').querySelector('input:not([type=checkbox]),textarea,select');if(f)setTimeout(()=>f.focus(),30)}
function closeModal(){$('#modal').innerHTML='';U.form=null;U.onOk=null}
function confirmBox(msg,onOk){U.onOk=onOk;modal(t('confirm'),`<p style="margin:0">${esc(msg)}</p>`,`<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn danger" data-act="mok">${t('confirm')}</button>`,true)}
async function busy(btn,fn){if(btn){if(btn.disabled)return;btn.disabled=true}try{await fn()}finally{if(btn&&btn.isConnected)btn.disabled=false}}

function ticketForm(x,preset){
 const v=x||Object.assign({title:'',type:'incident',categoryId:'',impact:2,urgency:2,requester:{name:'',email:'',dept:''},assigneeId:'',assetId:'',tags:[],desc:''},preset||{});
 U.form=x?x.id:'new';U.formReq=v.requesterId||null;
 const pr=prio(+v.impact,+v.urgency);
 modal(x?`${t('edit')} ${x.key}`:t('newTicket'),`
  <label class="field"><span>${t('title')} *</span><input type="text" id="fTitle" maxlength="160" value="${esc(v.title)}"><small class="ferr" id="eTitle"></small></label>
  <div class="grid2"><label class="field"><span>${t('type')}</span><select id="fType">${TYPES.map(y=>opt(y,t('ty_'+y),v.type)).join('')}</select></label>
   <label class="field"><span>${t('category')} *</span><select id="fCat"><option value="">—</option>${catOpts(v.categoryId)}</select><small class="ferr" id="eCat"></small></label></div>
  <div class="grid2"><div class="grid2"><label class="field"><span>${t('impact')}</span><select id="fImp" data-ch="pm">${[1,2,3].map(n=>opt(n,t('lvl'+n),v.impact)).join('')}</select></label>
    <label class="field"><span>${t('urgency')}</span><select id="fUrg" data-ch="pm">${[1,2,3].map(n=>opt(n,t('lvl'+n),v.urgency)).join('')}</select></label></div>
   <div class="field"><span>${t('matrix')} — ${t('computed')}: <b id="pmOut" class="mono">P${pr}</b></span><div class="matrix" id="pmGrid" dir="ltr">${matrixHtml(+v.impact,+v.urgency)}</div></div></div>
  <datalist id="rqList">${(S.requesters||[]).filter(r=>r.active!==false).map(r=>`<option value="${esc(rqLabel(r))}"></option>`).join('')}</datalist>
  <div class="grid3"><label class="field"><span>${t('reqName')} *</span><input type="text" id="fRn" maxlength="200" list="rqList" autocomplete="off" placeholder="${t('pickRequester')}" value="${esc(v.requester?.name)}"><small class="ferr" id="eRn"></small></label>
   <label class="field"><span>${t('reqEmail')}</span><input type="email" id="fRe" maxlength="120" value="${esc(v.requester?.email)}" dir="ltr"><small class="ferr" id="eRe"></small></label>
   <label class="field"><span>${t('reqDept')}</span><input type="text" id="fRd" maxlength="60" value="${esc(v.requester?.dept)}"></label></div>
  <div class="grid2"><label class="field"><span>${t('assignee')}</span><select id="fAs">${x?agentOpts(v.assigneeId||'',true):opt('',S.settings.autoAssign?t('autoAssign'):t('unassigned'),'')+S.agents.filter(a=>a.active).map(a=>opt(a.id,a.name)).join('')}</select></label>
   <label class="field"><span>${t('asset')}</span><select id="fAsset">${opt('',t('none'),v.assetId||'')}${S.assets.map(a=>opt(a.id,a.tag+' — '+a.name,v.assetId)).join('')}</select></label></div>
  <label class="field"><span>${t('tags')}</span><input type="text" id="fTags" value="${esc((v.tags||[]).join(', '))}" placeholder="${t('tagsHint')}"></label>
  <label class="field"><span>${t('description')}</span><textarea id="fDesc" rows="5" maxlength="5000">${esc(v.desc)}</textarea></label>`,
  `<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="saveTicket">${x?t('save'):t('create')}</button>`);
}
function matrixHtml(i,u){let h=`<div></div>${[1,2,3].map(n=>`<div class="hd">U:${t('lvl'+n)}</div>`).join('')}`;
 for(let a=1;a<=3;a++){h+=`<div class="hd">I:${t('lvl'+a)}</div>`;for(let b=1;b<=3;b++){const p=prio(a,b);h+=`<div class="p${p} mono ${a===i&&b===u?'cur':''}">P${p}</div>`}}return h}
async function saveTicket(){
 const g=id=>$('#'+id)?.value??'';let ok=true;
 const errs={eTitle:'',eCat:'',eRn:'',eRe:''};
 const title=g('fTitle').trim(),catId=g('fCat'),rn=g('fRn').trim(),re=g('fRe').trim();
 if(title.length<5){errs.eTitle=t('v_title');ok=false}
 if(!catId){errs.eCat=t('v_cat');ok=false}
 if(!rn){errs.eRn=t('v_req');ok=false}
 if(re&&!C.EMAIL_RE.test(re)){errs.eRe=t('v_email');ok=false}
 Object.entries(errs).forEach(([k,m])=>{$('#'+k).textContent=m});
 [['fTitle','eTitle'],['fCat','eCat'],['fRn','eRn'],['fRe','eRe']].forEach(([f,e])=>$('#'+f).classList.toggle('err',!!errs[e]));
 if(!ok)return;
 const data={title,type:g('fType'),categoryId:catId,impact:+g('fImp'),urgency:+g('fUrg'),requester:{name:rn,email:re,dept:g('fRd').trim()},assetId:g('fAsset'),tags:g('fTags'),desc:g('fDesc').trim(),assigneeId:g('fAs')};
 const fr=U.formReq&&rqById(U.formReq);if(fr&&(fr.email||'')===re.toLowerCase())data.requesterId=fr.id;
 if(U.form==='new'){
  try{const j=await api('POST','/api/tickets',data);upsert('tickets',j.ticket);closeModal();toast(`${t('ticketCreated')} — ${j.ticket.key}`);softRender();openTicket(j.ticket.id)}catch(e){fail(e)}
 }else{
  const id=U.form;if(await ops(id,[{op:'edit',data}])){closeModal();toast(t('saved'))}
 }
}

/* ================= Assets ================= */
/* ================= assets (ITIL IT Asset Management) & preventive maintenance ================= */
const A_ST={stock:'st-pending',active:'sla-ok',repair:'sla-risk',retired:'st-closed',disposed:'st-closed'};
const todayS=()=>C.todayIn(S,now());
const ownerOf=a=>{const r=a.requesterId&&rqById(a.requesterId);return r?r.name:(a.user||'')};
const arrow=()=>`<span aria-hidden="true">${lang==='ar'?'←':'→'}</span>`;
function fmtDay(ds){if(!ds)return'—';try{return new Intl.DateTimeFormat(loc(),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(Date.parse(ds+'T00:00:00Z'))}catch(e){return ds}}
function dueChip(ds){const d=C.daysBetween(todayS(),ds);const cls=d<0?'p1':d<=7?'p2':'st-closed';
 return `<span class="chip ${cls}">${d<0?t('overdueN').replace('{n}',-d):d===0?t('dueToday'):t('inNDays').replace('{n}',d)}</span>`}
function warrChip(a){const w=C.warranty(a,todayS());if(w==='none')return '<span class="muted">—</span>';
 const d=C.daysBetween(todayS(),a.warrantyEnd);
 if(w==='expired')return `<span class="chip p1" title="${esc(a.warrantyEnd)}">${t('wExpired')}</span>`;
 if(w==='soon')return `<span class="chip p2" title="${esc(a.warrantyEnd)}">${t('wSoon').replace('{n}',d)}</span>`;
 return `<span class="muted num">${fmtDay(a.warrantyEnd)}</span>`}
function vAssets(){const pl=U.atab==='plans';
 return `<div class="head"><div><h1>${t('assets')}</h1><p>${t('assetsSub')}</p></div>${pl?(isAdmin()?`<button class="btn pri" data-act="planForm">${I.plus}${t('newPlan')}</button>`:''):`<button class="btn pri" data-act="assetForm">${I.plus}${t('newAsset')}</button>`}</div>
 ${assetKpis()}
 <div class="tabs" role="tablist"><button role="tab" aria-selected="${!pl}" class="${pl?'':'on'}" data-act="atab" data-v="list">${t('assetsList')} <span class="muted num">${S.assets.length}</span></button><button role="tab" aria-selected="${pl}" class="${pl?'on':''}" data-act="atab" data-v="plans">${t('pmPlans')} <span class="muted num">${(S.plans||[]).length}</span></button></div>
 ${pl?vPlans():vAssetList()}`}
function assetKpis(){const td=todayS(),A=S.assets;
 const live=A.filter(a=>!['retired','disposed'].includes(a.status));
 const warr=live.filter(a=>['soon','expired'].includes(C.warranty(a,td))).length;
 const due7=(S.plans||[]).filter(p=>p.active&&C.daysBetween(td,p.nextDue)<=7).length;
 const pmOpen=S.tickets.filter(x=>x.planId&&isOpen(x)).length;
 const k=(lbl,v,sub,attrs)=>`<button class="kpi" ${attrs}><span>${lbl}</span><b>${v}</b><small>${sub}</small></button>`;
 return `<div class="kpis" style="margin-bottom:14px">
  ${k(t('k_assets'),live.length,t('k_assetsSub'),'data-act="af" data-k="status" data-v=""')}
  ${k(t('a_active'),A.filter(a=>a.status==='active').length,t('k_click'),'data-act="af" data-k="status" data-v="active"')}
  ${k(t('a_repair'),A.filter(a=>a.status==='repair').length,t('k_click'),'data-act="af" data-k="status" data-v="repair"')}
  ${k(t('k_warranty'),warr,t('k_warrantySub'),'data-act="af" data-k="warranty" data-v="1"')}
  ${k(t('k_pmDue'),due7,t('k_pmDueSub'),'data-act="atab" data-v="plans"')}
  ${k(t('k_pmOpen'),pmOpen,t('k_click'),'data-act="pmTickets"')}</div>`}
function assetFiltered(){const f=U.af||(U.af={q:'',status:'',type:'',warranty:''});const td=todayS();const q=f.q.trim().toLowerCase();
 return S.assets.filter(a=>(f.status?a.status===f.status:a.status!=='disposed')&&(!f.type||a.type===f.type)
  &&(!f.warranty||(!['retired','disposed'].includes(a.status)&&['soon','expired'].includes(C.warranty(a,td))))
  &&(!q||[a.tag,a.name,a.type,ownerOf(a),a.location,a.serial,a.vendor].join(' ').toLowerCase().includes(q))).sort((a,b)=>a.tag.localeCompare(b.tag))}
function vAssetList(){const f=U.af||(U.af={q:'',status:'',type:'',warranty:''});
 const types=[...new Set(S.assets.map(a=>a.type).filter(Boolean))].sort();
 const list=assetFiltered();
 const fl=f.status||f.type||f.warranty||f.q;
 return `<div class="toolbar" style="margin-bottom:12px"><input type="search" id="asq" placeholder="${t('asSearch')}" value="${esc(f.q)}" style="max-width:320px" aria-label="${t('asSearch')}">
  <select data-ch="af" data-k="status" aria-label="${t('aStatus')}">${opt('',t('aAllLive'),f.status)}${C.ASSET_STATUSES.map(s=>opt(s,t('a_'+s),f.status)).join('')}</select>
  <select data-ch="af" data-k="type" aria-label="${t('assetType')}">${opt('',t('allTypes'),f.type)}${types.map(y=>opt(y,y,f.type)).join('')}</select>
  ${f.warranty?`<span class="chip p2">${t('k_warranty')}</span>`:''}${fl?`<button class="btn sm ghost" data-act="afClear">${t('clearFilters')}</button>`:''}<button class="btn sm" data-act="exportAssetsCsv" style="margin-inline-start:auto"${list.length?'':' disabled'}>${t('exportCsv')}</button></div>
 <div class="tbl-wrap">${list.length?`<table><thead><tr><th>${t('assetTag')}</th><th>${t('assetName')}</th><th>${t('assetType')}</th><th>${t('owner')}</th><th>${t('location')}</th><th>${t('aStatus')}</th><th>${t('warrantyEnd')}</th><th>${t('tCount')}</th></tr></thead><tbody>
 ${list.map(a=>{const n=S.tickets.filter(x=>x.assetId===a.id);const o=n.filter(isOpen).length;
  return `<tr class="row" data-act="assetOpen" data-id="${esc(a.id)}"><td class="mono">${esc(a.tag)}${a.criticality==='high'?` <span class="chip p1" title="${t('crit_high')}">${t('critShort')}</span>`:''}</td><td>${esc(a.name)}</td><td>${esc(a.type||'—')}</td><td>${esc(ownerOf(a)||'—')}</td><td>${esc(a.location||'—')}</td>
  <td><span class="chip ${A_ST[a.status]||''}">${t('a_'+a.status)}</span></td><td>${warrChip(a)}</td><td class="num">${n.length}${o?` <span class="muted">(${o} ${t('openTickets')})</span>`:''}</td></tr>`}).join('')}</tbody></table>`
  :`<div class="empty">${S.assets.length?t('noAssetsMatch'):t('noAssets')}</div>`}</div>`}
function histTxt(h){const who=esc(agentName(h.by));
 if(h.k==='created')return `${t('h_created')} · <span class="chip ${A_ST[h.v]||''}">${t('a_'+h.v)}</span> · <span class="muted">${who}</span>`;
 if(h.k==='status')return `${t('h_status')}: ${t('a_'+h.f)} ${arrow()} <b>${t('a_'+h.v)}</b> · <span class="muted">${who}</span>`;
 if(h.k==='owner')return `${t('h_owner')}: ${esc(h.f||'—')} ${arrow()} <b>${esc(h.v||'—')}</b> · <span class="muted">${who}</span>`;
 if(h.k==='location')return `${t('h_location')}: ${esc(h.f||'—')} ${arrow()} <b>${esc(h.v||'—')}</b> · <span class="muted">${who}</span>`;
 return esc(h.k)}
function assetBox(id){const a=asset(id);if(!a)return;U.form=null;const st=C.assetStats(S,id,now());
 const ts=S.tickets.filter(x=>x.assetId===id);
 const ev=[...(a.history||[]).map(h=>({at:h.at,h})),...ts.map(x=>({at:x.createdAt,x}))].sort((p,q)=>q.at-p.at).slice(0,40);
 const ai=(k,v)=>`<div class="ai"><span>${k}</span><b>${v}</b></div>`;
 const plans=(S.plans||[]).filter(p=>p.active&&C.planTargets(S,p).some(z=>z.id===id));
 const d=a.disposal;
 modal(`${a.tag} — ${a.name}`,`<div class="row-acts" style="margin-bottom:12px"><span class="chip ${A_ST[a.status]||''}">${t('a_'+a.status)}</span><span class="chip ${a.criticality==='high'?'p1':a.criticality==='low'?'st-closed':'p3'}">${t('crit')}: ${t('crit_'+(a.criticality||'medium'))}</span>${warrChip(a)}</div>
 <div class="ainfo">${ai(t('assetType'),esc(a.type||'—'))}${ai(t('owner'),esc(ownerOf(a)||'—'))}${ai(t('location'),esc(a.location||'—'))}${ai(t('serial'),`<span class="mono" dir="ltr">${esc(a.serial||'—')}</span>`)}
  ${ai(t('vendor'),esc(a.vendor||'—'))}${ai(t('purchaseDate'),fmtDay(a.purchaseDate))}${ai(t('warrantyEnd'),fmtDay(a.warrantyEnd))}${ai(t('nextPm'),st.nextPm?`${fmtDay(st.nextPm)} ${dueChip(st.nextPm)}`:'—')}</div>
 <h3>${t('svcFigures')}</h3>
 <div class="ainfo">${ai(t('tCount'),`<span class="num">${st.total}</span>${st.open?` <span class="muted">(${st.open} ${t('openTickets')})</span>`:''}`)}${ai(t('incidentsN'),`<span class="num">${st.incidents}</span>`)}
  ${ai('MTTR',st.mttr!=null?dur(st.mttr):'—')}${ai('MTBF',st.mtbf!=null?dur(st.mtbf):`<span class="muted" style="font-weight:400">${t('mtbfNeed')}</span>`)}</div>
 <small class="muted">${t('mtHint')}</small>
 ${plans.length?`<h3>${t('pmPlans')}</h3><div class="kbs">${plans.map(p=>`<div class="tl-row"><b>${esc(p.title)}</b> <span class="muted">· ${t('everyN').replace('{n}',p.everyDays)}</span> ${dueChip(p.nextDue)}</div>`).join('')}</div>`:''}
 ${d?`<h3>${t('disposal')}</h3><div class="ainfo">${ai(t('dMethod'),t('dm_'+d.method))}${ai(t('dDate'),fmtDay(d.date))}${ai(t('dWiped'),d.dataWiped?`<span class="chip sla-ok">${t('yes')}</span>`:`<span class="chip p1">${t('notConfirmed')}</span>`)}${ai(t('dNote'),esc(d.note||'—'))}</div>`:''}
 ${a.notes?`<h3>${t('notes')}</h3><p style="margin:0;white-space:pre-wrap">${esc(a.notes)}</p>`:''}
 <h3>${t('assetTimeline')}</h3>
 ${ev.length?`<ul class="tl">${ev.map(e=>`<li><time>${fmtDate(e.at)}</time><div>${e.x?`<button class="tl-t" data-act="rqTicket" data-id="${e.x.id}"><span class="mono muted">${esc(e.x.key)}</span> ${esc(e.x.title)} ${stChip(e.x.status)}${e.x.planId?` <span class="chip st-new">${t('pmChip')}</span>`:''}</button>`:histTxt(e.h)}</div></li>`).join('')}</ul>`:`<div class="empty">—</div>`}`,
 `${isAdmin()?`<button class="btn ghost" data-act="entDel" data-coll="assets" data-id="${esc(id)}" style="color:var(--crit)">${t('del')}</button>`:''}<span style="flex:1"></span>
  <button class="btn" data-act="assetTickets" data-id="${esc(id)}">${t('viewTickets')}</button>${['retired','disposed'].includes(a.status)?'':`<button class="btn" data-act="assetNewTicket" data-id="${esc(id)}">${I.plus}${t('newTicket')}</button>`}<button class="btn pri" data-act="assetForm" data-id="${esc(id)}">${t('edit')}</button>`,'lg')}
function assetForm(id){const a=id?asset(id):{tag:'',name:'',type:'',status:'active',criticality:'medium',requesterId:'',user:'',location:'',serial:'',vendor:'',purchaseDate:'',warrantyEnd:'',notes:'',disposal:null};
 if(id&&!a)return;U.form=id||'new';
 const dp=a.disposal||{method:'',date:todayS(),dataWiped:false,note:''};
 const rqs=(S.requesters||[]).filter(r=>r.active!==false||r.id===a.requesterId).sort((x,y)=>x.name.localeCompare(y.name));
 modal(id?`${t('edit')} ${a.tag}`:t('newAsset'),`<div class="grid2"><label class="field"><span>${t('assetTag')} *</span><input type="text" id="aTag" maxlength="30" value="${esc(a.tag)}" dir="ltr" class="mono"><small class="ferr" id="eTag"></small></label>
  <label class="field"><span>${t('assetName')} *</span><input type="text" id="aName" maxlength="100" value="${esc(a.name)}"><small class="ferr" id="eAName"></small></label></div>
  <div class="grid3"><label class="field"><span>${t('assetType')}</span><input type="text" id="aType" maxlength="40" value="${esc(a.type)}" list="aTypes"><datalist id="aTypes">${[...new Set(['Laptop','Desktop','Printer','Switch','Router','Firewall','Server','NVR','Access Point','UPS','Phone'].concat(S.assets.map(z=>z.type).filter(Boolean)))].map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
  <label class="field"><span>${t('aStatus')}</span><select id="aSt" data-ch="aSt">${C.ASSET_STATUSES.map(s=>opt(s,t('a_'+s),a.status)).join('')}</select></label>
  <label class="field"><span>${t('crit')}</span><select id="aCrit">${C.ASSET_CRIT.map(s=>opt(s,t('crit_'+s),a.criticality||'medium')).join('')}</select></label></div>
  <div class="grid2"><label class="field"><span>${t('owner')}</span><select id="aOwner">${opt('',t('noOwner'),a.requesterId||'')}${rqs.map(r=>opt(r.id,rqLabel(r),a.requesterId)).join('')}</select><small class="muted">${t('ownerHint')}</small></label>
  <label class="field"><span>${t('assetUser')}</span><input type="text" id="aUser" maxlength="80" value="${esc(a.user)}"><small class="muted">${t('userHint')}</small></label></div>
  <div class="grid3"><label class="field"><span>${t('location')}</span><input type="text" id="aLoc" maxlength="80" value="${esc(a.location)}"></label>
  <label class="field"><span>${t('serial')}</span><input type="text" id="aSerial" maxlength="60" value="${esc(a.serial||'')}" dir="ltr" class="mono"></label>
  <label class="field"><span>${t('vendor')}</span><input type="text" id="aVendor" maxlength="60" value="${esc(a.vendor||'')}"></label></div>
  <div class="grid2"><label class="field"><span>${t('purchaseDate')}</span><input type="date" id="aBuy" value="${esc(a.purchaseDate||'')}"></label>
  <label class="field"><span>${t('warrantyEnd')}</span><input type="date" id="aWar" value="${esc(a.warrantyEnd||'')}"><small class="ferr" id="eWar"></small></label></div>
  <label class="field"><span>${t('notes')}</span><textarea id="aNotes" rows="2" maxlength="1000">${esc(a.notes||'')}</textarea></label>
  <fieldset id="dispBox" class="dispbox" ${a.status==='disposed'?'':'hidden'}><legend>${t('disposal')}</legend>
   <div class="grid2"><label class="field"><span>${t('dMethod')} *</span><select id="dMethod">${opt('','—',dp.method)}${C.DISPOSAL_METHODS.map(m=>opt(m,t('dm_'+m),dp.method)).join('')}</select></label>
   <label class="field"><span>${t('dDate')} *</span><input type="date" id="dDate" value="${esc(dp.date||'')}"></label></div>
   <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px"><input type="checkbox" id="dWiped" ${dp.dataWiped?'checked':''} style="margin-top:3px"> ${t('dWipedLbl')}</label>
   <label class="field"><span>${t('dNote')}</span><input type="text" id="dNote" maxlength="300" value="${esc(dp.note||'')}" placeholder="${t('dNotePh')}"></label>
   <small class="ferr" id="eDisp"></small></fieldset>`,
 `<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="saveAsset">${t('save')}</button>`)}
async function saveAsset(){const g=id=>$('#'+id).value.trim();const tag=g('aTag'),name=g('aName');
 $('#eTag').textContent=tag?'':t('v_req2');$('#eAName').textContent=name?'':t('v_req2');$('#aTag').classList.toggle('err',!tag);$('#aName').classList.toggle('err',!name);
 const buy=g('aBuy'),war=g('aWar');const badD=buy&&war&&war<buy;$('#eWar').textContent=badD?t('bad_dates'):'';$('#aWar').classList.toggle('err',!!badD);
 const status=$('#aSt').value;let disposal=null;
 if(status==='disposed'){disposal={method:$('#dMethod').value,date:g('dDate'),dataWiped:$('#dWiped').checked,note:g('dNote')};
  const bad=!disposal.method||!disposal.date;$('#eDisp').textContent=bad?t('v_disposal'):'';if(bad)return}
 if(!tag||!name||badD)return;
 const id=U.form==='new'?C.uid():U.form;const old=asset(id)||{};
 if(await putEnt('assets',Object.assign({},old,{id,tag,name,type:g('aType'),status,criticality:$('#aCrit').value,requesterId:$('#aOwner').value,user:g('aUser'),location:g('aLoc'),
  serial:g('aSerial'),vendor:g('aVendor'),purchaseDate:buy,warrantyEnd:war,notes:$('#aNotes').value.trim(),disposal}))){const wasNew=U.form==='new';closeModal();toast(t('saved'));if(!wasNew)assetBox(id)}}
function planTargetTxt(p){if(p.assetIds&&p.assetIds.length){const tags=p.assetIds.map(i=>asset(i)).filter(Boolean).map(a=>a.tag);return `<bdi class="mono">${esc(tags.slice(0,3).join(', '))}</bdi>${tags.length>3?` +${tags.length-3}`:''}`}return `${t('allOfType')}: <bdi>${esc(p.assetType)}</bdi>`}
function vPlans(){const P=(S.plans||[]).slice().sort((a,b)=>(+b.active)-(+a.active)||a.nextDue.localeCompare(b.nextDue));
 return `<p class="muted" style="margin:0 0 10px">${t('pmSub')}</p><div class="tbl-wrap">${P.length?`<table><thead><tr><th>${t('planTitle')}</th><th>${t('pmTarget')}</th><th>${t('every')}</th><th>${t('nextDue')}</th><th>${t('assignee')}</th><th>${t('lastRun')}</th><th></th></tr></thead><tbody>
 ${P.map(p=>{const n=C.planTargets(S,p).length;return `<tr${p.active?'':' class="dim"'}><td><b>${esc(p.title)}</b><div class="muted" style="font-size:12px">${t('tys_'+p.type)} · ${esc(cat(p.categoryId)?.name||'—')} · ${t('ckItems').replace('{n}',(p.checklist||[]).length)}</div></td>
  <td>${planTargetTxt(p)}<div class="muted" style="font-size:12px">${t('nAssets').replace('{n}',n)}</div></td><td class="num">${t('everyN').replace('{n}',p.everyDays)}</td>
  <td style="white-space:nowrap">${fmtDay(p.nextDue)} ${p.active?dueChip(p.nextDue):`<span class="chip st-closed">${t('planPaused')}</span>`}</td>
  <td>${esc(p.assigneeId?agentName(p.assigneeId):t('byTeam'))}</td>
  <td class="muted" style="font-size:12.5px">${p.lastRun?`${fmtDate(p.lastRun.at)}<br>${t('runRes').replace('{c}',p.lastRun.created).replace('{s}',p.lastRun.skipped)}`:'—'}</td>
  <td style="white-space:nowrap">${isAdmin()?`<button class="btn sm" data-act="planRun" data-id="${esc(p.id)}">${t('runNow')}</button><button class="btn sm ghost" data-act="planForm" data-id="${esc(p.id)}">${t('edit')}</button><button class="icon-btn" data-act="entDel" data-coll="plans" data-id="${esc(p.id)}" aria-label="${t('del')}">✕</button>`:''}</td></tr>`}).join('')}</tbody></table>`
 :`<div class="empty">${t('noPlans')}</div>`}</div>`}
function planForm(id){const p=id?(S.plans||[]).find(z=>z.id===id):{title:'',desc:'',everyDays:30,nextDue:C.addDays(todayS(),7),leadDays:0,assetIds:[],assetType:'',type:'request',categoryId:'',assigneeId:'',checklist:[],active:true};
 if(!p)return;U.form=id||'new';const byType=!p.assetIds.length&&!!p.assetType;
 const live=S.assets.filter(a=>!['retired','disposed'].includes(a.status)||p.assetIds.includes(a.id)).sort((x,y)=>x.tag.localeCompare(y.tag));
 const types=[...new Set(S.assets.map(a=>a.type).filter(Boolean))].sort();
 modal(id?`${t('edit')} — ${p.title}`:t('newPlan'),`<label class="field"><span>${t('planTitle')} *</span><input type="text" id="pTitle" maxlength="120" value="${esc(p.title)}" placeholder="${t('planTitlePh')}"><small class="ferr" id="ePTitle"></small></label>
  <label class="field"><span>${t('description')}</span><textarea id="pDesc" rows="2" maxlength="2000">${esc(p.desc)}</textarea></label>
  <div class="grid2"><label class="field"><span>${t('type')}</span><select id="pType">${C.PM_TYPES.map(y=>opt(y,t('ty_'+y),p.type)).join('')}</select><small class="muted">${t('pmTypeHint')}</small></label>
  <label class="field"><span>${t('category')} *</span><select id="pCat"><option value="">—</option>${catOpts(p.categoryId)}</select><small class="ferr" id="ePCat"></small></label></div>
  <div class="field"><span>${t('pmTarget')} *</span><div class="seg" role="radiogroup"><button type="button" class="${byType?'':'on'}" data-act="pmMode" data-v="assets" aria-pressed="${!byType}">${t('pmSpecific')}</button><button type="button" class="${byType?'on':''}" data-act="pmMode" data-v="type" aria-pressed="${byType}">${t('pmByType')}</button></div></div>
  <div id="pmAssets" class="pm-list" ${byType?'hidden':''}>${live.length?live.map(a=>`<label><input type="checkbox" class="pmA" value="${esc(a.id)}" ${p.assetIds.includes(a.id)?'checked':''}> <span class="mono">${esc(a.tag)}</span> ${esc(a.name)} <span class="muted">· ${esc(a.type||'—')}</span></label>`).join(''):`<div class="muted">${t('noAssets')}</div>`}</div>
  <label class="field" id="pmTypeBox" ${byType?'':'hidden'}><input type="text" id="pAType" maxlength="40" list="pmTypes" value="${esc(p.assetType)}" placeholder="Printer"><datalist id="pmTypes">${types.map(x=>`<option value="${esc(x)}">`).join('')}</datalist><small class="muted">${t('pmTypeTargetHint')}</small></label>
  <small class="ferr" id="ePTarget"></small>
  <div class="grid3"><label class="field"><span>${t('every')} (${t('days')}) *</span><input type="number" id="pEvery" min="1" max="730" value="${esc(p.everyDays)}"></label>
  <label class="field"><span>${t('nextDue')} *</span><input type="date" id="pNext" value="${esc(p.nextDue)}"></label>
  <label class="field"><span>${t('leadDays')}</span><input type="number" id="pLead" min="0" max="30" value="${esc(p.leadDays||0)}"><small class="muted">${t('leadHint')}</small></label></div>
  <small class="ferr" id="ePSched"></small>
  <label class="field"><span>${t('assignee')}</span><select id="pAs">${opt('',t('byTeam'),p.assigneeId)}${S.agents.filter(a=>a.active||a.id===p.assigneeId).map(a=>opt(a.id,a.name,p.assigneeId)).join('')}</select></label>
  <label class="field"><span>${t('checklist')}</span><textarea id="pCk" rows="4" maxlength="6000" placeholder="${t('ckPh')}">${esc((p.checklist||[]).join('\n'))}</textarea><small class="muted">${t('ckHint')}</small></label>
  <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="pActive" ${p.active?'checked':''}> ${t('planActive')}</label>`,
 `<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="savePlan">${t('save')}</button>`)}
async function savePlan(){const g=id=>$('#'+id).value.trim();const title=g('pTitle'),categoryId=g('pCat');
 const byType=!$('#pmTypeBox').hidden;const assetIds=byType?[]:[...document.querySelectorAll('.pmA:checked')].map(i=>i.value);const assetType=byType?g('pAType'):'';
 const everyDays=Math.round(+g('pEvery')),nextDue=g('pNext'),leadDays=Math.round(+g('pLead')||0);
 const eT=title.length<3,eC=!categoryId,eG=!assetIds.length&&!assetType,eS=!(everyDays>=1&&everyDays<=730)||!nextDue||leadDays<0||leadDays>30;
 $('#ePTitle').textContent=eT?t('v_req2'):'';$('#ePCat').textContent=eC?t('v_cat'):'';$('#ePTarget').textContent=eG?t('v_target'):'';$('#ePSched').textContent=eS?t('v_every'):'';
 if(eT||eC||eG||eS)return;
 const id=U.form==='new'?C.uid():U.form;
 if(await putEnt('plans',{id,title,desc:$('#pDesc').value.trim(),type:$('#pType').value,categoryId,assetIds,assetType,everyDays,nextDue,leadDays,assigneeId:$('#pAs').value,
  checklist:$('#pCk').value.split('\n').map(s=>s.trim()).filter(Boolean),active:$('#pActive').checked})){closeModal();toast(t('saved'))}}
async function runPlan(id){try{const j=await api('POST',`/api/plans/${encodeURIComponent(id)}/run`);
 toast(t('runDone').replace('{c}',j.created.length).replace('{s}',j.skipped||0));await refresh(true)}catch(e){fail(e)}}

/* ================= collections via API ================= */
async function putEnt(coll,obj){
 try{const j=await api('PUT',`/api/c/${coll}/${encodeURIComponent(obj.id)}`,obj);upsert(coll,j.item);softRender();return true}
 catch(e){fail(e);return false}
}
async function delEnt(coll,id){
 try{const j=await api('DELETE',`/api/c/${coll}/${encodeURIComponent(id)}`);if(j.trash&&S.trash)upsert('trash',j.trash);remove(coll,id);softRender();return true}
 catch(e){fail(e);return false}
}

/* ================= KB ================= */
function vKB(){const q=U.kbq.trim().toLowerCase();
 const list=S.kb.filter(k=>!q||(k.title+' '+k.body+' '+k.tags).toLowerCase().includes(q));
 return `<div class="head"><div><h1>${t('kb')}</h1><p>${t('kbSub')}</p></div><button class="btn pri" data-act="kbForm">${I.plus}${t('newArticle')}</button></div>
 <div class="toolbar"><input type="search" id="kbq" placeholder="${t('kbSearch')}" value="${esc(U.kbq)}" style="max-width:360px"></div>
 ${list.length?`<div class="kb-grid">${list.map(k=>`<button class="card kb-card" data-act="kbOpen" data-id="${k.id}"><span class="muted" style="font-size:12px">${esc(cat(k.category)?.name||'—')}</span><b>${esc(k.title)}</b><p>${esc(k.body)}</p></button>`).join('')}</div>`:`<div class="empty">${t('noArticles')}</div>`}`}
function kbOpen(id){const k=S.kb.find(a=>a.id===id);if(!k)return;
 modal(k.title,`<div class="muted" style="font-size:12px">${esc(cat(k.category)?.name||'')} ${k.tags?'· '+esc(k.tags):''}</div><div class="desc">${esc(k.body)}</div>`,
 `${U.open?`<button class="btn" data-act="kbInsert" data-id="${k.id}">${t('insertLink')}</button>`:''}${isAdmin()?`<button class="btn ghost" data-act="entDel" data-coll="kb" data-id="${k.id}" style="color:var(--crit)">${t('del')}</button>`:''}<button class="btn" data-act="kbForm" data-id="${k.id}">${t('edit')}</button><button class="btn pri" data-act="mclose">${t('close')}</button>`)}
function kbForm(id){const k=id?S.kb.find(a=>a.id===id):{title:'',category:'',tags:'',body:''};U.form=id||'new';
 modal(id?t('edit'):t('newArticle'),`<label class="field"><span>${t('title')} *</span><input type="text" id="kT" maxlength="160" value="${esc(k.title)}"><small class="ferr" id="ekT"></small></label>
 <div class="grid2"><label class="field"><span>${t('category')}</span><select id="kC">${opt('',t('none'),k.category||'')}${catOpts(k.category)}</select></label>
 <label class="field"><span>${t('tags')}</span><input type="text" id="kG" value="${esc(k.tags)}" placeholder="${t('tagsHint')}" maxlength="200"></label></div>
 <label class="field"><span>${t('body')} *</span><textarea id="kB" rows="10" maxlength="10000">${esc(k.body)}</textarea><small class="ferr" id="ekB"></small></label>`,
 `<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="saveKb">${t('save')}</button>`)}
async function saveKb(){const T=$('#kT').value.trim(),B=$('#kB').value.trim();$('#ekT').textContent=T?'':t('v_req2');$('#ekB').textContent=B?'':t('v_req2');
 $('#kT').classList.toggle('err',!T);$('#kB').classList.toggle('err',!B);if(!T||!B)return;
 const id=U.form==='new'?C.uid():U.form;
 if(await putEnt('kb',{id,title:T,body:B,category:$('#kC').value,tags:$('#kG').value.trim()})){closeModal();toast(t('saved'))}}

/* ================= Reports ================= */
function vReports(){
 const P=U.period,from=P?now()-P*DAY:0;
 const inP=S.tickets.filter(x=>x.createdAt>=from);
 const resP=S.tickets.filter(x=>x.resolvedAt&&x.resolvedAt>=from);
 const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
 const agents=S.agents.map(a=>{const as=inP.filter(x=>x.assigneeId===a.id),rs=resP.filter(x=>x.assigneeId===a.id);
  const rt=avg(rs.map(x=>x.resolvedAt-x.createdAt)),fr=avg(as.filter(x=>x.firstResponseAt).map(x=>x.firstResponseAt-x.createdAt));
  const lg=S.tickets.reduce((s,x)=>s+x.worklogs.filter(w=>w.by===a.id&&w.at>=from).reduce((q,w)=>q+(+w.min||0),0),0);
  const cs=avg(rs.filter(x=>x.csat).map(x=>x.csat));const met=rs.filter(x=>sla(x).st==='met').length;
  return{a,as:as.length,rs:rs.length,rt,fr,lg,cs,comp:rs.length?Math.round(met/rs.length*100):null}});
 const prios=[1,2,3,4].map(p=>{const rs=resP.filter(x=>x.priority===p),met=rs.filter(x=>sla(x).st==='met').length;
  return{p,n:rs.length,met,br:rs.length-met,comp:rs.length?Math.round(met/rs.length*100):null,rt:avg(rs.map(x=>x.resolvedAt-x.createdAt)),fr:avg(rs.filter(x=>x.firstResponseAt).map(x=>x.firstResponseAt-x.createdAt)),pol:S.sla['P'+p]}});
 const cats=S.categories.map(c=>{const a=inP.filter(x=>x.categoryId===c.id);return{c,n:a.length,o:a.filter(isOpen).length,rt:avg(a.filter(x=>x.resolvedAt).map(x=>x.resolvedAt-x.createdAt))}}).filter(r=>r.n).sort((a,b)=>b.n-a.n);
 const rated=resP.filter(x=>x.csat);const dist=[5,4,3,2,1].map(v=>[v,rated.filter(x=>x.csat===v).length]);const maxD=Math.max(1,...dist.map(d=>d[1]));
 const compCls=v=>v==null?'':v>=90?'sla-ok':v>=75?'sla-risk':'sla-breached';
 const dd=v=>v==null?'—':dur(v);
 return `<div class="head"><div><h1>${t('reports')}</h1><p>${t('reportsSub')}</p></div>
 <div class="row-acts"><label class="field" style="flex-direction:row;align-items:center;gap:8px"><span>${t('period')}</span><select data-ch="period" style="width:auto">${[[7,'d7'],[30,'d30'],[90,'d90'],[0,'dall']].map(([v,k])=>opt(v,t(k),P)).join('')}</select></label><button class="btn sm" data-act="exportCsv">${t('exportCsv')}</button></div></div>
 <section class="card"><div class="ch"><h2>${t('slaByPrio')}</h2></div><div class="tbl-wrap" style="border:0">
 <table style="min-width:720px"><thead><tr><th>${t('priority')}</th><th>${t('respMin')}</th><th>${t('resMin')}</th><th>${t('resolved')}</th><th>${t('metN')}</th><th>${t('breachedN')}</th><th>${t('compliance')}</th><th>${t('avgResp')}</th><th>${t('avgRes')}</th></tr></thead><tbody>
 ${prios.map(r=>`<tr><td>${pChip(r.p)}</td><td class="num muted">${minsTxt(r.pol.resp)}</td><td class="num muted">${minsTxt(r.pol.res)}</td><td class="num">${r.n}</td><td class="num">${r.met}</td><td class="num">${r.br}</td><td>${r.comp==null?'—':`<span class="chip plain ${compCls(r.comp)} num">${r.comp}%</span>`}</td><td class="num">${dd(r.fr)}</td><td class="num">${dd(r.rt)}</td></tr>`).join('')}</tbody></table></div></section>
 <section class="card"><div class="ch"><h2>${t('agentPerf')}</h2></div><div class="tbl-wrap" style="border:0">
 <table style="min-width:760px"><thead><tr><th>${t('agent')}</th><th>${t('team')}</th><th>${t('assigned')}</th><th>${t('resolved')}</th><th>${t('compliance')}</th><th>${t('avgResp')}</th><th>${t('avgRes')}</th><th>${t('logged')}</th><th>${t('csatAvg')}</th></tr></thead><tbody>
 ${agents.map(r=>`<tr><td>${who(r.a.id)}</td><td class="muted">${esc(team(r.a.team)?.name||'—')}</td><td class="num">${r.as}</td><td class="num">${r.rs}</td><td>${r.comp==null?'—':`<span class="chip plain ${compCls(r.comp)} num">${r.comp}%</span>`}</td><td class="num">${dd(r.fr)}</td><td class="num">${dd(r.rt)}</td><td class="num">${minsTxt(r.lg)}</td><td class="num">${r.cs==null?'—':'★ '+r.cs.toFixed(1)}</td></tr>`).join('')}</tbody></table></div></section>
 <div class="dash"><section class="card"><div class="ch"><h2>${t('catBreak')}</h2></div><div class="tbl-wrap" style="border:0"><table style="min-width:420px"><thead><tr><th>${t('category')}</th><th>${t('total')}</th><th>${t('openN')}</th><th>${t('avgRes')}</th></tr></thead><tbody>
  ${cats.length?cats.map(r=>`<tr><td>${esc(r.c.name)}</td><td class="num">${r.n}</td><td class="num">${r.o}</td><td class="num">${dd(r.rt)}</td></tr>`).join(''):`<tr><td colspan="4" class="empty">—</td></tr>`}</tbody></table></div></section>
  <section class="card"><div class="ch"><h2>${t('csat')}</h2><span class="muted num">${rated.length?'★ '+avg(rated.map(x=>x.csat)).toFixed(2)+' · n='+rated.length:'—'}</span></div>
  <div class="bars">${dist.map(([v,n])=>`<div class="bar-row"><span class="lbl" style="color:var(--warn)">${'★'.repeat(v)}</span><span class="track"><i style="width:${n/maxD*100}%;background:var(--warn)"></i></span><b class="num">${n}</b></div>`).join('')}</div></section></div>`;
}

/* ================= Settings ================= */
/* ---- API tokens (MCP / scripts) ---- */
function tokSection(){if(!U.tokLoaded){U.tokLoaded=true;loadTokens()}const list=U.tokens||[];
 return `<section class="card props wide"><h2>${t('apiTokens')}</h2><div class="muted" style="font-size:13px">${t('apiTokensDesc')}</div>
 ${U.newToken?`<div class="note" style="border-inline-start-color:var(--ok)"><b>${t('tokOnce')}</b><code class="cmd" dir="ltr" id="newTok">${esc(U.newToken)}</code><div class="row-acts" style="margin-top:8px"><button class="btn sm" data-act="copyTok">${t('copy')}</button><button class="btn sm ghost" data-act="hideTok">${t('tokDone')}</button></div></div>`:''}
 <div class="grid3"><label class="field"><span>${t('tokName')}</span><input type="text" id="tokName" maxlength="60" placeholder="${t('tokNamePh')}"></label>
  <label class="field"><span>${t('tokScope')}</span><select id="tokScope">${opt('read',t('tok_read'),'read')}${opt('write',t('tok_write'),'read')}</select></label>
  <label class="field"><span>${t('tokDays')}</span><select id="tokDays">${[30,90,180,365].map(d=>opt(d,t('nDays').replace('{n}',d),90)).join('')}</select></label></div>
 <small class="ferr" id="tokErr"></small>
 <div class="row-acts"><button class="btn sm pri" data-act="tokCreate">${t('tokCreate')}</button></div>
 ${list.length?`<div class="tbl-wrap"><table style="min-width:640px"><thead><tr><th>${t('tokName')}</th><th>${t('tokScope')}</th><th>${t('tokExpires')}</th><th>${t('tokLastUsed')}</th><th></th></tr></thead><tbody>
 ${list.map(k=>`<tr><td><b>${esc(k.name)}</b>${k.agentId!==meId()?` <span class="muted">· ${esc(agentName(k.agentId))}</span>`:''}</td><td><span class="chip ${k.scope==='write'?'p2':'st-new'}">${t('tok_'+k.scope)}</span></td>
  <td class="num">${fmtDate(k.expires)}</td><td class="muted num">${k.lastUsed?`${rel(k.lastUsed)} · <span dir="ltr">${esc(k.lastIp)}</span>`:t('never')}</td>
  <td><button class="btn sm ghost" style="color:var(--crit)" data-act="tokRevoke" data-id="${esc(k.id)}">${t('tokRevoke')}</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="muted">${t('noTokens')}</div>`}
 </section>`}
async function loadTokens(){try{const j=await api('GET',isAdmin()?'/api/tokens':'/api/me/tokens');U.tokens=j.tokens;if(U.view==='settings')renderMain()}catch(e){fail(e)}}
function vSettings(){const s=S.settings,adm=isAdmin(),dis=adm?'':' disabled';
 const roles=a=>a.hasLogin?`<span class="chip plain ${a.role==='admin'?'p2':'p3'}">${t('r_'+a.role)}</span>`:`<span class="chip plain p4">${t('noLogin')}</span>`;
 return `<div class="head"><div><h1>${t('settings')}</h1></div></div>
 <div class="set-grid">
 <section class="card props"><h2>${t('prefs')}</h2>
  <div class="grid2"><label class="field"><span>${t('language')}</span><select data-ch="pref" data-k="lang">${opt('ar','العربية',lang)}${opt('en','English',lang)}</select></label>
  <label class="field"><span>${t('theme')}</span><select data-ch="pref" data-k="theme">${['system','light','white','g90','dark'].map(v=>opt(v,t('th_'+v),prefs.theme||'system')).join('')}</select></label></div>
  <div class="row-acts">${F('auth')?`<button class="btn sm" data-act="account">${t('changePw')}</button>`:''}<button class="btn sm ghost" data-act="about">${t('about')}</button></div>
 </section>
 ${F('apiTokens')?tokSection():''}
 <section class="card props"><h2>${t('general')}</h2>${adm?'':`<div class="note">${t('adminOnly')}</div>`}
  <div class="grid2"><label class="field"><span>${t('prefix')}</span><input type="text" data-ch="set" data-k="prefix" value="${esc(s.prefix)}" maxlength="6" dir="ltr"${dis}></label>
  <label class="field"><span>${t('autoClose')}</span><input type="number" data-ch="set" data-k="autoCloseDays" value="${+s.autoCloseDays||0}" min="0" max="60"${dis}><small class="muted">${t('autoCloseDesc')}</small></label></div>
  <label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-ch="set" data-k="autoAssign" ${s.autoAssign?'checked':''} style="margin-top:4px"${dis}><span><b>${t('autoAssign')}</b><br><span class="muted" style="font-size:13px">${t('autoAssignDesc')}</span></span></label>
 </section>
 <section class="card props wide"><h2>${t('slaPol')}</h2><div class="muted" style="font-size:13px">${t('slaPolDesc')}</div>
  <div class="tbl-wrap"><table class="edit" style="min-width:360px"><thead><tr><th>${t('priority')}</th><th>${t('respMin')}</th><th>${t('resMin')}</th></tr></thead><tbody>
  ${[1,2,3,4].map(p=>`<tr><td>${pChip(p)}</td><td><input type="number" min="1" max="100000" data-ch="sla" data-p="P${p}" data-k="resp" value="${S.sla['P'+p].resp}"${dis}><small class="muted">${minsTxt(S.sla['P'+p].resp)}</small></td><td><input type="number" min="1" max="100000" data-ch="sla" data-p="P${p}" data-k="res" value="${S.sla['P'+p].res}"${dis}><small class="muted">${minsTxt(S.sla['P'+p].res)}</small></td></tr>`).join('')}</tbody></table></div>
 </section>
 ${calSection(adm)}
 ${adm&&F('portal')?portalSection():''}
 ${adm?`
 <section class="card props wide"><div class="ch" style="margin:0"><h2>${t('agents')}</h2><button class="btn sm" data-act="agentForm">${I.plus}${t('newAgent')}</button></div>
  <div class="tbl-wrap"><table class="edit"><thead><tr><th>${t('name')}</th><th>${t('email')}</th><th>${t('team')}</th><th>${t('active')}</th>${F('auth')?`<th>${t('access')}</th>`:''}<th>${t('openTickets')}</th><th></th></tr></thead><tbody>
  ${S.agents.map(a=>`<tr><td><input type="text" data-ch="row" data-t="agents" data-id="${a.id}" data-k="name" value="${esc(a.name)}" maxlength="60"></td><td><input type="email" dir="ltr" data-ch="row" data-t="agents" data-id="${a.id}" data-k="email" value="${esc(a.email)}" maxlength="120"></td>
   <td><select data-ch="row" data-t="agents" data-id="${a.id}" data-k="team">${S.teams.map(x=>opt(x.id,x.name,a.team)).join('')}</select></td><td><input type="checkbox" data-ch="row" data-t="agents" data-id="${a.id}" data-k="active" ${a.active?'checked':''}${a.id===meId()?' disabled':''}></td>
   ${F('auth')?`<td style="white-space:nowrap">${roles(a)} ${a.id===meId()?`<span class="muted">(${t('you')})</span>`:''}</td>`:''}<td class="num">${openLoad(a.id)}</td>
   <td style="white-space:nowrap">${F('auth')?`<button class="btn sm ghost" data-act="accessForm" data-id="${a.id}">${t('setAccess')}</button>`:''}${a.id!==meId()?`<button class="icon-btn" data-act="entDel" data-coll="agents" data-id="${a.id}" aria-label="${t('del')}">✕</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 </section>
 <section class="card props"><div class="ch" style="margin:0"><h2>${t('teams')}</h2><button class="btn sm" data-act="addRow" data-t="teams">${I.plus}${t('add')}</button></div>
  <div class="tbl-wrap"><table class="edit" style="min-width:300px"><tbody>${S.teams.map(x=>`<tr><td><input type="text" data-ch="row" data-t="teams" data-id="${x.id}" data-k="name" value="${esc(x.name)}" maxlength="60"></td><td style="width:40px"><button class="icon-btn" data-act="entDel" data-coll="teams" data-id="${x.id}" aria-label="${t('del')}">✕</button></td></tr>`).join('')}</tbody></table></div>
 </section>
 <section class="card props"><div class="ch" style="margin:0"><h2>${t('categories')}</h2><button class="btn sm" data-act="addRow" data-t="categories">${I.plus}${t('add')}</button></div>
  <div class="tbl-wrap"><table class="edit" style="min-width:420px"><thead><tr><th>${t('name')}</th><th>${t('team')}</th><th></th></tr></thead><tbody>${S.categories.map(c=>`<tr><td><input type="text" data-ch="row" data-t="categories" data-id="${c.id}" data-k="name" value="${esc(c.name)}" maxlength="60"></td><td><select data-ch="row" data-t="categories" data-id="${c.id}" data-k="team">${S.teams.map(x=>opt(x.id,x.name,c.team)).join('')}</select></td><td style="width:40px"><button class="icon-btn" data-act="entDel" data-coll="categories" data-id="${c.id}" aria-label="${t('del')}">✕</button></td></tr>`).join('')}</tbody></table></div>
 </section>
 <section class="card props wide"><div class="ch" style="margin:0"><h2>${t('cannedR')}</h2><button class="btn sm" data-act="addRow" data-t="canned">${I.plus}${t('add')}</button></div>
  <div class="tbl-wrap"><table class="edit"><thead><tr><th style="width:30%">${t('title')}</th><th>${t('body')}</th><th></th></tr></thead><tbody>${S.canned.map(c=>`<tr><td><input type="text" data-ch="row" data-t="canned" data-id="${c.id}" data-k="title" value="${esc(c.title)}" maxlength="80"></td><td><textarea rows="2" data-ch="row" data-t="canned" data-id="${c.id}" data-k="body" maxlength="2000" style="min-height:52px">${esc(c.body)}</textarea></td><td style="width:40px"><button class="icon-btn" data-act="entDel" data-coll="canned" data-id="${c.id}" aria-label="${t('del')}">✕</button></td></tr>`).join('')}</tbody></table></div>
 </section>
 <section class="card props wide"><h2>${t('data')}</h2><div class="note">${F('server')?t('dataNote'):t('offlineNote')}</div>
  <div class="row-acts"><button class="btn" data-act="exportJson">${t('exportJson')}</button><button class="btn" data-act="importJson">${t('importJson')}</button></div>
 </section>
 ${F('server')?`<section class="card props wide"><div class="ch" style="margin:0"><h2>${t('emailSection')}</h2>${U.mail.enabled?`<button class="btn sm" data-act="mailTest">${t('mailTest')}</button>`:''}</div>
  <div class="note">${U.mail.enabled?t('mailOn'):t('mailOff')}${U.mail.enabled&&!U.mail.links?'<br>'+t('mailNoLinks'):''}</div><small class="ferr" id="mailErr" dir="auto"></small>
 </section>
 <section class="card props wide"><div class="ch" style="margin:0"><h2>${t('backups')}</h2><button class="btn sm pri" data-act="backupNow">${t('backupNow')}</button></div>
  ${backupsHtml()}
 </section>`:''}`:''}
 </div>`}

/* ================= Attachments ================= */
function fsize(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB'}
async function uploadFiles(ticketId,files){if(!F('attachments'))return toast(t('e_offline_unsupported'),'err');
 files=[...files].filter(Boolean);if(!files.length)return;
 const max=(U.limits.maxUploadMB||15)*1048576;const big=files.find(f=>f.size>max);
 if(big){toast(t('fileTooBig').replace('{f}',big.name).replace('{n}',U.limits.maxUploadMB),'err');return}
 toast(t('uploading').replace('{n}',files.length));let ok=0;
 for(const f of files){
  try{const r=await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/attachments`,{method:'POST',credentials:'same-origin',headers:{'x-itset':'1','content-type':'application/octet-stream','x-filename':encodeURIComponent(f.name||'file')},body:f});
   let j={};try{j=await r.json()}catch(_){}
   if(r.status===401){showAuth();return}
   if(!r.ok){toast(`${f.name}: ${errMsg(j.error)}`,'err');continue}
   upsert('tickets',j.ticket);ok++}
  catch(e){toast(`${f.name}: ${t('e_offline')}`,'err')}
 }
 if(ok){toast(t('uploaded').replace('{n}',ok));if(U.open===ticketId){U.tab='files'}softRender()}
}
function stampName(f){if(f.name&&!/^image\.(png|jpe?g|gif|webp)$/i.test(f.name))return f;
 const ext=(f.type.split('/')[1]||'png').replace('jpeg','jpg');const d=new Date(now());const p=n=>String(n).padStart(2,'0');
 const nm=`screenshot-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
 try{return new File([f],nm,{type:f.type})}catch(_){return f}}
document.addEventListener('paste',e=>{if(!S||!U.open||$('#modal').innerHTML)return;const files=[...((e.clipboardData&&e.clipboardData.files)||[])];if(!files.length)return;e.preventDefault();uploadFiles(U.open,files.map(stampName))});
const hasFiles=e=>e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files');
document.addEventListener('dragover',e=>{if(S&&U.open&&hasFiles(e)){e.preventDefault();$('.drawer')?.classList.add('dropping')}});
document.addEventListener('dragleave',e=>{if(e.target===document.documentElement||!e.relatedTarget)$('.drawer')?.classList.remove('dropping')});
document.addEventListener('drop',e=>{if(S&&U.open&&hasFiles(e)){e.preventDefault();$('.drawer')?.classList.remove('dropping');uploadFiles(U.open,e.dataTransfer.files)}});
document.addEventListener('change',e=>{if(e.target.id==='attInput'&&U.open){uploadFiles(U.open,e.target.files);e.target.value=''}});

/* ================= Notifications ================= */
function notifText(n){const by=n.fromRequester?t('requester'):n.by?agentName(n.by):t('system');
 const k=n.type==='assigned'&&n.auto?'n_assigned_auto':'n_'+n.type;
 return (L[k]?t(k):n.type).replace('{by}',by).replace('{key}',n.key).replace('{name}',n.name||'').replace('{p}',n.priority)}
function updateBell(){const c=$('#bellCnt');const n=U.notifs.unread;if(c){c.hidden=!n;c.textContent=n>99?'99+':n}
 document.title=(n?`(${n}) `:'')+'IT Set Desk'}
function onNotif(n){U.notifs.items.unshift(n);U.notifs.items=U.notifs.items.slice(0,50);U.notifs.unread++;updateBell();
 if(document.hidden&&prefs.desktop&&'Notification' in window&&Notification.permission==='granted'){
  try{const dn=new Notification(`${n.key} — IT Set`,{body:notifText(n)+'\n'+C.demoText(n.title,lang),tag:n.id});dn.onclick=()=>{window.focus();if(tk(n.ticketId))openTicket(n.ticketId);markRead([n.id]);dn.close()}}catch(_){}}
 else toast(notifText(n))}
async function markRead(ids,all){try{const j=await api('POST','/api/notifications/read',all?{all:true}:{ids});U.notifs=j;updateBell()}catch(e){fail(e)}}
function notifPanel(){const items=U.notifs.items;
 modal(t('notifications'),items.length?`<div class="nlist">${items.map(n=>`<button class="nitem ${n.read?'':'unread'}" data-act="notifOpen" data-id="${n.id}">
  <span class="ndot"></span><span class="ntext"><b>${esc(notifText(n))}</b><span class="muted">${esc(C.demoText(n.title,lang))}</span></span><span class="muted num" style="white-space:nowrap">${rel(n.at)}</span></button>`).join('')}</div>`:`<div class="empty">${t('noNotifs')}</div>`,
 U.notifs.unread?`<button class="btn" data-act="notifAll">${t('markAllRead')}</button>`:'',true)}
function desktopPrefHtml(){
 if(!window.isSecureContext||!('Notification' in window))return `<label style="display:flex;gap:8px;align-items:flex-start;opacity:.65"><input type="checkbox" disabled style="margin-top:4px"> <span>${t('desktopNotif')}<br><small class="muted">${t('desktopNeedsHttps')}</small></span></label>`;
 const on=prefs.desktop&&Notification.permission==='granted';
 return `<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-ch="desktopNotif" ${on?'checked':''} style="margin-top:4px"> <span>${t('desktopNotif')}${Notification.permission==='denied'?`<br><small class="ferr">${t('desktopDenied')}</small>`:''}</span></label>`}
function openFromHash(){const m=/^#t-(.+)$/.exec(location.hash||'');if(!m||!S)return;let key='';try{key=decodeURIComponent(m[1])}catch(_){return}
 const x=S.tickets.find(z=>z.key===key);if(x){U.view=U.view==='dashboard'?'tickets':U.view;renderNav();renderMain();openTicket(x.id)}else toast(t('e_not_found'),'err');
 try{history.replaceState(null,'',location.pathname+'#'+U.view)}catch(_){}}
window.addEventListener('hashchange',openFromHash);

/* ================= About ================= */
const DEV={email:'abdo11amer@gmail.com'};
function aboutBox(){const lic=U.license||{};const team=lic.edition!=='offline';
 modal(t('about'),`<div class="about">
  <div class="about-head"><div class="brand-mark about-mark">IT</div><div><b class="about-name">${t('app')}</b><div class="muted">${t('suite')}</div></div></div>
  <dl class="about-dl">
   <dt>${t('version')}</dt><dd class="num" dir="ltr">${esc(U.version||'—')}</dd>
   <dt>${t('edition')}</dt><dd>${team?t('ed_team'):t('ed_offline')}</dd>
   <dt>${t('licensedTo')}</dt><dd>${lic.licensee?`<b>${esc(lic.licensee)}</b>`:`<span class="muted">${t('evalCopy')}</span>`}</dd>
   <dt>${t('designedBy')}</dt><dd><b>${t('devName')}</b><br><span class="muted">${t('devTitle')}</span></dd>
   <dt>${t('contact')}</dt><dd><span class="mono" dir="ltr" style="user-select:all">${esc(DEV.email)}</span> <button class="btn sm ghost" data-act="copyText" data-v="${esc(DEV.email)}">${t('copy')}</button></dd>
  </dl>
  <div class="note">${t('rights')}<br>${t('licenseNote')}</div>
  <small class="muted">${t('builtWith')}</small></div>`,`<button class="btn pri" data-act="mclose">${t('close')}</button>`,true)}

/* ================= Requesters ================= */
const rqById=id=>(S.requesters||[]).find(r=>r.id===id);
const rqLabel=r=>r.email?`${r.name} <${r.email}>`:r.name;
function copyText(v){try{navigator.clipboard.writeText(v).then(()=>toast(t('copied')),()=>toast(v))}catch(_){toast(v)}}
function rqStats(){const m=new Map();for(const x of S.tickets){if(!x.requesterId)continue;let o=m.get(x.requesterId);if(!o){o={n:0,open:0,last:0};m.set(x.requesterId,o)}o.n++;if(isOpen(x))o.open++;if(x.createdAt>o.last)o.last=x.createdAt}return m}
function vRequesters(){const q=(U.rqq||'').trim().toLowerCase();const st=rqStats();
 const list=(S.requesters||[]).filter(r=>!q||[r.name,r.email,r.dept,r.phone].join(' ').toLowerCase().includes(q)).sort((a,b)=>((st.get(b.id)||{}).last||0)-((st.get(a.id)||{}).last||0));
 return `<div class="head"><div><h1>${t('requesters')}</h1><p>${t('rqSub')}</p></div><button class="btn pri" data-act="rqNew">${I.plus}${t('newRequester')}</button></div>
 <div class="toolbar"><input type="search" id="rqq" placeholder="${t('rqSearch')}" value="${esc(U.rqq||'')}" style="max-width:360px" aria-label="${t('rqSearch')}"></div>
 <div class="tbl-wrap">${list.length?`<table><thead><tr><th>${t('name')}</th><th>${t('email')}</th><th>${t('reqDept')}</th><th>${t('totalTickets')}</th><th>${t('openN')}</th><th>${t('lastTicket')}</th></tr></thead><tbody>
 ${list.map(r=>{const o=st.get(r.id)||{n:0,open:0,last:0};return `<tr class="row" data-act="rqOpen" data-id="${esc(r.id)}"><td><span class="who"><span class="av">${esc(initials(r.name))}</span>${esc(r.name)}</span></td><td class="muted" dir="ltr" style="text-align:start">${esc(r.email||'—')}</td><td>${esc(r.dept||'—')}</td><td class="num">${o.n}</td><td class="num">${o.open?`<span class="chip plain p3">${o.open}</span>`:'0'}</td><td class="muted num">${o.last?rel(o.last):'—'}</td></tr>`}).join('')}</tbody></table>`:`<div class="empty">${t('noRequesters')}</div>`}</div>`}
function requesterBox(id){const r=id?rqById(id):{name:'',email:'',dept:'',phone:''};if(id&&!r)return;U.form=id||'new';
 const ts=id?S.tickets.filter(x=>x.requesterId===id).sort((a,b)=>b.createdAt-a.createdAt):[];
 const others=(S.requesters||[]).filter(z=>z.id!==id).sort((a,b)=>a.name.localeCompare(b.name));
 modal(id?r.name:t('newRequester'),`<div class="grid2"><label class="field"><span>${t('name')} *</span><input type="text" id="rqName" maxlength="80" value="${esc(r.name)}"></label>
  <label class="field"><span>${t('email')}</span><input type="email" id="rqEmail" maxlength="120" dir="ltr" value="${esc(r.email)}"></label></div>
  <div class="grid2"><label class="field"><span>${t('reqDept')}</span><input type="text" id="rqDept" maxlength="60" value="${esc(r.dept)}"></label>
  <label class="field"><span>${t('phone')}</span><input type="text" id="rqPhone" maxlength="30" dir="ltr" value="${esc(r.phone||'')}"></label></div>
  <small class="ferr" id="rqErr" role="alert"></small>
  ${id?(()=>{const as=S.assets.filter(a=>a.requesterId===id&&a.status!=='disposed'&&a.status!=='retired');return `<h3>${t('rqAssets')} · ${as.length}</h3>${as.length?`<div class="kbs">${as.map(a=>`<button data-act="assetOpen" data-id="${esc(a.id)}"><span class="mono">${esc(a.tag)}</span> ${esc(a.name||'')} <span class="muted">${esc(a.type||'')}</span></button>`).join('')}</div>`:`<p class="muted">${t('rqNoAssets')}</p>`}`})():''}
  ${id?`<h3>${t('history')} · ${t('ticketsN').replace('{n}',ts.length)}</h3>
  ${ts.length?`<div class="kbs">${ts.slice(0,30).map(x=>`<button data-act="rqTicket" data-id="${x.id}"><span class="mono muted">${esc(x.key)}</span> ${esc(x.title)} ${stChip(x.status)} <span class="muted num" style="font-size:12px">${rel(x.createdAt)}</span></button>`).join('')}</div>`:`<div class="muted">—</div>`}
  ${isAdmin()&&others.length?`<h3>${t('mergeInto')}</h3><div class="row-acts"><select id="rqMergeSel" style="flex:1" aria-label="${t('mergeInto')}">${others.map(o=>opt(o.id,rqLabel(o))).join('')}</select><button class="btn sm" data-act="rqMerge">${t('merge')}</button></div><small class="muted">${t('mergeHint')}</small>`:''}`:''}`,
 `${id&&isAdmin()&&!ts.length?`<button class="btn ghost" data-act="entDel" data-coll="requesters" data-id="${esc(id)}" style="color:var(--crit)">${t('del')}</button>`:''}<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="rqSave">${t('save')}</button>`)}
async function saveRequester(){const er=$('#rqErr');er.textContent='';const name=$('#rqName').value.trim(),email=$('#rqEmail').value.trim().toLowerCase();
 if(!name){er.textContent=t('v_req');return}if(email&&!C.EMAIL_RE.test(email)){er.textContent=t('v_email');return}
 const id=U.form==='new'?C.uid():U.form;const cur=rqById(id)||{};
 try{const j=await api('PUT',`/api/c/requesters/${encodeURIComponent(id)}`,Object.assign({},cur,{id,name,email,dept:$('#rqDept').value.trim(),phone:$('#rqPhone').value.trim(),active:true}));
  upsert('requesters',j.item);closeModal();toast(t('saved'));softRender()}catch(e){er.textContent=errMsg(e.code,e)}}

/* ================= Business hours ================= */
const TZS=['Africa/Cairo','Asia/Riyadh','Asia/Dubai','Asia/Kuwait','Asia/Qatar','Asia/Bahrain','Asia/Muscat','Asia/Amman','Asia/Beirut','Asia/Baghdad','Africa/Casablanca','Africa/Tunis','Africa/Algiers','Africa/Tripoli','Europe/Istanbul','Europe/London','Europe/Berlin','America/New_York','UTC'];
function fmtDateTz(ts,tz){try{return new Intl.DateTimeFormat(loc(),{timeZone:tz,weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(ts)}catch(_){return fmtDate(ts)}}
function calSection(adm){
 if(!U.cal)U.cal=JSON.parse(JSON.stringify(S.settings.calendar||C.DEFAULT_CAL));
 const c=U.cal,dis=adm?'':' disabled',order=[6,0,1,2,3,4,5];
 const hm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
 let preview='';try{const cc=C.cleanCalendar(c);preview=`${t('calPreview')}: <b class="num">${esc(fmtDateTz(C.businessAdd(cc,now(),S.sla.P3.res*MIN),cc.tz))}</b>`}catch(e){preview=`<span class="ferr">${esc(errMsg(e.code||e.message))}</span>`}
 return `<section class="card props wide"><div class="ch" style="margin:0"><div><h2>${t('bizHours')}</h2><div class="muted" style="font-size:13px">${t('bizSub')}</div></div>${adm?`<button class="btn sm pri" data-act="saveCal">${t('saveCal')}</button>`:''}</div>
 <div class="grid2"><label class="field"><span>${t('calMode')}</span><select data-ch="cal" data-k="mode"${dis}>${opt('24x7',t('cal24'),c.mode)}${opt('business',t('calBiz'),c.mode)}</select></label>
  <label class="field"><span>${t('tz')}</span><input type="text" data-ch="cal" data-k="tz" value="${esc(c.tz)}" list="tzList" dir="ltr"${dis}><datalist id="tzList">${TZS.map(z=>`<option value="${z}"></option>`).join('')}</datalist></label></div>
 ${c.mode==='business'?`<div class="tbl-wrap"><table class="edit" style="min-width:420px"><thead><tr><th>${t('workday')}</th><th>${t('from')}</th><th>${t('to')}</th></tr></thead><tbody>
 ${order.map(d=>{const w=c.days[d];return `<tr><td><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ch="cal" data-k="on" data-d="${d}" ${w?'checked':''}${dis}> ${t('d'+d)}</label></td>
  <td><input type="time" data-ch="cal" data-k="start" data-d="${d}" value="${w?hm(w[0]):'09:00'}"${w?'':' disabled'}${dis} aria-label="${t('d'+d)} ${t('from')}"></td>
  <td><input type="time" data-ch="cal" data-k="end" data-d="${d}" value="${w?hm(Math.min(w[1],1439)):'17:00'}"${w?'':' disabled'}${dis} aria-label="${t('d'+d)} ${t('to')}"></td></tr>`}).join('')}</tbody></table></div>
 <h3>${t('holidays')}</h3>
 ${c.holidays.length?`<div>${c.holidays.map(h=>`<div class="ck"><span class="num mono">${esc(h.date)}</span><span style="flex:1">${esc(h.name)}</span>${adm?`<button class="icon-btn" data-act="calDelHol" data-id="${esc(h.date)}" aria-label="${t('del')}">✕</button>`:''}</div>`).join('')}</div>`:`<div class="muted">${t('noHolidays')}</div>`}
 ${adm?`<div class="row-acts"><input type="date" id="holDate" style="width:auto" aria-label="${t('holidays')}"><input type="text" id="holName" placeholder="${t('holidayName')}" maxlength="60" style="flex:1;min-width:140px"><button class="btn sm" data-act="calAddHol">${t('addHoliday')}</button></div>`:''}`:''}
 <div class="note">${preview}</div>
 </section>`}
function calEdit(el){const c=U.cal,k=el.dataset.k,d=+el.dataset.d;
 const toMin=v=>{const m=/^(\d{2}):(\d{2})/.exec(v||'');return m?+m[1]*60+(+m[2]):null};
 if(k==='mode'){c.mode=el.value;renderMain();return}
 if(k==='tz'){c.tz=el.value.trim();renderMain();return}
 if(k==='on'){c.days[d]=el.checked?(c.days[d]||[540,1020]):null;renderMain();return}
 const w=(c.days[d]||[540,1020]).slice();const v=toMin(el.value);if(v==null)return;
 if(k==='start')w[0]=v;else w[1]=v>=1439?1440:v;c.days[d]=w;renderMain()}

/* ================= Portal settings ================= */
function portalSection(){const p=S.settings.portal||{enabled:false,allowedDomains:[]};const url=location.origin+'/portal';
 return `<section class="card props wide"><div><h2>${t('portal')}</h2><div class="muted" style="font-size:13px">${t('portalSub')}</div></div>
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ch="portal" data-k="enabled" ${p.enabled?'checked':''}> <b>${t('portalOn')}</b></label>
 ${p.enabled?`<div class="field"><span>${t('portalUrl')}</span><div class="row-acts"><code class="cmd" dir="ltr" style="flex:1;min-width:0">${esc(url)}</code><button class="btn sm" data-act="copyText" data-v="${esc(url)}">${t('copy')}</button><a class="btn sm" href="/portal" target="_blank" rel="noopener">${t('open')}</a></div></div>`:''}
 <label class="field"><span>${t('allowedDomains')}</span><input type="text" data-ch="portal" data-k="allowedDomains" value="${esc((p.allowedDomains||[]).join(', '))}" dir="ltr" placeholder="company.com"><small class="muted">${t('allowedHint')}</small></label>
 ${!U.mail.enabled?`<div class="note">${t('portalMailNote')}</div>`:''}
 </section>`}

/* ================= Audit log ================= */
const AUL={'auth.setup':['إعداد النظام','System setup'],'auth.login':['تسجيل دخول','Sign-in'],'auth.login_failed':['محاولة دخول فاشلة','Failed sign-in'],'auth.logout':['تسجيل خروج','Sign-out'],
 'auth.password_change':['تغيير كلمة المرور','Password change'],'agent.access':['تغيير صلاحية / كلمة مرور','Role / password change'],'agent.revoke':['إلغاء دخول موظف','Login revoked'],
 'agent.create':['إضافة موظف','Agent added'],'agent.update':['تعديل موظف','Agent edited'],'agent.delete':['حذف موظف','Agent deleted'],'settings.update':['تعديل الإعدادات','Settings changed'],
 'ticket.delete':['حذف تذكرة','Ticket deleted'],'trash.restore':['استرجاع من السلة','Restored from trash'],'trash.purge':['حذف نهائي','Deleted forever'],'trash.empty':['تفريغ السلة','Trash emptied'],
 'data.export':['تصدير البيانات','Data exported'],'data.import':['استيراد البيانات','Data imported'],'backup.manual':['نسخة احتياطية يدوية','Manual backup'],'mail.test':['إيميل تجريبي','Test email'],
 'audit.verify':['التحقق من السجل','Audit verified'],'audit.export':['تصدير السجل','Audit exported'],'portal.ticket_create':['طلب من البوابة','Portal request'],'portal.otp_sent':['إرسال كود دخول البوابة','Portal code sent'],
 'portal.login':['دخول البوابة','Portal sign-in'],'requester.create':['إضافة مقدم طلب','Requester added'],'requester.update':['تعديل مقدم طلب','Requester edited'],'requester.delete':['حذف مقدم طلب','Requester deleted'],
 'requester.merge':['دمج مقدمي طلبات','Requesters merged'],'team.create':['إضافة فريق','Team added'],'team.update':['تعديل فريق','Team edited'],'team.delete':['حذف فريق','Team deleted'],
 'categorie.create':['إضافة تصنيف','Category added'],'categorie.update':['تعديل تصنيف','Category edited'],'categorie.delete':['حذف تصنيف','Category deleted'],
 'canned.create':['إضافة رد جاهز','Canned reply added'],'canned.update':['تعديل رد جاهز','Canned reply edited'],'canned.delete':['حذف رد جاهز','Canned reply deleted'],
 'asset.delete':['حذف أصل','Asset deleted'],'kb.delete':['حذف مقال','Article deleted'],'auth.password_reset_cli':['إعادة تعيين كلمة مرور من السيرفر','Password reset on server (CLI)']};
const AUD_GROUPS=['auth','settings','agent','ticket','trash','data','backup','portal','requester','team','categorie','canned'];
const audLabel=a=>AUL[a]?AUL[a][lang==='ar'?0:1]:a;
function audActor(a){if(a==='requester')return t('requester');if(a==='cli')return 'CLI';if(a==='system')return t('system');if(!a||a==='-')return '—';return esc(agentName(a))}
function audDetail(d){if(d==null)return '';if(typeof d!=='object')return esc(String(d));
 const f=x=>x==null?'—':typeof x==='object'?JSON.stringify(x).slice(0,80):String(x).slice(0,120);
 return Object.entries(d).slice(0,8).map(([k,v])=>`<span class="kv"><b>${esc(k)}</b> ${Array.isArray(v)&&v.length===2?`${esc(f(v[0]))} → ${esc(f(v[1]))}`:esc(f(v))}</span>`).join(' ')}
async function loadAudit(more){U.audLoaded=true;const q=new URLSearchParams({limit:'200'});if(U.audAction)q.set('action',U.audAction+'.');
 if(more&&U.aud&&U.aud.rows.length)q.set('before',U.aud.rows[U.aud.rows.length-1].seq);
 try{const j=await api('GET','/api/audit?'+q);U.aud=more&&U.aud?{rows:U.aud.rows.concat(j.rows),retentionDays:j.retentionDays,end:j.rows.length<200}:Object.assign(j,{end:j.rows.length<200});if(U.view==='audit')renderMain()}
 catch(e){U.audLoaded=false;fail(e)}}
function vAudit(){const a=U.aud,v=U.audVerify;
 return `<div class="head"><div><h1>${t('audit')}</h1><p>${t('auditSub')}${a?` · ${a.retentionDays?t('retention').replace('{n}',a.retentionDays):t('retentionForever')}`:''}</p></div>
 <div class="row-acts"><button class="btn" data-act="audVerify">${t('verify')}</button><a class="btn" href="/api/audit/export" download>${t('exportCsv')}</a></div></div>
 ${v?`<div class="note ${v.ok?'note-ok':'note-bad'}">${v.ok?'✓ '+t('verifyOk').replace('{n}',v.count):'⚠ '+t('verifyBad').replace('{n}',v.brokenAt)}</div>`:''}
 <div class="toolbar"><select data-ch="audAction" aria-label="${t('action')}"><option value="">${t('allActions')}</option>${AUD_GROUPS.map(g=>opt(g,L['g_'+g]?t('g_'+g):g,U.audAction||'')).join('')}</select></div>
 <div class="tbl-wrap">${!a?`<div class="empty">${t('loading')}</div>`:a.rows.length?`<table><thead><tr><th>${t('when')}</th><th>${t('actor')}</th><th>${t('action')}</th><th>${t('target')}</th><th>${t('details')}</th><th>${t('ip')}</th></tr></thead><tbody>
 ${a.rows.map(r=>`<tr><td class="num muted" style="white-space:nowrap">${fmtDate(r.at)}</td><td style="white-space:nowrap">${audActor(r.actor)}</td><td><span class="chip plain ${/failed|delete|purge|revoke|empty/.test(r.action)?'p1':/access|settings|import|password/.test(r.action)?'p2':'p4'}">${esc(audLabel(r.action))}</span></td><td dir="auto">${esc(r.target)}</td><td class="aud-d">${audDetail(r.detail)}</td><td class="mono muted" dir="ltr">${esc(r.ip)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">—</div>`}</div>
 ${a&&!a.end?`<div style="text-align:center"><button class="btn" data-act="audMore">${t('loadMore')}</button></div>`:''}`}

/* ================= Trash ================= */
function trashLabel(x){const i=x.item||{};
 if(x.coll==='tickets')return `<span class="mono muted">${esc(i.key)}</span> ${esc(i.title)}`;
 if(x.coll==='assets')return `<span class="mono muted">${esc(i.tag)}</span> ${esc(i.name)}`;
 return esc(i.title)}
function vTrash(){const list=(S.trash||[]).slice().sort((a,b)=>b.deletedAt-a.deletedAt);const days=+S.trashDays||0;
 return `<div class="head"><div><h1>${t('trash')}</h1><p>${days?t('trashSub').replace('{n}',days):t('trashSubForever')}</p></div>
  ${list.length?`<button class="btn danger" data-act="emptyTrash">${t('emptyTrash')}</button>`:''}</div>
 <div class="tbl-wrap">${list.length?`<table><thead><tr><th>${t('type')}</th><th>${t('title')}</th><th>${t('deletedBy')}</th><th>${t('deletedAt')}</th>${days?`<th>${t('purgeIn')}</th>`:''}<th></th></tr></thead><tbody>
 ${list.map(x=>{const left=days?Math.max(0,Math.ceil((x.deletedAt+days*DAY-now())/DAY)):0;return `<tr><td><span class="chip plain p3">${t('c_'+x.coll)}</span></td><td>${trashLabel(x)}</td><td>${who(x.deletedBy)}</td><td class="num muted" title="${esc(fmtDate(x.deletedAt))}">${rel(x.deletedAt)}</td>${days?`<td class="num">${left} ${t('days')}</td>`:''}
  <td style="white-space:nowrap"><button class="btn sm" data-act="restore" data-id="${esc(x.id)}">${t('restore')}</button> <button class="btn sm ghost" style="color:var(--crit)" data-act="purge" data-id="${esc(x.id)}">${t('purge')}</button></td></tr>`}).join('')}</tbody></table>`:`<div class="empty">✓ ${t('trashEmpty')}</div>`}</div>`}

/* ================= Backups (admin) ================= */
async function loadBackups(){U.bkLoaded=true;try{U.bk=await api('GET','/api/backups');if(U.view==='settings'&&!editing($('#main')))renderMain()}catch(e){U.bkLoaded=false;fail(e)}}
function backupsHtml(){const b=U.bk;if(!b)return `<div class="muted">${t('loading')}</div>`;
 const kb=n=>n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB';
 return `<div class="note">${b.autoHours?t('autoBackupOn').replace('{h}',b.autoHours).replace('{k}',b.keep):t('autoBackupOff')}<br>${t('restoreHint')}</div>
 ${b.backups.length?`<div class="tbl-wrap"><table class="edit" style="min-width:480px"><thead><tr><th>${t('created')}</th><th>${t('type')}</th><th>${t('fileCol')}</th><th>${t('sizeCol')}</th></tr></thead><tbody>
 ${b.backups.slice(0,20).map(x=>`<tr><td class="num">${fmtDate(x.at)}</td><td><span class="chip plain ${x.kind==='preimport'?'p2':x.kind==='auto'?'p3':'p4'}">${t('bk_'+x.kind)}</span></td><td class="mono" dir="ltr" style="text-align:start">${esc(x.file)}</td><td class="num">${kb(x.size)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${t('noBackups')}</div>`}`}

function agentForm(){
 modal(t('newAgent'),`<div class="grid2"><label class="field"><span>${t('name')} *</span><input type="text" id="agName" maxlength="60"></label>
  <label class="field"><span>${t('email')} *</span><input type="email" id="agEmail" maxlength="120" dir="ltr" autocomplete="off"></label></div>
  <div class="grid2"><label class="field"><span>${t('team')}</span><select id="agTeam">${S.teams.map(x=>opt(x.id,x.name)).join('')}</select></label>
  ${F('auth')?`<label class="field"><span>${t('role')}</span><select id="agRole">${opt('agent',t('r_agent'))}${opt('admin',t('r_admin'))}</select></label>`:''}</div>
  ${F('auth')?`<label class="field"><span>${t('password')}</span><input type="password" id="agPw" maxlength="200" dir="ltr" autocomplete="new-password"><small class="muted">${t('pwOptional')} · ${t('pwHint')}</small></label>`:''}
  <small class="ferr" id="agErr" role="alert"></small>`,
 `<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="saveAgent">${t('save')}</button>`)}
async function saveAgent(){const er=$('#agErr');er.textContent='';
 const name=$('#agName').value.trim(),email=$('#agEmail').value.trim(),pw=$('#agPw')?$('#agPw').value:'';
 if(!name){er.textContent=t('v_req');return}if(!C.EMAIL_RE.test(email)){er.textContent=t('v_email');return}if(pw&&pw.length<8){er.textContent=t('e_v_pw');return}
 const id=C.uid();
 try{const j=await api('PUT',`/api/c/agents/${id}`,{id,name,email,team:$('#agTeam').value,active:true});upsert('agents',j.item);
  if(pw){const k=await api('PUT',`/api/agents/${id}/access`,{role:$('#agRole').value,password:pw});upsert('agents',k.item)}
  closeModal();toast(t('saved'));softRender()}catch(e){er.textContent=errMsg(e.code)}}
function accessForm(id){const a=agent(id);if(!a)return;U.form=id;
 modal(`${t('setAccess')} — ${a.name}`,`<div class="muted" dir="ltr" style="text-align:start">${esc(a.email)}</div>
  <label class="field"><span>${t('role')}</span><select id="acRole">${opt('agent',t('r_agent'),a.role||'agent')}${opt('admin',t('r_admin'),a.role)}</select></label>
  <label class="field"><span>${a.hasLogin?t('newPw'):t('password')+' *'}</span><input type="password" id="acPw" maxlength="200" dir="ltr" autocomplete="new-password"><small class="muted">${a.hasLogin?t('pwKeep'):t('pwHint')}</small></label>
  <small class="ferr" id="acErr" role="alert"></small>`,
 `${a.hasLogin&&a.id!==meId()?`<button class="btn danger" data-act="revoke" data-id="${a.id}">${t('revoke')}</button>`:''}<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="saveAccess">${t('save')}</button>`,true)}
async function saveAccess(){const er=$('#acErr');er.textContent='';const id=U.form,a=agent(id);const pw=$('#acPw').value;
 if(!a.hasLogin&&!pw){er.textContent=t('e_v_pw');return}if(pw&&pw.length<8){er.textContent=t('e_v_pw');return}
 const body={role:$('#acRole').value};if(pw)body.password=pw;
 try{const j=await api('PUT',`/api/agents/${encodeURIComponent(id)}/access`,body);upsert('agents',j.item);if(id===meId())U.me.role=j.item.role;closeModal();toast(t('saved'));render()}catch(e){er.textContent=errMsg(e.code)}}
function accountBox(){const me=agent(meId());
 modal(t('myAccount'),`<div class="who"><span class="av">${esc(initials(me?.name))}</span><div><b>${esc(me?.name||'')}</b><div class="muted" dir="ltr" style="font-size:13px">${esc(me?.email||'')}</div></div><span class="chip plain p3">${t('r_'+U.me.role)}</span></div>
  <h3 style="margin-top:8px">${t('changePw')}</h3>
  <label class="field"><span>${t('currentPw')}</span><input type="password" id="mpCur" maxlength="200" dir="ltr" autocomplete="current-password"></label>
  <div class="grid2"><label class="field"><span>${t('newPw')}</span><input type="password" id="mpNew" maxlength="200" dir="ltr" autocomplete="new-password"></label>
  <label class="field"><span>${t('password2')}</span><input type="password" id="mpNew2" maxlength="200" dir="ltr" autocomplete="new-password"></label></div>
  <small class="ferr" id="mpErr" role="alert"></small>
  <h3 style="margin-top:8px">${t('notifSettings')}</h3>
  ${desktopPrefHtml()}
  ${U.mail.enabled?`<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-ch="emailNotif" ${U.me.prefs&&U.me.prefs.email===false?'':'checked'} style="margin-top:4px"> ${t('emailNotif')}</label>`:''}`,
 `<button class="btn danger" data-act="logout">${t('logout')}</button><span style="flex:1"></span><button class="btn" data-act="mclose">${t('close')}</button><button class="btn pri" data-act="savePw">${t('changePw')}</button>`)}
async function savePw(){const er=$('#mpErr');er.textContent='';const cur=$('#mpCur').value,n1=$('#mpNew').value;
 if(n1.length<8){er.textContent=t('e_v_pw');return}if(n1!==$('#mpNew2').value){er.textContent=t('pwMismatch');return}
 try{await api('POST','/api/me/password',{current:cur,password:n1});closeModal();toast(t('pwChanged'))}catch(e){er.textContent=errMsg(e.code)}}

/* ================= Export / Import ================= */
async function tryDownload(name,text,mime){
 try{if(window.claude&&typeof window.claude.use==='function'){const d=await window.claude.use('downloads');if(d){try{await d.save({filename:name,data:text})}catch(e){if(e&&e.code!=='declined')toast(t('e_server_error'),'err')}return}}}catch(_){}
 try{const b=new Blob([text],{type:mime});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}catch(e){toast(t('e_server_error'),'err')}}
function csv(){const q=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`};
 const head=['Key','Title','Type','Status','Priority','Impact','Urgency','Category','Team','Assignee','Requester','Email','Department','Asset','Tags','Created','First response','Resolved','Closed','SLA','Time logged (min)','CSAT'];
 const iso=v=>v?new Date(v).toISOString():'';
 const rows=filtered(U.view!=='tickets').map(x=>[x.key,x.title,x.type,x.status,'P'+x.priority,x.impact,x.urgency,cat(x.categoryId)?.name,team(x.teamId)?.name,x.assigneeId?agentName(x.assigneeId):'',x.requester?.name,x.requester?.email,x.requester?.dept,asset(x.assetId)?.tag||'',(x.tags||[]).join(' '),iso(x.createdAt),iso(x.firstResponseAt),iso(x.resolvedAt),iso(x.closedAt),sla(x).st,x.worklogs.reduce((a,w)=>a+(+w.min||0),0),x.csat||'']);
 return '﻿'+[head,...rows].map(r=>r.map(q).join(',')).join('\r\n')}
function importBox(){modal(t('importJson'),`<div class="note">${t('importNote')}</div><input type="file" id="impFile" accept=".json,application/json"><textarea id="impTxt" rows="8" dir="ltr" placeholder="{ ... }" style="font-family:var(--f-mono);font-size:12px"></textarea><small class="ferr" id="eImp"></small>`,
 `<button class="btn" data-act="mclose">${t('cancel')}</button><button class="btn pri" data-act="doImport">${t('importJson')}</button>`)}

/* ================= events ================= */
document.addEventListener('click',async e=>{
 if(e.target.closest('[data-stop]')&&!e.target.closest('[data-act]:not(tr)'))return;
 const el=e.target.closest('[data-act]');if(!el)return;
 const a=el.dataset.act,id=el.dataset.id,x=U.open&&S?tk(U.open):null;
 if(a==='mbg'&&e.target!==el)return;
 if(a==='toggleLang'){lang=lang==='ar'?'en':'ar';prefs.lang=lang;savePrefs();return showAuth()}
 if(!S&&a!=='mclose')return;
 switch(a){
  case'view':U.view=el.dataset.v;U.sel.clear();try{history.replaceState(null,'','#'+U.view)}catch(_){}renderNav();renderMain();window.scrollTo(0,0);break;
  case'new':ticketForm();break;
  case'quick':U.f.quick=el.dataset.q;if(U.view!=='tickets'){U.view='tickets';renderNav()}renderMain();break;
  case'open':openTicket(id);break;
  case'closeDrawer':U.open=null;renderDrawer();break;
  case'sort':{const k=el.dataset.k;U.sort={k,d:U.sort.k===k?-U.sort.d:(k==='updatedAt'?-1:1)};renderMain();break}
  case'clearF':Object.assign(U.f,{q:'',status:'',priority:'',assignee:'',category:'',type:'',asset:''});{const gs=$('#gsearch');if(gs)gs.value=''}renderMain();break;
  case'clearAsset':U.f.asset='';renderMain();break;
  case'bulkClear':U.sel.clear();renderMain();break;
  case'bulkApply':{const as=$('#bulkAssign').value,st=$('#bulkStatus').value;if(!as&&!st){toast(t('noneSelected'),'err');break}
   const list=[];if(as)list.push({op:'set',key:'assigneeId',value:as==='none'?'':as});if(st)list.push({op:'set',key:'status',value:st});
   await busy(el,async()=>{let okAll=true;for(const i of [...U.sel]){if(!(await ops(i,list)))okAll=false}if(okAll){U.sel.clear();toast(t('bulkDone'))}softRender()});break}
  case'bulkDel':confirmBox(t('confirmTrash'),async()=>{for(const i of [...U.sel]){try{const j=await api('DELETE',`/api/tickets/${encodeURIComponent(i)}`);if(j.trash&&S.trash)upsert('trash',j.trash);remove('tickets',i);U.sel.delete(i)}catch(err){fail(err);break}}toast(t('movedToTrash'));softRender()});break;
  case'exportCsv':tryDownload('tickets-'+new Date(now()).toISOString().slice(0,10)+'.csv',csv(),'text/csv;charset=utf-8');break;
  case'exportAssetsCsv':tryDownload('assets-'+new Date(now()).toISOString().slice(0,10)+'.csv',C.assetsCsv(S,assetFiltered(),todayS()),'text/csv;charset=utf-8');break;
  case'exportJson':try{const j=await api('GET','/api/export');tryDownload('itset-servicedesk-backup-'+new Date(now()).toISOString().slice(0,10)+'.json',JSON.stringify(j,null,1),'application/json')}catch(err){fail(err)}break;
  case'importJson':importBox();break;
  case'doImport':{let o=null;try{o=JSON.parse($('#impTxt').value)}catch(_){}if(!o||o.version!==1||!Array.isArray(o.tickets)){$('#eImp').textContent=t('importBad');break}
   confirmBox(t('importNote'),async()=>{try{const j=await api('POST','/api/import',o);toast(t('importDone').replace('{f}',j.backup||'—'));U.open=null;U.bkLoaded=false;await refresh()}catch(err){fail(err)}});break}
  case'mclose':closeModal();break;
  case'mbg':closeModal();break;
  case'mok':{const f=U.onOk;closeModal();f&&f();break}
  case'saveTicket':await busy(el,saveTicket);break;
  case'edit':x&&ticketForm(x);break;
  case'delT':x&&confirmBox(t('confirmTrash'),async()=>{try{const j=await api('DELETE',`/api/tickets/${encodeURIComponent(x.id)}`);if(j.trash&&S.trash)upsert('trash',j.trash);remove('tickets',x.id);U.sel.delete(x.id);U.open=null;toast(t('movedToTrash'));softRender();renderDrawer()}catch(err){fail(err)}});break;
  case'assignMe':x&&ops(x.id,[{op:'set',key:'assigneeId',value:meId()}]);break;
  case'st':if(x){const v=el.dataset.v;await busy(el,async()=>{if(await ops(x.id,[{op:'set',key:'status',value:v}]))toast(`${x.key} → ${t('st_'+v)}`)})}break;
  case'tab':U.tab=el.dataset.v;renderDrawer();break;
  case'kind':U.kind=el.dataset.v;renderDrawer();break;
  case'addCm':{if(!x)break;const ta=$('#cmBody');const b=ta.value.trim();if(!b){ta.classList.add('err');break}
   await busy(el,async()=>{if(await ops(x.id,[{op:'comment',kind:U.kind,body:b}])){const t2=$('#cmBody');if(t2)t2.value='';renderDrawer()}});break}
  case'addWork':{if(!x)break;const m=Math.round(+$('#wlMin').value);if(!(m>0&&m<=1440)){$('#wlMin').classList.add('err');toast(t('e_v_min'),'err');break}
   await busy(el,()=>ops(x.id,[{op:'work-add',min:m,note:$('#wlNote').value.trim()}]));break}
  case'delWork':x&&ops(x.id,[{op:'work-del',wid:id}]);break;
  case'addCk':{if(!x)break;const v=$('#ckNew').value.trim();if(!v){$('#ckNew').classList.add('err');break}
   await busy(el,async()=>{if(await ops(x.id,[{op:'check-add',text:v}])){renderDrawer();setTimeout(()=>$('#ckNew')?.focus(),0)}});break}
  case'delCk':x&&ops(x.id,[{op:'check-del',cid:id}]);break;
  case'link':{if(!x)break;const o=$('#linkSel').value;if(o)await ops(x.id,[{op:'link',other:o}]);break}
  case'unlink':x&&ops(x.id,[{op:'unlink',other:id}]);break;
  case'csat':x&&ops(x.id,[{op:'csat',v:+el.dataset.v}]);break;
  case'assetForm':assetForm(id);break;
  case'assetOpen':assetBox(id);break;
  case'tokCreate':await busy(el,async()=>{const name=$('#tokName').value.trim();$('#tokErr').textContent=name.length<2?t('v_req'):'';if(name.length<2)return;
   try{const j=await api('POST','/api/me/tokens',{name,scope:$('#tokScope').value,days:+$('#tokDays').value});U.newToken=j.token;await loadTokens();renderMain()}catch(err){fail(err)}});break;
  case'copyTok':try{await navigator.clipboard.writeText(U.newToken||'');toast(t('copied'))}catch(_){const c=$('#newTok');if(c){const r=document.createRange();r.selectNodeContents(c);const s=getSelection();s.removeAllRanges();s.addRange(r)}}break;
  case'hideTok':U.newToken=null;renderMain();break;
  case'tokRevoke':confirmBox(t('tokRevokeQ'),async()=>{closeModal();try{await api('DELETE',`/api/me/tokens/${encodeURIComponent(id)}`);await loadTokens();toast(t('saved'))}catch(err){fail(err)}});break;
  case'assetNewTicket':closeModal();ticketForm(null,{assetId:id});break;
  case'atab':U.atab=el.dataset.v;renderMain();break;
  case'af':{U.af=U.af||{q:'',status:'',type:'',warranty:''};U.af[el.dataset.k]=el.dataset.v;if(el.dataset.k==='warranty')U.af.status='';U.atab='list';renderMain();break}
  case'afClear':U.af={q:'',status:'',type:'',warranty:''};renderMain();break;
  case'pmTickets':Object.assign(U.f,{q:'preventive',status:'',priority:'',assignee:'',category:'',type:'',asset:'',quick:'open'});U.view='tickets';{const gs=$('#gsearch');if(gs)gs.value='preventive'}renderNav();renderMain();break;
  case'pmMode':{const ty=el.dataset.v==='type';$('#pmAssets').hidden=ty;$('#pmTypeBox').hidden=!ty;el.parentNode.querySelectorAll('button').forEach(b=>{const on=b===el;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});break}
  case'planForm':planForm(id);break;
  case'savePlan':await busy(el,savePlan);break;
  case'planRun':await busy(el,()=>runPlan(id));break;
  case'saveAsset':await busy(el,saveAsset);break;
  case'assetTickets':closeModal();Object.assign(U.f,{asset:id,quick:'all'});U.view='tickets';renderNav();renderMain();break;
  case'kbOpen':kbOpen(id);break;
  case'kbForm':kbForm(id);break;
  case'saveKb':await busy(el,saveKb);break;
  case'kbInsert':{const k=S.kb.find(z=>z.id===id);closeModal();if(!k||!x)break;U.tab='conv';U.kind='reply';renderDrawer();const ta=$('#cmBody');ta.value=(ta.value?ta.value+'\n\n':'')+k.title+'\n'+k.body;ta.focus();break}
  case'entDel':{const coll=el.dataset.coll;if(C.inUse(S,coll,id)){toast(t('e_in_use'),'err');break}const soft=coll==='assets'||coll==='kb';
   confirmBox(soft?t('confirmTrash'):t('confirmDelGeneric'),async()=>{closeModal();if(await delEnt(coll,id))toast(soft?t('movedToTrash'):t('saved'))});break}
  case'restore':await busy(el,async()=>{try{const j=await api('POST',`/api/trash/${encodeURIComponent(id)}/restore`);upsert(j.coll,j.item);remove('trash',id);toast(t('restored'));softRender()}catch(err){fail(err)}});break;
  case'purge':confirmBox(t('confirmPurge'),async()=>{try{await api('DELETE',`/api/trash/${encodeURIComponent(id)}`);remove('trash',id);softRender()}catch(err){fail(err)}});break;
  case'emptyTrash':confirmBox(t('confirmEmpty'),async()=>{try{await api('DELETE','/api/trash');S.trash=[];softRender()}catch(err){fail(err)}});break;
  case'backupNow':await busy(el,async()=>{try{await api('POST','/api/backups');toast(t('backupDone'));await loadBackups()}catch(err){fail(err)}});break;
  case'addRow':{const tb=el.dataset.t,nid=C.uid();let obj;
   if(tb==='teams')obj={id:nid,name:lang==='ar'?'فريق جديد':'New team'};
   if(tb==='categories'){if(!S.teams.length)break;obj={id:nid,name:lang==='ar'?'تصنيف جديد':'New category',team:S.teams[0].id}}
   if(tb==='canned')obj={id:nid,title:lang==='ar'?'رد جديد':'New reply',body:''};
   if(obj&&await putEnt(tb,obj))setTimeout(()=>{const i=document.querySelector(`[data-id="${nid}"][data-k]`);if(i){i.focus();i.select&&i.select()}},150);break}
  case'agentForm':agentForm();break;
  case'saveAgent':await busy(el,saveAgent);break;
  case'accessForm':accessForm(id);break;
  case'saveAccess':await busy(el,saveAccess);break;
  case'revoke':confirmBox(t('confirmRevoke'),async()=>{try{const j=await api('DELETE',`/api/agents/${encodeURIComponent(id)}/access`);upsert('agents',j.item);toast(t('saved'));softRender()}catch(err){fail(err)}});break;
  case'account':accountBox();break;
  case'about':aboutBox();break;
  case'lang':setLang(lang==='ar'?'en':'ar');break;
  case'rqOpen':requesterBox(id);break;
  case'rqNew':requesterBox(null);break;
  case'rqSave':await busy(el,saveRequester);break;
  case'rqMerge':{const into=$('#rqMergeSel').value,from=U.form;const a=rqById(from),b=rqById(into);if(!a||!b)break;
   confirmBox(t('confirmMerge').replace('{a}',a.name).replace('{b}',b.name),async()=>{try{const j=await api('POST',`/api/requesters/${encodeURIComponent(into)}/merge`,{from});toast(t('merged').replace('{n}',j.moved));await refresh(true)}catch(err){fail(err)}});break}
  case'rqTicket':closeModal();openTicket(id);break;
  case'copyPortal':if(x){const link=location.origin+'/portal?t='+encodeURIComponent(x.portalToken);copyText(link)}break;
  case'copyText':copyText(el.dataset.v);break;
  case'calAddHol':{const d=$('#holDate').value,n=$('#holName').value.trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){$('#holDate').classList.add('err');break}
   U.cal.holidays=U.cal.holidays.filter(h=>h.date!==d).concat([{date:d,name:n}]).sort((a,b)=>a.date<b.date?-1:1);renderMain();break}
  case'calDelHol':U.cal.holidays=U.cal.holidays.filter(h=>h.date!==id);renderMain();break;
  case'saveCal':await busy(el,async()=>{try{const j=await api('PUT','/api/settings',{settings:Object.assign({},S.settings,{calendar:U.cal})});S.settings=j.settings;U.cal=null;toast(t('saved'));softRender()}catch(err){fail(err)}});break;
  case'audVerify':await busy(el,async()=>{try{const v=await api('GET','/api/audit/verify');U.audVerify=v;renderMain()}catch(err){fail(err)}});break;
  case'audMore':await busy(el,()=>loadAudit(true));break;
  case'notifs':notifPanel();break;
  case'notifOpen':{const n=U.notifs.items.find(z=>z.id===id);closeModal();markRead([id]);if(n&&tk(n.ticketId))openTicket(n.ticketId);else toast(t('e_not_found'),'err');break}
  case'notifAll':markRead(null,true);closeModal();break;
  case'delFile':if(x)confirmBox(t('confirmDelFile'),async()=>{try{const j=await api('DELETE',`/api/tickets/${encodeURIComponent(x.id)}/attachments/${encodeURIComponent(id)}`);upsert('tickets',j.ticket);softRender()}catch(err){fail(err)}});break;
  case'copyLink':if(x){const link=location.origin+location.pathname+'#t-'+encodeURIComponent(x.key);try{navigator.clipboard.writeText(link).then(()=>toast(t('linkCopied')),()=>toast(link))}catch(_){toast(link)}}break;
  case'mailTest':await busy(el,async()=>{const er=$('#mailErr');er.textContent='';try{const j=await api('POST','/api/mail/test');toast(t('mailTestOk').replace('{to}',j.to))}catch(err){er.textContent=errMsg(err.code,err)+(err.detail?' — '+err.detail:'')}});break;
  case'savePw':await busy(el,savePw);break;
  case'logout':try{await api('POST','/api/logout')}catch(_){}closeModal();showAuth();break;
 }
});
document.addEventListener('change',async e=>{
 const el=e.target.closest('[data-ch]');if(!el||!S)return;const c=el.dataset.ch,x=U.open?tk(U.open):null;
 switch(c){
  case'f':U.f[el.dataset.k]=el.value;U.sel.clear();renderMain();break;
  case'sel':el.checked?U.sel.add(el.dataset.id):U.sel.delete(el.dataset.id);renderMain();break;
  case'selAll':{const rows=filtered();el.checked?rows.forEach(r=>U.sel.add(r.id)):rows.forEach(r=>U.sel.delete(r.id));renderMain();break}
  case'showClosed':U.showClosed=el.checked;renderMain();break;
  case'period':U.period=+el.value;renderMain();break;
  case'pm':{const i=+$('#fImp').value,u=+$('#fUrg').value;$('#pmOut').textContent='P'+prio(i,u);$('#pmGrid').innerHTML=matrixHtml(i,u);break}
  case'canned':{const r=S.canned.find(z=>z.id===el.value);if(r){const ta=$('#cmBody');ta.value=(ta.value?ta.value+'\n':'')+r.body;ta.focus()}el.value='';break}
  case'desktopNotif':{if(el.checked){if(!('Notification' in window)){el.checked=false;break}
    const p=await Notification.requestPermission().catch(()=>'denied');prefs.desktop=p==='granted';if(!prefs.desktop){el.checked=false;toast(t('desktopDenied'),'err')}}else prefs.desktop=false;savePrefs();break}
  case'emailNotif':try{const j=await api('PUT','/api/me/prefs',{email:el.checked});U.me.prefs=j.prefs;toast(t('saved'))}catch(err){fail(err);el.checked=!el.checked}break;
  case'ck':if(x)ops(x.id,[{op:'check-toggle',cid:el.dataset.id,done:el.checked}]);break;
  case'tf':if(x){const k=el.dataset.k;let v=el.value;if(k==='impact'||k==='urgency')v=+v;if(!(await ops(x.id,[{op:'set',key:k,value:v}])))renderDrawer()}break;
  case'pref':{const k=el.dataset.k;if(k==='lang'){setLang(el.value);break}prefs[k]=el.value;savePrefs();render();break}
  case'localMe':try{await api('POST','/api/local/me',{id:el.value});U.me.id=el.value;render()}catch(err){fail(err)}break;
  case'cal':calEdit(el);break;
  case'portal':{const k=el.dataset.k;const pt=Object.assign({},S.settings.portal||{});pt[k]=el.type==='checkbox'?el.checked:el.value;
   try{const j=await api('PUT','/api/settings',{settings:Object.assign({},S.settings,{portal:pt})});S.settings=j.settings;toast(t('saved'))}catch(err){fail(err)}renderMain();break}
  case'audAction':U.audAction=el.value;U.audLoaded=false;renderMain();break;
  case'af':U.af=U.af||{q:'',status:'',type:'',warranty:''};U.af[el.dataset.k]=el.value;renderMain();break;
  case'aSt':{const box=$('#dispBox');if(box)box.hidden=el.value!=='disposed';break}
  case'set':{const k=el.dataset.k;const v=el.type==='checkbox'?el.checked:el.value;
   try{const j=await api('PUT','/api/settings',{settings:Object.assign({},S.settings,{[k]:v})});S.settings=j.settings;S.sla=j.sla;toast(t('saved'))}catch(err){fail(err)}renderMain();break}
  case'sla':{const v=Math.round(+el.value);const sl=JSON.parse(JSON.stringify(S.sla));sl[el.dataset.p][el.dataset.k]=v;
   try{const j=await api('PUT','/api/settings',{sla:sl});S.settings=j.settings;S.sla=j.sla;toast(t('saved'))}catch(err){fail(err)}renderMain();break}
  case'row':{const coll=el.dataset.t;const r=S[coll].find(z=>z.id===el.dataset.id);if(!r)break;const k=el.dataset.k;const v=el.type==='checkbox'?el.checked:el.value.trim();
   const obj=Object.assign({},r,{[k]:v});delete obj.role;delete obj.hasLogin;
   if(await putEnt(coll,obj))toast(t('saved'));else renderMain();break}
 }
});
document.addEventListener('change',e=>{if(e.target.id!=='impFile')return;const f=e.target.files&&e.target.files[0];if(!f)return;
 if(f.size>20*1024*1024){$('#eImp').textContent=t('e_too_large');return}
 const r=new FileReader();r.onload=()=>{$('#impTxt').value=r.result;$('#eImp').textContent=''};r.onerror=()=>{$('#eImp').textContent=t('importBad')};r.readAsText(f)});
document.addEventListener('input',e=>{
 if(!S)return;
 if(e.target.id==='gsearch'){U.f.q=e.target.value;U.sel.clear();if(U.view!=='tickets'&&U.view!=='board'){U.view='tickets';U.f.quick='all';renderNav()}renderMain()}
 else if(e.target.id==='rqq'){U.rqq=e.target.value;const p=e.target.selectionStart;renderMain();const k=$('#rqq');k.focus();try{k.setSelectionRange(p,p)}catch(_){}}
 else if(e.target.id==='fRn'){const v=e.target.value;const r=(S.requesters||[]).find(z=>rqLabel(z)===v);
  if(r){e.target.value=r.name;$('#fRe').value=r.email||'';$('#fRd').value=r.dept||'';U.formReq=r.id}else if(U.formReq){const fr=rqById(U.formReq);if(!fr||fr.name!==v)U.formReq=null}}
 else if(e.target.id==='fRe'){const v=e.target.value.trim().toLowerCase();const r=v&&(S.requesters||[]).find(z=>z.email===v);
  if(r){U.formReq=r.id;if(!$('#fRn').value.trim())$('#fRn').value=r.name;if(!$('#fRd').value.trim())$('#fRd').value=r.dept||''}}
 else if(e.target.id==='asq'){U.af=U.af||{q:'',status:'',type:'',warranty:''};U.af.q=e.target.value;const p=e.target.selectionStart;renderMain();const k=$('#asq');k.focus();try{k.setSelectionRange(p,p)}catch(_){}}
 else if(e.target.id==='kbq'){U.kbq=e.target.value;const p=e.target.selectionStart;renderMain();const k=$('#kbq');k.focus();try{k.setSelectionRange(p,p)}catch(_){}}
 else if(e.target.classList.contains('err'))e.target.classList.remove('err');
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if($('#modal').innerHTML)closeModal();else if(U.open){U.open=null;renderDrawer()}return}
 if(!S)return;
 const tg=e.target.tagName;if(/INPUT|TEXTAREA|SELECT/.test(tg)||e.ctrlKey||e.metaKey||e.altKey)return;
 if($('#modal').innerHTML)return;
 if(e.key==='n'||e.key==='N'||e.key==='ى'){e.preventDefault();ticketForm()}
 else if(e.key==='/'){e.preventDefault();$('#gsearch')?.focus()}
 else if(e.key==='Enter'&&e.target.classList.contains('kcard'))openTicket(e.target.dataset.id);
});

/* ================= boot ================= */
applyTheme();
start();
setInterval(()=>{if(S&&!$('#modal').innerHTML)softRender()},30000);
})();
