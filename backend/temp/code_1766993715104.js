let number1 = 5;
let number2 = 10;
let number3 = 15;
let number4 = 20;
let number5 = 25;

// Add the numbers together
let sum = number1 + number2 + number3 + number4 + number5;

// Output the result
console.log("The sum is: " + sum);
```

### Example 2: Using an Array and a Loop

```javascript
// Define an array with the five numbers
let numbers = [5, 10, 15, 20, 25];

// Initialize sum variable
let sum = 0;

// Loop through the array to add each number
for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
}

// Output the result
console.log("The sum is: " + sum);