module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      "@babel/preset-typescript",
      ["@babel/preset-env", { targets: { node: "current" } }],
    ],
    plugins: ["@babel/plugin-transform-runtime"],
    plugins: ["expo-router/babel"],
    plugins: ["react-native-paper/babel"],
    env: {
      production: {
        plugins: ["react-native-paper/babel"],
      },
    },
  };
};
