const cluster = require('node:cluster');
const os = require('node:os');
const express = require('express');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send(`process: ${process.pid}`);
});

if (cluster.isPrimary) {
    console.log(`master ${process.pid} initialising cluster`);

    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }

} else {
    app.listen(3000, () => {
        console.log(`worker ${process.pid} started on port 3000`);
    });
}