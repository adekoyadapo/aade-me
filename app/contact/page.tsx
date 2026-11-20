import type { Metadata } from "next";
import PageTransition from "@/components/page-transition";
import ContactLetter from "@/components/contact-letter";

const title = "Contact Ade A.: Consulting, Speaking, Collaboration";
const description =
  "Write to Ade A. about consulting, speaking or collaboration on Elasticsearch, observability, AI search and cloud platforms. Sign the letter and send it here.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "https://aade.me/contact" },
  openGraph: { title, description, url: "https://aade.me/contact", type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ade A., Enterprise Solutions Architect" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <PageTransition>
      <main className="gutter page-top">
        <div className="wide">
          <h1 className="sr-only">Write to Ade</h1>
          <ContactLetter />
        </div>
      </main>
    </PageTransition>
  );
}
