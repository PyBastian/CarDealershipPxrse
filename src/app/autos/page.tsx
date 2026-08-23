import { Suspense } from "react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getPublicVehicles } from "@/lib/data";

export default async function CatalogPage() {
  return <Suspense><CatalogBrowser inventory={await getPublicVehicles()}/></Suspense>;
}
