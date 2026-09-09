import CmsPublicPage, { generateMetadata as cmsMetadata } from "../page/[slug]/page";

export async function generateMetadata() {
  return cmsMetadata({ params: Promise.resolve({ slug: "privacy" }) });
}

export default async function PrivacyPage() {
  return <CmsPublicPage params={Promise.resolve({ slug: "privacy" })} />;
}
