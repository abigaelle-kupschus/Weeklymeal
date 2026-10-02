```javascript
const SLOTS = [
  ["matin", "Matin"],
  ["midi", "Midi"],
  ["encas", "Encas"],
  ["soir", "Soir"]
];

const PHASES = [
  {
    n: "Règles",
    d: "Le corps est en phase de repos : on vise le réconfort et le fer.",
    f: [
      "Viande rouge, lentilles, pois chiches (fer)",
      "Épinards, betterave, brocolis",
      "Agrumes, kiwi (vitamine C pour absorber le fer)",
      "Gingembre, soupes chaudes, bouillons",
      "Chocolat noir, noix, graines de courge (magnésium)",
      "Poissons gras (oméga-3)"
    ]
  },
  {
    n: "Folliculaire",
    d: "L'énergie remonte : aliments frais, légers et riches en protéines.",
    f: [
      "Œufs, poulet, tofu",
      "Légumes verts, germes, radis",
      "Graines de lin, avoine, quinoa",
      "Fruits rouges, pomme, avocat",
      "Aliments fermentés (kéfir, kimchi, choucroute)",
      "Salades colorées"
    ]
  },
  {
    n: "Ovulation",
    d: "Pic d'énergie : fibres, antioxydants et beaucoup de couleurs.",
    f: [
      "Légumes crus, salades, poivrons",
      "Fruits rouges, fraises, framboises",
      "Amandes, quinoa",
      "Asperges, courgettes",
      "Poissons, crevettes",
      "Eau, tisanes, fruits riches en eau"
    ]
  },
  {
    n: "Lutéale",
    d: "Les envies arrivent : on mise sur les glucides complexes et le magnésium.",
    f: [
      "Patate douce, riz complet, avoine",
      "Banane, dattes",
      "Chocolat noir, amandes, graines de courge (magnésium)",
      "Légumes-racines, courge, brocoli",
      "Saumon, œufs",
      "Pois chiches, lentilles"
    ]
  }
];

const KEY = "planning-repas-v1";

let S = JSON.parse(localStorage.getItem(KEY) || "null") || {
  profile: null,
  meals: {},
  shop: []
};

let page = "plan";
let off = 0;
let tmp = {};

const save = () =>
  localStorage.setItem(KEY, JSON.stringify(S));

const $ = selector =>
  document.querySelector(selector);

const esc = text =>
  String(text).replace(
    /[&<>"]/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char])
  );

const iso = date =>
  date.getFullYear() +
  "-" +
  String(date.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(date.getDate()).padStart(2, "0");

function weekStart(offset) {
  const date = new Date();

  date.setHours(12, 0, 0, 0);

  date.setDate(
    date.getDate() -
    ((date.getDay() - 6 + 7) % 7) +
    offset * 7
  );

  return date;
}

function days(offset) {
  const start = weekStart(offset);

  return Array.from({ length: 9 }, (_, i) => {
    const date = new Date(start);

    date.setDate(start.getDate() + i);

    return date;
  });
}

function phaseFor(offset) {
  const profile = S.profile;

  if (
    !profile ||
    profile.sex !== "f" ||
    !profile.cycle
  ) {
    return null;
  }

  const weeks = Math.round(
    (weekStart(offset) - new Date(profile.since)) /
    6048e5
  );

  return ((profile.idx + weeks) % 4 + 4) % 4;
}

function render() {
  const profile = S.profile;

  $("#tabs").hidden = !profile;

  if (!profile) {
    setup();
    return;
  }

  document
    .querySelectorAll("#tabs button")
    .forEach(button => {
      button.classList.toggle(
        "on",
        button.dataset.p === page
      );
    });

  ({
    plan,
    shop,
    phase,
    setup,
    settings
  })[page]();
}

function setup() {
  page = "setup";

  const app = $("#app");

  if (!tmp.sex) {
    app.innerHTML = `
      <h1>Bienvenue</h1>
      <p>Tu es :</p>

      <div class="choice">
        <button onclick="pick('m')">
          Un homme
        </button>

        <button onclick="pick('f')">
          Une femme
        </button>
      </div>
    `;

    return;
  }

  if (
    tmp.sex === "f" &&
    tmp.cycle === undefined
  ) {
    app.innerHTML = `
      <h1>Cycle</h1>

      <p>
        Tu veux adapter les repas à ton cycle ?
      </p>

      <div class="choice">
        <button onclick="cyc(true)">
          Oui
        </button>

        <button class="sec" onclick="cyc(false)">
          Non
        </button>
      </div>
    `;

    return;
  }

  if (tmp.cycle) {
    app.innerHTML = `
      <h1>Tu en es où ?</h1>

      <div class="choice">
        ${PHASES.map(
          (phase, index) => `
            <button
              class="sec"
              onclick="fin(${index})"
            >
              ${phase.n}
            </button>
          `
        ).join("")}
      </div>
    `;

    return;
  }
}

function pick(sex) {
  tmp = { sex };

  if (sex === "m") {
    fin(null);
  } else {
    setup();
  }
}

function cyc(cycle) {
  tmp.cycle = cycle;

  if (cycle) {
    setup();
  } else {
    fin(null);
  }
}

function fin(index) {
  S.profile = {
    sex: tmp.sex,
    cycle: !!tmp.cycle,
    idx: index || 0,
    since: weekStart(0).toISOString()
  };

  tmp = {};

  save();

  page = "plan";

  render();
}

function plan() {
  const ds = days(off);
  const ph = phaseFor(off);

  const formatDate = date =>
    date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short"
    });

  let html = `
    <div class="nav">

      <button
        class="sec"
        onclick="off--;plan()"
      >
        ←
      </button>

      <b>
        ${formatDate(ds[0])}
        →
        ${formatDate(ds[8])}

        ${
          off === 0
            ? "<br><small>Semaine en cours</small>"
            : ""
        }
      </b>

      <button
        class="sec"
        onclick="off++;plan()"
      >
        →
      </button>

    </div>
  `;

  if (ph !== null) {
    html += `
      <div class="phase">

        <b>
          Phase : ${PHASES[ph].n}
        </b>

        <button
          class="q"
          onclick="page='phase';tmp.ph=${ph};render()"
        >
          ?
        </button>
      </div>
    `;
  }

  const week = iso(weekStart(off));
  const desserts = (S.desserts || {})[week] || {};

  html += `
    <div class="card">

      <h2 style="margin:0;font-size:1.05rem">
        🍰 Dessert de la semaine
      </h2>

      <div class="slot">

        <input
          placeholder="Dessert prévu"
          value="${esc(desserts.t || "")}"
          oninput="setD('${week}','t',this.value)"
        >

        <textarea
          placeholder="Ingrédients (un par ligne ou séparés par des virgules)"
          oninput="setD('${week}','i',this.value)"
        >${esc(desserts.i || "")}</textarea>

      </div>

    </div>

    <button
      style="width:100%;margin-bottom:12px"
      onclick="toShop()"
    >
      🛒 Ajouter les ingrédients à la liste de courses
    </button>
  `;

  ds.forEach(date => {
    const key = iso(date);
    const meals = S.meals[key] || {};

    html += `
      <div class="card day">

        <h2>
          ${date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric"
          })}
        </h2>
    `;

    SLOTS.forEach(([slot, label]) => {
      const value = meals[slot] || {};

      html += `
        <div class="slot">

          <label>
            ${label}
          </label>

          <input
            placeholder="Plat prévu"
            value="${esc(value.t || "")}"
            oninput="setM(
              '${key}',
              '${slot}',
              't',
              this.value
            )"
          >

          <textarea
            placeholder="Ingrédients (un par ligne ou séparés par des virgules)"
            oninput="setM(
              '${key}',
              '${slot}',
              'i',
              this.value
            )"
          >${esc(value.i || "")}</textarea>

        </div>
      `;
    });

    html += `</div>`;
  });

  const scrollPosition = scrollY;

  $("#app").innerHTML = html;

  scrollTo(0, scrollPosition);
}

function setM(key, slot, field, value) {
  S.meals[key] = S.meals[key] || {};
  S.meals[key][slot] = S.meals[key][slot] || {};
  S.meals[key][slot][field] = value;

  save();
}

function toShop() {
  let count = 0;

  const existing = new Set(
    S.shop.map(item => item.n.toLowerCase())
  );

  (
    (S.desserts || {})[iso(weekStart(off))]?.i || ""
  )
    .split(/[\n,]/)
    .map(x => x.trim())
    .filter(Boolean)
    .forEach(item => {
      if (!existing.has(item.toLowerCase())) {
        existing.add(item.toLowerCase());

        S.shop.push({
          n: item,
          d: false
        });

        count++;
      }
    });

  days(off).forEach(date => {
    const meals = S.meals[iso(date)] || {};

    SLOTS.forEach(([slot]) => {
      (meals[slot]?.i || "")
        .split(/[\n,]/)
        .map(x => x.trim())
        .filter(Boolean)
        .forEach(item => {
          if (!existing.has(item.toLowerCase())) {
            existing.add(item.toLowerCase());

            S.shop.push({
              n: item,
              d: false
            });

            count++;
          }
        });
    });
  });

  save();

  page = "shop";

  render();
}

function shop() {
  let html = `
    <h1>🛒 Liste de courses</h1>

    <div class="row card">

      <input
        id="new"
        placeholder="Ajouter un article"
        onkeydown="if(event.key==='Enter')add()"
      >

      <button onclick="add()">
        +
      </button>

    </div>

    <div class="card">
  `;

  if (!S.shop.length) {
    html += `
      <p style="color:var(--mut)">
        Rien pour l'instant.
      </p>
    `;
  }

  S.shop.forEach((item, index) => {
    html += `
      <div class="item ${item.d ? "done" : ""}">

        <input
          type="checkbox"
          ${item.d ? "checked" : ""}
          onchange="
            S.shop[${index}].d=this.checked;
            save();
            shop()
          "
        >

        <span>
          ${esc(item.n)}
        </span>

        <button
          onclick="
            S.shop.splice(${index},1);
            save();
            shop()
          "
        >
          ✕
        </button>

      </div>
    `;
  });

  html += `</div>`;

  if (S.shop.some(item => item.d)) {
    html += `
      <button
        class="sec"
        onclick="
          S.shop=S.shop.filter(x=>!x.d);
          save();
          shop()
        "
      >
        Supprimer les articles cochés
      </button>
    `;
  }

  $("#app").innerHTML = html;
}

function add() {
  const input = $("#new");
  const value = input.value.trim();

  if (!value) return;

  S.shop.push({
    n: value,
    d: false
  });

  save();

  shop();
}

function phase() {
  const index = tmp.ph ?? phaseFor(0) ?? 0;
  const currentPhase = PHASES[index];

  $("#app").innerHTML = `
    <button
      class="sec"
      onclick="page='plan';render()"
    >
      ← Retour
    </button>

    <h1 style="margin-top:12px">
      Phase ${currentPhase.n}
    </h1>

    <p>
      ${currentPhase.d}
    </p>

    <div class="card">

      <b>
        Aliments recommandés
      </b>

      <ul>
        ${currentPhase.f
          .map(food => `<li>${food}</li>`)
          .join("")}
      </ul>

    </div>

    <button
      class="sec"
      onclick="
        tmp.ph=(${index}+1)%4;
        phase()
      "
    >
      Voir la phase suivante →
    </button>

    <p
      style="
        color:var(--mut);
        font-size:.85rem;
        margin-top:16px
      "
    >
      Ces conseils sont généraux et ne remplacent
      pas un avis médical.
    </p>

    <button
      class="sec"
      onclick="page='settings';render()"
    >
      ⚙️ Modifier mon profil
    </button>
  `;
}

function setD(key, field, value) {
  S.desserts = S.desserts || {};
  S.desserts[key] = S.desserts[key] || {};
  S.desserts[key][field] = value;

  save();
}

function settings() {
  const profile = S.profile;
  const currentPhase = phaseFor(0);

  const buttonClass = active =>
    active ? "" : "sec";

  let html = `
    <h1>⚙️ Profil</h1>

    <div class="card">

      <b>Je suis</b>

      <div class="choice">

        <button
          class="${buttonClass(profile.sex === "m")}"
          onclick="setSex('m')"
        >
          Un homme
        </button>

        <button
          class="${buttonClass(profile.sex === "f")}"
          onclick="setSex('f')"
        >
          Une femme
        </button>

      </div>
  `;

  if (profile.sex === "f") {
    html += `
      <b>Adapter à mon cycle ?</b>

      <div class="choice">

        <button
          class="${buttonClass(profile.cycle)}"
          onclick="setCyc(true)"
        >
          Oui
        </button>

        <button
          class="${buttonClass(!profile.cycle)}"
          onclick="setCyc(false)"
        >
          Non
        </button>

      </div>
    `;

    if (profile.cycle) {
      html += `
        <b>Je suis en phase</b>

        <div class="choice">

          ${PHASES.map(
            (phase, index) => `
              <button
                class="${buttonClass(
                  currentPhase === index
                )}"
                onclick="setPhase(${index})"
              >
                ${phase.n}
              </button>
            `
          ).join("")}

        </div>
      `;
    }
  }

  html += `
    </div>
  `;

  $("#app").innerHTML = html;
}

function setSex(sex) {
  S.profile.sex = sex;

  save();

  settings();
}

function setCyc(value) {
  S.profile.cycle = value;

  if (value) {
    S.profile.since =
      weekStart(0).toISOString();
  }

  save();

  settings();
}

function setPhase(index) {
  S.profile.idx = index;
  S.profile.since =
    weekStart(0).toISOString();

  save();

  settings();
}

document
  .querySelectorAll("#tabs button")
  .forEach(button => {
    button.onclick = () => {
      page = button.dataset.p;
      render();
    };
  });

render();
```
