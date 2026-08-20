export const ANDROID_PACKAGE_ID = "com.findmucker.casa";

const SHA256_CERT_FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export interface AndroidAssetLinksStatement {
  relation: ["delegate_permission/common.handle_all_urls"];
  target: {
    namespace: "android_app";
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
}

export function parseAndroidCertificateFingerprints(value?: string): string[] {
  if (!value) return [];

  const fingerprints = value
    .split(/[\r\n,]+/)
    .map((fingerprint) => fingerprint.trim().toUpperCase())
    .filter((fingerprint) => SHA256_CERT_FINGERPRINT.test(fingerprint));

  return [...new Set(fingerprints)];
}

export function createAndroidAssetLinksStatements(
  fingerprints: string[],
): AndroidAssetLinksStatement[] {
  if (fingerprints.length === 0) return [];

  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE_ID,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];
}
