# Running the YCIS Monopoly Board Locally

This guide walks you through running the app on your own laptop so it works at events without depending on any external service. One laptop acts as the server; both devices connect to it over the same Wi-Fi network.

---

## What you need (one-time setup)

Install these on the laptop that will run the server:

1. **Node.js 20 or newer** — https://nodejs.org (download the LTS version)
2. **pnpm** — after installing Node.js, open Terminal and run:
   ```
   npm install -g pnpm
   ```
3. **Git** — usually already installed on Mac; download from https://git-scm.com on Windows

---

## First-time setup (do this once)

Open Terminal (Mac) or Git Bash (Windows) and run these commands one by one:

```bash
# 1. Clone the repo
git clone https://github.com/arrakwanyap/Monopoly-Board-Live.git
cd Monopoly-Board-Live

# 2. Install dependencies
pnpm install

# 3. Create the database (this creates game.db in the project folder)
pnpm --filter @workspace/db run push

# 4. Build the app (creates a self-contained server + frontend)
pnpm run build:standalone
```

This only needs to be done once. After that, step 4 only needs to be repeated when you've made code changes.

---

## Running the app on event day

```bash
# From inside the Monopoly-Board-Live folder:
PORT=3000 node artifacts/api-server/dist/index.mjs
```

On **Windows** (Git Bash):
```bash
PORT=3000 node artifacts/api-server/dist/index.mjs
```

On **Windows** (Command Prompt):
```cmd
set PORT=3000 && node artifacts/api-server/dist/index.mjs
```

You should see: `Server listening on port 3000`

---

## Connecting both devices

1. Make sure both devices are on the **same Wi-Fi network**
2. Find the laptop's local IP address:
   - **Mac**: System Settings → Wi-Fi → Details → IP Address (e.g. `192.168.1.42`)
   - **Windows**: Run `ipconfig` in Command Prompt, look for `IPv4 Address`
3. On both devices, open a browser and go to:
   ```
   http://192.168.1.42:3000
   ```
   (replace with your laptop's actual IP)

Both devices will see the same live board — any update on one appears on the other within seconds.

---

## Resetting the game between events

The organiser page has a **Reset Game** button that clears all ownership, positions, and cash back to the starting state. No need to delete the database file.

Alternatively, you can delete `game.db` and re-run `pnpm --filter @workspace/db run push` to start completely fresh.

If you want to store the database file somewhere else, set the `SQLITE_FILE` env var:
```bash
SQLITE_FILE=/path/to/custom.db PORT=3000 node artifacts/api-server/dist/index.mjs
```

---

## Getting code updates from Replit

When you've made changes in Replit and want them on your laptop:

```bash
git pull
pnpm install          # only needed if new packages were added
pnpm run build:standalone
```

Then restart the server.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot find module" error | Run `pnpm install` again |
| Second device can't connect | Check both are on the same Wi-Fi; try disabling the laptop's firewall temporarily |
| Page loads but board is empty | Run `pnpm --filter @workspace/db run push` then restart the server |
| Port 3000 already in use | Change `PORT=3000` to `PORT=3001` (and connect on port 3001) |
