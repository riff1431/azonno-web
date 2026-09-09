import CmsPublicPage, { generateMetadata as cmsMetadata } from "../page/[slug]/page";

export async function generateMetadata() {
  return cmsMetadata({ params: Promise.resolve({ slug: "terms" }) });
}

export default async function TermsPage() {
  return <CmsPublicPage params={Promise.resolve({ slug: "terms" })} />;
}
