/* Store-Knöpfe: Die Links stehen seit dem Store-Start (18.11.2026) fest im HTML, mit Kampagnenkennung (data-place,
   z. B. hero, footer, ratgeber) – die Stores zeigen so, wie viele Downloads über die Website kamen. Die Website selbst
   misst nichts. Dieses Skript stellt nur den passenden Store nach vorn, zeigt am Computer den QR-Code und leitet
   laden.html (Ziel des QR-Codes) gleich in den passenden Store weiter.
   APPLE_PT = Anbieter-Kennung aus App Store Connect (optional, hängt sich an die Apple-Links). */
var APPLE_ID = "6828036647", APPLE_PT = "";
(function(){
  var GOOGLE = "https://play.google.com/store/apps/details?id=de.leseflitz.app&referrer=utm_source%3Dleseflitz.de%26utm_medium%3Dweb%26utm_campaign%3D";
  function apple(place){ return "https://apps.apple.com/de/app/leseflitz/id"+APPLE_ID+"?mt=8&ct=web-"+place+(APPLE_PT ? "&pt="+APPLE_PT : ""); }
  // laden.html (Ziel des QR-Codes): gleich zur passenden Store-Seite
  if(document.body.dataset.weiter){
    var place = document.body.dataset.weiter, ua = navigator.userAgent;
    if(/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)){ location.replace(apple(place)); return; }
    if(/Android/.test(ua)){ location.replace(GOOGLE + place); return; }
  }
  var u = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(u) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      and = /Android/.test(u);
  document.querySelectorAll(".stores").forEach(function(s){
    var a = s.querySelector("[data-os=ios]"), g = s.querySelector("[data-os=android]"), place = s.dataset.place;
    a.href = apple(place); g.href = GOOGLE + place;
    if(and){ s.insertBefore(g, a); a.classList.add("dim"); } else if(ios) g.classList.add("dim");
  });
  var desk = document.querySelector(".desk");
  if(desk && !ios && !and) desk.hidden = false;
})();
