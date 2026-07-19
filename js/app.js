'use strict';

/* =============================================
   APP STATE
   ============================================= */
const state = {
  activeTab: 'command-center',
  cityView: 'city',
  citySort: { col: 'orders', dir: 'desc' },
  cityPage: 1,
  cityPageSize: 10,
  slaPage: 1,
  slaPageSize: 10,
  codPage: 1,
  codPageSize: 10,
  driverCodPage: 1,
  driverCodPageSize: 10,
  driverCompPage: 1,
  driverCompPageSize: 10,
  autoRefresh: false,
  autoRefreshTimer: null,
  alertsDismissed: [],
  lastRefreshed: new Date(),
  activeKPI: null,
  activeState: 'All Orders',
  cityFilter: '',
  carrierFilter: '',
  healthFilter: '',
  analyticsGrouping: 'city'
};

/* =============================================
   TABS CONFIGURATION
   ============================================= */
const TABS = [
  {
    id: 'command-center',
    label: 'Command Center',
    sections: ['healthSection','orderStatesSection','citySection','slaSection','codSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
  },
  {
    id: 'sla-monitor',
    label: 'SLA & Monitor',
    sections: ['slaSection', 'driverComplianceSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1v9M5 7l3 3 3-3M2 13h12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'cod-tracker',
    label: 'COD Tracker',
    sections: ['codAnalyticsSection', 'codSection', 'driverCodSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M6 6h4M6 8.5h2.5M8.5 8.5v3" stroke-linecap="round"/></svg>`,
  }
];

const ALL_SECTIONS = ['healthSection','orderStatesSection','citySection','slaSection','codSection','codAnalyticsSection','driverCodSection','driverComplianceSection'];

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  switchTab(state.activeTab);
  renderAlertBanners();
  renderHealthKPIs();
  renderOrderStates();
  renderHealthKPIs();
  renderOrderStates();
  renderCityTable();
  renderSLATable();
  renderCODAnalytics();
  renderCODTable();
  renderDriverCODTable();
  renderDriverComplianceTable();
  updateLastRefreshed();
  setupFilters();
  setupTableSorts();
  // Set initial sort indicator
  const th = document.querySelector('#cityTable [data-sort="orders"]');
  if (th) th.classList.add('sort-desc');
  // Tick clock
  setInterval(updateLastRefreshed, 60000);
});

/* =============================================
   TABS
   ============================================= */
function renderTabs() {
  const bar = document.getElementById('tabBar');
  bar.innerHTML = TABS.map(t => `
    <button class="tab-item ${t.id === state.activeTab ? 'active' : ''}"
            onclick="switchTab('${t.id}')"
            id="tab-${t.id}"
            role="tab"
            aria-selected="${t.id === state.activeTab}">
      ${t.icon}
      ${t.label}
    </button>
  `).join('');
}

function switchTab(id) {
  const tab = TABS.find(t => t.id === id);
  if (!tab) return;
  state.activeTab = id;

  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.remove('active');
    el.setAttribute('aria-selected', 'false');
  });
  const tabEl = document.getElementById('tab-' + id);
  if (tabEl) { tabEl.classList.add('active'); tabEl.setAttribute('aria-selected', 'true'); }

  ALL_SECTIONS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = tab.sections.includes(s) ? '' : 'none';
  });

  const dateD = document.getElementById('dateDisplay');
  const cityF = document.getElementById('cityFilter');
  const carrierF = document.getElementById('carrierFilter');
  const statusF = document.getElementById('statusFilter');
  const serviceF = document.getElementById('serviceFilter');
  
  const codDueDateF = document.getElementById('codDueDateFilter');
  const codStatusF = document.getElementById('codStatusFilter');
  const codDriverLevelF = document.getElementById('codDriverLevelFilter');

  if (cityF) cityF.style.display = 'inline-block';

  if (id === 'command-center') {
    if (dateD) dateD.style.display = 'inline-block';
    if (carrierF) carrierF.style.display = 'none';
    if (statusF) statusF.style.display = 'none';
    if (serviceF) serviceF.style.display = 'inline-block';
    if (codDueDateF) codDueDateF.style.display = 'none';
    if (codStatusF) codStatusF.style.display = 'none';
    if (codDriverLevelF) codDriverLevelF.style.display = 'none';
  } else if (id === 'sla-monitor') {
    if (dateD) dateD.style.display = 'inline-block';
    if (carrierF) carrierF.style.display = 'inline-block';
    if (statusF) statusF.style.display = 'inline-block';
    if (serviceF) serviceF.style.display = 'none';
    if (codDueDateF) codDueDateF.style.display = 'none';
    if (codStatusF) codStatusF.style.display = 'none';
    if (codDriverLevelF) codDriverLevelF.style.display = 'none';
  } else if (id === 'cod-tracker') {
    if (dateD) dateD.style.display = 'none';
    if (carrierF) carrierF.style.display = 'none';
    if (statusF) statusF.style.display = 'none';
    if (serviceF) serviceF.style.display = 'none';
    if (codDueDateF) codDueDateF.style.display = 'inline-block';
    if (codStatusF) codStatusF.style.display = 'inline-block';
    if (codDriverLevelF) codDriverLevelF.style.display = 'inline-block';
  }

  const first = document.getElementById(tab.sections[0]);
  if (first && id !== 'command-center') {
    setTimeout(() => first.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

/* =============================================
   ALERT BANNERS
   ============================================= */
function renderAlertBanners() {
  const container = document.getElementById('alertBanners');
  container.innerHTML = '';
}

function dismissAlert(id) {
  state.alertsDismissed.push(id);
  const el = document.getElementById('alert-' + id);
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }
}

/* =============================================
   HEALTH KPIs
   ============================================= */
function renderHealthKPIs() {
  const grid = document.getElementById('healthKpiGrid');
  const h = APP_DATA.health;

  const cards = [
    {
      id: 'kpi-orders',
      label: 'Total Orders',
      value: h.totalOrders.toLocaleString('en-IN'),
      sub: `${h.ordersDelta} vs yesterday`,
      type: 'default',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#6B6B6B" stroke-width="1.3"><rect x="2" y="2" width="14" height="14" rx="1.5"/><path d="M5.5 7h7M5.5 10h5" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'kpi-riders',
      label: 'Active Riders',
      value: h.activeRiders.toLocaleString('en-IN'),
      sub: `${h.ridersAvailable.toLocaleString()} avail · ${h.ridersBusy} busy`,
      type: 'is-green',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2E7D32" stroke-width="1.3"><circle cx="9" cy="6" r="3"/><path d="M3 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'kpi-stores',
      label: 'Live Stores',
      value: `${h.liveStores}/${h.totalStores}`,
      sub: `${h.offlineStores} stores offline`,
      type: h.offlineStores >= 4 ? 'is-warning' : 'default',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="${h.offlineStores >= 4 ? '#E65100' : '#6B6B6B'}" stroke-width="1.3"><rect x="2" y="8" width="14" height="8" rx="1"/><path d="M1 8l3.5-5h9L17 8"/><path d="M9 16v-4"/></svg>`,
    },
    {
      id: 'kpi-cities',
      label: 'Cities Live',
      value: h.citiesLive,
      sub: 'All regions active',
      type: 'is-blue',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1565C0" stroke-width="1.3"><circle cx="9" cy="7.5" r="3.5"/><path d="M9 11c0 0-5.5 3-5.5 5.5h11C14.5 14 9 11 9 11z"/></svg>`,
    },
    {
      id: 'kpi-cod',
      label: 'Pending COD',
      value: `\u20B94.82L`,
      sub: ``,
      type: 'is-warning',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#E65100" stroke-width="1.3"><circle cx="9" cy="9" r="7"/><path d="M7 7h4M7 9.5h3M9 9.5v4" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'kpi-sla',
      label: 'SLA At Risk',
      value: h.slaAtRisk,
      sub: `${h.slaAtRiskPct}% of total orders`,
      type: 'is-danger',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#C62828" stroke-width="1.3"><path d="M3 14a7 7 0 0 1 12 0" stroke-linecap="round"/><path d="M9 6v3.5" stroke-linecap="round"/><circle cx="9" cy="4.5" r="0.8" fill="#C62828"/></svg>`,
    },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="health-kpi-card ${c.type} ${state.activeKPI === c.id ? 'active' : ''}" id="${c.id}" onclick="selectKPI('${c.id}')">
      <div class="kpi-card-top">
        <span class="kpi-label">${c.label}</span>
        ${c.icon}
      </div>
      <div class="kpi-value">${c.value}</div>
      ${c.sub ? `<div class="kpi-sub">${c.sub}</div>` : ''}
    </div>
  `).join('');
}

function selectKPI(id) {
  if (state.activeKPI === id) {
    state.activeKPI = null; // toggle off
  } else {
    state.activeKPI = id;
  }
  renderHealthKPIs();
  applyFilters();
}

/* =============================================
   ORDER STATES (Shipment States pattern)
   ============================================= */
function renderOrderStates() {
  const grid = document.getElementById('orderStatesGrid');
  grid.innerHTML = APP_DATA.orderStates.map((s, i) => `
    <div class="state-card ${s.active ? 'active' : ''}"
         onclick="selectState(this, ${i})"
         id="state-${i}">
      <div class="state-label">${s.label}</div>
      <div class="state-value">${s.value.toLocaleString('en-IN')}</div>
      ${s.pct !== null ? `<div class="state-pct">${s.pct}%</div>` : ''}
    </div>
  `).join('');
}

function selectState(el, idx) {
  document.querySelectorAll('.state-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const s = APP_DATA.orderStates[idx];
  state.activeState = s.label;
  const centerVal = document.getElementById('chartCenterVal');
  if (centerVal) centerVal.textContent = s.value.toLocaleString('en-IN');
  applyFilters();
}

/* =============================================
   CITY VIEW TOGGLE
   ============================================= */
function setCityView(view) {
  state.cityView = view;
  document.querySelectorAll('.view-tab').forEach(el => el.classList.remove('active'));
  const btn = document.getElementById('view-' + view);
  if (btn) btn.classList.add('active');

  const cityWrap  = document.getElementById('cityTableWrap');
  const storeWrap = document.getElementById('storeTableWrap');

  if (view === 'city') {
    if (cityWrap)  cityWrap.style.display  = '';
    if (storeWrap) storeWrap.style.display = 'none';
  } else {
    if (cityWrap)  cityWrap.style.display  = 'none';
    if (storeWrap) storeWrap.style.display = '';
    renderStoreTable();
  }
}

/* =============================================
   CITY TABLE
   ============================================= */
function renderCityTable() {
  let data = [...APP_DATA.cities];
  
  if (state.cityFilter)   data = data.filter(r => r.city === state.cityFilter);
  if (state.healthFilter) data = data.filter(r => r.health === state.healthFilter);
  
  // KPI Filters
  if (state.activeKPI === 'kpi-riders') data = data.filter(r => r.riders > 100);
  if (state.activeKPI === 'kpi-stores') data = data.filter(r => r.stores > 5);
  if (state.activeKPI === 'kpi-sla') data = data.filter(r => r.slaRisk > 20);

  // Sort
  const { col, dir } = state.citySort;
  data.sort((a, b) => {
    const av = a[col], bv = b[col];
    const cmp = (typeof av === 'string') ? av.localeCompare(bv) : (av - bv);
    return dir === 'asc' ? cmp : -cmp;
  });

  // Paginate
  const start = (state.cityPage - 1) * state.cityPageSize;
  const page  = data.slice(start, start + state.cityPageSize);

  const tbody = document.getElementById('cityTableBody');
  tbody.innerHTML = page.map(r => {
    const otdClass = r.otd >= 90 ? '' : r.otd >= 82 ? 'amber' : 'red';
    const slaClass = r.slaRisk > 50 ? 'txt-danger' : r.slaRisk > 25 ? 'txt-warning' : '';
    return `
      <tr>
        <td><span class="table-link" onclick="drillCity('${r.city}')">${r.city}</span></td>
        <td>${r.stores}</td>
        <td>${r.riders.toLocaleString('en-IN')}</td>
        <td class="fw-600">${r.orders.toLocaleString('en-IN')}</td>
        <td>${r.delivered.toLocaleString('en-IN')}</td>
        <td>${r.failed.toLocaleString('en-IN')}</td>
        <td>
          <div class="otd-bar">
            <div class="otd-track"><div class="otd-fill ${otdClass}" style="width:${r.otd}%"></div></div>
            <span class="otd-val ${otdClass}">${r.otd}%</span>
          </div>
        </td>
        <td><span class="${slaClass}">${r.slaRisk}</span></td>
        <td><span class="status-badge ${r.health}">${r.health}</span></td>
      </tr>
    `;
  }).join('');

  renderCityPagination(data.length);
}

function renderCityPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / state.cityPageSize));
  const pg = document.getElementById('cityPagination');
  if (!pg) return;

  let html = `<button class="page-btn" onclick="setCityPage(${state.cityPage - 1})" ${state.cityPage <= 1 ? 'disabled' : ''}>&#8249;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === state.cityPage ? 'active' : ''}" onclick="setCityPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="setCityPage(${state.cityPage + 1})" ${state.cityPage >= totalPages ? 'disabled' : ''}>&#8250;</button>`;
  if (pg) pg.innerHTML = html;
}

/* =============================================
   PAGINATION HELPERS
   ============================================= */
function renderPaginationHTML(containerId, totalItems, currentPage, pageSize, setPageFnName) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pag = document.getElementById(containerId);
  if (!pag) return;
  
  let html = `<button class="page-btn" onclick="${setPageFnName}(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&#8249;</button>`;
  
  // Show up to 5 pages max to avoid breaking layout if there are too many
  let startP = Math.max(1, currentPage - 2);
  let endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) startP = Math.max(1, endP - 4);

  for (let i = startP; i <= endP; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${setPageFnName}(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="${setPageFnName}(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>&#8250;</button>`;
  pag.innerHTML = html;
}

function setSlaPage(p) {
  const max = Math.ceil(APP_DATA.slaRisk.length / state.slaPageSize);
  if (p < 1 || p > max) return;
  state.slaPage = p;
  renderSLATable();
}
function setSlaPageSize(size) {
  state.slaPageSize = parseInt(size);
  state.slaPage = 1;
  renderSLATable();
}

function setCodPage(p) {
  const max = Math.ceil(APP_DATA.pendingCOD.length / state.codPageSize);
  if (p < 1 || p > max) return;
  state.codPage = p;
  renderCODTable();
}
function setCodPageSize(size) {
  state.codPageSize = parseInt(size);
  state.codPage = 1;
  renderCODTable();
}

function setDriverCodPage(p) {
  const max = Math.ceil(APP_DATA.driverCOD.length / state.driverCodPageSize);
  if (p < 1 || p > max) return;
  state.driverCodPage = p;
  renderDriverCODTable();
}
function setDriverCodPageSize(size) {
  state.driverCodPageSize = parseInt(size);
  state.driverCodPage = 1;
  renderDriverCODTable();
}

function setDriverCompPage(p) {
  const max = Math.ceil(APP_DATA.driverCompliance.length / state.driverCompPageSize);
  if (p < 1 || p > max) return;
  state.driverCompPage = p;
  renderDriverComplianceTable();
}
function setDriverCompPageSize(size) {
  state.driverCompPageSize = parseInt(size);
  state.driverCompPage = 1;
  renderDriverComplianceTable();
}

function setCityPage(p) {
  const max = Math.ceil(APP_DATA.cities.length / state.cityPageSize);
  if (p < 1 || p > max) return;
  state.cityPage = p;
  renderCityTable();
}

function setCityPageSize(size) {
  state.cityPageSize = parseInt(size);
  state.cityPage = 1;
  renderCityTable();
}

function drillCity(city) {
  const cityFilter = document.getElementById('cityFilter');
  if (cityFilter) { cityFilter.value = city; applyFilters(); }
}

/* =============================================
   STORE TABLE
   ============================================= */
function renderStoreTable() {
  let data = [...APP_DATA.stores];
  
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.carrierFilter) data = data.filter(r => r.carrier === state.carrierFilter);
  
  // KPI Filters
  if (state.activeKPI === 'kpi-stores') data = data.filter(r => r.status === 'Active');
  if (state.activeKPI === 'kpi-riders') data = data.filter(r => r.riders > 0);

  const tbody = document.getElementById('storeTableBody');
  if (!tbody) return;

  tbody.innerHTML = data.map(r => `
    <tr>
      <td><span class="table-link">${r.store}</span></td>
      <td>${r.city}</td>
      <td>${r.carrier}</td>
      <td>${r.riders}</td>
      <td class="fw-600">${r.orders.toLocaleString('en-IN')}</td>
      <td>${r.delivered.toLocaleString('en-IN')}</td>
      <td>${r.failed.toLocaleString('en-IN')}</td>
      <td><span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
    </tr>
  `).join('');
}

/* =============================================
   SLA RISK TABLE
   ============================================= */
function renderSLATable() {
  let data = [...APP_DATA.slaRisk];
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.carrierFilter) data = data.filter(r => r.carrier === state.carrierFilter);
  
  if (state.carrierFilter) data = data.filter(r => r.carrier === state.carrierFilter);
  if (state.cityFilter)    data = data.filter(r => r.city === state.cityFilter);
  if (state.healthFilter) {
    const rf = state.healthFilter.toLowerCase();
    data = data.filter(r => r.risk.toLowerCase() === (rf === 'critical' || rf === 'warning' ? (rf === 'warning' ? 'medium' : 'critical') : r.risk.toLowerCase()));
  }

  const total = data.length;
  const start = (state.slaPage - 1) * state.slaPageSize;
  const page = data.slice(start, start + state.slaPageSize);

  const tbody = document.getElementById('slaTableBody');
  tbody.innerHTML = page.map(r => `
    <tr>
      <td><span class="table-link">${r.orderId}</span></td>
      <td>${r.store}</td>
      <td>${r.city}</td>
      <td>${r.customer}</td>
      <td>${r.promised}</td>
      <td class="txt-danger fw-600">${r.current}</td>
      <td class="txt-danger fw-700">${r.delay}</td>
      <td>${r.carrier}</td>
      <td><span class="badge ${riskClass(r.risk)}">${r.risk}</span></td>
    </tr>
  `).join('');

  renderPaginationHTML('slaPagination', total, state.slaPage, state.slaPageSize, 'setSlaPage');
}



/* =============================================
   PENDING COD TABLE
   ============================================= */
function renderCODTable() {
  let data = [...APP_DATA.pendingCOD];
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.carrierFilter) {
    const validStoreIds = new Set(APP_DATA.stores.filter(s => s.carrier === state.carrierFilter).map(s => s.store));
    data = data.filter(r => validStoreIds.has(r.store));
  }
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.codStatusFilter && state.codStatusFilter !== 'All Statuses') data = data.filter(r => r.status === state.codStatusFilter);
  if (state.activeKPI === 'kpi-cod') data = data.filter(r => r.status === 'Overdue');

  const total = data.length;
  const start = (state.codPage - 1) * state.codPageSize;
  const page = data.slice(start, start + state.codPageSize);

  const tbody = document.getElementById('codTableBody');
  tbody.innerHTML = page.map(r => `
    <tr>
      <td><span class="table-link">${r.store}</span></td>
      <td>${r.city}</td>
      <td class="fw-700">\u20B9${r.amount.toLocaleString('en-IN')}</td>
      <td>${r.orders}</td>
      <td>${r.oldest}</td>
      <td>${r.daysOld === 0 ? '<span style="color:#9E9E9E">—</span>' : `<span class="${r.daysOld >= 2 ? 'txt-danger' : 'txt-warning'}">${r.daysOld}d</span>`}</td>
      <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
    </tr>
  `).join('');

  renderPaginationHTML('codPagination', total, state.codPage, state.codPageSize, 'setCodPage');
}

/* =============================================
   DRIVER COD TABLE
   ============================================= */
function renderDriverCODTable() {
  let data = [...APP_DATA.driverCOD];
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.codDueDateFilter && state.codDueDateFilter !== 'All Due Dates') {
    const today = new Date('2026-07-19'); // Mock today
    data = data.filter(r => {
      const d = new Date(r.dueDate);
      if (state.codDueDateFilter === '7days') {
        const diff = (today - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      } else if (state.codDueDateFilter === '30days') {
        const diff = (today - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      } else if (state.codDueDateFilter === 'lastmonth') {
        return d.getMonth() === 5 && d.getFullYear() === 2026; // June 2026
      }
      return true;
    });
  }
  if (state.codStatusFilter && state.codStatusFilter !== 'All Statuses') data = data.filter(r => r.status === state.codStatusFilter);
  if (state.codDriverLevelFilter && state.codDriverLevelFilter !== 'All Driver Levels') data = data.filter(r => r.driverLevel === state.codDriverLevelFilter);
  // Re-use active KPI if it makes sense, or skip

  const total = data.length;
  const start = (state.driverCodPage - 1) * state.driverCodPageSize;
  const page = data.slice(start, start + state.driverCodPageSize);

  const tbody = document.getElementById('driverCodTableBody');
  tbody.innerHTML = page.map(r => `
    <tr>
      <td><span class="table-link">${r.driverId}</span></td>
      <td><span class="badge badge-neutral">${r.driverLevel}</span></td>
      <td>${r.store}</td>
      <td>${r.city}</td>
      <td class="fw-700">\u20B9${r.cashInHand.toLocaleString('en-IN')}</td>
      <td>${r.lastCollected}</td>
      <td class="${r.dueDate < '2026-07-19' ? 'txt-danger fw-600' : ''}">${r.dueDate}</td>
      <td><span class="badge ${r.status === 'Blocked' ? 'badge-danger' : statusClass(r.status)}">${r.status}</span></td>
    </tr>
  `).join('');

  renderPaginationHTML('driverCodPagination', total, state.driverCodPage, state.driverCodPageSize, 'setDriverCodPage');
}

/* =============================================
   DRIVER COMPLIANCE TABLE
   ============================================= */
function renderDriverComplianceTable() {
  let data = [...APP_DATA.driverCompliance];
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);

  const total = data.length;
  const start = (state.driverCompPage - 1) * state.driverCompPageSize;
  const page = data.slice(start, start + state.driverCompPageSize);

  const tbody = document.getElementById('driverComplianceTableBody');
  tbody.innerHTML = page.map(r => `
    <tr>
      <td><span class="table-link">${r.driverId}</span></td>
      <td>${r.store}</td>
      <td>${r.city}</td>
      <td><span class="badge ${r.partialCod > 0 ? 'badge-warning' : 'badge-success'}">${r.partialCod}</span></td>
      <td><span class="badge ${r.rejectedOrders > 0 ? 'badge-danger' : 'badge-success'}">${r.rejectedOrders}</span></td>
      <td><span class="badge ${r.locationMismatch > 0 ? 'badge-warning' : 'badge-success'}">${r.locationMismatch}</span></td>
      <td><span class="badge ${r.podNonCompliant > 0 ? 'badge-danger' : 'badge-success'}">${r.podNonCompliant}</span></td>
    </tr>
  `).join('');

  renderPaginationHTML('driverCompliancePagination', total, state.driverCompPage, state.driverCompPageSize, 'setDriverCompPage');
}

/* =============================================
   BADGE HELPERS
   ============================================= */
function riskClass(level) {
  const map = { 'Critical': 'badge-danger', 'High': 'badge-high', 'Medium': 'badge-warning', 'Low': 'badge-neutral' };
  return map[level] || 'badge-neutral';
}
function statusClass(status) {
  const map = {
    'Open': 'badge-danger',
    'In Progress': 'badge-warning',
    'Monitoring': 'badge-neutral',
    'Resolved': 'badge-success',
    'Overdue': 'badge-danger',
    'Due Today': 'badge-warning',
    'Pending': 'badge-neutral',
    'Active': 'badge-danger',
  };
  return map[status] || 'badge-neutral';
}
function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : str; }

/* =============================================
   FILTER SETUP
   ============================================= */
function setupFilters() {
  const ids = ['cityFilter', 'carrierFilter', 'statusFilter', 'serviceFilter', 'codDueDateFilter', 'codStatusFilter', 'codDriverLevelFilter'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      state[id] = el.value;
      applyFilters();
    });
  });
}

function applyFilters() {
  state.cityFilter = document.getElementById('cityFilter')?.value || '';
  state.carrierFilter = document.getElementById('carrierFilter')?.value || '';
  state.healthFilter = document.getElementById('statusFilter')?.value || '';
  state.codDueDateFilter = document.getElementById('codDueDateFilter')?.value || '';
  state.codStatusFilter = document.getElementById('codStatusFilter')?.value || '';
  state.codDriverLevelFilter = document.getElementById('codDriverLevelFilter')?.value || '';

  state.cityPage = 1;
  renderCityTable();
  renderSLATable();
  renderCODAnalytics();
  renderCODTable();
  renderDriverCODTable();
  renderDriverComplianceTable();
  if (state.cityView === 'store') renderStoreTable();
}

/* =============================================
   TABLE COLUMN SORT
   ============================================= */
function setupTableSorts() {
  document.querySelectorAll('#cityTable th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.citySort.col === col) {
        state.citySort.dir = state.citySort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.citySort = { col, dir: 'desc' };
      }
      document.querySelectorAll('#cityTable th').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(state.citySort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
      state.cityPage = 1;
      renderCityTable();
    });
  });
}

/* =============================================
   REFRESH
   ============================================= */
function refreshData() {
  const btn  = document.getElementById('refreshBtn');
  const icon = document.getElementById('refreshIcon');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  if (icon) { icon.style.animation = 'spin 0.8s linear infinite'; icon.style.transformOrigin = 'center'; }

  setTimeout(() => {
    state.lastRefreshed = new Date();
    updateLastRefreshed();
    renderHealthKPIs();
    renderCityTable();
    renderSLATable();
    renderExceptionsTable();
    renderCODTable();
    if (state.cityView === 'store') renderStoreTable();
    if (btn) { btn.disabled = false; btn.style.opacity = ''; }
    if (icon) icon.style.animation = '';
  }, 700);
}

/* =============================================
   AUTO REFRESH TOGGLE
   ============================================= */
function toggleAutoRefresh() {
  state.autoRefresh = !state.autoRefresh;
  const toggle = document.getElementById('autoRefreshToggle');
  const label  = document.getElementById('autoRefreshLabel');

  if (state.autoRefresh) {
    if (toggle) toggle.classList.add('on');
    if (label) label.textContent = 'On';
    state.autoRefreshTimer = setInterval(refreshData, 30000);
  } else {
    if (toggle) toggle.classList.remove('on');
    if (label) label.textContent = 'Off';
    if (state.autoRefreshTimer) { clearInterval(state.autoRefreshTimer); state.autoRefreshTimer = null; }
  }
}

/* =============================================
   LAST REFRESHED CLOCK
   ============================================= */
function updateLastRefreshed() {
  const el = document.getElementById('lastRefreshedText');
  if (!el) return;
  const diff = Math.floor((Date.now() - state.lastRefreshed.getTime()) / 60000);
  el.textContent = diff === 0
    ? 'Last updated: Just now'
    : `Last updated: ${diff} min${diff > 1 ? 's' : ''} ago`;
}

/* Small spin keyframe injected once */
(function injectSpin() {
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }';
  document.head.appendChild(style);
})();


/* =============================================
   COD ANALYTICS
   ============================================= */
let codAnalyticsChartInstance = null;

function setAnalyticsGrouping(grouping) {
  state.analyticsGrouping = grouping;
  document.getElementById('btnGroupCity').classList.toggle('active', grouping === 'city');
  document.getElementById('btnGroupLevel').classList.toggle('active', grouping === 'driverLevel');
  renderCODAnalytics();
}

function renderCODAnalytics() {
  const ctx = document.getElementById('codAnalyticsChart');
  if (!ctx) return;

  // Filter data exactly like driverCOD table
  let data = [...APP_DATA.driverCOD];
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.codDueDateFilter && state.codDueDateFilter !== 'All Due Dates') {
    const today = new Date('2026-07-19');
    data = data.filter(r => {
      const d = new Date(r.dueDate);
      if (state.codDueDateFilter === '7days') {
        const diff = (today - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      } else if (state.codDueDateFilter === '30days') {
        const diff = (today - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      } else if (state.codDueDateFilter === 'lastmonth') {
        return d.getMonth() === 5 && d.getFullYear() === 2026;
      }
      return true;
    });
  }
  if (state.codStatusFilter && state.codStatusFilter !== 'All Statuses') data = data.filter(r => r.status === state.codStatusFilter);
  if (state.codDriverLevelFilter && state.codDriverLevelFilter !== 'All Driver Levels') data = data.filter(r => r.driverLevel === state.codDriverLevelFilter);

  // Calculate KPIs
  let totalCollected = 0, totalSubmitted = 0, totalPending = 0, totalPettyCash = 0, totalTrips = 0;
  const uniqueDrivers = new Set();

  data.forEach(r => {
    totalCollected += r.amountCollected || 0;
    totalSubmitted += r.amountSubmitted || 0;
    totalPending += r.cashInHand || 0;
    totalPettyCash += r.pettyCash || 0;
    totalTrips += r.trips || 0;
    uniqueDrivers.add(r.driverId);
  });

  document.getElementById('kpiTotalCollected').textContent = '₹' + totalCollected.toLocaleString('en-IN');
  document.getElementById('kpiTotalSubmitted').textContent = '₹' + totalSubmitted.toLocaleString('en-IN');
  document.getElementById('kpiTotalPending').textContent = '₹' + totalPending.toLocaleString('en-IN');
  document.getElementById('kpiPettyCash').textContent = '₹' + totalPettyCash.toLocaleString('en-IN');
  document.getElementById('kpiTotalTrips').textContent = totalTrips;
  document.getElementById('kpiActiveDrivers').textContent = uniqueDrivers.size;

  // Group data for chart
  const groups = {};
  data.forEach(r => {
    const key = r[state.analyticsGrouping] || 'Unknown';
    if (!groups[key]) {
      groups[key] = { submitted: 0, pending: 0, petty: 0 };
    }
    groups[key].submitted += r.amountSubmitted || 0;
    groups[key].pending += r.cashInHand || 0;
    groups[key].petty += r.pettyCash || 0;
  });

  const labels = Object.keys(groups);
  const dataSubmitted = labels.map(l => groups[l].submitted);
  const dataPending = labels.map(l => groups[l].pending);
  const dataPetty = labels.map(l => groups[l].petty);

  if (codAnalyticsChartInstance) {
    codAnalyticsChartInstance.destroy();
  }

  codAnalyticsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Submitted', data: dataSubmitted, backgroundColor: '#0BA068', stack: 'Stack 0', borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 } },
        { label: 'Pending', data: dataPending, backgroundColor: '#D14343', stack: 'Stack 0' },
        { label: 'Petty Cash', data: dataPetty, backgroundColor: '#F5A623', stack: 'Stack 0', borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Inter' } } }
      },
      scales: {
        y: { stacked: true, grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Inter' } } },
        x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter' } } }
      }
    }
  });
}
