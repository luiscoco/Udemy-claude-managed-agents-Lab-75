# Deploy your Learning Platform to Docker Desktop

This local deployment builds the React frontend and serves it with the Express API from one Node 24 Linux container. The default address is `http://127.0.0.1:8080`. Your development instance on ports 5174/3076 can remain running.

## 1. Check Docker Desktop

Install Docker Desktop for your operating system and start its engine. On Windows, follow the official [installation guide](https://docs.docker.com/desktop/setup/install/windows-install/) and [WSL backend guide](https://docs.docker.com/desktop/features/wsl/), then use Linux containers. Requirements and supported Windows editions can change; use the current Docker instructions for your machine. Docker Desktop was already installed on the instructor machine; the video does not simulate an installer run.

From a terminal in the course folder:

```powershell
docker version
docker compose version
```

`docker version` must show both a client and a server. If the engine is starting, wait until Docker Desktop reports it is running before building. The exact version numbers in the recording are observations from that machine, not prerequisites to copy.

## 2. Prepare an explicitly offline configuration

Use the provided course source containing `Dockerfile`, `compose.yaml` and `.dockerignore`. The container build installs dependencies itself; host `node_modules` is excluded.

```powershell
if (-not (Test-Path -LiteralPath docker/offline.env)) {
  Copy-Item docker/offline.env.example docker/offline.env
}
docker compose --env-file docker/offline.env config --quiet
```

The offline template has no API key and explicitly disables paid execution. `--env-file` selects this configuration instead of automatically reading your private root `.env`. Shell environment variables take precedence over env files; use a clean terminal without provider-key or live-mode overrides for an offline deployment. Do not display an expanded Compose configuration when it contains credentials.

## 3. Build and start

```powershell
docker compose --env-file docker/offline.env build
docker compose --env-file docker/offline.env up -d --wait --wait-timeout 180
docker compose --env-file docker/offline.env ps
docker compose --env-file docker/offline.env logs --tail 20 platform
```

The first build downloads the public Node base image and npm dependencies and compiles the platform. It can take several minutes. Later builds can reuse dependency layers. Wait for a successful exit; a running Docker command alone is not proof of a successful deployment.

The Dockerfile has separate build and runtime stages, retains course source for inspection, runs as the non-root `node` user, and checks `/api/health`. It deliberately retains the installed dependencies needed by `tsx` and the teaching adapters; this is not an example of a minimal dependency-pruned production image. Inside the container Express binds to `0.0.0.0:8080`; Compose publishes that port only on the host's loopback interface.

The image does not include private `.env` files, `.git`, generated videos, presentation caches or machine-specific resource records. Preinstalled course images and narration under `public/` are included when present in the supplied source. They are served locally without authoring-provider credentials. Missing optional media is not generated during deployment.

## 4. Verify the real application

Open `http://127.0.0.1:8080` and click **Check backend**. You can also read `http://127.0.0.1:8080/api/health`.

Open Lab 01, select **Run the exercise**, and run the **Normal turn** offline fixture. Confirm the completed outcome and stop reason. Then choose **Stream ends early** and confirm an incomplete outcome. These are authored teaching scenarios, not Claude model calls.

Inspect **TypeScript source**, then try **AI Tutor → Prepared lesson guidance**. A valid deployment does not require enabling paid models. Save a notebook note and reload the page to check the browser learning state independently of the container's server data.

## 5. Understand persistence and lifecycle

Four named volumes retain server artifacts, sessions, workspaces and logs. Browser notebooks, progress and the tutor's browser identifier live in the browser profile instead. Keep the same browser, hostname and port to retain that origin's browser learning state. A server volume does not automatically back up browser storage.

```powershell
docker compose --env-file docker/offline.env restart platform
docker compose --env-file docker/offline.env ps
docker compose --env-file docker/offline.env stop
docker compose --env-file docker/offline.env start
```

To rebuild after source changes, run `build` followed by `up -d --wait`. To remove this Compose app's containers and network, use `docker compose --env-file docker/offline.env down`; named volumes are retained. Adding `--volumes` removes the app's saved server data, so it is not part of the normal tutorial teardown.

## Optional live models and integration limits

To enable paid tutor or Managed Agents execution later, prepare a separate ignored runtime env file with the settings described in [AI Tutor](ai-tutor.md) and [Managed setup](managed-setup.md), and pass its path with `--env-file`. Recreate the container with `up -d --force-recreate --wait` so it receives the new runtime environment. A simple `restart` does not apply changed environment settings. A runtime env file is not baked into the image, although users with Docker administrative access can inspect a container's environment.

Only the variable names explicitly listed under `environment` in `compose.yaml` are forwarded. An interpolation env file does not automatically inject all of its variables into the container. Additional lesson-specific IDs or integration variables need reviewed entries in a Compose override or the service environment as well as values in the private runtime file.

This image covers the main course platform, authored offline scenarios, source viewing and prepared tutor. Standalone milestone starter downloads and build prompts remain available, but the three separate project servers and their dependency trees are not installed into this image. Run those starters separately using their own instructions. Host-specific tools, interactive desktop automation, Word, notification transports, Python/Chromium publishing exports and other external integrations require their own explicit runtime setup; deploying this container does not prove they work.

If port 8080 is occupied, set `LEARNING_DOCKER_PORT=8090` in `docker/offline.env`, recreate with `up -d --wait`, and open the new port. If health fails, inspect `ps` and `logs`. If a build fails, fix the reported step before capturing or claiming success. This tutorial is a local Docker Desktop deployment, not an internet-facing hosting or TLS setup.

## Video evidence

The video production records real Docker command output under `presentations/docker-desktop-deployment/evidence/` and real Playwright application screenshots under its `platform/` folder. Command/source screenshots are clearly labelled evidence viewers of the actual captured text, not claimed to be Docker Desktop dashboard screenshots. Generated MP4s and caches remain local under `videos/docker-desktop-deployment/` and stay outside Git.
