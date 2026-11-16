// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Logo tier, part 2: certificate share image 1080×1350 (FR-CERT-03, FR-STAMP-02). Public image → the
// approved display name only (SG-01, BR-63). The QR is the shared non-scannable placeholder.
import Image from "next/image";
import { certificateShare as cs } from "../../fixtures";
import { bFile, kb, R } from "./kit";
import { Figure, Section } from "./ui";

const cert = bFile("certificate-share.png");

export function CertificateSection() {
  const placements = [
    ["Logo", `Top-centre header, full logo ${R.certificate.logoPx.w} px wide on the white ground. The first thing read.`],
    ["Seal", `Bottom-left, ${R.certificate.sealPx} px. Gold rosette with the paw mark (exact pixels) at its centre, type and year beneath. The mark repeats here as the seal, not as a second logo.`],
    ["Number and date", `Bottom-centre between seal and QR: ${cs.number}, issued ${cs.issuedOnLabel}, “foaglobal.org/verify”.`],
    ["QR", `Bottom-right, ${R.certificate.qrPx} px (6 px per module). Placeholder here; the real one opens /verify/${cs.number}.`],
  ] as const;
  return (
    <Section
      id="b-certificate"
      tier="logo"
      title="Certificate share image 1080×1350"
      lede="Logo on top, achievement in the middle, proof along the bottom: seal, number, QR. One row of proof, so the logo never competes with the seal."
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,540px)_1fr]">
        <Figure caption={`Shown at 50% (540 px wide). PNG ${kb(cert.bytes)}.`}>
          <Image
            src={cert.src}
            width={cert.width}
            height={cert.height}
            alt={`Certificate share image: Friends of Animals logo, ${cs.title} awarded to ${cs.recipientDisplayName}, ${cs.award}, ${cs.competition}, ${cs.school}; gold seal with the paw mark, certificate number ${cs.number}, QR code placeholder`}
            sizes="(min-width: 768px) 540px, calc(100vw - 2rem)"
            className="h-auto w-full rounded-lg border border-bk-border"
          />
        </Figure>
        <dl className="space-y-4 text-sm leading-relaxed">
          {placements.map(([k, v]) => (
            <div key={k}>
              <dt className="font-bold">{k}</dt>
              <dd className="text-bk-muted">{v}</dd>
            </div>
          ))}
          <div>
            <dt className="font-bold">Name</dt>
            <dd className="text-bk-muted">
              The share PNG is public, so it carries the display name &ldquo;{cs.recipientDisplayName}&rdquo; only. The
              A4 PDF (legal name) is out of scope here.
            </dd>
          </div>
        </dl>
      </div>
    </Section>
  );
}
