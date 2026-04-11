import { Link } from "react-router-dom";

export function Simulator() {
  return (
    <section className="page-card">
      <h1>Simulator</h1>
      <p>Endpoint configuration and logs migrate in phases 5+.</p>
      <p>
        Endpoint management is available at <Link to="/simulator/endpoints">/simulator/endpoints</Link>.
      </p>
    </section>
  );
}
