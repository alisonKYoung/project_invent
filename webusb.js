const connectButton = document.getElementById('connectButton');
const output = document.getElementById('kekw');

connectButton.addEventListener('click', async () => {
    try {
        // Prompt user to select a serial port
        const port = await navigator.serial.requestPort();
        // Open the port with the same baud rate as the Arduino sketch
        await port.open({ baudRate: 9600 });
    } catch (error) {
        alert('Connection failed: ', error);
    }

    // Function to continuously read data from the port
    while (port.readable) {
        const reader = port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    // Allow the serial port to be closed later
                    reader.releaseLock();
                    break;
                }
                // Convert the data to text and append to the output area
                output.textContent += value;
                output.scrollTop = output.scrollHeight; // Scroll to bottom
            }
        } catch (error) {
            alert('Error reading data: ', error);
        } finally {
            reader.releaseLock();
        }
    }
});