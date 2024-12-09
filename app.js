const express = require('express');
const multer = require('multer');
const path = require('path');

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

// Almacén temporal en memoria para los datos
let transactions = [];
let totalAmount = 0;

app.use(express.static('public'));
app.use(express.json());

// Ruta para subir archivos
app.post('/upload', upload.single('image'), (req, res) => {
    const { amount } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!image || !amount) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    // Actualizar el almacén en memoria
    transactions.push({ image, amount: parseFloat(amount) });
    totalAmount += parseFloat(amount);

    res.json({ success: true, total: totalAmount });
});

// Ruta para obtener el total actual
app.get('/total', (req, res) => {
    res.json({ total: totalAmount });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
