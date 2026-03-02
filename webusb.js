let port; // Declare port at the top level so it persists

const connectButton = document.getElementById('connectButton');
const output = document.getElementById('kekw');

connectButton.addEventListener('click', async () => {
    try {
        // Only request a new port if we don't have one
        if (!port) {
            port = await navigator.serial.requestPort();
        }
        
        // Only open if not already open
        if (!port.opened) {
            await port.open({ baudRate: 9600 });
            output.textContent += 'Connected to device!\n';
        }
    } catch (error) {
        output.textContent += 'Connection failed: ' + error + '\n';
        port = null; // Reset port on error
        return;
    }

    // Function to continuously read data from the port
    if (port.readable) {
        const reader = port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    reader.releaseLock();
                    break;
                }
                output.textContent += new TextDecoder().decode(value);
                output.scrollTop = output.scrollHeight;
            }
        } catch (error) {
            output.textContent += 'Error reading data: ' + error + '\n';
        } finally {
            reader.releaseLock();
        }
    }
});
