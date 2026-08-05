/* ===== JAM GANDA — otomatis akurat selamanya ===== */
function formatJam(now, tz) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(now);
}
function formatTanggal(now, tz) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(now);
}
function tick() {
  const now = new Date();
  const peta = { jamAceh: CONFIG.zonaWaktu.aceh, jamSulawesi: CONFIG.zonaWaktu.sulawesi };
  for (const [id, tz] of Object.entries(peta)) {
    const elJam = document.getElementById(id);
    const elTgl = document.getElementById(id + "Tgl");
    if (elJam) elJam.textContent = formatJam(now, tz);
    if (elTgl) elTgl.textContent = formatTanggal(now, tz);
  }
}
tick();
setInterval(tick, 1000);

// Hitung hari bersama sejak 31 Juli 2026
const elHari = document.getElementById("hitungHari");
if (elHari) {
  const jadian = new Date(CONFIG.tanggalJadian + "T00:00:00");
  const selisih = Math.floor((Date.now() - jadian.getTime()) / 86400000);
  elHari.textContent = selisih >= 0
    ? `Hari ke-${selisih + 1} kita bersama ❤️`
    : `${-selisih} hari lagi menuju hari jadian 🤍`;
}