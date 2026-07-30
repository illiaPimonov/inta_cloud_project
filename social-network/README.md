# Social Network — Python/FastAPI backend on Kubernetes

Next.js frontend + BFF, backend as six FastAPI microservices behind their own MongoDB databases, Redis cache in front of the hottest reads, deployed to Kubernetes.

```
social-network/
  social-network-app/    Next.js 14 frontend + BFF
  services/
    users-service/       FastAPI + Motor + Redis cache → usersdb
    posts-service/        FastAPI + Motor + Redis cache → postsdb
    engagement-service/   FastAPI + Motor                → engagementdb
    notifications-service/                                → notificationsdb
    messages-service/                                      → messagesdb
    search-service/       FastAPI + Motor + Redis cache    → searchdb
  k8s/                    Namespace, ConfigMap, Mongo, Redis, 6 services (x3 replicas), web, Ingress
```

## Prerequisites

- Docker
- `kubectl`
- [kind](https://kind.sigs.k8s.io/) or [minikube](https://minikube.sigs.k8s.io/)

## Build images

```bash
cd social-network

docker build -t social-network/users-service:latest        services/users-service
docker build -t social-network/posts-service:latest         services/posts-service
docker build -t social-network/engagement-service:latest    services/engagement-service
docker build -t social-network/notifications-service:latest services/notifications-service
docker build -t social-network/messages-service:latest      services/messages-service
docker build -t social-network/search-service:latest        services/search-service
docker build -t social-network/web:latest                   social-network-app
```

`mongo:7` and `redis:7-alpine` are pulled from Docker Hub directly — no build needed.

## Load images into your cluster

**kind:**
```bash
for img in users-service posts-service engagement-service notifications-service messages-service search-service web; do
  kind load docker-image social-network/$img:latest
done
```

**minikube:**
```bash
for img in users-service posts-service engagement-service notifications-service messages-service search-service web; do
  minikube image load social-network/$img:latest
done
```

Real cluster: push each image to a registry, update `image:` in `k8s/*.yaml`, drop `imagePullPolicy: IfNotPresent`.

## Deploy

```bash
kubectl apply -k k8s/
kubectl -n social-network get pods -w
```

~23 pods total (18 backend + 3 web + mongo + redis). Drop `replicas: 3` to `1` in any `k8s/*.yaml` if resources are tight.

## Access

```bash
kubectl -n social-network port-forward svc/web 3000:3000
```

http://localhost:3000 — login **jordan@site.com** / any password.

With an ingress controller installed: `k8s/10-ingress.yaml` routes `social-network.local` to `web`.

## Reset to clean state

```bash
kubectl delete -k k8s/
kubectl apply -k k8s/
```

Deletes the `mongo-data` PVC too. To restart without wiping data: `kubectl -n social-network rollout restart deployment`.

## Swagger UI

```bash
kubectl -n social-network port-forward svc/users-service 5001:8080
# → http://localhost:5001/docs
```

## Notes

- Every backend service + `web` run 3 replicas; `mongo` runs 1 (single instance, not HA).
- First-boot seeding is race-safe across replicas via a Mongo-based lock (`acquire_seed_lock()` in each `app/db.py`).
- Redis caches 3 endpoints: `search-service GET /trends` (30s TTL), `users-service GET /users/suggestions` (30s TTL), `posts-service GET /posts` (8s TTL, invalidated on write). Redis is best-effort — a Redis outage just disables caching, doesn't take services down.
- `engagement`/`notifications` `type` values are lowercase (`like`, `repost`, `bookmark`, `follow`, `reply`, `mention`).
- `search-service`'s internal `SearchDoc.type` is `"user"`/`"post"` (string, not int) — unused by the frontend today.
- Known simplifications: demo-only auth (any non-empty password), no cross-service transactions, no handle-rename cascade, only a desktop (1440px) layout.
