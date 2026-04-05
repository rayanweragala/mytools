# 🧪 Webhook Mock Lab

A powerful, lightweight webhook simulator designed for testing complex webhook flows with ease. Perfect for simulating third-party service responses, testing retry logic, and inspecting incoming data in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## ✨ Features

- **🎯 Configurable Endpoints:** Multiple built-in endpoints for common telephony/system flows.
- **🔐 Flexible Authentication:** Support for `NONE`, `API_KEY` (custom headers), and `BEARER` token validation.
- **🔄 Retry Simulation:** Configure status code sequences (e.g., `503, 503, 200`) to test your application's resilience.
- **⏱️ Response Delay:** Simulate network latency or slow service processing.
- **✉️ Custom Responses:** Full control over response body (JSON) and custom HTTP headers.
- **📊 Real-time Inspection:** Live dashboard to inspect incoming headers and payloads with search/filter capabilities.
- **💾 Persistence:** Configuration is saved locally and survives restarts.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/webhook-mock-lab.git
cd webhook-mock-lab
npm install
```

### Running the Lab

```bash
# Start in development mode (auto-reload)
npm run dev
```

The UI will be available at [http://localhost:8787](http://localhost:8787).

## 🛠️ Configuration

### Public URL via ngrok

To receive webhooks from external services, expose your local server using ngrok:

```bash
ngrok http 8787
```

Paste the generated `https://...` URL into the **ngrok Base URL** field in the UI to get the final webhook addresses for your service configuration.

### Endpoint Settings

- **Auth Type:** Choose how the mock should validate incoming requests.
- **Status Code:** The default HTTP status code to return.
- **Retry Sequence:** A comma-separated list of codes that will be returned in order (cycles back to start).
- **Response Headers:** JSON object of custom headers to include in the response.
- **Response Body:** The JSON payload to return.

## 📖 Example Use Cases

### 1. Testing DWESK PBX Webhooks
Configure the `incoming-call` endpoint with a `200 OK` status and a sample JSON response to verify your PBX integration.

### 2. Testing Service Resilience
Set the **Retry Sequence** to `503, 503, 200`. Your application should ideally retry twice before succeeding on the third attempt.

### 3. Header-based Routing
Configure **Custom Response Headers** to include `X-Mock-Source: webhook-lab` to identify mock traffic in your logs.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
