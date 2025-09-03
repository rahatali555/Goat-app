

// Local mix recipes (ratios must sum to 1)
const MIXES={
grower:{
  wheat_bran:0.40, //Chokar
  crushed_maize:0.30,//Makai Dana
  cottonseed_cake:0.20, // Khal Binola(or sarsun khal / Chana Chiri)
  rice_polish:0.08,// chawal Chokar
  mineral_salt:0.02 //~ 1.5% mineral + 0.5% salt
}
,
lactation:{
wheat_bran: 0.30,
crushed_maize:0.25,  
oilseed_cake: 0.35,   // Sarson Khal / Binola Khal
rice_polish: 0.08,
mineral_salt: 0.02
},
fattening:{
    crushed_maize: 0.45,
    wheat_bran: 0.25,
    oilseed_cake: 0.25,
    molasses:0.03, // Sheera (optional)
     mineral_salt: 0.02
}
};
// Labels in English + Roman Urdu
const LABELS={
  wheat_bran: "Wheat Bran - Chokar",
  crushed_maize: "Crushed Maize - Makai Dana",
  cottonseed_cake: "Cottonseed Cake - Khal Binola",
  rice_polish: "Rice Polish - Chawal Chokar",
  oilseed_cake: "Oilseed Cake - Sarson Khal / Binola Khal",
  chickpea_broken: "Chickpea Broken - Chana Churi/  chaney ka dalia",
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
function splitByRecipe(mixName,totalkg){
  const recipe = MIXES[mixName];
  const out = {};
  Object.entries(recipe).forEach(([k,r])=>{
    out [LABELS[k] || k] = (totalkg*r).toFixed(3)+ "kg/day";
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
    "Green Fodder (Hara Chara)": stage.green.toFixed(2) + " kg/day (Berseem, Lucerne, Jowar, Bajra, Makai Hara)",
    "Dry Fodder (Sookha Chara)": stage.dry.toFixed(2) + " kg/day (Bhusa, Parali, Sookha Makai)",
    "Total Mix (Khal/Chokar Dana)": totalMix.toFixed(2) + " kg/day",
    "Ingredients (Bilingual)": ingredients,
    Water: (weight * 0.1).toFixed(1) + " liter/day (Pani)"
  };
}

// ---------------- NOW FORM SUBMIT ----------------
document.getElementById("goatForm").addEventListener("submit", function(event) {
  event.preventDefault();
  const age = parseFloat(document.getElementById("age").value);
  const weight = parseFloat(document.getElementById("weight").value);
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
    ingredientsList += `<li>${qty}</strong> - ${item}</li>`;
  }
