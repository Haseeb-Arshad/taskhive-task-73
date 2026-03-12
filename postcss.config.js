let tailwindPlugin = null;

try {
  const mod = require("@tailwindcss/postcss");
  const pluginFactory = mod.default ?? mod;
  tailwindPlugin = typeof pluginFactory === "function" ? pluginFactory() : pluginFactory;
} catch (_) {
  // Fallback: allow builds to proceed even when optional native Tailwind oxide
  // binaries are unavailable in the environment.
}

module.exports = {
  plugins: [
    ...(tailwindPlugin ? [tailwindPlugin] : []),
  ],
};
