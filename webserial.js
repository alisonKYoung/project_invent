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
const sensorDropdown = document.getElementById('sensorDropdown');
const selectButton = document.getElementById('selectButton');
const disconnectButton = document.getElementById('disconnectButton');
const resetChartButton = document.getElementById('resetChart');
const ctx = document.getElementById('gasChart');
const gasChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'PPM',
            data: []
        }]
    }
})

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
            output.textContent = "Connected!"
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
        isReading = true;
        read_sensor()
        toggleRead.textContent='stop reading data'
    }
}

async function read_sensor() {
    //TODO add plot using x: tick, y: value and generate plot button
    //Also maybe add reset plot
    var tick = 0;
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

                    let line;
                    while ((line = buffer.split('\n')[0]) && buffer.includes('\n')) {
                        buffer = buffer.slice(line.length + 1);
                        output.textContent = line.trim();
                        val = Number.parseFloat(line.trim());
                        if (!Number.isNaN(val)) {
                            updateGraph(tick, val);
                        }
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
    output.textContent = "Swapped sensor!";
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
    output.textContent = "Disconnected!";
}

function updateGraph(x, y) {
    gasChart.data.labels.push(x);
    gasChart.data.datasets[0].data.push(y);
    gasChart.update();
}

function clearGraph() {
    gasChart.data.labels = [];
    gasChart.data.datasets[0].data = [];
    gasChart.update();
}

toggleRead.addEventListener('click', toggle_read_sensor);
selectButton.addEventListener('click', () => {
    setCurrentSensor(sensorDropdown.value);
})
disconnectButton.addEventListener('click', disconnect);
resetChartButton.addEventListener('click', clearGraph);