# Required media files

Video files and the `videos/` folder are **gitignored**. Add these files at build time or via your deploy process so the site can load them.

## Required files (place in `client/public/`)

| Path | Description |
|------|-------------|
| `SkyReach Visuals Website Preview background.mp4` | Hero background video on the home page (exact filename, in `client/public/`). |
| `hero-poster.jpg` | Poster frame shown while the hero video loads. |
| `videos/paul-srv.mp4` | Gallery / About page video clip. |
| `gallery-poster.jpg` | Poster image for gallery and portfolio grid tiles (and optional About section). |
| `skyreach_aboutme_image.png` | About section image on the home page. |
| `logo-display-borderless.png` | Logo used in navbar and quote sidebar. |
| `logo-borderless.png` | Footer logo. |
| `skyreach-display-logo.png` | Favicon (used in `index.html`). |

## Optional: host videos externally

For faster loads and smaller Docker images, you can host large videos on a CDN (e.g. S3, Cloudflare R2, Vimeo) and set `HERO_VIDEO` / `GALLERY_VIDEO` / `ABOUT_VIDEO` in the code to those URLs. Then you do not need to copy MP4s into this folder at build time.
