/**
 * A string you can read off the screen to tell which code a device is running.
 *
 * WHY THIS EXISTS. Three rounds of "the button is invisible" were spent without
 * ever establishing whether the phone was running the code being edited. The
 * bundle Metro served was verified as current every time; what the device had
 * was never verifiable at all. That is a debugging loop with no exit.
 *
 * It renders only in development, on the sign-in screen, beside the demo hint
 * that is already there — no new UI, and nothing ships to a real user.
 *
 * Bump it whenever you need to prove a device has picked up a change.
 */
export const BUILD_MARKER = 'build-2026-09-14-a';
