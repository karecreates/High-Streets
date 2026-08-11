/**
 * Per-domain logo routing overrides when the default Brandfetch cascade
 * returns a muddy icon, photo tile, or wrong asset.
 *
 * - logo.dev → Logo.dev only
 * - brandfetch-light → Brandfetch type=logo theme=light
 * - brandfetch-logo-dark → Brandfetch type=logo theme=dark
 * - brandfetch-icon-dark → Brandfetch type=icon theme=dark
 * - brandfetch-symbol-dark → Brandfetch type=symbol theme=dark
 * - text → skip image fetch; show tenant name / lettermark
 * - local → bundled asset URL (see LOCAL_LOGO_BY_DOMAIN)
 */
import coreologyLogo from "@assets/extra logos/coreology.avif";
import loquiLogo from "@assets/extra logos/loqui.svg";
import pressedJuiceryLogo from "@assets/extra logos/pressed-juicery.svg";
import rvrVeniceLogo from "@assets/logos/rvr-venice.png";
import abbotsPizzaLogo from "@assets/logos/lil_guy_logo_w_text-03_1767391610.webp";
import levainBakeryLogo from "@assets/logos/levain_bakery.svg";
import pinkLogo from "@assets/logos/080626_PINK_Masthead.svg";
import tmntPizzeriaLogo from "@assets/logos/tmntlogo_web.avif";
import casaMartinLogo from "@assets/logos/wupqnzob0lcrlxvsvyfa.avif";
import westsideComedyLogo from "@assets/logos/WSC-logo-web.webp";
import dragonAlleyLogo from "@assets/logos/Dragon-Alley-Coffee-Shop-Logo.png";
import puzzleZooLogo from "@assets/logos/puzzle-zoo.jpeg";
import santaMonicaSouvenirsLogo from "@assets/logos/santa-monica-souvenirs.webp";
import shellLogo from "@assets/logos/Shell_logo.svg";

export type LogoRouteOverride =
  | "logo.dev"
  | "brandfetch-light"
  | "brandfetch-logo-dark"
  | "brandfetch-icon-dark"
  | "brandfetch-symbol-dark"
  | "text"
  | "local";

const LOGO_ROUTE_BY_DOMAIN: Record<string, LogoRouteOverride> = {
  // Prefer Logo.dev (cleaner wordmarks)
  "cafeangelino.com": "logo.dev",
  "nonglacafe.com": "logo.dev",
  "seematerials.com": "logo.dev",
  "districtlabrea.com": "logo.dev",
  "intelligentsia.com": "logo.dev",
  "cafestella.com": "logo.dev",
  "mensho.com": "logo.dev",
  "mensho.tokyo": "logo.dev",
  "cavanaughrealtors.com": "logo.dev",
  "nestarchitecture.com": "logo.dev",
  "slayitaliankitchen.com": "logo.dev",
  "caneel.com": "logo.dev",
  "musette.ro": "logo.dev",
  "katsu-yagroup.com": "logo.dev",
  "tsujita.com": "logo.dev",
  "themaderagroup.com": "logo.dev",
  "marmaladecafe.com": "logo.dev",
  "colonycleanersonline.com": "logo.dev",
  "dieselbookstore.com": "logo.dev",
  "luckys-steakhouse.com": "logo.dev",
  "jimmyjohns.com": "logo.dev",
  "visualcomfort.com": "logo.dev",
  "pizzanista.com": "logo.dev",
  "loteriagrill.com": "logo.dev",
  "wokcanorestaurant.com": "logo.dev",

  // Brandfetch light logo (colored under theme=light)
  "thekettle.net": "brandfetch-light",
  "fishingwithdynamite.com": "brandfetch-light",
  "rothys.com": "brandfetch-light",
  "gotoycrazy.com": "brandfetch-light",
  "lenscrafters.com": "brandfetch-light",
  "dinelittlesister.com": "brandfetch-light",
  "melsdrive-in.com": "brandfetch-light",
  "sunsetplazadental.com": "brandfetch-light",

  // Brandfetch dark logo
  "auntieannes.com": "brandfetch-logo-dark",
  "levi.com": "brandfetch-logo-dark",
  "shopterrain.com": "brandfetch-logo-dark",
  "themacstudio.com": "brandfetch-logo-dark",
  "thewin-dow.la": "brandfetch-logo-dark",
  "rh.com": "brandfetch-logo-dark",
  "rag-bone.com": "brandfetch-logo-dark",
  "vans.com": "brandfetch-logo-dark",

  // Brandfetch dark icon
  "smashburger.com": "brandfetch-icon-dark",
  "hotpilates.com": "brandfetch-icon-dark",
  "prospectwise.com": "brandfetch-icon-dark",
  "laconventioncenter.com": "brandfetch-icon-dark",
  "mango.com": "brandfetch-icon-dark",

  // Brandfetch dark symbol
  "usps.com": "brandfetch-symbol-dark",
  "dominos.com": "brandfetch-symbol-dark",

  // Bundled local assets
  "coreologyfitness.com": "local",
  "coreology.com": "local",
  "eatloqui.com": "local",
  "loqui.com": "local",
  "pressed.com": "local",
  "rvr.la": "local",
  "abbotspizzaco.com": "local",
  "levainbakery.com": "local",
  // Victoria's Secret PINK — no standalone Brandfetch entry
  "pink.com": "local",
  "tmntpizzeriala.com": "local",
  "casamartinsm.com": "local",
  "westsidecomedyclub.com": "local",
  "dragonalleycoffeeshop.com": "local",
  "puzzlezoo.com": "local",
  "santamonicasouvenirs.com": "local",
  "shell.com": "local",

  // Plain text only
  "adivineh2o.com": "text",
  "beautybarclinic.com": "text",
  "speedwaycarwash.com": "text",
  "houseoflaserandaesthetics.co.uk": "text",
  "medicalweightlossbeauty.com": "text",
  "samhamo.com": "text",
  "macandkelly.com": "text",
  "mainchick.com": "text",
  "plvendome.com": "text",
  "shopaholicsamplesales.com": "text",
  "9026eyes.com": "text",
  "darnestownshell.com": "text",
  "boasteak.com": "text",
  "nakedmedspa.com": "text",
  "westsidepediatrics.com": "text",
  "turpan.com": "text",
  "tradinoimalibu.com": "text",
  "bakecheesetart.com": "text",
  "casadani.com": "text",
  "fastfixjewelry.com": "text",
  "meizhourestaurants.com": "text",
  "sakehousebyhikari.com": "text",
  "nclla.org": "text",
  // Abbot Kinney: Brandfetch returns another company's mark or a washed-out one.
  "san-damian.com": "text",
  "cooksgarden.com": "text",
  "reserve-venice.com": "text",
  "americanvintage-store.com": "text",
  "coutula.com": "text",
  "onegoldenthread.com": "text",
  "peakdesign.com": "text",
  "pardeeproperties.com": "text",
  "shoplovestitch.com": "text",
  "auditoriumbooks.com": "text",
  "petermarco.com": "text",
  "impulsecalifornia.com": "text",
  "qrestaurantorland.com": "text",
};

/** Domain → Vite-bundled asset URL for `local` route. */
const LOCAL_LOGO_BY_DOMAIN: Record<string, string> = {
  "coreologyfitness.com": coreologyLogo,
  "coreology.com": coreologyLogo,
  "eatloqui.com": loquiLogo,
  "loqui.com": loquiLogo,
  "pressed.com": pressedJuiceryLogo,
  "rvr.la": rvrVeniceLogo,
  "abbotspizzaco.com": abbotsPizzaLogo,
  "levainbakery.com": levainBakeryLogo,
  "pink.com": pinkLogo,
  "tmntpizzeriala.com": tmntPizzeriaLogo,
  "casamartinsm.com": casaMartinLogo,
  "westsidecomedyclub.com": westsideComedyLogo,
  "dragonalleycoffeeshop.com": dragonAlleyLogo,
  "puzzlezoo.com": puzzleZooLogo,
  "santamonicasouvenirs.com": santaMonicaSouvenirsLogo,
  "shell.com": shellLogo,
};

function cleanDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const clean = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
  return clean || null;
}

export function getLogoRouteOverride(
  domain: string | null | undefined
): LogoRouteOverride | null {
  const clean = cleanDomain(domain);
  if (!clean) return null;
  return LOGO_ROUTE_BY_DOMAIN[clean] ?? null;
}

export function getLocalLogoUrl(
  domain: string | null | undefined
): string | null {
  const clean = cleanDomain(domain);
  if (!clean) return null;
  return LOCAL_LOGO_BY_DOMAIN[clean] ?? null;
}
