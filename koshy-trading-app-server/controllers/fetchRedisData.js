const redis = require('redis');
const moment = require('moment-timezone');

const client = redis.createClient();

client.connect().catch(console.error);

async function getOhlcBySymbol(symbol) {
    try {
        const token = await client.hGet('symbol_to_token', symbol);
        if (!token) {
            return null;
        }

        // Calculate start date (45 days before current date at 09:15 AM)
        const currentDate = new Date();
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 30);
        startDate.setHours(9, 15, 0, 0);
        
        const startTimestamp = Math.floor(startDate.getTime() / 1000);
        
        // Fetch data from Redis
        const ohlcSortedData = await client.zRangeByScore('ohlc_sorted:' + token, startTimestamp, '+inf');
        
        if (!ohlcSortedData || ohlcSortedData.length === 0) {
            return null;
        }

        const ohlcList = ohlcSortedData.map(data => JSON.parse(data));

        // Check for required columns
        const requiredColumns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
        if (ohlcList.length > 0) {
            const firstEntry = ohlcList[0];
            const hasAllColumns = requiredColumns.every(col => col in firstEntry);
            if (!hasAllColumns) {
                console.log(`Missing required columns in data for token ${token}`);
                return null;
            }
        }

        // Remove entries with null/undefined OHLC values
        let filteredList = ohlcList.filter(entry => 
            entry.open != null && 
            entry.high != null && 
            entry.low != null && 
            entry.close != null
        );

        if (filteredList.length === 0) {
            return null;
        }

        // Deduplicate by timestamp, keeping last occurrence
        const seen = new Map();
        for (const entry of filteredList) {
            seen.set(entry.timestamp, entry);
        }
        filteredList = Array.from(seen.values());

        // Sort by timestamp (handle both string and numeric timestamps)
        filteredList.sort((a, b) => {
            const timestampA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const timestampB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
            return timestampA - timestampB;
        });

        // Convert timestamps to Date objects (handle both Unix timestamps and string formats)
        const dataWithDates = filteredList.map(entry => ({
            ...entry,
            datetime: typeof entry.timestamp === 'string' 
                ? new Date(entry.timestamp)  // String format like '2025-09-29 09:16:00'
                : new Date(entry.timestamp * 1000)  // Unix timestamp
        }));

        // Find unique trading days
        const uniqueDays = [...new Set(dataWithDates.map(entry => {
            const date = entry.datetime;
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }))];

        // Build expected trading minutes for each day
        const tradingMinutes = [];
        const minTimestamp = dataWithDates[0].datetime;
        const maxTimestamp = dataWithDates[dataWithDates.length - 1].datetime;

        for (const dayStr of uniqueDays) {
            const [year, month, day] = dayStr.split('-').map(Number);
            // Create market open/close in IST timezone, then convert to UTC for comparison
            const marketOpenIST = moment.tz([year, month - 1, day, 9, 15, 0, 0], 'Asia/Kolkata');
            const marketCloseIST = moment.tz([year, month - 1, day, 15, 29, 0, 0], 'Asia/Kolkata');
            
            // Convert to UTC for comparison with data timestamps
            const marketOpenUTC = marketOpenIST.utc().toDate();
            const marketCloseUTC = marketCloseIST.utc().toDate();

            const start = new Date(Math.max(marketOpenUTC.getTime(), minTimestamp.getTime()));
            const end = new Date(Math.min(marketCloseUTC.getTime(), maxTimestamp.getTime()));

            if (start <= end) {
                let current = new Date(start);
                while (current <= end) {
                    tradingMinutes.push(new Date(current));
                    current = new Date(current.getTime() + 60000); // Add 1 minute
                }
            }
        }

        if (tradingMinutes.length === 0) {
            return null;
        }

        // Create a map of existing data by timestamp string for quick lookup
        const dataMap = new Map();
        for (const entry of dataWithDates) {
            const timeKey = entry.datetime.toISOString();
            dataMap.set(timeKey, entry);
        }

        // Reindex and fill missing data
        const fullData = [];
        let previousClose = null;

        for (const minute of tradingMinutes) {
            const timeKey = minute.toISOString();
            const existingEntry = dataMap.get(timeKey);

            if (existingEntry) {
                // Use existing data
                fullData.push({
                    datetime: minute,  // CHANGED: Use datetime instead of timestamp
                    open: existingEntry.open,
                    high: existingEntry.high,
                    low: existingEntry.low,
                    close: existingEntry.close,
                    volume: existingEntry.volume || 0
                });
                previousClose = existingEntry.close;
            } else {
                // Fill with previous close
                if (previousClose !== null) {
                    fullData.push({
                        datetime: minute,  // CHANGED: Use datetime instead of timestamp
                        open: previousClose,
                        high: previousClose,
                        low: previousClose,
                        close: previousClose,
                        volume: 0
                    });
                } else {
                    // No previous close available, skip this entry
                    fullData.push({
                        datetime: minute,  // CHANGED: Use datetime instead of timestamp
                        open: null,
                        high: null,
                        low: null,
                        close: null,
                        volume: 0
                    });
                }
            }
        }

        // Filter out any remaining null entries
        const finalData = fullData.filter(entry => entry.close !== null);

        if (finalData.length === 0) {
            return null;
        }

        return finalData;

    } catch (error) {
        console.error('Error fetching OHLC data:', error);
        return null;
    }
}

async function getResampledOhlcBySymbol(symbol, interval) {
    try {
        // Special-case: 1-minute should use the canonical 1-minute source
        if (interval === '1minute') {
            console.log(`🔍 Using canonical 1-minute source for ${symbol}`);
            const oneMin = await getOhlcBySymbol(symbol);
            return oneMin || null;
        }

        // Create Redis key for resampled data (sorted set)
        const sortedSetKey = `resampled_ohlc_sorted:${symbol}:${interval}`;
        
        console.log(`🔍 Fetching pre-resampled data for ${symbol} ${interval} from Redis key: ${sortedSetKey}`);
        
        // Check if key exists
        const exists = await client.exists(sortedSetKey);
        
        if (!exists) {
            console.log(`❌ No pre-resampled data found for ${symbol} ${interval}`);
            return null;
        }
        
        // Calculate start date (30 days before current date at 09:15 AM)
        const currentDate = new Date();
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 30);
        startDate.setHours(9, 15, 0, 0);
        
        const startTimestamp = Math.floor(startDate.getTime() / 1000);
        
        // Fetch all entries from sorted set
        const resampledEntries = await client.zRangeByScore(sortedSetKey, startTimestamp, '+inf');
        
        if (!resampledEntries || resampledEntries.length === 0) {
            console.log(`❌ No resampled entries found for ${symbol} ${interval}`);
            return null;
        }
        
        // Parse JSON entries
        const candles = resampledEntries.map(entry => {
            try {
                const candleData = JSON.parse(entry);
                return {
                    datetime: candleData.datetime, // Already formatted string
                    open: candleData.open,
                    high: candleData.high,
                    low: candleData.low,
                    close: candleData.close,
                    volume: candleData.volume || 0
                };
            } catch (parseError) {
                console.error(`Error parsing resampled entry:`, parseError);
                return null;
            }
        }).filter(candle => candle !== null);
        
        if (candles.length === 0) {
            console.log(`❌ No valid resampled data after parsing for ${symbol} ${interval}`);
            return null;
        }
        
        console.log(`✅ Found ${candles.length} pre-resampled ${interval} candles for ${symbol}`);
        
        // Sort by datetime to ensure proper order
        candles.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        return candles;
        
    } catch (error) {
        console.error(`Error fetching pre-resampled data for ${symbol} ${interval}:`, error);
        return null;
    }
}

async function getCandleDataBySymbol(symbol, interval, lastNCandles = null) {
    try {
        // Create Redis key for candle_data (complete data with HA, indicators)
        const candleDataKey = `candle_data:${symbol}:${interval}`;
        
        console.log(`🔍 Checking for candle_data key: ${candleDataKey}`);
        
        // Check if key exists
        const exists = await client.exists(candleDataKey);
        
        if (!exists) {
            console.log(`❌ candle_data key not found for ${symbol} ${interval}`);
            return null;
        }
        
        let candleDataEntries;
        
        if (lastNCandles !== null && lastNCandles > 0) {
            // OPTIMIZED: Fetch only last N candles (much faster for 1min/2min intervals)
            console.log(`⚡ [OPTIMIZED] Fetching last ${lastNCandles} candles for ${symbol} ${interval}`);
            candleDataEntries = await client.zRange(candleDataKey, -lastNCandles, -1);
        } else {
            // Fetch all entries in date range (30 days)
            const currentDate = new Date();
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 30);
            startDate.setHours(9, 15, 0, 0);
            
            const startTimestamp = Math.floor(startDate.getTime() / 1000);
            
            // Fetch all entries from sorted set (candle_data stores individual candles)
            candleDataEntries = await client.zRangeByScore(candleDataKey, startTimestamp, '+inf');
        }
        
        if (!candleDataEntries || candleDataEntries.length === 0) {
            console.log(`❌ No candle_data entries found for ${symbol} ${interval}`);
            return null;
        }
        
        console.log(`✅ Found ${candleDataEntries.length} candle_data entries for ${symbol} ${interval}`);
        
        // Parse JSON entries and extract data (OHLC + HA only, no indicators)
        const candles = candleDataEntries.map(entry => {
            try {
                const candleData = JSON.parse(entry);
                return {
                    datetime: candleData.timestamp, // timestamp is already formatted string
                    open: candleData.open,
                    high: candleData.high,
                    low: candleData.low,
                    close: candleData.close,
                    volume: candleData.volume || 0,
                    // Include HA values (universal, same for all conditions)
                    ha_open: candleData.ha_open,
                    ha_high: candleData.ha_high,
                    ha_low: candleData.ha_low,
                    ha_close: candleData.ha_close
                    // NOTE: Indicator values (PSAR, Stochastic) are NOT included
                    // because they are condition-specific and calculated on frontend
                };
            } catch (parseError) {
                console.error(`Error parsing candle_data entry:`, parseError);
                return null;
            }
        }).filter(candle => candle !== null);
        
        if (candles.length === 0) {
            console.log(`❌ No valid candle_data entries after parsing for ${symbol} ${interval}`);
            return null;
        }
        
        // Sort by datetime to ensure proper order
        candles.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        return candles;
        
    } catch (error) {
        console.error(`Error fetching candle_data for ${symbol} ${interval}:`, error);
        return null;
    }
}

async function getIndicatorDataBySymbol(symbol, interval, indicatorKey, lastNCandles = null) {
    try {
        console.log(`🔍 Fetching indicator data for key: ${indicatorKey}`);
        
        // Check if key exists
        const exists = await client.exists(indicatorKey);
        
        if (!exists) {
            console.log(`❌ Indicator key not found: ${indicatorKey}`);
            return null;
        }
        
        let indicatorEntries;
        
        if (lastNCandles !== null && lastNCandles > 0) {
            // OPTIMIZED: Fetch only last N candles (much faster for 1min/2min intervals)
            console.log(`⚡ [OPTIMIZED] Fetching last ${lastNCandles} indicator entries for ${indicatorKey}`);
            indicatorEntries = await client.zRange(indicatorKey, -lastNCandles, -1);
        } else {
            // Fetch all entries in date range (30 days)
            const currentDate = new Date();
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 30);
            startDate.setHours(9, 15, 0, 0);
            
            const startTimestamp = Math.floor(startDate.getTime() / 1000);
            
            // Fetch all entries in the date range (matching candle_data range)
            indicatorEntries = await client.zRangeByScore(indicatorKey, startTimestamp, '+inf');
        }
        
        if (!indicatorEntries || indicatorEntries.length === 0) {
            console.log(`❌ No indicator entries found for ${indicatorKey}`);
            return null;
        }
        
        console.log(`✅ Found ${indicatorEntries.length} indicator entries for ${indicatorKey}`);
        
        // Parse JSON entries and create a map by timestamp
        // Normalize timestamps to match candle_data format: 'YYYY-MM-DD HH:mm:ss'
        const indicatorMap = new Map();
        indicatorEntries.forEach(entry => {
            try {
                const indicatorData = JSON.parse(entry);
                const timestamp = indicatorData.timestamp;
                if (timestamp) {
                    // Normalize timestamp format: convert ISO format to SQL format
                    // From: '2025-10-27T09:15:00.000000000' or '2025-10-27T09:15:00'
                    // To: '2025-10-27 09:15:00'
                    let normalizedTimestamp = timestamp;
                    
                    // Handle ISO format with T separator
                    if (timestamp.includes('T')) {
                        // Replace T with space and remove nanoseconds/milliseconds
                        normalizedTimestamp = timestamp
                            .replace('T', ' ')
                            .replace(/\.\d+/g, '') // Remove .000000000 or .000
                            .trim();
                    }
                    
                    // Ensure format is exactly 'YYYY-MM-DD HH:mm:ss'
                    // If it's already in the correct format, use it as-is
                    indicatorMap.set(normalizedTimestamp, indicatorData);
                }
            } catch (parseError) {
                console.error(`Error parsing indicator entry:`, parseError);
            }
        });
        
        return indicatorMap;
        
    } catch (error) {
        console.error(`Error fetching indicator data for ${indicatorKey}:`, error);
        return null;
    }
}

module.exports = { getOhlcBySymbol, getResampledOhlcBySymbol, getCandleDataBySymbol, getIndicatorDataBySymbol };

async function shutdown() {
    await client.quit();
}

process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await shutdown();
    process.exit();
});


