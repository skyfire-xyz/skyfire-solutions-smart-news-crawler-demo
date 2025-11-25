import tracer from "dd-trace";

tracer.init({
  service: "skyfire-solutions-crawler-bot-protection-proxy",
  env: process.env.DD_ENV || "dev",
  version: process.env.DD_VERSION,
  hostname: process.env.DD_AGENT_HOST, // sets the agent host
  port: process.env.DD_TRACE_AGENT_PORT
    ? Number(process.env.DD_TRACE_AGENT_PORT)
    : undefined, // sets the agent port if provided
});

export default tracer;
