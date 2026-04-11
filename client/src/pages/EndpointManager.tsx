import { useEndpoints } from "../hooks/useEndpoints";

export function EndpointManager() {
  const { data, isLoading, isError } = useEndpoints();

  return (
    <section className="page-card">
      <h1>Endpoint Manager</h1>
      {isLoading && <p>Loading endpoints...</p>}
      {isError && <p>Failed to load endpoints.</p>}
      {!isLoading && !isError && (
        <ul className="simple-list">
          {(data?.endpoints || []).map((endpoint) => (
            <li key={endpoint.key}>
              <strong>{endpoint.key}</strong> <code>{endpoint.webhookUrl}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
