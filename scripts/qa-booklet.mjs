/**
 * Visual QA for the booklet: renders every page to a PNG at exact page size so
 * clipping, missing logos and stray controls can be inspected directly.
 *
 * Usage: node scripts/qa-booklet.mjs --slugs abbot-kinney,montana --dir ./tmp/qa
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  gotoPlaybookPage,
  gotoStreetMapCapture,
  installBrandfetchRetries,
  isStreetMapCapture,
  PAGE_HEIGHT_PX,
  PAGE_WIDTH_PX,
  playbookUrl,
  readPlaybookManifest,
  restorePlaybookViewport,
  waitForPageReady,
  waitForStreetMapReady,
  WEBGL_ARGS,
} from "./export-booklet.mjs";

const ACCESS_SESSION_KEY = "high-streets-access";

function parseArgs(argv) {
  const args = {
    slugs: [],
    baseUrl: "http://localhost:5173",
    dir: "./tmp/qa",
    scale: 1,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--slugs") {
      args.slugs = (argv[++i] ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean);
    } else if (arg === "--base-url") {
      args.baseUrl = argv[++i] ?? args.baseUrl;
    } else if (arg === "--dir") {
      args.dir = argv[++i] ?? args.dir;
    } else if (arg === "--scale") {
      args.scale = Number(argv[++i] ?? 1) || 1;
    } else if (arg === "--pages") {
      // Render a subset by page index, e.g. --pages 0,6
      args.pages = new Set(
        (argv[++i] ?? "")
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value))
      );
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.slugs.length) {
  process.stderr.write(
    "Usage: node scripts/qa-booklet.mjs --slugs slug-a,slug-b [--dir ./tmp/qa]\n"
  );
  process.exit(1);
}

await fs.mkdir(path.resolve(args.dir), { recursive: true });

const browser = await chromium.launch({ args: WEBGL_ARGS });
const context = await browser.newContext({
  viewport: { width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX },
  deviceScaleFactor: args.scale,
});

await context.addInitScript(
  ([key]) => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  },
  [ACCESS_SESSION_KEY]
);

await installBrandfetchRetries(context);

const page = await context.newPage();
page.on("pageerror", (error) =>
  process.stdout.write(`PAGE ERROR: ${error.message}\n`)
);

await page.goto(playbookUrl(args.baseUrl, args.slugs, 0), {
  waitUntil: "domcontentloaded",
});

const manifest = await readPlaybookManifest(page);
if (!manifest?.pages?.length) {
  process.stderr.write("The playbook route produced no pages.\n");
  await browser.close();
  process.exit(1);
}

let previousSpec = null;
let failures = 0;

for (const spec of manifest.pages) {
  if (args.pages && !args.pages.has(spec.index)) continue;

  let note = "";
  try {
    if (isStreetMapCapture(spec)) {
      await gotoStreetMapCapture(page, args.baseUrl, spec.slug);
      await waitForStreetMapReady(page, spec.slug);
    } else {
      if (previousSpec && isStreetMapCapture(previousSpec)) {
        await restorePlaybookViewport(page);
      }
      if (spec.index > 0) {
        await gotoPlaybookPage(
          page,
          args.baseUrl,
          args.slugs,
          spec,
          previousSpec
        );
      }
      await waitForPageReady(page, spec);
    }
  } catch (error) {
    failures += 1;
    note = `  ⚠️  ${error.message}`;
  }
  previousSpec = spec;

  const name = `${String(spec.index).padStart(2, "0")}-${spec.kind}${
    spec.slug ? `-${spec.slug}` : ""
  }.png`;
  await page.screenshot({
    path: path.join(path.resolve(args.dir), name),
    type: "png",
  });
  process.stdout.write(`${name}${note}\n`);
}

await context.close();
await browser.close();

if (failures > 0) {
  process.stderr.write(`${failures} page(s) never reached the ready state.\n`);
  process.exit(1);
}
