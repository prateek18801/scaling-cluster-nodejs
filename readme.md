# Self Scaling Cluster in NodeJS
Clusters of Node.js processes can be used to run multiple instances of Node.js that can distribute workloads among their application threads. This method of scaling provides zero downtime even if a worker crashes.  
*Note: When process isolation is not needed, prefer `worker_threads` module which allows running multiple application threads within a single Node.js instance.*

## Cluster
The cluster module will create child processes that will share server ports. 
  
The cluster module supports two methods of distributing incoming connections:  
- The default one on all platforms *(!except Windows)* is the round-robin approach, where the primary process listens on a port, accepts new connections and distributes them across the workers in a round-robin fashion, also avoids overloading a worker process.  
- The second approach is where the primary process creates the listen socket and sends it to interested workers. The workers then accept incoming connections directly.

**Note: This method does not run on windows by default. Round robin scheduling is disabled by default on windows due to performance reasons. [refer](https://stackoverflow.com/questions/43971263/nodejs-cluster-not-using-round-robin-developing-on-windows)**

---

## Code Snippets
1. **Import the *cluster* and *os* module**
```
const cluster = require('node:cluster');
const os = require('node:os');
```

2. **Spawn multiple worker instances**  
The worker processes are spawned using the `child_process.fork()` method, so that they can communicate with the parent via IPC and pass server handles back and forth.
```
if (cluster.isPrimary) {
    console.log(`master ${process.pid} initialising cluster`);
    
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }

} else {
    app.listen(process.env.PORT, () => {
        console.log(`worker ${process.pid} started on port ${process.env.PORT}`);
    });
}
```

3. **Add an *exit* event listener**  
When a process is killed, it emits an *exit* event which then fires another worker process, always ensuring some running instances of the application
```
if (cluster.isPrimary) {
    console.log(`master ${process.pid} initialising cluster`);
    
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });

} else {
    app.listen(process.env.PORT, () => {
        console.log(`worker ${process.pid} started on port ${process.env.PORT}`);
    });
}
```

4. **Improve the *exit* event listener (optional)**
```
if (cluster.isPrimary) {
    console.log(`master ${process.pid} initialising cluster`);
    
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        if (signal) {
            console.log(`worker was killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker exited with error code: ${code}`);
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
```

5. **Create a routes to test and kill processes**  
```
app.get('/', (req, res) => {
    for(let i=0;i<1e8;i++) {
        // intentional delay
    }
    res.send(`response from: ${process.pid}`);
});
```
```
app.get('/kill-process', (req, res) => {
    res.send(`process: ${process.pid} died`);
    process.exit(0);
});
```

---

### scripts

- `npm start` : *start server*