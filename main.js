// --- GLOBALNE SPREMENLJIVKE ---
// Tu hranimo trenutno stanje (bodisi iz datoteke bodisi iz spomina telefona)
let seznamStrojev = [];
let seznamStrojnikov = {};

// --- 1. ZAGON APLIKACIJE ---
window.onload = function() {
  naloziPodatke();
  posodobiUI();
  
  // Preveri, če je admin že prijavljen (da se panel ohrani po osvežitvi)
  if (sessionStorage.getItem("adminLogged") === "true") {
    document.getElementById("adminPanel").style.display = "block";
    prikaziDeleteGumbe(true);
  }
};

// --- 2. LOGIKA PODATKOV ---
function naloziPodatke() {
  // Najprej preverimo LocalStorage (če je admin na tem telefonu kaj spreminjal)
  const shranjeniStroji = localStorage.getItem("mojiStroji");
  const shranjeniStrojniki = localStorage.getItem("mojiStrojniki");

  // Naloži stroje
  if (shranjeniStroji) {
    seznamStrojev = JSON.parse(shranjeniStroji);
  } else if (typeof stroji !== 'undefined') {
    seznamStrojev = [...stroji]; // Kopija iz originalne datoteke bazaStrojev.js
  }

  // Naloži strojnike
  if (shranjeniStrojniki) {
    seznamStrojnikov = JSON.parse(shranjeniStrojniki);
  } else if (typeof strojniki !== 'undefined') {
    seznamStrojnikov = {...strojniki}; // Kopija iz originalne datoteke bazaStrojnikov.js
  }
}

function posodobiUI() {
  const strojSel = document.getElementById("stroj");
  const strojnikSel = document.getElementById("strojnik");
  
  // Shrani trenutno izbiro, da je ne izgubimo ob osvežitvi seznama
  const currentStroj = strojSel.value;
  const currentStrojnik = strojnikSel.value;

  // --- POLNJENJE STROJEV ---
  strojSel.innerHTML = '<option value="" disabled selected>Izberi stroj...</option>';
  seznamStrojev.forEach(s => {
    const o = document.createElement("option");
    // Če je ročno dodan, morda nima vseh polj (vrsta, proizvajalec), zato prilagodimo izpis
    const tekst = s.vrsta ? `${s.inventar} – ${s.vrsta} ${s.proizvajalec}` : `${s.inventar} – ${s.tip}`;
    // Value vsebuje inventarno in tip/vrsto
    o.value = `${s.inventar} (${s.vrsta || s.tip})`; 
    o.textContent = tekst;
    strojSel.appendChild(o);
  });

  // --- POLNJENJE STROJNIKOV ---
  strojnikSel.innerHTML = '<option value="" disabled selected>Izberi strojnika...</option>';
  // Sortiramo po ID-ju (tretiramo kot številke)
  const urejeniID = Object.keys(seznamStrojnikov).sort((a,b) => parseInt(a) - parseInt(b));
  
  urejeniID.forEach(id => {
    const ime = seznamStrojnikov[id];
    const o = document.createElement("option");
    o.value = `${id} - ${ime}`; 
    o.dataset.id = id;          
    o.textContent = `${id} – ${ime}`;
    strojnikSel.appendChild(o);
  });

  // Obnovi izbiro, če ta vrednost še obstaja v novem seznamu
  if(currentStroj) strojSel.value = currentStroj;
  if(currentStrojnik) strojnikSel.value = currentStrojnik;
}

function shraniVLocalStorage() {
  // Shrani spremembe v brskalnik
  localStorage.setItem("mojiStroji", JSON.stringify(seznamStrojev));
  localStorage.setItem("mojiStrojniki", JSON.stringify(seznamStrojnikov));
  // Takoj osveži prikaz v menijih
  posodobiUI();
}

// --- 3. ADMIN FUNKCIJE ---
function adminLogin() {
  const geslo = prompt("Vpiši geslo administratorja:");
  if (geslo === "admin") { // TUKAJ LAHKO SPREMENIŠ GESLO
    sessionStorage.setItem("adminLogged", "true");
    document.getElementById("adminPanel").style.display = "block";
    prikaziDeleteGumbe(true);
    alert("Uspešna prijava! Zdaj lahko urejaš bazo.");
  } else if (geslo !== null) {
    alert("Napačno geslo.");
  }
}

function adminLogout() {
  sessionStorage.removeItem("adminLogged");
  document.getElementById("adminPanel").style.display = "none";
  prikaziDeleteGumbe(false);
  location.reload(); // Osveži stran, da se pobrišejo morebitni admin vnosi
}

function prikaziDeleteGumbe(show) {
  const display = show ? "block" : "none";
  const btnStroj = document.getElementById("delStrojBtn");
  const btnStrojnik = document.getElementById("delStrojnikBtn");
  
  if(btnStroj) btnStroj.style.display = display;
  if(btnStrojnik) btnStrojnik.style.display = display;
}

// --- DODAJANJE ---
function dodajStroj() {
  const inv = document.getElementById("novStrojInv").value.trim();
  const tip = document.getElementById("novStrojTip").value.trim();
  
  if (!inv || !tip) { alert("Izpolni obe polji!"); return; }
  
  // Dodamo nov objekt v seznam
  seznamStrojev.push({ inventar: inv, tip: tip, vrsta: "", proizvajalec: "" });
  shraniVLocalStorage();
  
  // Počisti polja
  document.getElementById("novStrojInv").value = "";
  document.getElementById("novStrojTip").value = "";
  alert("Stroj uspešno dodan!");
}

function dodajStrojnika() {
  const ime = document.getElementById("novStrojnikIme").value.trim().toUpperCase();
  if (!ime) { alert("Vpiši ime!"); return; }
  
  // Najdi naslednji prosti ID (najvišji ID + 1)
  const ids = Object.keys(seznamStrojnikov).map(x => parseInt(x));
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  
  seznamStrojnikov[newId] = ime;
  shraniVLocalStorage();
  
  document.getElementById("novStrojnikIme").value = "";
  alert(`Dodan strojnik ID ${newId}: ${ime}`);
}

// --- BRISANJE ---
function brisiIzbranStroj() {
  const sel = document.getElementById("stroj");
  if (sel.selectedIndex <= 0) { alert("Najprej izberi stroj v meniju!"); return; }
  
  if(confirm("Ali res želiš izbrisati izbran stroj iz seznama?")) {
    const selectedText = sel.options[sel.selectedIndex].text;
    
    // Poišči index elementa, ki vsebuje inventarno številko
    // Ker je value sestavljen string, iščemo po vsebini
    const index = seznamStrojev.findIndex(s => selectedText.includes(s.inventar));
    
    if (index > -1) {
      seznamStrojev.splice(index, 1); // Odstrani iz seznama
      shraniVLocalStorage();
      sel.value = ""; // Ponastavi izbiro
    } else {
      alert("Napaka pri iskanju stroja.");
    }
  }
}

function brisiIzbranStrojnik() {
  const sel = document.getElementById("strojnik");
  if (sel.selectedIndex <= 0) { alert("Najprej izberi strojnika v meniju!"); return; }
  
  if(confirm("Ali res želiš izbrisati izbranega strojnika?")) {
    const opt = sel.options[sel.selectedIndex];
    const id = opt.dataset.id;
    
    if (id) {
      delete seznamStrojnikov[id]; // Odstrani iz objekta
      shraniVLocalStorage();
      sel.value = ""; // Ponastavi izbiro
    }
  }
}

function checkSelection() {
    // Ta funkcija se kliče ob spremembi selecta.
    // Trenutno ne rabimo posebne logike, je pa tu za prihodnje razširitve.
}

// --- IZVOZ PODATKOV (Za posodobitev GitHub-a) ---
function izvoziPodatke() {
  const strojiJson = JSON.stringify(seznamStrojev);
  const strojnikiJson = JSON.stringify(seznamStrojnikov);
  
  const output = 
`// Kopiraj to celotno kodo v bazaStrojev.js:
const stroji = ${strojiJson};

// ----------------------------------------

// Kopiraj to celotno kodo v bazaStrojnikov.js:
const strojniki = ${strojnikiJson};`;

  const area = document.getElementById("exportArea");
  area.style.display = "block";
  area.value = output;
  area.select();
  document.execCommand("copy");
  alert("Koda kopirana! \n\n1. Pošlji si jo na e-mail. \n2. Na računalniku odpri GitHub. \n3. Posodobi datoteki bazaStrojev.js in bazaStrojnikov.js, da bodo spremembe videli vsi delavci.");
}

// --- 4. LOGIKA SLIKE IN POŠILJANJE (Standardno) ---
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const fileNameSpan = document.getElementById("fileName");

if(fileInput) {
    fileInput.addEventListener("change", function() {
        if (this.files && this.files.length > 0) {
            fileNameSpan.textContent = "📷 " + this.files[0].name;
            filePreview.style.display = "flex";
        }
    });
}

function removeImage() {
    if(fileInput) fileInput.value = ""; 
    if(filePreview) filePreview.style.display = "none";
}

const form = document.getElementById("reportForm");
const submitBtn = document.getElementById("submitBtn");

if(form) {
    form.addEventListener("submit", function(e) {
      // Tukaj NE uporabimo e.preventDefault(), ker želimo, da FormSubmit opravi svoje.
      // Samo pripravimo podatke (Subject line).
      
      const strojInput = document.getElementById("stroj");
      const strojVal = strojInput.value.split(' ')[0] || "Neznano";
      
      const selS = document.getElementById("strojnik");
      const strojnikOption = selS.options[selS.selectedIndex];
      const strojnikVal = strojnikOption ? (strojnikOption.dataset.id || "Neznano") : "Neznano";
      
      const vrstaEl = document.querySelector('input[name="Vrsta_okvare"]:checked');
      const vrstaVal = vrstaEl ? vrstaEl.value : "Drugo";

      const vplivEl = document.querySelector('input[name="Vpliv_delovanja"]:checked');
      // Vpliv ni v subjectu, ampak se pošlje avtomatsko kot del forme v body-ju maila.

      document.getElementById("emailSubject").value = `Stroj - "${strojVal}"; Strojnik - "${strojnikVal}"; Vrsta okvare - "${vrstaVal}"`;

      submitBtn.innerText = "Pošljanje... Počakajte.";
      // FormSubmit bo zdaj poslal podatke in preusmeril uporabnika.
    });
}