# Napkin Quest

A game for practising the back-of-envelope estimates that come up in system design interviews: QPS, storage, bandwidth, latency and capacity.

```bash
npm start   # http://localhost:3000 (Node 18+, no dependencies)
npm test    # validates every template plus the API
```

You can also serve `web/` from any static host. With no API there, the same engine runs in the browser.

## What's in it

- **122 question types across 6 worlds**, each filled with fresh random numbers every time:
  - Unit Island (38 pure conversions)
  - Rush Hour City (18)
  - Warehouse Wharf (20)
  - Bandwidth Bay (16)
  - Latency Lagoon (14)
  - Server Summit (16)
- **Rounds:** 10 different question types from one world, ordered easy to hard. You have 3 hearts: a miss or skip costs one, and the round ends at zero. You earn 1–3 stars per world.
- **Scoring:** spot on (within 1.2×) earns 100 points, in range (within 2×) earns 40. There's a speed bonus of up to +50, a combo multiplier of up to ×2, and using a hint costs 25%.
- **Blitz:** 60 seconds of multiple choice, answered with keys 1–4. The wrong options are built from the classic slips (×8, ×1000, ×86,400, ×365…).
- **Daily challenge:** the same seeded set for everyone that day, with a streak counter.
- **Feedback:** a log-scale target meter, a note naming the likely mistake, worked steps and a pro tip.
- **Progression:** XP, 8 ranks (Intern → Napkin Legend) and 12 badges. It's stored in localStorage, so it stays on that device.
- **Tools:** a calculator that evaluates each line as you type (`5M * 20 / day`) and a pocket guide of reference numbers.

## Architecture

```
web/shared/core.js     units, formatting, parsing, safe calculator, seeded RNG
web/shared/bank.js     the 122 templates (data + worked steps + slip hints)
web/shared/engine.js   rounds, grading, blitz options; pure and deterministic
server/server.js       node:http stateless API + gzipped static files from memory
web/api.js             RemoteApi | LocalApi, the same interface
web/game.js            points, ranks, stars, badges, daily streak
web/app.js, fx.js      screens, the Penny mascot, confetti
```

A question id is `template~seed`, so the server rebuilds any question from its id alone. There's no database and no session store, so you can scale out by adding instances. A round or a Blitz deck loads in one GET (seeded ones are cacheable for a year), and each answer check is one tiny POST. Answers are never sent to the browser before you submit.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/meta` | worlds, template count, pocket guide |
| GET | `/api/round?world=<id or mix>&seed=` | 10 questions, answers stripped |
| POST | `/api/grade` `{id, answers:[{key,value,unit}]}` | levels, slip notes, steps |
| GET | `/api/blitz?seed=` | 80 multiple-choice questions, no answers |
| POST | `/api/blitz/check` `{id, choice}` | correct index, steps |

## Add a question

Add a `T(id, world, level, title, vars, build)` entry to `bank.js`. The tests run every template across 120 seeds and fail on any NaN, non-positive or non-integer answer.
