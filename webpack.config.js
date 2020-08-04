const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const src = path.resolve(__dirname, "src");

module.exports = {
  mode: "development",
  entry: {
    app: path.join(src, "/app.ts"),
  },
  devServer: {
    open: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(src, "index.html"),
      minify: {
        collapseWhitespace: true,
      },
    }),
  ],
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: [path.join(__dirname, "src"), "node_modules"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
};
