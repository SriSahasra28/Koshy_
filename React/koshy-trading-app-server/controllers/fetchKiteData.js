const { KiteConnect } = require("kiteconnect");
const dotenv = require("dotenv");

// Load environment variables from the .env file
dotenv.config();

const kc = new KiteConnect({
  api_key: process.env.API_KEY,
});

kc.setAccessToken(process.env.ACCESS_TOKEN); 

async function fetchHistoricalData(token, interval, from_date, to_date) {
  console.log('interval:', interval);
  try {
    const data = await kc.getHistoricalData(token, interval, from_date, to_date, false, false);
    const formattedData = data.map(entry => {
      return {
        datetime: formatDate(entry.date), // Format date using the custom formatDate function
        open: entry.open,
        high: entry.high,
        low: entry.low,
        close: entry.close,
        volume: entry.volume
      };
    });
    return formattedData;
  } catch (error) {
    console.error("Error fetching historical data: ", error);
    return null; // Indicate that an error occurred
  }
}

async function downloadInstruments() {
  try {
    // Fetch instruments
    const instruments = await kc.getInstruments();

    // Convert instruments to JSON format
    const instrumentsJson = JSON.stringify(instruments, null, 2);

    // Save instruments to a file
    fs.writeFileSync("instruments.json", instrumentsJson);
    console.log("Instruments downloaded and saved to instruments.json");
  } catch (error) {
    console.error("Error fetching instruments:", error);
  }
}
function token_by_name(tradingSymbol) {
  try {
    // Read the instruments.json file
    const data = fs.readFileSync("instruments.json");
    const instruments = JSON.parse(data);

    // Search for the trading symbol
    const instrument = instruments.find(inst => inst.tradingsymbol === tradingSymbol);

    if (instrument) {
      return instrument.instrument_token; // Return the instrument token
    } else {
      console.log(`Trading symbol "${tradingSymbol}" not found.`);
      return null; // Return null if not found
    }
  } catch (error) {
    console.error("Error reading instruments file:", error);
  }
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


module.exports = fetchHistoricalData;