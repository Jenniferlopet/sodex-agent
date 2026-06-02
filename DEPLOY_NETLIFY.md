# Deploy to Netlify

1. Replace all files in your GitHub repo with this folder's contents.
2. Push to GitHub.
3. Netlify → Add new site → Import existing project → choose your repo.
4. Build settings:
   - Build command: `npm install --include=dev --legacy-peer-deps && npm run build`
   - Publish directory: `.next`
   - Node version: `20`
5. Add environment variables from `.env.example`.
6. Click **Trigger deploy → Clear cache and deploy site**.

If Netlify still says `next: not found`, delete `NPM_FLAGS` in Site configuration → Environment variables and deploy again with cache cleared.
