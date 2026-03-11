# Sync Local with Live - Action Plan

## Current Situation
- **Live site is DOWN** - cannot reference it directly
- **Local version** has significant differences from what live had
- **Missing functionality**: Filter page/functionality not implemented in frontend

## System Overview (From Documentation)

**Architecture:**
- **Koshy Python Bot**: Generates alerts, processes market data
- **Trading App Server (Node.js)**: REST API endpoints for React client
- **Trading App Client (React)**: Web UI using TradingView Lightweight Charts

**Key Database Tables:**
- `Baskets` - All groups
- `Basket_stocks` - Stocks in specific groups + **Filter configurations**
- `Filter_options` - Filtered options results (output of filter execution)
- `Instruments` - All option details from Zerodha
- `Scans` - List of scans

## What We Know Exists

### Backend (✅ Present)
1. **`basket_stocks` table** - Stores filter configurations per stock in basket
2. **`filter_options` table** - Stores filtered options data (output)
3. **`filter_options.py`** Python script - Filters options based on `basket_stocks` configs
4. **`/run-bat` endpoint** - Triggers `filter_options.bat` execution
5. **`getGroupsTreeData` API** - Queries `filter_options` table for groups/stocks/options tree

### Frontend (❌ Missing)
1. **Filter page component** - Only placeholder exists
2. **Basket stocks filter config UI** - Not implemented
3. **No API integration** - Filter page doesn't call any filter APIs

## Filter Functionality (Based on Code Analysis)

### Filter Flow:
```
Basket_stocks (config) → filter_options.py → Filter_options (results) → Groups Tree UI
```

### `basket_stocks` Table Fields (Filter Configuration):
**Basic:**
- `basket_id` - Group ID
- `symbol` - Stock symbol
- `option_type` - CE/PE/FUT

**Strike Range Configuration:**
- `ce_lower_val` - CE lower strike multiplier
- `ce_upper_val` - CE upper strike multiplier
- `pe_lower_val` - PE lower strike multiplier
- `pe_upper_val` - PE upper strike multiplier

**LTP Filter:**
- `filter` - Enable LTP filter (0/1)
- `filter_from` - LTP minimum value
- `filter_to` - LTP maximum value

**Timeframe Configuration:**
- `config_1m` - Enable config for current month (0/1)
- `config_2m` - Enable config for next month (0/1)
- `config_3m` - Enable config for next+1 month (0/1)
- `checkbox_config` - Enable config-based filtering (0/1)

**Futures Configuration:**
- `checkbox_1mf` - Enable futures for current month (0/1)
- `checkbox_2mf` - Enable futures for next month (0/1)
- `checkbox_3mf` - Enable futures for next+1 month (0/1)

**Option Type Selection:**
- `ceChecked` - Include CE options (0/1)
- `peChecked` - Include PE options (0/1)

**Date References:**
- `date_A` - Reference date for config filtering
- `date_B` - Reference date for scan filtering

**Scan Configuration:**
- `checkbox_scan` - Enable scan-based filtering (0/1)
- `scan_1m` - Enable scan for current month (0/1)
- `scan_2m` - Enable scan for next month (0/1)
- `scan_3m` - Enable scan for next+1 month (0/1)
- `scan_ce_value` - Number of CE options to select
- `scan_pe_value` - Number of PE options to select
- `scan_range_from` - Scan LTP minimum
- `scan_range_to` - Scan LTP maximum

### Filter Logic (from `filter_options.py`):

1. **Config-based Filtering** (when `checkbox_config = 1`):
   - Gets ATM strike price based on underlying LTP
   - Filters strikes within range: `ATM ± (strike_size × multiplier)`
   - CE: `[ATM - strike_size × (ce_lower_val-1), ATM + strike_size × (ce_upper_val-1)]`
   - PE: `[ATM - strike_size × (pe_lower_val-1), ATM + strike_size × (pe_upper_val-1)]`
   - Applies LTP filter if `filter = 1`

2. **Scan-based Filtering** (when `checkbox_scan = 1`):
   - Gets all options in LTP range: `[scan_range_from, scan_range_to]`
   - Selects top N options by LTP (CE: `scan_ce_value`, PE: `scan_pe_value`)

3. **Futures Filtering**:
   - Adds futures based on `checkbox_1mf`, `checkbox_2mf`, `checkbox_3mf`

4. **Output**:
   - Saves filtered options to `filter_options` table
   - Used by Groups Tree UI to display available options

## Action Plan

### Step 1: Create Filter Page Component ✅ (Placeholder exists)
- [x] Create basic Filter component structure
- [ ] Add Basket Stocks filter configuration UI
- [ ] Add API integration for filter operations

### Step 2: Add Filter API Endpoints (Backend)
Need to create:
- [ ] `GET /api/basket-stocks` - Get all basket stocks with filter configs
- [ ] `GET /api/basket-stocks/:basket_id` - Get stocks for specific basket
- [ ] `GET /api/basket-stocks/:id` - Get single basket stock config
- [ ] `POST /api/basket-stocks` - Create basket stock with filter config
- [ ] `PUT /api/basket-stocks/:id` - Update basket stock filter config
- [ ] `DELETE /api/basket-stocks/:id` - Delete basket stock
- [ ] `POST /api/run-filter` - Trigger filter execution (wrapper for `/run-bat`)
- [ ] `GET /api/filter-options` - Get filtered options results (read-only)

**Verify existing:**
- [x] `/run-bat` endpoint exists in `server.js`
- [x] `getGroupsTreeData` API exists in `groups.controller.js`

### Step 3: Database Schema Check
Verify table structures:
```sql
DESCRIBE basket_stocks;
DESCRIBE filter_options;
DESCRIBE baskets;
SELECT * FROM basket_stocks LIMIT 5;
SELECT * FROM filter_options LIMIT 5;
```

### Step 4: Implement Filter UI

The Filter page should show:

**1. Basket Selection:**
- Dropdown to select Basket/Group

**2. Basket Stocks List:**
- Table showing all stocks in selected basket
- Columns: Symbol, Option Type, Actions (Edit/Delete)

**3. Filter Configuration Form (Edit/Add):**
When editing a basket stock, show:

**Basic Settings:**
- Symbol (read-only/edit)
- Option Type checkboxes (CE, PE, FUT)

**Config-based Filtering Section:**
- Checkbox: "Enable Config-based Filtering" (`checkbox_config`)
- Timeframe checkboxes:
  - Current Month (`config_1m`)
  - Next Month (`config_2m`)
  - Next+1 Month (`config_3m`)
- Strike Range:
  - CE Lower Multiplier (`ce_lower_val`)
  - CE Upper Multiplier (`ce_upper_val`)
  - PE Lower Multiplier (`pe_lower_val`)
  - PE Upper Multiplier (`pe_upper_val`)
- LTP Filter:
  - Enable (`filter`)
  - From (`filter_from`)
  - To (`filter_to`)
- Date A (`date_A`) - Date picker

**Futures Section:**
- Checkbox: Current Month (`checkbox_1mf`)
- Checkbox: Next Month (`checkbox_2mf`)
- Checkbox: Next+1 Month (`checkbox_3mf`)

**Scan-based Filtering Section:**
- Checkbox: "Enable Scan-based Filtering" (`checkbox_scan`)
- Timeframe checkboxes:
  - Current Month (`scan_1m`)
  - Next Month (`scan_2m`)
  - Next+1 Month (`scan_3m`)
- Number of Options:
  - CE Options (`scan_ce_value`)
  - PE Options (`scan_pe_value`)
- LTP Range:
  - From (`scan_range_from`)
  - To (`scan_range_to`)
- Date B (`date_B`) - Date picker

**Actions:**
- Save button
- Cancel button
- "Run Filter" button (triggers filter execution)

**4. Filter Results Preview:**
- Show filtered options from `filter_options` table
- Group by: Group Name → Symbol → Options list

### Step 5: Test Filter Flow
1. Select a basket
2. Add/Edit basket stock filter configuration
3. Save configuration (updates `basket_stocks` table)
4. Trigger filter execution (runs `filter_options.py`)
5. Verify `filter_options` table is populated
6. Verify Groups Tree shows filtered options
7. Verify scan_instruments.csv is generated

## Files to Create/Modify

### Frontend
- [x] `src/components/Filter.jsx` - Created (needs full implementation)
- [ ] `src/components/Filter.scss` - Styles for Filter component
- [ ] `src/api/filters.apis.js` - API calls for basket stocks and filters
- [x] Add filter routes to `App.js` (✅ Done)

### Backend  
- [ ] `controllers/filter.controller.js` - Basket stocks CRUD + filter execution
- [ ] Add filter routes to `routes/routes.js`
- [x] `/run-bat` endpoint exists in `server.js` (✅ Verified)

## Next Steps

1. **Check Database** - Query `filter_options` table to understand structure
2. **Reference filter_options.py** - Understand filtering logic
3. **Build Filter UI** - Create component matching live functionality
4. **Test Integration** - Ensure filter execution works end-to-end

## Important Notes

- Live page is down, so we can't see the exact UI
- `filter_options.py` contains the filtering logic - use it as reference
- `filter_options` table is used by groups tree - ensure data format matches
- Filter execution is async (runs via BAT file) - UI should show status

## Questions to Answer

1. What was the exact UI of the Filter page on live?
2. Did filter options have a CRUD interface or just execution trigger?
3. How were filter configurations stored/loaded?
4. Was there a way to preview filter results before execution?
