
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
  wheat_Bran:0.40, //Chokar
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