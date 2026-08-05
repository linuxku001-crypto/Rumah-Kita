/* ===== Sambungan Google Drive — Client ID sama dengan login ===== */
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
let tokenDrive = null;

function tungguGS(cb, coba = 0) {
  if (window.google && google.accounts) return cb();
  if (coba < 50) setTimeout(() => tungguGS(cb, coba + 1), 200);
}

function sambungDrive(setelahSiap) {
  tungguGS(() => {
    const tc = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,   // ← Client ID yang sama
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) { alert("Gagal terhubung: " + resp.error); return; }
        tokenDrive = resp.access_token;
        setelahSiap();
      }
    });
    tc.requestAccessToken();
  });
}

async function emailSaya() {
  const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: "Bearer " + tokenDrive }
  });
  return ((await r.json()).email || "").toLowerCase();
}

async function apiDrive(url, opsi = {}) {
  const res = await fetch("https://www.googleapis.com/drive/v3/" + url, {
    ...opi,
    headers: { Authorization: "Bearer " + tokenDrive, ...(opi.headers || {}) }
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 200));
  return res.json();
}

// Cari folder "Momen Kita 🤍". Kalau belum ada & yang login Sahrul → buat + auto-share ke Dara.
async function dapatkanFolder() {
  const q = encodeURIComponent(`name='${CONFIG.driveFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const data = await apiDrive(`files?q=${q}&fields=files(id,name)`);
  if (data.files.length) return data.files[0].id;

  const saya = await emailSaya();
  if (saya !== CONFIG.emailDiizinkan[0].toLowerCase()) {
    throw new Error("Folder belum ada. Sahrul harus buka halaman Momen & sambung Drive lebih dulu ya 🥺");
  }
  const buat = await apiDrive("files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: CONFIG.driveFolderName, mimeType: "application/vnd.google-apps.folder" })
  });
  const pasangan = CONFIG.emailDiizinkan.find(e => e.toLowerCase() !== saya && !e.startsWith("GANTI_"));
  if (pasangan) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${buat.id}/permissions`, {
      method: "POST",
      headers: { Authorization: "Bearer " + tokenDrive, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "writer", type: "user", emailAddress: pasangan })
    });
  }
  return buat.id;
}

// Upload foto/video/cerita + caption, lengkap mendukung file besar (resumable)
async function uploadMomen(file, caption, namaFile) {
  const folderId = await dapatkanFolder();
  const oleh = await emailSaya();
  const metadata = {
    name: namaFile,
    parents: [folderId],
    description: JSON.stringify({ caption, oleh, waktu: new Date().toISOString() })
  };
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: { Authorization: "Bearer " + tokenDrive, "Content-Type": "application/json" },
    body: JSON.stringify(metadata)
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 200));
  const lokasi = res.headers.get("Location");
  const put = await fetch(lokasi, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!put.ok) throw new Error((await put.text()).slice(0, 200));
  const hasil = await put.json();
  // biar bisa ditampilkan di website kita
  await fetch(`https://www.googleapis.com/drive/v3/files/${hasil.id}/permissions`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tokenDrive, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" })
  });
  return hasil.id;
}

// Ambil semua momen, urut dari yang TERBARU (cara lihat momen sebelumnya: tinggal scroll ⬇)
async function daftarMomen(folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const data = await apiDrive(`files?q=${q}&orderBy=createdTime desc&pageSize=1000&fields=files(id,name,mimeType,description,createdTime)`);
  return data.files.map(f => {
    let meta = {}; try { meta = JSON.parse(f.description || "{}"); } catch {}
    return { ...f, meta };
  });
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}