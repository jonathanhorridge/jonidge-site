# Jonidge studio site

Public studio website for [Jonidge](https://jonidge.com), Jonathan Horridge’s indie mobile-games studio in Switzerland.

Hosted on GitHub Pages from this repository, with the custom domain `jonidge.com`.

## Local preview

The site is static. From this folder:

```bash
python3 -m http.server 8080
```

Then open http://127.0.0.1:8080/

## Custom domain (GoDaddy)

Point DNS at GitHub Pages (do not attach the domain to `jonathanhorridge.github.io`, which would break the existing `/sunplop` project site):

- `A` records for `@` / `jonidge.com` to:

  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`

- `CNAME` for `www` to `jonathanhorridge.github.io`

Remove the existing GoDaddy parking / forwarding `A` records (`13.248.243.5` and `76.223.105.230`) and the current `www` CNAME that points at `jonidge.com`.

Once DNS is live, enable “Enforce HTTPS” in the Pages settings if it is not already on.

## Contact

jonidge@yahoo.com
