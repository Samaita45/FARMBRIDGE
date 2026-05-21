/**
 * Local background images for every major screen.
 * All images are bundled via require() so they work offline.
 */

export const AuthImages = {
  /** Fruit market stall — Onboarding hero */
  onboardingFarm: require('../assets/backgrounds/bg-onboarding.png') as number,
  /** Jars, apples, vegetables market stall — Registration background */
  registerProduce: require('../assets/backgrounds/bg-registration.png') as number,
  /** Colourful vegetable basket — Login full-screen background */
  loginProduce: require('../assets/backgrounds/bg-login.png') as number,
} as const;

export const ScreenImages = {
  /** Crates of leafy greens and peppers — Market */
  market: require('../assets/backgrounds/bg-market.png') as number,
  /** Scania truck on dirt road through fields — Transport */
  transport: require('../assets/backgrounds/bg-transport.png') as number,
  /** Farm machinery / tractors aerial — Crop Management */
  crop: require('../assets/backgrounds/bg-crop.png') as number,
  /** Cattle in traditional kraal — Livestock / community farming */
  livestock: require('../assets/backgrounds/bg-livestock.png') as number,
  /** Colourful vegetables on table — Community & Dashboard */
  community: require('../assets/backgrounds/bg-community.png') as number,
} as const;
