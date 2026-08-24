import type { GrpcRequestError } from "@/shared/api";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: GrpcRequestError;
  }
}
