const btnSambung  = document.getElementById("btnSambung");
const statusDrive = document.getElementById("statusDrive");

btnSambung.onclick = () => {
  statusDrive.textContent = "Menyambungkan…";
  sambungDrive(async () => {
    const email = await emailSaya();
    if (!CONFIG.emailDiizinkan.map(e => e.toLowerCase()).includes(email)) {
      statusDrive.textContent = "Akun ini bukan milik kita berdua 🥺"; return;
    }
    btnSambung.hidden = true;
    statusDrive.textContent = "Tersambung! Folder Drive kita sudah siap. 🤍";
    document.getElementById("panelUpload").hidden = false;
    muatMomen();
  });
};

async function muatMomen() {
  const wrap = document.getElementById("liniMasa");
  wrap.innerHTML = "<p class='muted'>Mengambil kenangan kita…</p>";
  try {
    const folderId = await dapatkanFolder();
    renderMomen(await daftarMomen(folderId), wrap);
  } catch (e) {
    wrap.innerHTML = "";
    statusDrive.textContent = "Yah, ada kesalahan: " + e.message;
  }
}

function renderMomen(list, wrap) {
  wrap.innerHTML = "";
  if (!list.length) { wrap.innerHTML = "<p class='muted'>Belum ada momen. Yuk simpan yang pertama! ❤️</p>"; return; }
  for (const m of list) {
    const waktu = m.meta.waktu ? new Date(m.meta.waktu) : new Date(m.createdTime);
    const tgl = new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(waktu);
    let media = "";
    if (m.mimeType.startsWith("image/")) {
      media = `<img loading="lazy" src="https://drive.google.com/thumbnail?id=${m.id}&sz=w1200" alt="">`;
    } else if (m.mimeType.startsWith("video/")) {
      media = `<button class="btn btn-ghost putar-video" data-id="${m.id}">▶ Putar video</button>`;
    }
    const card = document.createElement("article");
    card.className = "momen-card";
    card.innerHTML = `
      ${media}
      ${m.mimeType.includes("text") ? `<p class="momen-cerita">${esc(m.meta.caption || "")}</p>`
        : (m.meta.caption ? `<p class="momen-caption">“${esc(m.meta.caption)}”</p>` : "")}
      <p class="momen-meta">🤍 ${esc(m.meta.oleh || "")} • ${tgl}</p>`;
    wrap.appendChild(card);
  }
  wrap.querySelectorAll(".putar-video").forEach(b => {
    b.onclick = () => {
      const f = document.createElement("iframe");
      f.src = `https://drive.google.com/file/d/${b.dataset.id}/preview`;
      f.allow = "autoplay"; f.className = "momen-video";
      b.replaceWith(f);
    };
  });
}

document.getElementById("formMomen").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileMomen");
  const caption   = document.getElementById("caption").value.trim();
  const status    = document.getElementById("statusUpload");
  if (!fileInput.files.length && !caption) { status.textContent = "Isi foto/video atau cerita dulu ya 🥺"; return; }
  status.textContent = "Mengupload… kenangan kita sedang berjalan ke Drive 🌊";
  try {
    const adaFile = fileInput.files.length > 0;
    const file = adaFile ? fileInput.files[0] : new Blob([caption], { type: "text/plain" });
    const nama = adaFile ? fileInput.files[0].name : `Cerita — ${new Date().toISOString()}.txt`;
    await uploadMomen(file, caption, nama);
    status.textContent = "Tersimpan! ❤️";
    e.target.reset();
    muatMomen();
  } catch (err) {
    status.textContent = "Gagal upload: " + err.message;
  }
});