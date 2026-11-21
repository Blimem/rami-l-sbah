// Languages: Tounsi (darja), العربية, Français, English.
import { rankLabel } from '../core/rules.js';

export const LANGS = [
  { id: 'tn', name: 'Tounsi', dir: 'ltr' },
  { id: 'ar', name: 'العربية', dir: 'rtl' },
  { id: 'fr', name: 'Français', dir: 'ltr' },
  { id: 'en', name: 'English', dir: 'ltr' },
];

const tn = {
  'st.online': '{n} online', 'st.connecting': 'Connexion…', 'st.offline': 'Offline', 'st.none': 'Mode solo', 'st.reconnecting': 'Reconnexion…',
  'e.sameCard': 'Nafs el carta marrtin.', 'e.notInHand': 'El carta mouch fi yeddek.', 'e.roundOver': 'El jarya kamlet.', 'e.notYourTurn': 'Mouch dourek.',
  'e.unknown': 'Action inconnue.', 'e.tooLate': 'Fat el wa9t.', 'e.decideFirst': '9oul 9bal: nal3bou wala le?', 'e.alreadyDrew': 'Deja jbedt.',
  'e.discardEmpty': 'El ard fergha.', 'e.cantUndo': 'Ma tnajjamch traja3.', 'e.drawFirst': 'Lazem tejbed carta 9bal.', 'e.noSelection': 'Ma khtartech carta.',
  'e.badMeld': 'Combinaison mouch s7i7a.', 'e.keepOne': 'Lazem tkhalli carta bech tremiha.', 'e.mustUse': 'Lazem testa3mel el carta elli hezzitha mel ard.',
  'e.noMeld': 'Hbouta mouch mawjouda.', 'e.openFirst': 'Lazem t7ell 9bal ma tzid 3al hbout.', 'e.cantLayoff': 'El carta ma tetzadech lel hbouta hedhi.',
  'e.openFirstSwap': 'Lazem t7ell 9bal ma tbaddel joker.', 'e.swapNatural': 'Baddel b carta 3adia.', 'e.cantSwap': 'El carta hedhi ma tbaddelch joker hna.',
  'e.mustUseOrUndo': 'Lazem testa3mel el carta elli hezzitha mel ard (wala rajja3ha).', 'e.sameDiscard': 'Ma tnajjamch tremi nafs el carta elli hezzitha.',
  'e.startedNoSeat': 'El 7arka bdet, ma famech blassa.', 'e.full': 'Tawla m3abbya.', 'e.hostOnly': 'Ken el host ynajjem.', 'e.started': 'El jarya bdet.',
  'e.forbidden': 'Ma tnajjamch.', 'e.twoPlayers': 'Lazem 2 joueurs 3al a9al (zid bot).', 'e.noGame': 'Ma famma 7atta jarya.', 'e.noTable': 'Tawla mouch mawjouda (thabbet fil code).',
  'e.notAtTable': 'Mouch fi tawla.', 'e.server': 'Ghalta fil serveur.', 'e.openMin': "L'ouverture lazemha {min} point (3andek {pts}).",
  'i.joined': '{name} dkhal lel tawla.', 'i.left': '{name} kharaj.', 'i.replacedBot': '{name} dkhal blasset bot.',
  't.timeUp': 'Wa9tek wfé: el jeu l3eb blastek.', 't.kicked': 'El host na77ak mel tawla.', 't.replaced': 'El compte t7al fi blasa okhra.',
  't.codeShort': 'Ekteb code el tawla (5 7rouf).', 't.needServer': 'Lazem adresse mta3 serveur bech tal3ab online.', 't.connecting': 'Mazelna nconnectiw lel serveur…',
  't.copied': 'Lien copié ✓', 't.opened': '{name} 7all b {n} point', 't.swapped': '{name} baddel joker', 't.timeout': 'Wa9t {name} wfé',
  't.penalty': '{name}: +{n} ({why})', 't.trophy': 'Enzel 🏆 bech traja3 el résultats', 't.musicAdded': 'El mousi9a tzadet ✓', 't.recorded': 'Tsajjel ✓', 't.noMic': 'Ma najjamtech nesta3mel el micro.',
  profile: 'Profil', 'profile.welcome': 'Mar7ba bik', 'profile.ask': 'Chnoua esmek?', 'profile.edit': 'Baddel profilek', 'profile.hint': 'Hedha elli ychoufouh s7abek 3al tawla.', 'profile.name': 'Esmek',
  save: 'Sajjel', saved: 'Tsajjel ✓', cancel: 'Batel', close: 'Sakker', ok: 'Behi', you: 'enti', pts: 'pts', bot: 'bot', opened: '7all', leave: 'Okhrej',
  settings: 'Réglages', 'settings.title': 'Réglages', 'set.lang': 'Lougha', 'set.music': 'Mousi9a', 'set.musicOn': 'Mousi9a fil background', 'set.volume': 'Volume',
  'set.addMusic': 'Zid mousi9tek', 'set.musicHint': 'El morceaux 🥁 originaux (darbouka, mezoued, stambeli). Tnajjem tzid mp3 men telifounek: yab9aw 3andek enti barka.',
  'set.sfx': 'Sounat', 'set.sfxOn': 'Sounat el jeu', 'set.linesOn': 'Klem el jeu (marznik, tris, quatro)', 'set.server': 'Serveur online',
  'set.serverHint': "Fel site ma tbaddel chay. Fel application, 7ott el lien mta3 el serveur (mithel https://rami-tounsi.onrender.com).",
  'line.marznik': 'Imchi marznik!', 'line.marznik.when': 'Ki wa7ed yfout 30 seconde', 'line.tris': 'Hedhi tris lil 3ris', 'line.tris.when': 'Ki wa7ed yremi 3', 'line.quatro': 'Quatro, ija khoudh b khatrou', 'line.quatro.when': 'Ki wa7ed yremi 4',
  'lines.mine': 'b sowtek', 'lines.tts': 'sout el telifoun', 'lines.test': 'Esma3', 'lines.record': 'Sajjel', 'lines.stop': 'Wa9ef', 'lines.reset': 'Rajja3 el sout el asli',
  'level.easy': 'Sahel', 'level.normal': '3adi', 'level.pro': 'Pro', bots: 'Bots', level: 'Niveau', rounds: 'Jarayet', players: 'Joueurs', turnTime: 'Wa9t kol dour', visibility: 'Visibilité', public: 'Publique', private: 'Privée', botLevel: 'Niveau el bots',
  'rooms.noServer': 'Mode online mouch mconfiguri', 'rooms.noServerHint': '7ott adresse el serveur fil réglages bech tal3ab m3a s7abek.', 'rooms.empty': 'Ma famma 7atta tawla tawa', 'rooms.emptyHint': 'A3mel tawla jdida w ab3eth el code l s7abek.',
  'rooms.playing': 'Tal3eb…', 'rooms.waiting': 'Ystanna', 'rooms.rounds': '{n} jarya', 'rooms.inGame': 'Jarya', 'rooms.full': "M3abbya", 'rooms.join': 'Odkhol',
  'create.title': 'Tawla jdida', 'create.hint': 'S7abek yodkhlou bel code wala bel lien.', 'create.name': 'Esm el tawla', 'create.defaultName': 'Tawlet {name}', 'create.go': 'A3mel el tawla',
  'wait.free': 'Blassa fergha', 'wait.bot': 'Bot', 'wait.waiting': 'Ystanna…', 'wait.kick': 'Na77i', 'wait.ready': 'Jahez', 'wait.offline': 'Mafsoul…', 'wait.public': 'Tawla publique', 'wait.private': 'Tawla privée',
  'wait.code': 'Code el tawla', 'wait.copy': 'Copier el lien', 'wait.share': 'Partager', 'wait.start': 'Ebda el jarya', 'wait.hostStarts': 'Ystanna el host bech yebda…', 'wait.shareText': 'Ija al3ab m3aya Rami! Code: {code}',
  'leave.q': 'Tokhrej?', 'leave.botTakes': 'Bot bech yekhou blastek w ykammel el jarya.', 'leave.lost': 'El jarya hedhi bech tetsakker.', 'leave.no': 'Le, nkammel', 'leave.yes': 'Ey, okhrej',
  'voice.title': 'Discussion vocale', 'voice.join': 'Vocal', 'voice.leave': 'Okhrej mel vocal', 'voice.mute': 'Micro', 'voice.unmute': 'Micro msakker', 'voice.on': 'Enti fil vocal 🎙️', 'voice.unsupported': 'El vocal ma yemchich hna.', 'voice.failed': 'Ma najjamtech nconnecti el vocal m3a joueur (réseau).',
  chat: 'Chat', 'chat.empty': 'Ma famma 7atta msg. Sallem 3al jme3a 👋', 'chat.placeholder': 'Ekteb msg…',
  'solo.title': "Contre l'ordi", 'round.of': 'Jarya {n}/{total}', 'round.n': 'Jarya {n}',
  'decide.ask': 'Choof cartek: nal3bou wala le?', 'decide.waiting': '{name} ychouf cartetou…', 'decide.yes': 'Nal3bou', 'decide.no': 'Le', 'decide.yesShort': 'Nal3bou',
  'decide.acceptedTip': '9al nal3bou: ken ma y7ellech yekhou 50', 'decide.redeal': 'Lkol 9alou le: twazzi3 jdid!', 'decide.accepted': '{name} 9al nal3bou!', 'decide.youAccepted': '9olt nal3bou: ken ma t7ellech takhou {n}.', 'decide.banner': 'Nal3bou wala le?',
  'felt.open': "L'ouverture b {n} point", 'felt.clean': 'Lazemha suite sans joker', 'pile.stock': 'Kouma', 'pile.stockTip': 'Ajbed mel kouma', 'pile.discard': 'El ard', 'pile.discardTip': 'Ekhou mel ard',
  'st.roundOver': 'El jarya kamlet', 'st.turnOf': 'Dour {name}…', 'st.draw': 'Dourek: ajbed carta', 'st.mustUse': 'Esta3mel el carta elli hezzitha', 'st.playOpened': 'Hbet, zid, w ba3d armi carta', 'st.playClosed': "Hadher l'ouverture wala armi carta",
  opening: 'Ouverture', 'clean.short': 'suite propre', 'clean.tip': 'Lazem suite (5♥6♥7♥) sans joker fil ouverture', 'clean.title': 'Ma famech suite sans joker',
  'clean.warn': "L'ouverture lazemha suite men ghir joker. Ken t7ell haka takhou {n} point w cartek yarj3ou.", 'clean.fix': 'Nsalla7', 'clean.anyway': 'N7ell haka',
  'hint.notMeld': 'Mouch combinaison', 'hint.dropGold': 'Enzel 3al hbouta elli dhahba', 'hint.addHere': 'Zid hna', 'hint.swap': 'Baddel joker',
  'act.stage': "Zid lel ouverture", 'act.open': '7ell', 'act.meld': 'Hbet', 'act.discard': 'Armi', 'act.undo': 'Rajja3 lel ard', 'act.clear': 'Batel el ikhtiyar', sort: 'Tri', mustTag: 'Lazem testa3melha',
  'b.opened': '7allit! ✓', 'b.frich': 'FRICH! 🔥', 'b.won': 'Rba7t! 🎉', 'b.otherFrich': '{name} farrach! 🔥', 'b.otherWon': '{name} kammel!', 'b.yourTurn': 'Dourek!',
  'n.badOpen': 'Ouverture bla suite propre', 'n.frich': 'Frich', 'n.closed': 'Ma 7allech', 'n.fed': '3tit el carta mta3 el frich', 'n.accepted': '9al nal3bou w ma 7allech',
  'res.player': 'Joueur', 'res.cards': 'Cartet', 'res.round': 'Jarya', 'res.total': 'Total', 'res.youWon': 'Rba7t el jarya! 🎉', 'res.otherWon': '{name} rba7 el jarya',
  'res.stockEmpty': 'El kouma wfet', 'res.stockEmptyHint': 'Kol wa7ed ya3ed cartetou.', 'res.matchOver': 'Match kammel', 'res.champion': 'Enti el champion! 🏆', 'res.matchWinner': '{name} rba7 el match 🏆',
  'res.home': "Lel accueil", 'res.again': '3awed', 'res.backToTable': 'Rja3 lel tawla', 'res.againMatch': '3awed el match', 'res.hostCan': 'El host ynajjem y3awed…', 'res.nextIn': 'El jarya el jeya ba3d',
  'res.seeTable': 'Choof el tawla', 'res.ready': 'Jahez', 'res.waitingOthers': 'Nstanna fil o5rin…',
  score: 'Score', 'score.first': 'Mazelt awel jarya.', 'score.hint': 'A9al score yerba7. Ma 7allech = 100, joker fil yed = 30.',
  'rules.eyebrow': 'Kifech tal3ab', 'rules.ok': 'Fhemt',
  'rules.html': `<h4>El carta</h4><ul><li>2 jeux (104 carta) + 4 jokers. Kol wa7ed yekhou 14; elli yebda yekhou 15 w yebda bel rmi.</li></ul>
<h4>Nal3bou wala le?</h4><ul><li>Ba3d el twazi3, kol wa7ed b dourou ychouf cartetou w y9oul <b>nal3bou</b> wala <b>le</b>.</li><li>Ken lkol 9alou le: el carta yetfar9ou men jdid.</li><li>Elli 9al nal3bou w kammlet el jarya w howa ma 7allech: <b>+50</b>.</li></ul>
<h4>Kol dour</h4><ul><li>Ajbed carta mel <b>kouma</b> wala mel <b>ard</b>. Ken tekhou mel ard lazem testa3melha f nafs el dour.</li><li>Hbet, zid 3al hbout, wala baddel joker. Kammel b <b>rmi</b> carta.</li></ul>
<h4>El combinaisonet</h4><ul><li><b>Trio / carré</b>: nafs el carta b couleurs mokhtalfin.</li><li><b>Suite</b>: 3+ carta men nafs el couleur metabb3in (A-2-3 wala Q-K-A).</li><li>Joker yo93ed blasset ay carta (el 3adiyin akthar mel jokers).</li></ul>
<h4>L'ouverture</h4><ul><li>Lazemha <b>71 point</b> 3al a9al, w lazem fiha <b>suite men ghir joker</b>. Ken t7ell bla suite propre: <b>+50</b>.</li><li>A=11 (1 fi A-2-3), J/Q/K=10.</li></ul>
<h4>Frich</h4><ul><li>Ken t7ell w tkammel cartek lkol f nafs el dour: <b>frich</b>. El o5rin lkol yekhdhou <b>100</b>.</li><li>W ken farracht bel carta elli rmaha elli 9ablek mel ard: howa yekhou <b>50 zeyda</b> (150).</li></ul>
<h4>El score</h4><ul><li>Elli ykammel: −10 (frich: −20). El o5rin ya3dou cartethom (joker = 30). Ma 7allech = 100.</li><li>Fi e5er el match, elli 3andou a9al score yerba7.</li></ul>`,
};

const ar = {
  'st.online': '{n} متصل', 'st.connecting': 'جارٍ الاتصال…', 'st.offline': 'غير متصل', 'st.none': 'وضع فردي', 'st.reconnecting': 'إعادة الاتصال…',
  'e.sameCard': 'نفس الورقة مرتين.', 'e.notInHand': 'الورقة ليست في يدك.', 'e.roundOver': 'انتهت الجولة.', 'e.notYourTurn': 'ليس دورك.', 'e.unknown': 'حركة غير معروفة.',
  'e.tooLate': 'فات الوقت.', 'e.decideFirst': 'قل أولاً: نلعب أم لا؟', 'e.alreadyDrew': 'سحبت ورقة بالفعل.', 'e.discardEmpty': 'الأرض فارغة.', 'e.cantUndo': 'لا يمكن التراجع.',
  'e.drawFirst': 'اسحب ورقة أولاً.', 'e.noSelection': 'لم تختر أي ورقة.', 'e.badMeld': 'تركيبة غير صحيحة.', 'e.keepOne': 'يجب أن تبقي ورقة لترميها.', 'e.mustUse': 'يجب أن تستعمل الورقة التي أخذتها من الأرض.',
  'e.noMeld': 'التركيبة غير موجودة.', 'e.openFirst': 'يجب أن تفتح قبل الإضافة.', 'e.cantLayoff': 'لا يمكن إضافة الورقة لهذه التركيبة.', 'e.openFirstSwap': 'يجب أن تفتح قبل تبديل الجوكر.',
  'e.swapNatural': 'بدّل بورقة عادية.', 'e.cantSwap': 'هذه الورقة لا تبدّل الجوكر هنا.', 'e.mustUseOrUndo': 'استعمل الورقة المأخوذة من الأرض (أو أرجعها).', 'e.sameDiscard': 'لا يمكنك رمي نفس الورقة التي أخذتها.',
  'e.startedNoSeat': 'بدأت اللعبة ولا يوجد مكان.', 'e.full': 'الطاولة ممتلئة.', 'e.hostOnly': 'المضيف فقط.', 'e.started': 'بدأت اللعبة.', 'e.forbidden': 'غير مسموح.', 'e.twoPlayers': 'يلزم لاعبان على الأقل (أضف روبوت).',
  'e.noGame': 'لا توجد جولة.', 'e.noTable': 'الطاولة غير موجودة (تحقق من الرمز).', 'e.notAtTable': 'لست في طاولة.', 'e.server': 'خطأ في الخادم.', 'e.openMin': 'الفتح يتطلب {min} نقطة (لديك {pts}).',
  'i.joined': '{name} دخل الطاولة.', 'i.left': '{name} خرج.', 'i.replacedBot': '{name} أخذ مكان الروبوت.',
  't.timeUp': 'انتهى وقتك: لعبت اللعبة مكانك.', 't.kicked': 'أخرجك المضيف من الطاولة.', 't.replaced': 'الحساب فُتح في مكان آخر.', 't.codeShort': 'اكتب رمز الطاولة (5 أحرف).',
  't.needServer': 'يلزم عنوان خادم للعب أونلاين.', 't.connecting': 'جارٍ الاتصال بالخادم…', 't.copied': 'تم نسخ الرابط ✓', 't.opened': '{name} فتح بـ {n} نقطة', 't.swapped': '{name} بدّل جوكر',
  't.timeout': 'انتهى وقت {name}', 't.penalty': '{name}: +{n} ({why})', 't.trophy': 'اضغط 🏆 لرؤية النتائج', 't.musicAdded': 'أضيفت الموسيقى ✓', 't.recorded': 'تم التسجيل ✓', 't.noMic': 'تعذّر استعمال الميكروفون.',
  profile: 'الملف', 'profile.welcome': 'مرحبا بك', 'profile.ask': 'ما اسمك؟', 'profile.edit': 'عدّل ملفك', 'profile.hint': 'هذا ما يراه أصدقاؤك على الطاولة.', 'profile.name': 'اسمك',
  save: 'حفظ', saved: 'تم الحفظ ✓', cancel: 'إلغاء', close: 'إغلاق', ok: 'حسنًا', you: 'أنت', pts: 'ن', bot: 'روبوت', opened: 'فتح', leave: 'خروج',
  settings: 'الإعدادات', 'settings.title': 'الإعدادات', 'set.lang': 'اللغة', 'set.music': 'الموسيقى', 'set.musicOn': 'موسيقى في الخلفية', 'set.volume': 'مستوى الصوت',
  'set.addMusic': 'أضف موسيقاك', 'set.musicHint': 'المقاطع 🥁 أصلية (دربوكة، مزود، سطمبالي). يمكنك إضافة ملفات mp3 من هاتفك وتبقى عندك فقط.',
  'set.sfx': 'الأصوات', 'set.sfxOn': 'أصوات اللعبة', 'set.linesOn': 'عبارات اللعبة (مرزنك، تريس، كواترو)', 'set.server': 'الخادم', 'set.serverHint': 'في الموقع لا تغيّر شيئًا. في التطبيق ضع رابط الخادم.',
  'line.marznik': 'إمشي ما رزنك!', 'line.marznik.when': 'عندما يتجاوز لاعب 30 ثانية', 'line.tris': 'هاذي تريس للعريس', 'line.tris.when': 'عند رمي ورقة 3', 'line.quatro': 'كواترو إيجا خوذ بخاطرو', 'line.quatro.when': 'عند رمي ورقة 4',
  'lines.mine': 'بصوتك', 'lines.tts': 'صوت الهاتف', 'lines.test': 'استمع', 'lines.record': 'سجّل', 'lines.stop': 'توقف', 'lines.reset': 'الصوت الأصلي',
  'level.easy': 'سهل', 'level.normal': 'عادي', 'level.pro': 'محترف', bots: 'روبوتات', level: 'المستوى', rounds: 'الجولات', players: 'اللاعبون', turnTime: 'وقت كل دور', visibility: 'الظهور', public: 'عامة', private: 'خاصة', botLevel: 'مستوى الروبوتات',
  'rooms.noServer': 'الوضع الأونلاين غير مُعدّ', 'rooms.noServerHint': 'ضع عنوان الخادم في الإعدادات للعب مع أصدقائك.', 'rooms.empty': 'لا توجد طاولات الآن', 'rooms.emptyHint': 'أنشئ طاولة وأرسل الرمز لأصدقائك.',
  'rooms.playing': 'يلعبون…', 'rooms.waiting': 'في الانتظار', 'rooms.rounds': '{n} جولات', 'rooms.inGame': 'جارية', 'rooms.full': 'ممتلئة', 'rooms.join': 'ادخل',
  'create.title': 'طاولة جديدة', 'create.hint': 'يدخل أصدقاؤك بالرمز أو بالرابط.', 'create.name': 'اسم الطاولة', 'create.defaultName': 'طاولة {name}', 'create.go': 'أنشئ الطاولة',
  'wait.free': 'مكان فارغ', 'wait.bot': 'روبوت', 'wait.waiting': 'في الانتظار…', 'wait.kick': 'أخرج', 'wait.ready': 'جاهز', 'wait.offline': 'منقطع…', 'wait.public': 'طاولة عامة', 'wait.private': 'طاولة خاصة',
  'wait.code': 'رمز الطاولة', 'wait.copy': 'انسخ الرابط', 'wait.share': 'مشاركة', 'wait.start': 'ابدأ اللعب', 'wait.hostStarts': 'في انتظار المضيف…', 'wait.shareText': 'تعال العب معي رامي! الرمز: {code}',
  'leave.q': 'تخرج؟', 'leave.botTakes': 'سيأخذ روبوت مكانك ويكمل الجولة.', 'leave.lost': 'ستنتهي هذه اللعبة.', 'leave.no': 'لا، أكمل', 'leave.yes': 'نعم، اخرج',
  'voice.title': 'محادثة صوتية', 'voice.join': 'صوت', 'voice.leave': 'غادر الصوت', 'voice.mute': 'الميكروفون', 'voice.unmute': 'الميكروفون مكتوم', 'voice.on': 'أنت في المحادثة الصوتية 🎙️', 'voice.unsupported': 'المحادثة الصوتية غير مدعومة هنا.', 'voice.failed': 'تعذّر الاتصال الصوتي بلاعب (الشبكة).',
  chat: 'الدردشة', 'chat.empty': 'لا توجد رسائل. سلّم على الجماعة 👋', 'chat.placeholder': 'اكتب رسالة…',
  'solo.title': 'ضد الحاسوب', 'round.of': 'الجولة {n}/{total}', 'round.n': 'الجولة {n}',
  'decide.ask': 'انظر أوراقك: نلعب أم لا؟', 'decide.waiting': '{name} ينظر في أوراقه…', 'decide.yes': 'نلعب', 'decide.no': 'لا', 'decide.yesShort': 'نلعب',
  'decide.acceptedTip': 'قال نلعب: إن لم يفتح يأخذ 50', 'decide.redeal': 'الجميع قال لا: توزيع جديد!', 'decide.accepted': '{name} قال نلعب!', 'decide.youAccepted': 'قلت نلعب: إن لم تفتح تأخذ {n}.', 'decide.banner': 'نلعب أم لا؟',
  'felt.open': 'الفتح بـ {n} نقطة', 'felt.clean': 'يلزم متتالية بدون جوكر', 'pile.stock': 'الكومة', 'pile.stockTip': 'اسحب من الكومة', 'pile.discard': 'الأرض', 'pile.discardTip': 'خذ من الأرض',
  'st.roundOver': 'انتهت الجولة', 'st.turnOf': 'دور {name}…', 'st.draw': 'دورك: اسحب ورقة', 'st.mustUse': 'استعمل الورقة التي أخذتها', 'st.playOpened': 'انزل، أضف، ثم ارمِ ورقة', 'st.playClosed': 'جهّز الفتح أو ارمِ ورقة',
  opening: 'الفتح', 'clean.short': 'متتالية نظيفة', 'clean.tip': 'يلزم في الفتح متتالية (5♥6♥7♥) بدون جوكر', 'clean.title': 'لا توجد متتالية بدون جوكر',
  'clean.warn': 'الفتح يتطلب متتالية بدون جوكر. إن فتحت هكذا تأخذ {n} نقطة وتعود أوراقك.', 'clean.fix': 'سأصلح', 'clean.anyway': 'أفتح هكذا',
  'hint.notMeld': 'ليست تركيبة', 'hint.dropGold': 'اضغط على التركيبة الذهبية', 'hint.addHere': 'أضف هنا', 'hint.swap': 'بدّل الجوكر',
  'act.stage': 'أضف للفتح', 'act.open': 'افتح', 'act.meld': 'انزل', 'act.discard': 'ارمِ', 'act.undo': 'أرجعها للأرض', 'act.clear': 'إلغاء الاختيار', sort: 'ترتيب', mustTag: 'يجب استعمالها',
  'b.opened': 'فتحت! ✓', 'b.frich': 'فريش! 🔥', 'b.won': 'ربحت! 🎉', 'b.otherFrich': '{name} فرّش! 🔥', 'b.otherWon': '{name} أكمل!', 'b.yourTurn': 'دورك!',
  'n.badOpen': 'فتح بدون متتالية نظيفة', 'n.frich': 'فريش', 'n.closed': 'لم يفتح', 'n.fed': 'أعطى ورقة الفريش', 'n.accepted': 'قال نلعب ولم يفتح',
  'res.player': 'اللاعب', 'res.cards': 'الأوراق', 'res.round': 'الجولة', 'res.total': 'المجموع', 'res.youWon': 'ربحت الجولة! 🎉', 'res.otherWon': '{name} ربح الجولة',
  'res.stockEmpty': 'انتهت الكومة', 'res.stockEmptyHint': 'كل لاعب يحسب أوراقه.', 'res.matchOver': 'انتهت المباراة', 'res.champion': 'أنت البطل! 🏆', 'res.matchWinner': '{name} ربح المباراة 🏆',
  'res.home': 'الرئيسية', 'res.again': 'أعد', 'res.backToTable': 'ارجع للطاولة', 'res.againMatch': 'أعد المباراة', 'res.hostCan': 'المضيف يمكنه الإعادة…', 'res.nextIn': 'الجولة القادمة بعد',
  'res.seeTable': 'انظر الطاولة', 'res.ready': 'جاهز', 'res.waitingOthers': 'في انتظار الآخرين…',
  score: 'النتيجة', 'score.first': 'ما زالت الجولة الأولى.', 'score.hint': 'الأقل نقاطًا يربح. لم يفتح = 100، جوكر في اليد = 30.',
  'rules.eyebrow': 'كيف تلعب', 'rules.ok': 'فهمت',
  'rules.html': `<h4>الأوراق</h4><ul><li>مجموعتان (104 ورقة) + 4 جوكر. لكل لاعب 14 ورقة؛ من يبدأ يأخذ 15 ويبدأ بالرمي.</li></ul>
<h4>نلعب أم لا؟</h4><ul><li>بعد التوزيع، كل لاعب بدوره يقول <b>نلعب</b> أو <b>لا</b>.</li><li>إن قال الجميع لا: توزيع جديد.</li><li>من قال نلعب وانتهت الجولة دون أن يفتح: <b>+50</b>.</li></ul>
<h4>كل دور</h4><ul><li>اسحب من <b>الكومة</b> أو من <b>الأرض</b> (ورقة الأرض يجب استعمالها في نفس الدور).</li><li>انزل التركيبات، أضف عليها، أو بدّل جوكر. أنهِ برمي ورقة.</li></ul>
<h4>التركيبات</h4><ul><li><b>ثلاثية / رباعية</b>: نفس الورقة بألوان مختلفة.</li><li><b>متتالية</b>: 3 أوراق أو أكثر من نفس اللون متتالية.</li><li>الجوكر يعوّض أي ورقة.</li></ul>
<h4>الفتح</h4><ul><li><b>71 نقطة</b> على الأقل وفيه <b>متتالية بدون جوكر</b>، وإلا <b>+50</b>.</li></ul>
<h4>فريش</h4><ul><li>إن فتحت وأكملت كل أوراقك في نفس الدور: الجميع يأخذ <b>100</b>، ومن رمى لك الورقة التي فرّشت بها يأخذ <b>50 إضافية</b>.</li></ul>
<h4>النتيجة</h4><ul><li>الفائز −10 (فريش −20). الباقون يحسبون أوراقهم (جوكر = 30). لم يفتح = 100. الأقل يربح المباراة.</li></ul>`,
};

const fr = {
  'st.online': '{n} en ligne', 'st.connecting': 'Connexion…', 'st.offline': 'Hors ligne', 'st.none': 'Mode solo', 'st.reconnecting': 'Reconnexion…',
  'e.sameCard': 'Même carte deux fois.', 'e.notInHand': "Cette carte n'est pas dans ta main.", 'e.roundOver': 'La manche est finie.', 'e.notYourTurn': "Ce n'est pas ton tour.", 'e.unknown': 'Action inconnue.',
  'e.tooLate': 'Trop tard.', 'e.decideFirst': "Dis d'abord : on joue ou non ?", 'e.alreadyDrew': 'Tu as déjà pioché.', 'e.discardEmpty': 'La défausse est vide.', 'e.cantUndo': 'Impossible d’annuler.',
  'e.drawFirst': "Pioche d'abord une carte.", 'e.noSelection': 'Aucune carte choisie.', 'e.badMeld': 'Combinaison invalide.', 'e.keepOne': 'Garde une carte pour la défausser.', 'e.mustUse': 'Tu dois utiliser la carte prise à la défausse.',
  'e.noMeld': 'Combinaison introuvable.', 'e.openFirst': "Ouvre d'abord avant de poser.", 'e.cantLayoff': 'Cette carte ne va pas sur cette combinaison.', 'e.openFirstSwap': "Ouvre d'abord avant d'échanger un joker.",
  'e.swapNatural': 'Échange avec une carte normale.', 'e.cantSwap': 'Cette carte ne remplace pas le joker ici.', 'e.mustUseOrUndo': 'Utilise la carte prise (ou remets-la).', 'e.sameDiscard': 'Tu ne peux pas jeter la carte que tu viens de prendre.',
  'e.startedNoSeat': 'Partie commencée, plus de place.', 'e.full': 'Table pleine.', 'e.hostOnly': "Réservé à l'hôte.", 'e.started': 'La partie a commencé.', 'e.forbidden': 'Impossible.', 'e.twoPlayers': 'Il faut 2 joueurs minimum (ajoute un bot).',
  'e.noGame': 'Aucune partie.', 'e.noTable': 'Table introuvable (vérifie le code).', 'e.notAtTable': "Tu n'es pas à une table.", 'e.server': 'Erreur serveur.', 'e.openMin': "L'ouverture demande {min} points (tu as {pts}).",
  'i.joined': '{name} a rejoint la table.', 'i.left': '{name} est parti.', 'i.replacedBot': '{name} a pris la place du bot.',
  't.timeUp': 'Temps écoulé : le jeu a joué pour toi.', 't.kicked': "L'hôte t'a retiré de la table.", 't.replaced': 'Compte ouvert ailleurs.', 't.codeShort': 'Écris le code de la table (5 caractères).',
  't.needServer': 'Il faut une adresse de serveur pour jouer en ligne.', 't.connecting': 'Connexion au serveur…', 't.copied': 'Lien copié ✓', 't.opened': '{name} a ouvert avec {n} points', 't.swapped': '{name} a échangé un joker',
  't.timeout': 'Temps écoulé pour {name}', 't.penalty': '{name} : +{n} ({why})', 't.trophy': 'Touche 🏆 pour revoir les résultats', 't.musicAdded': 'Musique ajoutée ✓', 't.recorded': 'Enregistré ✓', 't.noMic': "Impossible d'utiliser le micro.",
  profile: 'Profil', 'profile.welcome': 'Bienvenue', 'profile.ask': "Comment tu t'appelles ?", 'profile.edit': 'Modifier ton profil', 'profile.hint': 'Ce que tes amis verront à la table.', 'profile.name': 'Ton nom',
  save: 'Enregistrer', saved: 'Enregistré ✓', cancel: 'Annuler', close: 'Fermer', ok: 'OK', you: 'toi', pts: 'pts', bot: 'bot', opened: 'ouvert', leave: 'Quitter',
  settings: 'Réglages', 'settings.title': 'Réglages', 'set.lang': 'Langue', 'set.music': 'Musique', 'set.musicOn': 'Musique de fond', 'set.volume': 'Volume',
  'set.addMusic': 'Ajouter ta musique', 'set.musicHint': 'Morceaux 🥁 originaux (darbouka, mezoued, stambeli). Tu peux ajouter tes mp3 : ils restent sur ton appareil.',
  'set.sfx': 'Sons', 'set.sfxOn': 'Sons du jeu', 'set.linesOn': 'Phrases du jeu (marznik, tris, quatro)', 'set.server': 'Serveur en ligne', 'set.serverHint': "Sur le site, rien à changer. Dans l'appli, mets le lien du serveur.",
  'line.marznik': 'Imchi marznik !', 'line.marznik.when': 'Quand un joueur dépasse 30 s', 'line.tris': 'Hedhi tris lil 3ris', 'line.tris.when': "Quand quelqu'un jette un 3", 'line.quatro': 'Quatro, ija khoudh b khatrou', 'line.quatro.when': "Quand quelqu'un jette un 4",
  'lines.mine': 'ta voix', 'lines.tts': 'voix du téléphone', 'lines.test': 'Écouter', 'lines.record': 'Enregistrer', 'lines.stop': 'Stop', 'lines.reset': 'Voix d’origine',
  'level.easy': 'Facile', 'level.normal': 'Normal', 'level.pro': 'Pro', bots: 'Bots', level: 'Niveau', rounds: 'Manches', players: 'Joueurs', turnTime: 'Temps par tour', visibility: 'Visibilité', public: 'Publique', private: 'Privée', botLevel: 'Niveau des bots',
  'rooms.noServer': 'Mode en ligne non configuré', 'rooms.noServerHint': "Mets l'adresse du serveur dans les réglages pour jouer avec tes amis.", 'rooms.empty': 'Aucune table pour le moment', 'rooms.emptyHint': 'Crée une table et envoie le code à tes amis.',
  'rooms.playing': 'En jeu…', 'rooms.waiting': 'En attente', 'rooms.rounds': '{n} manches', 'rooms.inGame': 'En jeu', 'rooms.full': 'Pleine', 'rooms.join': 'Rejoindre',
  'create.title': 'Nouvelle table', 'create.hint': 'Tes amis rejoignent avec le code ou le lien.', 'create.name': 'Nom de la table', 'create.defaultName': 'Table de {name}', 'create.go': 'Créer la table',
  'wait.free': 'Place libre', 'wait.bot': 'Bot', 'wait.waiting': 'En attente…', 'wait.kick': 'Retirer', 'wait.ready': 'Prêt', 'wait.offline': 'Déconnecté…', 'wait.public': 'Table publique', 'wait.private': 'Table privée',
  'wait.code': 'Code de la table', 'wait.copy': 'Copier le lien', 'wait.share': 'Partager', 'wait.start': 'Lancer la partie', 'wait.hostStarts': "En attente de l'hôte…", 'wait.shareText': 'Viens jouer au Rami avec moi ! Code : {code}',
  'leave.q': 'Quitter ?', 'leave.botTakes': 'Un bot prendra ta place.', 'leave.lost': 'Cette partie sera perdue.', 'leave.no': 'Non, je reste', 'leave.yes': 'Oui, quitter',
  'voice.title': 'Chat vocal', 'voice.join': 'Vocal', 'voice.leave': 'Quitter le vocal', 'voice.mute': 'Micro', 'voice.unmute': 'Micro coupé', 'voice.on': 'Tu es dans le vocal 🎙️', 'voice.unsupported': 'Vocal non disponible ici.', 'voice.failed': 'Connexion vocale impossible avec un joueur (réseau).',
  chat: 'Chat', 'chat.empty': 'Aucun message. Dis bonjour 👋', 'chat.placeholder': 'Écris un message…',
  'solo.title': "Contre l'ordi", 'round.of': 'Manche {n}/{total}', 'round.n': 'Manche {n}',
  'decide.ask': 'Regarde tes cartes : on joue ou non ?', 'decide.waiting': '{name} regarde ses cartes…', 'decide.yes': 'On joue', 'decide.no': 'Non', 'decide.yesShort': 'Joue',
  'decide.acceptedTip': "A dit « on joue » : s'il n'ouvre pas, +50", 'decide.redeal': 'Tout le monde a dit non : nouvelle donne !', 'decide.accepted': '{name} a dit on joue !', 'decide.youAccepted': "Tu as dit on joue : si tu n'ouvres pas, +{n}.", 'decide.banner': 'On joue ou non ?',
  'felt.open': 'Ouverture à {n} points', 'felt.clean': 'Il faut une suite sans joker', 'pile.stock': 'Pioche', 'pile.stockTip': 'Piocher', 'pile.discard': 'Défausse', 'pile.discardTip': 'Prendre la défausse',
  'st.roundOver': 'Manche terminée', 'st.turnOf': 'Tour de {name}…', 'st.draw': 'À toi : pioche une carte', 'st.mustUse': 'Utilise la carte prise', 'st.playOpened': 'Pose, ajoute, puis défausse', 'st.playClosed': "Prépare l'ouverture ou défausse",
  opening: 'Ouverture', 'clean.short': 'suite propre', 'clean.tip': "L'ouverture doit contenir une suite (5♥6♥7♥) sans joker", 'clean.title': 'Pas de suite sans joker',
  'clean.warn': "L'ouverture doit contenir une suite sans joker. Si tu ouvres ainsi, tu prends {n} points et tes cartes reviennent.", 'clean.fix': 'Je corrige', 'clean.anyway': 'Ouvrir quand même',
  'hint.notMeld': 'Pas une combinaison', 'hint.dropGold': 'Touche la combinaison dorée', 'hint.addHere': 'Ajouter ici', 'hint.swap': 'Échanger le joker',
  'act.stage': "Ajouter à l'ouverture", 'act.open': 'Ouvrir', 'act.meld': 'Poser', 'act.discard': 'Défausser', 'act.undo': 'Remettre', 'act.clear': 'Désélectionner', sort: 'Tri', mustTag: 'À utiliser',
  'b.opened': 'Ouvert ! ✓', 'b.frich': 'FRICH ! 🔥', 'b.won': 'Gagné ! 🎉', 'b.otherFrich': '{name} fait frich ! 🔥', 'b.otherWon': '{name} a fini !', 'b.yourTurn': 'À toi !',
  'n.badOpen': 'Ouverture sans suite propre', 'n.frich': 'Frich', 'n.closed': "N'a pas ouvert", 'n.fed': 'A donné la carte du frich', 'n.accepted': "A dit on joue sans ouvrir",
  'res.player': 'Joueur', 'res.cards': 'Cartes', 'res.round': 'Manche', 'res.total': 'Total', 'res.youWon': 'Tu gagnes la manche ! 🎉', 'res.otherWon': '{name} gagne la manche',
  'res.stockEmpty': 'Pioche vide', 'res.stockEmptyHint': 'Chacun compte ses cartes.', 'res.matchOver': 'Match terminé', 'res.champion': 'Tu es le champion ! 🏆', 'res.matchWinner': '{name} gagne le match 🏆',
  'res.home': 'Accueil', 'res.again': 'Rejouer', 'res.backToTable': 'Retour à la table', 'res.againMatch': 'Rejouer le match', 'res.hostCan': "L'hôte peut relancer…", 'res.nextIn': 'Manche suivante dans',
  'res.seeTable': 'Voir la table', 'res.ready': 'Prêt', 'res.waitingOthers': 'En attente des autres…',
  score: 'Score', 'score.first': 'Première manche en cours.', 'score.hint': "Le plus petit score gagne. Pas ouvert = 100, joker en main = 30.",
  'rules.eyebrow': 'Comment jouer', 'rules.ok': 'Compris',
  'rules.html': `<h4>Les cartes</h4><ul><li>2 jeux (104 cartes) + 4 jokers. 14 cartes chacun ; celui qui commence en a 15 et commence par défausser.</li></ul>
<h4>On joue ou non ?</h4><ul><li>Après la donne, chaque joueur à son tour dit <b>on joue</b> ou <b>non</b>.</li><li>Si tout le monde dit non : nouvelle donne.</li><li>Celui qui a dit on joue et finit la manche sans ouvrir : <b>+50</b>.</li></ul>
<h4>Chaque tour</h4><ul><li>Pioche dans la <b>pioche</b> ou la <b>défausse</b> (carte de la défausse à utiliser dans le tour).</li><li>Pose, ajoute aux combinaisons ou échange un joker. Termine en défaussant.</li></ul>
<h4>Combinaisons</h4><ul><li><b>Brelan / carré</b> : même valeur, couleurs différentes.</li><li><b>Suite</b> : 3+ cartes de même couleur qui se suivent (A-2-3 ou Q-K-A).</li><li>Le joker remplace n'importe quelle carte.</li></ul>
<h4>Ouverture</h4><ul><li>Au moins <b>71 points</b>, avec une <b>suite sans joker</b>, sinon <b>+50</b>.</li></ul>
<h4>Frich</h4><ul><li>Ouvrir et finir toutes ses cartes dans le même tour : tous les autres prennent <b>100</b>, et celui qui a jeté la carte du frich prend <b>50 de plus</b>.</li></ul>
<h4>Score</h4><ul><li>Gagnant −10 (frich −20). Les autres comptent leurs cartes (joker = 30). Pas ouvert = 100. Le plus petit total gagne le match.</li></ul>`,
};

const en = {
  'st.online': '{n} online', 'st.connecting': 'Connecting…', 'st.offline': 'Offline', 'st.none': 'Solo mode', 'st.reconnecting': 'Reconnecting…',
  'e.sameCard': 'Same card twice.', 'e.notInHand': "That card isn't in your hand.", 'e.roundOver': 'The round is over.', 'e.notYourTurn': 'Not your turn.', 'e.unknown': 'Unknown move.',
  'e.tooLate': 'Too late.', 'e.decideFirst': 'Say first: play or not?', 'e.alreadyDrew': 'You already drew.', 'e.discardEmpty': 'The discard pile is empty.', 'e.cantUndo': "Can't undo.",
  'e.drawFirst': 'Draw a card first.', 'e.noSelection': 'No card selected.', 'e.badMeld': 'Not a valid meld.', 'e.keepOne': 'Keep one card to discard.', 'e.mustUse': 'You must use the card you took from the discard pile.',
  'e.noMeld': 'Meld not found.', 'e.openFirst': 'Open before adding to melds.', 'e.cantLayoff': "That card doesn't fit this meld.", 'e.openFirstSwap': 'Open before swapping a joker.',
  'e.swapNatural': 'Swap with a normal card.', 'e.cantSwap': "That card can't replace the joker here.", 'e.mustUseOrUndo': 'Use the card you took (or put it back).', 'e.sameDiscard': "You can't discard the card you just took.",
  'e.startedNoSeat': 'Game started, no seat left.', 'e.full': 'Table is full.', 'e.hostOnly': 'Host only.', 'e.started': 'The game has started.', 'e.forbidden': 'Not allowed.', 'e.twoPlayers': 'Needs at least 2 players (add a bot).',
  'e.noGame': 'No game running.', 'e.noTable': 'Table not found (check the code).', 'e.notAtTable': "You're not at a table.", 'e.server': 'Server error.', 'e.openMin': 'Opening needs {min} points (you have {pts}).',
  'i.joined': '{name} joined the table.', 'i.left': '{name} left.', 'i.replacedBot': "{name} took a bot's seat.",
  't.timeUp': 'Time up: the game played for you.', 't.kicked': 'The host removed you.', 't.replaced': 'Account opened somewhere else.', 't.codeShort': 'Type the table code (5 characters).',
  't.needServer': 'A server address is needed to play online.', 't.connecting': 'Connecting to the server…', 't.copied': 'Link copied ✓', 't.opened': '{name} opened with {n} points', 't.swapped': '{name} swapped a joker',
  't.timeout': "{name}'s time ran out", 't.penalty': '{name}: +{n} ({why})', 't.trophy': 'Tap 🏆 to see the results again', 't.musicAdded': 'Music added ✓', 't.recorded': 'Recorded ✓', 't.noMic': "Couldn't use the microphone.",
  profile: 'Profile', 'profile.welcome': 'Welcome', 'profile.ask': "What's your name?", 'profile.edit': 'Edit your profile', 'profile.hint': 'This is what your friends see at the table.', 'profile.name': 'Your name',
  save: 'Save', saved: 'Saved ✓', cancel: 'Cancel', close: 'Close', ok: 'OK', you: 'you', pts: 'pts', bot: 'bot', opened: 'open', leave: 'Leave',
  settings: 'Settings', 'settings.title': 'Settings', 'set.lang': 'Language', 'set.music': 'Music', 'set.musicOn': 'Background music', 'set.volume': 'Volume',
  'set.addMusic': 'Add your music', 'set.musicHint': 'The 🥁 tracks are original (darbouka, mezoued, stambeli). You can add your own mp3s; they stay on your device.',
  'set.sfx': 'Sounds', 'set.sfxOn': 'Game sounds', 'set.linesOn': 'Voice lines (marznik, tris, quatro)', 'set.server': 'Online server', 'set.serverHint': 'On the website, nothing to change. In the app, paste the server link.',
  'line.marznik': 'Imchi marznik!', 'line.marznik.when': 'When a player takes over 30 s', 'line.tris': 'Hedhi tris lil 3ris', 'line.tris.when': 'When someone discards a 3', 'line.quatro': 'Quatro, ija khoudh b khatrou', 'line.quatro.when': 'When someone discards a 4',
  'lines.mine': 'your voice', 'lines.tts': 'phone voice', 'lines.test': 'Listen', 'lines.record': 'Record', 'lines.stop': 'Stop', 'lines.reset': 'Original voice',
  'level.easy': 'Easy', 'level.normal': 'Normal', 'level.pro': 'Pro', bots: 'Bots', level: 'Level', rounds: 'Rounds', players: 'Players', turnTime: 'Time per turn', visibility: 'Visibility', public: 'Public', private: 'Private', botLevel: 'Bot level',
  'rooms.noServer': 'Online mode not set up', 'rooms.noServerHint': 'Add the server address in Settings to play with friends.', 'rooms.empty': 'No tables right now', 'rooms.emptyHint': 'Create a table and send the code to your friends.',
  'rooms.playing': 'Playing…', 'rooms.waiting': 'Waiting', 'rooms.rounds': '{n} rounds', 'rooms.inGame': 'In game', 'rooms.full': 'Full', 'rooms.join': 'Join',
  'create.title': 'New table', 'create.hint': 'Friends join with the code or the link.', 'create.name': 'Table name', 'create.defaultName': "{name}'s table", 'create.go': 'Create table',
  'wait.free': 'Free seat', 'wait.bot': 'Bot', 'wait.waiting': 'Waiting…', 'wait.kick': 'Remove', 'wait.ready': 'Ready', 'wait.offline': 'Disconnected…', 'wait.public': 'Public table', 'wait.private': 'Private table',
  'wait.code': 'Table code', 'wait.copy': 'Copy link', 'wait.share': 'Share', 'wait.start': 'Start game', 'wait.hostStarts': 'Waiting for the host…', 'wait.shareText': 'Come play Rami with me! Code: {code}',
  'leave.q': 'Leave?', 'leave.botTakes': 'A bot will take your seat.', 'leave.lost': 'This game will end.', 'leave.no': 'No, stay', 'leave.yes': 'Yes, leave',
  'voice.title': 'Voice chat', 'voice.join': 'Voice', 'voice.leave': 'Leave voice', 'voice.mute': 'Mic', 'voice.unmute': 'Mic muted', 'voice.on': "You're in voice chat 🎙️", 'voice.unsupported': 'Voice chat is not available here.', 'voice.failed': "Couldn't connect voice with a player (network).",
  chat: 'Chat', 'chat.empty': 'No messages yet. Say hi 👋', 'chat.placeholder': 'Type a message…',
  'solo.title': 'vs Computer', 'round.of': 'Round {n}/{total}', 'round.n': 'Round {n}',
  'decide.ask': 'Look at your cards: play or not?', 'decide.waiting': '{name} is looking at their cards…', 'decide.yes': 'Play', 'decide.no': 'No', 'decide.yesShort': 'Plays',
  'decide.acceptedTip': 'Said play: +50 without opening', 'decide.redeal': 'Everyone said no: new deal!', 'decide.accepted': '{name} said play!', 'decide.youAccepted': "You said play: if you don't open, +{n}.", 'decide.banner': 'Play or not?',
  'felt.open': 'Opening at {n} points', 'felt.clean': 'Needs a run without joker', 'pile.stock': 'Stock', 'pile.stockTip': 'Draw from the stock', 'pile.discard': 'Discard', 'pile.discardTip': 'Take the discard',
  'st.roundOver': 'Round over', 'st.turnOf': "{name}'s turn…", 'st.draw': 'Your turn: draw a card', 'st.mustUse': 'Use the card you took', 'st.playOpened': 'Meld, add, then discard', 'st.playClosed': 'Build your opening or discard',
  opening: 'Opening', 'clean.short': 'clean run', 'clean.tip': 'The opening needs a run (5♥6♥7♥) without joker', 'clean.title': 'No run without joker',
  'clean.warn': 'The opening needs a run without joker. Opening like this costs {n} points and your cards come back.', 'clean.fix': "I'll fix it", 'clean.anyway': 'Open anyway',
  'hint.notMeld': 'Not a meld', 'hint.dropGold': 'Tap the gold meld', 'hint.addHere': 'Add here', 'hint.swap': 'Swap joker',
  'act.stage': 'Add to opening', 'act.open': 'Open', 'act.meld': 'Meld', 'act.discard': 'Discard', 'act.undo': 'Put back', 'act.clear': 'Clear', sort: 'Sort', mustTag: 'Must use',
  'b.opened': 'Opened! ✓', 'b.frich': 'FRICH! 🔥', 'b.won': 'You won! 🎉', 'b.otherFrich': '{name} went frich! 🔥', 'b.otherWon': '{name} is out!', 'b.yourTurn': 'Your turn!',
  'n.badOpen': 'Opening without a clean run', 'n.frich': 'Frich', 'n.closed': 'Never opened', 'n.fed': 'Gave the frich card', 'n.accepted': 'Said play, never opened',
  'res.player': 'Player', 'res.cards': 'Cards', 'res.round': 'Round', 'res.total': 'Total', 'res.youWon': 'You won the round! 🎉', 'res.otherWon': '{name} won the round',
  'res.stockEmpty': 'Stock is empty', 'res.stockEmptyHint': 'Everyone counts their cards.', 'res.matchOver': 'Match over', 'res.champion': "You're the champion! 🏆", 'res.matchWinner': '{name} wins the match 🏆',
  'res.home': 'Home', 'res.again': 'Play again', 'res.backToTable': 'Back to table', 'res.againMatch': 'Rematch', 'res.hostCan': 'The host can restart…', 'res.nextIn': 'Next round in',
  'res.seeTable': 'See the table', 'res.ready': 'Ready', 'res.waitingOthers': 'Waiting for the others…',
  score: 'Score', 'score.first': 'First round in progress.', 'score.hint': 'Lowest score wins. Never opened = 100, joker in hand = 30.',
  'rules.eyebrow': 'How to play', 'rules.ok': 'Got it',
  'rules.html': `<h4>Cards</h4><ul><li>2 decks (104 cards) + 4 jokers. 14 cards each; the starter gets 15 and begins by discarding.</li></ul>
<h4>Play or not?</h4><ul><li>After the deal, each player in turn says <b>play</b> or <b>no</b>.</li><li>If everyone says no: new deal.</li><li>Whoever said play and ends the round without opening: <b>+50</b>.</li></ul>
<h4>Each turn</h4><ul><li>Draw from the <b>stock</b> or the <b>discard</b> (a discard card must be used that turn).</li><li>Meld, add to melds or swap a joker. End by discarding.</li></ul>
<h4>Melds</h4><ul><li><b>Set</b>: same rank, different suits (3 or 4).</li><li><b>Run</b>: 3+ consecutive cards of one suit (A-2-3 or Q-K-A).</li><li>A joker stands for any card.</li></ul>
<h4>Opening</h4><ul><li>At least <b>71 points</b>, including a <b>run without joker</b>, otherwise <b>+50</b>.</li></ul>
<h4>Frich</h4><ul><li>Open and go out in the same turn: everyone else takes <b>100</b>, and whoever discarded the card you went out with takes <b>50 more</b>.</li></ul>
<h4>Score</h4><ul><li>Winner −10 (frich −20). Others count their cards (joker = 30). Never opened = 100. Lowest total wins the match.</li></ul>`,
};

const QUICK = {
  tn: ['Sa77a!', 'Brabbi zarbou', 'Yezzi mel hbal 😅', '3ychek', 'Mabrouk!', '😂', '🔥', '👏', '😤', '🤝'],
  ar: ['صحة!', 'بربي زربو', 'يزّي مالهبال 😅', 'يعيشك', 'مبروك!', '😂', '🔥', '👏', '😤', '🤝'],
  fr: ['Bravo !', 'Allez, plus vite', 'Bien joué', 'Merci', 'Félicitations !', '😂', '🔥', '👏', '😤', '🤝'],
  en: ['Nice!', 'Hurry up', 'Well played', 'Thanks', 'Congrats!', '😂', '🔥', '👏', '😤', '🤝'],
};

const DICTS = { tn, ar, fr, en };
let current = localStorage.getItem('rami.lang') || (navigator.language || '').startsWith('ar') ? (localStorage.getItem('rami.lang') || 'ar') : (localStorage.getItem('rami.lang') || 'tn');

export const lang = () => current;
export function setLang(l) { if (DICTS[l]) { current = l; localStorage.setItem('rami.lang', l); } }

export function t(key, params = {}) {
  let s = DICTS[current][key] ?? tn[key] ?? key;
  for (const [k, v] of Object.entries(params || {})) s = s.split(`{${k}}`).join(v);
  return s;
}

export const quickLines = () => QUICK[current] || QUICK.tn;

const SET = { tn: 'Trio', ar: 'مجموعة', fr: 'Brelan', en: 'Set' };
const RUN = { tn: 'Suite', ar: 'متتالية', fr: 'Suite', en: 'Run' };
export function meldName(m) {
  const nat = m.cards.find(c => c.s !== 'J');
  if (m.kind === 'set') return `${SET[current]} ${rankLabel(nat.r)}`;
  const lab = c => rankLabel(c.s === 'J' ? c.as.r : c.r);
  return `${RUN[current]} ${lab(m.cards[0])}→${lab(m.cards[m.cards.length - 1])}`;
}

/** Fills elements marked with data-i18n / data-i18n-ph / data-i18n-title and sets the page direction. */
export function applyI18n() {
  const L = LANGS.find(l => l.id === current);
  document.documentElement.lang = current === 'tn' ? 'ar-TN' : current;
  document.documentElement.dir = L.dir;
  document.querySelectorAll('[data-i18n]').forEach(n => { n.innerHTML = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach(n => { n.title = t(n.dataset.i18nTitle); });
}

// home page texts
Object.assign(tn, {
  'home.eyebrow': 'El 9ahwa fi jibek', 'home.tagline': "2 jeux, 4 jokers, 14 carta w l'ouverture b 71. Al3ab online m3a s7abek b code, wala tdarreb contre bots ya3rfou yal3bou.",
  'home.create': '＋ A3mel tawla online', 'home.solo': "🤖 Al3ab contre l'ordi", 'home.players': 'joueurs', 'home.opening': "l'ouverture", 'home.cards': 'carta',
  'home.tables': 'Tawlet online', 'home.newTable': '＋ Tawla jdida', 'home.join': 'Odkhol', 'home.soloTitle': "Contre l'ordi", 'home.playNow': 'Al3ab tawa ▸',
  'home.tip': 'Astuce', 'home.tipText': 'Ikhtar el cartet w el jeu y9ollek ken heya combinaison w 9adech fiha point. Jarr carta 3al ard bech tremiha.', 'home.rules': 'Règles',
});
Object.assign(ar, {
  'home.eyebrow': 'المقهى في جيبك', 'home.tagline': 'مجموعتان، 4 جوكر، 14 ورقة والفتح بـ 71. العب أونلاين مع أصدقائك برمز، أو تدرّب ضد روبوتات تعرف اللعب.',
  'home.create': '＋ أنشئ طاولة أونلاين', 'home.solo': '🤖 العب ضد الحاسوب', 'home.players': 'لاعبين', 'home.opening': 'الفتح', 'home.cards': 'ورقة',
  'home.tables': 'الطاولات', 'home.newTable': '＋ طاولة جديدة', 'home.join': 'ادخل', 'home.soloTitle': 'ضد الحاسوب', 'home.playNow': 'العب الآن ▸',
  'home.tip': 'نصيحة', 'home.tipText': 'اختر أوراقك وستعرف مباشرة إن كانت تركيبة وكم نقطة فيها. اسحب ورقة إلى الأرض لرميها.', 'home.rules': 'القواعد',
});
Object.assign(fr, {
  'home.eyebrow': 'Le café dans ta poche', 'home.tagline': "2 jeux, 4 jokers, 14 cartes et l'ouverture à 71. Joue en ligne avec tes amis grâce à un code, ou entraîne-toi contre des bots.",
  'home.create': '＋ Créer une table en ligne', 'home.solo': "🤖 Jouer contre l'ordi", 'home.players': 'joueurs', 'home.opening': 'ouverture', 'home.cards': 'cartes',
  'home.tables': 'Tables en ligne', 'home.newTable': '＋ Nouvelle table', 'home.join': 'Rejoindre', 'home.soloTitle': "Contre l'ordi", 'home.playNow': 'Jouer ▸',
  'home.tip': 'Astuce', 'home.tipText': 'Sélectionne des cartes : le jeu te dit si c’est une combinaison et combien elle vaut. Glisse une carte sur la défausse pour la jeter.', 'home.rules': 'Règles',
});
Object.assign(en, {
  'home.eyebrow': 'The café in your pocket', 'home.tagline': '2 decks, 4 jokers, 14 cards and the opening at 71. Play online with friends using a code, or practise against bots.',
  'home.create': '＋ Create an online table', 'home.solo': '🤖 Play vs computer', 'home.players': 'players', 'home.opening': 'opening', 'home.cards': 'cards',
  'home.tables': 'Online tables', 'home.newTable': '＋ New table', 'home.join': 'Join', 'home.soloTitle': 'vs Computer', 'home.playNow': 'Play now ▸',
  'home.tip': 'Tip', 'home.tipText': "Select cards and the game tells you if it's a meld and how many points it's worth. Drag a card onto the discard pile to throw it.", 'home.rules': 'Rules',
});

// progression / profile / leaderboard / Google
Object.assign(tn, {
  'pro.tab.me': 'Profil', 'pro.tab.daily': 'Kol youm', 'pro.tab.themes': 'Thèmes', 'pro.tab.board': 'Classement',
  'pro.level': 'Niveau {n}', 'pro.lv': 'Nv {n}', 'pro.xp': '{a} / {b} XP', 'pro.coins': 'Flous', 'pro.virtual': 'Flous virtuels lel jeu barka: ma yetchrawech w ma yetbadlouch b flous 7a9i9a.',
  'pro.edit': '✏️ Baddel esm / avatar', 'pro.stats': 'Statistiques',
  'stat.rounds': 'Jaryet', 'stat.wins': 'Rba7t', 'stat.frich': 'Frich', 'stat.opens': '7allit', 'stat.matches': 'Matchet', 'stat.matchWins': 'Matchet rba7t', 'stat.online': 'Online',
  'rank.bronze': 'Bronze', 'rank.argent': 'Fedha', 'rank.or': 'Dheb', 'rank.platine': 'Platine', 'rank.diamant': 'Diamant',
  'pro.gift': 'Cadeau el youm', 'pro.giftBtn': 'Hezz {n} 🪙', 'pro.giftDone': 'Khdhit cadeau el youm. Rja3 ghodwa!', 'pro.streak': 'Rja3 kol youm: el cadeau yekber (youm {n}/7)',
  'pro.missions': 'Missions el youm', 'pro.claim': 'Hezz', 'pro.claimed': '✓',
  'mission.play3': 'Al3ab {n} jaryet', 'mission.win1': 'Orba7 jarya', 'mission.win3': 'Orba7 {n} jaryet', 'mission.open3': '7ell {n} marrat', 'mission.frich1': 'A3mel frich', 'mission.online2': 'Al3ab {n} jaryet online',
  'pro.felt': 'Lawn el tawla', 'pro.back': 'Dhar el carta', 'pro.locked': '🔒 Nv {n}', 'pro.themesHint': 'Atla3 fel niveau bech t7ell thèmes jdod.',
  'felt.sidi': 'Sidi Bou Saïd', 'felt.carthage': 'Carthage', 'felt.sahara': 'Sahara', 'felt.jasmin': 'Yasmine', 'felt.nuit': 'Lil Tounes',
  'back.zellij': 'Zlij', 'back.jasmin': 'Yasmine', 'back.kairouan': 'Kairouan', 'back.or': 'Dheb',
  'pro.board': 'Classement el joueurs', 'pro.boardOffline': 'Lazem tkoun connecté lel serveur bech tchouf el classement.', 'pro.boardEmpty': 'Mazel 7atta 7ad. Al3ab bech tkoun el louwel!', 'pro.you': 'Enti', 'pro.pos': 'Blastek: {n} / {total}', 'pro.loading': 'Nestannew…',
  'pro.earned': '+{xp} XP · +{coins} 🪙', 'pro.levelUp': 'Niveau {n}! 🎉', 'pro.newRank': 'Rang jdid: {r}!', 'pro.giftReady': '🎁 Cadeau el youm jeh!',
  'google.title': 'Compte', 'google.guest': 'Enti tal3ab invité: el progrès mte3ek m7foudh fi el appareil hedha.', 'google.hint': 'Connecti b Gmail bech ta3mel sauvegarde w tal9a progrès mte3ek fi ay appareil.',
  'google.signed': 'Connecté b Google ✓ {name}', 'google.out': 'Déconnexion', 'google.off': 'Connexion Gmail mazelet mouch activée fel serveur (choof README).',
  'google.app': 'Connexion Gmail tekhdem fel site (fel application ekhdem invité).', 'google.ok': 'Connecté b Google ✓', 'google.fail': 'Ma najjamtech nconnecti b Google.',
});
Object.assign(ar, {
  'pro.tab.me': 'الملف', 'pro.tab.daily': 'يوميًا', 'pro.tab.themes': 'المظاهر', 'pro.tab.board': 'الترتيب',
  'pro.level': 'المستوى {n}', 'pro.lv': 'م {n}', 'pro.xp': '{a} / {b} XP', 'pro.coins': 'العملات', 'pro.virtual': 'عملات افتراضية للعب فقط: لا تُشترى ولا تُستبدل بمال حقيقي.',
  'pro.edit': '✏️ غيّر الاسم / الصورة', 'pro.stats': 'إحصائيات',
  'stat.rounds': 'جولات', 'stat.wins': 'انتصارات', 'stat.frich': 'فريش', 'stat.opens': 'فتحات', 'stat.matches': 'مباريات', 'stat.matchWins': 'مباريات رابحة', 'stat.online': 'أونلاين',
  'rank.bronze': 'برونزي', 'rank.argent': 'فضي', 'rank.or': 'ذهبي', 'rank.platine': 'بلاتيني', 'rank.diamant': 'ماسي',
  'pro.gift': 'هدية اليوم', 'pro.giftBtn': 'خذ {n} 🪙', 'pro.giftDone': 'أخذت هدية اليوم. عد غدًا!', 'pro.streak': 'عد كل يوم لتكبر الهدية (اليوم {n}/7)',
  'pro.missions': 'مهام اليوم', 'pro.claim': 'خذ', 'pro.claimed': '✓',
  'mission.play3': 'العب {n} جولات', 'mission.win1': 'اربح جولة', 'mission.win3': 'اربح {n} جولات', 'mission.open3': 'افتح {n} مرات', 'mission.frich1': 'اعمل فريش', 'mission.online2': 'العب {n} جولات أونلاين',
  'pro.felt': 'لون الطاولة', 'pro.back': 'ظهر الورقة', 'pro.locked': '🔒 م {n}', 'pro.themesHint': 'ارفع مستواك لتفتح مظاهر جديدة.',
  'felt.sidi': 'سيدي بوسعيد', 'felt.carthage': 'قرطاج', 'felt.sahara': 'الصحراء', 'felt.jasmin': 'الياسمين', 'felt.nuit': 'ليل تونس',
  'back.zellij': 'زليج', 'back.jasmin': 'ياسمين', 'back.kairouan': 'القيروان', 'back.or': 'ذهب',
  'pro.board': 'ترتيب اللاعبين', 'pro.boardOffline': 'يجب الاتصال بالخادم لرؤية الترتيب.', 'pro.boardEmpty': 'لا أحد بعد. العب لتكون الأول!', 'pro.you': 'أنت', 'pro.pos': 'مرتبتك: {n} / {total}', 'pro.loading': 'جارٍ التحميل…',
  'pro.earned': '+{xp} XP · +{coins} 🪙', 'pro.levelUp': 'المستوى {n}! 🎉', 'pro.newRank': 'رتبة جديدة: {r}!', 'pro.giftReady': '🎁 هدية اليوم جاهزة!',
  'google.title': 'الحساب', 'google.guest': 'تلعب كضيف: تقدّمك محفوظ على هذا الجهاز.', 'google.hint': 'سجّل بـ Gmail لحفظ تقدّمك وإيجاده على أي جهاز.',
  'google.signed': 'متصل بـ Google ✓ {name}', 'google.out': 'خروج', 'google.off': 'تسجيل Gmail غير مفعّل بعد على الخادم (انظر README).',
  'google.app': 'تسجيل Gmail يعمل في الموقع (في التطبيق العب كضيف).', 'google.ok': 'متصل بـ Google ✓', 'google.fail': 'تعذّر الاتصال بـ Google.',
});
Object.assign(fr, {
  'pro.tab.me': 'Profil', 'pro.tab.daily': 'Quotidien', 'pro.tab.themes': 'Thèmes', 'pro.tab.board': 'Classement',
  'pro.level': 'Niveau {n}', 'pro.lv': 'Nv {n}', 'pro.xp': '{a} / {b} XP', 'pro.coins': 'Pièces', 'pro.virtual': 'Pièces virtuelles, juste pour le jeu : on ne les achète pas et elles ne valent pas d’argent réel.',
  'pro.edit': '✏️ Changer nom / avatar', 'pro.stats': 'Statistiques',
  'stat.rounds': 'Manches', 'stat.wins': 'Victoires', 'stat.frich': 'Frich', 'stat.opens': 'Ouvertures', 'stat.matches': 'Parties', 'stat.matchWins': 'Parties gagnées', 'stat.online': 'En ligne',
  'rank.bronze': 'Bronze', 'rank.argent': 'Argent', 'rank.or': 'Or', 'rank.platine': 'Platine', 'rank.diamant': 'Diamant',
  'pro.gift': 'Cadeau du jour', 'pro.giftBtn': 'Prendre {n} 🪙', 'pro.giftDone': 'Cadeau du jour récupéré. Reviens demain !', 'pro.streak': 'Reviens chaque jour, le cadeau grandit (jour {n}/7)',
  'pro.missions': 'Missions du jour', 'pro.claim': 'Prendre', 'pro.claimed': '✓',
  'mission.play3': 'Joue {n} manches', 'mission.win1': 'Gagne une manche', 'mission.win3': 'Gagne {n} manches', 'mission.open3': 'Ouvre {n} fois', 'mission.frich1': 'Fais un frich', 'mission.online2': 'Joue {n} manches en ligne',
  'pro.felt': 'Tapis', 'pro.back': 'Dos des cartes', 'pro.locked': '🔒 Nv {n}', 'pro.themesHint': 'Monte de niveau pour débloquer de nouveaux thèmes.',
  'felt.sidi': 'Sidi Bou Saïd', 'felt.carthage': 'Carthage', 'felt.sahara': 'Sahara', 'felt.jasmin': 'Jasmin', 'felt.nuit': 'Nuit de Tunis',
  'back.zellij': 'Zellige', 'back.jasmin': 'Jasmin', 'back.kairouan': 'Kairouan', 'back.or': 'Or',
  'pro.board': 'Classement des joueurs', 'pro.boardOffline': 'Connecte-toi au serveur pour voir le classement.', 'pro.boardEmpty': 'Personne encore. Joue pour être le premier !', 'pro.you': 'Toi', 'pro.pos': 'Ta place : {n} / {total}', 'pro.loading': 'Chargement…',
  'pro.earned': '+{xp} XP · +{coins} 🪙', 'pro.levelUp': 'Niveau {n} ! 🎉', 'pro.newRank': 'Nouveau rang : {r} !', 'pro.giftReady': '🎁 Ton cadeau du jour est prêt !',
  'google.title': 'Compte', 'google.guest': 'Tu joues en invité : ta progression est gardée sur cet appareil.', 'google.hint': 'Connecte-toi avec Gmail pour sauvegarder ta progression et la retrouver partout.',
  'google.signed': 'Connecté avec Google ✓ {name}', 'google.out': 'Déconnexion', 'google.off': 'La connexion Gmail n’est pas encore activée sur le serveur (voir README).',
  'google.app': 'La connexion Gmail marche sur le site (dans l’appli, joue en invité).', 'google.ok': 'Connecté avec Google ✓', 'google.fail': 'Connexion Google impossible.',
});
Object.assign(en, {
  'pro.tab.me': 'Profile', 'pro.tab.daily': 'Daily', 'pro.tab.themes': 'Themes', 'pro.tab.board': 'Leaderboard',
  'pro.level': 'Level {n}', 'pro.lv': 'Lv {n}', 'pro.xp': '{a} / {b} XP', 'pro.coins': 'Coins', 'pro.virtual': 'Virtual coins for fun only: they cannot be bought and have no real-money value.',
  'pro.edit': '✏️ Change name / avatar', 'pro.stats': 'Stats',
  'stat.rounds': 'Rounds', 'stat.wins': 'Wins', 'stat.frich': 'Frich', 'stat.opens': 'Openings', 'stat.matches': 'Matches', 'stat.matchWins': 'Matches won', 'stat.online': 'Online',
  'rank.bronze': 'Bronze', 'rank.argent': 'Silver', 'rank.or': 'Gold', 'rank.platine': 'Platinum', 'rank.diamant': 'Diamond',
  'pro.gift': "Today's gift", 'pro.giftBtn': 'Claim {n} 🪙', 'pro.giftDone': "You got today's gift. Come back tomorrow!", 'pro.streak': 'Come back every day for a bigger gift (day {n}/7)',
  'pro.missions': "Today's missions", 'pro.claim': 'Claim', 'pro.claimed': '✓',
  'mission.play3': 'Play {n} rounds', 'mission.win1': 'Win a round', 'mission.win3': 'Win {n} rounds', 'mission.open3': 'Open {n} times', 'mission.frich1': 'Make a frich', 'mission.online2': 'Play {n} online rounds',
  'pro.felt': 'Table felt', 'pro.back': 'Card back', 'pro.locked': '🔒 Lv {n}', 'pro.themesHint': 'Level up to unlock new themes.',
  'felt.sidi': 'Sidi Bou Said', 'felt.carthage': 'Carthage', 'felt.sahara': 'Sahara', 'felt.jasmin': 'Jasmine', 'felt.nuit': 'Tunis night',
  'back.zellij': 'Zellige', 'back.jasmin': 'Jasmine', 'back.kairouan': 'Kairouan', 'back.or': 'Gold',
  'pro.board': 'Player leaderboard', 'pro.boardOffline': 'Connect to the server to see the leaderboard.', 'pro.boardEmpty': 'Nobody yet. Play to be first!', 'pro.you': 'You', 'pro.pos': 'Your place: {n} / {total}', 'pro.loading': 'Loading…',
  'pro.earned': '+{xp} XP · +{coins} 🪙', 'pro.levelUp': 'Level {n}! 🎉', 'pro.newRank': 'New rank: {r}!', 'pro.giftReady': "🎁 Today's gift is ready!",
  'google.title': 'Account', 'google.guest': 'You play as a guest: your progress is saved on this device.', 'google.hint': 'Sign in with Gmail to back up your progress and find it on any device.',
  'google.signed': 'Signed in with Google ✓ {name}', 'google.out': 'Sign out', 'google.off': 'Gmail sign-in is not enabled on the server yet (see README).',
  'google.app': 'Gmail sign-in works on the website (in the app, play as guest).', 'google.ok': 'Signed in with Google ✓', 'google.fail': 'Could not sign in with Google.',
});

// score limit / opening / spectators
Object.assign(tn, {"create.mode": "Kifech youfa", "mode.score": "B score", "mode.rounds": "B jaryet", "create.limit": "Limite mta3 el score", "create.limitHint": "Elli youssel {n} point yokhroj w yrja3 spectateur (esmou mchattab). El o5rin ykammlou, w e5er wa7ed yab9a howa elli yerba7.", "create.roundsHint": "El match youfa ba3d 3add el jaryet, w elli 3andou a9al points yerba7.", "create.openMin": "L'ouverture (point)", "round.limit": "Jarya {n} · limite {limit}", "rooms.limit": "limite {n}", "rooms.open": "ouverture {n}", "out.chip": "Spectateur", "out.me": "Wsolt {n}: kharajt, tawa tetfarrej", "out.banner": "Kharajt! 👁 Tawa spectateur", "t.out": "{name} wsel {n} w kharaj 👁"});
Object.assign(ar, {"create.mode": "نهاية المباراة", "mode.score": "بالنقاط", "mode.rounds": "بالجولات", "create.limit": "حدّ النقاط", "create.limitHint": "من يصل إلى {n} نقطة يخرج ويصبح متفرّجًا (اسمه مشطوب). الباقون يواصلون، وآخر من يبقى هو الفائز.", "create.roundsHint": "تنتهي المباراة بعد عدد الجولات، ومن لديه أقل نقاط يفوز.", "create.openMin": "الفتح (نقاط)", "round.limit": "الجولة {n} · الحد {limit}", "rooms.limit": "الحد {n}", "rooms.open": "الفتح {n}", "out.chip": "متفرّج", "out.me": "وصلت {n}: خرجت، أنت الآن متفرّج", "out.banner": "خرجت! 👁 أنت متفرّج", "t.out": "{name} وصل {n} وخرج 👁"});
Object.assign(fr, {"create.mode": "Fin de partie", "mode.score": "Au score", "mode.rounds": "En manches", "create.limit": "Score limite", "create.limitHint": "Celui qui atteint {n} points est éliminé et devient spectateur (nom barré). Les autres continuent, le dernier en jeu gagne.", "create.roundsHint": "La partie s’arrête après le nombre de manches ; le moins de points gagne.", "create.openMin": "Ouverture (points)", "round.limit": "Manche {n} · limite {limit}", "rooms.limit": "limite {n}", "rooms.open": "ouverture {n}", "out.chip": "Spectateur", "out.me": "Tu as atteint {n} : éliminé, tu regardes", "out.banner": "Éliminé ! 👁 Tu es spectateur", "t.out": "{name} a atteint {n} et est éliminé 👁"});
Object.assign(en, {"create.mode": "Match ends", "mode.score": "By score", "mode.rounds": "By rounds", "create.limit": "Score limit", "create.limitHint": "Whoever reaches {n} points is out and becomes a spectator (name crossed out). The others play on; the last one left wins.", "create.roundsHint": "The match ends after the set number of rounds; fewest points wins.", "create.openMin": "Opening (points)", "round.limit": "Round {n} · limit {limit}", "rooms.limit": "limit {n}", "rooms.open": "opening {n}", "out.chip": "Spectator", "out.me": "You reached {n}: you're out, now watching", "out.banner": "You're out! 👁 Spectating", "t.out": "{name} reached {n} and is out 👁"});

// rebuy (tgaji)
Object.assign(tn, {"rebuy.ask": "T7eb tgaji?", "rebuy.hint": "Wsolt {limit}. Ken tgaji tarja3 tal3ab b {n} point (akber score 3and elli mazelou yal3bou).", "rebuy.yes": "Ey, ngaji", "rebuy.no": "Le, netfarrej", "i.rebuy": "{name} gaja w rja3 b {n} point 🔁", "create.limitHint": "Elli youssel {n} point yokhroj (spectateur, esmou mchattab). Elli yokhroj louwel ynajjem ygaji b akber score. Ki yab9aw zouz, el match youfa w elli 3andou a9al points yerba7."});
Object.assign(ar, {"rebuy.ask": "هل تريد العودة إلى اللعب؟", "rebuy.hint": "وصلت {limit}. إن عدت تلعب بـ {n} نقطة (أعلى نتيجة بين اللاعبين الباقين).", "rebuy.yes": "نعم، أعود", "rebuy.no": "لا، أتفرّج", "i.rebuy": "{name} عاد بـ {n} نقطة 🔁", "create.limitHint": "من يصل إلى {n} نقطة يخرج ويصبح متفرّجًا (اسمه مشطوب). أول من يخرج يمكنه العودة بأعلى نتيجة. عندما يبقى لاعبان تنتهي المباراة ويفوز صاحب أقل نقاط."});
Object.assign(fr, {"rebuy.ask": "Tu veux revenir dans la partie ?", "rebuy.hint": "Tu as atteint {limit}. Si tu reviens, tu repars avec {n} points (le plus haut score des joueurs encore en jeu).", "rebuy.yes": "Oui, je reviens", "rebuy.no": "Non, je regarde", "i.rebuy": "{name} se rachète et revient avec {n} points 🔁", "create.limitHint": "Celui qui atteint {n} points est éliminé (spectateur, nom barré). Le premier éliminé peut se racheter avec le plus haut score. Quand il reste deux joueurs, la partie s’arrête et le moins de points gagne."});
Object.assign(en, {"rebuy.ask": "Want to buy back into the game?", "rebuy.hint": "You reached {limit}. If you come back you play on with {n} points (the highest score among players still in).", "rebuy.yes": "Yes, I'm back", "rebuy.no": "No, I'll watch", "i.rebuy": "{name} bought back in with {n} points 🔁", "create.limitHint": "Whoever reaches {n} points is out (spectator, name crossed out). The first one out may buy back in at the highest score. When two players are left the match ends and the fewest points wins."});

// table styles
Object.assign(tn, {"felt.vert": "Vert classique", "felt.noir": "Noir w dheb", "felt.bois": "Bois", "felt.carthage": "Rouge Carthage", "set.felt": "Lawn el tawla"});
Object.assign(ar, {"felt.vert": "أخضر كلاسيكي", "felt.noir": "أسود وذهبي", "felt.bois": "خشب", "felt.carthage": "أحمر قرطاج", "set.felt": "لون الطاولة"});
Object.assign(fr, {"felt.vert": "Vert classique", "felt.noir": "Noir et or", "felt.bois": "Bois", "felt.carthage": "Rouge Carthage", "set.felt": "Style de table"});
Object.assign(en, {"felt.vert": "Classic green", "felt.noir": "Black & gold", "felt.bois": "Wood", "felt.carthage": "Carthage red", "set.felt": "Table style"});

// quick discard while deciding
Object.assign(tn, {"decide.orThrow": "(wala remi carta direct = nal3bou)"});
Object.assign(ar, {"decide.orThrow": "(أو ارمِ ورقة مباشرة = نلعب)"});
Object.assign(fr, {"decide.orThrow": "(ou jette une carte directement = on joue)"});
Object.assign(en, {"decide.orThrow": "(or throw a card straight away = play)"});

// put-back penalty
Object.assign(tn, {"n.returned": "Hezz carta mel ard w rajja3ha", "act.undoPen": "Rajja3ha (+{n})"});
Object.assign(ar, {"n.returned": "أخذ ورقة من الأرض وأرجعها", "act.undoPen": "أرجعها (+{n})"});
Object.assign(fr, {"n.returned": "A pris la défausse puis l’a remise", "act.undoPen": "La remettre (+{n})"});
Object.assign(en, {"n.returned": "Took the discard and put it back", "act.undoPen": "Put it back (+{n})"});

// decide panel + sort labels
Object.assign(tn, {"decide.happy": "3ajbetek cartek?", "decide.look": "Choof el {n} carta mte3ek mlih 9bal", "decide.othersHint": "Kol wa7ed y9oul: nkammlou wala n3awdou t-tawzi3.", "decide.redealBtn": "3awed", "decide.redealSub": "Cartet jdod (ken el kol y9oulou le)", "decide.keepBtn": "Kammel", "decide.keepSub": "N5alli cartti", "decide.warn": "Ken tkammel w ma t7allech: +{n}", "sort.label": "Tri", "sort.value": "Valeur", "sort.suit": "Couleur"});
Object.assign(ar, {"decide.happy": "هل أعجبتك أوراقك؟", "decide.look": "انظر جيدًا إلى أوراقك الـ {n} أولًا", "decide.othersHint": "كل لاعب يقرّر: نواصل أم نعيد التوزيع.", "decide.redealBtn": "أعد التوزيع", "decide.redealSub": "أوراق جديدة (إن قال الجميع لا)", "decide.keepBtn": "واصل", "decide.keepSub": "أحتفظ بأوراقي", "decide.warn": "إن واصلت ولم تفتح: +{n}", "sort.label": "ترتيب", "sort.value": "القيمة", "sort.suit": "النوع"});
Object.assign(fr, {"decide.happy": "Contents de tes cartes ?", "decide.look": "Regarde bien tes {n} cartes d’abord", "decide.othersHint": "Chacun choisit : on continue ou on redistribue.", "decide.redealBtn": "Redistribuer", "decide.redealSub": "Nouvelles cartes (si tout le monde dit non)", "decide.keepBtn": "Continuer", "decide.keepSub": "Je garde mes cartes", "decide.warn": "Si tu continues sans ouvrir : +{n}", "sort.label": "Tri", "sort.value": "Valeur", "sort.suit": "Couleur"});
Object.assign(en, {"decide.happy": "Happy with your cards?", "decide.look": "Take a good look at your {n} cards first", "decide.othersHint": "Everyone chooses: keep going or redeal.", "decide.redealBtn": "Redeal", "decide.redealSub": "New cards (if everyone says no)", "decide.keepBtn": "Continue", "decide.keepSub": "Keep my cards", "decide.warn": "Continue and never open: +{n}", "sort.label": "Sort", "sort.value": "Value", "sort.suit": "Suit"});

// home modes
Object.assign(tn, {"home.friends": "M3a s7abek", "home.friendsSub": "Tawltek, règlek, w code tab3athou", "home.createTable": "＋ A3mel tawla", "home.training": "Entraînement", "home.trainingSub": "Ma y2aththerch 3al classement", "home.vs1": "1 contre 1", "home.four": "4 joueurs", "home.matchSettings": "⚙️ Réglages el match (limite, ouverture)", "home.online": "Al3ab online", "home.onlineSub": "Al9a tawla m3a nes fi thawani, wala a3mel wa7da jdida.", "home.play": "Al3ab", "home.onlineChip": "👥 2–4 joueurs"});
Object.assign(ar, {"home.friends": "مع أصدقائك", "home.friendsSub": "طاولتك، قواعدك، ورمز تشاركه", "home.createTable": "＋ أنشئ طاولة", "home.training": "تدريب", "home.trainingSub": "لا يؤثر على ترتيبك", "home.vs1": "1 ضد 1", "home.four": "4 لاعبين", "home.matchSettings": "⚙️ إعدادات المباراة (الحد، الفتح)", "home.online": "العب أونلاين", "home.onlineSub": "اعثر على طاولة في ثوانٍ، أو أنشئ واحدة جديدة.", "home.play": "العب", "home.onlineChip": "👥 2–4 لاعبين"});
Object.assign(fr, {"home.friends": "Entre amis", "home.friendsSub": "Ta table, tes règles, un code à partager", "home.createTable": "＋ Créer une table", "home.training": "Entraînement", "home.trainingSub": "Sans effet sur ton classement", "home.vs1": "1 contre 1", "home.four": "4 joueurs", "home.matchSettings": "⚙️ Réglages de la partie (limite, ouverture)", "home.online": "Jouer en ligne", "home.onlineSub": "Trouve une table en quelques secondes, ou ouvre-en une.", "home.play": "Jouer", "home.onlineChip": "👥 2–4 joueurs"});
Object.assign(en, {"home.friends": "With friends", "home.friendsSub": "Your table, your rules, a code to share", "home.createTable": "＋ Create a table", "home.training": "Training", "home.trainingSub": "No effect on your rank", "home.vs1": "1 vs 1", "home.four": "4 players", "home.matchSettings": "⚙️ Match settings (limit, opening)", "home.online": "Play online", "home.onlineSub": "Find a table in seconds, or open a new one.", "home.play": "Play", "home.onlineChip": "👥 2–4 players"});
// why a selection is not a combination
Object.assign(tn, {"why.min3": "lazem 3 cartet 3al a9al", "why.jokers": "barcha jokers (lazem cartet 3adia akther)", "why.set4": "el trio ykoun 4 cartet akther 7aja", "why.sameSuit": "fama zouz cartet men nafs el couleur", "why.dupRank": "nafs el numero marrtin fil suite", "why.gap": "el suite mouch metla7qa (na9sa carta)", "why.mixed": "lazem nafs el numero (couleurs mkhtalfa) wala nafs el couleur metla7qin"});
Object.assign(ar, {"why.min3": "يلزم 3 أوراق على الأقل", "why.jokers": "جوكر كثير (يلزم أوراق عادية أكثر)", "why.set4": "المجموعة 4 أوراق كحد أقصى", "why.sameSuit": "ورقتان من نفس اللون", "why.dupRank": "نفس الرقم مرتين في السلسلة", "why.gap": "السلسلة غير متتالية (تنقص ورقة)", "why.mixed": "يلزم نفس الرقم بألوان مختلفة أو نفس اللون متتالية"});
Object.assign(fr, {"why.min3": "il faut au moins 3 cartes", "why.jokers": "trop de jokers (il faut plus de cartes normales)", "why.set4": "un brelan/carré fait 4 cartes maximum", "why.sameSuit": "deux cartes de la même couleur", "why.dupRank": "la même valeur deux fois dans la suite", "why.gap": "la suite n'est pas continue (il manque une carte)", "why.mixed": "il faut la même valeur (couleurs différentes) ou la même couleur qui se suit"});
Object.assign(en, {"why.min3": "you need at least 3 cards", "why.jokers": "too many jokers (need more normal cards)", "why.set4": "a set has 4 cards at most", "why.sameSuit": "two cards of the same suit", "why.dupRank": "the same rank twice in the run", "why.gap": "the run has a gap (a card is missing)", "why.mixed": "need the same rank in different suits, or the same suit in order"});
// table: meld headers, score box, opening threshold
Object.assign(tn, {"kind.set": "Trio", "kind.run": "Suite", "sb.title": "Scores", "round.open": "7alla {n}"});
Object.assign(ar, {"kind.set": "مجموعة", "kind.run": "سلسلة", "sb.title": "النقاط", "round.open": "الفتح {n}"});
Object.assign(fr, {"kind.set": "Brelan", "kind.run": "Suite", "sb.title": "Scores", "round.open": "ouverture {n}"});
Object.assign(en, {"kind.set": "Set", "kind.run": "Run", "sb.title": "Scores", "round.open": "opening {n}"});
