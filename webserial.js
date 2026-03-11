let port; // Declare port at the top level so it persists
let intervalId = null;
let isReading = false;
let currentSensor = "";
let reader;

const connectButton = document.getElementById('connectButton');
const output = document.getElementById('kekw');
const toggleRead = document.getElementById('readButton')
const mq4Button = document.getElementById('mq4Button');

class LineBreakTransformer {
  constructor() {
    this.container = '';
  }

  transform(chunk, controller) {
    this.container += chunk;
    const lines = this.container.split('\n');
    this.container = lines.pop(); // Keep the last, incomplete line in the container
    lines.forEach(line => controller.enqueue(line));
  }

  flush(controller) {
    controller.enqueue(this.container); // Enqueue any remaining data
  }
}

connectButton.addEventListener('click', async () => {
    try {
        // Only request a new port if we don't have one
        if (!port) {
            port = await navigator.serial.requestPort();
        }
        
        // Only open if not already open
        if (!port.opened) {
            await port.open({ baudRate: 9600 });
            const decoder = new TextDecoderStream();
            const inputDone = port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
            
            // Get a reader from the transformed stream and start the read loop
            reader = inputStream.getReader();
            output.textContent = "connected!"
        }
    } catch (error) {
        port = null; // Reset port on error
        return;
    }
});

async function toggle_read_sensor() {
    if (isReading) {
        clearInterval(intervalId);
        isReading = false;
        toggleRead.textContent='start reading data';
        writeToSensor("remove\n");
    } else {
        writeToSensor(currentSensor);
        intervalId = setInterval(read_sensor, 200);
        isReading = true;
        toggleRead.textContent='stop reading data'
    }
}

async function read_sensor() {
    if (port.readable) {
        try {
            const { value, done } = await reader.read();
            if (value) {
                output.textContent = value;
            }
            if (done) {
                reader.releaseLock();
            }
        } catch (error) {
            output.textContent = 'Error reading data: ' + error + '\n';
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

toggleRead.addEventListener('click', toggle_read_sensor);
mq4Button.addEventListener('click', () => {
    setCurrentSensor("mq4\n");
})
