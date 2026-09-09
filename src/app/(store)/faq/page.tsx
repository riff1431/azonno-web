import CmsPublicPage, { generateMetadata as cmsMetadata } from "../page/[slug]/page";

export async function generateMetadata() {
  return cmsMetadata({ params: Promise.resolve({ slug: "faq" }) });
}

export default async function FaqPage() {
  return <CmsPublicPage params={Promise.resolve({ slug: "faq" })} />;
}
