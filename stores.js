/* Zum Store-Start nur hier eintragen (gilt für alle Seiten):
   LIVE = true zeigt die Store-Knöpfe statt „Bald im App Store …“.
   APPLE_ID = Zahl aus dem App-Store-Link (…/id1234567890), APPLE_PT = Anbieter-Kennung aus App Store Connect (optional).
   PREIS = "6,99 €" schaltet die Abo-Texte ein (.abo sichtbar, .vorab ausgeblendet) und setzt den Betrag in .preis.
   Leer: neutrale Texte ohne Abo und Betrag.
   Die Links tragen eine Kampagnenkennung (data-place, z. B. hero, footer, ratgeber): die Stores zeigen so, wie viele
   Downloads über die Website kamen. Die Website selbst misst nichts. */
var LIVE = false, APPLE_ID = "", APPLE_PT = "", PREIS = "";
(function(){
  var GOOGLE = "https://play.google.com/store/apps/details?id=de.leseflitz.app&referrer=utm_source%3Dleseflitz.de%26utm_medium%3Dweb%26utm_campaign%3D";
  function apple(place){ return "https://apps.apple.com/de/app/leseflitz/id"+APPLE_ID+"?mt=8&ct=web-"+place+(APPLE_PT ? "&pt="+APPLE_PT : ""); }
  if(PREIS){
    document.querySelectorAll(".preis").forEach(function(e){ e.textContent = PREIS; });
    document.querySelectorAll(".abo").forEach(function(e){ e.hidden = false; });
    document.querySelectorAll(".vorab").forEach(function(e){ e.hidden = true; });
  }
  if(!LIVE || !APPLE_ID) return;
  var u = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(u) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      and = /Android/.test(u);
  document.querySelectorAll(".stores").forEach(function(s){
    var a = s.querySelector("[data-os=ios]"), g = s.querySelector("[data-os=android]"), place = s.dataset.place;
    a.href = apple(place); g.href = GOOGLE + place;
    if(and){ s.insertBefore(g, a); a.classList.add("dim"); } else if(ios) g.classList.add("dim");
    s.hidden = false;
  });
  document.querySelectorAll(".soon, .soon-text").forEach(function(e){ e.hidden = true; });
  var desk = document.querySelector(".desk");
  if(desk && !ios && !and) desk.hidden = false;
})();
