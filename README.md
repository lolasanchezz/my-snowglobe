# my-snowglobe

Attendee site for Snowglobe, built from the Figma file
(`pqn0IBYdpaEgGllcc9w4lf`) in the same stack as `../snowglobe`
(Next.js 16, React 19, Tailwind 4).

- `/` — sign in w/ Hack Club auth
- `/schedule` — friday / saturday / sunday tabs (data in `lib/schedule.ts`)
- `/info` — team, points, hotel room, organizer contacts (`lib/info.ts`)

## Run it

```sh
cp .env.example .env.local   # fill in CLIENT_ID / CLIENT_SECRET / SESSION_SECRET
npm install
npm run dev
```

Without `CLIENT_ID` in development, "sign in" logs you in as a placeholder
attendee so you can work on the screens. In production it's required.
