import {
  ANDROID_PACKAGE_ID,
  createAndroidAssetLinksStatements,
  parseAndroidCertificateFingerprints,
} from "@/lib/android-asset-links";

const FINGERPRINT = Array.from({ length: 32 }, (_, index) =>
  index.toString(16).padStart(2, "0"),
).join(":");

describe("Android Digital Asset Links", () => {
  it("normalizes, validates, and deduplicates certificate fingerprints", () => {
    expect(
      parseAndroidCertificateFingerprints(
        `${FINGERPRINT}, invalid\n${FINGERPRINT.toUpperCase()}`,
      ),
    ).toEqual([FINGERPRINT.toUpperCase()]);
  });

  it("does not publish a trust statement without a configured certificate", () => {
    expect(createAndroidAssetLinksStatements([])).toEqual([]);
  });

  it("publishes the Android package and configured certificate", () => {
    const fingerprint = FINGERPRINT.toUpperCase();
    expect(createAndroidAssetLinksStatements([fingerprint])).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: ANDROID_PACKAGE_ID,
          sha256_cert_fingerprints: [fingerprint],
        },
      },
    ]);
  });
});
