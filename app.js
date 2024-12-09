const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Configuración de multer para almacenar imágenes
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());

// Configuración de SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err);
    } else {
        console.log('Conexión con SQLite establecida.');
        db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image TEXT,
                amount REAL
            )
        `, (err) => {
            if (err) {
                console.error('Error al crear la tabla:', err);
            } else {
                console.log('Tabla "transactions" preparada.');
            }
        });
    }
});

// Ruta para subir archivos
app.post('/upload', upload.single('image'), (req, res) => {
    const { amount } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!image || !amount) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    // Insertar la transacción en la base de datos
    db.run(
        `INSERT INTO transactions (image, amount) VALUES (?, ?)`,
        [image, parseFloat(amount)],
        function (err) {
            if (err) {
                console.error('Error al insertar en la base de datos:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            // Calcular el total actualizado
            db.get(`SELECT SUM(amount) AS total FROM transactions`, (err, row) => {
                if (err) {
                    console.error('Error al calcular el total:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                const total = row.total || 0;
                res.json({ success: true, total });
            });
        }
    );
});

// Ruta para obtener el total actual
app.get('/total', (req, res) => {
    db.get(`SELECT SUM(amount) AS total FROM transactions`, (err, row) => {
        if (err) {
            console.error('Error al obtener el total:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const total = row.total || 0;
        res.json({ total });
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
