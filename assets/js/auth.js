/* ===== LOGIN 2 CARA: kata kunci + Google ===== */

// ---------- 1) LOGIN PAKAI KATA KUNCI ----------
const formPassword = document.getElementById("formPassword");
formPassword.addEventListener("submit", (e) => {
  e.preventDefault();
  const isi = document.getElementById("password").value.trim().toLowerCase();
  if (isi === CONFIG.password.toLowerCase()) {
    suksesLogin("kata-kunci");
  } else {
    document.getElementById("pesanSalah").hidden = false;
  }
});

function suksesLogin(cara) {
  localStorage.setItem("sd_login", JSON.stringify({ cara, waktu: Date.now() }));
  window.location.href = "home.html";
}

// ---------- 2) LOGIN PAKAI GOOGLE (hanya email kalian berdua) ----------
function tungguGoogle(cb, coba = 0) {
  if (window.google && google.accounts) return cb();
  if (coba < 50) setTimeout(() => tungguGoogle(cb, coba + 1), 200);
}

tungguGoogle(() => {
  google.accounts.id.initialize({
    client_id: CONFIG.googleClientId,
    callback: (resp) => {
      try {
        const payload = JSON.parse(
          atob(resp.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        const email = (payload.email || "").toLowerCase();
        if (CONFIG.emailDiizinkan.map(e => e.toLowerCase()).includes(email)) {
          suksesLogin("google:" + email);
        } else {
          alert("Maaf ya, akun ini bukan milik kita berdua 🥺");
        }
      } catch {
        alert("Gagal membaca akun Google, coba lagi ya.");
      }
    }
  });
  google.accounts.id.renderButton(document.getElementById("gButton"), {
    theme: "filled_black", size: "large", shape: "pill", text: "continue_with", width: 260
  });
});