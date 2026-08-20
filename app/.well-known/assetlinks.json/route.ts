import {
  createAndroidAssetLinksStatements,
  parseAndroidCertificateFingerprints,
} from "@/lib/android-asset-links";

export const dynamic = "force-dynamic";

export function GET() {
  const fingerprints = parseAndroidCertificateFingerprints(
    process.env.ANDROID_SHA256_CERT_FINGERPRINTS,
  );

  return Response.json(createAndroidAssetLinksStatements(fingerprints), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
