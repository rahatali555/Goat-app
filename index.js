

// Local mix recipes (ratios must sum to 1)
const MIXES={
grower:{
  wheat_Bran:0.40, //Chokar
  crushed_maize:0.30,//Makai Dana
  cottonseed_cake:0.20, // Khal Binola(or sarsun khal / Chana Chiri)
  rice_polish:0.08,// chawal Chokar
  mineral_salt:0.02, //~ 1.5% mineral + 0.5% salt
    chickpea_Broken: 0.10  // Chana Churi/Daliya  (≈10%)
}
,
lactation:{
wheat_Bran: 0.30,
crushed_maize:0.25,  
oilseed_cake: 0.35,   // Sarson Khal / Binola Khal
rice_polish: 0.08,
mineral_salt: 0.02,
chickpea_Broken: 0.10   // start at 10%, can move to 12–15% if needed
},
fattening:{
    crushed_maize: 0.45,
    wheat_Bran: 0.25,
    oilseed_cake: 0.25,
    molasses:0.03, // Sheera (optional)
     mineral_salt: 0.02,
      chickpea_Broken: 0.08,   // 8% in finishing ration
}
};
// Labels in English + Roman Urdu
const LABELS={
  wheat_Bran: "Wheat Bran - Chokar",
  crushed_maize: "Crushed Maize - Makai Dana",
  cottonseed_cake: "Cottonseed Cake - Khal Binola",
  rice_polish: "Rice Polish - Chawal Chokar",
  oilseed_cake: "Oilseed Cake - Sarson Khal / Binola Khal",
  chickpea_Broken: "Chickpea Broken - Chana Churi/  chaney ka dalia",
  molasses: "Molasses - Sheera",
  mineral_salt: "Mineral Mix + Namak"
};
// Breed groups
const LARGE=["Beetal","Kamori","Dera Din Panah","DDP"];
const SMALL=["Barbari","Khagani"];
function pickMix(ageMonths,purposeHint){
  if (purposeHint==="lactation") return "lactation";
  if (purposeHint === "fattening") return "fattening";
  return ageMonths <= 12 ? "grower" : "lactation"; // default
}
function baseAmount(ageMonths,weight){
  if(ageMonths<=1)return {green:0.2, dry:0,mix:0};
  if(ageMonths<=3) return{green:0.8,dry:0,mix:0.12};
  if (ageMonths<=6) return{green:Math.max(1,weight*0.02+1), dry:0.3,mix:0.2
  };
  if(ageMonths<=12) return{ green:weight*0.08,dry:weight*0.018, mix:weight*0.007};
    return {green: weight * 0.10, dry: weight * 0.025, mix: weight * 0.010};

}
function breedAdjustMix(breed,mixkg){
  if(LARGE.includes(breed)) return mixkg*1.2;
  if(SMALL.includes(breed)) return mixkg*0.8;
  return mixkg;
}
function splitByRecipe(mixName, totalkg) {
  const recipe = MIXES[mixName];
  const out = {};
  Object.entries(recipe).forEach(([k, r]) => {
    const kg = totalkg * r;
    const grams = kg * 1000;
    out[LABELS[k] || k] = {
      kg: kg.toFixed(3),   // keep 3 decimals for kg
      g: grams.toFixed(0)  // round grams
    };
  });
  return out;
}

function getFeedingPlan({breed, ageMonths,weight,purpose}){
  const stage = baseAmount(ageMonths, weight);
  let mixName = pickMix(ageMonths, purpose);
  let totalMix =breedAdjustMix(breed,stage.mix);
   
  if (purpose==="lactation") totalMix = Math.max(totalMix,weight*0.012);
   if (purpose === "fattening") totalMix = Math.max(totalMix, weight * 0.015);
   const ingredients = splitByRecipe(mixName,totalMix);
    return {
    Breed: breed,
    Age_Months: ageMonths,
    Weight_Kg: weight,
    Purpose: purpose || (ageMonths <= 12 ? "Grower (Naujawan Bacha)" : "Maintenance (Doodh/Goat Rakna)"),
   "Green Fodder (Hara Chara)":
      (stage.green * 1000).toFixed(0) + " g/day (Berseem, Lucerne, Jowar, Bajra, Makai Hara)",
    "Dry Fodder (Sookha Chara)":
      (stage.dry * 1000).toFixed(0) + " g/day (Bhusa, Parali, Sookha Makai)",
    "Total Mix (Khal/Chokar Dana)":
      (totalMix * 1000).toFixed(0) + " g/day",
    "Ingredients (Bilingual)": ingredients,
    Water:
      (weight * 0.1).toFixed(1) +
      " liter/day (Pani)" // weight*0.1 liters = weight*100 ml
  };
}

// ---------------- NOW FORM SUBMIT ----------------
document.getElementById("goatForm").addEventListener("submit", function(event) {
  event.preventDefault();
  
  const breed = document.getElementById("breed").value.trim(); 
  const age = parseFloat(document.getElementById("age").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const purpose = document.getElementById("purpose").value;
    // Get feeding plan object
    const plan = getFeedingPlan({
      breed,
      ageMonths:age,
      weight,
      purpose:""  // later you can add dropdown for lactation/fattening
    });
    
  // Build ingredient list
  let ingredientsList ="";
  for (const[item,qty] of Object.entries(plan["Ingredients (Bilingual)"])){
     
  ingredientsList += `<li><strong>${qty.kg} kg/day (${qty.g} g/day)</strong> - ${item}</li>`; }
document.getElementById("planContent").innerHTML = `<ul>${ingredientsList}</ul>`;
// Build HTML card content
const html= `
<div class="space-y-4">
    <!-- Goat Info -->
    <div class="bg-green-50 p-4 rounded-lg">
      <h3 class="font-bold text-green-700 mb-2">🐐 Goat Info</h3>
      <p><b>Breed:</b> ${plan.Breed}</p>
      <p><b>Age:</b> ${plan.Age_Months} months</p>
      <p><b>Weight:</b> ${plan.Weight_Kg} kg</p>
      <p><b>Purpose:</b> ${plan.Purpose}</p>
    </div>

    <!-- Feeding Summary -->
    <div class="grid grid-cols-2 gap-4 text-center">
      <div class="p-3 bg-green-100 rounded-lg">
        🌿 <b>${plan["Green Fodder (Hara Chara)"]}</b>
      </div>
      <div class="p-3 bg-yellow-100 rounded-lg">
        🌾 <b>${plan["Dry Fodder (Sookha Chara)"]}</b>
      </div>
      <div class="p-3 bg-blue-100 rounded-lg col-span-2">
        🥣 <b>${plan["Total Mix (Khal/Chokar Dana)"]}</b>
      </div>
      <div class="p-3 bg-cyan-100 rounded-lg col-span-2">
        💧 <b>${plan.Water}</b>
      </div>
    </div>

    <!-- Ingredients -->
    <div>
      <h3 class="font-bold text-green-700 mb-2">⚖️ Ingredients</h3>
      <ul class="list-disc pl-5 space-y-1 text-gray-700">
        ${ingredientsList}
      </ul>
    </div>
  </div>
`;
// Show in card
  const card = document.getElementById("planCard");
  const content = document.getElementById("planContent");

  card.style.display = "block";
  content.innerHTML = html;
});