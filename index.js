
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