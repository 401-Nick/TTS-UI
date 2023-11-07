const express = require('express');
const cors = require('cors');
const { OpenAI, toFile } = require('openai');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });
const transcriptionDir = path.join(__dirname, 'transcriptions');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/transcriptions', express.static(transcriptionDir));

let OPENAI_API_KEY;

fs.mkdir(transcriptionDir, { recursive: true })
    .then(() => console.log('Transcription directory verified or created.'))
    .catch(error => console.error('Error creating transcription directory:', error));

app.post('/api/setApiKey', (req, res) => {
    OPENAI_API_KEY = req.body.apiKey;
    console.log('API key set.');
    res.json({ message: 'API key set successfully.' });
});

app.post('/api/speech', async (req, res) => {
    console.log('API SPEECH');
    console.log(OPENAI_API_KEY)
    if (!OPENAI_API_KEY) {
        return res.status(403).json({ error: 'API key is not set.' });
    }

    try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

        const { text, model, voice } = req.body;
        const speechResponse = await openai.audio.speech.create({
            model: model,
            voice: voice,
            input: text,
        });

        const buffer = Buffer.from(await speechResponse.arrayBuffer());
        const fileNamePrefix = text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${fileNamePrefix}_speech.mp3`;

        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length
        });

        res.end(buffer);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transcription', upload.single('audio'), async (req, res) => {
    if (!OPENAI_API_KEY) {
        alert('API key is not set.');
        return res.status(403).json({ error: 'API key is not set.' });
    }
    try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

        const buffer = req.file.buffer;
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: await toFile(buffer, 'speech.mp3'),
            model: 'whisper-1',
        });
        const transcriptionText = transcriptionResponse.text;
        const fileNamePrefix = transcriptionText.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${fileNamePrefix}_transcription.txt`;

        await fs.writeFile(path.join(transcriptionDir, fileName), transcriptionText);

        res.json({
            transcriptionFilePath: path.join(transcriptionDir, fileName),
            transcriptionText
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});
