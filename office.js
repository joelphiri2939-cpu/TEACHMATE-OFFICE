/* TeachMate Office — shared shell for the Head teacher and Admin dashboards.
   It only re-arranges what is already on the page (moves/adds nodes, never replaces the app's own
   elements), so every id, click handler and Firestore call keeps working.
   If anything in here throws, the dashboards still work with the plain layout. */
(function () {
  'use strict';
  try {
    var isAdmin = !!document.getElementById('main-app');
    var ROLE = isAdmin ? 'Administrator' : 'Head teacher';
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    document.documentElement.classList.add(isAdmin ? 'o-ad' : 'o-ht');

    // ── Emoji → clean text (labels only; icon-only nodes are left alone) ──
    var EMO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]+\s?/gu;
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CANVAS: 1, SVG: 1 };
    function fix(n) {
      var v = n.nodeValue;
      EMO.lastIndex = 0;
      if (!v || !EMO.test(v)) { EMO.lastIndex = 0; return; }
      EMO.lastIndex = 0;
      var out = v.replace(EMO, '');
      if (out.trim().length) n.nodeValue = out;
    }
    function strip(root) {
      if (!root || !root.nodeType) return;
      if (root.nodeType === 3) { if (root.parentNode && !SKIP[root.parentNode.nodeName]) fix(root); return; }
      if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
      var w = document.createTreeWalker(root, 4, null), n, list = [];
      while ((n = w.nextNode())) { if (n.nodeValue && n.nodeValue.length > 1 && n.parentNode && !SKIP[n.parentNode.nodeName]) list.push(n); }
      list.forEach(fix);
    }
    function clean(t) { return (t || '').replace(EMO, '').replace(/\s+/g, ' ').trim(); }

    var MARK = '<svg class="%C" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#f2b01e"/>' +
      '<rect x="9" y="22" width="6" height="9" rx="1.6" fill="#0a1224"/><rect x="17" y="16" width="6" height="15" rx="1.6" fill="#0a1224"/>' +
      '<rect x="25" y="9" width="6" height="22" rx="1.6" fill="#0a1224"/></svg>';

    var sidebar = $('#sidebar');
    var header = $('header');
    var content = $('.content-container') || $('.content');
    var links = sidebar ? $$('.nav-link[data-section], .nav-item[data-section]', sidebar) : [];
    var NAMES = { dashboard: 'Home', students: 'Students', classes: 'Classes', teachers: 'Teachers', fees: 'Fees', transfers: 'Transfers', admissions: 'Admissions',
      'teacher-selection': 'Staff', 'class-selection': 'Classes', 'data-view': 'Class data', 'settings-section': 'Settings' };
    var SUBS = { dashboard: 'Overview of your school', students: 'Every learner, one registry', classes: 'Classes, capacity and class teachers', teachers: 'Teaching staff',
      fees: 'Fees and collections', transfers: 'Student transfers in and out', admissions: 'Admissions desk', 'teacher-selection': 'Your teaching staff, at a glance',
      'class-selection': 'Pick a class to open its records', 'data-view': 'Class data centre', 'settings-section': 'School settings' };
    var TITLES = { dashboard: 'Home', 'teacher-selection': 'Staff directory', 'class-selection': 'Class selector', 'data-view': 'Class data centre', 'settings-section': 'School settings' };

    function toggleDrawer(force) { var f = window.toggleHtSidebar || window.toggleAdminSidebar; if (typeof f === 'function') f(force); }
    function closeDrawer() { if (sidebar && sidebar.classList.contains('mobile-open')) toggleDrawer(false); }
    function go(id) { var l = links.filter(function (x) { return x.getAttribute('data-section') === id; })[0]; if (l) { closeDrawer(); l.click(); } }

    // Drawer (phones): brand on top, school card at the bottom
    if (sidebar && !$('.o-brand', sidebar)) {
      var brand = document.createElement('div');
      brand.className = 'o-brand';
      brand.innerHTML = MARK.replace('%C', 'o-mark') + '<div><div class="o-brand-name">Teach<b>Mate</b> Office</div><span class="o-role">' + ROLE + '</span></div>';
      sidebar.insertBefore(brand, sidebar.firstChild);
      var foot = document.createElement('div');
      foot.className = 'o-foot';
      foot.innerHTML = '<div class="o-foot-k">Your school</div><div class="o-foot-name" id="o-foot-name">—</div><div class="o-foot-code" id="o-foot-code"></div>';
      sidebar.appendChild(foot);
    }

    // Top bar: brand + primary navigation (desktop), page title (phone)
    if (header && !$('.o-hbrand', header)) {
      var hb = document.createElement('div');
      hb.className = 'o-hbrand';
      hb.innerHTML = MARK.replace('%C', 'o-hmark') + '<div class="o-hname-wrap"><div class="o-hname">Teach<b>Mate</b> Office</div><span class="o-hrole">' + ROLE + '</span></div>';
      hb.querySelector('.o-hname-wrap').className = 'o-hw';
      var nav = document.createElement('nav');
      nav.id = 'o-nav';
      nav.setAttribute('aria-label', 'Sections');
      var ORDER = isAdmin ? [] : ['dashboard', 'teacher-selection', 'class-selection', 'data-view', 'settings-section'];
      var navLinks = links.slice().sort(function (a, b) { var x = ORDER.indexOf(a.getAttribute('data-section')), y = ORDER.indexOf(b.getAttribute('data-section')); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
      navLinks.forEach(function (l) {
        var id = l.getAttribute('data-section'), ic = $('i', l), b = document.createElement('button');
        b.type = 'button'; b.setAttribute('data-go', id);
        b.innerHTML = (ic ? ic.outerHTML : '') + '<span>' + (NAMES[id] || clean(l.textContent)) + '</span>';
        b.addEventListener('click', function () { go(id); });
        nav.appendChild(b);
      });
      var t = document.createElement('div');
      t.id = 'o-title';
      t.innerHTML = '<div class="o-t1">Home</div><div class="o-t2"></div>';
      header.insertBefore(t, header.firstChild);
      header.insertBefore(nav, header.firstChild);
      header.insertBefore(hb, header.firstChild);
    }

    // Page head (title + page actions) at the top of the content area
    var actions = null;
    if (content && !$('#o-pagehead')) {
      var ph = document.createElement('div');
      ph.id = 'o-pagehead';
      ph.innerHTML = '<div><div class="o-ph-t">Home</div><div class="o-ph-s"></div></div><div id="o-actions"></div>';
      content.insertBefore(ph, content.firstChild);
      actions = $('#o-actions', ph);
      // Admin "Import students from Excel" button: same node, new home
      var imp = sidebar && $('.btn.write-action, .btn', sidebar) && $$('.btn', sidebar).filter(function (b) { return b.parentNode === sidebar; })[0];
      if (imp) { imp.setAttribute('data-o-for', 'students'); actions.appendChild(imp); }
    }

    // Bottom tab bar (phones)
    var tabs = document.createElement('nav');
    tabs.id = 'o-tabs';
    tabs.setAttribute('aria-label', 'Main');
    var PREFER = isAdmin ? ['dashboard', 'students', 'fees', 'admissions'] : ['dashboard', 'teacher-selection', 'class-selection', 'data-view', 'settings-section'];
    var tabLinks = [];
    PREFER.forEach(function (id) { var l = links.filter(function (x) { return x.getAttribute('data-section') === id; })[0]; if (l) tabLinks.push(l); });
    tabLinks.forEach(function (l) {
      var id = l.getAttribute('data-section'), b = document.createElement('button'), ic = $('i', l);
      b.type = 'button'; b.setAttribute('data-go', id);
      b.innerHTML = (ic ? ic.outerHTML : '<i class="fas fa-circle"></i>') + '<span>' + (NAMES[id] || clean(l.textContent)) + '</span>';
      b.addEventListener('click', function () { go(id); });
      tabs.appendChild(b);
    });
    if (links.length > tabLinks.length) {
      var more = document.createElement('button');
      more.type = 'button'; more.setAttribute('data-go', '__more');
      more.innerHTML = '<i class="fas fa-ellipsis-h"></i><span>More</span>';
      more.addEventListener('click', function () { toggleDrawer(); });
      tabs.appendChild(more);
    }
    document.body.appendChild(tabs);

    // Dashboard hero
    (function buildHero() {
      var host = isAdmin ? $('#section-dashboard') : $('#dashboard');
      if (!host || $('#o-hero', host)) return;
      var h = document.createElement('div');
      h.id = 'o-hero';
      var qa = isAdmin ? ['students', 'fees', 'admissions'] : ['teacher-selection', 'class-selection', 'data-view'];
      var ql = { students: 'Open students', fees: 'Fees', admissions: 'Admissions', 'teacher-selection': 'Staff directory', 'class-selection': 'Open a class', 'data-view': 'Class data' };
      var qi = { students: 'fa-graduation-cap', fees: 'fa-file-invoice-dollar', admissions: 'fa-user-plus', 'teacher-selection': 'fa-users', 'class-selection': 'fa-chalkboard', 'data-view': 'fa-database' };
      h.innerHTML = '<div><div class="o-hero-k" id="o-greet"></div><div class="o-hero-school" id="o-hero-school">Your school</div>' +
        '<div class="o-hero-meta"><span class="o-chip o-code" id="o-hero-code" style="display:none"></span><span class="o-chip" id="o-hero-date"></span></div></div>' +
        '<div class="o-quick">' + qa.map(function (id) { return '<button type="button" data-go="' + id + '"><i class="fas ' + qi[id] + '"></i>' + ql[id] + '</button>'; }).join('') + '</div>';
      host.insertBefore(h, host.firstChild);
      if (!isAdmin) {
        var sub = $('#subscription-panel', host), sum = $('#summary-cards', host);
        if (sub && sum && !$('#o-side', host)) { var side = document.createElement('div'); side.id = 'o-side'; sum.parentNode.insertBefore(side, sum); side.appendChild(sub); side.appendChild(sum); }
      }
      $$('.o-quick button', h).forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
      var hr = new Date().getHours();
      $('#o-greet', h).textContent = (hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening') + ' · ' + ROLE;
      $('#o-hero-date', h).textContent = new Date().toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    })();

    // ── Keep everything in step with the app ──────────────────────
    var KPI = { teachers: 'fa-chalkboard-teacher', students: 'fa-user-graduate', classes: 'fa-school', attendance: 'fa-calendar-check', revenue: 'fa-coins', grade: 'fa-chart-line', risk: 'fa-triangle-exclamation' };
    function iconize() {
      $$('.summary-card .sc-icon').forEach(function (ic) {
        if (ic.getAttribute('data-o')) return;
        var card = ic.parentNode, h = card && card.querySelector('h3'), k = clean(h ? h.textContent : '').toLowerCase(), cls = 'fa-circle';
        for (var key in KPI) { if (k.indexOf(key) > -1) { cls = KPI[key]; break; } }
        ic.innerHTML = '<i class="fas ' + cls + '"></i>'; ic.setAttribute('data-o', '1');
      });
      $$('.sub-icon').forEach(function (ic) {
        if (ic.getAttribute('data-o')) return;
        var p = ic.closest ? ic.closest('.subscription-panel') : null, c = p ? p.className : '';
        ic.innerHTML = '<i class="fas ' + (/expired/.test(c) ? 'fa-lock' : /pending/.test(c) ? 'fa-hourglass-half' : /expiring/.test(c) ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i>';
        ic.setAttribute('data-o', '1');
      });
    }
    function lightOnly() { var c = document.body.classList; if (c.contains('tmh-dark')) c.remove('tmh-dark'); if (c.contains('tma-dark')) c.remove('tma-dark'); }
    function currentLink() { return links.filter(function (l) { return l.classList.contains('active'); })[0] || links[0]; }
    function setText(sel, v) { $$(sel).forEach(function (e) { if (e.textContent !== v) e.textContent = v; }); }

    function sync() {
      iconize(); lightOnly();
      var l = currentLink();
      if (l) {
        var id = l.getAttribute('data-section'), title = TITLES[id] || clean(l.textContent) || NAMES[id] || 'Home';
        setText('.o-t1', title); setText('.o-ph-t', title); setText('.o-ph-s', SUBS[id] || '');
        $$('#o-tabs button, #o-nav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-go') === id); });
        document.documentElement.classList.toggle('o-home', id === 'dashboard');
        var secEl = isAdmin ? document.getElementById('section-' + id) : document.getElementById(id);
        if (secEl && id !== 'dashboard') {
          var tt = secEl.querySelector('.card-title, .card > h2, h2');
          if (tt && !tt.getAttribute('data-od')) {
            tt.setAttribute('data-od', '1');
            if (clean(tt.textContent).toLowerCase() === title.toLowerCase()) tt.classList.add('o-dup');
          }
        }
        $$('#o-actions > *').forEach(function (a) { a.classList.toggle('o-hide', a.getAttribute('data-o-for') !== id); });
      }
      var nameEl = $('#school-name-display-header') || $('#header-school-name');
      var nm = nameEl ? clean(nameEl.textContent) : '';
      if (nm) { setText('#o-foot-name', nm); setText('#o-hero-school', nm); }
      var cEl = $('#school-code-display');
      var code = cEl ? clean(cEl.textContent).replace(/^(school\s*)?code\s*[:\-]?\s*/i, '') : '';
      setText('#o-foot-code', code ? 'CODE · ' + code : '');
      var hc = $('#o-hero-code');
      if (hc) { setText('#o-hero-code', code ? 'Code · ' + code : ''); hc.style.display = code ? '' : 'none'; }
      if (cEl && cEl.parentNode && cEl.parentNode.parentNode && cEl.parentNode.parentNode.id === 'dashboard' && cEl.parentNode.style.display !== 'none') cEl.parentNode.style.display = 'none';
    }

    var queued = false, pend = [];
    function flush() {
      queued = false;
      var batch = pend; pend = [];
      try { batch.forEach(strip); } catch (e) { console.error('[Office strip]', e); }
      try { sync(); } catch (e) { console.error('[Office sync]', e); }
    }
    function enqueue(n) { pend.push(n); if (!queued) { queued = true; setTimeout(flush, 16); } }

    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'attributes') { enqueue(null); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) { var a = m.addedNodes[j]; if (a.nodeType === 1 || a.nodeType === 3) enqueue(a); }
        if (m.type === 'characterData') enqueue(m.target);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // observe() on the same node REPLACES earlier options for the same observer, so attributes get their own observer
    var mo2 = new MutationObserver(function () { enqueue(null); });
    mo2.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    links.forEach(function (l) { mo2.observe(l, { attributes: true, attributeFilter: ['class'] }); });

    strip(document.body);
    sync();
    window.addEventListener('resize', function () { if (window.innerWidth > 768) closeDrawer(); });
  } catch (err) {
    try { console.error('[Office shell]', err); } catch (_) {}
  }
})();
