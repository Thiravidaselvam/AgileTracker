# CI/CD Pipeline Setup Documentation
**Project:** AgileTracker  
**Date:** 2026-06-22  
**Author:** Thiravida Selvam

---

## Overview

This document covers the complete CI/CD pipeline setup for the AgileTracker project using GitHub, Jenkins, ngrok, and Vercel.

### Pipeline Flow
```
Push Code to GitHub
        ↓
GitHub Webhook triggers Jenkins (via ngrok)
        ↓
Jenkins: Install → Generate Prisma → Build
        ↓
Vercel: Auto-deploys to Production
```

---

## 1. Project Details

| Item | Value |
|------|-------|
| **Project Name** | AgileTracker |
| **GitHub Repository** | https://github.com/Thiravidaselvam/AgileTracker.git |
| **Live URL** | https://agile-tracker-red.vercel.app |
| **Local Jenkins URL** | http://localhost:8080 |
| **Tech Stack** | Next.js 16, Prisma 7, Neon DB, NextAuth |

---

## 2. Prerequisites Installed

| Software | Version | Notes |
|----------|---------|-------|
| **Java (Temurin)** | JDK 25.0.3 | Required for Jenkins |
| **Jenkins** | 2.555.3 LTS | CI/CD server |
| **Node.js** | 22.x LTS | Required for npm build |
| **ngrok** | 3.39.8 | Exposes Jenkins to internet |
| **Git** | 2.39.2 | Source control |

---

## 3. Java Installation

**Download:** https://adoptium.net/ → Windows x64 MSI (JDK 25)

**Installed Path:**
```
C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot
```

**Environment Variables Set:**
```
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot
PATH      = %PATH%;C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin
```

**Set via Admin CMD:**
```cmd
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot" /M
setx PATH "%PATH%;C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin" /M
```

**Verify:**
```cmd
java -version
```

---

## 4. Jenkins Installation

**Download:** https://www.jenkins.io/download/ → Windows LTS (2.555.3)  
**Installer:** `jenkins.msi`

### Installation Steps
1. Run `jenkins.msi` as Administrator
2. Service Account → choose **"Run service as local system"**
3. Port → keep **8080** → Test Port (must show success)
4. Java path → auto-detected from JAVA_HOME

### First-Time Setup
1. Open browser → `http://localhost:8080`
2. Find unlock password:
```
C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword
```
3. Open with Notepad:
```cmd
notepad C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword
```
4. Paste password → click **Continue**
5. Click **"Install suggested plugins"**
6. Wait 2-3 minutes for plugins to install

### Admin Account Created

| Field | Value |
|-------|-------|
| **Username** | admin |
| **Full Name** | Admin |
| **Email** | thiravidaselvams@gmail.com |
| **Password** | *(stored securely)* |

---

## 5. Jenkins Plugins Installed

| Plugin | Purpose |
|--------|---------|
| **Suggested Plugins** | Installed during setup |
| **NodeJS Plugin** | For npm commands in pipeline |
| **Email Extension Plugin** | For email notifications |
| **GitHub Plugin** | For GitHub webhook integration |

### Install NodeJS Plugin
1. Manage Jenkins → Plugins → Available plugins
2. Search: `NodeJS` → Install

### Configure NodeJS Tool
1. Manage Jenkins → Tools
2. NodeJS installations → Add NodeJS
3. Name: `NodeJS` | Version: `22.x LTS`
4. Save

---

## 6. GitHub Repository Setup

**Repository URL:** https://github.com/Thiravidaselvam/AgileTracker.git  
**Branch:** `master`  
**Account:** thiravidaselvams@gmail.com

### Files Pushed to GitHub
- Full Next.js application (app, components, lib, prisma, scripts)
- `Jenkinsfile` — pipeline definition
- `.gitignore` — excludes node_modules, .env, .next

### Ignored Files (not pushed)
```
node_modules/
.env*
.next/
*.tsbuildinfo
```

---

## 7. Jenkinsfile

**Location:** `E:\TrainningMaterials\ProgressTracker\agile-tracker\Jenkinsfile`

```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out from GitHub'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
                echo 'Dependencies installed'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                bat 'npx prisma generate'
                echo 'Prisma client generated'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
                echo 'Build completed successfully'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
```

---

## 8. Jenkins Pipeline Configuration

1. Jenkins Dashboard → **New Item**
2. Name: `AgileTracker` → Select **Pipeline** → OK
3. Build Triggers → check **"GitHub hook trigger for GITScm polling"**
4. Pipeline section:

| Field | Value |
|-------|-------|
| **Definition** | Pipeline script from SCM |
| **SCM** | Git |
| **Repository URL** | https://github.com/Thiravidaselvam/AgileTracker.git |
| **Branch** | `*/master` |
| **Script Path** | `Jenkinsfile` |

5. Click **Save**

---

## 9. ngrok Setup (Expose Jenkins to Internet)

**Download:** https://ngrok.com/download → Windows  
**Installed at:** `C:\ngrok\ngrok.exe`  
**Account:** thiravidaselvams@gmail.com (Free Plan)

### Setup Steps

1. Get Auth Token from: https://dashboard.ngrok.com → Your Authtoken
2. Run in Admin CMD:
```cmd
C:\ngrok\ngrok.exe config add-authtoken YOUR_AUTH_TOKEN
C:\ngrok\ngrok.exe http 8080
```

3. ngrok shows forwarding URL:
```
https://finalize-domestic-broaden.ngrok-free.dev -> http://localhost:8080
```

> **Note:** On Free plan, the ngrok URL changes every time you restart. Update the GitHub webhook URL when it changes.

### Start ngrok After PC Restart
```cmd
C:\ngrok\ngrok.exe http 8080
```

---

## 10. GitHub Webhook Configuration

1. GitHub → AgileTracker repo → **Settings** → **Webhooks** → **Add webhook**

| Field | Value |
|-------|-------|
| **Payload URL** | `https://finalize-domestic-broaden.ngrok-free.dev/github-webhook/` |
| **Content type** | `application/json` |
| **Events** | Just the push event |
| **Active** | ✓ |

2. Click **Add webhook** → should show green tick

> **Note:** Update Payload URL with new ngrok URL after every PC restart.

---

## 11. Vercel Deployment

**Platform:** Vercel  
**Account:** thiravidaselvams@gmail.com  
**Project:** agile-tracker  
**Live URL:** https://agile-tracker-red.vercel.app

Vercel is connected to GitHub and **automatically deploys** on every push to master — no additional configuration needed.

---

## 12. Email Notifications (In Progress)

**Plugin:** Email Extension Plugin (installed)  
**SMTP Server:** smtp.gmail.com  
**Port:** 465 (SSL)  
**Email:** thiravidaselvams@gmail.com

### Gmail App Password Setup
1. Go to https://myaccount.google.com → Security
2. Enable 2-Step Verification
3. Search "App passwords" → Generate
4. Use the 16-character password in Jenkins SMTP config

---

## 13. How to Trigger a Build

### Automatic (Webhook)
Push any code to GitHub → Jenkins builds automatically

### Manual
1. Go to `http://localhost:8080`
2. Click **AgileTracker**
3. Click **"Build Now"**

### Test Webhook (Empty Commit)
```cmd
git commit --allow-empty -m "Test webhook"
git push
```

---

## 14. Checking Build History

1. Go to `http://localhost:8080`
2. Click **AgileTracker**
3. View **Build History** on left sidebar

| Icon | Meaning |
|------|---------|
| Green circle | Build passed |
| Red circle | Build failed |
| Blue circle | Build in progress |

Click any build number → **Console Output** for full logs.

---

## 15. Daily Startup Checklist

When you restart your PC, run these to restore the pipeline:

- [ ] Jenkins starts automatically (Windows service)
- [ ] Open CMD as Admin → run: `C:\ngrok\ngrok.exe http 8080`
- [ ] Copy new ngrok URL
- [ ] Update GitHub webhook URL: GitHub → Settings → Webhooks → Edit
- [ ] Verify at `http://localhost:8080`

---

## 16. Troubleshooting

| Problem | Solution |
|---------|---------|
| Jenkins not opening | Check Windows Services → Jenkins → Start |
| Port 8080 in use | Change port in Jenkins settings |
| Webhook not triggering | ngrok URL changed — update GitHub webhook |
| Build fails: Prisma error | `npx prisma generate` added to Jenkinsfile |
| Build fails: TypeScript error | Check Console Output for file and line number |
| Java not found | Verify JAVA_HOME environment variable |
