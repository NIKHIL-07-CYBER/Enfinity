# Enfinity Deployment Guide

This guide provides step-by-step instructions for deploying the Enfinity adaptive reader project, including the Frontend, Backend, and Database layers.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [LibreTranslate Setup (Optional)](#libretranslate-setup-optional)
6. [Verification](#verification)

---

## Prerequisites
- A GitHub account.
- A [Supabase](https://supabase.com/) account.
- A [Railway](https://railway.app/) account.
- A [Vercel](https://vercel.com/) account.
- An [Anthropic API Key](https://console.anthropic.com/).

---

## Database Setup (Supabase)
1. **Create Project**: Log in to Supabase and create a new project named `Enfinity`.
2. **Retrieve API Keys**:
   - Go to **Project Settings > API**.
   - Copy the `Project URL` and `anon public` key for the **Frontend**.
   - Copy the `service_role` key for the **Backend** (keep this secret!).
3. **Database Schema**:
   > [!NOTE]
   > Ensure your tables are set up according to the project requirements. If you have a migration SQL file, run it in the **SQL Editor**.

---

## Backend Deployment (Railway)
1. **New Project**: In Railway, click **New Project > Deploy from GitHub repo**.
2. **Configure Environment Variables**:
   - `PORT`: `3001` (or your preferred port)
   - `FRONTEND_URL`: The URL of your deployed Vercel frontend (e.g., `https://enfinity-ui.vercel.app`).
   - `ANTHROPIC_API_KEY`: Your Claude API key.
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_SERVICE_KEY`: Your Supabase `service_role` key.
   - `LIBRE_TRANSLATE_URL`: `http://localhost:5000/translate` (if running locally) or your hosted instance URL.
3. **Build & Deploy**: Railway will automatically detect the `railway.toml` and start the deployment using `npm run build` and `npm run start`.

---

## Frontend Deployment (Vercel)
1. **Import Project**: In Vercel, click **Add New > Project** and import your GitHub repository.
2. **Root Directory**: Select `Enfinity/UI/adaptive-reader`.
3. **Framework Preset**: Vite.
4. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase `anon public` key.
   - `VITE_API_BASE`: The URL of your deployed Railway backend (e.g., `https://enfinity-backend.up.railway.app`).
   - `ANTHROPIC_API_KEY`: (Optional) If used directly in the frontend.
5. **Deploy**: Click **Deploy**. Vercel will build and serve your React application.

---

## LibreTranslate Setup (Optional)
If you require self-hosted translation:
1. **Docker**: Run the following command on a server with Docker installed:
   ```bash
   docker run -d -p 5000:5000 libretranslate/libretranslate
   ```
2. **Update Backend**: Update the `LIBRE_TRANSLATE_URL` in your Railway environment variables to point to this server's IP/domain.

---

## Verification
1. **Health Check**: Visit `https://your-backend-url.railway.app/api/health`. You should see `{"status":"success","data":{"status":"ok"},"error":null}`.
2. **CORS**: Ensure that the frontend can communicate with the backend without CORS errors.
3. **End-to-End**:
   - Log in via the Frontend.
   - Upload a document.
   - Test the AI chat and translation features.

---

> [!CAUTION]
> Never commit your `.env` files to version control. Always use the platform's secret management tools.
