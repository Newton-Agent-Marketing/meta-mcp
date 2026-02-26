module.exports = {
  apps: [
    {
      name: "meta-mcp",
      script: "npm",
      args: "run dev:local",
      cwd: __dirname,
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env_file: ".env",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
