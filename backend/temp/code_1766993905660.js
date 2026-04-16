
function addFiveNumbers() {
    let sum = 0;

    for (let i = 1; i <= 5; i++) {
        // Prompt the user to enter a number
        const number = parseFloat(prompt(`Enter number ${i}:`));
        
        // Ensure the input is valid
        if (!isNaN(number)) {
            sum += number;
        } else {
            console.log("Please enter a valid number.");
            i--; // Keep asking for the same index if input is invalid
        }
    }

    // Display the result
    alert(`The sum of the numbers is: ${sum}`);
}

// Call the function to run the code
addFiveNumbers();
