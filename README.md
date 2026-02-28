<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12id7062XiTGGJyccPF-_ExY4zlWYDw4I

## ⚙️ Meta Developer Portal Configuration

To activate your WhatsApp Bot, follow these final steps in your [Meta Developer Portal](https://developers.facebook.com/):

1.  **Callback URL**: `https://joana-web-whastapp-bot-production.up.railway.app/webhook`
2.  **Verify Token**: `joana-verify-token-123`
3.  **Webhook Fields**: In the "WhatsApp" configuration, click **Manage** and subscribe to **`messages`**.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
