const cluster = require('node:cluster');
const os = require('node:os');
const express = require('express');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
    for(let i=0;i<1e8;i++) {
        // intentional delay
    }
    res.send(`response from: ${process.pid}`);
});

app.get('/kill-process', (req, res) => {
    res.send(`process: ${process.pid} died`);
    process.exit(0);
});

if (cluster.isPrimary) {
    console.log(`master ${process.pid} initialising cluster`);
    
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        if (signal) {
            console.log(`worker ${worker.process.pid} killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker ${worker.process.pid} exited with error code: ${code}`);
        } else {
            console.log(`worker ${worker.process.pid} died`);
        }
        cluster.fork();
    });

} else {
    app.listen(process.env.PORT, () => {
        console.log(`worker ${process.pid} started on port ${process.env.PORT}`);
    });
}