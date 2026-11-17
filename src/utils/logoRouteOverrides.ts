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
import americanBeautyLogo from "@assets/logos/american_beauty.png";
import diptyqueLogo from "@assets/logos/diptyque-seeklogo.svg";
import lucyZahranLogo from "@assets/logos/lucy_zahran_logo.png";
import laPiazzaLogo from "@assets/logos/La_Piazza_Transparent.png";
import bvlgariLogo from "@assets/logos/bvlgari-logo.png";
import dolceGabbanaLogo from "@assets/logos/dolce-gabbana-logo.png";
import ferragamoLogo from "@assets/logos/Ferragamo_-_logo_(Italy,_1982-2022).svg";
import hermesLogo from "@assets/logos/hermes-logo-png_seeklogo-455630.png";
import giorgioArmaniLogo from "@assets/logos/giorgio-armani-3.svg";
import jamesPerseLogo from "@assets/logos/james-perse.png";
import bananaRepublicLogo from "@assets/logos/Banana_Republic_Logo.svg.webp";
import lucidMotorsLogo from "@assets/logos/Lucid_Motors_logo.svg.webp";
import rhLogo from "@assets/logos/RH_logo.svg.webp";
import salonRepublicLogo from "@assets/logos/SR+Sign_transparent (1).webp";
import seaOfSilverLogo from "@assets/extra logos/959df54ad221ea6bf0faf64807c541238510bf41.png";
import dinTaiFungLogo from "@assets/extra logos/DTF.png";
import expertDojoLogo from "@assets/extra logos/66d1e9b259aea83de45c200cd0811de1.png";
import pandoraLogo from "@assets/extra logos/Pandora-Logo-300x169.webp";
import breadHeadLogo from "@assets/extra logos/BH-Logo.webp";
import clubStudioLogo from "@assets/extra logos/Club-Studio-Logo.png";
import intimissimiLogo from "@assets/extra logos/Intimissimi_vector_logo (1).svg";
import johnnyWasLogo from "@assets/extra logos/johnny_cali.png";
import reebokLabLogo from "@assets/logos/reebok_lab.png";
import apcLogo from "@assets/logos/apc.png";
import bottegaLouieLogo from "@assets/logos/c_fit-w_1920-h_1440-crm-la-bottegalouie_36163c62-e497-8f46-7b0a27d9adf8b520-36163b7fe28593b_36164584-fcae-9e75-063b60483040a287.avif";
import erewhonLogo from "@assets/logos/erewhon.png";
import paigeLogo from "@assets/logos/paige.png";
import suitSupplyLogo from "@assets/logos/suitsupply.svg";
import wallysLogo from "@assets/logos/wallys-wine.svg";
import houseOfCbLogo from "@assets/logos/house-of-cb-clean.png";
import ernestaLogo from "@assets/montana_logos/Ernesta_Logo.jpg";
import pinkChickenLogo from "@assets/montana_logos/pink_chicken.png";
import visualComfortLogo from "@assets/montana_logos/visual comfort logo.avif";

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
  "visualcomfort.com": "local",
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
  "rag-bone.com": "brandfetch-logo-dark",
  "aliceandolivia.com": "brandfetch-logo-dark",
  "on.com": "brandfetch-logo-dark",
  "shop.lululemon.com": "brandfetch-logo-dark",
  "vince.com": "brandfetch-logo-dark",
  "salomon.com": "brandfetch-logo-dark",
  "thisisthegreat.com": "brandfetch-logo-dark",
  "sportyandrich.com": "brandfetch-logo-dark",
  "fearofgod.com": "brandfetch-logo-dark",
  "vans.com": "brandfetch-logo-dark",
  "bluemercury.com": "brandfetch-logo-dark",
  "eileenfisher.com": "brandfetch-logo-dark",
  "jonesroadbeauty.com": "brandfetch-logo-dark",
  "jmclaughlin.com": "brandfetch-logo-dark",
  "vanleeuwenicecream.com": "brandfetch-logo-dark",
  "papersource.com": "brandfetch-logo-dark",
  "theshadestore.com": "brandfetch-logo-dark",
  "framebridge.com": "brandfetch-logo-dark",
  "moscot.com": "brandfetch-logo-dark",
  "lalalandkindcafe.com": "brandfetch-logo-dark",
  "breadheadla.com": "local",
  "nordstrom.com": "brandfetch-logo-dark",
  "arcteryx.com": "brandfetch-logo-dark",
  "bombas.com": "brandfetch-logo-dark",
  "baggu.com": "brandfetch-logo-dark",
  "veja-store.com": "brandfetch-logo-dark",
  "ahlemeyewear.com": "brandfetch-logo-dark",
  "lelabofragrances.com": "brandfetch-logo-dark",
  "monos.com": "brandfetch-logo-dark",
  "farmrio.com": "brandfetch-logo-dark",
  "astridandmiyu.com": "brandfetch-logo-dark",
  "fromourplace.com": "brandfetch-logo-dark",
  "goodr.com": "brandfetch-logo-dark",
  "credobeauty.com": "brandfetch-logo-dark",
  "dsanddurga.com": "brandfetch-logo-dark",
  "alohas.com": "brandfetch-logo-dark",
  "zadig-et-voltaire.com": "brandfetch-logo-dark",
  "garrettleight.com": "brandfetch-logo-dark",
  "shinola.com": "brandfetch-logo-dark",
  "frankiesbikinis.com": "brandfetch-logo-dark",
  "studs.com": "brandfetch-logo-dark",
  "vuoriclothing.com": "brandfetch-logo-dark",
  "mejuri.com": "brandfetch-logo-dark",
  "hoka.com": "brandfetch-logo-dark",
  "fireclaytile.com": "brandfetch-logo-dark",
  "farrow-ball.com": "brandfetch-logo-dark",
  "sundays-company.com": "brandfetch-logo-dark",
  "avocadogreenmattress.com": "brandfetch-logo-dark",
  "nakedcashmere.com": "brandfetch-logo-dark",
  "maliamills.com": "brandfetch-logo-dark",
  "ernestarugs.com": "local",
  "clarev.com": "brandfetch-logo-dark",
  "onlyhearts.com": "brandfetch-logo-dark",
  "flannelamerica.com": "brandfetch-logo-dark",
  "pinkchicken.com": "local",
  "unsubscribed.com": "brandfetch-logo-dark",
  "margaretoleary.com": "brandfetch-logo-dark",

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
  "americanbeautysteakhouse.com": "local",
  "diptyque.com": "local",
  "lucyzahran.com": "local",
  "lapiazzaitalian.com": "local",
  "bvlgari.com": "local",
  "dolcegabbana.com": "local",
  "salvatoreferragamo.com": "local",
  "ferragamo.com": "local",
  "hermesofparis.com": "local",
  "hermes.com": "local",
  "giorgioarmani.com": "local",
  "armani.com": "local",
  "jamesperse.com": "local",
  "bananarepublicfactory.com": "local",
  "bananarepublic.com": "local",
  "lucid.com": "local",
  "lucidmotors.com": "local",
  "rh.com": "local",
  "salonrepublic.com": "local",
  "seaofsilversm.com": "local",
  "dtf.com": "local",
  "dintaifungusa.com": "local",
  "expertdojo.com": "local",
  "pandora-jewelry.com": "local",
  "pandora.net": "local",
  "pandora.com": "local",
  "clubstudiofitness.com": "local",
  "clubstudio.com": "local",
  "intimissimi.com": "local",
  "johnnywas.com": "local",
  "reeboklab.com": "local",
  "reebok.com": "local",
  "apc-us.com": "local",
  "apc.fr": "local",
  "bottegalouie.com": "local",
  "erewhon.com": "local",
  "erewhonmarket.com": "local",
  "paige.com": "local",
  "suitsupply.com": "local",
  "wallys.com": "local",
  "wallywine.com": "local",
  "houseofcb.com": "local",

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
  "americanbeautysteakhouse.com": americanBeautyLogo,
  "diptyque.com": diptyqueLogo,
  "lucyzahran.com": lucyZahranLogo,
  "lapiazzaitalian.com": laPiazzaLogo,
  "bvlgari.com": bvlgariLogo,
  "dolcegabbana.com": dolceGabbanaLogo,
  "salvatoreferragamo.com": ferragamoLogo,
  "ferragamo.com": ferragamoLogo,
  "hermesofparis.com": hermesLogo,
  "hermes.com": hermesLogo,
  "giorgioarmani.com": giorgioArmaniLogo,
  "armani.com": giorgioArmaniLogo,
  "jamesperse.com": jamesPerseLogo,
  "bananarepublicfactory.com": bananaRepublicLogo,
  "bananarepublic.com": bananaRepublicLogo,
  "lucid.com": lucidMotorsLogo,
  "lucidmotors.com": lucidMotorsLogo,
  "rh.com": rhLogo,
  "salonrepublic.com": salonRepublicLogo,
  "seaofsilversm.com": seaOfSilverLogo,
  "dtf.com": dinTaiFungLogo,
  "dintaifungusa.com": dinTaiFungLogo,
  "expertdojo.com": expertDojoLogo,
  "pandora-jewelry.com": pandoraLogo,
  "pandora.net": pandoraLogo,
  "pandora.com": pandoraLogo,
  "breadheadla.com": breadHeadLogo,
  "clubstudiofitness.com": clubStudioLogo,
  "clubstudio.com": clubStudioLogo,
  "intimissimi.com": intimissimiLogo,
  "johnnywas.com": johnnyWasLogo,
  "reeboklab.com": reebokLabLogo,
  "reebok.com": reebokLabLogo,
  "apc-us.com": apcLogo,
  "apc.fr": apcLogo,
  "bottegalouie.com": bottegaLouieLogo,
  "erewhon.com": erewhonLogo,
  "erewhonmarket.com": erewhonLogo,
  "paige.com": paigeLogo,
  "suitsupply.com": suitSupplyLogo,
  "wallys.com": wallysLogo,
  "wallywine.com": wallysLogo,
  "houseofcb.com": houseOfCbLogo,
  "ernestarugs.com": ernestaLogo,
  "pinkchicken.com": pinkChickenLogo,
  "visualcomfort.com": visualComfortLogo,
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
