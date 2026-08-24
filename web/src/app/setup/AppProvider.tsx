import { QueryProvider } from "./query/QueryProvider";
import { RouterProvider } from "./RouterProvider";

export function AppProvider() {
  return (
    <QueryProvider>
      <RouterProvider />
    </QueryProvider>
  );
}
