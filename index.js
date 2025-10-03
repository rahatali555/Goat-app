// ---------- Event Listener for PDF Download ----------
document.getElementById("downloadPdf").addEventListener("click", async () => {
  const formData = {
    breed: document.getElementById("breed").value,
    ageMonths: parseFloat(document.getElementById("age").value),
    weight: parseFloat(document.getElementById("weight").value),
    purpose: document.getElementById("purpose").value,
    sex: document.getElementById("sex").value,
    pregnant: document.getElementById("pregnant").checked,
    lactating: document.getElementById("lactating").checked,
      temperature: parseFloat(document.getElementById("temperature")?.value) || 28
  };

  // ✅ Generate full feeding plan
  const plan = getFeedingPlan(formData);
  console.log("🐐 Full Feeding Plan:", plan);

  // ✅ Flatten Ingredients into simple string
// ✅ Flatten Ingredients into simple string (safely)
// build ingredientsList safely
let ingredientsList = "";
if (plan["Ingredients (Bilingual)"] && Object.keys(plan["Ingredients (Bilingual)"]).length > 0) {
  for (const [item, qty] of Object.entries(plan["Ingredients (Bilingual)"])) {
    ingredientsList +=`${item}: ${qty.kg} kg (${qty.g} g)\n`;
}
}
console.log("⚖️ Ingredients Text:", ingredientsList);

  // ✅ Create final pdfData
  const pdfData = {
    Breed: plan.Breed,
    Age_Display: formatAgeDisplay(plan.Age_Months), // ✅ Add this
    Weight_Kg: plan.Weight_Kg,
    Purpose: plan.Purpose,
    sex: plan.sex,
    pregnant: plan.pregnant ? "Yes" : "No",
    lactating: plan.lactating ? "Yes" : "No",
    GreenFodder: plan["Green Fodder (Hara Chara)"],
    DryFodder: plan["Dry Fodder (Sookha Chara)"],
    TotalMix: plan["Total Mix (Khal/Chokar Dana)"],
    Milk: plan.Age_Months <= 1 ? plan.Milk : null,  // ✅ Only for babies
    Water: plan.Water,
     Ingredients: plan.Age_Months > 1 ? ingredientsList : null
  };
    console.log("📤 Sending PDF Data:", pdfData);
// ✅ Add Milk only for babies
if (plan.Age_Months <= 1 && plan.Milk) {
  pdfData.Milk = plan.Milk;
}

  console.log("📤 Sending PDF Data:", pdfData);

  // ✅ Send PDF request to server
  const response = await fetch("http://localhost:4000/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pdfData)
  });

  if (!response.ok) {
    alert("Error generating PDF");
    return;
  }

  // ✅ Download PDF blob
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "feeding-plan.pdf";
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- Data ----------
const MIXES = {
  grower: {
    wheat_Bran: 0.40,
    crushed_maize: 0.30,
    cottonseed_cake: 0.20,
    rice_polish: 0.08,
    mineral_salt: 0.02,
    chickpea_Broken: 0.10
  },
  lactation: {
    wheat_Bran: 0.30,
    crushed_maize: 0.25,
    oilseed_cake: 0.35,
    rice_polish: 0.08,
    mineral_salt: 0.02,
    chickpea_Broken: 0.10
  },
  fattening: {
    crushed_maize: 0.45,
    wheat_Bran: 0.25,
    oilseed_cake: 0.25,
    molasses: 0.03,
    mineral_salt: 0.02,
    chickpea_Broken: 0.08
  }
};

const LABELS = {
  wheat_Bran: "Gandum ka Chokar",
  crushed_maize: "Tooti Hui Makai",
  cottonseed_cake: "Banola Khal",
  rice_polish: "Chawal ki Polish",
  oilseed_cake: "Sarson ki Khal",
  chickpea_Broken: "Chanay ka Toota",
  molasses: "Sheera (Gur ka Ras)",
  mineral_salt: "Madni Ajza + Namak"
};

const LARGE = ["Beetal", "Kamori", "Dera Din Panah", "DDP"];
const SMALL = ["Barbari", "Kaghani"];
// ✅ This is the "recipe" to turn 0.5 → "15 days"
function formatAgeDisplay(age) {
  if (age < 1) {
    const days = Math.round(age * 30);
    return days === 1 ? "1 day" : `${days} days`;
  }
  return age === 1 ? "1 month" : `${age} months`;
}
// ---------- Helpers ----------
function normalizeRecipe(recipe) {
  const total = Object.values(recipe).reduce((s, v) => s + v, 0);
  if (Math.abs(total - 1) < 1e-6) return recipe;
  const normalized = {};
  Object.entries(recipe).forEach(([k, v]) => {
    normalized[k] = v / total;
  });
  console.warn(`Normalized ${JSON.stringify(Object.keys(recipe))} (sum was ${total.toFixed(3)})`);
  return normalized;
}

function pickMix(ageMonths, purposeHint) {
  const hint = (purposeHint || "").toString().toLowerCase();
  if (hint === "lactation" || hint === "lactating") return "lactation";
  if (hint === "fattening") return "fattening";
  return ageMonths <= 12 ? "grower" : "lactation";
}

function baseAmount(ageMonths, weight) {
  if (ageMonths <= 1) return { green: 0, dry: 0, mix: 0, milk: weight * 0.15 };
  if (ageMonths <= 3) return { green: 0.8, dry: 0, mix: 0.12,milk: 0 };
  if (ageMonths <= 6) return { green: Math.max(1, weight * 0.02 + 1), dry: 0.3, mix: 0.2,milk: 0 };
  if (ageMonths <= 12) return { green: weight * 0.08, dry: weight * 0.018, mix: weight * 0.007,milk: 0 };
  return { green: weight * 0.10, dry: weight * 0.025, mix: weight * 0.010,milk: 0 };
}


function breedAdjustMix(breed, mixkg) {
  if (LARGE.includes(breed)) return mixkg * 1.2;
  if (SMALL.includes(breed)) return mixkg * 0.8;
  return mixkg;
}

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

function getFeedingPlan({ breed, ageMonths, weight, purpose, sex, pregnant, lactating,temperature = 28 }) {
  // 🔍 ADD THIS:
// ✅ SMART WATER CALCULATOR (NEW VERSION)

  
  const stage = baseAmount(ageMonths, weight);
  const mixName = pickMix(ageMonths, purpose);
  let totalMix = breedAdjustMix(breed, stage.mix);

  // Adjust totalMix for purpose / pregnancy / lactation
  if ((purpose || "").toLowerCase() === "lactation") totalMix = Math.max(totalMix, weight * 0.012);
  if ((purpose || "").toLowerCase() === "fattening") totalMix = Math.max(totalMix, weight * 0.015);
  if (sex === "female" && pregnant) totalMix *= 1.2;
  if (sex === "female" && lactating) totalMix *= 1.3;
// ✅ SMART WATER CALCULATOR
function calculateWater({
  ageMonths,
  weightKg,
  sex = "male",
  pregnant = false,
  lactating = false,
  purpose = "",
  greenFodderKg = 0,
  dryFodderKg = 0,
  totalMixKg = 0,
  temperatureC = 25
}) {
  let basePerKg = 0.07;
  if (ageMonths < 3) basePerKg = 0.12;
  else if (ageMonths <= 12) basePerKg = 0.09;

  const purposeLower = purpose.toLowerCase();
  if (purposeLower.includes("fattening")) basePerKg = 0.10;
  if (sex === "female") {
    if (lactating) basePerKg = 0.15;
    else if (pregnant && ageMonths > 6) basePerKg *= 1.2;
  }

  let water = weightKg * basePerKg;
  const totalDryFeed = dryFodderKg + totalMixKg;
  water += totalDryFeed * 0.25;
  water -= greenFodderKg * 0.07;

  let tempMultiplier = 1.0;
  if (temperatureC > 35) tempMultiplier = 1.5;
  else if (temperatureC > 30) tempMultiplier = 1.3;
  else if (temperatureC > 25) tempMultiplier = 1.15;
  else if (temperatureC < 15) tempMultiplier = 0.9;
  water *= tempMultiplier;

  water = Math.max(water, weightKg * 0.05);
  return water.toFixed(2) + " liter/day (Pani)";
}
  const waterQty = calculateWater({
  ageMonths,
  weightKg: weight,
  sex,
  pregnant,
  lactating,
  purpose,
  greenFodderKg: stage.green || 0,
  dryFodderKg: stage.dry || 0,
  totalMixKg: totalMix || 0,
  temperatureC: temperature
});
  // ---------- Milk info for babies ----------
  let milkInfo = null;
  let ingredients = null;

  if (ageMonths <= 1) {
    // Baby goat: only milk
    let feedsPerDay = 4; // default
    if (ageMonths >= 0.25 && ageMonths <= 0.5) feedsPerDay = 3;
    if (ageMonths > 0.5) feedsPerDay = 2;
  const milkPerFeed = stage.milk / feedsPerDay;
 
    milkInfo = `${stage.milk.toFixed(2)} L/day, split into ${feedsPerDay} feeds → ${milkPerFeed} L/feed (Mother's milk or replacer)`;
      // do not populate 'Ingredients' for baby (keep null so template hides it)
    ingredients = null;
  } else {
    // Older goats: show mix ingredients only
    ingredients = splitByRecipe(mixName, totalMix);
  }

 

  return {
    Breed: breed,
    Age_Months: ageMonths,
    Weight_Kg: weight,
    Purpose: purpose || (ageMonths <= 12 ? "Grower (Naujawan Bacha)" : "Maintenance (Doodh/Goat Rakna)"),
    sex,
    pregnant,
    lactating,
    Milk: milkInfo,
    "Green Fodder (Hara Chara)": ageMonths > 1 ? (stage.green * 1000).toFixed(0) + " g/day (Berseem, Lucerne, Jowar, Bajra, Makai Hara)" : "N/A",
    "Dry Fodder (Sookha Chara)": ageMonths > 1 ? (stage.dry * 1000).toFixed(0) + " g/day (Bhusa, Parali, Sookha Makai)" : "N/A",
    "Total Mix (Khal/Chokar Dana)": ageMonths > 1 ? (totalMix * 1000).toFixed(0) + " g/day" : "N/A",
    "Ingredients (Bilingual)": ingredients,
    Water: waterQty
  };
}

// ---------- DOM Setup ----------
document.addEventListener("DOMContentLoaded", () => {
  const goatForm = document.getElementById("goatForm");
  if (!goatForm) {
    console.error("goatForm not found in DOM. Make sure form has id='goatForm'.");
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
    const temperature = parseFloat(document.getElementById("temperature")?.value) || 28;

    if (isNaN(age) || age <= 0 || isNaN(weight) || weight <= 0) {
      alert("❌ Please enter valid positive numbers for Age and Weight.");
      return;
    }

    const plan = getFeedingPlan({ breed, ageMonths: age, weight, purpose, sex, pregnant, lactating, temperature});
// 🔍 ADD THESE LINES
  console.log("🧪 Full Plan:", plan);
  console.log("🧪 Milk Value:", plan.Milk);
  console.log("🧪 Should Show Milk?", plan.Milk !== null && plan.Milk !== undefined && plan.Milk !== "");
    // let ingredientsList = "";
    // for (const [item, qty] of Object.entries(plan["Ingredients (Bilingual)"])) {
    //   ingredientsList += `<li><strong>${qty.kg} kg/day (${qty.g} g/day)</strong> - ${item}</li>`;
    // }

// const html = `
//   <div class="space-y-4">
//     <div class="bg-green-50 p-4 rounded-lg">
//       <h3 class="font-bold text-green-700 mb-2">🐐 Goat Info</h3>
//       <p><b>Breed:</b> ${plan.Breed}</p>
//       <p><b>Age:</b> ${formatAgeDisplay(plan.Age_Months)}</p>
//       <p><b>Weight:</b> ${plan.Weight_Kg} kg</p>
//       <p><b>Purpose:</b> ${plan.Purpose}</p>
//       <p><b>Sex:</b> ${plan.sex}</p>
//       <p><b>Pregnant:</b> ${plan.pregnant ? "Yes" : "No"}</p>
//       <p><b>Lactating:</b> ${plan.lactating ? "Yes" : "No"}</p>
//     </div>

//     <!-- ✅ Feeding Plan Section -->
//     <div class="bg-white p-4 rounded-lg shadow">
//       <h3 class="font-bold text-green-700 mb-2">🥗 Feeding Plan</h3>
//       ${plan.Milk ? `<p>🍼 <b>Milk:</b> ${plan.Milk}</p>` : ""}
//       ${plan["Green Fodder (Hara Chara)"] !== "N/A" ? `<p>🌿 <b>${plan["Green Fodder (Hara Chara)"]}</b></p>` : ""}
//       ${plan["Dry Fodder (Sookha Chara)"] !== "N/A" ? `<p>🌾 <b>${plan["Dry Fodder (Sookha Chara)"]}</b></p>` : ""}
//       ${plan["Total Mix (Khal/Chokar Dana)"] !== "N/A" ? `<p>🥣 <b>${plan["Total Mix (Khal/Chokar Dana)"]}</b></p>` : ""}
//       <p>💧 <b>${plan.Water}</b></p>
//     </div>

//     <!-- ✅ Ingredients only if not a baby -->
//     ${plan["Ingredients (Bilingual)"] ? `
//       <div>
//         <h3 class="font-bold text-green-700 mb-2">⚖️ Ingredients</h3>
//         <ul class="list-disc pl-5 space-y-1 text-gray-700">
//           ${Object.entries(plan["Ingredients (Bilingual)"])
//             .map(([item, qty]) => `<li><strong>${qty.kg} kg/day (${qty.g} g/day)</strong> - ${item}</li>`)
//             .join("")}
//         </ul>
//       </div>
//     ` : ""}
//   </div>
// `;

// ✅ ONLY keep this — no separate ingredientsList loop!
const html = `
  <div class="space-y-4">
    <!-- Goat Info -->
    <div class="bg-green-50 p-4 rounded-lg">
      <h3 class="font-bold text-green-700 mb-2">🐐 Goat Info</h3>
      <p><b>Breed:</b> ${plan.Breed}</p>
      <p><b>Age:</b> ${formatAgeDisplay(plan.Age_Months)}</p>
      <p><b>Weight:</b> ${plan.Weight_Kg} kg</p>
      <!-- ... other fields ... -->
    </div>

    <!-- Feeding Plan -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-bold text-green-700 mb-2">🥗 Feeding Plan</h3>
      ${(plan.Milk && plan.Milk.trim() !== "") ? `<p>🍼 <b>Milk:</b> ${plan.Milk}</p>` : ""}
      <!-- ... other feeds ... -->
      <p>💧 <b>${plan.Water}</b></p>
    </div>

    <!-- ✅ ONLY THIS FOR INGREDIENTS -->
    ${plan["Ingredients (Bilingual)"] ? `
      <div>
        <h3 class="font-bold text-green-700 mb-2">⚖️ Ingredients</h3>
        <ul class="list-disc pl-5 space-y-1 text-gray-700">
          ${Object.entries(plan["Ingredients (Bilingual)"])
            .map(([item, qty]) => `<li><strong>${qty.kg} kg/day (${qty.g} g/day)</strong> - ${item}</li>`)
            .join("")}
        </ul>
      </div>
    ` : ""}
  </div>
`;

// Update DOM
document.getElementById("planContent").innerHTML = html;



    // Update UI
    const card = document.getElementById("planCard");
    const content = document.getElementById("planContent");
    const downloadBtn = document.getElementById("downloadPdf");

    if (card) card.style.display = "block";
    if (content) content.innerHTML = html;
    if (downloadBtn) downloadBtn.removeAttribute("hidden");
  });
});
