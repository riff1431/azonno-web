import CmsPublicPage, { generateMetadata as cmsMetadata } from "../page/[slug]/page";

export async function generateMetadata() {
  return cmsMetadata({ params: Promise.resolve({ slug: "returns" }) });
}

export default async function ReturnsPage() {
  return <CmsPublicPage params={Promise.resolve({ slug: "returns" })} />;
}
