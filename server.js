const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Webhook de Discord para registrar visitas
app.use((req, res, next) => {
    if (req.path === '/' || req.path === '/index.html') {
        // Obtener la IP considerando si está detrás de un proxy (como Nginx)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        
        if (webhookUrl) {
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🔔 **Nueva Visita Detectada**\n🌐 **IP:** \`${ip}\`\n📅 **Fecha:** ${new Date().toLocaleString()}`
                })
            }).catch(err => console.error("Error al enviar webhook a Discord:", err));
        }
    }
    next();
});

// Servir todos los archivos web visuales
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'emails.json');

// Inicializar archivo de base de datos si no existe
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ subscribers: [], launched: false }));
}

// Configuración Real del Servidor de Correos (GMAIL)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

console.log('--- MODO DE ENVÍO REAL ACTIVADO ---');

// Ruta para Registrar Correo
app.post('/api/register', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Falta email' });

    try {
        const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        
        // Evitar duplicados
        if (db.subscribers.includes(email)) {
            return res.status(400).json({ error: 'Este correo ya tiene acceso.' });
        }
        
        // Guardar Correo
        db.subscribers.push(email);
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

        // Enviar Correo de Confirmación
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"XREPOT Ecosistema" <apertura@xrepot.com>',
            to: email,
            subject: 'Acceso Anticipado - Registrado con Éxito',
            html: `
                <div style="background-color: #000; color: #fff; padding: 40px; font-family: sans-serif; text-align: center;">
                    <h1 style="color: #0A84FF;">XREPOT</h1>
                    <h2>Hemos enlazado tu perfil.</h2>
                    <p style="color: #ccc;">Tu correo de la élite adoptante (${email}) ha sido registrado de forma segura y encriptada.</p>
                    <p style="color: #ccc;">Te notificaremos cuando se aperture la compuerta cuántica el 1 de Noviembre de 2026.</p>
                    <hr style="border-color: #333; margin-top: 40px;">
                    <p style="font-size: 12px; color: #666;">No respondas a este correo genérico.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de Confirmación enviado a: ${email}`);

        res.json({ success: true, message: 'Registrado con éxito' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fallo en la red cuántica' });
    }
});

// CRON JOB: Verificador Automático cada hora para ver si llegó la hora del Lanzamiento
// "0 * * * *" significa cada hora en el minuto 0
cron.schedule('* * * * *', async () => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // Si ya pusimos el estado en "lanzado", no volver a mandar correos.
    if(db.launched) return; 

    // Fecha establecida para el lanzamiento real (La comparamos con la del Frontend: Nov 1, 2026)
    const launchDate = new Date("Nov 1, 2026 09:00:00").getTime();
    const now = new Date().getTime();

    if (now >= launchDate) {
        console.log("¡FECHA ALCANZADA! PREPARANDO DISPARO DE CORREOS AUTOMÁTICO...");
        
        db.launched = true;
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

        for (let subEmail of db.subscribers) {
            try {
                const mailOptions = {
                    from: process.env.EMAIL_FROM || '"XREPOT" <apertura@xrepot.com>',
                    to: subEmail,
                    subject: 'XREPOT HA DESPERTADO - YA ABRIMOS',
                    html: `
                        <div style="background-color: #000; color: #fff; padding: 40px; font-family: sans-serif; text-align: center;">
                            <h1 style="color: #B210FF;">ESTAMOS EN VIVO.</h1>
                            <h2>La era digital ha cambiado para siempre.</h2>
                            <p style="color: #ccc;">Hola agente,</p>
                            <p style="color: #ccc;">Ya puedes ser parte física del ecosistema. Haz clic en el siguiente enlace para descubrir nuestros dispositivos en la tienda oficial:</p>
                            <a href="${process.env.APP_URL || 'https://xrepot.com/'}" style="display:inline-block; margin-top:20px; padding: 10px 20px; background-color: #fff; color: #000; text-decoration: none; border-radius: 20px; font-weight: bold;">Entrar a XREPOT</a>
                        </div>
                    `
                };
                const info = await transporter.sendMail(mailOptions);
                console.log(`Aviso de Lanzamiento enviado a ${subEmail}`);
            } catch (e) {
                console.error("Fallo al enviar a " + subEmail);
            }
        }
        console.log("Todos los correos de lanzamiento han sido dispersados.");
    }
});

// Ruta especial para forzar correos de prueba
app.post('/api/force-launch', async (req, res) => {
    console.log("Forzando simulación del envío de lanzamiento...");
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    for (let subEmail of db.subscribers) {
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"XREPOT" <apertura@xrepot.com>',
            to: subEmail,
            subject: 'XREPOT HA DESPERTADO (PRUEBA)',
            html: `
                <div style="background-color: #000; color: #fff; padding: 40px; font-family: sans-serif; text-align: center;">
                    <h1 style="color: #B210FF;">ESTAMOS EN VIVO.</h1>
                    <h2>La era digital ha cambiado para siempre.</h2>
                    <p style="color: #ccc;">Hola agente,</p>
                    <p style="color: #ccc;">Esta es una simulación manual del mensaje de apertura. En la vida real, el cron lo enviará el 1 de Noviembre de 2026.</p>
                    <a href="${process.env.APP_URL || 'https://xrepot.com/'}" style="display:inline-block; margin-top:20px; padding: 10px 20px; background-color: #fff; color: #000; text-decoration: none; border-radius: 20px; font-weight: bold;">Entrar a XREPOT</a>
                </div>
            `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`Prueba de lanzamiento a ${subEmail} enviada exitosamente.`);
    }
    res.json({ success: true, message: 'Correos de prueba dispersados.'});
});

app.listen(PORT, () => {
    console.log(`Servidor de XREPOT en marcha. Entra en http://localhost:${PORT}`);
});
