/* NIS2 Compliance Progress Tracker — tracker.js */
/* Renders a 10-item Art. 21 checklist with localStorage persistence.
   Quiz score auto-marks gaps if quiz was completed this session.        */

(function () {
  var STORAGE_KEY = "nis2_tracker_v1";
  var QUIZ_KEY    = "nis2_quiz_gaps"; // written by quiz.js after score gate

  /* ── Strings (Slovak — translated per site by deploy script) ─────────── */
  var S = {
    heading:        "Váš pokrok v súlade s NIS2",
    subheading:     "Označte opatrenia, ktoré už máte implementované. Váš pokrok sa ukladá lokálne.",
    done_label:     "Implementované",
    todo_label:     "Na vykonanie",
    cta_default:    "Zistiť viac →",
    progress_text:  function(done, total) { return done + " z " + total + " opatrení implementovaných"; },
    complete_msg:   "🎉 Všetky opatrenia implementované — gratulujeme! Zvážte certifikáciu ISO 27001.",
    iso_link_text:  "Zistiť viac o certifikácii ISO 27001 →",
    reset_label:    "Resetovať pokrok",
    last_updated:   "Posledná aktualizácia: ",
    art_badge:      "Art. 21",
    free_badge:     "bezplatný",
    trial_badge:    "trial",
  };

  /* ── Measures (10 Art. 21 NIS2 requirements) ─────────────────────────── */
  var MEASURES = [
    {
      id:       "registration",
      art:      "Registrácia",
      title:    "Registrácia v registri subjektov podľa zákona o kybernetickej bezpečnosti",
      detail:   "Povinnosť registrácie v registri kľúčových a dôležitých subjektov vedenom NBÚ. Termín: podľa slovenskej transpozície NIS2.",
      tool:     "Návod na registráciu krok za krokom",
      tool_url: "registracia-nis2.html",
      cost:     "bezplatné",
      quiz_gap: "registration",
    },
    {
      id:       "risk_policy",
      art:      "Art. 21(2)(a)",
      title:    "Analýza rizík a politiky bezpečnosti",
      detail:   "Zdokumentovaná politika bezpečnosti informácií a formálny proces riadenia rizík IT.",
      tool:     "ISMS.online — bezplatný plán pre do 25 zamestnancov",
      tool_url: "https://isms.online/",
      cost:     "bezplatný plán",
      quiz_gap: "isms",
    },
    {
      id:       "incident",
      art:      "Art. 21(2)(b)",
      title:    "Postupy riešenia incidentov",
      detail:   "Zdokumentované postupy detekcie, klasifikácie a hlásenia incidentov NBÚ v lehote 24/72 hodín.",
      tool:     "ISMS.online — šablóny postupov pre incidenty",
      tool_url: "https://isms.online/",
      cost:     "bezplatný plán",
      quiz_gap: "isms",
    },
    {
      id:       "continuity",
      art:      "Art. 21(2)(c)",
      title:    "Kontinuita činností a krízové riadenie",
      detail:   "Plán kontinuity činností (BCP) a obnovy po havárii (DR). Zálohovanie dát, testy obnovy.",
      tool:     "Acronis Cyber Protect — zálohovanie + DR pre MSP",
      tool_url: "https://www.acronis.com/",
      cost:     "od €59/rok",
      quiz_gap: null,
    },
    {
      id:       "supply_chain",
      art:      "Art. 21(2)(d)",
      title:    "Bezpečnosť dodávateľských reťazcov",
      detail:   "Hodnotenie rizík dodávateľov, bezpečnostné doložky v zmluvách, register dodávateľov s prístupom k systémom.",
      tool:     "Sprievodca bezpečnosťou dodávateľov NIS2",
      tool_url: "bezpecnost-dodavatelskych-retazcov.html",
      cost:     "bezplatný",
      quiz_gap: null,
    },
    {
      id:       "network_security",
      art:      "Art. 21(2)(e)",
      title:    "Bezpečnosť sietí a systémov",
      detail:   "Segmentácia siete, firewall, ochrana koncových bodov, správa zraniteľností a záplat.",
      tool:     "NordLayer — segmentácia siete pre firmy",
      tool_url: "https://nordlayer.com/",
      cost:     "od €8/používateľ",
      quiz_gap: null,
    },
    {
      id:       "pentest",
      art:      "Art. 21(2)(f)",
      title:    "Hodnotenie účinnosti opatrení — penetračné testy",
      detail:   "Pravidelné testovanie a audit implementovaných bezpečnostných opatrení vrátane penetračných testov.",
      tool:     "Cobalt.io — penetračné testy na požiadanie",
      tool_url: "https://cobalt.io/",
      cost:     "individuálna cenová ponuka",
      quiz_gap: null,
    },
    {
      id:       "training",
      art:      "Art. 21(2)(g)",
      title:    "Školenia z kybernetickej bezpečnosti",
      detail:   "Pravidelné školenia zamestnancov v oblasti kybernetickej hygieny. Školenie vedenia organizácie je zákonnou povinnosťou (Art. 20).",
      tool:     "KnowBe4 — 14-dňový bezplatný trial",
      tool_url: "https://www.knowbe4.com/",
      cost:     "trial 14 dní",
      quiz_gap: "training",
    },
    {
      id:       "crypto_mfa",
      art:      "Art. 21(2)(h)(i)",
      title:    "Šifrovanie, MFA a riadenie prístupu",
      detail:   "Šifrovanie dát v pokoji aj pri prenose. Viacfaktorová autentifikácia (MFA) pre všetky privilegované účty.",
      tool:     "1Password Business — MFA + správca hesiel",
      tool_url: "https://1password.com/",
      cost:     "od $7,99/používateľ",
      quiz_gap: "mfa",
    },
    {
      id:       "insurance",
      art:      "Prenos rizika",
      title:    "Kybernetické poistenie (prenos rizika)",
      detail:   "Nie je požiadavkou Art. 21, ale pokrýva pokuty podľa zákona o kybernetickej bezpečnosti, náklady na incident a výpadky prevádzky. Odporúčané pre dôležité a kľúčové subjekty.",
      tool:     "Hiscox Cyber — cenová ponuka online za 10 minút",
      tool_url: "https://hiscox.com/",
      cost:     "cenová ponuka online",
      quiz_gap: "insurance",
    },
  ];

  /* ── State helpers ───────────────────────────────────────────────────── */
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function saveState(state) {
    state._updated = new Date().toLocaleDateString("sk-SK");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* Read gaps that quiz wrote (array of gap ids like ["isms","training","mfa"]) */
  function getQuizGaps() {
    try { return JSON.parse(sessionStorage.getItem(QUIZ_KEY) || "[]"); }
    catch (e) { return []; }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  function render() {
    var el = document.getElementById("nis2-tracker");
    if (!el) return;

    var state    = loadState();
    var quizGaps = getQuizGaps();
    var total    = MEASURES.length;
    var done     = MEASURES.filter(function(m) { return state[m.id]; }).length;
    var pct      = Math.round((done / total) * 100);

    var progressColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

    var html = '<section style="background:#f8fafc;padding:3rem 0;" id="tracker-section">';
    html += '<div class="container">';

    /* Header */
    html += '<div class="section-header" style="margin-bottom:1.5rem;">';
    html += '<h2 style="font-size:1.6rem;font-weight:800;color:var(--navy);">' + S.heading + '</h2>';
    html += '<p style="color:var(--gray-600);margin-top:.4rem;">' + S.subheading + '</p>';
    html += '</div>';

    /* Progress bar */
    html += '<div style="background:#e2e8f0;border-radius:99px;height:12px;margin-bottom:.75rem;overflow:hidden;">';
    html += '<div style="background:' + progressColor + ';width:' + pct + '%;height:100%;border-radius:99px;transition:width .4s ease;"></div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">';
    html += '<span style="font-weight:700;color:' + progressColor + ';font-size:.95rem;">' + S.progress_text(done, total) + ' (' + pct + '%)</span>';
    if (state._updated) {
      html += '<span style="font-size:.78rem;color:var(--gray-500);">' + S.last_updated + state._updated + '</span>';
    }
    html += '</div>';

    /* Complete banner */
    if (done === total) {
      html += '<div style="background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.5rem;display:flex;gap:.75rem;align-items:center;">';
      html += '<span style="font-size:1.1rem;">' + S.complete_msg + '</span>';
      html += '<a href="certifikacia-iso-27001.html" style="white-space:nowrap;font-size:.82rem;font-weight:700;color:#166534;">' + S.iso_link_text + '</a>';
      html += '</div>';
    }

    /* Measure cards */
    html += '<div style="display:grid;gap:1rem;">';

    MEASURES.forEach(function(m) {
      var checked    = !!state[m.id];
      var isGap      = quizGaps.length > 0 && m.quiz_gap && quizGaps.indexOf(m.quiz_gap) !== -1;
      var borderColor = checked ? "#86efac" : isGap ? "#fca5a5" : "#e2e8f0";
      var bgColor     = checked ? "#f0fdf4" : isGap ? "#fff5f5" : "#ffffff";

      html += '<div style="background:' + bgColor + ';border:1.5px solid ' + borderColor + ';border-radius:10px;padding:1rem 1.25rem;display:flex;gap:1rem;align-items:flex-start;">';

      /* Checkbox */
      html += '<label style="display:flex;align-items:flex-start;gap:.75rem;cursor:pointer;flex:1;min-width:0;">';
      html += '<input type="checkbox" data-id="' + m.id + '" ';
      html += checked ? 'checked ' : '';
      html += 'style="width:20px;height:20px;flex-shrink:0;margin-top:2px;accent-color:#1e3a5f;cursor:pointer;">';
      html += '<div style="min-width:0;">';

      /* Title row */
      html += '<div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin-bottom:.25rem;">';
      html += '<span style="font-weight:700;color:var(--navy);font-size:.95rem;">' + m.title + '</span>';
      html += '<span style="font-size:.7rem;background:#e0e7ff;color:#3730a3;padding:.15rem .4rem;border-radius:4px;font-weight:600;">' + m.art + '</span>';
      if (checked) {
        html += '<span style="font-size:.7rem;background:#dcfce7;color:#166534;padding:.15rem .4rem;border-radius:4px;font-weight:700;">✓ ' + S.done_label + '</span>';
      } else if (isGap) {
        html += '<span style="font-size:.7rem;background:#fee2e2;color:#991b1b;padding:.15rem .4rem;border-radius:4px;font-weight:700;">⚠ ' + S.todo_label + '</span>';
      }
      html += '</div>';

      /* Detail */
      html += '<p style="font-size:.82rem;color:var(--gray-600);margin:0 0 .5rem;line-height:1.5;">' + m.detail + '</p>';

      /* CTA (only when not done) */
      if (!checked) {
        var isExternal = m.tool_url.startsWith("http");
        var costBadge  = m.cost === "bezplatný plán" || m.cost === "bezplatné" || m.cost === "bezplatný"
          ? '<span style="font-size:.68rem;background:#dcfce7;color:#166534;padding:.1rem .35rem;border-radius:4px;font-weight:700;margin-left:.35rem;">' + S.free_badge + '</span>'
          : m.cost.indexOf("trial") !== -1
          ? '<span style="font-size:.68rem;background:#dbeafe;color:#1e40af;padding:.1rem .35rem;border-radius:4px;font-weight:700;margin-left:.35rem;">' + S.trial_badge + '</span>'
          : '';
        html += '<a href="' + m.tool_url + '" ';
        html += isExternal ? 'target="_blank" rel="noopener" ' : '';
        html += 'style="display:inline-flex;align-items:center;gap:.3rem;font-size:.8rem;font-weight:700;color:var(--navy);text-decoration:none;border:1px solid var(--navy);border-radius:6px;padding:.3rem .65rem;transition:all .15s;">';
        html += m.tool + costBadge;
        html += '</a>';
      }

      html += '</div></label>';
      html += '</div>';
    });

    html += '</div>'; /* grid */

    /* Reset */
    html += '<div style="margin-top:1.25rem;text-align:right;">';
    html += '<button id="tracker-reset" style="font-size:.75rem;color:var(--gray-500);background:none;border:none;cursor:pointer;text-decoration:underline;">' + S.reset_label + '</button>';
    html += '</div>';

    html += '</div></section>'; /* container, section */

    el.innerHTML = html;

    /* Bind events */
    el.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener("change", function() {
        var s = loadState();
        s[cb.dataset.id] = cb.checked;
        saveState(s);
        render();
      });
    });

    var resetBtn = document.getElementById("tracker-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function() {
        if (confirm(S.reset_label + "?")) {
          localStorage.removeItem(STORAGE_KEY);
          render();
        }
      });
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

})();