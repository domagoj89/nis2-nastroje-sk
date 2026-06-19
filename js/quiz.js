/* KSC/NIS2 Compliance Quiz v2 — quiz.js */

(function () {
  "use strict";

  const REPORT_ENDPOINT    = "/generate-report";
  const SUBSCRIBE_ENDPOINT = "/subscribe";

  // ── Affiliate + tool links ──────────────────────────────────────────────────
  const LINKS = {
    reglyze:      { name: "Reglyze",      url: "https://reglyze.com",         review: "narzedzia/reglyze.html" },
    secfix:       { name: "Secfix",       url: "https://secfix.com",          review: "narzedzia/secfix.html" },
    isms_online:  { name: "ISMS.online",  url: "https://isms.online",         review: "narzedzia/isms-online.html" },
    knowbe4:      { name: "KnowBe4",      url: "https://knowbe4.com",         review: "skolenia-nis2.html" },
    hiscox:       { name: "Hiscox Cyber", url: "https://hiscox.com",          review: "kyberneticke-poistenie.html" },
    onepassword:  { name: "1Password",    url: "https://1password.com",       review: "narzedzia/1password.html" },
    nordlayer:    { name: "NordLayer",    url: "https://nordlayer.com",       review: "narzedzia/nordlayer.html" },
    cobalt:       { name: "Cobalt.io",    url: "https://cobalt.io",           review: "penetracne-testovanie.html" },
    bsi:          { name: "BSI ISO 27001",url: "https://bsigroup.com/sk-SK/", review: "certifikacia-iso-27001.html" },
  };

  // ── Tool recommendation by sector + budget ─────────────────────────────────
  const ISMS_RECS = {
    "annex1:free":  "reglyze",   "annex1:low":   "isms_online",
    "annex1:mid":   "secfix",    "annex1:high":  "secfix",
    "annex2:free":  "reglyze",   "annex2:low":   "reglyze",
    "annex2:mid":   "isms_online","annex2:high":  "secfix",
    "other:free":   "reglyze",   "other:low":    "reglyze",
    "other:mid":    "reglyze",   "other:high":   "isms_online",
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    step: 0,
    answers: {},
    score: 0,
    missing: [],
    email: null,
  };

  // ── Questions ──────────────────────────────────────────────────────────────
  const questions = [
    {
      id: "sector",
      title: "V akom sektore pôsobí vaša firma?",
      hint: "Vyberte sektor, ktorý najlepšie opisuje hlavnú činnosť.",
      options: [
        { value: "annex1", icon: "⚡", label: "Kľúčový sektor (Annex I)",
          sub: "Energetika, doprava, bankovníctvo, financie, zdravotníctvo, voda, digitálna infraštruktúra, verejná správa" },
        { value: "annex2", icon: "📦", label: "Dôležitý sektor (Annex II)",
          sub: "Pošta, odpadové hospodárstvo, chémia, potraviny, priemyselná výroba, poskytovatelia digitálnych služieb, MSP/IT" },
        { value: "other", icon: "🏗️", label: "Iný sektor",
          sub: "Stavebníctvo, maloobchod, gastronómia, súkromné vzdelávanie, iné" },
      ]
    },
    {
      id: "size",
      title: "Koľko osôb zamestnáva vaša firma?",
      hint: "Vrátane všetkých zamestnancov a spolupracovníkov.",
      options: [
        { value: "micro",  icon: "👤", label: "Menej ako 50 zamestnancov",  sub: "Mikro / malá firma" },
        { value: "medium", icon: "👥", label: "50–249 zamestnancov",         sub: "Stredný podnik" },
        { value: "large",  icon: "🏢", label: "250 alebo viac zamestnancov", sub: "Veľký podnik" },
      ]
    },
    {
      id: "revenue",
      title: "Aký je ročný obrat vašej firmy?",
      hint: "Ročné príjmy alebo celková bilančná suma.",
      options: [
        { value: "small",  icon: "💶", label: "Pod 10 mil. EUR ročne",  sub: "Mikro / malá firma" },
        { value: "medium", icon: "💰", label: "10–50 mil. EUR ročne",    sub: "Stredný podnik" },
        { value: "large",  icon: "💎", label: "Nad 50 mil. EUR ročne",   sub: "Veľký podnik" },
      ]
    },
    {
      id: "budget",
      title: "Aký ročný rozpočet máte na súlad s NIS2/zákon o kybernetickej bezpečnosti?",
      hint: "Prispôsobíme nástroje vašim finančným možnostiam.",
      options: [
        { value: "free", icon: "🆓", label: "Hľadám bezplatné riešenie", sub: "Bezplatný plán alebo jednorazové náklady na implementáciu" },
        { value: "low",  icon: "💵", label: "Do 200 € ročne",            sub: "Základný SaaS nástroj" },
        { value: "mid",  icon: "💳", label: "200–600 € ročne",           sub: "Plná compliance platforma" },
        { value: "high", icon: "🏦", label: "Nad 600 € ročne",           sub: "Enterprise riešenie" },
      ]
    },
    {
      id: "registered",
      title: "Je vaša firma už zaregistrovaná v registri podľa zákona o kybernetickej bezpečnosti?",
      hint: "Termín registrácie: podľa slovenskej transpozície NIS2. Toto je prvá povinnosť.",
      options: [
        { value: "yes",  icon: "✅", label: "Áno, už sme sa zaregistrovali", sub: "Samoidentifikácia vykonaná" },
        { value: "no",   icon: "❌", label: "Nie, ešte sme to neurobili", sub: "Priorita č. 1 — termín podľa slovenskej transpozície NIS2" },
        { value: "unknown", icon: "❓", label: "Neviem / nie som si istý", sub: "Preveríme to spoločne" },
      ]
    },
    {
      id: "has_isms",
      title: "Máte zavedený systém riadenia informačnej bezpečnosti (ISMS)?",
      hint: "ISMS je súbor politík, postupov a kontrol kybernetickej bezpečnosti — vyžadovaný podľa Art. 21 NIS2.",
      options: [
        { value: "yes",     icon: "✅", label: "Áno, máme funkčný ISMS",        sub: "Zdokumentované bezpečnostné politiky a postupy" },
        { value: "partial", icon: "🔄", label: "Pracujeme na implementácii",     sub: "Prebieha — ale ešte nie je dokončená" },
        { value: "no",      icon: "❌", label: "Nie, nemáme nič v tejto oblasti", sub: "Žiadny systém riadenia bezpečnosti" },
      ]
    },
    {
      id: "has_training",
      title: "Absolvovali zamestnanci a vedenie školenia z kybernetickej bezpečnosti?",
      hint: "Školenie vedenia je zákonnou povinnosťou podľa Art. 20 NIS2.",
      options: [
        { value: "yes", icon: "✅", label: "Áno, máme pravidelné školenia",      sub: "Zamestnanci aj vedenie sú vyškolení" },
        { value: "no",  icon: "❌", label: "Nie, nemáme školenia v tejto oblasti", sub: "Školenie vedenia je zákonnou povinnosťou podľa zákona o kybernetickej bezpečnosti" },
      ]
    },
    {
      id: "has_insurance",
      title: "Má vaša firma poistenie proti kybernetickým hrozbám?",
      hint: "Kybernetické poistenie prenáša reziduálne riziko a je súčasťou riadenia rizík podľa NIS2.",
      options: [
        { value: "yes",     icon: "✅", label: "Áno, máme kybernetické poistenie",     sub: "Riziko je zabezpečené" },
        { value: "no",      icon: "❌", label: "Nie, nemáme poistenie",                sub: "Online ocenenie trvá 20 minút" },
        { value: "unknown", icon: "❓", label: "Neviem / nepočul som o tom",            sub: "Vysvetlíme, čo to je a koľko stojí" },
      ]
    },
    {
      id: "role",
      title: "Akú rolu zastávate vo firme?",
      hint: "Prispôsobíme plán vašim povinnostiam a rozhodovaciemu oprávneniu.",
      options: [
        { value: "ceo",        icon: "👔", label: "Majiteľ / CEO / Vedenie", sub: "Zodpovedáte za rozhodnutia a rozpočet" },
        { value: "it",         icon: "💻", label: "IT manažér / CTO / CISO",  sub: "Zodpovedáte za technickú implementáciu" },
        { value: "compliance", icon: "📋", label: "Compliance / Právnik",     sub: "Zodpovedáte za právny súlad" },
        { value: "cfo",        icon: "💰", label: "CFO / Finančný riaditeľ",  sub: "Zodpovedáte za rozpočet a finančné riziko" },
      ]
    },
  ];

  const TOTAL = questions.length;

  // ── Score calculation ──────────────────────────────────────────────────────
  function computeScore() {
    const a = state.answers;
    let score = 2; // base: everyone has some basics
    const missing = [];

    if (a.registered === "yes")        { score += 2; }
    else                               { missing.push("registration"); }

    if (a.has_isms === "yes")          { score += 3; }
    else if (a.has_isms === "partial") { score += 1; missing.push("isms"); }
    else                               { missing.push("isms"); }

    if (a.has_training === "yes")      { score += 2; }
    else                               { missing.push("training"); }

    if (a.has_insurance === "yes")     { score += 1; }
    else                               { missing.push("insurance"); }

    score = Math.min(10, Math.max(1, score));
    state.score   = score;
    state.missing = missing;
    return { score, missing };
  }

  function computeScope() {
    const { sector, size, revenue } = state.answers;
    if (sector === "other") return "out";
    const isLarge  = size === "large"  || revenue === "large";
    const isMedium = !isLarge && (size === "medium" || revenue === "medium");
    if (sector === "annex1" && isLarge)           return "essential";
    if (sector === "annex1" && isMedium)          return "important";
    if (sector === "annex2" && (isLarge||isMedium)) return "important";
    return "check"; // small companies in scope sectors
  }

  // ── Today actions (client-side, shown on result screen immediately) ────────
  function buildTodayActions() {
    const missing   = state.missing;
    const sector    = state.answers.sector  || "annex2";
    const budget    = state.answers.budget  || "low";
    const ismsTool  = LINKS[ISMS_RECS[sector+":"+budget] || "reglyze"];
    const actions   = [];

    if (missing.includes("registration")) {
      actions.push({
        step: actions.length + 1,
        time: "30 min · bezplatné",
        title: "Zaregistrujte firmu v registri podľa zákona o kybernetickej bezpečnosti",
        desc:  "Termín: podľa slovenskej transpozície NIS2. Online formulár samoidentifikácie. Toto je vaša priorita č. 1.",
        cta:   "Návod krok za krokom →",
        url:   "registracia-nis2.html",
        affiliate: false,
      });
    }

    if (missing.includes("isms")) {
      actions.push({
        step: actions.length + 1,
        time: "20 min · bezplatný plán",
        title: "Spustite systém ISMS — " + ismsTool.name,
        desc:  "Bezplatný plán pokrýva úplné posúdenie medzier NIS2. Po registrácii: vyplňte vstavaný dotazník — AI automaticky generuje politiky.",
        cta:   "Začnite za €0 → " + ismsTool.name,
        url:   ismsTool.url,
        affiliate: true,
        badge: "Odporúčanie č. 1",
      });
    }

    if (missing.includes("insurance")) {
      actions.push({
        step: actions.length + 1,
        time: "20 min · online ocenenie",
        title: "Získajte ponuku kybernetického poistenia",
        desc:  "Prenos rizika je súčasťou riadenia rizík NIS2. Ocenenie Hiscox: 20 minút online, bez rozhovoru s agentom.",
        cta:   "Pozrite si ponuku Hiscox →",
        url:   LINKS.hiscox.url,
        affiliate: true,
      });
    }

    if (missing.includes("training")) {
      actions.push({
        step: actions.length + 1,
        time: "30 min · 14-dňový bezplatný trial",
        title: "Spustite školenia kybernetickej bezpečnosti — KnowBe4",
        desc:  "Školenie vedenia je zákonnou povinnosťou (Art. 20 zákon o kybernetickej bezpečnosti). KnowBe4: online platforma, prvý modul odoslaný tímu do 24 hodín.",
        cta:   "Začnite bezplatný trial →",
        url:   LINKS.knowbe4.url,
        affiliate: true,
      });
    }

    // Always suggest 1Password if no training (implies basics missing)
    if (missing.includes("isms") && actions.length < 5) {
      actions.push({
        step: actions.length + 1,
        time: "30 min · 14-dňový bezplatný trial",
        title: "Implementujte správcu hesiel + MFA — 1Password",
        desc:  "Viacfaktorová autentifikácia (MFA) je vyžadovaná podľa Art. 21(j) zákon o kybernetickej bezpečnosti. 1Password Business: nastavenie 30 minút, nasadenie pre tím v ten istý deň.",
        cta:   "Začnite bezplatný trial →",
        url:   LINKS.onepassword.url,
        affiliate: true,
      });
    }

    return actions.slice(0, 4); // max 4 today actions
  }

  // ── GA4 helper ─────────────────────────────────────────────────────────────
  function track(event, params) {
    if (typeof gtag === "function") gtag("event", event, params || {});
  }

  // ── Render: question step ──────────────────────────────────────────────────
  function renderStep() {
    const q   = questions[state.step];
    const el  = document.getElementById("quiz-container");
    if (!el) return;

    const pct    = Math.round((state.step / TOTAL) * 100);
    const isLast = state.step === TOTAL - 1;

    el.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress">
          <div class="quiz-progress__bar" style="width:${pct}%"></div>
        </div>
        <p class="text-sm text-gray" style="margin-bottom:.25rem;">Otázka ${state.step + 1} z ${TOTAL}</p>
        <h3>${q.title}</h3>
        <p style="color:var(--gray-500);font-size:.9rem;margin-bottom:1rem;">${q.hint}</p>
        <div class="quiz-options">
          ${q.options.map(opt => `
            <button class="quiz-option${state.answers[q.id] === opt.value ? " selected" : ""}"
                    data-value="${opt.value}" type="button">
              <span class="quiz-option__icon">${opt.icon}</span>
              <span>
                <span class="quiz-option__text">${opt.label}</span>
                <span class="quiz-option__sub">${opt.sub}</span>
              </span>
            </button>
          `).join("")}
        </div>
        <div class="quiz-nav">
          ${state.step > 0
            ? `<button class="btn btn--outline btn--sm" id="quiz-back">← Späť</button>`
            : `<span></span>`}
          <button class="btn btn--primary btn--sm" id="quiz-next"
                  ${state.answers[q.id] ? "" : "disabled"}>
            ${isLast ? "Vypočítať môj výsledok →" : "Ďalej →"}
          </button>
        </div>
      </div>`;

    el.querySelectorAll(".quiz-option").forEach(btn => {
      btn.addEventListener("click", () => {
        state.answers[q.id] = btn.dataset.value;
        el.querySelectorAll(".quiz-option").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        el.querySelector("#quiz-next").removeAttribute("disabled");
        track("quiz_answer", { question: q.id, answer: btn.dataset.value });
        // Auto-advance on click for faster UX
        setTimeout(() => {
          if (isLast) { computeScore(); renderScoreGate(); }
          else { state.step++; renderStep(); }
        }, 280);
      });
    });

    el.querySelector("#quiz-back")?.addEventListener("click", () => {
      state.step--;
      renderStep();
    });

    el.querySelector("#quiz-next")?.addEventListener("click", () => {
      if (!state.answers[q.id]) return;
      if (isLast) { computeScore(); renderScoreGate(); }
      else { state.step++; renderStep(); }
    });
  }

  // ── Render: score + email gate ─────────────────────────────────────────────
  function renderScoreGate() {
    const el = document.getElementById("quiz-container");
    if (!el) return;

    const { score, missing } = state;
    const pct    = Math.round((score / 10) * 100);
    const scope  = computeScope();

    const scoreColor = score <= 3 ? "#dc2626"
                     : score <= 6 ? "#d97706"
                     : "#16a34a";

    const scopeMsg = {
      essential: "Vaša firma je <strong>kľúčový subjekt podľa zákona o kybernetickej bezpečnosti</strong> — najvyššia úroveň požiadaviek.",
      important:  "Vaša firma je <strong>dôležitý subjekt podľa zákona o kybernetickej bezpečnosti</strong> — musíte splniť požiadavky NIS2.",
      check:      "Vaša firma môže podliehať zákonu o kybernetickej bezpečnosti — skontrolujte výnimky pre malé firmy.",
      out:        "Vaša firma pravdepodobne nepodlieha zákonu o kybernetickej bezpečnosti — napriek tomu odporúčame zaviesť základy.",
    }[scope] || "";

    const gapText = missing.length === 0
      ? "Gratulujeme — máte zavedené všetky kľúčové opatrenia!"
      : `Chýbajú vám <strong>${missing.length}</strong> kľúčové bezpečnostné opatrenia. Väčšinu z nich môžete implementovať do 3 dní.`;

    el.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress">
          <div class="quiz-progress__bar" style="width:100%"></div>
        </div>

        <div style="text-align:center;padding:1rem 0 .5rem;">
          <div style="font-size:.8rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">
            Váš výsledok súladu s NIS2
          </div>
          <div style="font-size:3.5rem;font-weight:800;color:${scoreColor};line-height:1;">
            ${score}<span style="font-size:1.5rem;color:var(--gray-400);font-weight:500;">/10</span>
          </div>
          <div style="margin:.75rem auto;max-width:280px;height:10px;background:#e5e7eb;border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${scoreColor};border-radius:99px;transition:width 1s;"></div>
          </div>
          <p style="font-size:.9rem;color:var(--gray-600);">${scopeMsg}</p>
          <p style="font-size:.92rem;">${gapText}</p>
        </div>

        <div style="background:#f0f7ff;border-radius:12px;padding:1.25rem;margin:1rem 0;">
          <p style="font-size:.95rem;font-weight:700;color:#1a1a2e;margin:0 0 .35rem;">
            📬 Získajte váš 3-dňový akčný plán
          </p>
          <p style="font-size:.82rem;color:#555;margin:0 0 .75rem;">
            Váš personalizovaný plán: čo urobiť dnes, zajtra a tento týždeň.
            Pripravené odkazy na nástroje + AI prompt pre Claude / ChatGPT / Gemini.
          </p>
          <form id="score-email-form" style="display:flex;gap:.5rem;flex-wrap:wrap;">
            <input type="email" name="email" placeholder="vas@email.sk" required
                   style="flex:1;min-width:180px;padding:.6rem .9rem;border:1px solid #d1d5db;border-radius:8px;font-size:.95rem;">
            <button type="submit" class="btn btn--primary">Pošlite mi plán →</button>
          </form>
          <p style="font-size:.75rem;color:#9ca3af;margin:.5rem 0 0;">Žiadny spam. Jeden e-mail s plánom + voliteľné pripomienky.</p>
        </div>

        <button id="quiz-skip-email" type="button"
                style="background:none;border:none;color:var(--gray-400);font-size:.8rem;cursor:pointer;width:100%;text-align:center;padding:.25rem 0;">
          Zobraziť iba výsledok, bez plánu →
        </button>
      </div>`;

    track("quiz_score_shown", { score, missing: missing.join(","), scope });

    document.getElementById("score-email-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const email = e.target.querySelector("input[type=email]").value.trim();
      if (!email) return;
      const btn = e.target.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Odosielanie...";
      state.email = email;
      _submitEmailAndReport(email, () => renderResult(true));
    });

    document.getElementById("quiz-skip-email")?.addEventListener("click", () => {
      track("quiz_email_skipped");
      renderResult(false);
    });
  }

  // ── Submit email to Beehiiv + trigger report ───────────────────────────────
  function _submitEmailAndReport(email, onDone) {
    const { score, missing, answers } = state;

    // Score tier tag
    const scoreTier = score <= 3 ? "score_low" : score <= 6 ? "score_mid" : "score_high";
    const tags = [scoreTier,
      "sector_" + (answers.sector || "unknown"),
      "role_"   + (answers.role   || "unknown"),
      ...(missing.includes("registration") ? ["missing_registration"] : []),
      ...(missing.includes("isms")         ? ["missing_isms"]         : []),
      ...(missing.includes("training")     ? ["missing_training"]     : []),
      ...(missing.includes("insurance")    ? ["missing_insurance"]    : []),
    ];

    // Call both endpoints in parallel
    const subscribeCall = fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        source: "quiz_score_gate",
        tags,
        quiz_answers: {
          sector: answers.sector, size: answers.size, revenue: answers.revenue,
          budget: answers.budget, registered: answers.registered,
          has_isms: answers.has_isms, has_training: answers.has_training,
          has_insurance: answers.has_insurance, role: answers.role,
          score,
        },
      }),
    }).catch(() => {});

    const reportCall = fetch(REPORT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector:        answers.sector,
        size:          answers.size,
        revenue:       answers.revenue,
        budget:        answers.budget,
        registered:    answers.registered,
        has_isms:      answers.has_isms,
        has_training:  answers.has_training,
        has_insurance: answers.has_insurance,
        role:          answers.role,
        score,
        missing,
        email,
        lang:   document.documentElement.lang || "sk",
        domain: window.location.hostname,
      }),
    }).catch(() => {});

    Promise.allSettled([subscribeCall, reportCall]).then(() => {
      track("quiz_completed", { score, sector: answers.sector, email_captured: true });
      if (onDone) onDone();
    });
  }

  // ── Render: result with today-actions ──────────────────────────────────────
  function renderResult(emailCaptured) {
    const el = document.getElementById("quiz-container");
    if (!el) return;

    const { score, missing, answers } = state;
    const scope    = computeScope();
    const actions  = buildTodayActions();
    const pct      = Math.round((score / 10) * 100);
    const scoreColor = score <= 3 ? "#dc2626" : score <= 6 ? "#d97706" : "#16a34a";

    const scopeBadge = {
      essential: { text: "🚨 Kľúčový subjekt",  color: "#fee2e2", tc: "#991b1b" },
      important:  { text: "⚠️ Dôležitý subjekt", color: "#fefce8", tc: "#854d0e" },
      check:      { text: "🔍 Skontrolujte výnimky", color: "#fefce8", tc: "#854d0e" },
      out:        { text: "✅ Pravdepodobne mimo rozsahu zákona o kybernetickej bezpečnosti", color: "#dcfce7", tc: "#166534" },
    }[scope] || { text: "zákon o kybernetickej bezpečnosti", color: "#e5e7eb", tc: "#374151" };

    function actionCard(a) {
      const isAffiliate = a.affiliate;
      return `
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1rem 1.1rem;margin-bottom:.75rem;${isAffiliate ? "border-left:3px solid var(--navy);" : ""}">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem;">
            <span style="background:var(--navy);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;">${a.step}</span>
            <span style="font-size:.75rem;color:var(--gray-500);">${a.time}</span>
            ${isAffiliate && a.badge ? `<span style="background:#dcfce7;color:#166534;font-size:.68rem;font-weight:700;padding:.1rem .45rem;border-radius:4px;">${a.badge}</span>` : ""}
          </div>
          <div style="font-weight:700;font-size:.95rem;margin-bottom:.3rem;">${a.title}</div>
          <div style="font-size:.82rem;color:#555;margin-bottom:.6rem;">${a.desc}</div>
          <a href="${a.url}" ${isAffiliate ? 'target="_blank" rel="nofollow noopener"' : ''}
             style="display:inline-block;padding:.45rem .9rem;background:var(--navy);color:#fff;border-radius:6px;font-size:.82rem;font-weight:600;text-decoration:none;">
            ${a.cta}
          </a>
        </div>`;
    }

    const reskipBlock = missing.length === 0
      ? `<div style="background:#dcfce7;border-radius:10px;padding:1rem;text-align:center;margin-bottom:1rem;">
           <strong>🎉 Vaša firma je v dobrom stave!</strong><br>
           <span style="font-size:.85rem;">Máte zavedené všetky kľúčové opatrenia NIS2. Zvážte certifikáciu ISO 27001 ako dôkaz súladu.</span>
           <br><a href="certifikacia-iso-27001.html" style="font-size:.82rem;color:var(--navy);font-weight:700;">Zistite viac o ISO 27001 →</a>
         </div>`
      : actions.map(actionCard).join("");

    el.innerHTML = `
      <div class="quiz-card">

        ${emailCaptured
          ? `<div style="background:#dcfce7;border-radius:8px;padding:.6rem 1rem;font-size:.82rem;color:#166534;font-weight:600;margin-bottom:1rem;text-align:center;">
               ✅ Plán odoslaný na ${state.email || "váš e-mail"} — skontrolujte schránku
             </div>`
          : ""}

        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
          <div style="text-align:center;flex-shrink:0;">
            <div style="font-size:2.5rem;font-weight:800;color:${scoreColor};line-height:1;">
              ${score}<span style="font-size:1rem;color:var(--gray-400);font-weight:500;">/10</span>
            </div>
            <div style="font-size:.7rem;color:var(--gray-500);">Výsledok NIS2</div>
          </div>
          <div style="flex:1;min-width:140px;">
            <div style="height:8px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:.35rem;">
              <div style="height:100%;width:${pct}%;background:${scoreColor};border-radius:99px;"></div>
            </div>
            <span style="display:inline-block;padding:.2rem .6rem;border-radius:12px;font-size:.75rem;font-weight:700;background:${scopeBadge.color};color:${scopeBadge.tc};">
              ${scopeBadge.text}
            </span>
          </div>
        </div>

        <h3 style="font-size:1.05rem;margin-bottom:.35rem;">
          ${missing.length > 0
            ? `🏃 Urobte DNES — celkovo ~${Math.min(120, missing.length * 30)} minút`
            : "Váš stav NIS2"}
        </h3>
        <p style="font-size:.82rem;color:var(--gray-500);margin-bottom:1rem;">
          ${missing.length > 0
            ? `${missing.length} chýbajúcich krokov. Nasledujúce môžete dokončiť dnes.`
            : "Všetky kľúčové opatrenia sú na mieste."}
        </p>

        ${reskipBlock}

        ${missing.length > 0 ? `
          <div style="border-top:1px solid #e5e7eb;padding-top:1rem;margin-top:.5rem;">
            <p style="font-size:.78rem;color:var(--gray-500);margin-bottom:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">
              Ďalšie kroky (rezervujte si termíny)
            </p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <a href="penetracne-testovanie.html" style="font-size:.78rem;padding:.3rem .7rem;border:1px solid #e5e7eb;border-radius:6px;color:var(--gray-600);text-decoration:none;">
                🔍 Penetračný test
              </a>
              <a href="certifikacia-iso-27001.html" style="font-size:.78rem;padding:.3rem .7rem;border:1px solid #e5e7eb;border-radius:6px;color:var(--gray-600);text-decoration:none;">
                🏅 Certifikácia ISO 27001
              </a>
              <a href="bezpecnost-dodavatelskych-retazcov.html" style="font-size:.78rem;padding:.3rem .7rem;border:1px solid #e5e7eb;border-radius:6px;color:var(--gray-600);text-decoration:none;">
                🔗 Bezpečnosť dodávateľského reťazca
              </a>
            </div>
          </div>` : ""}

        <div style="margin-top:1.25rem;display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn--outline btn--sm" id="quiz-restart">← Začať odznova</button>
          <a href="porownanie.html" class="btn btn--primary btn--sm">Porovnajte nástroje NIS2 →</a>
        </div>

        ${!emailCaptured ? `
          <div style="margin-top:1rem;background:#f0f7ff;border-radius:8px;padding:.85rem;text-align:center;">
            <p style="font-size:.82rem;margin:0 0 .5rem;"><strong>Získajte úplný plán na e-mail</strong> s AI promptom a odkazmi na nástroje</p>
            <form id="late-email-form" style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;">
              <input type="email" placeholder="vas@email.sk" required
                     style="flex:1;min-width:160px;padding:.45rem .75rem;border:1px solid #d1d5db;border-radius:6px;font-size:.85rem;">
              <button type="submit" class="btn btn--primary btn--sm">Odoslať →</button>
            </form>
          </div>` : ""}
      </div>`;

    document.getElementById("quiz-restart")?.addEventListener("click", () => {
      state.step = 0; state.answers = {}; state.score = 0;
      state.missing = []; state.email = null;
      try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
      renderStep();
    });

    document.getElementById("late-email-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const email = e.target.querySelector("input[type=email]").value.trim();
      if (!email) return;
      const btn = e.target.querySelector("button");
      btn.disabled = true; btn.textContent = "Odosielanie...";
      state.email = email;
      _submitEmailAndReport(email, () => {
        e.target.parentElement.innerHTML =
          `<p style="font-size:.82rem;color:#166534;font-weight:700;">✅ Odoslané na ${email}</p>`;
      });
    });

    track("quiz_result_shown", { score, scope, email_captured: emailCaptured });
  }

  // ── FAQ accordion ──────────────────────────────────────────────────────────
  function initFaq() {
    document.querySelectorAll(".faq-question").forEach(btn => {
      btn.addEventListener("click", () => {
        const item   = btn.closest(".faq-item");
        const isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach(i => i.classList.remove("open"));
        if (!isOpen) item.classList.add("open");
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("quiz-container");
    if (container) renderStep();
    initFaq();
  });

})();