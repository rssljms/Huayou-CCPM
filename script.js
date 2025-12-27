document.addEventListener("DOMContentLoaded", () => {

/* ================= DOM REFERENCES ================= */
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const login = document.getElementById("login");
  const dashboard = document.getElementById("dashboard");

  const logoutBtn = document.getElementById("logoutBtn");
  const projectSelect = document.getElementById("projectSelect");
  const addProjectBtn = document.getElementById("addProjectBtn");
  const archiveProjectBtn = document.getElementById("archiveProjectBtn");
  const deleteProjectBtn = document.getElementById("deleteProjectBtn");

  const deliveryBtn = document.getElementById("deliveryBtn");
  const pullOutBtn = document.getElementById("pullOutBtn");
  const areaBtn = document.getElementById("areaBtn");
  const inventoryBtn = document.getElementById("inventoryBtn");

  const summarySearch = document.getElementById("summarySearch");
  const summaryTable = document.getElementById("summaryTable");

  const deliverySearch = document.getElementById("deliverySearch");
  const deliveryRemarksFilter = document.getElementById("deliveryRemarksFilter");
  const deliveryTable = document.getElementById("deliveryTable");

  const pullOutTable = document.getElementById("pullOutTable");
  const inventoryTable = document.getElementById("inventoryTable");
  const areaTable = document.getElementById("areaTable");

  const date = document.getElementById("date");
  const code = document.getElementById("code");
  const material = document.getElementById("material");
  const unitPrice = document.getElementById("unitPrice");
  const quantity = document.getElementById("quantity");
  const unit = document.getElementById("unit");
  const totalAmount = document.getElementById("totalAmount");
  const supplier = document.getElementById("supplier");
  const remarks = document.getElementById("remarks");
  const saveDeliveryBtn = document.getElementById("saveDeliveryBtn");

  const deliverySelect = document.getElementById("deliverySelect");
  const pullOutForm = document.getElementById("pullOutForm");
  const pullDate = document.getElementById("pullDate");
  const pullCode = document.getElementById("pullCode");
  const pullQuantity = document.getElementById("pullQuantity");
  const pullArea = document.getElementById("pullArea");
  const pullRequester = document.getElementById("pullRequester");

  const areaFilter = document.getElementById("areaFilter");
  const inventorySearch = document.getElementById("inventorySearch");

  const renameProjectBtn = document.getElementById("renameProjectBtn");

/* ================= PROJECT STORAGE ================= */
const PROJECTS_KEY = 'projects';
let currentProjectId = null;
let currentRole = null;
let editDeliveryId = null;

if (!localStorage.getItem(PROJECTS_KEY)) localStorage.setItem(PROJECTS_KEY, JSON.stringify({}));
const getProjects = () => JSON.parse(localStorage.getItem(PROJECTS_KEY));
const setProjects = d => localStorage.setItem(PROJECTS_KEY, JSON.stringify(d));
function getProject() { return getProjects()[currentProjectId]; }
function saveProject(p) { const all = getProjects(); all[currentProjectId] = p; setProjects(all); }

/* ================= LOGIN ================= */
loginForm.onsubmit = e => {
  e.preventDefault();
  loginError.classList.add('hidden');

  if (username.value === 'admin' && password.value === '1234') currentRole = 'admin';
  else if (username.value === 'viewer' && password.value === '1234') currentRole = 'viewer';
  else { loginError.classList.remove('hidden'); return; }

login.style.display = 'block';
document.body.classList.remove('login-page');
document.body.classList.add('app-page');

login.style.display = 'none';
dashboard.classList.remove('hidden');

  loadProjects();
};
logoutBtn.onclick = () => {
  currentRole = null;
  currentProjectId = null;
  editDeliveryId = null;

  ['dashboard','delivery','pullOut','area','inventory']
    .forEach(id => document.getElementById(id).classList.add('hidden'));

  loginForm.reset();
  loginError.style.display = 'none';
  login.style.display = 'block';
  document.body.classList.add('login-page');
};
renameProjectBtn.onclick = () => {
  if (!currentProjectId) return alert('Select a project');

  const projects = getProjects();
  const project = projects[currentProjectId];

  const newName = prompt('New project name:', project.name);
  if (!newName) return;

  project.name = newName.trim();
  setProjects(projects);

  loadProjects();
  projectSelect.value = currentProjectId;
};
let showingArchived = false;

/* ================= PROJECT UI ================= */
function loadProjects() {
  const projects=getProjects();
  projectSelect.innerHTML='<option value="">Select Project</option>';
  Object.entries(projects).forEach(([id,p])=>{
    if(!p.archived) projectSelect.innerHTML+=`<option value="${id}">${p.name}</option>`;
  });
}

projectSelect.onchange=()=>{ currentProjectId=projectSelect.value; if(currentProjectId) loadAll(); }

addProjectBtn.onclick=()=>{
  const name=prompt('Project name'); if(!name) return;
  const projects=getProjects(); const id=Date.now().toString();
  projects[id]={name,archived:false,materials:[],deliveries:[],pullOuts:[]};
  setProjects(projects); loadProjects();
};

archiveProjectBtn.onclick=()=>{
  if(!currentProjectId) return alert('Select a project');
  const projects=getProjects();
  projects[currentProjectId].archived=!projects[currentProjectId].archived;
  setProjects(projects); currentProjectId=null; loadProjects();
};

deleteProjectBtn.onclick=()=>{
  if(!currentProjectId) return alert('Select a project');
  if(!confirm('This will permanently delete the project. Continue?')) return;
  const projects=getProjects(); delete projects[currentProjectId];
  setProjects(projects); currentProjectId=null; loadProjects();
};

/* ================= NAV ================= */
function showSection(id){
  const sections = ['dashboard','delivery','pullOut','area','inventory'];

  sections.forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.classList.add('hidden');
  });

  // 🔥 Dashboard is ALWAYS allowed
  if (id === 'dashboard') {
    dashboard.classList.remove('hidden');
    return;
  }

  // Other sections REQUIRE project
  if (!currentProjectId) {
    alert('Select a project first');
    dashboard.classList.remove('hidden');
    return;
  }

  document.getElementById(id).classList.remove('hidden');
}

deliveryBtn.onclick=()=>{ showSection('delivery'); loadDeliveryTable(); };
pullOutBtn.onclick=()=>{ showSection('pullOut'); loadMaterialsForPullOut(); loadPullOutList(); };
areaBtn.onclick=()=>{ showSection('area'); loadAreaUsage(); };
inventoryBtn.onclick=()=>{ showSection('inventory'); loadInventory(); };

/* ================= DELIVERY ================= */
unitPrice.oninput = quantity.oninput =
()=> totalAmount.value = (unitPrice.value*quantity.value||0);

deliverySearch.oninput=deliveryRemarksFilter.onchange=loadDeliveryTable;

saveDeliveryBtn.onclick = () => {
  if (currentRole !== 'admin') return;

  const p = getProject();

  let mat = p.materials.find(m => m.name === material.value);
  if (!mat) {
    mat = { id: Date.now(), name: material.value };
    p.materials.push(mat);

  }

  const obj = {
    id: editDeliveryId || Date.now(),
    date: date.value,
    code: code.value,
    materialId: mat.id,
    unitPrice: +unitPrice.value,
    quantity: +quantity.value,
    unit: unit.value,
    totalAmount: +totalAmount.value,
    supplier: supplier.value,
    remarks: remarks.value
  };

  if (editDeliveryId) {
    const i = p.deliveries.findIndex(d => d.id === editDeliveryId);
    p.deliveries[i] = obj;
  } else {
    p.deliveries.push(obj);
  }

  editDeliveryId = null;
  saveProject(p);
loadAll();

/* RESET FORM */
date.value = '';
code.value = '';
material.value = '';
unitPrice.value = '';
quantity.value = '';
unit.value = '';
totalAmount.value = '';
supplier.value = '';
remarks.value = '';

/* 🔥 FORCE BACK TO DASHBOARD */
showSection('dashboard');
};

function loadDeliveryTable(){
  const p=getProject();
  const tb=deliveryTable.querySelector('tbody');
  const search=deliverySearch.value.toLowerCase();
  const filter=deliveryRemarksFilter.value;
  tb.innerHTML='';

  p.deliveries.forEach(d=>{
    const m=p.materials.find(x=>x.id===d.materialId);
    const text=`${d.date} ${d.code} ${m?.name} ${d.supplier} ${d.remarks}`.toLowerCase();
    if(search && !text.includes(search)) return;
    if(filter && d.remarks!==filter) return;

    tb.innerHTML+=`<tr>
<td>${d.date}</td><td>${d.code}</td><td>${m?.name||''}</td>
<td>${d.unitPrice}</td><td>${d.quantity}</td><td>${d.unit}</td>
<td>${d.totalAmount.toFixed(2)}</td><td>${d.supplier}</td><td>${d.remarks}</td>
<td class="no-print">${currentRole==='admin'?`
<button onclick="editDelivery(${d.id})">Edit</button>
<button onclick="deleteDelivery(${d.id})">Del</button>`:''}</td>
</tr>`;
  });
}

function editDelivery(id){
  const p=getProject();
  const d=p.deliveries.find(x=>x.id===id);
  const m=p.materials.find(x=>x.id===d.materialId);
  editDeliveryId=id;
  date.value=d.date; code.value=d.code; material.value=m.name;
  unitPrice.value=d.unitPrice; quantity.value=d.quantity;
  unit.value=d.unit; totalAmount.value=d.totalAmount;
  supplier.value=d.supplier; remarks.value=d.remarks;
}

function deleteDelivery(id){
  if(currentRole!=='admin'||!confirm('Delete delivery?')) return;
  const p=getProject();
  p.deliveries=p.deliveries.filter(d=>d.id!==id);
  saveProject(p); loadAll();
}

/* ================= PULL OUT ================= */
function loadMaterialsForPullOut(){
  const p=getProject();
  deliverySelect.innerHTML='<option value="">Select</option>';

  p.materials.forEach(m=>{
    const del=p.deliveries.filter(d=>d.materialId===m.id).reduce((s,d)=>s+d.quantity,0);
    const pul=p.pullOuts.filter(x=>x.materialId===m.id).reduce((s,x)=>s+x.quantity,0);
    if(del-pul>0) deliverySelect.innerHTML+=`<option value="${m.id}">${m.name} (${del-pul})</option>`;
  });
}

deliverySelect.onchange=()=>pullOutForm.classList.toggle('hidden',!deliverySelect.value);


pullOutForm.onsubmit=e=>{
  e.preventDefault();
  if(currentRole!=='admin') return;
  const p=getProject();
  const obj = {
  id: editPullOutId || Date.now(),
  date: pullDate.value,
  pullCode: pullCode.value,
  materialId: +deliverySelect.value,
  quantity: +pullQuantity.value,
  area: pullArea.value,
  requester: pullRequester.value
};

if (editPullOutId) {
  const i = p.pullOuts.findIndex(x => x.id === editPullOutId);
  p.pullOuts[i] = obj;
} else {
  p.pullOuts.push(obj);
}

editPullOutId = null;

  saveProject(p);
  pullOutForm.reset();
  pullOutForm.classList.add('hidden');
  loadAll();
};

function loadPullOutList(){
  const p=getProject();
  const tb=pullOutTable.querySelector('tbody');
  tb.innerHTML='';
  p.pullOuts.forEach(x=>{
    const m=p.materials.find(a=>a.id===x.materialId);
    tb.innerHTML+=`<tr>
<td>${x.date}</td><td>${x.pullCode}</td><td>${m?.name||''}</td>
<td>${x.quantity}</td><td>${x.area}</td><td>${x.requester}</td>
<td class="no-print">${currentRole==='admin'?`
<button onclick="editPullOut(${x.id})">Edit</button>
<button onclick="deletePull(${x.id})">Del</button>`:''}</td>
</tr>`;
  });
}

let editPullOutId = null;

function deletePull(id){
  if (currentRole !== 'admin' || !confirm('Delete pull out?')) return;

  const p = getProject();
  p.pullOuts = p.pullOuts.filter(x => x.id !== id);
  saveProject(p);
  loadAll();
}

function editPullOut(id){
  const p = getProject();
  const x = p.pullOuts.find(po => po.id === id);
  if (!x) return;

  editPullOutId = id;

  pullDate.value = x.date;
  pullCode.value = x.pullCode;
  deliverySelect.value = x.materialId;
  pullQuantity.value = x.quantity;
  pullArea.value = x.area;
  pullRequester.value = x.requester;

  pullOutForm.classList.remove('hidden');
}

/* ================= AREA ================= */
areaFilter.onchange=loadAreaUsage;
function loadAreaUsage(){
  const p=getProject();
  const tb=areaTable.querySelector('tbody');
  const sel=areaFilter.value;

  areaFilter.innerHTML='<option value="">All</option>';
  [...new Set(p.pullOuts.map(x=>x.area))]
    .forEach(a=>areaFilter.innerHTML+=`<option ${a===sel?'selected':''}>${a}</option>`);

  tb.innerHTML='';
  p.pullOuts.forEach(x=>{
    if(sel && x.area!==sel) return;
    const m=p.materials.find(a=>a.id===x.materialId);
    tb.innerHTML+=`<tr><td>${x.area}</td><td>${m?.name||''}</td><td>${x.quantity}</td></tr>`;
  });
}

/* ================= INVENTORY ================= */
inventorySearch.oninput=loadInventory;
function loadInventory(){
  const p=getProject();
  const tb=inventoryTable.querySelector('tbody');
  const s=inventorySearch.value.toLowerCase();
  tb.innerHTML='';

  p.materials.forEach(m=>{
    if(s && !m.name.toLowerCase().includes(s)) return;
    const del=p.deliveries.filter(d=>d.materialId===m.id).reduce((s,d)=>s+d.quantity,0);
    const pul=p.pullOuts.filter(x=>x.materialId===m.id).reduce((s,x)=>s+x.quantity,0);
    tb.innerHTML+=`<tr>
<td>${m.name}</td><td>${del-pul}</td>
<td class="no-print">${currentRole==='admin'?`
<button onclick="deleteMaterial(${m.id})">Del</button>`:''}</td>
</tr>`;
  });
}

function deleteMaterial(id){
  if(currentRole!=='admin'||!confirm('Delete material?')) return;
  const p=getProject();
  p.materials=p.materials.filter(m=>m.id!==id);
  p.deliveries=p.deliveries.filter(d=>d.materialId!==id);
  p.pullOuts=p.pullOuts.filter(x=>x.materialId!==id);
  saveProject(p); loadAll();
}

/* ================= SUMMARY ================= */
summarySearch.oninput=loadSummary;
function loadSummary(){
  const p=getProject();
  const tb=summaryTable.querySelector('tbody');
  const s=summarySearch.value.toLowerCase();
  tb.innerHTML='';

  p.materials.forEach((m,i)=>{
    if(s && !m.name.toLowerCase().includes(s)) return;
    const del=p.deliveries.filter(d=>d.materialId===m.id).reduce((s,d)=>s+d.quantity,0);
    const pul=p.pullOuts.filter(x=>x.materialId===m.id).reduce((s,x)=>s+x.quantity,0);
    const cost=p.deliveries.filter(d=>d.materialId===m.id).reduce((s,d)=>s+d.totalAmount,0);
    tb.innerHTML+=`<tr>
<td>${i+1}</td><td>${m.name}</td>
<td>${del}</td><td>${cost.toFixed(2)}</td>
<td>${pul}</td><td>${del-pul}</td>
</tr>`;
  });
}

/* ================= LOAD ================= */
function loadAll(){
  if(!currentProjectId) return;
  loadSummary();
  loadDeliveryTable();
  loadPullOutList();
  loadInventory();
  loadAreaUsage();
}

function printSection(tableId, titleText = '') {
  const table = document.getElementById(tableId).cloneNode(true);

  // Remove buttons / actions
  table.querySelectorAll('.no-print').forEach(el => el.remove());

  const style = `
  <style>
    @page {
      margin: 0;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }

    .print-header img {
      width: 100%;
      display: block;
      margin: 0;
    }

    .print-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 12px 0 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      border: 1px solid #000;
      padding: 6px;
      font-size: 12px;
    }

    th {
      background: #f2f2f2;
    }
  </style>
  `;

  const w = window.open('', '', 'width=1000,height=700');

  w.document.write(`
    <html>
      <head>
        <title>${titleText}</title>
        ${style}
      </head>
      <body>
        <div class="print-header">
          <img src="./images/header.png">
        </div>

        ${titleText ? `<div class="print-title">${titleText}</div>` : ''}

        ${table.outerHTML}
      </body>
    </html>
  `);

  w.document.close();
  w.focus();
  w.print();
}

/* expose for inline buttons */
window.editDelivery=editDelivery;
window.deleteDelivery=deleteDelivery;
window.deletePull=deletePull;
window.deleteMaterial=deleteMaterial;
window.showSection = showSection;
window.printSection = printSection;
window.editPullOut = editPullOut; 
});
