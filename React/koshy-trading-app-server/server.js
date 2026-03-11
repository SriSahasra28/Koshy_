const express = require("express");
const cors = require("cors");
const dataRoutes = require("./dataRoutes");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const db = require("./db/sequelize");
const apiRoutes = require("./routes/routes");
const { errorHandler } = require("./middlewares/errorHandler.middleware");

const app = express();

// Apply CORS middleware at the application level
app.use(cors());
app.use(bodyParser.json());
// Use the route file

db.sequelize.sync();

apiRoutes.use(errorHandler);

app.use("/api", dataRoutes);
app.use(apiRoutes);

require('./ws-server');
// Start the server
const PORT = 1000;

// Route to trigger BAT execution in a new Command Prompt window
app.get('/run-bat', (req, res) => {
    // Using 'start cmd /c' to open a new command prompt that runs the BAT file
    exec('start cmd /c "C:\\Users\\Administrator\\Desktop\\bat_files\\filter_options.bat"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            res.status(500).send(`Failed to execute batch file: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send('Options filterted as per the conditions');
    });
});

app.get('/run-back_test', (req, res) => {
    // Using 'start cmd /c' to open a new command prompt that runs the BAT file
    exec('start cmd /c "C:\\Users\\Administrator\\Desktop\\bat_files\\back_test.bat"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            res.status(500).send(`Failed to execute batch file: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send('Options filterted as per the conditions');
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
console.log("AA")
// Route to restart scan processes (stop and restart main-consumer.bat and tick-zerodha.bat)
app.get('/restart-scan', (req, res) => {
    console.log('Restarting scan processes...');
    
    // First, kill existing processes using command line arguments
    const killProcesses = () => {
        return new Promise((resolve, reject) => {
            console.log('Starting process termination...');
            
            // Kill tick_zerodha.py processes by command line
            exec('wmic process where "commandline like \'%tick_zerodha.py%\'" delete', (error, stdout, stderr) => {
                if (error) {
                    console.log('No tick_zerodha.py processes found or already terminated');
                } else {
                    console.log('Killed tick_zerodha.py processes:', stdout);
                }
            });
            
            // Kill main_redis_remaster.py processes by command line
            exec('wmic process where "commandline like \'%main_redis_remaster.py%\'" delete', (error, stdout, stderr) => {
                if (error) {
                    console.log('No main_redis_remaster.py processes found or already terminated');
                } else {
                    console.log('Killed main_redis_remaster.py processes:', stdout);
                }
            });
            
            // Kill any celery processes
            exec('taskkill /F /IM celery.exe', (error, stdout, stderr) => {
                if (error) {
                    console.log('No celery.exe processes found or already terminated');
                } else {
                    console.log('Killed celery.exe processes:', stdout);
                }
            });
            
            // Wait for processes to terminate
            setTimeout(() => {
                console.log('Process termination completed');
                resolve();
            }, 3000);
        });
    };
    
    // Then restart the processes
    const restartProcesses = () => {
        return new Promise((resolve, reject) => {
            // Start tick-zerodha.bat first
            exec('start cmd /c "C:\\Users\\Administrator\\Desktop\\bat_files\\tick-zerodha.bat"', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error starting tick-zerodha.bat: ${error}`);
                } else {
                    console.log('Started tick-zerodha.bat successfully');
                }
            });
            
            // Wait a moment before starting main consumer
            setTimeout(() => {
                // Start main-consumer.bat
                exec('start cmd /c "C:\\Users\\Administrator\\Desktop\\bat_files\\main-consumer.bat"', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error starting main-consumer.bat: ${error}`);
                        reject(error);
                    } else {
                        console.log('Started main-consumer.bat successfully');
                        resolve();
                    }
                });
            }, 2000);
        });
    };
    
    // Execute the restart sequence
    killProcesses()
        .then(() => {
            return restartProcesses();
        })
        .then(() => {
            res.json({
                success: true,
                message: 'Scan processes restarted successfully'
            });
        })
        .catch((error) => {
            console.error('Error restarting scan processes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restart scan processes',
                error: error.message
            });
        });
});