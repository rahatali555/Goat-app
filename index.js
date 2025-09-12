// ---------- your original data (unchanged) ----------
const MIXES = {
  grower:{
    wheat_Bran:0.40,
    crushed_maize:0.30,
    cottonseed_cake:0.20,
    rice_polish:0.08,
    mineral_salt:0.02,
    chickpea_Broken: 0.10
  },
  lactation:{
    wheat_Bran: 0.30,
    crushed_maize:0.25,
    oilseed_cake: 0.35,
    rice_polish: 0.08,
    mineral_salt: 0.02,
    chickpea_Broken: 0.10
  },
  fattening:{
    crushed_maize: 0.45,
    wheat_Bran: 0.25,
    oilseed_cake: 0.25,
    molasses:0.03,
    mineral_salt: 0.02,
    chickpea_Broken: 0.08
  }
};

const LABELS = {
  wheat_Bran: "Wheat Bran - Chokar",
  crushed_maize: "Crushed Maize - Makai Dana",
  cottonseed_cake: "Cottonseed Cake - Khal Binola",
  rice_polish: "Rice Polish - Chawal Chokar",
  oilseed_cake: "Oilseed Cake - Sarson Khal / Binola Khal",
  chickpea_Broken: "Chickpea Broken - Chana Churi/  chaney ka dalia",
  molasses: "Molasses - Sheera",
  mineral_salt: "Mineral Mix + Namak"
};

const LARGE=["Beetal","Kamori","Dera Din Panah","DDP"];
const SMALL=["Barbari","Khagani"];

// ---------- helper: normalize recipe so ratios sum to 1 ----------
function normalizeRecipe(recipe){
  const total = Object.values(recipe).reduce((s,v) => s + v, 0);
  if (Math.abs(total - 1) < 1e-6) return recipe; // already normalized
  const normalized = {};
  Object.entries(recipe).forEach(([k,v]) => {
    normalized[k] = v / total;
  });
  console.warn(`Normalized ${JSON.stringify(Object.keys(recipe))} (sum was ${total.toFixed(3)})`);
  return normalized;
}

// pickMix: made case-insensitive and accepts some variants
function pickMix(ageMonths, purposeHint){
  const hint = (purposeHint || "").toString().toLowerCase();
  if (hint === "lactation" || hint === "lactating") return "lactation";
  if (hint === "fattening") return "fattening";
  return ageMonths <= 12 ? "grower" : "lactation";
}

function baseAmount(ageMonths,weight){
  if(ageMonths<=1) return {green:0.2, dry:0, mix:0};
  if(ageMonths<=3) return {green:0.8, dry:0, mix:0.12};
  if(ageMonths<=6) return {green: Math.max(1, weight*0.02 + 1), dry:0.3, mix:0.2};
  if(ageMonths<=12) return {green: weight*0.08, dry: weight*0.018, mix: weight*0.007};
  return {green: weight * 0.10, dry: weight * 0.025, mix: weight * 0.010};
}

function breedAdjustMix(breed, mixkg){
  if (LARGE.includes(breed)) return mixkg * 1.2;
  if (SMALL.includes(breed)) return mixkg * 0.8;
  return mixkg;
}

// splitByRecipe now uses normalized ratios
function splitByRecipe(mixName, totalkg) {
  const rawRecipe = MIXES[mixName];
  if (!rawRecipe) throw new Error(`Unknown mix: ${mixName}`);
  const recipe = normalizeRecipe(rawRecipe);

  const out = {};
  Object.entries(recipe).forEach(([k, r]) => {
    const kg = totalkg * r;
    const grams = kg * 1000;
    out[LABELS[k] || k] = {
      kg: kg.toFixed(3),
      g: grams.toFixed(0)
    };
  });
  return out;
}

function getFeedingPlan({breed, ageMonths, weight, purpose, sex, pregnant, lactating}){
  const stage = baseAmount(ageMonths, weight);
  const mixName = pickMix(ageMonths, purpose);
  let totalMix = breedAdjustMix(breed, stage.mix);

  if ((purpose || "").toString().toLowerCase() === "lactation") totalMix = Math.max(totalMix, weight * 0.012);
  if ((purpose || "").toString().toLowerCase() === "fattening") totalMix = Math.max(totalMix, weight * 0.015);

  if (sex === "female" && pregnant) totalMix *= 1.2;
  if (sex === "female" && lactating) totalMix *= 1.3;

  const ingredients = splitByRecipe(mixName, totalMix);

  return {
    Breed: breed,
    Age_Months: ageMonths,
    Weight_Kg: weight,
    Purpose: purpose || (ageMonths <= 12 ? "Grower (Naujawan Bacha)" : "Maintenance (Doodh/Goat Rakna)"),
    sex: sex,
    pregnant: pregnant,
    lactating: lactating,
    "Green Fodder (Hara Chara)": (stage.green * 1000).toFixed(0) + " g/day (Berseem, Lucerne, Jowar, Bajra, Makai Hara)",
    "Dry Fodder (Sookha Chara)": (stage.dry * 1000).toFixed(0) + " g/day (Bhusa, Parali, Sookha Makai)",
    "Total Mix (Khal/Chokar Dana)": (totalMix * 1000).toFixed(0) + " g/day",
    "Ingredients (Bilingual)": ingredients,
    Water: (weight * 0.1).toFixed(1) + " liter/day (Pani)"
  };
}

// ---------- DOM-safe setup: wait for DOM ----------
document.addEventListener("DOMContentLoaded", () => {
  const goatForm = document.getElementById("goatForm");
  if (!goatForm) {
    console.error("goatForm not found in DOM. Make sure form has id='goatForm' or move script below the form.");
    return;
  }

  goatForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const breed = (document.getElementById("breed")?.value || "").trim();
    const age = parseFloat(document.getElementById("age")?.value);
    const weight = parseFloat(document.getElementById("weight")?.value);
    const purpose = document.getElementById("purpose")?.value || "";
    const sex = document.getElementById("sex")?.value || "";
    const pregnant = !!document.getElementById("pregnant")?.checked;
    const lactating = !!document.getElementById("lactating")?.checked;

    if (isNaN(age) || age <= 0 || isNaN(weight) || weight <= 0) {
      alert("❌ Please enter valid positive numbers for Age and Weight.");
      return;
    }

    const plan = getFeedingPlan({
      breed,
      ageMonths: age,
      weight,
      purpose,
      sex,
      pregnant,
      lactating
    });

    let ingredientsList = "";
    for (const [item, qty] of Object.entries(plan["Ingredients (Bilingual)"])) {
      ingredientsList += `<li><strong>${qty.kg} kg/day (${qty.g} g/day)</strong> - ${item}</li>`;
    }

    const html = `
      <div class="space-y-4">
        <div class="bg-green-50 p-4 rounded-lg">
          <h3 class="font-bold text-green-700 mb-2">🐐 Goat Info</h3>
          <p><b>Breed:</b> ${plan.Breed}</p>
          <p><b>Age:</b> ${plan.Age_Months} months</p>
          <p><b>Weight:</b> ${plan.Weight_Kg} kg</p>
          <p><b>Purpose:</b> ${plan.Purpose}</p>
          <p><b>sex:</b> ${plan.sex}</p>
          <p><b>pregnant:</b> ${plan.pregnant ? "Yes" : "No"}</p>
          <p><b>lactating:</b> ${plan.lactating ? "Yes" : "No"}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="p-3 bg-green-100 rounded-lg">🌿 <b>${plan["Green Fodder (Hara Chara)"]}</b></div>
          <div class="p-3 bg-yellow-100 rounded-lg">🌾 <b>${plan["Dry Fodder (Sookha Chara)"]}</b></div>
          <div class="p-3 bg-blue-100 rounded-lg col-span-2">🥣 <b>${plan["Total Mix (Khal/Chokar Dana)"]}</b></div>
          <div class="p-3 bg-cyan-100 rounded-lg col-span-2">💧 <b>${plan.Water}</b></div>
        </div>

        <div>
          <h3 class="font-bold text-green-700 mb-2">⚖️ Ingredients</h3>
          <ul class="list-disc pl-5 space-y-1 text-gray-700">
            ${ingredientsList}
          </ul>
        </div>
      </div>
    `;

    const card = document.getElementById("planCard");
    const content = document.getElementById("planContent");
    if (card) card.style.display = "block";
    if (content) content.innerHTML = html;
  });
});
