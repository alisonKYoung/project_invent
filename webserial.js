let port; // Declare port at the top level so it persists
let intervalId = null;
let isReading = false;
let currentSensor = "";
let reader;
let buffer = "";
let decoder;

const connectButton = document.getElementById('connectButton');
const output = document.getElementById('kekw');
const toggleRead = document.getElementById('readButton');
const mq4Button = document.getElementById('mq4Button');
const disconnectButton = document.getElementById('disconnectButton');

connectButton.addEventListener('click', async () => {
    try {
        // Only request a new port if we don't have one
        if (!port) {
            port = await navigator.serial.requestPort();
        }

        if (port.opened) {
            await port.close();
        }
        
        // Only open if not already open
        if (!port.opened) {
            await port.open({ baudRate: 9600 });
            decoder = new TextDecoderStream()
            const inputDone = port.readable.pipeTo(decoder.writable);
            
            // Get a reader from the transformed stream and start the read loop
            reader = decoder.readable.getReader();
            output.textContent = "connected!"
        }

    } catch (error) {
        port = null; // Reset port on error
        console.log(error);
        return;
    }
});

async function toggle_read_sensor() {
    if (isReading) {
        isReading = false;
        reader.cancel();
        toggleRead.textContent='start reading data';
        writeToSensor("remove\n");
    } else {
        writeToSensor(currentSensor);
        read_sensor()
        isReading = true;
        toggleRead.textContent='stop reading data'
    }
}

async function read_sensor() {
    if (port.readable) {
        while (true) {
            try {
                const { value, done } = await reader.read();
                if (done || !isReading) {
                    reader.releaseLock();
                    break;
                }
                if (value) {
                    buffer += value;

                    buffer = buffer.replace(/\r\n/g, '\n');
                    console.log(buffer);

                    let line;
                    while ((line = buffer.split('\n')[0]) && buffer.includes('\n')) {
                        buffer = buffer.slice(line.length + 1);
                        output.textContent = line.trim();
                    }
                }
                
            } catch (error) {
                output.textContent = 'Error reading data: ' + error + '\n';
            }
        }
    }
}

async function writeToSensor(text) {
    if (!port || !port.writable) {
        console.error("Serial port not open or writable.");
        return;
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

function setCurrentSensor(sensor) {
    currentSensor = sensor;
}

async function disconnect() {
    if (reader) {
        await reader.cancel();
        reader = null;
    }

    if (port) {
        await port.close();
        console.log("port closed");
        await port.forget();
        port = null;
    }

    decoder = null;
    output.textContent = "disconnected";
}

toggleRead.addEventListener('click', toggle_read_sensor);
mq4Button.addEventListener('click', () => {
    setCurrentSensor("mq4\n");
})
disconnectButton.addEventListener('click', disconnect);
