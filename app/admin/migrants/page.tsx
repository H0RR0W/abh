import { Suspense } from "react";
import MigrantsPage from "./MigrantsPage";

export default function Page() {
  return (
    <Suspense>
      <MigrantsPage />
    </Suspense>
  );
}
