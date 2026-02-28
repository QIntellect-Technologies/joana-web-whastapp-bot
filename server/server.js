const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const dotenv = require('dotenv');
const botEngine = require('./bot/engine');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// GET /webhook - Verification for Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.error('❌ VERIFICATION_FAILED');
            res.sendStatus(403);
        }
    }
});

// POST /webhook - WhatsApp webhook with backend bot engine integration
app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object) {
        if (
            body.entry &&
            Array.isArray(body.entry) &&
            body.entry[0].changes &&
            Array.isArray(body.entry[0].changes) &&
            body.entry[0].changes[0].value &&
            body.entry[0].changes[0].value.messages &&
            Array.isArray(body.entry[0].changes[0].value.messages)
        ) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;
            let msgBody = '';

            if (message.type === 'text') {
                msgBody = message.text.body;
            } else if (message.type === 'interactive' && message.interactive.button_reply) {
                msgBody = message.interactive.button_reply.id;
            } else if (message.type === 'audio') {
                console.log("🎤 Audio message received. ID:", message.audio.id);

                // 1. TRY REAL TRANSCRIPTION
                try {
                    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
                    const isGroq = !!process.env.GROQ_API_KEY;

                    if (apiKey) {
                        console.log(`🎤 Fetching WhatsApp media metadata for ID: ${message.audio.id}...`);
                        // Fetch Media URL from WhatsApp
                        const mediaResponse = await axios.get(
                            `https://graph.facebook.com/v18.0/${message.audio.id}`,
                            { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` } }
                        );

                        const mediaUrl = mediaResponse.data.url;
                        console.log("📥 Downloading audio binary from WhatsApp...");

                        // Download Audio Binary
                        const audioData = await axios.get(mediaUrl, {
                            headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` },
                            responseType: 'arraybuffer'
                        });

                        console.log(`✅ Downloaded ${audioData.data.byteLength} bytes. Transcribing via ${isGroq ? 'Groq' : 'OpenAI'}...`);

                        // Create FormData for Whisper API
                        const form = new FormData();
                        form.append('file', Buffer.from(audioData.data), { filename: 'audio.ogg', contentType: 'audio/ogg' });

                        const model = isGroq ? 'whisper-large-v3' : 'whisper-1';
                        form.append('model', model);

                        // Guidance prompt based on current user language
                        const session = botEngine.getSession(from);
                        const userLang = session ? (session.language || 'en') : 'en';
                        const prompt = userLang === 'en'
                            ? "Transcribe in English."
                            : "Transcribe in Arabic.";
                        form.append('prompt', prompt);

                        const transcribeUrl = isGroq
                            ? 'https://api.groq.com/openai/v1/audio/transcriptions'
                            : 'https://api.openai.com/v1/audio/transcriptions';

                        console.log(`🤖 Sending to ${isGroq ? 'Groq' : 'OpenAI'} API...`);
                        const response = await axios.post(transcribeUrl, form, {
                            headers: {
                                ...form.getHeaders(),
                                'Authorization': `Bearer ${apiKey.trim()}`
                            }
                        });

                        msgBody = (response.data.text || "").trim();
                        console.log("Real Transcription:", msgBody);

                        // GUARD: Check for empty results
                        if (!msgBody) {
                            throw new Error("Whisper returned empty transcription");
                        }

                        // GUARD: Check for unsupported scripts
                        const allowedPattern = /[a-zA-Z0-9\u0600-\u06FF\s.,!?;:'"-]/g;
                        const cleaned = msgBody.replace(allowedPattern, "");
                        if (cleaned.length > msgBody.length * 0.2 && msgBody.length > 5) {
                            console.log("⚠️ REJECTED: Unsupported language detected:", msgBody);
                            throw new Error("Unsupported language detected. Please speak English or Arabic.");
                        }

                        // GUARD: Hallucinated repetitions
                        if (msgBody.length > 30) {
                            const words = msgBody.split(/\s+/);
                            if (words.length > 10) {
                                const wordCounts = {};
                                words.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);
                                const mostCommonWord = Object.keys(wordCounts).reduce((a, b) => wordCounts[a] > wordCounts[b] ? a : b);
                                if (wordCounts[mostCommonWord] > words.length * 0.5) {
                                    console.log("⚠️ REJECTED: Repetitive hallucination:", msgBody);
                                    throw new Error("Voice unclear (repetitive hallucination)");
                                }
                            }
                        }

                        // Feedback for Real Transcription
                        const feedbackUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
                        await axios.post(feedbackUrl, {
                            messaging_product: 'whatsapp',
                            to: from,
                            text: { body: `🎤 You said: "${msgBody}"` }
                        }, { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } });

                    } else {
                        throw new Error("API Key (Groq/OpenAI) missing for transcription.");
                    }
                } catch (error) {
                    console.error("Transcription failed:", error.message);
                    const errorMsg = error.message.includes("Unsupported language") || error.message.includes("Voice unclear")
                        ? `⚠️ ${error.message}`
                        : "⚠️ Sorry, I couldn't understand your voice message. Please try speaking more clearly or type your order.";

                    try {
                        const feedbackUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
                        await axios.post(feedbackUrl, {
                            messaging_product: 'whatsapp',
                            to: from,
                            text: { body: errorMsg }
                        }, { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } });
                    } catch (sendErr) {
                        console.error("Failed to send error feedback:", sendErr.message);
                    }
                    return res.sendStatus(200);
                }
            }

            // Use backend bot engine to process message
            const replies = await botEngine.processMessage(from, msgBody);

            for (const reply of replies) {
                try {
                    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
                    let payload;
                    if (reply && typeof reply === 'object' && reply.type === 'button') {
                        payload = {
                            messaging_product: 'whatsapp',
                            to: from,
                            type: 'interactive',
                            interactive: {
                                type: 'button',
                                body: { text: reply.body },
                                action: {
                                    buttons: reply.buttons.slice(0, 3).map((btn, idx) => ({
                                        type: 'reply',
                                        reply: {
                                            id: btn.id || `btn_${idx + 1}`,
                                            title: btn.title
                                        }
                                    }))
                                }
                            }
                        };
                    } else if (reply && typeof reply === 'object' && reply.type === 'image') {
                        payload = {
                            messaging_product: 'whatsapp',
                            to: from,
                            type: 'image',
                            image: {
                                link: reply.link
                            }
                        };
                    } else {
                        payload = {
                            messaging_product: 'whatsapp',
                            to: from,
                            text: { body: reply }
                        };
                    }
                    await axios.post(
                        url,
                        payload,
                        {
                            headers: {
                                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error('Error sending WhatsApp reply:', error.response ? error.response.data : error.message);
                }
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Serve Static Files
const publicMenuDist = path.join(__dirname, '../public-menu/dist');
const adminPanelDist = path.join(__dirname, '../dist');

// 1. Serve Admin Panel at /admin
app.use('/admin', express.static(adminPanelDist));
app.get('/admin/:path*', (req, res) => {
    res.sendFile(path.join(adminPanelDist, 'index.html'));
});

// 2. Serve Public Menu at /
app.use(express.static(publicMenuDist));

// 3. Catch-all to serve public menu index.html (SPA support)
app.use((req, res) => {
    if (require('fs').existsSync(path.join(publicMenuDist, 'index.html'))) {
        res.sendFile(path.join(publicMenuDist, 'index.html'));
    } else {
        res.status(404).send('Frontend not built yet. Run npm run build first.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
