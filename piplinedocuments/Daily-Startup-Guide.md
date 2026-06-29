# Daily Startup Guide — AgileTracker CI/CD Pipeline
**Every time you start your PC, follow these steps.**

---

## Step 1 — Verify Jenkins (Automatic)
Jenkins starts automatically. Just open browser and check:
```
http://localhost:8080
```
If it opens → Jenkins is running. Nothing else to do.

---

## Step 2 — Start ngrok (Manual)
Open **Command Prompt** and run:
```
C:\ngrok\ngrok.exe http 8080
```
Keep this window **open** — do not close it.

---

## Step 3 — Check ngrok URL
Look for the forwarding URL in the ngrok window:
```
https://XXXXXX.ngrok-free.app -> http://localhost:8080
```
Copy the `https://XXXXXX.ngrok-free.app` part.

---

## Step 4 — Update GitHub Webhook (if URL changed)
1. Go to: https://github.com/Thiravidaselvam/AgileTracker
2. Click **Settings** → **Webhooks** → **Edit**
3. Update Payload URL:
```
https://XXXXXX.ngrok-free.app/github-webhook/
```
4. Click **Update webhook**
5. Verify green tick appears

---

## Step 5 — Test the Pipeline
Run in Command Prompt:
```
cd E:\TrainningMaterials\ProgressTracker\agile-tracker
git commit --allow-empty -m "Test pipeline"
git push
```
Go to `http://localhost:8080` → build should trigger automatically.

---

## Quick Summary

| Task | Auto/Manual |
|------|-------------|
| Jenkins starts | Automatic |
| Start ngrok | Manual — run `C:\ngrok\ngrok.exe http 8080` |
| Update webhook URL | Manual — only if ngrok URL changed |

---

## Useful Links

| Link | Purpose |
|------|---------|
| http://localhost:8080 | Jenkins dashboard |
| https://github.com/Thiravidaselvam/AgileTracker | GitHub repository |
| https://agile-tracker-red.vercel.app | Live production app |
| https://dashboard.ngrok.com | ngrok dashboard |
| https://vercel.com/dashboard | Vercel dashboard |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Jenkins not opening | Press Win+R → type `services.msc` → find Jenkins → Start |
| ngrok URL not showing | Close and rerun `C:\ngrok\ngrok.exe http 8080` |
| Build not triggering | Update GitHub webhook with new ngrok URL |
| Build failed | Go to Jenkins → AgileTracker → build number → Console Output |
