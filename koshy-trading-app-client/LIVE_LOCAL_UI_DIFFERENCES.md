# Live vs Local UI Differences - Conditions Page

## Current Situation

**Live Version (http://103.160.145.141/index.php):**
- Shows "Conditions Editor" with 3 separate condition blocks:
  1. **Condition 1** - "Enable this condition" checkbox with PSAR and Stochastic dropdowns
  2. **Condition 2** - "Enable this condition" checkbox with PSAR dropdown
  3. **Filters** - "Enable this condition" checkbox showing "Upper LRC Line Period Default Value Default"

**Local Version (localhost/cn):**
- Shows "Add H LFP 1" section with detailed condition descriptions:
  - "1. K line crosses below [input] level and within [input] candles PSAR is positive on a green HA candle not crossing or touching middle LRC."
  - "2. K line crosses below [input] level and within [input] candles PSAR is positive on a green pin bar candle not crossing or touching middle LRC."
  - "3. K line crosses below [input] level and within [input] candles PSAR is positive on a wickless green HA candle not crossing or touching middle LRC."
- Shows Add/Edit Condition forms with:
  - H LFP dropdown
  - LRC, PSAR, Fast Stoch dropdowns
  - LRC Angle section
  - Signal Arrow section
  - **LRC Filter section** (NEW - not in live)
  - **Time Filter section** (NEW - not in live)

## New Features in Local (Not in Live)

1. **LRC Filter:**
   - Checkbox: "Enable LRC Filter"
   - Radio buttons: "High is below middle LRC" / "Low is above middle LRC"

2. **Time Filter:**
   - Checkbox: "Enable Time Filter (exclude alerts in time range)"
   - Time inputs: Start time and End time

## To Sync Live with Local

### Step 1: Build the Frontend
```bash
cd koshy-trading-app-client
npm run build
```
This creates a `build` folder with the production-ready React app.

### Step 2: Deploy to Live Server
1. Copy the `build` folder contents to the live server
2. Point the web server (Apache/Nginx) to serve the `build` folder
3. Ensure the backend API endpoints match (especially the new filter fields)

### Step 3: Verify Backend Compatibility
- Ensure live backend has the updated `data.controller.js` with LRC/Time filter support
- Ensure live database has the new columns:
  - `lrc_filter_enabled`
  - `lrc_filter_type`
  - `time_filter_enabled`
  - `time_filter_start`
  - `time_filter_end`

## Important Notes

- **Do NOT tamper with live server** (http://103.160.145.141/index.php) until ready to deploy
- Test the build locally first before deploying
- Backup the current live version before replacing
- The new LRC/Time filters will only work if backend and database are updated

## Current Status

✅ Local frontend has LRC/Time filter UI
✅ Local backend supports LRC/Time filters
✅ Database schema updated (columns added)
⏳ Need to build and deploy frontend to live
⏳ Need to update live backend with new filter support
⏳ Need to add columns to live database
