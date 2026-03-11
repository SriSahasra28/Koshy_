// controllers/scanController.js
const { exec } = require('child_process');
const util = require('util');

// Convert exec to promise-based
const execAsync = util.promisify(exec);

class ScanController {
    /**
     * Restart scan processes (stop and restart main-consumer.bat and tick-zerodha.bat)
     */
    restartScanProcesses = async (req, res) => {
        try {
            console.log('Restarting scan processes...');
            
            // First, kill existing processes
            await this.killExistingProcesses();
            
            // Then restart the processes
            await this.restartProcesses();
            
            res.json({
                success: true,
                message: 'Scan processes restarted successfully'
            });
            
        } catch (error) {
            console.error('Error restarting scan processes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restart scan processes',
                error: error.message
            });
        }
    }
    
    /**
     * Kill existing scan processes
     */
    killExistingProcesses = async () => {
        return new Promise((resolve, reject) => {
            console.log('Starting process termination...');
            
            const killCommands = [
                {
                    command: 'wmic process where "commandline like \'%tick_zerodha.py%\'" delete',
                    processName: 'tick_zerodha.py'
                },
                {
                    command: 'wmic process where "commandline like \'%main_redis_remaster.py%\'" delete',
                    processName: 'main_redis_remaster.py'
                },
                {
                    command: 'taskkill /F /IM celery.exe',
                    processName: 'celery.exe'
                }
            ];
            
            let completedCommands = 0;
            const totalCommands = killCommands.length;
            
            killCommands.forEach(({ command, processName }) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`No ${processName} processes found or already terminated`);
                    } else {
                        console.log(`Killed ${processName} processes:`, stdout);
                    }
                    
                    completedCommands++;
                    if (completedCommands === totalCommands) {
                        // Wait for processes to terminate
                        setTimeout(() => {
                            console.log('Process termination completed');
                            resolve();
                        }, 3000);
                    }
                });
            });
        });
    }
    
    /**
     * Restart the scan processes
     */
    restartProcesses = async () => {
        return new Promise((resolve, reject) => {
            // Start tick-zerodha.bat first
            exec('start cmd /c "C:\\Users\\Administrator\\Desktop\\bat_files\\download_tick.bat"', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error starting tick-zerodha.bat: ${error}`);
                    reject(error);
                    return;
                }
                
                console.log('Started tick-zerodha.bat successfully');
                
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
                }, 3000);
            });
        });
    }
    
    /**
     * Get status of scan processes
     */
    getScanStatus = async (req, res) => {
        try {
            const processes = await this.checkProcessStatus();
            
            res.json({
                success: true,
                processes: processes
            });
            
        } catch (error) {
            console.error('Error checking scan status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check scan status',
                error: error.message
            });
        }
    }
    
    /**
     * Check if scan processes are running
     */
    checkProcessStatus = async () => {
        const processes = [
            { name: 'tick_zerodha.py', command: 'wmic process where "commandline like \'%tick_zerodha.py%\'" get processid,commandline' },
            { name: 'main_redis_remaster.py', command: 'wmic process where "commandline like \'%main_redis_remaster.py%\'" get processid,commandline' },
            { name: 'celery.exe', command: 'wmic process where "name=\'celery.exe\'" get processid,commandline' }
        ];
        
        const status = {};
        
        for (const process of processes) {
            try {
                const { stdout } = await execAsync(process.command);
                status[process.name] = {
                    running: stdout.trim().length > 0,
                    details: stdout.trim()
                };
            } catch (error) {
                status[process.name] = {
                    running: false,
                    error: error.message
                };
            }
        }
        
        return status;
    }
    
    /**
     * Stop scan processes only
     */
    stopScanProcesses = async (req, res) => {
        try {
            console.log('Stopping scan processes...');
            
            await this.killExistingProcesses();
            
            res.json({
                success: true,
                message: 'Scan processes stopped successfully'
            });
            
        } catch (error) {
            console.error('Error stopping scan processes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to stop scan processes',
                error: error.message
            });
        }
    }
}

module.exports = new ScanController();