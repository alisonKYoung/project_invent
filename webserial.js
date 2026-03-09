let port; // Declare port at the top level so it persists
let intervalId = null;
let isReading = false;

const connectButton = document.getElementById('connectButton');
const output = document.getElementById('kekw');
const toggleRead = document.getElementById('readButton')
const mq4Button = document.getElementById('mq4Button');

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
});

async function toggle_read_sensor() {
    if (isReading) {
        clearInterval(intervalId);
        isReading = false;
        toggleRead.textContent='start reading data';
    } else {
        intervalId = setInterval(read_sensor, 200);
        isReading = true;
        toggleRead.textContent='stop reading data'
    }
}

async function read_sensor() {
    if (port.readable) {
        const reader = port.readable.getReader();
        try {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
            }
            output.textContent += new TextDecoder().decode(value);
            if(output.textContent.includes("\n")) {
                output.textContent = "";  
            }
        } catch (error) {
            output.textContent += 'Error reading data: ' + error + '\n';
        } finally {
            reader.releaseLock();
        }
    }
}

async function writeToSensor(text) {
    if (!port || !port.writable) {
        console.error("Serial port not open or writable.");
        return;
    }
    if (isReading) {
        await toggle_read_sensor();
    }

    // Create a TextEncoder to convert string to bytes
    const encoder = new TextEncoder();
    const textArrayBuffer = encoder.encode(text);

    // Get a writer from the writable stream
    const writer = port.writable.getWriter();

    try {
        // Write the data to the port
        await writer.write(textArrayBuffer);
    } catch (err) {
        console.error("Error writing to serial port:", err);
    } finally {
        // Release the writer lock
        writer.releaseLock();
    }
}

toggleRead.addEventListener('click', toggle_read_sensor);
mq4Button.addEventListener('click', async () => {
    await writeToSensor("mq4\n");
})
