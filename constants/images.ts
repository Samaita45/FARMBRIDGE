/**
 * Local background images for every major screen.
 * All images are bundled via require() so they work offline.
 */

export const AppImages = {
  /** FarmBridge brand logo (square; render with AppLogo for circular crop) */
  logo: require('../assets/images/logo-farmbridge.png') as number,
} as const;

export const AuthImages = {
  /** Fruit market stall — Onboarding hero */
  onboardingFarm: require("../assets/backgrounds/bg-onboarding.png") as number,
  /** Jars, apples, vegetables market stall — Registration background */
  registerProduce:
    require("../assets/backgrounds/bg-registration.png") as number,
  /** Colourful vegetable basket — Login full-screen background */
  loginProduce: require("../assets/backgrounds/bg-login.png") as number,
} as const;

export const ScreenImages = {
  /** Crates of leafy greens and peppers — Market */
  market: require("../assets/backgrounds/bg-market.png") as number,
  /** Scania truck on dirt road through fields — Transport */
  transport: require("../assets/backgrounds/bg-transport.png") as number,
  /** Farm machinery / tractors aerial — Crop Management */
  crop: require("../assets/backgrounds/bg-crop.png") as number,
  /** Cattle in traditional kraal — Livestock / community farming */
  livestock: require("../assets/backgrounds/bg-livestock.png") as number,
  /** Colourful vegetables on table — Community & Dashboard */
  community: require("../assets/backgrounds/bg-community.png") as number,
} as const;

/**
 * Photographs fetched from Unsplash.
 *
 * EVERY ONE WAS DOWNLOADED AND LOOKED AT before being listed, the same rule the
 * produce table follows — search descriptions have been wrong in both
 * directions before, once returning a poisonous toadstool for "mushrooms".
 *
 * Each entry pairs with a bundled `placeholder` from ScreenImages. The onboarding
 * screen in particular is opened before the app has ever had a network, and a
 * remote-only hero is a grey rectangle exactly then.
 */
const UNSPLASH = '?auto=format&fit=crop&w=1000&q=75';

export const RemoteImages = {
  /** Red tractor with an implement working a green hillside — onboarding hero. */
  onboardingTractor: {
    uri: `https://images.unsplash.com/photo-1712421811762-544942426e84${UNSPLASH}`,
  },
} as const;
