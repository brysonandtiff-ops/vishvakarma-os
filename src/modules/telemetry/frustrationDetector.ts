class FrustrationDetector {
  /**
   * Compatibility-only no-op. User behaviour is never monitored and rapid
   * clicking or pointer movement never interrupts the workspace.
   */
  public start(_callback: () => void) {}

  public stop() {}
}

export const frustrationDetector = new FrustrationDetector();
