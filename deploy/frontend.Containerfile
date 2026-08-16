# Dragon Keeper frontend: builds the Expo web export and serves it with nginx.
# Build context = repository root:
#   podman build --build-arg EXPO_PUBLIC_BACKEND_URL=https://dragonkeeper.deele.dk \
#                -f deploy/frontend.Containerfile .

# ---------- build stage ----------
FROM node:20-bookworm AS build
WORKDIR /app

COPY frontend/package.json ./
RUN yarn install --network-timeout 600000

COPY frontend .

# EXPO_PUBLIC_* vars are inlined into the JS bundle at build time, so the
# backend URL MUST be provided here (not at runtime).
ARG EXPO_PUBLIC_BACKEND_URL
ENV EXPO_PUBLIC_BACKEND_URL=$EXPO_PUBLIC_BACKEND_URL

RUN npx expo export --platform web --output-dir dist

# ---------- serve stage ----------
FROM nginx:1.25-alpine
COPY deploy/frontend-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
