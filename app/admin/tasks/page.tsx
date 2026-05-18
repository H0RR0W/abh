import { Suspense } from "react";
import TasksPage from "./TasksPage";

export default function Page() {
  return (
    <Suspense>
      <TasksPage />
    </Suspense>
  );
}
