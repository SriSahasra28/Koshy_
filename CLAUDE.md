# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Koshy Trading App is a full-stack algorithmic trading platform consisting of:
- React Frontend (koshy-trading-app-client): Web UI for scanning, backtesting, and condition management
- Node.js Backend (koshy-trading-app-server): Express API server with real-time WebSocket support
- Python Backend (koshy_python): Alert engine, data processing, and Zerodha market data integration

The system uses MySQL for persistence, Redis for real-time data and pub/sub messaging, and Zerodha KiteConnect API for live market data.

## Quick Start Commands

### Frontend (React)
```bash
cd koshy-trading-app-client
npm install                    # Install dependencies
npm start                      # Dev server on port 1100
npm run build                  # Production build
```

### Backend (Node.js)
```bash
cd koshy-trading-app-server
npm install                    # Install dependencies
npm start                      # Runs with nodemon (watches for changes)
```

### Python Components
```bash
cd koshy_python
python main-consumer.py        # Alert processing engine
python tick_zerodha.py         # Live market data feed
python filter_options.py       # Option filtering logic
```

### System Startup (Windows)
```bash
startup.bat                    # Launches MySQL, Redis, Nginx, Backend, Frontend
```

## Architecture & Data Flow

### System Components

React Frontend (Port 1100)
- Charts using lightweight-charts library
- Redux state management
- WebSocket connection for real-time updates
- Pages: Login, HomePage, Scan, Condition, Filter, Backtest, Groups, CustomIndicator, Files

Node.js Backend (Port 1000)
- Express server with API routes
- WebSocket server (port 8080) for real-time alerts/OHLC
- Sequelize ORM for MySQL
- ioredis for Redis pub/sub

MySQL Database (algo)
- Conditions, Scans, Scan Items
- Custom Indicators, User Data
- one_min_ohlc table for historical OHLC

Redis (localhost:6379)
- ohlc:<symbol>:<interval> - Live OHLC data
- alerts - Alert notifications
- ohlc_live - Real-time price updates
- new_symbol - Symbol registration channel

Python Services
- tick_zerodha.py: Subscribes to Zerodha KiteTicker, publishes OHLC to Redis
- main-consumer.py: Polls database for conditions, evaluates against live data
- redis_alert_engine.py: Core evaluation engine, Telegram integration

### Key Data Flows

Chart Update Flow:
1. tick_zerodha.py publishes ohlc_live to Redis channel
2. WebSocket server (ws-server.js) subscribes and receives message
3. Broadcasts to connected React clients via WebSocket
4. TradingChart.js updates chart with new candlestick

Alert Notification Flow:
1. User creates Condition in React UI, saves to MySQL
2. main-consumer.py loads condition from database
3. redis_alert_engine.py evaluates condition against live data
4. When triggered, publishes to Redis alerts channel
5. WebSocket broadcasts to clients, Telegram message sent

## Key Code Locations

### Frontend (React)
- Entry: src/index.js
- Router: src/App.js
- Redux: src/redux/ (header, indicators, historical-data slices)
- APIs: src/api/ (charts.apis.js, auth.apis.js, groups.apis.js, filters.apis.js)
- Main Components:
  - TradingChart.js: Chart rendering with lightweight-charts
  - Condition.jsx, Filter.jsx, Scan.jsx: UI components
- Utils: src/utils/common.utils.js (PSAR, LRC, FastStoch calculations)

### Backend (Node.js)
- Entry: server.js
- Routes: routes/routes.js, routes/group.routes.js, dataRoutes.js
- Controllers: controllers/
  - data.controller.js - main controller for all data endpoints (chart data, OHLC, indicators)
  - groups.controller.js - Group management
  - fetchRedisData.js - Redis queries
  - fetchKiteData.js - Zerodha KiteConnect data fetching
  - scanController.js - Scan process management
- Database: db/sequelize.js (MySQL connection)
- Redis: db/redis.js (pub/sub publisher)
- WebSocket: ws-server.js (real-time server on port 8080)
- Utils: utils/utils.common.js (Heikin-Ashi, response formatting)
- Middleware: middlewares/errorHandler.middleware.js

### Python
- main-consumer.py (75KB) - Loads conditions, evaluates, publishes alerts
- redis_alert_engine.py (179KB) - Condition evaluation, indicator calculations
- tick_zerodha.py - Zerodha live data subscription
- filter_options.py - Option filtering utility
- background/async_db.py - Async database operations
- background/indicators.py - Indicator calculations
- background/login.py - Zerodha authentication

## Configuration

### Frontend .env
```
PORT=1100
REACT_APP_API_ENDPOINT='http://103.160.145.141:1000/api'
```

### Backend .env
```
API_KEY=<zerodha_key>
ACCESS_TOKEN=<zerodha_token>
```

### Database
- Connection configured in utils/common.enums.js
- Database name: algo

## Important Patterns

### Backend Response Format
```javascript
{
  success: boolean,
  message: string,
  data: object,
  response_code: "GET_SUCCESS" | "GET_ERROR" | "GET_NOT_FOUND",
  indicators: { psar, stoch, lrc }  // Optional for chart endpoints
}
```

### Heikin-Ashi Calculation
- Frontend: utils/common.utils.js calcHeikinAshi()
- Backend: utils/utils.common.js calcHeikinAshi()
- Critical: Must match Python exactly (no rounding)
- Uses previous candle HA values

### Redis Key Patterns
- ohlc:<symbol>:<interval> - OHLC data
- ohlc_sorted:<symbol>:<interval> - Sorted OHLC
- alerts:<symbol>:<scan_id> - Alert queues

### Error Handling
- Use catchAsync() wrapper for controllers
- Throw APIError with status codes
- Middleware formats all errors consistently

## Common Tasks

### Add New API Endpoint
1. Define route in routes/routes.js
2. Implement in data.controller.js with catchAsync wrapper
3. Use sendResponse() utility
4. Add API call in src/api/*.apis.js

### Debug Chart Issues
Check TradingChart.js WebSocket connection, Redux selectors, data transformation. Verify backend datetime format and resampling logic. Check tick_zerodha.py Redis publishing.

### Monitor Alerts
Check main_consumer.log for execution. Use redis-cli to inspect alerts. Check telegram integration in redis_alert_engine.py logs.

### Redeploy Frontend
1. `npm run build` in koshy-trading-app-client
2. Copy build/ to Nginx serving directory
3. Restart Nginx

## Deployment

- Production: 103.160.145.141 (Nginx reverse proxy)
- Backend: localhost:1000
- Frontend: localhost:1100 (dev) or served via Nginx
- WebSocket: localhost:8080 (proxied via Nginx)
- Startup: startup.bat orchestrates all services
