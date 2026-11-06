/* Lesetempo-Check für woerter-pro-minute.html
   Läuft komplett im Browser: keine externen Skripte, keine Anfragen nach dem Laden, keine Cookies, kein Tracking.
   Gespeichert wird nur nach Klick auf „Ergebnis merken“: localStorage, Schlüssel „leseflitz-lesetempo-v1“,
   höchstens 6 Einträge {datum, text, klasse, wpm, genauigkeit}, ohne Namen und ohne Freitext.
   Ablauf (Zustände): start → ready → reading → marking-end → marking-errors → result
   (dazu „too-short“, wenn kürzer als 20 Sekunden gelesen wurde). */
(function () {
  "use strict";
  var root = document.getElementById("check");
  if (!root || !root.querySelector || !window.performance) return;

  /* ---- Richtwerte: zentral, damit die Fachprüfung nur diese Stelle ändern muss ---- */
  // Durchschnitt Ende des Schuljahrs (end), sehr gute Leser (top), Untergrenze für flüssiges Lesen (min); Freigabe 03.11.2026
  var NORMS = { 2: { end: [80, 90], top: 115, min: 80 }, 3: { end: [110], top: null, min: 90 },
    4: { end: [130, 140], top: 165, min: 100 }, fluent: 100, accuracy: 0.95 };
  var VERY_LOW = 0.5;             // „sehr niedrig“: unter der Hälfte des Richtwerts der Klasse (Vorschlag der Freigabe)
  var DURATION = 60, MIN_SECONDS = 20;
  var STORE_KEY = "leseflitz-lesetempo-v1", STORE_MAX = 6;
  var SHARE_URL = "https://leseflitz.de/woerter-pro-minute.html#check";   // nie mit Ergebnis oder Parametern
  var SHARE_TITLE = "Lesetempo-Check: Wie viele Wörter liest euer Kind pro Minute?";

  /* ---- Lesetexte (nicht normiert; Wortzahlen 145 / 209 / 242 / 267) ---- */
  var TEXTS = {
    A: { title: "Der kleine Hund", fuer: "für Klasse 1 und Anfang Klasse 2",
      text: "Tim hat einen kleinen Hund. Der Hund heißt Bello. Bello ist braun und hat lange Ohren. Am Morgen will Bello raus. Tim nimmt die Leine. Sie gehen in den Park. Im Park ist es noch kalt. Bello rennt zu einem Baum. Da sitzt eine Katze. Die Katze sieht den Hund. Sie springt schnell auf den Baum. Bello bellt laut. Tim lacht. „Die Katze ist schlauer als du“, sagt er. Bello legt sich ins Gras. Dann findet er einen Ball. Der Ball ist rot und nass. Tim wirft den Ball weit weg. Bello holt ihn sofort zurück. Das macht er fünf Mal. Dann ist er müde. Tim und Bello gehen nach Hause. Mama hat schon Tee gemacht. Bello bekommt Wasser und ein Stück Brot. Dann schläft er in seinem Korb. Tim malt ein Bild von Bello und der Katze. Das Bild hängt er an die Tür." },
    B: { title: "Der Ausflug zum See", fuer: "für Klasse 2",
      text: "Am Samstag fährt die Familie an den See. Lena packt ihren Rucksack. Sie nimmt ein Handtuch, eine Mütze und ihr Lieblingsbuch mit. Papa trägt den großen Korb mit dem Essen. Im Auto ist es warm. Lena schaut aus dem Fenster und zählt rote Autos. Nach einer Stunde sind sie da. Der See ist groß und glänzt in der Sonne. Am Ufer stehen hohe Bäume. Lena läuft sofort zum Wasser. Es ist kühler, als sie gedacht hat. Trotzdem geht sie bis zu den Knien hinein. Kleine Fische schwimmen um ihre Füße. Sie versucht, einen zu fangen, aber die Fische sind zu schnell. Ihr Bruder baut eine Burg aus Sand und Steinen. Lena hilft ihm und holt nasse Erde vom Ufer. Die Burg bekommt sogar einen Graben. Dann wird es Zeit für das Mittagessen. Es gibt Brote, Äpfel und kalten Saft. Plötzlich landet eine Ente neben der Decke. Sie schaut die Familie neugierig an. Lena wirft ihr ein kleines Stück Brot hin. Die Ente schnappt danach und watschelt zufrieden davon. Am Nachmittag ziehen Wolken auf. Ein kühler Wind weht über das Wasser. Papa sagt, dass es bald regnen wird. Schnell packen alle ihre Sachen zusammen. Auf der Heimfahrt ist Lena müde, aber glücklich. Sie möchte bald wieder an den See fahren." },
    C: { title: "Das Geheimnis im Garten", fuer: "für Klasse 3",
      text: "Seit ein paar Tagen bemerkte Jonas etwas Merkwürdiges. Jeden Morgen lagen im Garten kleine Erdhaufen, mal neben dem Beet, mal mitten auf dem Rasen. Seine Mutter vermutete einen Maulwurf, doch Jonas war sich nicht sicher. Er wollte das Rätsel unbedingt selbst lösen. Am Nachmittag holte er sein Notizbuch und eine Lupe aus dem Schrank. Vorsichtig untersuchte er die Haufen. Die Erde war locker und noch feucht. Daneben entdeckte er winzige Spuren, die zu einem Loch unter der Hecke führten. Jonas zeichnete alles genau auf. Am Abend fragte er seine Schwester, ob sie ihm helfen würde. Gemeinsam bauten sie aus einem Karton und einer alten Taschenlampe eine Beobachtungsstation. Sie stellten sie hinter das Gartenhaus, von wo aus sie die Hecke gut sehen konnten. Als es dunkel wurde, setzten sich die beiden in ihre Jacken gewickelt auf die Bank und warteten. Lange passierte gar nichts. Eine Eule rief in der Ferne, und ein Auto fuhr langsam vorbei. Gerade als Jonas aufgeben wollte, raschelte es plötzlich unter der Hecke. Ein kleiner, stacheliger Kopf schob sich aus dem Laub. Es war ein Igel! Er schnupperte, lief über den Rasen und begann, mit seiner spitzen Schnauze in der Erde nach Käfern und Würmern zu suchen. Die Kinder hielten den Atem an. Nach einer Weile verschwand der Igel wieder in seinem Versteck. Am nächsten Morgen erzählte Jonas seiner Mutter stolz von der Entdeckung. Seitdem stellen die Kinder jeden Abend eine flache Schale mit frischem Wasser unter die Hecke." },
    D: { title: "Die Expedition ins Museum", fuer: "für Klasse 4",
      text: "Als die Klasse 4b das Naturkundemuseum betrat, blieben fast alle Kinder überrascht stehen. In der riesigen Eingangshalle stand das Skelett eines Dinosauriers, dessen Kopf beinahe die Decke berührte. Frau Berger erklärte, dass die Knochen vor über hundert Jahren in Afrika ausgegraben worden waren. Anschließend teilte sie die Klasse in kleine Forschungsgruppen ein. Jede Gruppe bekam einen Fragebogen und sollte selbstständig Antworten im Museum suchen. Mira, Ben und Selin begannen in der Abteilung über Insekten. Hinter dicken Glasscheiben waren Schmetterlinge aus allen Teilen der Welt ausgestellt. Manche waren so groß wie eine Hand, andere winzig und unscheinbar. Auf einer Tafel lasen die drei, dass viele Schmetterlinge ihre Farben nutzen, um Feinde abzuschrecken. Danach ging es weiter in einen dunklen Raum, in dem leuchtende Steine ausgestellt waren. Unter einer besonderen Lampe glühten sie grün, violett und orange. Ben behauptete, das sei bestimmt Zauberei, doch Selin las ihm die Erklärung vor: Bestimmte Mineralien leuchten, wenn ultraviolettes Licht auf sie trifft. Die schwierigste Frage auf dem Bogen lautete, wie alt der älteste Fund des Museums sei. Die Kinder suchten lange, bis sie schließlich im obersten Stockwerk einen unscheinbaren grauen Stein entdeckten. Laut der Beschreibung enthielt er Spuren von Lebewesen, die vor mehr als drei Milliarden Jahren gelebt hatten. Mira konnte sich diese Zahl kaum vorstellen. Zum Abschluss trafen sich alle Gruppen wieder unter dem Dinosaurier und verglichen ihre Ergebnisse. Frau Berger war zufrieden, denn fast alle Fragen waren richtig beantwortet. Auf der Rückfahrt im Bus diskutierten die Kinder darüber, welche Ausstellung am spannendsten gewesen war. Die meisten stimmten für die leuchtenden Steine, doch Ben blieb dabei, dass der Dinosaurier unschlagbar sei." }
  };
  var ORDER = ["A", "B", "C", "D"], BY_GRADE = { 1: "A", 2: "B", 3: "C", 4: "D" };
  var MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  /* ---- Einordnungstexte (Wortlaut aus der Übergabe, Teil 3 – bis zur Fachprüfung unverändert) ---- */
  var SAY = {
    accuracy: "Euer Kind hat einige Wörter falsch gelesen. Das heißt meist: Der Text war noch etwas schwer. Erst genauer, dann schneller – probiert es mit einem leichteren Text.",
    grade1: "In der 1. Klasse sind Kinder noch sehr unterschiedlich weit – dafür gibt es keine verlässlichen Richtwerte. Messt in ein paar Wochen noch einmal und vergleicht mit heute.",
    fluent: "Euer Kind liest schon flüssig.",
    inRange: "Euer Kind liest im Bereich der Richtwerte für das Ende seiner Klasse.",
    below: "Euer Kind liest noch etwas langsamer als die Richtwerte für das Ende der Klasse. Mitten im Schuljahr ist das oft normal. Kurzes tägliches Üben hilft – messt in vier Wochen noch einmal.",
    veryLow: "Wenn das Lesen über längere Zeit so mühsam bleibt, sprecht mit der Lehrkraft."
  };

  /* ---- Zustand ---- */
  var st = {
    grade: 2, textId: "B", words: [], last: -1, lastStack: [], errors: {}, errStack: [],
    t0: 0, seconds: 0, timer: 0, wasHidden: false, audio: null, lock: null, result: null, saved: false
  };

  function $(id) { return document.getElementById(id); }
  var box = $("lt-text"), stage = $("lt-stage"), live = $("lt-live");
  var sections = root.querySelectorAll("[data-lt]");

  function show(name) {
    st.state = name;
    for (var i = 0; i < sections.length; i++) sections[i].hidden = sections[i].getAttribute("data-lt") !== name;
    stage.hidden = !/^(ready|reading|marking-end|marking-errors|too-short)$/.test(name);
    root.setAttribute("data-state", name);
    paint();
  }
  function say(text) { live.textContent = ""; setTimeout(function () { live.textContent = text; }, 60); }
  function num(n, digits) { return n.toLocaleString("de-DE", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 }); }
  function clock(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }

  /* ---- Lokale Speicherung (nur auf Wunsch, jede Operation in try/catch) ---- */
  function loadHistory() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, STORE_MAX) : [];
    } catch (e) { return []; }
  }
  function saveHistory(arr) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(0, STORE_MAX))); return true; } catch (e) { return false; }
  }
  function clearHistory() {
    try { window.localStorage.removeItem(STORE_KEY); return true; } catch (e) { return false; }
  }
  function fmtDate(iso) { var p = String(iso).split("-"); return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : String(iso); }
  function renderHistory() {
    var arr = loadHistory(), lastP = $("lt-letztes"), wrap = $("lt-verlauf"), list = $("lt-verlauf-liste");
    list.textContent = "";
    if (!arr.length) { lastP.hidden = true; wrap.hidden = true; return; }
    var e0 = arr[0];
    lastP.textContent = "Letztes Mal (" + fmtDate(e0.datum) + "): " + e0.wpm + " Wörter pro Minute (Text " + e0.text + ").";
    lastP.hidden = false;
    arr.forEach(function (e) {
      var li = document.createElement("li");
      li.textContent = fmtDate(e.datum) + " · Text " + e.text + " · Klasse " + e.klasse + " · " + e.wpm +
        " Wörter pro Minute · " + num(Number(e.genauigkeit), 1) + " % richtig";
      list.appendChild(li);
    });
    wrap.hidden = false;
  }

  /* ---- Textauswahl ---- */
  function setGrade(g) {
    st.grade = g;
    st.textId = BY_GRADE[g];
    updateTextChoice();
  }
  function updateTextChoice() {
    var t = TEXTS[st.textId], i = ORDER.indexOf(st.textId);
    $("lt-textname").textContent = "Text " + st.textId + " – „" + t.title + "“ (" + t.fuer + ", " + t.text.split(/\s+/).length + " Wörter)";
    $("lt-leichter").disabled = i === 0;
    $("lt-schwerer").disabled = i === ORDER.length - 1;
  }
  function buildText() {
    var t = TEXTS[st.textId];
    st.words = t.text.split(/\s+/);
    box.textContent = "";
    var frag = document.createDocumentFragment();
    st.words.forEach(function (w, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "lt-w"; b.setAttribute("data-i", i); b.textContent = w;
      frag.appendChild(b);
      if (i < st.words.length - 1) frag.appendChild(document.createTextNode(" "));
    });
    box.appendChild(frag);
    box.scrollTop = 0;
    $("lt-texttitel").textContent = "Text " + st.textId + ": „" + t.title + "“";
    $("lt-uhr-1").textContent = $("lt-uhr-2").textContent = clock(DURATION);
    st.last = -1; st.lastStack = []; st.errors = {}; st.errStack = [];
  }

  /* ---- Darstellung der Wörter je Zustand ---- */
  function paint() {
    var s = st.state, btns = box.querySelectorAll(".lt-w");
    var veiled = s === "ready" || s === "too-short";
    var active = s === "marking-end" || s === "marking-errors";
    box.classList.toggle("lt-verdeckt", veiled);
    if (veiled) box.setAttribute("aria-hidden", "true"); else box.removeAttribute("aria-hidden");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i], after = st.last >= 0 && i > st.last;
      b.disabled = !active;
      b.classList.toggle("lt-letztes", i === st.last && s !== "reading" && s !== "ready");
      b.classList.toggle("lt-danach", !!after && active);
      b.classList.toggle("lt-fehler", !!st.errors[i] && !(after && active) && s !== "reading");
      if (after && active) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled");
      if (s === "marking-errors" && !after) b.setAttribute("aria-pressed", st.errors[i] ? "true" : "false");
      else b.removeAttribute("aria-pressed");
      if (i === st.last && s === "marking-end") b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    }
    $("lt-weiter-fehler").disabled = st.last < 0;
    $("lt-rueck-ende").disabled = st.last < 0;
    $("lt-rueck-fehler").disabled = !st.errStack.length;
  }

  /* ---- Messung ---- */
  function startReading() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !st.audio && $("lt-ton").checked) st.audio = new AC();   // im Klick anlegen, sonst blockiert der Browser den Ton
      if (st.audio && st.audio.state === "suspended") st.audio.resume();
    } catch (e) { st.audio = null; }
    requestLock();
    st.wasHidden = false;
    $("lt-hintergrund").hidden = true;
    st.t0 = performance.now();
    show("reading");
    tick();
    st.timer = setInterval(tick, 250);
    $("lt-stopp").focus({ preventScroll: true });
  }
  function elapsed() { return (performance.now() - st.t0) / 1000; }
  function tick() {
    var e = elapsed(), txt = clock(DURATION - e);
    $("lt-uhr-1").textContent = txt; $("lt-uhr-2").textContent = txt;
    if (e >= DURATION) stopReading(true);
  }
  function stopReading(timeUp) {
    if (st.state !== "reading") return;
    clearInterval(st.timer);
    st.seconds = Math.min(DURATION, elapsed());
    releaseLock();
    if (timeUp) signal();
    if (st.seconds < MIN_SECONDS) {
      show("too-short");
      say("Gestoppt nach " + num(Math.round(st.seconds)) + " Sekunden. Bitte etwas länger lesen.");
      $("lt-kurz-titel").focus({ preventScroll: true });
      return;
    }
    var status = timeUp ? "Zeit ist um!" : "Gestoppt nach " + num(Math.round(st.seconds)) + " Sekunden.";
    $("lt-status").textContent = status;
    say(status + " Tippt auf das letzte Wort, das euer Kind gelesen hat.");
    show("marking-end");
    stage.scrollIntoView({ block: "nearest" });   // der Textkasten behält seine Scrollposition: zuletzt sichtbarer Bereich
    $("lt-status").focus({ preventScroll: true });
  }
  function signal() {
    if (!$("lt-ton").checked) return;
    try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) { /* egal */ }
    try {
      var ctx = st.audio; if (!ctx) return;
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = "sine"; o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);     // leise
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.5);
    } catch (e) { /* ohne Ton weiter */ }
  }
  function requestLock() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request("screen").then(function (l) { st.lock = l; }, function () {});
      }
    } catch (e) { /* ohne Wake Lock weiter */ }
  }
  function releaseLock() {
    try { if (st.lock) st.lock.release().catch(function () {}); } catch (e) { /* egal */ }
    st.lock = null;
  }
  document.addEventListener("visibilitychange", function () {
    if (st.state !== "reading") return;
    if (document.hidden) { st.wasHidden = true; return; }
    $("lt-hintergrund").hidden = !st.wasHidden;
    requestLock();       // der Browser gibt den Wake Lock im Hintergrund frei
    tick();
  });

  /* ---- Auswertung ---- */
  box.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest(".lt-w") : null;
    if (!b || b.disabled) return;
    var i = +b.getAttribute("data-i");
    if (st.state === "marking-end") {
      st.lastStack.push(st.last); st.last = i; paint();
    } else if (st.state === "marking-errors") {
      if (i > st.last) return;                            // ausgegraut
      st.errStack.push(i);
      if (st.errors[i]) delete st.errors[i]; else st.errors[i] = true;
      paint();
    }
  });
  // Pfeiltasten springen von Wort zu Wort (zusätzlich zu Tab)
  box.addEventListener("keydown", function (ev) {
    var k = ev.key, d = k === "ArrowRight" || k === "ArrowDown" ? 1 : k === "ArrowLeft" || k === "ArrowUp" ? -1 : 0;
    if (!d || !ev.target.classList.contains("lt-w")) return;
    var btns = box.querySelectorAll(".lt-w"), i = +ev.target.getAttribute("data-i") + d;
    while (i >= 0 && i < btns.length && (btns[i].disabled || btns[i].getAttribute("aria-disabled") === "true")) i += d;
    if (i >= 0 && i < btns.length) { ev.preventDefault(); btns[i].focus(); }
  });

  function compute() {
    var read = st.last + 1, err = 0;
    for (var k in st.errors) if (st.errors.hasOwnProperty(k) && +k <= st.last) err++;
    var right = read - err;
    return {
      read: read, err: err, right: right, seconds: st.seconds,
      wpm: Math.round(right / (st.seconds / 60)),
      acc: read ? right / read : 0
    };
  }
  function showResult() {
    var r = compute(), g = st.grade, full = st.seconds >= DURATION - 0.05;
    st.result = r; st.saved = false;
    $("lt-wpm").textContent = num(r.wpm);
    var accTxt = num(Math.round(r.acc * 1000) / 10, 1);
    var satz = full
      ? "Euer Kind hat " + num(r.wpm) + " Wörter in einer Minute richtig gelesen."
      : "Euer Kind hat in " + num(Math.round(r.seconds)) + " Sekunden " + num(r.right) + " Wörter richtig gelesen. Auf eine Minute hochgerechnet sind das " + num(r.wpm) + " Wörter.";
    $("lt-satz").textContent = satz;
    $("lt-details").textContent = "Genauigkeit: " + accTxt + " % richtig · " + num(r.read) + " Wörter gelesen, davon " +
      num(r.err) + (r.err === 1 ? " Fehler" : " Fehler") + " · Text " + st.textId + " · Klasse " + g;

    // Einordnung in der festgelegten Reihenfolge
    var out = [], einord = $("lt-einordnung");
    einord.textContent = "";
    if (r.acc < NORMS.accuracy) out.push(SAY.accuracy);
    if (g === 1) out.push(SAY.grade1);
    else if (r.acc >= NORMS.accuracy) {
      if (r.wpm >= NORMS.fluent) out.push(SAY.fluent);
      out.push(r.wpm >= NORMS[g].end[0] ? SAY.inRange : SAY.below);
    }
    out.forEach(function (t) { var p = document.createElement("p"); p.textContent = t; einord.appendChild(p); });
    // unabhängig von der Genauigkeit: im Deutschen zeigt sich eine Leseschwäche oft am Tempo, nicht an Fehlern
    if (g > 1 && r.wpm < NORMS[g].end[0] * VERY_LOW) {
      var p = document.createElement("p"), a = document.createElement("a");
      p.textContent = SAY.veryLow + " ";
      a.href = "lrs-anzeichen.html"; a.textContent = "Anzeichen für LRS";
      p.appendChild(a); einord.appendChild(p);
    }

    // Richtwert-Tabelle (nicht für Klasse 1) und Monatshinweis
    var tab = $("lt-richtwerte");
    tab.hidden = g === 1;
    var rows = tab.querySelectorAll("tr[data-k]");
    for (var i = 0; i < rows.length; i++) rows[i].classList.toggle("lt-eigene", rows[i].getAttribute("data-k") === String(g));
    var m = new Date().getMonth(), mon = $("lt-monat");
    mon.hidden = g === 1;
    mon.textContent = (m === 5 || m === 6)
      ? "Die Richtwerte gelten für das Ende des Schuljahrs."
      : "Die Richtwerte gelten für das Ende des Schuljahrs. Jetzt im " + MONTHS[m] + " liegen die Werte üblicherweise darunter.";

    var mb = $("lt-merken");
    mb.disabled = false; mb.textContent = "Ergebnis merken";
    $("lt-gemerkt").hidden = true;
    show("result");
    say(satz + " Genauigkeit " + accTxt + " Prozent. " + out.join(" "));
    var h = $("lt-erg-titel");
    h.focus({ preventScroll: true });
    root.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function buildNormTable() {
    var body = $("lt-richtwerte-body");
    function row(k, label, val, top, min) {
      var tr = document.createElement("tr"); tr.setAttribute("data-k", k);
      [label, val, top, min].forEach(function (c, j) { var td = document.createElement(j ? "td" : "th"); if (!j) td.scope = "row"; td.textContent = c; tr.appendChild(td); });
      body.appendChild(tr);
    }
    [2, 3, 4].forEach(function (k) {
      var n = NORMS[k];
      row(String(k), String(k), "ca. " + n.end.join("–"), n.top ? "ca. " + n.top : "–", "ca. " + n.min);
    });
  }

  /* ---- Teilen: nur der Link zur Seite, nie ein Ergebnis ---- */
  var canShare = !!navigator.share;
  function share(btn) {
    if (canShare) {
      navigator.share({ title: SHARE_TITLE, url: SHARE_URL }).catch(function (e) {
        if (e && e.name !== "AbortError") copyLink(btn);
      });
    } else copyLink(btn);
  }
  function copyLink(btn) {
    var info = btn.parentNode.parentNode.querySelector(".lt-teilen-info"), field = info.querySelector("input");
    function manual() { info.hidden = false; info.querySelector("span").textContent = "Link markieren und kopieren:"; field.focus(); field.select(); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SHARE_URL).then(function () {
          info.hidden = false; info.querySelector("span").textContent = "Link kopiert:"; say("Link kopiert.");
        }, manual);
      } else manual();
    } catch (e) { manual(); }
  }

  /* ---- Druckansicht des Texts mit Wortzahl am Zeilenende ---- */
  function printText() {
    var t = TEXTS[st.textId], words = t.text.split(/\s+/), sheet = $("lt-druck");
    sheet.textContent = "";
    var h = document.createElement("h1"); h.textContent = "Lesetempo-Check: Text " + st.textId + " – „" + t.title + "“";
    var p = document.createElement("p");
    p.textContent = "Euer Kind liest eine Minute laut vor. Die Zahl am Zeilenende zeigt, wie viele Wörter bis dort stehen. " +
      "Falsch gelesene oder ausgelassene Wörter abziehen; selbst verbessert oder wiederholt zählt als richtig.";
    sheet.appendChild(h); sheet.appendChild(p);
    var ol = document.createElement("div"); ol.className = "lt-druck-text";
    var line = [], len = 0, count = 0;
    function flush() {
      if (!line.length) return;
      var d = document.createElement("div"), s1 = document.createElement("span"), s2 = document.createElement("span");
      s1.textContent = line.join(" "); s2.textContent = String(count); s2.className = "lt-druck-zahl";
      d.appendChild(s1); d.appendChild(s2); ol.appendChild(d); line = []; len = 0;
    }
    words.forEach(function (w) {
      if (len + w.length + 1 > 52) flush();
      line.push(w); len += w.length + 1; count++;
    });
    flush();
    sheet.appendChild(ol);
    var f = document.createElement("p"); f.className = "lt-druck-fuss";
    f.textContent = "Grobe Orientierung, kein Test im fachlichen Sinn. · leseflitz.de/woerter-pro-minute.html";
    sheet.appendChild(f);
    document.documentElement.classList.add("lt-drucken");
    window.print();
    setTimeout(function () { document.documentElement.classList.remove("lt-drucken"); }, 1000);
  }
  window.addEventListener("afterprint", function () { document.documentElement.classList.remove("lt-drucken"); });

  /* ---- Bedienelemente ---- */
  var radios = root.querySelectorAll("input[name=lt-klasse]");
  for (var i = 0; i < radios.length; i++) radios[i].addEventListener("change", function () { setGrade(+this.value); });
  $("lt-leichter").addEventListener("click", function () { st.textId = ORDER[Math.max(0, ORDER.indexOf(st.textId) - 1)]; updateTextChoice(); });
  $("lt-schwerer").addEventListener("click", function () { st.textId = ORDER[Math.min(3, ORDER.indexOf(st.textId) + 1)]; updateTextChoice(); });
  $("lt-zum-text").addEventListener("click", function () {
    buildText(); show("ready"); stage.scrollIntoView({ block: "start" }); $("lt-start").focus({ preventScroll: true });
  });
  $("lt-start").addEventListener("click", startReading);
  $("lt-stopp").addEventListener("click", function () { stopReading(false); });
  $("lt-uhr-aus").addEventListener("change", function () { stage.classList.toggle("lt-ohne-uhr", this.checked); });
  $("lt-nochmal-kurz").addEventListener("click", function () { buildText(); show("ready"); $("lt-start").focus({ preventScroll: true }); });
  $("lt-andere-kurz").addEventListener("click", function () { show("start"); $("lt-titel").focus({ preventScroll: true }); });
  $("lt-rueck-ende").addEventListener("click", function () { st.last = st.lastStack.length ? st.lastStack.pop() : -1; paint(); });
  $("lt-weiter-fehler").addEventListener("click", function () { show("marking-errors"); $("lt-fehler-titel").focus({ preventScroll: true }); });
  $("lt-zurueck").addEventListener("click", function () { show("marking-end"); $("lt-status").focus({ preventScroll: true }); });
  $("lt-rueck-fehler").addEventListener("click", function () {
    if (!st.errStack.length) return;
    var i = st.errStack.pop();
    if (st.errors[i]) delete st.errors[i]; else st.errors[i] = true;
    paint();
  });
  $("lt-ergebnis").addEventListener("click", showResult);
  $("lt-nochmal").addEventListener("click", function () {
    renderHistory(); show("start"); root.scrollIntoView({ block: "start" }); $("lt-titel").focus({ preventScroll: true });
  });
  $("lt-merken").addEventListener("click", function () {
    if (st.saved || !st.result) return;
    var r = st.result, d = new Date();
    var iso = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    var arr = loadHistory();
    arr.unshift({ datum: iso, text: st.textId, klasse: st.grade, wpm: r.wpm, genauigkeit: Math.round(r.acc * 1000) / 10 });
    var ok = saveHistory(arr), msg = $("lt-gemerkt");
    msg.textContent = ok
      ? "Gemerkt – nur in diesem Browser auf eurem Gerät. Den Verlauf könnt ihr am Anfang des Checks wieder löschen."
      : "Merken klappt in diesem Browser nicht (zum Beispiel im privaten Modus). Der Check funktioniert trotzdem.";
    msg.hidden = false; say(msg.textContent);
    if (ok) { st.saved = true; this.disabled = true; this.textContent = "Gemerkt"; }
    renderHistory();
  });
  $("lt-loeschen").addEventListener("click", function () {
    clearHistory(); renderHistory(); say("Verlauf gelöscht.");
    $("lt-titel").focus({ preventScroll: true });
  });
  $("lt-drucken").addEventListener("click", printText);
  var shares = root.querySelectorAll(".lt-teilen");
  for (var j = 0; j < shares.length; j++) {
    if (!canShare) shares[j].textContent = "Link zum Check kopieren";
    shares[j].addEventListener("click", function () { share(this); });
  }

  /* ---- Start ---- */
  buildNormTable();
  setGrade(2);
  renderHistory();
  root.classList.add("lt-bereit");   // ohne JavaScript bleibt der Hinweis in <noscript>
  show("start");
})();
