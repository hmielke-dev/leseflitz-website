/* Store-Knöpfe: Die Links stehen seit dem Store-Start (18.11.2026) fest im HTML, mit Kampagnenkennung (data-place,
   z. B. hero, footer, ratgeber) – die Stores zeigen so, wie viele Downloads über die Website kamen. Die Website selbst
   misst nichts und setzt keine Cookies. Dieses Skript stellt nur den passenden Store nach vorn, zeigt am Computer den
   QR-Code und leitet laden.html gleich in den passenden Store weiter.
   laden.html?k=<kürzel> ist der Link für alle Kanäle (bekannte, familie, klassengruppe, lrs-gruppe, lerntherapie,
   fb-gruppe, presse, instagram, website): Apple bekommt ct=<kürzel>, Google utm_source=<kürzel>. Ohne gültiges Kürzel
   (nur a–z, 0–9, Bindestrich, höchstens 30 Zeichen) gilt „qr“ – das ist der QR-Code auf der Startseite.
   APPLE_PT = Anbieter-Kennung aus App Store Connect (optional, hängt sich an die Apple-Links). */
var APPLE_ID = "6828036647", APPLE_PT = "";
(function(){
  var GOOGLE = "https://play.google.com/store/apps/details?id=de.leseflitz.app&referrer=";
  function apple(ct){ return "https://apps.apple.com/de/app/leseflitz/id"+APPLE_ID+"?mt=8&ct="+ct+(APPLE_PT ? "&pt="+APPLE_PT : ""); }
  function google(source, medium, campaign){
    return GOOGLE + encodeURIComponent("utm_source="+source+"&utm_medium="+medium+"&utm_campaign="+campaign);
  }
  var u = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(u) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      and = /Android/.test(u);
  var laden = document.body.dataset.weiter, k = "";
  if(laden){
    try { k = new URLSearchParams(location.search).get("k") || ""; } catch(e){}
    if(!/^[a-z0-9-]{1,30}$/.test(k)) k = laden;
    if(ios){ location.replace(apple(k)); return; }
    if(and){ location.replace(google(k, "link", "start")); return; }
  }
  document.querySelectorAll(".stores").forEach(function(s){
    var a = s.querySelector("[data-os=ios]"), g = s.querySelector("[data-os=android]"), place = s.dataset.place;
    if(laden){ a.href = apple(k); g.href = google(k, "link", "start"); }
    else { a.href = apple("web-"+place); g.href = google("leseflitz.de", "web", place); }
    if(and){ s.insertBefore(g, a); a.classList.add("dim"); } else if(ios) g.classList.add("dim");
  });
  var desk = document.querySelector(".desk");
  if(desk && !ios && !and) desk.hidden = false;
})();
