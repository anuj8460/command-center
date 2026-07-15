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
  autoRefresh: false,
  autoRefreshTimer: null,
  alertsDismissed: [],
  lastRefreshed: new Date(),
  orderChart: null,
  activeKPI: null,
  activeState: 'All Orders',
  cityFilter: '',
  carrierFilter: '',
  healthFilter: ''
};

/* =============================================
   TABS CONFIGURATION
   ============================================= */
const TABS = [
  {
    id: 'command-center',
    label: 'Command Center',
    sections: ['healthSection','orderStatesSection','citySection','slaSection','exceptionsSection','outageSection','codSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
  },
  {
    id: 'sla-monitor',
    label: 'SLA Monitor',
    sections: ['slaSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 12a6 6 0 0 1 10 0" stroke-linecap="round"/><path d="M8 6v2M8 4v.5" stroke-linecap="round"/><circle cx="8" cy="4" r="0" fill="currentColor"/></svg>`,
  },
  {
    id: 'carrier-health',
    label: 'Carrier Health',
    sections: ['outageSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1" y="5" width="9" height="7" rx="1"/><path d="M10 7h3l2 3v2h-5V7z"/><circle cx="4" cy="13" r="1.5"/><circle cx="12" cy="13" r="1.5"/></svg>`,
  },
  {
    id: 'cod-tracker',
    label: 'COD Tracker',
    sections: ['codSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M6 6h4M6 8.5h2.5M8.5 8.5v3" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'exceptions-log',
    label: 'Exceptions Log',
    sections: ['exceptionsSection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2L1.5 14h13L8 2z" stroke-linejoin="round"/><path d="M8 7v3" stroke-linecap="round"/><circle cx="8" cy="12" r="0.6" fill="currentColor"/></svg>`,
  },
  {
    id: 'store-roster',
    label: 'Roster',
    sections: ['citySection'],
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M2 6h12M6 6v8" stroke-linecap="round"/></svg>`,
  }
];

const ALL_SECTIONS = ['healthSection','orderStatesSection','citySection','slaSection','exceptionsSection','outageSection','codSection'];

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  renderAlertBanners();
  renderHealthKPIs();
  renderOrderStates();
  renderCityTable();
  renderSLATable();
  renderExceptionsTable();
  renderCarrierOutages();
  renderCODTable();
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

  if (id === 'command-center' || tab.sections.length === 0) {
    ALL_SECTIONS.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.style.display = '';
    });
  } else {
    ALL_SECTIONS.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.style.display = tab.sections.includes(s) ? '' : 'none';
    });
    const first = document.getElementById(tab.sections[0]);
    if (first) setTimeout(() => first.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

/* =============================================
   ALERT BANNERS
   ============================================= */
function renderAlertBanners() {
  const container = document.getElementById('alertBanners');
  const h = APP_DATA.health;
  let html = '';

  if (!state.alertsDismissed.includes('outage')) {
    html += `
      <div class="alert-banner danger" id="alert-outage">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" flex-shrink="0">
          <path d="M8 2L1.5 14h13L8 2z" stroke="#C62828" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M8 7v3" stroke="#C62828" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="8" cy="12" r="0.7" fill="#C62828"/>
        </svg>
        <span>
          <strong>CARRIER ALERT:</strong> Bluedart (Mumbai Metro) and DTDC (Delhi NCR) outages are <strong>Active</strong>
          &mdash; 412 orders affected. Delhivery (Hyderabad) resolved at 03:45 PM. Rerouting in progress.
        </span>
        <button class="alert-close" onclick="dismissAlert('outage')" aria-label="Dismiss">&#x2715;</button>
      </div>`;
  }

  if (!state.alertsDismissed.includes('exceptions')) {
    html += `
      <div class="alert-banner warning" id="alert-exceptions">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" flex-shrink="0">
          <circle cx="8" cy="8" r="6" stroke="#A04000" stroke-width="1.4"/>
          <path d="M8 5v4" stroke="#A04000" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="8" cy="11" r="0.7" fill="#A04000"/>
        </svg>
        <span>
          <strong>${h.criticalExceptions} Critical Exceptions</strong> require immediate attention — Carrier Outages (2), Store Offline (1), Vehicle Breakdown (1), Package Damage (1).
        </span>
        <button class="alert-close" onclick="dismissAlert('exceptions')" aria-label="Dismiss">&#x2715;</button>
      </div>`;
  }

  container.innerHTML = html;
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
      sub: `10 stores · \u20B94,82,350`,
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
    {
      id: 'kpi-exceptions',
      label: 'Open Exceptions',
      value: h.openExceptions,
      sub: `${h.criticalExceptions} critical · ${h.openExceptions - h.criticalExceptions} others`,
      type: 'is-danger',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#C62828" stroke-width="1.3"><path d="M9 2L1.5 16h15L9 2z" stroke-linejoin="round"/><path d="M9 8v4" stroke-linecap="round"/><circle cx="9" cy="14" r="0.8" fill="#C62828"/></svg>`,
    },
    {
      id: 'kpi-outages',
      label: 'Carrier Outages',
      value: h.carrierOutages,
      sub: `${h.activeOutages} active · 1 resolved`,
      type: 'is-danger',
      icon: `<svg class="kpi-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#C62828" stroke-width="1.3"><rect x="1" y="6" width="10" height="8" rx="1"/><path d="M11 8h3.5l2.5 4v3h-6V8z"/><circle cx="5" cy="15" r="2"/><circle cx="14" cy="15" r="2"/></svg>`,
    },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="health-kpi-card ${c.type} ${state.activeKPI === c.id ? 'active' : ''}" id="${c.id}" onclick="selectKPI('${c.id}')">
      <div class="kpi-card-top">
        <span class="kpi-label">${c.label}</span>
        ${c.icon}
      </div>
      <div class="kpi-value">${c.value}</div>
      <div class="kpi-sub">${c.sub}</div>
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

  buildOrderChart();
}

function selectState(el, idx) {
  document.querySelectorAll('.state-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const s = APP_DATA.orderStates[idx];
  state.activeState = s.label;
  const centerVal = document.getElementById('chartCenterVal');
  if (centerVal) centerVal.textContent = s.value.toLocaleString('en-IN');
  buildOrderChart();
  applyFilters();
}

function buildOrderChart() {
  const ctx = document.getElementById('orderStateChart');
  if (!ctx) return;

  if (state.orderChart) { state.orderChart.destroy(); state.orderChart = null; }

  const states = APP_DATA.orderStates.slice(1); // skip 'All Orders'

  const COLORS = [
    '#90A4AE', // Created
    '#9FA8DA', // Assigned
    '#4DB6AC', // Picked Up
    '#4FC3F7', // Out For Delivery
    '#81C784', // Delivered
    '#E53D2F', // Failed
    '#FFB74D', // Returned
    '#CFD8DC', // Cancelled
  ];

  const bgColors = states.map((s, i) => {
    if (state.activeState === 'All Orders' || state.activeState === s.label) return COLORS[i];
    return '#E8E8E8'; // dimmed out
  });

  state.orderChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: states.map(s => s.label),
      datasets: [{
        data: states.map(s => s.value),
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFFFFF',
          titleColor: '#1A1A1A',
          bodyColor: '#6B6B6B',
          borderColor: '#E8E8E8',
          borderWidth: 1,
          padding: 10,
          titleFont: { family: 'Inter', size: 12, weight: '600' },
          bodyFont:  { family: 'Inter', size: 12 },
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.raw.toLocaleString('en-IN')} (${pct}%)`;
            }
          }
        }
      },
      cutout: '62%',
    }
  });
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
  if (state.activeKPI === 'kpi-exceptions') data = data.filter(r => r.exceptions > 0);

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
        <td>${r.exceptions}</td>
        <td><span class="health-dot ${r.health}">${cap(r.health)}</span></td>
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
  pg.innerHTML = html;
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
  
  if (state.carrierFilter) data = data.filter(r => r.carrier === state.carrierFilter);
  if (state.cityFilter)    data = data.filter(r => r.city === state.cityFilter);
  if (state.healthFilter) {
    const rf = state.healthFilter.toLowerCase();
    data = data.filter(r => r.risk.toLowerCase() === (rf === 'critical' || rf === 'warning' ? (rf === 'warning' ? 'medium' : 'critical') : r.risk.toLowerCase()));
  }

  const tbody = document.getElementById('slaTableBody');
  tbody.innerHTML = data.map(r => `
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
}

/* =============================================
   EXCEPTIONS TABLE
   ============================================= */
function renderExceptionsTable() {
  let data = [...APP_DATA.exceptions];
  
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.healthFilter) {
    const hf = state.healthFilter.toLowerCase();
    data = data.filter(r => r.severity.toLowerCase() === hf || (hf === 'warning' && (r.severity === 'High' || r.severity === 'Medium')));
  }
  if (state.activeKPI === 'kpi-exceptions') data = data.filter(r => r.status !== 'Resolved');

  const tbody = document.getElementById('excTableBody');
  tbody.innerHTML = data.map(r => `
    <tr>
      <td><span class="table-link">${r.id}</span></td>
      <td>${r.type}</td>
      <td>${r.related}</td>
      <td>${r.city}</td>
      <td><span class="badge ${riskClass(r.severity)}">${r.severity}</span></td>
      <td>${r.raised}</td>
      <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
      <td>${r.assignee}</td>
    </tr>
  `).join('');
}

/* =============================================
   CARRIER OUTAGES
   ============================================= */
function renderCarrierOutages() {
  const grid = document.getElementById('outageGrid');
  grid.innerHTML = APP_DATA.carrierOutages.map(o => {
    const cls = o.status.toLowerCase();
    const badgeCls = cls === 'active' ? 'badge-danger' : cls === 'monitoring' ? 'badge-warning' : 'badge-success';
    const etaLabel = o.status === 'Resolved' ? 'Resolved At' : 'Est. Recovery';
    return `
      <div class="outage-card ${cls}">
        <div class="outage-header">
          <div class="outage-carrier">${o.carrier}</div>
          <span class="badge ${badgeCls}">${o.status}</span>
        </div>
        <div class="outage-region">${o.region}</div>
        <div class="outage-count">${o.affectedOrders.toLocaleString('en-IN')}</div>
        <div class="outage-count-lbl">Orders Affected</div>
        <div class="outage-meta"><strong>Outage Since:</strong> ${o.since}</div>
        <div class="outage-meta"><strong>${etaLabel}:</strong> ${o.eta}</div>
        <div class="outage-cities">
          ${o.cities.map(c => `<span class="outage-city-chip">${c}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/* =============================================
   PENDING COD TABLE
   ============================================= */
function renderCODTable() {
  let data = [...APP_DATA.pendingCOD];
  if (state.cityFilter) data = data.filter(r => r.city === state.cityFilter);
  if (state.activeKPI === 'kpi-cod') data = data.filter(r => r.status === 'Overdue');

  const tbody = document.getElementById('codTableBody');
  tbody.innerHTML = data.map(r => `
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
  const ids = ['cityFilter', 'carrierFilter', 'statusFilter', 'serviceFilter'];
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

  state.cityPage = 1;
  renderCityTable();
  renderSLATable();
  renderExceptionsTable();
  renderCODTable();
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
