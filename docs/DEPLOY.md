# Deploy a Fly.io (opcional — NO fet; la demo corre en local)

Fly.io demana targeta per desplegar (el trial és curt). Una sola persona crea el compte i convida els altres a l'organització.

## 0. Instal·lar flyctl i entrar
    brew install flyctl            # Mac
    curl -L https://fly.io/install.sh | sh   # Linux / Git Bash
    fly auth signup   # o: fly auth login

## 1. API (FastAPI)
    cd api
    fly launch --no-deploy          # detecta FastAPI, crea fly.toml + Dockerfile. Regió: fra (Frankfurt) o cdg
    fly secrets set SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=<secret> CORS_ORIGINS=https://<nom-web>.fly.dev \
        OPENROUTER_API_KEY=<key> OPENROUTER_MODEL=google/gemini-2.5-flash-lite
    fly deploy
    curl https://<nom-api>.fly.dev/health      # → {"ok":true}
Si `fly launch` no detecta bé `uv`, demana a Claude: "Write a Dockerfile for api/ using uv and uvicorn on port 8080, then update fly.toml internal_port".

## 2. Web (Next.js)
Les variables `NEXT_PUBLIC_*` es posen DINS del codi en compilar, per tant van com a build args (no com a secrets):
    cd web
    fly launch --no-deploy
    fly deploy \
      --build-arg NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
      --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable> \
      --build-arg NEXT_PUBLIC_API_URL=https://<nom-api>.fly.dev \
      --build-arg NEXT_PUBLIC_CLASS_API=http
Si el Dockerfile generat no declara `ARG NEXT_PUBLIC_...` abans de `npm run build`, demana a Claude que els afegeixi.

## 3. Supabase
Authentication → URL Configuration: Site URL = `https://<nom-web>.fly.dev`; afegeix-la també a Redirect URLs (+ `http://localhost:3000/**`).

## 4. Redeploy
`fly deploy` a la carpeta corresponent, des de `main` actualitzat. Només A fa deploys, per no barrejar versions.
