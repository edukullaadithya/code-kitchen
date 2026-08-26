# RentRight

RentRight is a rental recommendation prototype with a vanilla HTML/CSS/JS frontend and a lightweight Node.js API.

## Run locally

1. Install Node.js 18 or newer.
2. From this folder, run `npm start`.
3. Open [http://localhost:3000](http://localhost:3000).

## Accounts

The landing route opens a dedicated sign-in page. Returning renters can sign in
with their email and password; new renters can select **Register Now** to create
an account. Administrator access is provisioned separately and cannot be
created from public registration.

For local demos, use `user@rentright.com` / `user123` for a renter or
`admin@rentright.com` / `admin123` for an administrator.

## HERE Maps

Set `HERE_API_KEY` in `.env` (copy `.env.example` when setting up a new
environment) and restart the server. The browser receives the key only through
the local runtime configuration endpoint, so it is not committed in `app.js`.
For a deployed site, restrict the key to that site's allowed domains in HERE.

## API

- `GET /api/health` checks that the service is running.
- `GET /api/cities` returns the supported city identifiers.
- `POST /api/recommendations` ranks listings based on `city`, `budget`, `propertyType`, `amenities`, `minSafety`, and `maxCommute`.

The frontend uses the API when served through Node and retains its existing in-browser listing data as an offline fallback.
