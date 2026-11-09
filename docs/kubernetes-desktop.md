# Deploy your Learning Platform to Kubernetes using Docker Desktop

This tutorial deploys the main learning platform to a local, single-node Docker Desktop Kubernetes cluster. It uses the root Dockerfile, one application replica, an offline ConfigMap, a persistent volume claim and a ClusterIP Service. No cloud account, image registry push or paid model call is needed.

## 1. Start the local cluster

Start Docker Desktop in Linux-container mode. Open **Kubernetes → Create cluster**, select a one-node cluster and create it. Older Desktop versions expose **Enable Kubernetes** in Settings instead. Wait for Running. The initial download needs internet access and can take several minutes. Do not reset an existing cluster to follow this tutorial: resetting can destroy other workloads and data.

See Docker's current [Kubernetes instructions](https://docs.docker.com/desktop/use-desktop/kubernetes/) for the supported choices and operating-system requirements. Desktop's kind provisioner and kubeadm provisioner have different node image stores; the image preparation step below explains this distinction.

From PowerShell in the course repository:

```powershell
docker version
docker desktop kubernetes status
kubectl config get-contexts
kubectl --context docker-desktop get nodes
kubectl --context docker-desktop get storageclass
```

The node must be Ready and there must be a default dynamic storage class. Every command in this guide explicitly selects `docker-desktop`, so your current context does not silently redirect a deployment to a cloud cluster. Do not print raw kubeconfig files, which may contain credentials.

## 2. Build the application image

```powershell
docker --context desktop-linux build -t claude-learning-platform:kubernetes .
docker --context desktop-linux image ls claude-learning-platform:kubernetes
```

The Dockerfile builds React and serves it with Express on port 8080. It runs as user 1000. `.dockerignore` excludes private environment files, Git, generated videos and presentation caches. The image intentionally includes course source and teaching dependencies. Docker builds can download dependencies; “offline” here means the app runs authored scenarios without invoking an AI provider.

### Make the image available to Kubernetes

Our manifest deliberately uses `imagePullPolicy: Never` with a local image tag. Kubernetes will fail clearly if its node does not have that image; it will not try to pull a private application image from Docker Hub.

With kubeadm, verify that the Docker Desktop node can see the locally built image. With a kind-based Desktop cluster, the node may have a separate containerd store. Import the built image into the **Docker Desktop node container** before applying the manifest. Do not assume building on the host loads every Kubernetes node.

The course recorder automates this for Docker Desktop kind nodes by matching Kubernetes node names against Docker containers labelled `io.x-k8s.kind.cluster=desktop`, then streams `docker image save` into that node's `ctr --namespace k8s.io images import -`. It refuses unrelated nodes. Run it only for the dedicated local tutorial deployment:

```powershell
node scripts/record-kubernetes-deployment.mjs --execute-local-deployment
```

That command records the real checks, builds/imports the image if needed, applies the manifest, starts a loopback port-forward, tests offline endpoints, and recreates only this application's pod to verify persistence. For a manual kind import, save the image to a local archive, copy it to the identified Desktop node container, import it with `ctr` in namespace `k8s.io`, then remove the temporary archive. Avoid Windows PowerShell 5 binary pipelines, which can corrupt image tar streams. Do not use a node belonging to another cluster.

For the one-node Desktop kind setup used in this recording, you can instead run `node scripts/load-desktop-kubernetes-image.mjs` after building. This utility verifies the `desktop-control-plane` container's Desktop cluster label and streams the archive without a PowerShell binary pipeline. Docker Desktop may hide system containers from `docker ps`; their absence in that listing does not prove the node does not exist.

The full course image is large. Importing it into the node took about six and a half minutes on the recording machine. Wait for successful completion before expecting a Deployment with `imagePullPolicy: Never` to become Ready. A pod created before the import finishes can temporarily report `ErrImageNeverPull`.

## 3. Read and apply the manifest

Review `k8s/platform.yaml` first. It contains only offline settings, with all three live-execution flags false and no provider key. It does not read your private root `.env`.

```powershell
kubectl --context docker-desktop create namespace learning-platform --dry-run=client -o yaml | kubectl --context docker-desktop apply -f -
kubectl --context docker-desktop apply --dry-run=server -f k8s/platform.yaml
kubectl --context docker-desktop apply -f k8s/platform.yaml
kubectl --context docker-desktop -n learning-platform rollout status deployment/platform --timeout=300s
kubectl --context docker-desktop -n learning-platform get deployment,pods,service,pvc
kubectl --context docker-desktop -n learning-platform logs deployment/platform --tail=20
```

On a brand-new cluster, create the namespace before a server dry-run of its namespaced objects. The recorder performs this first. Use the namespace only for this tutorial; inspect any existing resources before reusing it.

The Deployment requests one replica and uses `Recreate`. The app uses local files and SQLite, so this course setup does not claim to support multiple replicas sharing writes. A 2 GiB ReadWriteOnce claim mounts separate directories for artifacts, sessions, workspaces and logs. Startup, readiness and liveness probes call `/api/health`; Kubernetes does not use the Dockerfile HEALTHCHECK. Resource requests guide scheduling; limits cap each container's consumption.

## 4. Open the deployed app

In a separate terminal, leave this process running:

```powershell
kubectl --context docker-desktop -n learning-platform port-forward --address 127.0.0.1 service/platform 8090:8080
```

Open `http://127.0.0.1:8090`. This command binds only the local loopback address. It does not create public hosting or require an Ingress controller. Port 8080 can continue serving your earlier Compose deployment.

Check `/api/health`, click **Check backend**, run Lab 01's **Normal turn** and **Stream ends early** offline fixtures, inspect TypeScript source, and use **Prepared lesson guidance** in AI Tutor. Verify a notebook note survives reload. No API credits are required for these authored workflows.

Port-forward is a development access process: closing its terminal stops access. A selected pod being replaced can also end it; start the command again after rollout. A Ready pod alone does not prove browser behaviour, so verify the application too.

## 5. Verify persistence and understand its limits

The recorder writes a small proof file under `/app/artifacts`, deletes only this Deployment's current pod, waits for a replacement, and reads the file back. This verifies retention across pod replacement, not backup or disaster recovery.

Browser notebooks, progress and browser identity use browser storage tied to the hostname, port and profile. Kubernetes storage does not back them up. Docker Desktop's local storage is for development: deleting the PVC, deleting its namespace or resetting the cluster can remove data. Inspect the PV reclaim policy and make a separate backup before deletion. Do not delete the namespace as routine teardown.

To pause the tutorial application while retaining its PVC:

```powershell
kubectl --context docker-desktop -n learning-platform scale deployment/platform --replicas=0
# Resume:
kubectl --context docker-desktop -n learning-platform scale deployment/platform --replicas=1
```

Then wait for rollout and restart port-forward.

## Troubleshooting and updates

- `ErrImageNeverPull`: the image tag is missing from the node store. Build the matching tag and import it into the correct Desktop kind node.
- `Pending` PVC: inspect `get storageclass`, `describe pvc platform-data` and events. Do not erase a claim to fix a scheduling issue.
- `CrashLoopBackOff`: inspect `logs deployment/platform`, previous logs and `describe pod`. Check filesystem permissions and available memory.
- Connection refused: confirm the node is Ready, the Deployment is Available, and port-forward is still running on the expected port.
- To update code, build/import a new versioned image tag and update the Deployment's image. Reusing a tag needs an explicit restart and can make rollback confusing. A Deployment rollback cannot restore database contents.

## Optional live models and scope

Live execution is not enabled or tested by this deployment tutorial. To enable it later, supply your own API key through a separately managed Kubernetes Secret, reference only the required environment names, and configure your own Managed Agents IDs and explicit live flags. ConfigMaps are for non-secret configuration. Kubernetes Secrets are base64-encoded objects, not automatically encrypted by base64; cluster administrators can access them. Never put a real key in a committed manifest, screenshot or Docker build argument. Runtime environment changes require replacement pods. Tutor consent still applies.

This deploys the main platform. The three milestone starter ZIPs remain downloadable, but their separate servers are not bundled into this Deployment. Host-specific tools, Word, external transports and publishing dependencies need their own setup. A local single-replica demonstration is not a production Kubernetes architecture.

Official references: [images and pull policy](https://kubernetes.io/docs/concepts/containers/images/), [persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), [port-forward](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/).
