// Napkin Quest question bank: 122 templates. Every template draws fresh numbers from
// its `vars` with a seeded RNG, so each one yields many distinct questions.
// build(v) → { q, facts?, answers: [A(...)], hint, tip }
import { DAY, HOUR, MONTH, YEAR, compact as c, sig as s, commas as n, fmt } from "./core.js";

const B = (x) => fmt(x, "bytes");
const BIT = (x) => fmt(x, "bits");
const TM = (x) => fmt(x, "time");
const R = (x, noun = "") => fmt(x, "rate", noun);
const A = (label, dim, value, steps, o = {}) => ({ label, dim, value, steps, ...o });
const F = (...pairs) => pairs.map(([label, value]) => ({ label, value: String(value) }));
const T = (id, world, level, title, vars, build) => ({ id, world, level, title, vars, build });

export const WORLDS = [
  { id: "units", name: "Unit Island", blurb: "Seconds, bits and bytes. Get the conversions right before anything else.", color: "#ffd23f" },
  { id: "traffic", name: "Rush Hour City", blurb: "Daily users into requests per second, plus peaks and fan-out.", color: "#ff8a5b" },
  { id: "storage", name: "Warehouse Wharf", blurb: "Bytes that pile up: media, logs, rows and years of retention.", color: "#7cc6fe" },
  { id: "network", name: "Bandwidth Bay", blurb: "Throughput, egress, CDNs and the ×8 that trips everyone up.", color: "#b8a1ff" },
  { id: "latency", name: "Latency Lagoon", blurb: "Budgets, round trips, queues and the speed of light.", color: "#5ee0c8" },
  { id: "capacity", name: "Server Summit", blurb: "How many servers, shards, nodes and dollars it takes.", color: "#ff7eb6" },
];

const SLIP = { replicas: (r) => [r, "Did you apply the replication factor?"], peak: (p) => [p, "Check the peak multiplier."], year: [365, "Per-day vs per-year mix-up (×365)."] };

export const TEMPLATES = [
  /* ===================== UNIT ISLAND (38) ===================== */
  T("u-day-sec", "units", 1, "Per day → per second", { n: [1e6, 5e6, 1e7, 5e7, 1e8, 5e8, 1e9, 5e9] }, (v) => ({
    q: `Something happens ${c(v.n)} times a day. How many times per second is that, on average?`,
    answers: [A("Average rate", "rate", v.n / DAY, [`${c(v.n)} ÷ 86,400 s ≈ ${R(v.n / DAY)}`], { noun: "events" })],
    hint: "A day is about 10⁵ seconds (86,400).", tip: "1M per day ≈ 12 per second. 1B per day ≈ 12K per second.",
  })),
  T("u-month-sec", "units", 1, "Per month → per second", { n: [1e7, 1e8, 5e8, 1e9, 1e10] }, (v) => ({
    q: `A service handles ${c(v.n)} requests a month. What's the average per second?`,
    answers: [A("Average rate", "rate", v.n / MONTH, [`Seconds per month ≈ 30 × 86,400 ≈ 2.6M`, `${c(v.n)} ÷ 2.6M ≈ ${R(v.n / MONTH)}`], { noun: "req" })],
    hint: "A month is about 2.6 million seconds.", tip: "1B per month ≈ 400 per second.",
  })),
  T("u-year-sec", "units", 1, "Per year → per second", { n: [1e9, 1e10, 1e11, 1e12] }, (v) => ({
    q: `${c(v.n)} records are written every year. How many is that per second?`,
    answers: [A("Average rate", "rate", v.n / YEAR, [`A year ≈ 31.5M s (≈ π × 10⁷)`, `${c(v.n)} ÷ 31.5M ≈ ${R(v.n / YEAR)}`], { noun: "writes" })],
    hint: "A year is about π × 10⁷ seconds.", tip: "π × 10⁷ s is the classic way to remember a year.",
  })),
  T("u-sec-day", "units", 1, "Per second → per day", { r: [10, 50, 100, 500, 1e3, 5e3, 1e4, 1e5] }, (v) => ({
    q: `An API averages ${n(v.r)} requests per second around the clock. How many requests is that per day?`,
    answers: [A("Requests per day", "count", v.r * DAY, [`${n(v.r)} × 86,400 = ${c(v.r * DAY)}`], { noun: "requests" })],
    hint: "Multiply by 86,400.", tip: "100 req/s is about 8.6M per day.",
  })),
  T("u-hour-sec", "units", 1, "Per hour → per second", { n: [3.6e4, 1e5, 1e6, 1e7, 5e7] }, (v) => ({
    q: `During a flash sale, ${c(v.n)} orders arrive in one hour. What's the rate per second?`,
    answers: [A("Order rate", "rate", v.n / HOUR, [`${c(v.n)} ÷ 3,600 ≈ ${R(v.n / HOUR)}`], { noun: "orders" })],
    hint: "An hour is 3,600 seconds.", tip: "Peak hours are often 10–15% of daily volume. That's why per-hour numbers matter.",
  })),
  T("u-sec-month", "units", 1, "Per second → per month", { r: [100, 1e3, 1e4, 5e4] }, (v) => ({
    q: `A queue receives ${n(v.r)} messages per second, all the time. How many messages arrive per month?`,
    answers: [A("Messages per month", "count", v.r * MONTH, [`${n(v.r)} × 2.6M s = ${c(v.r * MONTH)}`], { noun: "messages" })],
    hint: "A month is about 2.6M seconds.", tip: "1K/s is 2.6 billion per month.",
  })),
  T("u-mbps", "units", 1, "Bytes → bits", { m: [5, 12.5, 50, 125, 250, 1000] }, (v) => ({
    q: `A disk streams ${v.m} MB/s over the network. What's that in network units (bits per second)?`,
    answers: [A("Bandwidth", "bits", v.m * 8e6, [`${v.m} MB/s × 8 bits/byte = ${BIT(v.m * 8e6)}`])],
    hint: "Network speeds are in bits. One byte is 8 bits.", tip: "125 MB/s = 1 Gbps. That's worth memorising.",
  })),
  T("u-gbps-bytes", "units", 1, "Bits → bytes", { g: [1, 10, 25, 40, 100] }, (v) => ({
    q: `Your NIC is rated at ${v.g} Gbps. How many bytes per second can it move at best?`,
    answers: [A("Bytes per second", "bytes", (v.g * 1e9) / 8, [`${v.g} Gbps ÷ 8 = ${B((v.g * 1e9) / 8)} per second`])],
    hint: "Divide bits by 8.", tip: "10 Gbps is 1.25 GB/s. A fast SSD can saturate it.",
  })),
  T("u-mbps-hour", "units", 2, "Link speed → data per hour", { m: [5, 10, 25, 100, 1000] }, (v) => ({
    q: `A link runs at a steady ${v.m} Mbps for one hour. How much data crosses it?`,
    answers: [A("Data per hour", "bytes", ((v.m * 1e6) / 8) * HOUR, [`Bytes/s = ${v.m} Mbps ÷ 8 = ${B((v.m * 1e6) / 8)}/s`, `× 3,600 s = ${B(((v.m * 1e6) / 8) * HOUR)}`])],
    hint: "Convert to bytes/s first, then multiply by 3,600.", tip: "1 Gbps for an hour is 450 GB.",
  })),
  T("u-gbday-mbps", "units", 2, "GB per day → Mbps", { g: [100, 500, 1000, 5000, 1e4] }, (v) => ({
    q: `A service ships ${n(v.g)} GB a day. What's the average bandwidth?`,
    answers: [A("Average bandwidth", "bits", (v.g * 8e9) / DAY, [`Bits/day = ${n(v.g)} GB × 8 = ${c(v.g * 8e9)} bits`, `÷ 86,400 ≈ ${BIT((v.g * 8e9) / DAY)}`])],
    hint: "GB → bits (×8×10⁹), then ÷ 86,400.", tip: "1 TB/day ≈ 93 Mbps.",
  })),
  T("u-tbmonth-gbps", "units", 2, "TB per month → Gbps", { t: [10, 100, 500, 1000, 5000] }, (v) => ({
    q: `Your CDN bill shows ${n(v.t)} TB of egress this month. What's the average throughput?`,
    answers: [A("Average throughput", "bits", (v.t * 8e12) / MONTH, [`Bits = ${n(v.t)} TB × 8 = ${c(v.t * 8e12)} bits`, `÷ 2.6M s ≈ ${BIT((v.t * 8e12) / MONTH)}`])],
    hint: "Bits per month ÷ 2.6M seconds.", tip: "1 PB/month ≈ 3 Gbps on average.",
  })),
  T("u-pages", "units", 1, "Pages in a buffer", { k: [4, 8, 16, 64], g: [1, 16, 64, 256] }, (v) => ({
    q: `A database buffer pool is ${v.g} GB and uses ${v.k} KB pages. How many pages fit?`,
    answers: [A("Pages", "count", (v.g * 1e9) / (v.k * 1e3), [`${v.g} GB ÷ ${v.k} KB = ${c((v.g * 1e9) / (v.k * 1e3))}`], { noun: "pages" })],
    hint: "1 GB ÷ 1 KB = 1M.", tip: "Every step in K/M/G is ×1,000.",
  })),
  T("u-pow2", "units", 1, "Powers of two", { p: [10, 16, 20, 24, 30, 32, 40] }, (v) => ({
    q: `Roughly how much is 2^${v.p}?`,
    answers: [A("Value", "count", 2 ** v.p, [`2¹⁰ ≈ 10³, so 2^${v.p} ≈ ${c(2 ** v.p)}`])],
    hint: "2¹⁰ ≈ 1,000. Split the exponent into tens.", tip: "2³² ≈ 4.3B is the IPv4 space and the limit of a 32-bit int.",
  })),
  T("u-address-bits", "units", 2, "Bits to address N things", { N: [1e3, 1e6, 1e9, 4e9, 1e12, 1e15] }, (v) => ({
    q: `How many bits do you need to give a unique ID to each of ${c(v.N)} items?`,
    answers: [A("Bits", "count", Math.ceil(Math.log2(v.N)), [`2¹⁰ ≈ 10³, so 10³ items need ~10 bits per factor of 1,000`, `log₂(${c(v.N)}) ≈ ${s(Math.log2(v.N))} → ${Math.ceil(Math.log2(v.N))} bits`], { noun: "bits", integer: true })],
    hint: "Each ×1,000 costs ~10 bits.", tip: "64-bit IDs cover ~1.8 × 10¹⁹ values. You won't run out.",
  })),
  T("u-gib", "units", 2, "GiB vs GB", { g: [16, 32, 64, 128, 512] }, (v) => ({
    q: `A VM has ${v.g} GiB of RAM (binary). How many decimal GB (10⁹ bytes) is that?`,
    answers: [A("Decimal size", "bytes", v.g * 2 ** 30, [`1 GiB = 2³⁰ B ≈ 1.074 GB`, `${v.g} × 1.074 ≈ ${B(v.g * 2 ** 30)}`])],
    hint: "Binary units are ~7% bigger at the G level.", tip: "The binary/decimal gap grows: ~2% at K, ~7% at G, ~10% at T.",
  })),
  T("u-seconds-in", "units", 1, "Seconds in a stretch of days", { d: [7, 30, 90, 365] }, (v) => ({
    q: `How many seconds are in ${v.d} days?`,
    answers: [A("Seconds", "count", v.d * DAY, [`${v.d} × 86,400 = ${n(v.d * DAY)}`], { noun: "seconds" })],
    hint: "86,400 per day.", tip: "A week is about 600K seconds.",
  })),
  T("u-thread-rps", "units", 1, "Latency → throughput per thread", { ms: [1, 2, 5, 10, 20, 50, 100, 250] }, (v) => ({
    q: `A single-threaded worker handles one request at a time, and each takes ${v.ms} ms. What's its maximum throughput?`,
    answers: [A("Max throughput", "rate", 1000 / v.ms, [`1,000 ms ÷ ${v.ms} ms = ${R(1000 / v.ms, "req")}`], { noun: "req" })],
    hint: "How many ${ms}-ms slots fit in one second?".replace("${ms}", v.ms), tip: "Throughput = concurrency ÷ latency.",
  })),
  T("u-ssd-iops", "units", 1, "SSD reads per second", { us: [20, 50, 100, 200] }, (v) => ({
    q: `A random SSD read takes ~${v.us} µs. Done strictly one after another, how many reads per second is that?`,
    answers: [A("Reads per second", "rate", 1e6 / v.us, [`1 s = 1,000,000 µs`, `1,000,000 ÷ ${v.us} = ${R(1e6 / v.us, "reads")}`], { noun: "reads" })],
    hint: "A second has a million microseconds.", tip: "Real SSDs reach far more IOPS by running many reads in parallel.",
  })),
  T("u-video-hours", "units", 2, "Hours of video per terabyte", { mbps: [1, 2.5, 5, 8, 25] }, (v) => ({
    q: `Video is encoded at ${v.mbps} Mbps. How many hours of it fit on 1 TB?`,
    answers: [A("Hours", "count", 8e12 / (v.mbps * 1e6) / HOUR, [`1 TB = 8 × 10¹² bits`, `Seconds = 8 × 10¹² ÷ ${v.mbps}M = ${c(8e12 / (v.mbps * 1e6))}`, `÷ 3,600 ≈ ${s(8e12 / (v.mbps * 1e6) / HOUR)} hours`], { noun: "hours" })],
    hint: "Total bits ÷ bitrate = seconds.", tip: "5 Mbps HD is about 2.25 GB per hour.",
  })),
  T("u-download", "units", 1, "Download time", { gb: [1, 4, 10, 50], mbps: [50, 100, 500, 1000] }, (v) => ({
    q: `How long does a ${v.gb} GB download take over a ${v.mbps} Mbps connection (ignore overhead)?`,
    answers: [A("Time", "time", ((v.gb * 8e9) / (v.mbps * 1e6)) * 1000, [`Bits = ${v.gb} GB × 8 = ${c(v.gb * 8e9)}`, `÷ ${v.mbps} Mbps = ${s((v.gb * 8e9) / (v.mbps * 1e6))} s ≈ ${TM(((v.gb * 8e9) / (v.mbps * 1e6)) * 1000)}`])],
    hint: "Size in bits ÷ link speed in bits.", tip: "If you forget ×8, your estimate comes out 8× too fast.",
  })),
  T("u-pb-transfer", "units", 2, "Moving a petabyte", { pb: [1, 5], gbps: [1, 10, 100] }, (v) => ({
    q: `You need to copy ${v.pb} PB between data centers over a ${v.gbps} Gbps link running flat out. How many days?`,
    answers: [A("Days", "count", (v.pb * 8e15) / (v.gbps * 1e9) / DAY, [`Bits = ${v.pb} PB × 8 = ${c(v.pb * 8e15)}`, `Seconds = ÷ ${v.gbps} Gbps = ${c((v.pb * 8e15) / (v.gbps * 1e9))}`, `÷ 86,400 ≈ ${s((v.pb * 8e15) / (v.gbps * 1e9) / DAY)} days`], { noun: "days" })],
    hint: "1 PB at 10 Gbps is roughly 9 days.", tip: "At this scale, shipping hard drives by truck can beat the network.",
  })),
  T("u-books", "units", 1, "A library in bytes", { words: [5e4, 1e5, 2e5], books: [1e5, 1e6, 1e7] }, (v) => ({
    q: `A digital library has ${c(v.books)} books averaging ${c(v.words)} words each. At ~6 bytes per word of plain text, how big is it?`,
    facts: F(["Books", c(v.books)], ["Words/book", c(v.words)], ["Bytes/word", 6]),
    answers: [A("Total size", "bytes", v.books * v.words * 6, [`Bytes/book = ${c(v.words)} × 6 = ${B(v.words * 6)}`, `× ${c(v.books)} books = ${B(v.books * v.words * 6)}`])],
    hint: "A novel is about half a megabyte of text.", tip: "Text is tiny. Images and video are where storage goes.",
  })),
  T("u-uuid", "units", 1, "Storing UUIDs", { k: [1e8, 1e9, 1e10] }, (v) => ({
    q: `How much space do ${c(v.k)} UUIDs take in binary form?`,
    answers: [A("Size", "bytes", v.k * 16, [`A UUID is 128 bits = 16 bytes`, `${c(v.k)} × 16 B = ${B(v.k * 16)}`], { slips: [[36 / 16, "16 bytes in binary. 36 is the text form."]] })],
    hint: "128 bits.", tip: "Stored as text they take 36 bytes, 2.25× more.",
  })),
  T("u-int64", "units", 1, "An array of 64-bit ints", { k: [1e8, 1e9, 5e9] }, (v) => ({
    q: `How much memory does an array of ${c(v.k)} 64-bit integers need?`,
    answers: [A("Memory", "bytes", v.k * 8, [`64 bits = 8 bytes`, `${c(v.k)} × 8 B = ${B(v.k * 8)}`])],
    hint: "Divide bits by 8 to get bytes.", tip: "1B longs = 8 GB. That already rules out a small VM.",
  })),
  T("u-error-rate", "units", 1, "Error percentage → errors per second", { k: [1e8, 1e9, 1e10], p: [0.01, 0.1, 1] }, (v) => ({
    q: `A system serves ${c(v.k)} requests a day, and ${v.p}% of them fail. How many failures per second?`,
    answers: [A("Failures", "rate", (v.k * v.p) / 100 / DAY, [`Failures/day = ${c(v.k)} × ${v.p}% = ${c((v.k * v.p) / 100)}`, `÷ 86,400 ≈ ${R((v.k * v.p) / 100 / DAY, "errors")}`], { noun: "errors", slips: [[100, "Percent means ÷100."]] })],
    hint: "Turn the percentage into a fraction first.", tip: "A small percentage of a huge number is still a pager storm.",
  })),
  T("u-nines-year", "units", 2, "Nines → downtime per year", { a: [99, 99.9, 99.95, 99.99, 99.999] }, (v) => ({
    q: `An SLA promises ${v.a}% availability. How much downtime does that allow per year?`,
    answers: [A("Downtime per year", "time", (1 - v.a / 100) * YEAR * 1000, [`Allowed = ${s(100 - v.a)}% of 365 days`, `= ${s(1 - v.a / 100)} × 31.5M s ≈ ${TM((1 - v.a / 100) * YEAR * 1000)}`])],
    hint: "Each extra nine is 10× less downtime.", tip: "Three nines ≈ 8.8 hours a year. Five nines ≈ 5 minutes.",
  })),
  T("u-nines-month", "units", 2, "Nines → downtime per month", { a: [99.5, 99.9, 99.95, 99.99] }, (v) => ({
    q: `Your monthly SLO is ${v.a}% uptime. How much downtime is the error budget for a 30-day month?`,
    answers: [A("Error budget", "time", (1 - v.a / 100) * MONTH * 1000, [`Budget = ${s(100 - v.a)}% × 30 days`, `= ${s(1 - v.a / 100)} × 2.59M s ≈ ${TM((1 - v.a / 100) * MONTH * 1000)}`])],
    hint: "Fraction of the month × seconds in a month.", tip: "99.9% gives you ~43 minutes a month. One bad deploy can use it all.",
  })),
  T("u-mau", "units", 1, "DAU → MAU", { dau: [1e6, 1e7, 5e7], r: [10, 20, 25, 50] }, (v) => ({
    q: `An app has ${c(v.dau)} daily users and a DAU/MAU ratio of ${v.r}%. Roughly how many monthly users?`,
    answers: [A("Monthly users", "count", v.dau / (v.r / 100), [`MAU = ${c(v.dau)} ÷ ${v.r}% = ${c(v.dau / (v.r / 100))}`], { noun: "users" })],
    hint: "DAU = MAU × ratio.", tip: "A DAU/MAU ratio above 50% means a very sticky app.",
  })),
  T("u-link-rps", "units", 2, "Link speed → request ceiling", { g: [1, 10, 25, 100], kb: [10, 50, 100, 500] }, (v) => ({
    q: `A ${v.g} Gbps link serves ${v.kb} KB responses. What's the most requests per second it can carry?`,
    answers: [A("Max requests", "rate", (v.g * 1e9) / 8 / (v.kb * 1e3), [`Bytes/s = ${v.g} Gbps ÷ 8 = ${B((v.g * 1e9) / 8)}/s`, `÷ ${v.kb} KB = ${R((v.g * 1e9) / 8 / (v.kb * 1e3), "req")}`], { noun: "req" })],
    hint: "Convert the link to bytes/s, then divide by the payload.", tip: "Payload size often sets the limit before CPU does.",
  })),
  T("u-base64", "units", 1, "Base64 overhead", { mb: [1, 10, 100, 750] }, (v) => ({
    q: `You base64-encode a ${v.mb} MB file to embed it in JSON. How big is it now?`,
    answers: [A("Encoded size", "bytes", ((v.mb * 1e6) * 4) / 3, [`Base64 turns 3 bytes into 4 characters (×4/3)`, `${v.mb} MB × 1.33 ≈ ${B(((v.mb * 1e6) * 4) / 3)}`])],
    hint: "3 bytes in, 4 bytes out.", tip: "That's +33%. Send large binaries as raw bytes instead.",
  })),
  T("u-compress", "units", 1, "Compression", { gb: [10, 100, 500, 2000], r: [2, 4, 5, 10] }, (v) => ({
    q: `${n(v.gb)} GB of JSON logs compress ${v.r}:1. What's the compressed size?`,
    answers: [A("Compressed", "bytes", (v.gb * 1e9) / v.r, [`${n(v.gb)} GB ÷ ${v.r} = ${B((v.gb * 1e9) / v.r)}`])],
    hint: "Divide by the ratio.", tip: "Text logs often compress 5–10×.",
  })),
  T("u-erasure", "units", 2, "Replication vs erasure coding", { tb: [100, 500, 1000] }, (v) => ({
    q: `You store ${v.tb} TB of user data. Raw disk needed with 3× replication, and with erasure coding at 1.4× overhead?`,
    answers: [
      A("3× replication", "bytes", v.tb * 1e12 * 3, [`${v.tb} TB × 3 = ${B(v.tb * 1e12 * 3)}`]),
      A("Erasure coded", "bytes", v.tb * 1e12 * 1.4, [`${v.tb} TB × 1.4 = ${B(v.tb * 1e12 * 1.4)}`]),
    ],
    hint: "Multiply by each overhead factor.", tip: "Erasure coding saves more than half the disk, but rebuilds cost more CPU and network.",
  })),
  T("u-hex-bits", "units", 1, "Hex characters → bits", { k: [8, 16, 32, 40, 64] }, (v) => ({
    q: `How many bits of information are in a ${v.k}-character hex string?`,
    answers: [A("Bits", "count", v.k * 4, [`One hex digit = 4 bits`, `${v.k} × 4 = ${v.k * 4} bits`], { noun: "bits", integer: true })],
    hint: "16 = 2⁴.", tip: "A 40-char git SHA-1 holds 160 bits. SHA-256 is 64 hex chars.",
  })),
  T("u-base62", "units", 1, "Base-62 key space", { k: [5, 6, 7, 8] }, (v) => ({
    q: `How many distinct keys can a ${v.k}-character base-62 code (a–z, A–Z, 0–9) represent?`,
    answers: [A("Keys", "count", 62 ** v.k, [`62^${v.k} ≈ ${c(62 ** v.k)}`], { noun: "keys" })],
    hint: "62² ≈ 3,844 and 62³ ≈ 238K.", tip: "Each extra character gives you 62× more keys.",
  })),
  T("u-sec-year", "units", 1, "Per second → per year", { r: [1, 10, 100, 1000] }, (v) => ({
    q: `A sensor fleet writes ${n(v.r)} points per second, nonstop. How many points per year?`,
    answers: [A("Points per year", "count", v.r * YEAR, [`${n(v.r)} × 31.5M s = ${c(v.r * YEAR)}`], { noun: "points" })],
    hint: "A year is about 31.5M seconds.", tip: "1 per second for a year is about 31.5M.",
  })),
  T("u-modem", "units", 1, "Slow links", { kbps: [56, 128, 512], mb: [1, 5, 10] }, (v) => ({
    q: `On a ${v.kbps} Kbps connection, how long does a ${v.mb} MB page bundle take to download?`,
    answers: [A("Time", "time", ((v.mb * 8e6) / (v.kbps * 1e3)) * 1000, [`Bits = ${v.mb} MB × 8 = ${c(v.mb * 8e6)}`, `÷ ${v.kbps} Kbps = ${s((v.mb * 8e6) / (v.kbps * 1e3))} s`])],
    hint: "Kilobits, not kilobytes.", tip: "Many users are still on slow mobile networks. Page weight matters.",
  })),
  T("u-ram-objects", "units", 1, "Objects in RAM", { g: [16, 64, 256], kb: [0.5, 1, 4] }, (v) => ({
    q: `How many ${v.kb} KB objects fit in ${v.g} GB of memory (ignore overhead)?`,
    answers: [A("Objects", "count", (v.g * 1e9) / (v.kb * 1e3), [`${v.g} GB ÷ ${v.kb} KB = ${c((v.g * 1e9) / (v.kb * 1e3))}`], { noun: "objects" })],
    hint: "1 GB ÷ 1 KB = 1M.", tip: "With real overhead, expect 30–50% fewer.",
  })),
  T("u-cron-runs", "units", 1, "Cron runs per year", { m: [1, 5, 15, 60] }, (v) => ({
    q: `A cron job runs every ${v.m} minute${v.m > 1 ? "s" : ""}. How many times does it run in a year?`,
    answers: [A("Runs", "count", YEAR / 60 / v.m, [`Minutes/year = 365 × 1,440 = 525,600`, `÷ ${v.m} = ${n(YEAR / 60 / v.m)}`], { noun: "runs" })],
    hint: "There are 1,440 minutes in a day.", tip: "525,600 minutes in a year.",
  })),

  /* ===================== RUSH HOUR CITY (18) ===================== */
  T("t-dau-rps", "traffic", 1, "Daily users → RPS", { dau: [2e5, 1e6, 5e6, 1e7, 5e7, 1e8], per: [5, 10, 20, 50], pk: [2, 3, 5] }, (v) => ({
    q: `A photo app has ${c(v.dau)} daily users. Each makes ~${v.per} requests a day, and traffic peaks at ${v.pk}× average. Average and peak RPS?`,
    facts: F(["DAU", c(v.dau)], ["Requests/user/day", v.per], ["Peak", `${v.pk}×`]),
    answers: [
      A("Average", "rate", (v.dau * v.per) / DAY, [`Requests/day = ${c(v.dau)} × ${v.per} = ${c(v.dau * v.per)}`, `÷ 86,400 ≈ ${R((v.dau * v.per) / DAY, "req")}`], { noun: "req" }),
      A("Peak", "rate", ((v.dau * v.per) / DAY) * v.pk, [`× ${v.pk} = ${R(((v.dau * v.per) / DAY) * v.pk, "req")}`], { noun: "req", slips: [SLIP.peak(v.pk)] }),
    ],
    hint: "Requests per day ÷ 10⁵ gives a quick average.", tip: "Size servers for the peak, not the average.",
  })),
  T("t-read-write", "traffic", 2, "Read/write split", { dau: [1e6, 1e7, 1e8, 3e8], w: [1, 2, 5], ratio: [10, 50, 100] }, (v) => ({
    q: `A feed app has ${c(v.dau)} DAU who each post ${v.w}× a day. Reads outnumber writes ${v.ratio}:1. Write QPS and read QPS?`,
    facts: F(["DAU", c(v.dau)], ["Posts/user/day", v.w], ["Read:write", `${v.ratio}:1`]),
    answers: [
      A("Write QPS", "rate", (v.dau * v.w) / DAY, [`${c(v.dau * v.w)} writes/day ÷ 86,400 ≈ ${R((v.dau * v.w) / DAY, "writes")}`], { noun: "writes" }),
      A("Read QPS", "rate", ((v.dau * v.w) / DAY) * v.ratio, [`× ${v.ratio} = ${R(((v.dau * v.w) / DAY) * v.ratio, "reads")}`], { noun: "reads", slips: [[v.ratio, "The ratio multiplies the write rate."]] }),
    ],
    hint: "Work out writes first.", tip: "A heavy read ratio is the signal to add caches and read replicas.",
  })),
  T("t-fanout", "traffic", 3, "Fan-out on write", { p: [1e7, 1e8, 5e8], f: [50, 200, 500], pk: [2, 3] }, (v) => ({
    q: `Users publish ${c(v.p)} posts a day. Each post is copied into all ${v.f} followers' timelines (fan-out on write). Peak is ${v.pk}× average. Peak timeline inserts per second?`,
    facts: F(["Posts/day", c(v.p)], ["Followers", v.f], ["Peak", `${v.pk}×`]),
    answers: [A("Peak inserts", "rate", (v.p / DAY) * v.f * v.pk, [`Posts/s = ${c(v.p)} ÷ 86,400 ≈ ${s(v.p / DAY)}`, `× ${v.f} followers = ${c((v.p / DAY) * v.f)}/s`, `× ${v.pk} peak = ${R((v.p / DAY) * v.f * v.pk, "inserts")}`], { noun: "inserts", slips: [[v.f, "Multiply by the follower count."], SLIP.peak(v.pk)] })],
    hint: "Fan-out multiplies writes by the number of followers.", tip: "This is why celebrity accounts switch to fan-out on read.",
  })),
  T("t-chat", "traffic", 2, "Group chat delivery", { dau: [1e7, 5e7, 1e8], m: [20, 40, 60], g: [5, 10, 20] }, (v) => ({
    q: `${c(v.dau)} DAU each send ${v.m} messages a day into groups averaging ${v.g} recipients. Messages sent per second, and deliveries per second?`,
    answers: [
      A("Sends", "rate", (v.dau * v.m) / DAY, [`${c(v.dau * v.m)} ÷ 86,400 ≈ ${R((v.dau * v.m) / DAY, "msgs")}`], { noun: "msgs" }),
      A("Deliveries", "rate", ((v.dau * v.m) / DAY) * v.g, [`× ${v.g} recipients = ${R(((v.dau * v.m) / DAY) * v.g, "deliveries")}`], { noun: "deliveries", slips: [[v.g, "Each send is delivered to every recipient."]] }),
    ],
    hint: "Deliveries = sends × recipients.", tip: "Delivery fan-out is why chat systems keep connection gateways separate.",
  })),
  T("t-search", "traffic", 1, "Search peak QPS", { dau: [5e6, 2e7, 1e8], k: [3, 5, 10], pk: [2, 3] }, (v) => ({
    q: `${c(v.dau)} users search ${v.k} times a day each. Peak is ${v.pk}× average. What's peak search QPS?`,
    answers: [A("Peak QPS", "rate", ((v.dau * v.k) / DAY) * v.pk, [`Avg = ${c(v.dau * v.k)} ÷ 86,400 ≈ ${s((v.dau * v.k) / DAY)}/s`, `Peak = × ${v.pk} ≈ ${R(((v.dau * v.k) / DAY) * v.pk, "queries")}`], { noun: "queries", slips: [SLIP.peak(v.pk)] })],
    hint: "Average first, then the peak factor.", tip: "Typeahead can multiply search QPS by 5–10×.",
  })),
  T("t-polling", "traffic", 2, "Mobile polling", { d: [1e6, 5e6, 2e7], every: [10, 30, 60], act: [10, 20, 50] }, (v) => ({
    q: `${c(v.d)} installed apps, ${v.act}% open at any moment, each poll the server every ${v.every} s. Requests per second?`,
    answers: [A("Poll rate", "rate", ((v.d * v.act) / 100) / v.every, [`Active = ${c(v.d)} × ${v.act}% = ${c((v.d * v.act) / 100)}`, `÷ ${v.every} s = ${R(((v.d * v.act) / 100) / v.every, "req")}`], { noun: "req" })],
    hint: "Active devices ÷ poll interval.", tip: "Push notifications or long-polling remove most of this load.",
  })),
  T("t-iot", "traffic", 1, "IoT telemetry", { d: [1e5, 1e6, 1e7], every: [1, 5, 10, 60] }, (v) => ({
    q: `${c(v.d)} sensors each send one reading every ${v.every} second${v.every > 1 ? "s" : ""}. Ingest rate?`,
    answers: [A("Ingest", "rate", v.d / v.every, [`${c(v.d)} ÷ ${v.every} s = ${R(v.d / v.every, "msgs")}`], { noun: "msgs" })],
    hint: "Devices ÷ interval.", tip: "Batch at the edge: 10 readings per message is 10× fewer requests.",
  })),
  T("t-push", "traffic", 2, "Push notification blast", { u: [1e7, 5e7, 1e8], opt: [30, 50, 70] }, (v) => ({
    q: `A breaking-news push goes to ${c(v.u)} users, of whom ${v.opt}% have notifications on. You must send them all within one hour. Sends per second?`,
    answers: [A("Send rate", "rate", ((v.u * v.opt) / 100) / HOUR, [`Recipients = ${c(v.u)} × ${v.opt}% = ${c((v.u * v.opt) / 100)}`, `÷ 3,600 s = ${R(((v.u * v.opt) / 100) / HOUR, "pushes")}`], { noun: "pushes", slips: [[24, "The window is one hour, not one day."]] })],
    hint: "Spread over 3,600 seconds, not 86,400.", tip: "Bursty jobs need queues and rate limits, not bigger servers.",
  })),
  T("t-ads", "traffic", 1, "Ad impressions", { pv: [1e8, 1e9, 5e9], ads: [2, 3, 5] }, (v) => ({
    q: `A news site gets ${c(v.pv)} page views a day with ${v.ads} ads per page. Ad impressions per second?`,
    answers: [A("Impressions", "rate", (v.pv * v.ads) / DAY, [`${c(v.pv)} × ${v.ads} = ${c(v.pv * v.ads)}/day`, `÷ 86,400 ≈ ${R((v.pv * v.ads) / DAY, "imps")}`], { noun: "imps" })],
    hint: "Page views × ads, then per second.", tip: "Each impression may trigger an auction. Ad tech runs at enormous QPS.",
  })),
  T("t-payments", "traffic", 2, "Payments in the busiest hour", { tx: [1e6, 1e7, 5e7], sh: [8, 10, 15] }, (v) => ({
    q: `A payment processor handles ${c(v.tx)} transactions a day, and ${v.sh}% of them land in the busiest hour. Peak TPS?`,
    answers: [A("Peak TPS", "rate", ((v.tx * v.sh) / 100) / HOUR, [`Busiest hour = ${c(v.tx)} × ${v.sh}% = ${c((v.tx * v.sh) / 100)}`, `÷ 3,600 ≈ ${R(((v.tx * v.sh) / 100) / HOUR, "tx")}`], { noun: "tx" })],
    hint: "Find the hour's volume first.", tip: "Black Friday can be 5–10× a normal peak hour.",
  })),
  T("t-likes", "traffic", 1, "Likes per second", { v: [1e9, 5e9, 1e10], r: [1, 2, 5] }, (v) => ({
    q: `Posts get ${c(v.v)} views a day, and ${v.r}% of views end in a like. Likes per second?`,
    answers: [A("Likes", "rate", (v.v * v.r) / 100 / DAY, [`${c(v.v)} × ${v.r}% = ${c((v.v * v.r) / 100)}/day`, `÷ 86,400 ≈ ${R((v.v * v.r) / 100 / DAY, "likes")}`], { noun: "likes" })],
    hint: "Fraction of views, per second.", tip: "Counters at this rate need sharding or batching.",
  })),
  T("t-logins", "traffic", 1, "Login rate", { mau: [1e7, 1e8, 5e8], k: [4, 10, 30] }, (v) => ({
    q: `${c(v.mau)} monthly users log in ${v.k} times a month on average. Logins per second?`,
    answers: [A("Logins", "rate", (v.mau * v.k) / MONTH, [`${c(v.mau * v.k)} per month ÷ 2.6M s ≈ ${R((v.mau * v.k) / MONTH, "logins")}`], { noun: "logins" })],
    hint: "A month is ~2.6M seconds.", tip: "Password hashing is deliberately slow, so logins are CPU-heavy.",
  })),
  T("t-retries", "traffic", 2, "Retry storms", { rps: [1e3, 1e4, 5e4], f: [1, 5, 10], k: [2, 3] }, (v) => ({
    q: `A service gets ${n(v.rps)} req/s. During an incident ${v.f}% of calls fail, and clients retry each failure ${v.k} times. Extra load from retries, and total load?`,
    answers: [
      A("Retry load", "rate", ((v.rps * v.f) / 100) * v.k, [`Failures = ${n(v.rps)} × ${v.f}% = ${n((v.rps * v.f) / 100)}/s`, `× ${v.k} retries = ${R(((v.rps * v.f) / 100) * v.k, "req")}`], { noun: "req" }),
      A("Total load", "rate", v.rps + ((v.rps * v.f) / 100) * v.k, [`${n(v.rps)} + ${n(((v.rps * v.f) / 100) * v.k)} = ${R(v.rps + ((v.rps * v.f) / 100) * v.k, "req")}`], { noun: "req" }),
    ],
    hint: "Failures × retries.", tip: "Use exponential backoff with jitter so retries don't make the outage worse.",
  })),
  T("t-cache-miss", "traffic", 1, "Cache misses → DB load", { rps: [1e4, 5e4, 2e5], h: [80, 90, 95, 99] }, (v) => ({
    q: `${n(v.rps)} req/s hit a cache with a ${v.h}% hit ratio. How many queries per second reach the database?`,
    answers: [A("DB QPS", "rate", v.rps * (1 - v.h / 100), [`Miss ratio = ${100 - v.h}%`, `${n(v.rps)} × ${100 - v.h}% = ${R(v.rps * (1 - v.h / 100), "queries")}`], { noun: "queries", slips: [[v.h / (100 - v.h), "Use the miss ratio, not the hit ratio."]] })],
    hint: "Only misses reach the database.", tip: "Going from 99% to 98% hit rate doubles database load.",
  })),
  T("t-cdn-assets", "traffic", 2, "Asset requests", { pv: [1e3, 5e3, 2e4], a: [20, 50, 80], bc: [50, 70, 90] }, (v) => ({
    q: `A site serves ${n(v.pv)} page views per second. Each page loads ${v.a} assets, and ${v.bc}% are already in the browser cache. Asset requests per second to the CDN?`,
    answers: [A("CDN requests", "rate", v.pv * v.a * (1 - v.bc / 100), [`Assets/s = ${n(v.pv)} × ${v.a} = ${c(v.pv * v.a)}`, `× ${100 - v.bc}% uncached = ${R(v.pv * v.a * (1 - v.bc / 100), "req")}`], { noun: "req" })],
    hint: "Views × assets × uncached fraction.", tip: "Long cache lifetimes on fingerprinted assets cut this sharply.",
  })),
  T("t-game-ticks", "traffic", 1, "Game server ticks", { p: [1e4, 1e5, 1e6], hz: [10, 20, 30, 60] }, (v) => ({
    q: `${c(v.p)} concurrent players each get state updates at ${v.hz} Hz. Updates per second across the fleet?`,
    answers: [A("Updates", "rate", v.p * v.hz, [`${c(v.p)} × ${v.hz} = ${R(v.p * v.hz, "updates")}`], { noun: "updates" })],
    hint: "Hz means per second.", tip: "Interest management (only nearby players) is how big games scale.",
  })),
  T("t-email", "traffic", 1, "Email sends", { u: [1e6, 1e7, 1e8], w: [1, 3, 7] }, (v) => ({
    q: `A newsletter platform sends ${v.w} email${v.w > 1 ? "s" : ""} a week to each of ${c(v.u)} subscribers. Average sends per second?`,
    answers: [A("Sends", "rate", (v.u * v.w) / (7 * DAY), [`Per week = ${c(v.u * v.w)}`, `Seconds/week ≈ 605K`, `÷ ≈ ${R((v.u * v.w) / (7 * DAY), "emails")}`], { noun: "emails", slips: [[7, "That's per week, not per day."]] })],
    hint: "A week is ~605K seconds.", tip: "Real sends are bursty: most go out at 8–9am local time.",
  })),
  T("t-driver-pings", "traffic", 1, "Driver location pings", { d: [1e5, 5e5, 1e6], every: [2, 4, 5, 10] }, (v) => ({
    q: `${c(v.d)} online drivers report GPS every ${v.every} s. Location writes per second?`,
    answers: [A("Writes", "rate", v.d / v.every, [`${c(v.d)} ÷ ${v.every} = ${R(v.d / v.every, "writes")}`], { noun: "writes" })],
    hint: "Drivers ÷ interval.", tip: "Keep the latest position in memory (e.g. Redis geo) and log history in batches.",
  })),

  /* ===================== WAREHOUSE WHARF (20) ===================== */
  T("s-media", "storage", 1, "Photo uploads", { dau: [1e6, 1e7, 5e7, 1e8], p: [1, 5, 10, 20], mb: [1, 2, 3, 5], y: [1, 3, 5] }, (v) => {
    const day = ((v.dau * v.p) / 100) * v.mb * 1e6;
    return {
      q: `${v.p}% of ${c(v.dau)} daily users upload one ${v.mb} MB photo a day. Storage per day, then the ${v.y}-year footprint with 3× replication?`,
      facts: F(["DAU", c(v.dau)], ["Uploaders", `${v.p}%`], ["Photo", `${v.mb} MB`], ["Years", v.y], ["Replicas", 3]),
      answers: [
        A("Per day", "bytes", day, [`Uploads = ${c(v.dau)} × ${v.p}% = ${c((v.dau * v.p) / 100)}`, `× ${v.mb} MB = ${B(day)}`]),
        A(`${v.y}-year footprint`, "bytes", day * 365 * v.y * 3, [`× 365 × ${v.y} = ${B(day * 365 * v.y)}`, `× 3 replicas = ${B(day * 365 * v.y * 3)}`], { slips: [SLIP.replicas(3), SLIP.year, [v.y, "Multiply by the number of years."]] }),
      ],
      hint: "Uploads × size, then × days × years × replicas.", tip: "Using ×400 instead of ×365 is fine for napkin math.",
    };
  }),
  T("s-messages", "storage", 2, "Chat history", { dau: [1e7, 1e8, 5e8], m: [20, 50, 100], b: [100, 200], meta: [50, 100], y: [2, 5] }, (v) => {
    const day = v.dau * v.m * (v.b + v.meta);
    return {
      q: `${c(v.dau)} DAU send ${v.m} messages a day. Each is ~${v.b} B of text plus ${v.meta} B of metadata. Storage per day, and over ${v.y} years?`,
      facts: F(["DAU", c(v.dau)], ["Msgs/user/day", v.m], ["Text", `${v.b} B`], ["Metadata", `${v.meta} B`], ["Years", v.y]),
      answers: [
        A("Per day", "bytes", day, [`Messages = ${c(v.dau * v.m)}/day`, `× ${v.b + v.meta} B = ${B(day)}`], { slips: [[(v.b + v.meta) / v.b, "Include the metadata bytes."]] }),
        A(`${v.y} years`, "bytes", day * 365 * v.y, [`× 365 × ${v.y} = ${B(day * 365 * v.y)}`], { slips: [SLIP.year] }),
      ],
      hint: "Metadata is often as big as the text.", tip: "Billions of small rows a day is what wide-column stores are built for.",
    };
  }),
  T("s-logs", "storage", 1, "Log retention", { sv: [200, 1000, 5000], l: [50, 200, 1000], b: [200, 500], d: [7, 30, 90], z: [5, 10] }, (v) => {
    const day = v.sv * v.l * v.b * DAY;
    return {
      q: `${n(v.sv)} servers each log ${v.l} lines/s at ${v.b} B per line. You keep ${v.d} days, compressed ${v.z}:1. Raw logs per day, and retained size?`,
      facts: F(["Servers", n(v.sv)], ["Lines/s", v.l], ["Bytes/line", v.b], ["Retention", `${v.d} d`], ["Compression", `${v.z}:1`]),
      answers: [
        A("Raw per day", "bytes", day, [`Fleet = ${B(v.sv * v.l * v.b)}/s`, `× 86,400 = ${B(day)}`]),
        A("Retained", "bytes", (day * v.d) / v.z, [`× ${v.d} days = ${B(day * v.d)}`, `÷ ${v.z} = ${B((day * v.d) / v.z)}`], { slips: [[v.z, "Apply compression."], [v.d, "Multiply by retention days."]] }),
      ],
      hint: "Bytes/s × 86,400, then × days ÷ compression.", tip: "Logs often outgrow the product data. Sample the noisy ones.",
    };
  }),
  T("s-shortener", "storage", 3, "URL shortener", { pm: [1e7, 1e8, 5e8], rec: [250, 500], y: [5, 10] }, (v) => {
    const k = v.pm * 12 * v.y;
    return {
      q: `A URL shortener creates ${c(v.pm)} links a month and keeps them ${v.y} years. Each record is ~${v.rec} B. Total storage, and the shortest base-62 key that fits them all?`,
      answers: [
        A("Storage", "bytes", k * v.rec, [`Links = ${c(v.pm)} × 12 × ${v.y} = ${c(k)}`, `× ${v.rec} B = ${B(k * v.rec)}`], { slips: [[12, "Months → years is ×12."]] }),
        A("Key length", "count", Math.ceil(Math.log(k) / Math.log(62)), [`62⁶ ≈ 57B, 62⁷ ≈ 3.5T`, `Need 62^k ≥ ${c(k)} → k = ${Math.ceil(Math.log(k) / Math.log(62))}`], { noun: "chars", integer: true }),
      ],
      hint: "62⁶ ≈ 57 billion.", tip: "Seven characters gives you trillions of keys.",
    };
  }),
  T("s-profiles", "storage", 1, "User profiles and avatars", { u: [1e7, 1e8, 1e9], kb: [1, 2, 5], av: [50, 80], akb: [100, 200, 500] }, (v) => ({
    q: `${c(v.u)} users each have a ${v.kb} KB profile row. ${v.av}% upload an avatar of ~${v.akb} KB. Size of profile data, and of avatars?`,
    answers: [
      A("Profiles", "bytes", v.u * v.kb * 1e3, [`${c(v.u)} × ${v.kb} KB = ${B(v.u * v.kb * 1e3)}`]),
      A("Avatars", "bytes", ((v.u * v.av) / 100) * v.akb * 1e3, [`${c(v.u)} × ${v.av}% × ${v.akb} KB = ${B(((v.u * v.av) / 100) * v.akb * 1e3)}`]),
    ],
    hint: "Rows are small. Images are big.", tip: "Put profiles in a database and avatars in object storage behind a CDN.",
  })),
  T("s-tsdb", "storage", 2, "Metrics time series", { ser: [1e5, 1e6, 1e7], iv: [10, 15, 60], b: [2, 16] }, (v) => ({
    q: `You track ${c(v.ser)} time series, sampled every ${v.iv} s, at ${v.b} bytes per point${v.b === 2 ? " (Gorilla-compressed)" : " (raw timestamp + value)"}. Storage per day?`,
    answers: [A("Per day", "bytes", v.ser * (DAY / v.iv) * v.b, [`Points/series/day = 86,400 ÷ ${v.iv} = ${n(DAY / v.iv)}`, `× ${c(v.ser)} × ${v.b} B = ${B(v.ser * (DAY / v.iv) * v.b)}`])],
    hint: "Points per day × series × bytes.", tip: "Series count (cardinality), not sample rate, is what kills a TSDB.",
  })),
  T("s-gps", "storage", 2, "GPS traces", { d: [1e5, 1e6], e: [4, 5], h: [8, 10], b: [50, 100] }, (v) => ({
    q: `${c(v.d)} drivers are online ${v.h} h a day, logging a ${v.b} B GPS point every ${v.e} s. Trace storage per day?`,
    answers: [A("Per day", "bytes", v.d * ((v.h * HOUR) / v.e) * v.b, [`Points/driver = ${v.h} × 3,600 ÷ ${v.e} = ${n((v.h * HOUR) / v.e)}`, `× ${c(v.d)} × ${v.b} B = ${B(v.d * ((v.h * HOUR) / v.e) * v.b)}`])],
    hint: "Only count online hours.", tip: "Keep the full trace cheaply in cold storage. Hot paths need only the latest point.",
  })),
  T("s-email", "storage", 2, "Mailboxes", { u: [1e7, 1e8, 1e9], e: [20, 40], kb: [50, 100], y: [1, 5] }, (v) => ({
    q: `${c(v.u)} users receive ${v.e} emails a day, averaging ${v.kb} KB. How much new mail storage over ${v.y} year${v.y > 1 ? "s" : ""}?`,
    answers: [A("Total", "bytes", v.u * v.e * v.kb * 1e3 * 365 * v.y, [`Per day = ${c(v.u * v.e)} × ${v.kb} KB = ${B(v.u * v.e * v.kb * 1e3)}`, `× 365 × ${v.y} = ${B(v.u * v.e * v.kb * 1e3 * 365 * v.y)}`], { slips: [SLIP.year] })],
    hint: "Per-day volume × days.", tip: "Deduplicating attachments saves a lot. Newsletters are the same file a million times.",
  })),
  T("s-renditions", "storage", 2, "Video renditions", { up: [1e5, 5e5, 1e6], min: [3, 5, 10], mbps: [5, 8, 12] }, (v) => ({
    q: `${c(v.up)} videos are uploaded daily, averaging ${v.min} minutes. You store several renditions whose bitrates add up to ${v.mbps} Mbps. New storage per day?`,
    answers: [A("Per day", "bytes", (v.up * v.min * 60 * v.mbps * 1e6) / 8, [`Bytes/video = ${v.min} × 60 s × ${v.mbps} Mbps ÷ 8 = ${B((v.min * 60 * v.mbps * 1e6) / 8)}`, `× ${c(v.up)} = ${B((v.up * v.min * 60 * v.mbps * 1e6) / 8)}`])],
    hint: "Seconds × total bitrate ÷ 8.", tip: "Renditions can take more space than the original upload.",
  })),
  T("s-index", "storage", 3, "Search inverted index", { d: [1e8, 1e9, 1e10], t: [100, 300, 1000], b: [4, 8] }, (v) => ({
    q: `A search engine indexes ${c(v.d)} documents with ~${v.t} unique terms each. A posting costs ${v.b} B. Index size?`,
    answers: [A("Index", "bytes", v.d * v.t * v.b, [`Postings = ${c(v.d)} × ${v.t} = ${c(v.d * v.t)}`, `× ${v.b} B = ${B(v.d * v.t * v.b)}`])],
    hint: "One posting per (document, term) pair.", tip: "Delta encoding brings postings down to 1–2 bytes.",
  })),
  T("s-rows-index", "storage", 1, "Table plus indexes", { r: [1e8, 1e9, 1e10], rb: [100, 200, 500], ix: [30, 50, 100] }, (v) => ({
    q: `A table has ${c(v.r)} rows of ${v.rb} B. Indexes add ${v.ix}% on top. Total size?`,
    answers: [A("Total", "bytes", v.r * v.rb * (1 + v.ix / 100), [`Data = ${c(v.r)} × ${v.rb} B = ${B(v.r * v.rb)}`, `× ${1 + v.ix / 100} = ${B(v.r * v.rb * (1 + v.ix / 100))}`], { slips: [[1 + v.ix / 100, "Add the index overhead."]] })],
    hint: "Data × (1 + index fraction).", tip: "Every index slows down writes as well as using disk.",
  })),
  T("s-backups", "storage", 2, "Backup retention", { tb: [5, 20, 50], ch: [2, 5, 10], d: [14, 28] }, (v) => {
    const fulls = v.d / 7, inc = v.d * v.tb * 1e12 * (v.ch / 100);
    return {
      q: `A ${v.tb} TB database gets a full backup weekly and incrementals daily (${v.ch}% of data changes per day). You keep ${v.d} days. Total backup storage?`,
      answers: [A("Backup storage", "bytes", fulls * v.tb * 1e12 + inc, [`Fulls kept = ${v.d} ÷ 7 = ${fulls} × ${v.tb} TB = ${B(fulls * v.tb * 1e12)}`, `Incrementals = ${v.d} × ${v.tb} TB × ${v.ch}% = ${B(inc)}`, `Total = ${B(fulls * v.tb * 1e12 + inc)}`])],
      hint: "Count the fulls you keep, then add the dailies.", tip: "Restore time matters more than backup size. Test your restores.",
    };
  }),
  T("s-thumbs", "storage", 1, "Originals and thumbnails", { p: [1e6, 1e7, 5e7], mb: [2, 3, 4], tk: [200, 300, 500] }, (v) => ({
    q: `${c(v.p)} photos are uploaded a day at ${v.mb} MB each. You also generate thumbnails totalling ${v.tk} KB per photo. Storage per day?`,
    answers: [A("Per day", "bytes", v.p * (v.mb * 1e6 + v.tk * 1e3), [`Per photo = ${v.mb} MB + ${v.tk} KB = ${B(v.mb * 1e6 + v.tk * 1e3)}`, `× ${c(v.p)} = ${B(v.p * (v.mb * 1e6 + v.tk * 1e3))}`])],
    hint: "Originals dominate.", tip: "Thumbnails are small but get most of the reads, so cache them hot.",
  })),
  T("s-tweets", "storage", 1, "A year of short posts", { t: [1e8, 5e8], b: [300, 500] }, (v) => ({
    q: `${c(v.t)} short posts are written per day at ~${v.b} B each (text + metadata). Storage per year?`,
    answers: [A("Per year", "bytes", v.t * v.b * 365, [`Per day = ${B(v.t * v.b)}`, `× 365 = ${B(v.t * v.b * 365)}`], { slips: [SLIP.year] })],
    hint: "Per-day bytes × 365.", tip: "Text is cheap. The media attached to it is not.",
  })),
  T("s-analytics", "storage", 2, "Analytics events", { e: [1e9, 1e10, 5e10], b: [200, 500, 1000], z: [5, 10] }, (v) => ({
    q: `A product logs ${c(v.e)} events a day at ${v.b} B each and stores them in a columnar format that compresses ${v.z}×. Storage per year?`,
    answers: [A("Per year", "bytes", (v.e * v.b * 365) / v.z, [`Raw/day = ${B(v.e * v.b)}`, `× 365 = ${B(v.e * v.b * 365)}`, `÷ ${v.z} = ${B((v.e * v.b * 365) / v.z)}`], { slips: [[v.z, "Apply compression."], SLIP.year] })],
    hint: "Raw per year ÷ compression.", tip: "Columnar formats like Parquet often reach 5–10× on event data.",
  })),
  T("s-sessions", "storage", 1, "Session store", { k: [1e6, 1e7, 5e7], kb: [1, 2, 4, 10] }, (v) => ({
    q: `At peak, ${c(v.k)} users are logged in and each session object is ${v.kb} KB. How much memory does the session store need?`,
    answers: [A("Memory", "bytes", v.k * v.kb * 1e3, [`${c(v.k)} × ${v.kb} KB = ${B(v.k * v.kb * 1e3)}`])],
    hint: "Concurrent sessions × size.", tip: "Small enough for one Redis node, but you'll still want a replica.",
  })),
  T("s-attachments", "storage", 1, "Chat attachments", { m: [1e8, 1e9], p: [1, 2, 5], mb: [0.5, 1, 2] }, (v) => ({
    q: `${c(v.m)} chat messages are sent a day. ${v.p}% carry an attachment averaging ${v.mb} MB. Attachment storage per day?`,
    answers: [A("Per day", "bytes", ((v.m * v.p) / 100) * v.mb * 1e6, [`Attachments = ${c(v.m)} × ${v.p}% = ${c((v.m * v.p) / 100)}`, `× ${v.mb} MB = ${B(((v.m * v.p) / 100) * v.mb * 1e6)}`])],
    hint: "A small percentage of a big number.", tip: "Attachments outweigh the message text many times over.",
  })),
  T("s-audit", "storage", 2, "Seven-year audit log", { a: [1e7, 1e8], kb: [0.5, 1, 2] }, (v) => ({
    q: `Regulation requires keeping every user action for 7 years. You log ${c(v.a)} actions a day at ${v.kb} KB each. Total storage?`,
    answers: [A("Total", "bytes", v.a * v.kb * 1e3 * 365 * 7, [`Per day = ${B(v.a * v.kb * 1e3)}`, `× 365 × 7 = ${B(v.a * v.kb * 1e3 * 365 * 7)}`], { slips: [[7, "Multiply by 7 years."], SLIP.year] })],
    hint: "Daily × 2,555 days.", tip: "Compliance data belongs in cheap, immutable cold storage.",
  })),
  T("s-tiles", "storage", 3, "Map tiles", { z: [12, 14, 16], kb: [10, 20, 30] }, (v) => ({
    q: `A web map has 4^z tiles at zoom level z. How many tiles are there at zoom ${v.z}, and how much storage at ${v.kb} KB per tile?`,
    answers: [
      A("Tiles", "count", 4 ** v.z, [`4^${v.z} = 2^${2 * v.z} ≈ ${c(4 ** v.z)}`], { noun: "tiles" }),
      A("Storage", "bytes", 4 ** v.z * v.kb * 1e3, [`${c(4 ** v.z)} × ${v.kb} KB = ${B(4 ** v.z * v.kb * 1e3)}`]),
    ],
    hint: "4^z = 2^(2z).", tip: "Most deep-zoom tiles are ocean. Render them on demand.",
  })),
  T("s-podcasts", "storage", 1, "Podcast catalog", { e: [1e5, 1e6, 5e6], m: [30, 45, 60], k: [64, 128] }, (v) => ({
    q: `A podcast app hosts ${c(v.e)} episodes averaging ${v.m} minutes at ${v.k} Kbps. Catalog size?`,
    answers: [A("Catalog", "bytes", (v.e * v.m * 60 * v.k * 1e3) / 8, [`Per episode = ${v.m} × 60 × ${v.k} Kbps ÷ 8 = ${B((v.m * 60 * v.k * 1e3) / 8)}`, `× ${c(v.e)} = ${B((v.e * v.m * 60 * v.k * 1e3) / 8)}`])],
    hint: "Seconds × bitrate ÷ 8.", tip: "128 Kbps audio is about 1 MB per minute.",
  })),

  /* ===================== BANDWIDTH BAY (16) ===================== */
  T("n-bandwidth", "network", 1, "Payload → bandwidth", { rps: [500, 5e3, 1e4, 5e4, 1e5], kb: [10, 50, 100, 200] }, (v) => ({
    q: `An API serves ${n(v.rps)} responses/s averaging ${v.kb} KB. Outbound bandwidth, and egress per day?`,
    answers: [
      A("Bandwidth", "bits", v.rps * v.kb * 8e3, [`Bytes/s = ${n(v.rps)} × ${v.kb} KB = ${B(v.rps * v.kb * 1e3)}/s`, `× 8 = ${BIT(v.rps * v.kb * 8e3)}`]),
      A("Egress per day", "bytes", v.rps * v.kb * 1e3 * DAY, [`× 86,400 = ${B(v.rps * v.kb * 1e3 * DAY)}`]),
    ],
    hint: "Bandwidth is in bits: × 8.", tip: "Bits for links, bytes for storage. The ×8 is the most common slip.",
  })),
  T("n-video", "network", 2, "Streaming via a CDN", { vw: [1e5, 1e6, 1e7], mbps: [1.5, 3, 5, 8], hit: [90, 95, 98] }, (v) => ({
    q: `${c(v.vw)} people stream at ${v.mbps} Mbps at peak. A CDN serves ${v.hit}% of bytes from its edge. Total egress, and what your origin serves?`,
    answers: [
      A("Total egress", "bits", v.vw * v.mbps * 1e6, [`${c(v.vw)} × ${v.mbps} Mbps = ${BIT(v.vw * v.mbps * 1e6)}`], { slips: [[8, "Bitrate is already in bits. No ×8 needed."]] }),
      A("Origin egress", "bits", v.vw * v.mbps * 1e6 * (1 - v.hit / 100), [`× ${100 - v.hit}% misses = ${BIT(v.vw * v.mbps * 1e6 * (1 - v.hit / 100))}`], { slips: [[v.hit / (100 - v.hit), "Use the miss ratio."]] }),
    ],
    hint: "Viewers × bitrate. The origin only serves misses.", tip: "At this scale video simply doesn't work without a CDN.",
  })),
  T("n-ingress", "network", 2, "Upload ingress", { up: [1e6, 1e7, 1e8], mb: [1, 3, 5], pk: [3, 5] }, (v) => {
    const avg = (v.up * v.mb * 8e6) / DAY;
    return {
      q: `${c(v.up)} uploads a day average ${v.mb} MB. Peak is ${v.pk}× average. Average and peak ingress bandwidth?`,
      answers: [
        A("Average", "bits", avg, [`Bytes/day = ${B(v.up * v.mb * 1e6)}`, `× 8 ÷ 86,400 = ${BIT(avg)}`]),
        A("Peak", "bits", avg * v.pk, [`× ${v.pk} = ${BIT(avg * v.pk)}`], { slips: [SLIP.peak(v.pk)] }),
      ],
      hint: "Daily bytes × 8 ÷ 86,400.", tip: "1 TB/day ≈ 93 Mbps.",
    };
  }),
  T("n-music", "network", 1, "Music streaming", { l: [1e5, 1e6, 5e6], k: [96, 160, 320] }, (v) => ({
    q: `${c(v.l)} listeners stream audio at ${v.k} Kbps at the same time. Total egress?`,
    answers: [A("Egress", "bits", v.l * v.k * 1e3, [`${c(v.l)} × ${v.k} Kbps = ${BIT(v.l * v.k * 1e3)}`])],
    hint: "Listeners × bitrate.", tip: "Audio is roughly 20× cheaper to stream than HD video.",
  })),
  T("n-sfu", "network", 3, "Video calls through an SFU", { m: [1e4, 5e4], p: [4, 6, 10], k: [500, 1000] }, (v) => ({
    q: `${c(v.m)} concurrent meetings, each with ${v.p} participants sending one ${v.k} Kbps stream. An SFU forwards every stream to the other participants. SFU ingress and egress?`,
    answers: [
      A("Ingress", "bits", v.m * v.p * v.k * 1e3, [`Streams in = ${c(v.m)} × ${v.p} = ${c(v.m * v.p)}`, `× ${v.k} Kbps = ${BIT(v.m * v.p * v.k * 1e3)}`]),
      A("Egress", "bits", v.m * v.p * (v.p - 1) * v.k * 1e3, [`Each participant receives ${v.p - 1} streams`, `${c(v.m)} × ${v.p} × ${v.p - 1} × ${v.k} Kbps = ${BIT(v.m * v.p * (v.p - 1) * v.k * 1e3)}`], { slips: [[v.p - 1, "Each participant receives (N − 1) streams."]] }),
    ],
    hint: "Egress grows with N × (N − 1).", tip: "Simulcast and showing only active speakers keep the N² growth in check.",
  })),
  T("n-cross-az", "network", 2, "Cross-AZ replication", { w: [50, 200, 500] }, (v) => ({
    q: `A database writes ${v.w} MB/s and synchronously copies every write to 2 replicas in other zones. Cross-zone bandwidth?`,
    answers: [A("Cross-zone", "bits", v.w * 1e6 * 8 * 2, [`Bytes/s = ${v.w} MB × 2 replicas = ${B(v.w * 2e6)}/s`, `× 8 = ${BIT(v.w * 1e6 * 8 * 2)}`], { slips: [[2, "Count both replicas."]] })],
    hint: "Writes × replicas × 8.", tip: "Clouds charge for cross-zone traffic. At scale, replication is a real cost.",
  })),
  T("n-backup-window", "network", 2, "Backup window", { tb: [10, 50, 100], h: [4, 8, 12] }, (v) => ({
    q: `A nightly backup must copy ${v.tb} TB within ${v.h} hours. What sustained bandwidth do you need?`,
    answers: [A("Bandwidth", "bits", (v.tb * 8e12) / (v.h * HOUR), [`Bits = ${v.tb} TB × 8 = ${c(v.tb * 8e12)}`, `÷ ${v.h} × 3,600 s = ${BIT((v.tb * 8e12) / (v.h * HOUR))}`])],
    hint: "Bits ÷ seconds in the window.", tip: "Incremental backups shrink this a lot. Avoid full copies.",
  })),
  T("n-page-weight", "network", 1, "Page weight", { pv: [1e7, 1e8, 1e9], mb: [1, 2, 3] }, (v) => ({
    q: `A site gets ${c(v.pv)} page views a day at ${v.mb} MB per page. Average outbound bandwidth?`,
    answers: [A("Bandwidth", "bits", (v.pv * v.mb * 8e6) / DAY, [`Bytes/day = ${B(v.pv * v.mb * 1e6)}`, `× 8 ÷ 86,400 = ${BIT((v.pv * v.mb * 8e6) / DAY)}`])],
    hint: "Daily bytes → bits per second.", tip: "Halving page weight halves this bill.",
  })),
  T("n-update-push", "network", 2, "OTA update rollout", { d: [1e6, 1e7, 1e8], mb: [50, 200, 500], h: [24, 48, 72] }, (v) => ({
    q: `You push a ${v.mb} MB update to ${c(v.d)} devices, spread evenly over ${v.h} hours. Average egress?`,
    answers: [A("Egress", "bits", (v.d * v.mb * 8e6) / (v.h * HOUR), [`Total = ${B(v.d * v.mb * 1e6)}`, `× 8 ÷ (${v.h} × 3,600) = ${BIT((v.d * v.mb * 8e6) / (v.h * HOUR))}`])],
    hint: "Total bits ÷ rollout seconds.", tip: "Staged rollouts spread the load and catch bad builds early.",
  })),
  T("n-heartbeat", "network", 1, "WebSocket heartbeats", { k: [1e6, 1e7, 5e7], b: [50, 100, 200], e: [15, 30, 60] }, (v) => ({
    q: `${c(v.k)} open WebSockets each send a ${v.b} B heartbeat every ${v.e} s. Bandwidth used by heartbeats?`,
    answers: [A("Bandwidth", "bits", (v.k / v.e) * v.b * 8, [`Heartbeats/s = ${c(v.k)} ÷ ${v.e} = ${c(v.k / v.e)}`, `× ${v.b} B × 8 = ${BIT((v.k / v.e) * v.b * 8)}`])],
    hint: "Messages/s × bytes × 8.", tip: "Bandwidth is small here. The real cost is per-connection memory.",
  })),
  T("n-egress-cost", "network", 2, "CDN egress bill", { tb: [50, 500, 2000], p: [0.02, 0.05, 0.08] }, (v) => ({
    q: `You serve ${n(v.tb)} TB a month at $${v.p} per GB. Monthly egress bill?`,
    answers: [A("Monthly bill", "count", v.tb * 1000 * v.p, [`${n(v.tb)} TB = ${n(v.tb * 1000)} GB`, `× $${v.p} = $${c(v.tb * 1000 * v.p)}`], { noun: "$", slips: [[1000, "Convert TB to GB (×1,000)."]] })],
    hint: "TB → GB, then × price.", tip: "Egress is often the biggest surprise on a cloud bill.",
  })),
  T("n-xregion-cost", "network", 2, "Cross-region replication bill", { g: [500, 5000, 2e4], p: [0.02] }, (v) => ({
    q: `You replicate ${n(v.g)} GB a day to another region at $${v.p}/GB. Monthly cost?`,
    answers: [A("Monthly cost", "count", v.g * 30 * v.p, [`Per month = ${n(v.g)} × 30 = ${n(v.g * 30)} GB`, `× $${v.p} = $${c(v.g * 30 * v.p)}`], { noun: "$", slips: [[30, "Per day vs per month."]] })],
    hint: "Daily GB × 30 × price.", tip: "Compress before sending to another region.",
  })),
  T("n-images", "network", 1, "Image serving", { rps: [1e3, 1e4, 5e4], kb: [100, 250, 500] }, (v) => ({
    q: `An image service handles ${n(v.rps)} req/s averaging ${v.kb} KB per image. Outbound bandwidth?`,
    answers: [A("Bandwidth", "bits", v.rps * v.kb * 8e3, [`${n(v.rps)} × ${v.kb} KB = ${B(v.rps * v.kb * 1e3)}/s`, `× 8 = ${BIT(v.rps * v.kb * 8e3)}`])],
    hint: "× 8 at the end.", tip: "WebP or AVIF can cut this by 30–50%.",
  })),
  T("n-log-ship", "network", 1, "Log shipping", { sv: [500, 2000, 1e4], kb: [10, 50, 200] }, (v) => ({
    q: `${n(v.sv)} servers each ship ${v.kb} KB/s of logs to a central cluster. Ingest bandwidth at the cluster?`,
    answers: [A("Ingest", "bits", v.sv * v.kb * 8e3, [`${n(v.sv)} × ${v.kb} KB/s = ${B(v.sv * v.kb * 1e3)}/s`, `× 8 = ${BIT(v.sv * v.kb * 8e3)}`])],
    hint: "Servers × rate × 8.", tip: "Compress at the agent. Logs shrink 5–10× on the wire.",
  })),
  T("n-nic", "network", 2, "NIC-bound throughput", { g: [10, 25, 100], kb: [10, 50, 200] }, (v) => ({
    q: `A server has a ${v.g} Gbps NIC that you run at 70% max. Responses are ${v.kb} KB. How many responses per second before the NIC is the bottleneck?`,
    answers: [A("Max responses", "rate", ((v.g * 1e9) / 8) * 0.7 / (v.kb * 1e3), [`Usable = ${v.g} Gbps × 70% ÷ 8 = ${B(((v.g * 1e9) / 8) * 0.7)}/s`, `÷ ${v.kb} KB = ${R(((v.g * 1e9) / 8) * 0.7 / (v.kb * 1e3), "req")}`], { noun: "req" })],
    hint: "Usable bytes/s ÷ payload.", tip: "Large payloads hit the NIC limit long before the CPU is busy.",
  })),
  T("n-ws-msgs", "network", 2, "Realtime message fan-in", { u: [1e6, 1e7], m: [1, 6, 30], b: [200, 500] }, (v) => ({
    q: `${c(v.u)} connected users each send ${v.m} realtime messages per minute, ${v.b} B each. Inbound bandwidth?`,
    answers: [A("Inbound", "bits", ((v.u * v.m) / 60) * v.b * 8, [`Msgs/s = ${c(v.u)} × ${v.m} ÷ 60 = ${c((v.u * v.m) / 60)}`, `× ${v.b} B × 8 = ${BIT(((v.u * v.m) / 60) * v.b * 8)}`], { slips: [[60, "Per minute → per second is ÷60."]] })],
    hint: "Per minute ÷ 60.", tip: "Small messages at huge rates are limited by packets per second, not bandwidth.",
  })),

  /* ===================== LATENCY LAGOON (14) ===================== */
  T("l-budget", "latency", 1, "Split a latency budget", { t: [300, 500, 800, 1000], e: [20, 40, 60], d: [50, 100, 150], buf: [30, 50, 80], k: [3, 4, 5, 6] }, (v) => ({
    q: `A request has a ${v.t} ms p95 budget and passes through ${v.k} services in sequence. Edge costs ${v.e} ms, data access ${v.d} ms, and you keep a ${v.buf} ms buffer. What's each service's equal share?`,
    facts: F(["Budget", `${v.t} ms`], ["Edge", `${v.e} ms`], ["Data", `${v.d} ms`], ["Buffer", `${v.buf} ms`], ["Services", v.k]),
    answers: [A("Per service", "time", (v.t - v.e - v.d - v.buf) / v.k, [`Left = ${v.t} − ${v.e} − ${v.d} − ${v.buf} = ${v.t - v.e - v.d - v.buf} ms`, `÷ ${v.k} = ${TM((v.t - v.e - v.d - v.buf) / v.k)}`], { slips: [[v.k, "Divide by the number of services."]] })],
    hint: "Subtract the fixed costs, then divide.", tip: "Cutting a hop usually saves more than tuning code.",
  })),
  T("l-serial-parallel", "latency", 1, "Sequential vs parallel", { own: [5, 10, 20], a: [20, 40, 60], b: [30, 80, 120], cc: [10, 50, 90] }, (v) => ({
    q: `A handler does ${v.own} ms of its own work and calls three services taking ${v.a}, ${v.b} and ${v.cc} ms. Response time if the calls run sequentially, and if they run in parallel?`,
    answers: [
      A("Sequential", "time", v.own + v.a + v.b + v.cc, [`${v.own} + ${v.a} + ${v.b} + ${v.cc} = ${v.own + v.a + v.b + v.cc} ms`]),
      A("Parallel", "time", v.own + Math.max(v.a, v.b, v.cc), [`Wait for the slowest: ${Math.max(v.a, v.b, v.cc)} ms`, `${v.own} + ${Math.max(v.a, v.b, v.cc)} = ${v.own + Math.max(v.a, v.b, v.cc)} ms`]),
    ],
    hint: "Sequential adds. Parallel takes the max.", tip: "In parallel, your latency is the slowest call's tail latency.",
  })),
  T("l-littles", "latency", 2, "Little's law", { rps: [2e3, 1e4, 5e4], lat: [50, 100, 200, 400], th: [100, 200, 500] }, (v) => ({
    q: `${n(v.rps)} req/s at ${v.lat} ms average latency. Each server holds ${v.th} requests in flight. Concurrent requests, and servers needed?`,
    answers: [
      A("In flight", "count", (v.rps * v.lat) / 1000, [`L = λ × W = ${n(v.rps)} × ${v.lat / 1000} s = ${n((v.rps * v.lat) / 1000)}`], { noun: "requests", slips: [[1000, "Convert ms to seconds first."]] }),
      A("Servers", "count", Math.ceil((v.rps * v.lat) / 1000 / v.th), [`${n((v.rps * v.lat) / 1000)} ÷ ${v.th} → ${Math.ceil((v.rps * v.lat) / 1000 / v.th)}`], { noun: "servers", integer: true }),
    ],
    hint: "Concurrency = rate × time.", tip: "When latency doubles, the concurrency you need doubles too.",
  })),
  T("l-handshakes", "latency", 2, "Handshake round trips", { rtt: [20, 50, 80, 150] }, (v) => ({
    q: `RTT to the server is ${v.rtt} ms. A cold HTTPS request needs TCP (1 RTT) + TLS 1.2 (2 RTT) + the request (1 RTT). A warm, reused connection needs 1 RTT. Time for cold and warm?`,
    answers: [
      A("Cold", "time", 4 * v.rtt, [`1 + 2 + 1 = 4 RTT × ${v.rtt} = ${4 * v.rtt} ms`]),
      A("Warm", "time", v.rtt, [`1 RTT = ${v.rtt} ms`]),
    ],
    hint: "Count round trips, then multiply.", tip: "Connection reuse, TLS 1.3 and edge termination all cut round trips.",
  })),
  T("l-read-gb", "latency", 1, "RAM vs SSD read time", { gb: [1, 10, 100] }, (v) => ({
    q: `How long does it take to read ${v.gb} GB sequentially from RAM (~10 GB/s), and from an SSD (~1 GB/s)?`,
    answers: [
      A("From RAM", "time", (v.gb / 10) * 1000, [`${v.gb} GB ÷ 10 GB/s = ${s(v.gb / 10)} s`]),
      A("From SSD", "time", v.gb * 1000, [`${v.gb} GB ÷ 1 GB/s = ${v.gb} s`]),
    ],
    hint: "Size ÷ throughput.", tip: "Sequential reads are fast everywhere. Random reads are where the gap opens up.",
  })),
  T("l-tail", "latency", 3, "Tail at scale", { k: [10, 50, 100, 500] }, (v) => ({
    q: `A request fans out to ${v.k} servers and waits for all of them. Each server is slow (above its p99) 1% of the time, independently. What percent of requests hit at least one slow server?`,
    answers: [A("Slow requests", "count", 100 * (1 - 0.99 ** v.k), [`P(all fast) = 0.99^${v.k} ≈ ${s(0.99 ** v.k)}`, `P(≥1 slow) = 1 − ${s(0.99 ** v.k)} ≈ ${s(100 * (1 - 0.99 ** v.k))}%`], { noun: "%" })],
    hint: "Find P(all fast) and take the complement.", tip: "With 100-way fan-out, about 63% of requests see someone's p99. Hedged requests help.",
  })),
  T("l-retries", "latency", 2, "Worst-case retry time", { to: [100, 500, 1000], k: [2, 3], b: [50, 100] }, (v) => {
    const backoff = Array.from({ length: v.k }, (_, i) => v.b * 2 ** i).reduce((a, x) => a + x, 0);
    return {
      q: `A client has a ${v.to} ms timeout and retries up to ${v.k} times, with exponential backoff starting at ${v.b} ms (doubling). Worst-case time before it gives up?`,
      answers: [A("Worst case", "time", (v.k + 1) * v.to + backoff, [`Attempts = ${v.k + 1} × ${v.to} ms = ${(v.k + 1) * v.to} ms`, `Backoff = ${Array.from({ length: v.k }, (_, i) => v.b * 2 ** i).join(" + ")} = ${backoff} ms`, `Total = ${(v.k + 1) * v.to + backoff} ms`])],
      hint: "Count attempts (retries + 1) plus the waits between them.", tip: "Make sure retries fit inside the caller's own deadline.",
    };
  }),
  T("l-queue", "latency", 3, "Queueing delay (M/M/1)", { sv: [5, 10, 20], u: [50, 70, 80, 90] }, (v) => ({
    q: `A server takes ${v.sv} ms per request and runs at ${v.u}% utilisation. Using M/M/1, what's the average time a request spends in the system (wait + service)?`,
    answers: [A("Time in system", "time", v.sv / (1 - v.u / 100), [`W = S ÷ (1 − ρ) = ${v.sv} ÷ (1 − ${v.u / 100})`, `= ${s(v.sv / (1 - v.u / 100))} ms`])],
    hint: "W = S / (1 − ρ).", tip: "Past ~80% utilisation, latency shoots up. Leave headroom.",
  })),
  T("l-batch", "latency", 2, "Batch job duration", { k: [1e5, 1e6, 1e7], b: [100, 500, 1000], ms: [20, 50, 100] }, (v) => ({
    q: `You need to process ${c(v.k)} items in batches of ${v.b}. Each batch takes ${v.ms} ms, run one at a time. Total time?`,
    answers: [A("Total", "time", (v.k / v.b) * v.ms, [`Batches = ${c(v.k)} ÷ ${v.b} = ${n(v.k / v.b)}`, `× ${v.ms} ms = ${TM((v.k / v.b) * v.ms)}`])],
    hint: "Number of batches × time per batch.", tip: "Bigger batches amortise fixed costs until memory or latency limits kick in.",
  })),
  T("l-light", "latency", 1, "Speed of light in fiber", { km: [1000, 4000, 8000, 12000] }, (v) => ({
    q: `Two data centers are ${n(v.km)} km apart. Light in fiber travels ~200,000 km/s. What's the minimum round-trip time?`,
    answers: [A("RTT", "time", ((2 * v.km) / 2e5) * 1000, [`Round trip = 2 × ${n(v.km)} = ${n(2 * v.km)} km`, `÷ 200,000 km/s = ${s(((2 * v.km) / 2e5) * 1000)} ms`], { slips: [[2, "Round trip means there and back."]] })],
    hint: "About 1 ms of RTT per 100 km.", tip: "No optimisation beats physics. Put data near users.",
  })),
  T("l-n-plus-1", "latency", 1, "N+1 queries", { k: [20, 50, 100], q: [2, 5, 10] }, (v) => ({
    q: `A page lists ${v.k} items: one query for the list, then one query per item, each ${v.q} ms, run sequentially. Total DB time? And if you batch it into 2 queries?`,
    answers: [
      A("N+1", "time", (v.k + 1) * v.q, [`${v.k + 1} queries × ${v.q} ms = ${(v.k + 1) * v.q} ms`]),
      A("Batched", "time", 2 * v.q, [`2 × ${v.q} = ${2 * v.q} ms`]),
    ],
    hint: "Count the queries.", tip: "N+1 is one of the most common performance bugs in ORM-based code.",
  })),
  T("l-cache-expect", "latency", 1, "Expected latency with a cache", { h: [80, 90, 95, 99], hm: [1, 2], mm: [50, 100, 200] }, (v) => ({
    q: `Cache hits take ${v.hm} ms and misses take ${v.mm} ms. With a ${v.h}% hit ratio, what's the average latency?`,
    answers: [A("Average", "time", (v.h / 100) * v.hm + (1 - v.h / 100) * v.mm, [`${v.h}% × ${v.hm} + ${100 - v.h}% × ${v.mm}`, `= ${s((v.h / 100) * v.hm)} + ${s((1 - v.h / 100) * v.mm)} = ${s((v.h / 100) * v.hm + (1 - v.h / 100) * v.mm)} ms`])],
    hint: "Weighted average.", tip: "Misses dominate the average even when they're rare.",
  })),
  T("l-scan", "latency", 2, "Full table scan", { r: [1e8, 1e9, 1e10], b: [100, 200], mbs: [500, 1000, 2000] }, (v) => ({
    q: `A full scan reads ${c(v.r)} rows of ${v.b} B at ${n(v.mbs)} MB/s. How long does it take?`,
    answers: [A("Scan time", "time", ((v.r * v.b) / (v.mbs * 1e6)) * 1000, [`Size = ${B(v.r * v.b)}`, `÷ ${n(v.mbs)} MB/s = ${s((v.r * v.b) / (v.mbs * 1e6))} s ≈ ${TM(((v.r * v.b) / (v.mbs * 1e6)) * 1000)}`])],
    hint: "Bytes ÷ throughput.", tip: "This is why OLTP queries need indexes and analytics uses columnar storage.",
  })),
  T("l-drain", "latency", 3, "Draining a backlog", { bl: [1e6, 1e7], cn: [10, 50], pr: [100, 500, 1000] }, (v) => {
    const capacity = v.cn * v.pr, arrive = capacity / 2;
    return {
      q: `A queue has a backlog of ${c(v.bl)} messages. ${v.cn} consumers each process ${v.pr} msg/s, and new messages keep arriving at ${n(arrive)} msg/s. How long until the backlog is gone?`,
      answers: [A("Drain time", "time", (v.bl / (capacity - arrive)) * 1000, [`Capacity = ${v.cn} × ${v.pr} = ${n(capacity)}/s`, `Net drain = ${n(capacity)} − ${n(arrive)} = ${n(capacity - arrive)}/s`, `${c(v.bl)} ÷ ${n(capacity - arrive)} = ${s(v.bl / (capacity - arrive))} s`], { slips: [[2, "Subtract the arrival rate from capacity."]] })],
      hint: "Only spare capacity drains the backlog.", tip: "Keep headroom so you can recover from a backlog quickly.",
    };
  }),

  /* ===================== SERVER SUMMIT (16) ===================== */
  T("k-cache", "capacity", 2, "Size a cache cluster", { it: [1e7, 1e8, 5e8], hot: [10, 20], kb: [1, 2, 5], ov: [25, 50], node: [32, 64], use: [70, 80] }, (v) => {
    const bytes = v.it * (v.hot / 100) * v.kb * 1e3 * (1 + v.ov / 100);
    const nodes = Math.max(1, Math.ceil(bytes / (v.node * 1e9 * (v.use / 100))));
    return {
      q: `Cache the hottest ${v.hot}% of ${c(v.it)} objects (${v.kb} KB each, +${v.ov}% overhead). Nodes have ${v.node} GB RAM, filled to ${v.use}%. Cache memory, and node count?`,
      facts: F(["Objects", c(v.it)], ["Hot", `${v.hot}%`], ["Size", `${v.kb} KB`], ["Overhead", `${v.ov}%`], ["Node", `${v.node} GB`], ["Fill", `${v.use}%`]),
      answers: [
        A("Memory", "bytes", bytes, [`Hot = ${c((v.it * v.hot) / 100)} × ${v.kb} KB = ${B(v.it * (v.hot / 100) * v.kb * 1e3)}`, `× ${1 + v.ov / 100} = ${B(bytes)}`], { slips: [[1 + v.ov / 100, "Include the overhead."]] }),
        A("Nodes", "count", nodes, [`Usable/node = ${s((v.node * v.use) / 100)} GB`, `${B(bytes)} ÷ ${s((v.node * v.use) / 100)} GB → ${nodes}`], { noun: "nodes", integer: true }),
      ],
      hint: "Hot set × size × overhead ÷ usable RAM.", tip: "Access is usually skewed: ~20% of keys serve ~80% of reads.",
    };
  }),
  T("k-servers", "capacity", 1, "App server count", { dau: [1e6, 1e7, 5e7], per: [20, 50, 100], pk: [2, 3], cap: [1e3, 2e3, 5e3], u: [50, 70] }, (v) => {
    const peak = ((v.dau * v.per) / DAY) * v.pk;
    return {
      q: `${c(v.dau)} DAU × ${v.per} requests a day, peak ${v.pk}× average. A server handles ${n(v.cap)} req/s and you run them at ${v.u}%. Peak RPS, and servers?`,
      answers: [
        A("Peak RPS", "rate", peak, [`Avg = ${s(peak / v.pk)}/s`, `× ${v.pk} = ${R(peak, "req")}`], { noun: "req", slips: [SLIP.peak(v.pk)] }),
        A("Servers", "count", Math.max(1, Math.ceil(peak / ((v.cap * v.u) / 100))), [`Usable = ${n((v.cap * v.u) / 100)}/s per server`, `${s(peak)} ÷ ${n((v.cap * v.u) / 100)} → ${Math.max(1, Math.ceil(peak / ((v.cap * v.u) / 100)))}`], { noun: "servers", integer: true, slips: [[100 / v.u, "Account for target utilisation."]] }),
      ],
      hint: "Peak ÷ (capacity × utilisation).", tip: "Add N+1 (or N+2 across zones) for failure tolerance.",
    };
  }),
  T("k-shards", "capacity", 3, "Database shards", { tb: [20, 100, 500], st: [1, 2, 4], w: [2e4, 1e5, 2e5], sw: [2e3, 5e3, 1e4] }, (v) => {
    const a = Math.ceil(v.tb / v.st), b = Math.ceil(v.w / v.sw);
    return {
      q: `A table holds ${v.tb} TB and takes ${c(v.w)} writes/s at peak. Each shard should stay under ${v.st} TB and ${n(v.sw)} writes/s. Shards for storage, for writes, and how many to provision?`,
      answers: [
        A("For storage", "count", a, [`${v.tb} ÷ ${v.st} = ${a}`], { noun: "shards", integer: true }),
        A("For writes", "count", b, [`${c(v.w)} ÷ ${n(v.sw)} = ${b}`], { noun: "shards", integer: true }),
        A("Provision", "count", Math.max(a, b), [`max(${a}, ${b}) = ${Math.max(a, b)}`], { noun: "shards", integer: true }),
      ],
      hint: "Work out each constraint. The bigger number wins.", tip: "Check both size and throughput. Either can be the limit.",
    };
  }),
  T("k-kafka", "capacity", 2, "Kafka partitions and retention", { m: [1e4, 1e5, 5e5], pc: [1e3, 5e3, 1e4], b: [500, 1000], h: [24, 72, 168] }, (v) => ({
    q: `A topic receives ${c(v.m)} msg/s of ${v.b} B. One consumer handles ${n(v.pc)} msg/s per partition. You keep ${v.h} h with 3× replication. Partitions needed, and storage?`,
    answers: [
      A("Partitions", "count", Math.ceil(v.m / v.pc), [`${c(v.m)} ÷ ${n(v.pc)} → ${Math.ceil(v.m / v.pc)}`], { noun: "partitions", integer: true }),
      A("Storage", "bytes", v.m * v.b * v.h * HOUR * 3, [`Bytes/s = ${B(v.m * v.b)}`, `× ${v.h} h × 3,600 × 3 = ${B(v.m * v.b * v.h * HOUR * 3)}`], { slips: [SLIP.replicas(3)] }),
    ],
    hint: "Partitions cap consumer parallelism.", tip: "Over-provision partitions. Adding them later reshuffles keys.",
  })),
  T("k-websockets", "capacity", 1, "WebSocket gateways", { k: [1e6, 1e7, 5e7], per: [5e4, 1e5, 2.5e5] }, (v) => ({
    q: `You need ${c(v.k)} concurrent WebSocket connections. Each gateway holds ${c(v.per)}. How many gateways?`,
    answers: [A("Gateways", "count", Math.ceil(v.k / v.per), [`${c(v.k)} ÷ ${c(v.per)} → ${Math.ceil(v.k / v.per)}`], { noun: "servers", integer: true })],
    hint: "Connections ÷ per-server capacity.", tip: "Memory per connection (often 10–50 KB) is the real limit.",
  })),
  T("k-replicas", "capacity", 1, "Read replicas", { q: [5e4, 2e5, 1e6], per: [5e3, 1e4, 2e4] }, (v) => ({
    q: `Reads peak at ${c(v.q)} QPS. Each replica handles ${n(v.per)} QPS. How many read replicas?`,
    answers: [A("Replicas", "count", Math.ceil(v.q / v.per), [`${c(v.q)} ÷ ${n(v.per)} → ${Math.ceil(v.q / v.per)}`], { noun: "replicas", integer: true })],
    hint: "Divide and round up.", tip: "Past ~10 replicas, a cache is usually cheaper.",
  })),
  T("k-workers", "capacity", 2, "Background workers", { j: [100, 500, 2000], sec: [2, 5, 30], cc: [4, 8, 16] }, (v) => ({
    q: `Jobs arrive at ${n(v.j)}/s and take ${v.sec} s each. A worker runs ${v.cc} jobs at once. How many workers keep up?`,
    answers: [A("Workers", "count", Math.ceil((v.j * v.sec) / v.cc), [`In flight = ${n(v.j)} × ${v.sec} = ${n(v.j * v.sec)} (Little's law)`, `÷ ${v.cc} → ${Math.ceil((v.j * v.sec) / v.cc)}`], { noun: "workers", integer: true })],
    hint: "Little's law, then divide by concurrency.", tip: "Autoscale on queue depth, not CPU.",
  })),
  T("k-gpus", "capacity", 2, "Inference GPUs", { r: [100, 500, 2000], per: [5, 10, 25], hr: [30, 50] }, (v) => ({
    q: `A model serves ${n(v.r)} req/s at peak. One GPU handles ${v.per} req/s, and you want ${v.hr}% headroom. How many GPUs?`,
    answers: [A("GPUs", "count", Math.ceil((v.r / v.per) * (1 + v.hr / 100)), [`Base = ${n(v.r)} ÷ ${v.per} = ${s(v.r / v.per)}`, `× ${1 + v.hr / 100} → ${Math.ceil((v.r / v.per) * (1 + v.hr / 100))}`], { noun: "GPUs", integer: true })],
    hint: "Base count × (1 + headroom).", tip: "Batching requests can multiply per-GPU throughput.",
  })),
  T("k-disks", "capacity", 1, "Disks for a storage cluster", { tb: [500, 2000, 1e4], d: [8, 16, 20] }, (v) => ({
    q: `You need to store ${n(v.tb)} TB with 3× replication on ${v.d} TB drives. How many drives?`,
    answers: [A("Drives", "count", Math.ceil((v.tb * 3) / v.d), [`Raw = ${n(v.tb)} × 3 = ${n(v.tb * 3)} TB`, `÷ ${v.d} TB → ${Math.ceil((v.tb * 3) / v.d)}`], { noun: "drives", integer: true, slips: [SLIP.replicas(3)] })],
    hint: "Replicated size ÷ drive size.", tip: "Leave 20–30% free so rebuilds have room.",
  })),
  T("k-racks", "capacity", 1, "Racks", { sv: [200, 1000, 5000], per: [20, 40] }, (v) => ({
    q: `You're deploying ${n(v.sv)} servers at ${v.per} per rack. How many racks?`,
    answers: [A("Racks", "count", Math.ceil(v.sv / v.per), [`${n(v.sv)} ÷ ${v.per} → ${Math.ceil(v.sv / v.per)}`], { noun: "racks", integer: true })],
    hint: "Divide and round up.", tip: "Power per rack often limits you before physical space does.",
  })),
  T("k-cloud-cost", "capacity", 1, "Monthly compute bill", { sv: [50, 200, 1000], p: [0.1, 0.5, 2] }, (v) => ({
    q: `You run ${n(v.sv)} instances at $${v.p}/hour around the clock. Monthly bill? (A month ≈ 730 hours.)`,
    answers: [A("Monthly bill", "count", v.sv * v.p * 730, [`${n(v.sv)} × $${v.p} × 730 h = $${c(v.sv * v.p * 730)}`], { noun: "$", slips: [[730, "Multiply by ~730 hours per month."]] })],
    hint: "Instances × rate × 730.", tip: "Reserved or committed-use pricing often saves 30–60%.",
  })),
  T("k-redis", "capacity", 1, "Redis nodes for throughput", { ops: [5e5, 2e6, 1e7], per: [1e5, 2e5] }, (v) => ({
    q: `Your cache must serve ${c(v.ops)} ops/s. A single Redis node handles ~${c(v.per)} ops/s. How many primaries?`,
    answers: [A("Nodes", "count", Math.ceil(v.ops / v.per), [`${c(v.ops)} ÷ ${c(v.per)} → ${Math.ceil(v.ops / v.per)}`], { noun: "nodes", integer: true })],
    hint: "Throughput ÷ per-node ops.", tip: "Hot keys can overload one shard even when the cluster average looks fine.",
  })),
  T("k-rate-limit", "capacity", 2, "Rate limiter memory", { u: [1e7, 1e8], k: [1, 3], b: [50, 100] }, (v) => ({
    q: `A rate limiter keeps ${v.k} counter${v.k > 1 ? "s" : ""} per user for ${c(v.u)} active users. Each entry (key + count + TTL) is ${v.b} B. Memory?`,
    answers: [A("Memory", "bytes", v.u * v.k * v.b, [`${c(v.u)} × ${v.k} × ${v.b} B = ${B(v.u * v.k * v.b)}`])],
    hint: "Users × counters × bytes.", tip: "Sliding-window logs use far more memory than fixed-window counters.",
  })),
  T("k-es-shards", "capacity", 1, "Search shards", { tb: [1, 5, 20], gb: [30, 50] }, (v) => ({
    q: `A search index is ${v.tb} TB. You target ${v.gb} GB per shard. How many primary shards?`,
    answers: [A("Shards", "count", Math.ceil((v.tb * 1000) / v.gb), [`${v.tb} TB = ${n(v.tb * 1000)} GB`, `÷ ${v.gb} → ${Math.ceil((v.tb * 1000) / v.gb)}`], { noun: "shards", integer: true, slips: [[1000, "TB → GB is ×1,000."]] })],
    hint: "Convert to GB first.", tip: "Too many small shards waste heap. Too few big ones recover slowly.",
  })),
  T("k-bloom", "capacity", 2, "Bloom filter size", { k: [1e8, 1e9, 1e10] }, (v) => ({
    q: `A Bloom filter for ${c(v.k)} items at a 1% false-positive rate needs ~10 bits per item. How much memory?`,
    answers: [A("Memory", "bytes", (v.k * 10) / 8, [`Bits = ${c(v.k)} × 10 = ${c(v.k * 10)}`, `÷ 8 = ${B((v.k * 10) / 8)}`])],
    hint: "Bits ÷ 8.", tip: "Every 10× drop in false positives costs about 4.8 more bits per item.",
  })),
  T("k-conn-pool", "capacity", 1, "Database connections", { sv: [50, 200, 500], p: [10, 20, 50] }, (v) => ({
    q: `${n(v.sv)} app servers each keep a pool of ${v.p} DB connections. How many connections does the database see?`,
    answers: [A("Connections", "count", v.sv * v.p, [`${n(v.sv)} × ${v.p} = ${n(v.sv * v.p)}`], { noun: "connections" })],
    hint: "Servers × pool size.", tip: "Postgres struggles beyond a few thousand connections. Use a pooler like PgBouncer.",
  })),
];
