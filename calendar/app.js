/* ============================================================
   Family Calendar Manager
   Vanilla JS single-page app. State lives in localStorage.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- constants ---------- */

  var STORAGE_KEY = "familyCalendar.v1";
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DAY_ABBR = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  var PALETTE = [
    "#e11d6b", "#7c3aed", "#2563eb", "#0891b2", "#059669",
    "#65a30d", "#d97706", "#dc2626", "#db2777", "#475569"
  ];

  /* ---------- tiny helpers ---------- */

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function hexToRgba(hex, a) {
    var h = (hex || "#000000").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function fmtTime(t) {
    if (!t) return "";
    var p = t.split(":");
    var h = parseInt(p[0], 10), m = p[1] || "00";
    if (isNaN(h)) return t;
    var ap = h >= 12 ? "PM" : "AM";
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ":" + m + " " + ap;
  }
  function timeRange(a) {
    if (a.start && a.end) return fmtTime(a.start) + " – " + fmtTime(a.end);
    if (a.start) return fmtTime(a.start);
    return "";
  }
  function minutesOf(t) {
    if (!t) return null;
    var p = t.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1] || "0", 10);
  }
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- seed data (from the family spreadsheet) ---------- */

  function seed() {
    var jashu = "p_jashu", anshu = "p_anshu";
    var C = {
      dance: "c_dance", academics: "c_acad", sports: "c_sports",
      homework: "c_hw", free: "c_free", music: "c_music", swim: "c_swim"
    };
    function act(day, personId, title, categoryId, extra) {
      var a = {
        id: uid("a"), day: day, personId: personId, title: title,
        categoryId: categoryId, start: "", end: "", location: "", notes: "", done: false
      };
      if (extra) for (var k in extra) a[k] = extra[k];
      return a;
    }
    function drv(day, driver, codes, notes) {
      return { id: uid("d"), day: day, driver: driver, codes: codes || "", time: "", notes: notes || "" };
    }

    return {
      version: 1,
      settings: {
        title: "Family Weekly Calendar",
        subtitle: "Activities, classes & carpool duties",
        weekStart: 0,
        theme: "light",
        showTimes: true,
        highlightToday: true
      },
      people: [
        { id: jashu, name: "Jashu", short: "J", color: "#7c3aed" },
        { id: anshu, name: "Anshu", short: "A", color: "#0891b2" }
      ],
      categories: [
        { id: C.dance, name: "Dance", color: "#e11d6b" },
        { id: C.academics, name: "Academics", color: "#2563eb" },
        { id: C.sports, name: "Sports", color: "#059669" },
        { id: C.homework, name: "Homework", color: "#d97706" },
        { id: C.free, name: "Free Day", color: "#64748b" },
        { id: C.music, name: "Bollywood", color: "#db2777" },
        { id: C.swim, name: "Swimming", color: "#0891b2" }
      ],
      activities: [
        // Sunday
        act(0, jashu, "Free Day / No class", C.free),
        act(0, jashu, "Dance Practice - K", C.dance),
        act(0, jashu, "HW Completion", C.homework),
        act(0, anshu, "Free Day / No class", C.free),
        // Monday
        act(1, jashu, "Agenda check", C.homework),
        act(1, jashu, "English - Curie", C.academics),
        act(1, anshu, "BB / Curie", C.sports),
        // Tuesday
        act(2, jashu, "Dance Practice - B", C.dance),
        act(2, jashu, "Algebra 1 - Curie", C.academics),
        act(2, anshu, "Free Day / No class", C.free),
        // Wednesday
        act(3, jashu, "Free Day / No class", C.free),
        act(3, jashu, "HW Completion", C.homework),
        act(3, jashu, "Dance Practice - B", C.dance),
        act(3, anshu, "Basket Ball", C.sports),
        // Thursday
        act(4, jashu, "Dance Practice - K", C.dance),
        act(4, jashu, "Bollywood - TheBollyFactor", C.music, { location: "TheBollyFactor" }),
        act(4, anshu, "Bollywood - StudioDoom", C.music, { location: "StudioDoom" }),
        // Friday
        act(5, jashu, "Kuchipudi - Anu Aunty", C.dance, { location: "Anu Aunty" }),
        act(5, jashu, "Agenda Revision", C.homework),
        act(5, anshu, "Curie", C.academics),
        // Saturday
        act(6, jashu, "Swimming", C.swim),
        act(6, jashu, "Complete HW", C.homework),
        act(6, anshu, "Swimming", C.swim)
      ],
      drivers: [
        drv(0, "No one", "", "Free day"),
        drv(1, "Mom", "JD/JP/DD"),
        drv(1, "Dad", "DP"),
        drv(2, "Sahi", "JD/JP"),
        drv(3, "Sahi", "DD/DP"),
        drv(4, "Dad", "JD/JP"),
        drv(5, "Mom", "JD"),
        drv(5, "Sahi", "JP"),
        drv(6, "Dad", "JDD/JDP")
      ],
      legend: [
        { id: uid("k"), code: "J", meaning: "Jashu" },
        { id: uid("k"), code: "1stD", meaning: "Anshu" },
        { id: uid("k"), code: "2ndD", meaning: "Drop Off" },
        { id: uid("k"), code: "P", meaning: "Pick Up" },
        { id: uid("k"), code: "D", meaning: "Drop" }
      ]
    };
  }

  /* ---------- state + persistence ---------- */

  var state = null;
  var undoStack = [];
  var redoStack = [];
  var ui = { view: "week", search: "", category: "", hiddenPeople: {} };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return normalize(data);
    } catch (e) {
      console.warn("Could not read saved calendar:", e);
      return null;
    }
  }

  function normalize(data) {
    if (!data || typeof data !== "object") return null;
    var base = seed();
    data.settings = Object.assign({}, base.settings, data.settings || {});
    ["people", "categories", "activities", "drivers", "legend"].forEach(function (k) {
      if (!Array.isArray(data[k])) data[k] = [];
    });
    data.activities.forEach(function (a) {
      a.day = Math.max(0, Math.min(6, parseInt(a.day, 10) || 0));
      if (!a.id) a.id = uid("a");
    });
    data.drivers.forEach(function (d) {
      d.day = Math.max(0, Math.min(6, parseInt(d.day, 10) || 0));
      if (!d.id) d.id = uid("d");
    });
    return data;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      var el = $("#saveStamp");
      if (el) el.textContent = "saved " + new Date().toLocaleTimeString();
    } catch (e) {
      toast("Could not save — browser storage is full or blocked.");
    }
  }

  /** Snapshot current state so the change can be undone, then run fn. */
  function commit(fn, message) {
    undoStack.push(clone(state));
    if (undoStack.length > 60) undoStack.shift();
    redoStack.length = 0;
    fn();
    save();
    render();
    if (message) toast(message);
  }

  function undo() {
    if (!undoStack.length) return toast("Nothing to undo");
    redoStack.push(clone(state));
    state = undoStack.pop();
    save(); render(); toast("Undone");
  }
  function redo() {
    if (!redoStack.length) return toast("Nothing to redo");
    undoStack.push(clone(state));
    state = redoStack.pop();
    save(); render(); toast("Redone");
  }

  /* ---------- lookups ---------- */

  function person(id) {
    for (var i = 0; i < state.people.length; i++) if (state.people[i].id === id) return state.people[i];
    return { id: id, name: "Unassigned", short: "?", color: "#94a3b8" };
  }
  function category(id) {
    for (var i = 0; i < state.categories.length; i++) if (state.categories[i].id === id) return state.categories[i];
    return { id: "", name: "", color: "#94a3b8" };
  }
  function activity(id) {
    for (var i = 0; i < state.activities.length; i++) if (state.activities[i].id === id) return state.activities[i];
    return null;
  }
  function driver(id) {
    for (var i = 0; i < state.drivers.length; i++) if (state.drivers[i].id === id) return state.drivers[i];
    return null;
  }
  function dayOrder() {
    var start = parseInt(state.settings.weekStart, 10) || 0;
    var out = [];
    for (var i = 0; i < 7; i++) out.push((start + i) % 7);
    return out;
  }
  function matchesFilter(a) {
    if (ui.hiddenPeople[a.personId]) return false;
    if (ui.category && a.categoryId !== ui.category) return false;
    if (ui.search) {
      var hay = (a.title + " " + (a.location || "") + " " + (a.notes || "") + " " +
        person(a.personId).name + " " + category(a.categoryId).name).toLowerCase();
      if (hay.indexOf(ui.search.toLowerCase()) === -1) return false;
    }
    return true;
  }
  function activitiesFor(day, personId) {
    return state.activities
      .filter(function (a) { return a.day === day && (!personId || a.personId === personId); })
      .sort(function (x, y) {
        var mx = minutesOf(x.start), my = minutesOf(y.start);
        if (mx === null && my === null) return 0;
        if (mx === null) return 1;
        if (my === null) return -1;
        return mx - my;
      });
  }

  /* ---------- toasts ---------- */

  function toast(msg, actionLabel, actionFn) {
    var stack = $("#toasts");
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = "<span>" + esc(msg) + "</span>";
    if (actionLabel) {
      var b = document.createElement("button");
      b.textContent = actionLabel;
      b.onclick = function () { t.remove(); actionFn(); };
      t.appendChild(b);
    }
    stack.appendChild(t);
    setTimeout(function () { t.remove(); }, actionLabel ? 7000 : 2600);
  }

  /* ============================================================
     RENDERING
     ============================================================ */

  function render() {
    document.documentElement.setAttribute("data-theme", state.settings.theme === "dark" ? "dark" : "light");
    $("#calTitle").textContent = state.settings.title;
    $("#calSub").textContent = state.settings.subtitle;
    document.title = state.settings.title + " · Calendar Manager";

    renderPersonFilter();
    renderCategoryFilter();

    $$(".vbtn").forEach(function (b) { b.classList.toggle("is-active", b.dataset.view === ui.view); });
    ["week", "agenda", "person", "drivers", "stats"].forEach(function (v) {
      $("#view-" + v).classList.toggle("hidden", v !== ui.view);
    });

    if (ui.view === "week") renderWeek();
    else if (ui.view === "agenda") renderAgenda();
    else if (ui.view === "person") renderPersonBoard();
    else if (ui.view === "drivers") renderDrivers();
    else if (ui.view === "stats") renderStats();

    $("#btnUndo").disabled = !undoStack.length;
    $("#btnRedo").disabled = !redoStack.length;
  }

  function renderPersonFilter() {
    $("#personFilter").innerHTML = state.people.map(function (p) {
      var off = ui.hiddenPeople[p.id] ? " off" : "";
      return '<button class="chip' + off + '" data-toggle-person="' + esc(p.id) + '">' +
        '<span class="dot" style="background:' + esc(p.color) + '"></span>' + esc(p.name) + "</button>";
    }).join("");
  }

  function renderCategoryFilter() {
    var sel = $("#categoryFilter");
    sel.innerHTML = '<option value="">All categories</option>' + state.categories.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>";
    }).join("");
    sel.value = ui.category;
  }

  function cardHtml(a) {
    var c = category(a.categoryId);
    var visible = matchesFilter(a);
    var bits = [];
    if (state.settings.showTimes && timeRange(a)) bits.push(esc(timeRange(a)));
    if (a.location) bits.push("@ " + esc(a.location));
    var meta = "";
    if (c.name) meta += '<span class="tag">' + esc(c.name) + "</span>";
    if (bits.length) meta += "<span>" + bits.join(" · ") + "</span>";

    return '<div class="card' + (visible ? "" : " dim") + '" draggable="true" data-act="edit-activity" data-id="' + esc(a.id) + '"' +
      ' style="--cardcolor:' + esc(c.color) + ";--cardsoft:" + hexToRgba(c.color, .14) + '"' +
      ' title="' + esc(a.notes || a.title) + '">' +
      '<div class="card-title">' + esc(a.title) + "</div>" +
      (meta ? '<div class="card-meta">' + meta + "</div>" : "") +
      '<div class="card-actions">' +
      '<button data-act="edit-activity" data-id="' + esc(a.id) + '" title="Edit">&#9998;</button>' +
      '<button data-act="dup-activity" data-id="' + esc(a.id) + '" title="Duplicate">&#10697;</button>' +
      '<button data-act="del-activity" data-id="' + esc(a.id) + '" title="Delete">&#10005;</button>' +
      "</div></div>";
  }

  function renderWeek() {
    var today = new Date().getDay();
    var visiblePeople = state.people.filter(function (p) { return !ui.hiddenPeople[p.id]; });

    $("#weekGrid").innerHTML = dayOrder().map(function (d) {
      var isToday = state.settings.highlightToday && d === today;
      var dayActs = activitiesFor(d).filter(matchesFilter);

      var blocks = visiblePeople.map(function (p) {
        var list = activitiesFor(d, p.id).filter(matchesFilter);
        var cards = list.length
          ? list.map(cardHtml).join("")
          : '<button class="empty-slot" data-act="new-activity" data-day="' + d + '" data-person="' + esc(p.id) + '">+ add</button>';
        return '<div class="person-block" data-drop="1" data-day="' + d + '" data-person="' + esc(p.id) + '">' +
          '<div class="person-label"><span class="dot" style="background:' + esc(p.color) + '"></span>' +
          esc(p.name) +
          '<button class="add" data-act="new-activity" data-day="' + d + '" data-person="' + esc(p.id) + '" title="Add activity">+</button>' +
          "</div>" + cards + "</div>";
      }).join("");

      var duties = state.drivers.filter(function (x) { return x.day === d; });
      var driverHtml = '<div class="driver-strip"><h4>Driver</h4>' +
        (duties.length ? duties.map(function (x) {
          return '<div class="driver-line" data-act="edit-driver" data-id="' + esc(x.id) + '">' +
            '<span class="who">' + esc(x.driver) + "</span>" +
            (x.codes ? '<span class="codes">' + esc(x.codes) + "</span>" : "") +
            (x.time ? '<span class="codes">' + esc(fmtTime(x.time)) + "</span>" : "") +
            "</div>";
        }).join("") : '<div class="driver-line muted" data-act="new-driver" data-day="' + d + '">+ assign a driver</div>') +
        "</div>";

      return '<section class="day-col' + (isToday ? " is-today" : "") + '" data-day="' + d + '">' +
        '<div class="day-head"><h3>' + DAYS[d] + '</h3><span class="count">' + dayActs.length + "</span></div>" +
        '<div class="day-body">' + (blocks || '<p class="muted small">All people are filtered out.</p>') + "</div>" +
        driverHtml +
        "</section>";
    }).join("");

    wireDragDrop();
  }

  function renderAgenda() {
    var today = new Date().getDay();
    $("#agendaList").innerHTML = dayOrder().map(function (d) {
      var list = activitiesFor(d).filter(matchesFilter);
      var duties = state.drivers.filter(function (x) { return x.day === d; });
      var rows = list.map(function (a) {
        var p = person(a.personId), c = category(a.categoryId);
        return '<div class="agenda-row" data-act="edit-activity" data-id="' + esc(a.id) + '">' +
          '<div class="agenda-time">' + (timeRange(a) ? esc(timeRange(a)) : "&mdash;") + "</div>" +
          '<div class="agenda-person"><span class="dot" style="background:' + esc(p.color) + '"></span>' + esc(p.name) + "</div>" +
          '<div class="agenda-what">' + esc(a.title) +
          (a.location || a.notes ? '<div class="sub">' + esc([a.location, a.notes].filter(Boolean).join(" · ")) + "</div>" : "") +
          "</div>" +
          '<div><span class="pill" style="background:' + hexToRgba(c.color, .14) + ";color:" + esc(c.color) + '">' + esc(c.name || "—") + "</span></div>" +
          "</div>";
      }).join("");

      return '<article class="agenda-day">' +
        "<header><h3>" + DAYS[d] + (d === today && state.settings.highlightToday ? ' <span class="pill">today</span>' : "") + "</h3>" +
        '<span class="muted small">' + list.length + (list.length === 1 ? " activity" : " activities") +
        (duties.length ? " · Driver: " + esc(duties.map(function (x) { return x.driver + (x.codes ? " (" + x.codes + ")" : ""); }).join(", ")) : "") +
        "</span>" +
        '<button class="btn btn-sm btn-ghost" style="margin-left:auto" data-act="new-activity" data-day="' + d + '">+ Add</button>' +
        "</header>" +
        (rows || '<div class="agenda-row"><span class="muted small">Nothing scheduled.</span></div>') +
        "</article>";
    }).join("");
  }

  function renderPersonBoard() {
    var visiblePeople = state.people.filter(function (p) { return !ui.hiddenPeople[p.id]; });
    if (!visiblePeople.length) {
      $("#personBoard").innerHTML = '<p class="muted">No people to show. Add one from the People manager.</p>';
      return;
    }
    $("#personBoard").innerHTML = visiblePeople.map(function (p) {
      var total = state.activities.filter(function (a) { return a.personId === p.id; }).length;
      var days = dayOrder().map(function (d) {
        var list = activitiesFor(d, p.id).filter(matchesFilter);
        var items = list.length ? list.map(function (a) {
          var c = category(a.categoryId);
          return '<button class="mini" data-act="edit-activity" data-id="' + esc(a.id) + '">' +
            '<span class="swatch" style="background:' + esc(c.color) + '"></span>' + esc(a.title) +
            (state.settings.showTimes && a.start ? " · " + esc(fmtTime(a.start)) : "") + "</button>";
        }).join("") :
          '<button class="mini muted" data-act="new-activity" data-day="' + d + '" data-person="' + esc(p.id) + '">+ add</button>';
        return '<div class="pday"><h4>' + DAYS[d] + "</h4>" + '<div class="items">' + items + "</div></div>";
      }).join("");

      return '<article class="person-card">' +
        '<header style="background:' + esc(p.color) + '"><div><h3>' + esc(p.name) + "</h3>" +
        '<div class="sub">' + total + " activities this week</div></div>" +
        '<button class="btn btn-sm" data-act="new-activity" data-person="' + esc(p.id) + '">+ Add</button>' +
        "</header><div class=\"pweek\">" + days + "</div></article>";
    }).join("");
  }

  function renderDrivers() {
    $("#driverGrid").innerHTML = dayOrder().map(function (d) {
      var duties = state.drivers.filter(function (x) { return x.day === d; });
      var items = duties.length ? duties.map(function (x) {
        return '<li class="driver-item"><div class="grow"><strong>' + esc(x.driver) + "</strong>" +
          '<span class="codes">' + esc([x.codes, x.time ? fmtTime(x.time) : "", x.notes].filter(Boolean).join(" · ") || "—") + "</span></div>" +
          '<div class="row-actions">' +
          '<button data-act="edit-driver" data-id="' + esc(x.id) + '" title="Edit">&#9998;</button>' +
          '<button data-act="del-driver" data-id="' + esc(x.id) + '" title="Delete">&#10005;</button>' +
          "</div></li>";
      }).join("") : '<li class="driver-item"><span class="muted">No driver assigned</span></li>';

      return '<section class="driver-card"><header>' + DAYS[d] +
        '<button class="btn btn-sm btn-ghost" data-act="new-driver" data-day="' + d + '">+</button></header>' +
        "<ul>" + items + "</ul></section>";
    }).join("");

    $("#legendList").innerHTML = state.legend.length ? state.legend.map(function (k) {
      return '<span class="legend-item"><code>' + esc(k.code) + "</code>" + esc(k.meaning) +
        '<button data-act="del-key" data-id="' + esc(k.id) + '" title="Remove">&times;</button></span>';
    }).join("") : '<span class="muted small">No codes yet — add one to explain shorthand like “JD” or “JP”.</span>';
  }

  function bars(rows, colorFn) {
    var max = rows.reduce(function (m, r) { return Math.max(m, r.value); }, 0) || 1;
    if (!rows.length) return '<p class="muted small">No data yet.</p>';
    return rows.map(function (r) {
      return '<div class="bar-row"><span>' + esc(r.label) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.round(r.value / max * 100) + "%;background:" +
        esc(colorFn ? colorFn(r) : "var(--accent)") + '"></span></span>' +
        '<span class="n">' + r.value + "</span></div>";
    }).join("");
  }

  function renderStats() {
    var acts = state.activities;
    var scheduledMinutes = acts.reduce(function (sum, a) {
      var s = minutesOf(a.start), e = minutesOf(a.end);
      return (s !== null && e !== null && e > s) ? sum + (e - s) : sum;
    }, 0);
    var perDay = DAYS.map(function (name, d) {
      return { label: name, value: acts.filter(function (a) { return a.day === d; }).length };
    });
    var busiest = perDay.slice().sort(function (a, b) { return b.value - a.value; })[0];
    var freeDays = perDay.filter(function (r) { return r.value === 0; }).length;

    $("#statCards").innerHTML = [
      { label: "Activities", value: acts.length, hint: "across the week" },
      { label: "People", value: state.people.length, hint: state.people.map(function (p) { return p.name; }).join(", ") },
      { label: "Busiest day", value: busiest ? busiest.label : "—", hint: busiest ? busiest.value + " activities" : "" },
      { label: "Scheduled time", value: (scheduledMinutes / 60).toFixed(1) + "h", hint: "only counts items with start & end" },
      { label: "Driver duties", value: state.drivers.length, hint: freeDays + " day(s) with nothing scheduled" }
    ].map(function (s) {
      return '<div class="stat"><div class="label">' + esc(s.label) + '</div><div class="value">' + esc(s.value) +
        '</div><div class="hint">' + esc(s.hint) + "</div></div>";
    }).join("");

    $("#barsDay").innerHTML = bars(dayOrder().map(function (d) { return perDay[d]; }));
    $("#barsPerson").innerHTML = bars(state.people.map(function (p) {
      return { label: p.name, value: acts.filter(function (a) { return a.personId === p.id; }).length, color: p.color };
    }), function (r) { return r.color; });
    $("#barsCategory").innerHTML = bars(state.categories.map(function (c) {
      return { label: c.name, value: acts.filter(function (a) { return a.categoryId === c.id; }).length, color: c.color };
    }).filter(function (r) { return r.value > 0; }), function (r) { return r.color; });

    var byDriver = {};
    state.drivers.forEach(function (x) {
      var key = (x.driver || "—").trim();
      byDriver[key] = (byDriver[key] || 0) + 1;
    });
    $("#barsDriver").innerHTML = bars(Object.keys(byDriver).map(function (k) {
      return { label: k, value: byDriver[k] };
    }).sort(function (a, b) { return b.value - a.value; }));
  }

  /* ---------- drag & drop ---------- */

  var dragId = null;
  function wireDragDrop() {
    $$("#weekGrid .card").forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        dragId = card.dataset.id;
        card.classList.add("dragging");
        try { e.dataTransfer.setData("text/plain", dragId); } catch (err) {}
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("dragging");
        dragId = null;
        $$(".drag-over").forEach(function (n) { n.classList.remove("drag-over"); });
      });
    });

    $$("#weekGrid [data-drop]").forEach(function (zone) {
      zone.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        zone.closest(".day-col").classList.add("drag-over");
      });
      zone.addEventListener("dragleave", function () {
        zone.closest(".day-col").classList.remove("drag-over");
      });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        var id = dragId || e.dataTransfer.getData("text/plain");
        var a = id && activity(id);
        if (!a) return;
        var day = parseInt(zone.dataset.day, 10);
        var pid = zone.dataset.person;
        if (a.day === day && a.personId === pid) { render(); return; }
        commit(function () { a.day = day; a.personId = pid; },
          "Moved “" + a.title + "” to " + DAYS[day] + " · " + person(pid).name);
      });
    });
  }

  /* ============================================================
     MODALS
     ============================================================ */

  var modalCleanup = null;

  function openModal(opts) {
    $("#modalTitle").textContent = opts.title;
    $("#modalBody").innerHTML = opts.body;
    $("#modalFoot").innerHTML = opts.footer || "";
    $("#modal").hidden = false;
    modalCleanup = opts.onClose || null;
    if (opts.onOpen) opts.onOpen();
    var first = $("#modalBody input, #modalBody select, #modalBody textarea");
    if (first) first.focus();
  }
  function closeModal() {
    $("#modal").hidden = true;
    $("#modalBody").innerHTML = "";
    if (modalCleanup) { var f = modalCleanup; modalCleanup = null; f(); }
  }

  function personOptions(selected) {
    return state.people.map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (p.id === selected ? " selected" : "") + ">" + esc(p.name) + "</option>";
    }).join("");
  }
  function categoryOptions(selected) {
    return '<option value="">— none —</option>' + state.categories.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === selected ? " selected" : "") + ">" + esc(c.name) + "</option>";
    }).join("");
  }
  function dayOptions(selected) {
    return DAYS.map(function (name, i) {
      return '<option value="' + i + '"' + (i === selected ? " selected" : "") + ">" + name + "</option>";
    }).join("");
  }

  /* ---- activity editor ---- */

  function openActivityModal(existing, presetDay, presetPerson) {
    var a = existing || {
      id: null, title: "", personId: presetPerson || (state.people[0] || {}).id,
      day: typeof presetDay === "number" ? presetDay : new Date().getDay(),
      categoryId: "", start: "", end: "", location: "", notes: "", repeatDays: []
    };

    var repeatBoxes = DAYS.map(function (name, i) {
      return '<label class="check" style="margin:0"><input type="checkbox" class="rep" value="' + i + '"> <span>' + name.slice(0, 3) + "</span></label>";
    }).join("");

    openModal({
      title: existing ? "Edit activity" : "New activity",
      body:
        '<label class="field"><span>Activity</span><input type="text" id="fTitle" value="' + esc(a.title) + '" placeholder="e.g. Algebra 1 - Curie" /></label>' +
        '<div class="grid2">' +
        '<label class="field"><span>Person</span><select id="fPerson">' + personOptions(a.personId) + "</select></label>" +
        '<label class="field"><span>Day</span><select id="fDay">' + dayOptions(a.day) + "</select></label>" +
        "</div>" +
        '<div class="grid2">' +
        '<label class="field"><span>Category</span><select id="fCat">' + categoryOptions(a.categoryId) + "</select></label>" +
        '<label class="field"><span>Location / teacher</span><input type="text" id="fLoc" value="' + esc(a.location) + '" placeholder="Optional" /></label>' +
        "</div>" +
        '<div class="grid2">' +
        '<label class="field"><span>Start time</span><input type="time" id="fStart" value="' + esc(a.start) + '" /></label>' +
        '<label class="field"><span>End time</span><input type="time" id="fEnd" value="' + esc(a.end) + '" /></label>' +
        "</div>" +
        '<label class="field"><span>Notes</span><textarea id="fNotes" placeholder="Anything worth remembering">' + esc(a.notes) + "</textarea></label>" +
        (existing ? "" :
          '<div class="field"><span>Also repeat on</span><div style="display:flex;flex-wrap:wrap;gap:10px">' + repeatBoxes + "</div></div>" +
          '<p class="hintline">Tick extra days to create the same activity more than once.</p>'),
      footer:
        (existing ? '<button class="btn btn-danger spacer" id="fDelete">Delete</button>' : '<span class="spacer"></span>') +
        '<button class="btn" data-close-modal>Cancel</button>' +
        '<button class="btn btn-primary" id="fSave">' + (existing ? "Save changes" : "Add activity") + "</button>",
      onOpen: function () {
        function collect() {
          return {
            title: $("#fTitle").value.trim(),
            personId: $("#fPerson").value,
            day: parseInt($("#fDay").value, 10),
            categoryId: $("#fCat").value,
            location: $("#fLoc").value.trim(),
            start: $("#fStart").value,
            end: $("#fEnd").value,
            notes: $("#fNotes").value.trim()
          };
        }
        function submit() {
          var v = collect();
          if (!v.title) { $("#fTitle").focus(); return toast("Give the activity a name first."); }
          if (v.start && v.end && minutesOf(v.end) <= minutesOf(v.start)) return toast("End time must be after the start time.");

          if (existing) {
            commit(function () { Object.assign(existing, v); }, "Updated “" + v.title + "”");
          } else {
            var extraDays = $$("#modalBody .rep").filter(function (c) { return c.checked; })
              .map(function (c) { return parseInt(c.value, 10); });
            var days = [v.day].concat(extraDays.filter(function (d) { return d !== v.day; }));
            commit(function () {
              days.forEach(function (d) {
                state.activities.push(Object.assign({ id: uid("a"), done: false }, v, { day: d }));
              });
            }, "Added “" + v.title + "”" + (days.length > 1 ? " on " + days.length + " days" : ""));
          }
          closeModal();
        }
        $("#fSave").onclick = submit;
        $("#modalBody").addEventListener("keydown", function (e) {
          if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); submit(); }
        });
        if (existing) {
          $("#fDelete").onclick = function () {
            closeModal();
            deleteActivity(existing.id);
          };
        }
      }
    });
  }

  function deleteActivity(id) {
    var a = activity(id);
    if (!a) return;
    var snapshot = clone(a);
    commit(function () {
      state.activities = state.activities.filter(function (x) { return x.id !== id; });
    });
    toast("Deleted “" + snapshot.title + "”", "Undo", undo);
  }

  /* ---- driver editor ---- */

  function openDriverModal(existing, presetDay) {
    var d = existing || { id: null, day: typeof presetDay === "number" ? presetDay : 1, driver: "", codes: "", time: "", notes: "" };
    openModal({
      title: existing ? "Edit driver duty" : "New driver duty",
      body:
        '<div class="grid2">' +
        '<label class="field"><span>Day</span><select id="dDay">' + dayOptions(d.day) + "</select></label>" +
        '<label class="field"><span>Driver</span><input type="text" id="dWho" value="' + esc(d.driver) + '" placeholder="Mom / Dad / Sahi" /></label>' +
        "</div>" +
        '<div class="grid2">' +
        '<label class="field"><span>Duty codes</span><input type="text" id="dCodes" value="' + esc(d.codes) + '" placeholder="JD/JP/DD" /></label>' +
        '<label class="field"><span>Time</span><input type="time" id="dTime" value="' + esc(d.time) + '" /></label>' +
        "</div>" +
        '<label class="field"><span>Notes</span><input type="text" id="dNotes" value="' + esc(d.notes) + '" placeholder="Optional" /></label>' +
        '<p class="hintline">Codes are free text — define what they mean in the Code Key below the carpool board.</p>',
      footer:
        (existing ? '<button class="btn btn-danger spacer" id="dDelete">Delete</button>' : '<span class="spacer"></span>') +
        '<button class="btn" data-close-modal>Cancel</button>' +
        '<button class="btn btn-primary" id="dSave">Save</button>',
      onOpen: function () {
        $("#dSave").onclick = function () {
          var v = {
            day: parseInt($("#dDay").value, 10),
            driver: $("#dWho").value.trim(),
            codes: $("#dCodes").value.trim(),
            time: $("#dTime").value,
            notes: $("#dNotes").value.trim()
          };
          if (!v.driver) { $("#dWho").focus(); return toast("Who is driving?"); }
          if (existing) commit(function () { Object.assign(existing, v); }, "Driver duty updated");
          else commit(function () { state.drivers.push(Object.assign({ id: uid("d") }, v)); }, "Driver duty added");
          closeModal();
        };
        if (existing) {
          $("#dDelete").onclick = function () {
            closeModal();
            commit(function () {
              state.drivers = state.drivers.filter(function (x) { return x.id !== existing.id; });
            });
            toast("Driver duty removed", "Undo", undo);
          };
        }
      }
    });
  }

  /* ---- people manager ---- */

  function openPeopleModal() {
    function rows() {
      return state.people.map(function (p, i) {
        return '<div class="editable-row" data-id="' + esc(p.id) + '">' +
          '<input type="color" value="' + esc(p.color) + '" class="pColor" style="width:34px;height:30px;padding:2px;border-radius:6px" />' +
          '<input type="text" class="pName" value="' + esc(p.name) + '" style="flex:1" />' +
          '<input type="text" class="pShort" value="' + esc(p.short || "") + '" placeholder="J" style="width:56px" />' +
          '<button class="btn btn-sm btn-danger" data-remove-person="' + esc(p.id) + '">Remove</button>' +
          "</div>";
      }).join("");
    }
    openModal({
      title: "People",
      body: '<div class="editable-list" id="peopleList">' + (state.people.length ? rows() : '<p class="muted small">No people yet.</p>') + "</div>" +
        '<button class="btn btn-sm" id="pAdd">+ Add person</button>' +
        '<p class="hintline" style="margin-top:12px">Removing a person also removes their activities.</p>',
      footer: '<span class="spacer"></span><button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="pSave">Save</button>',
      onOpen: function () {
        var pending = clone(state.people);
        function repaint() {
          $("#peopleList").innerHTML = pending.map(function (p) {
            return '<div class="editable-row" data-id="' + esc(p.id) + '">' +
              '<input type="color" value="' + esc(p.color) + '" class="pColor" style="width:34px;height:30px;padding:2px;border-radius:6px" />' +
              '<input type="text" class="pName" value="' + esc(p.name) + '" style="flex:1" />' +
              '<input type="text" class="pShort" value="' + esc(p.short || "") + '" placeholder="J" style="width:56px" />' +
              '<button class="btn btn-sm btn-danger" data-remove-person="' + esc(p.id) + '">Remove</button>' +
              "</div>";
          }).join("") || '<p class="muted small">No people yet.</p>';
        }
        function harvest() {
          $$("#peopleList .editable-row").forEach(function (row) {
            var p = pending.filter(function (x) { return x.id === row.dataset.id; })[0];
            if (!p) return;
            p.name = $(".pName", row).value.trim() || p.name;
            p.short = $(".pShort", row).value.trim();
            p.color = $(".pColor", row).value;
          });
        }
        repaint();
        $("#peopleList").addEventListener("click", function (e) {
          var btn = e.target.closest("[data-remove-person]");
          if (!btn) return;
          harvest();
          pending = pending.filter(function (x) { return x.id !== btn.dataset.removePerson; });
          repaint();
        });
        $("#pAdd").onclick = function () {
          harvest();
          pending.push({ id: uid("p"), name: "New person", short: "", color: PALETTE[pending.length % PALETTE.length] });
          repaint();
        };
        $("#pSave").onclick = function () {
          harvest();
          var keep = {};
          pending.forEach(function (p) { keep[p.id] = true; });
          commit(function () {
            state.people = pending;
            state.activities = state.activities.filter(function (a) { return keep[a.personId]; });
            Object.keys(ui.hiddenPeople).forEach(function (k) { if (!keep[k]) delete ui.hiddenPeople[k]; });
          }, "People updated");
          closeModal();
        };
      }
    });
  }

  /* ---- category manager ---- */

  function openCategoriesModal() {
    openModal({
      title: "Categories",
      body: '<div class="editable-list" id="catList"></div>' +
        '<button class="btn btn-sm" id="cAdd">+ Add category</button>' +
        '<p class="hintline" style="margin-top:12px">Activities using a removed category simply lose their colour tag.</p>',
      footer: '<span class="spacer"></span><button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="cSave">Save</button>',
      onOpen: function () {
        var pending = clone(state.categories);
        function repaint() {
          $("#catList").innerHTML = pending.map(function (c) {
            var used = state.activities.filter(function (a) { return a.categoryId === c.id; }).length;
            return '<div class="editable-row" data-id="' + esc(c.id) + '">' +
              '<input type="color" value="' + esc(c.color) + '" class="cColor" style="width:34px;height:30px;padding:2px;border-radius:6px" />' +
              '<input type="text" class="cName" value="' + esc(c.name) + '" style="flex:1" />' +
              '<span class="meta">' + used + " used</span>" +
              '<button class="btn btn-sm btn-danger" data-remove-cat="' + esc(c.id) + '">Remove</button>' +
              "</div>";
          }).join("") || '<p class="muted small">No categories yet.</p>';
        }
        function harvest() {
          $$("#catList .editable-row").forEach(function (row) {
            var c = pending.filter(function (x) { return x.id === row.dataset.id; })[0];
            if (!c) return;
            c.name = $(".cName", row).value.trim() || c.name;
            c.color = $(".cColor", row).value;
          });
        }
        repaint();
        $("#catList").addEventListener("click", function (e) {
          var btn = e.target.closest("[data-remove-cat]");
          if (!btn) return;
          harvest();
          pending = pending.filter(function (x) { return x.id !== btn.dataset.removeCat; });
          repaint();
        });
        $("#cAdd").onclick = function () {
          harvest();
          pending.push({ id: uid("c"), name: "New category", color: PALETTE[pending.length % PALETTE.length] });
          repaint();
        };
        $("#cSave").onclick = function () {
          harvest();
          var keep = {};
          pending.forEach(function (c) { keep[c.id] = true; });
          commit(function () {
            state.categories = pending;
            state.activities.forEach(function (a) { if (a.categoryId && !keep[a.categoryId]) a.categoryId = ""; });
            if (ui.category && !keep[ui.category]) ui.category = "";
          }, "Categories updated");
          closeModal();
        };
      }
    });
  }

  /* ---- key/legend ---- */

  function openKeyModal() {
    openModal({
      title: "Add code",
      body: '<div class="grid2">' +
        '<label class="field"><span>Code</span><input type="text" id="kCode" placeholder="JD" /></label>' +
        '<label class="field"><span>Meaning</span><input type="text" id="kMean" placeholder="Jashu drop-off" /></label></div>',
      footer: '<span class="spacer"></span><button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="kSave">Add</button>',
      onOpen: function () {
        $("#kSave").onclick = function () {
          var code = $("#kCode").value.trim(), mean = $("#kMean").value.trim();
          if (!code) return toast("Enter a code.");
          commit(function () { state.legend.push({ id: uid("k"), code: code, meaning: mean }); }, "Code added");
          closeModal();
        };
      }
    });
  }

  /* ============================================================
     IMPORT / EXPORT
     ============================================================ */

  function exportJson() {
    download("family-calendar.json", JSON.stringify(state, null, 2), "application/json");
    toast("Calendar exported");
  }

  function exportCsv() {
    var rows = [["Day", "Person", "Activity", "Category", "Start", "End", "Location", "Notes"]];
    dayOrder().forEach(function (d) {
      activitiesFor(d).forEach(function (a) {
        rows.push([DAYS[d], person(a.personId).name, a.title, category(a.categoryId).name,
          a.start || "", a.end || "", a.location || "", a.notes || ""]);
      });
    });
    rows.push([]);
    rows.push(["Day", "Driver", "Codes", "Time", "Notes"]);
    dayOrder().forEach(function (d) {
      state.drivers.filter(function (x) { return x.day === d; }).forEach(function (x) {
        rows.push([DAYS[d], x.driver, x.codes || "", x.time || "", x.notes || ""]);
      });
    });
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
    download("family-calendar.csv", csv, "text/csv;charset=utf-8");
    toast("CSV exported");
  }

  function exportIcs() {
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function stamp(dt) {
      return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + "T" +
        pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + "00Z";
    }
    function nextDate(day, time) {
      var now = new Date();
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7));
      var p = (time || "09:00").split(":");
      d.setHours(parseInt(p[0], 10) || 9, parseInt(p[1], 10) || 0, 0, 0);
      return d;
    }
    function fold(line) {
      var out = [], s = line;
      while (s.length > 73) { out.push(s.slice(0, 73)); s = " " + s.slice(73); }
      out.push(s);
      return out.join("\r\n");
    }
    function escIcs(s) {
      return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    }

    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Family Calendar Manager//EN", "CALSCALE:GREGORIAN"];
    var now = new Date();
    state.activities.forEach(function (a) {
      var start = nextDate(a.day, a.start || "09:00");
      var end = new Date(start.getTime());
      if (a.start && a.end && minutesOf(a.end) > minutesOf(a.start)) {
        end = new Date(start.getTime() + (minutesOf(a.end) - minutesOf(a.start)) * 60000);
      } else {
        end = new Date(start.getTime() + 60 * 60000);
      }
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + a.id + "@family-calendar");
      lines.push("DTSTAMP:" + stamp(now));
      lines.push("DTSTART:" + stamp(start));
      lines.push("DTEND:" + stamp(end));
      lines.push("RRULE:FREQ=WEEKLY;BYDAY=" + DAY_ABBR[a.day]);
      lines.push(fold("SUMMARY:" + escIcs(person(a.personId).name + " — " + a.title)));
      if (a.location) lines.push(fold("LOCATION:" + escIcs(a.location)));
      var desc = [category(a.categoryId).name, a.notes].filter(Boolean).join(" · ");
      if (desc) lines.push(fold("DESCRIPTION:" + escIcs(desc)));
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    download("family-calendar.ics", lines.join("\r\n"), "text/calendar;charset=utf-8");
    toast("Calendar file exported — import it into Google/Apple Calendar");
  }

  function importJsonText(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return toast("That file is not valid JSON."); }
    var next = normalize(data);
    if (!next || !next.people) return toast("That file doesn't look like a calendar export.");
    commit(function () { state = next; }, "Calendar imported");
  }

  function shareLink() {
    try {
      var payload = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
      var url = location.origin + location.pathname + "#cal=" + payload;
      if (url.length > 8000) return toast("Calendar is too large for a link — use Export JSON instead.");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast("Share link copied to clipboard"); },
          function () { prompt("Copy this link:", url); });
      } else {
        prompt("Copy this link:", url);
      }
    } catch (e) {
      toast("Could not build a share link.");
    }
  }

  function readShareLink() {
    var m = location.hash.match(/#cal=(.+)$/);
    if (!m) return null;
    try {
      return normalize(JSON.parse(decodeURIComponent(escape(atob(m[1])))));
    } catch (e) {
      return null;
    }
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */

  function wire() {
    // view switch
    $$(".vbtn").forEach(function (b) {
      b.onclick = function () { ui.view = b.dataset.view; render(); };
    });

    // filters
    $("#personFilter").addEventListener("click", function (e) {
      var chip = e.target.closest("[data-toggle-person]");
      if (!chip) return;
      var id = chip.dataset.togglePerson;
      if (ui.hiddenPeople[id]) delete ui.hiddenPeople[id]; else ui.hiddenPeople[id] = true;
      render();
    });
    $("#categoryFilter").onchange = function () { ui.category = this.value; render(); };
    $("#btnClearFilters").onclick = function () {
      ui.hiddenPeople = {}; ui.category = ""; ui.search = "";
      $("#searchInput").value = "";
      render();
    };
    var searchTimer;
    $("#searchInput").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { ui.search = v; render(); }, 130);
    });

    // top bar
    $("#btnNew").onclick = function () { openActivityModal(null); };
    $("#btnUndo").onclick = undo;
    $("#btnRedo").onclick = redo;
    $("#btnTheme").onclick = function () {
      state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      save(); render();
    };
    $("#btnMenu").onclick = openDrawer;
    $("#btnPeople").onclick = openPeopleModal;
    $("#btnCategories").onclick = openCategoriesModal;
    $("#btnPrint").onclick = function () { window.print(); };
    $("#btnNewDriver").onclick = function () { openDriverModal(null); };
    $("#btnAddKey").onclick = openKeyModal;

    // delegated actions inside the app area
    $("#app").addEventListener("click", function (e) {
      var t = e.target.closest("[data-act]");
      if (!t) return;
      var act = t.dataset.act, id = t.dataset.id;
      if (act === "edit-activity") openActivityModal(activity(id));
      else if (act === "del-activity") { e.stopPropagation(); deleteActivity(id); }
      else if (act === "dup-activity") {
        e.stopPropagation();
        var a = activity(id);
        if (a) commit(function () {
          state.activities.push(Object.assign({}, clone(a), { id: uid("a") }));
        }, "Duplicated “" + a.title + "”");
      } else if (act === "new-activity") {
        var day = t.dataset.day != null ? parseInt(t.dataset.day, 10) : undefined;
        openActivityModal(null, day, t.dataset.person);
      } else if (act === "edit-driver") openDriverModal(driver(id));
      else if (act === "new-driver") openDriverModal(null, parseInt(t.dataset.day, 10));
      else if (act === "del-driver") {
        commit(function () { state.drivers = state.drivers.filter(function (x) { return x.id !== id; }); });
        toast("Driver duty removed", "Undo", undo);
      } else if (act === "del-key") {
        commit(function () { state.legend = state.legend.filter(function (x) { return x.id !== id; }); }, "Code removed");
      }
    });

    // modal close
    $("#modal").addEventListener("click", function (e) {
      if (e.target.id === "modal" || e.target.closest("[data-close-modal]")) closeModal();
    });

    // drawer
    $("#drawer").addEventListener("click", function (e) {
      if (e.target.id === "drawer" || e.target.closest("[data-close-drawer]")) $("#drawer").hidden = true;
    });
    $("#setTitle").oninput = function () { state.settings.title = this.value; save(); $("#calTitle").textContent = this.value; };
    $("#setSub").oninput = function () { state.settings.subtitle = this.value; save(); $("#calSub").textContent = this.value; };
    $("#setWeekStart").onchange = function () { state.settings.weekStart = parseInt(this.value, 10); save(); render(); };
    $("#setShowTimes").onchange = function () { state.settings.showTimes = this.checked; save(); render(); };
    $("#setHighlightToday").onchange = function () { state.settings.highlightToday = this.checked; save(); render(); };

    $("#btnExportJson").onclick = exportJson;
    $("#btnExportCsv").onclick = exportCsv;
    $("#btnExportIcs").onclick = exportIcs;
    $("#btnShareLink").onclick = shareLink;
    $("#btnImportJson").onclick = function () { $("#fileInput").click(); };
    $("#fileInput").onchange = function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { importJsonText(String(reader.result)); };
      reader.readAsText(f);
      this.value = "";
    };
    $("#btnReset").onclick = function () {
      if (!confirm("Replace the current calendar with the sample family week?")) return;
      commit(function () { state = seed(); }, "Reset to the sample week");
      syncDrawer();
    };
    $("#btnClearAll").onclick = function () {
      if (!confirm("Delete every activity and driver duty? People and categories are kept.")) return;
      commit(function () { state.activities = []; state.drivers = []; }, "Calendar cleared");
    };

    // keyboard shortcuts
    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (e.key === "Escape") {
        if (!$("#modal").hidden) closeModal();
        else if (!$("#drawer").hidden) $("#drawer").hidden = true;
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); return undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); return redo(); }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); $("#searchInput").focus(); return; }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); openActivityModal(null); return; }
      var views = { "1": "week", "2": "agenda", "3": "person", "4": "drivers", "5": "stats" };
      if (views[e.key]) { ui.view = views[e.key]; render(); }
    });

    window.addEventListener("beforeprint", function () {
      if (ui.view !== "week") { ui.view = "week"; render(); }
    });
  }

  function openDrawer() {
    syncDrawer();
    $("#drawer").hidden = false;
  }
  function syncDrawer() {
    $("#setTitle").value = state.settings.title;
    $("#setSub").value = state.settings.subtitle;
    $("#setWeekStart").value = String(state.settings.weekStart);
    $("#setShowTimes").checked = !!state.settings.showTimes;
    $("#setHighlightToday").checked = !!state.settings.highlightToday;
  }

  /* ============================================================
     BOOT
     ============================================================ */

  function boot() {
    var shared = readShareLink();
    var saved = load();

    if (shared) {
      state = saved || seed();
      wire();
      render();
      history.replaceState(null, "", location.pathname);
      if (confirm("This link contains a shared calendar. Open it? Your current calendar will be replaced (you can undo).")) {
        commit(function () { state = shared; }, "Shared calendar loaded");
      }
      return;
    }

    state = saved || seed();
    if (!saved) save();
    wire();
    render();
    $("#saveStamp").textContent = saved ? "loaded from this browser" : "sample week loaded";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
