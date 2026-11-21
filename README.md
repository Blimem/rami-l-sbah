# Rami Tounsi — online 🃏

Lo3bet **Rami tounsi** online: lobby, tawlet b code, chat, bots, w application Android.
Code jdid 100% (moteur, serveur, design, cartet), ma fih 7atta 7aja men site e5er.

## Chnoua fih

| | |
|---|---|
| **Règles** | 2 jeux + 4 jokers (108 carta), 14 carta lkol wa7ed (elli yebda 15). Trio/carré w suites (A-2-3 wala Q-K-A). L'ouverture lazemha **71 point** w lazemha **suite bla joker** (sinon +50). Carta mel ard lazem testa3melha f nafs el dour. Tbaddel joker 3al tawla. |
| **Frich** | Ba3d el tawzi3, kol wa7ed (men elli yebda) y9oul **nal3bou wala le?** Ken el kol y9oulou le, 14 carta jdod yetfar9ou. Elli 9al nal3bou w kammlet el jarya w howa ma 7allech (71) w ma frichech: +50. Elli y7ell w ykammel f nafs el dour (frich): el o5rin kol wa7ed +100; w ken frich b carta hezzha mel ard, elli remaha yzid +50 (150). |
| **Kifech youfa el match** | 3and el création (online w contre l'ordi) t7ott: 3add el joueurs (2–4), **limite mta3 el score** (par défaut 500, tnajjem tekteb ay ra9m) wala 3add jaryet, w **l'ouverture** (71 par défaut, tetbaddel 21–201). B el limite: elli youssel yokhroj w ywalli **spectateur** (esmou mchattab, ychouf el jeu). Elli yokhroj **louwel** yjih popup "T7eb tgaji?": ken 9al ey yarja3 b akber score 3and elli mazelou yal3bou (marra wa7da). Ki yab9aw **zouz** joueurs (wala wa7ed fi match b 2), el match youfa w elli 3andou a9al points yerba7. |
| **Lo8at** | Tounsi, العربية (RTL), Français, English (⚙️ Réglages). |
| **Mousi9a w sounat** | 4 morceaux cha3bi originaux (darbouka, mezoued, bendir, 9ra9eb, stambeli, 3oud) ma3mloulin b el code (bla copyright), ikhtiar + volume, w tnajjem tzid mp3 mte3ek. *Imchi marznik* ken 30s fat w ma remach carta; *Hedhi tris lil 3ris* ken wa7ed yremi 3; *Quatro ija khoudh b khatrou* ken yremi 4 (voix synthèse, wala sajjel sowtek fel réglages). |
| **Vocal** | Discussion vocale bin el joueurs fel tawla (WebRTC, micro on/off, ychouf chkoun yetkallem). Yekhdem b STUN barka: 3al ba3dh réseaux 4G/entreprise lazem serveur TURN (mithel coturn) bech yet3adda el sout. |
| **Profil (pro)** | Niveaux w XP, rangs (Bronze → Diamant), pièces **virtuelles** (ma yetchrawech, ma yetbaddlouch b flous), cadeau kol youm (yekber 7 ayyem), 3 missions kol youm, thèmes (tawla + dhar el carta) yet7allou bel niveau, statistiques, classement online. |
| **Online** | Lobby fih el tawlet el publique (live), tawla privée b code wala lien, 2–4 joueurs, host yzid bots, wa9t kol dour (20/40/60s/∞), chat + messages rapides, reconnexion automatique (2 d9aye9), ken wa7ed yokhroj bot yekhou blastou. Serveur authoritative: ta7t kol 7aja tet7akkem fil serveur, w 7add ma ychouf cartet el o5rin. |
| **Contre l'ordi** | 1–3 bots, 3 niveaux (Sahel / 3adi / Pro), yemchi offline. |
| **Design** | Thème "Sidi Bou Said la nuit": bleu, dhheb w tapis vert-bleu, cartet originaux (monogrammes, dos zellij). Animations (distribution, cartet ytirou), sons synthétisés, vibration. Ikhtiyar intelligent: el combinaison w el points yet7asbou wa7adhom, el hbout elli tnajjem tzid 3lihom yetlawnou b dhheb. Drag & drop (jarr lel ard bech tremi, wala 3al hbouta). PC, tablette, telifoun (portrait w paysage). |

## Tal3ab 3al PC (local)

```bash
npm install
npm start           # http://localhost:8080
npm test            # 300 jarya simulée + règles + progression + test online (2 joueurs + bot)
```

S7abek 3al nafs el wifi ynajjmou yodkhlou b `http://<IP-mta3-PC>:8080`.

## Tal3ab online m3a s7abek (internet)

Lazem t7ott el serveur 3al internet. Akhyar 7all majjani: **Render.com**

1. Tala3 el dossier hedha l repo GitHub.
2. Fi Render: **New → Blueprint** w ikhtar el repo (fih `render.yaml`), wala **New → Web Service**: build `npm ci --omit=dev`, start `npm start`.
3. Ba3d d9i9tin ya3tik lien kif `https://rami-tounsi.onrender.com`. Hedha howa el jeu: ab3eth el lien l s7abek.

(Fama zeda `Dockerfile` ken t7eb Fly.io, Railway, wala VPS.)
Fil free plan, Render yor9ed ba3d 15 d9i9a bla 7ad; awel marra y7ell yestanna ~30 seconde.

### Sauvegarde w classement

El serveur yekteb el classement w el sauvegardes Gmail fi `DATA_DIR` (par défaut `./data`). Fi Render, zid **Disk** (Settings → Disks, mount `/var/data`) w 7ott `DATA_DIR=/var/data`, sinon yetfasskhou ki yetbaddel el serveur.
El progrès (niveau, flous) yet7fadh 3al appareil; el classement yet3abba mel joueurs (pièces virtuelles, ma fihomch flous 7a9i9a).

### Connexion b Gmail (optionnelle)

Bla hedha, el kol yal3bou **invité** (normal). Bech tzid Gmail:

1. Odkhol https://console.cloud.google.com → a3mel projet.
2. **APIs & Services → OAuth consent screen**: External, esm el app, email mte3ek → Save.
3. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
   Fi **Authorized JavaScript origins** 7ott lien el site (mithel `https://rami-tounsi.onrender.com`, w `http://localhost:8080` lel test).
4. Copi el **Client ID** (`....apps.googleusercontent.com`) w 7ottou fi Render: Environment → `GOOGLE_CLIENT_ID`.
5. Fel profil yodhhor bouton "Se connecter avec Google": el progrès yet7fadh 3al serveur w tal9ah fi ay appareil.

Fel APK, Google ma y5allich el connexion men WebView: el application tab9a invité (w tnajjem tal3ab online 3adi).

## L'application Android (APK)

`Rami-Tounsi.apk` (Android 7+, v2.6). Contre l'ordi yemchi direct bla internet. Fih micro (vocal w tsajjel el klem), ikhtiar mousi9a men telifounek, w voix arabe (synthèse Android).
Lel online: ftah ⚙️ Réglages fil application w 7ott adresse el serveur (el lien mta3 Render).
Wala 7ottha marra wa7da fi `public/config.js` (`window.RAMI_SERVER = 'https://...'`) w 3awed ebni el APK:

```bash
python3 android/build_apk.py <dossier-jars> out/
# jars: dalvik-dx-16.0.1.jar, apksig-2.3.0.jar, android-all.jar (robolectric 7.0.0) — men Maven Central
```

`android-project/` howa nafs el app ka projet Android Studio (Gradle) ken t7eb tbaddel fih.
El clé de signature: `android/tools/rami-release.p12` (mot de passe `ramitounsi`, alias `rami`). Khabbiha ken bech tnachrou 3al Play Store.

## Structure

```
public/js/core/rules.js   règles, validation des combinaisons, points
public/js/core/game.js    une jarya (machine à états, chaque coup vérifié)
public/js/core/bot.js     bots (recherche de la meilleure combinaison, défausse intelligente)
public/js/core/table.js   tawla: places, bots, timers, match en plusieurs jarayet
public/js/ui/*            interface (app.js), cartet (cards.js), sons, réseau
public/js/core/progress.js XP, niveaux, rangs, pièces virtuelles, cadeau, missions, thèmes
public/js/ui/i18n.js      lo8at (tn, ar, fr, en)
public/js/ui/music.js     mousi9a cha3bi (WebAudio) + mousi9tek (IndexedDB)
public/js/ui/voice.js     vocal WebRTC · voicelines.js: marznik / tris / quatro
server/index.js           serveur HTTP + WebSocket (lobby, tawlet, reconnexion, anti-spam, signaling vocal)
server/accounts.js        classement + sauvegarde Gmail (JSON fi DATA_DIR)
```

Nafs el moteur yekhdem fil serveur (online) w fil navigateur (contre l'ordi).
