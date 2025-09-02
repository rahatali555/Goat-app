
// Wait for the form with id "goatForm" to be submitted
document.getElementById("goatForm").addEventListener("submit", function(event) {
  
  // Prevent the page from reloading when the form is submitted
  event.preventDefault();

  // Get the value entered by the user in the "breed" input field
  const breed = document.getElementById("breed").value;

  // Get the value entered by the user in the "age" input field
  const age = document.getElementById("age").value;

  // Get the value entered by the user in the "weight" input field
  const weight = document.getElementById("weight").value;

  // Display the collected goat information in the "result" element on the page
  document.getElementById("result").innerHTML = `
    <p>Goat Breed: ${breed}</p>
    <p>Age: ${age} months</p>
    <p>Weight: ${weight} kg</p>
    <p>📋 Feeding plan will be calculated here!</p>
  `;
});
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
  Object.entries(recipe).forEach(([K,r])=>{
    out [LABELS[k]||k]=(totalkg*r).toFixed(3)+ "kg/day";
  }); 
  return out;
}