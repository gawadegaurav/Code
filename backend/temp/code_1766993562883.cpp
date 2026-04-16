#include <iostream>
using namespace std;

int main() {
    float numbers[5]; // Array to hold 5 numbers
    float sum = 0.0;  // Variable to hold the sum

    // Prompting the user to input 5 numbers
    cout << "Enter 5 numbers:" << endl;

    for (int i = 0; i < 5; i++) {
        cout << "Number " << (i + 1) << ": ";
        cin >> numbers[i]; // Read each number
        sum += numbers[i]; // Add the number to the sum
    }

    // Display the sum
    cout << "The sum of the numbers is: " << sum << endl;

    return 0;
}