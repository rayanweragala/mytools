import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";

interface EndpointRow {
  key: string;
  webhookUrl: string;
  config: Record<string, unknown>;
}

interface EndpointsResponse {
  endpoints: EndpointRow[];
}

export function useEndpoints() {
  return useQuery({
    queryKey: ["endpoints"],
    queryFn: () => apiGet<EndpointsResponse>("/api/endpoints")
  });
}
