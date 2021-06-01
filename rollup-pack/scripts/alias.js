// 做别名映射

const path = require("path")

const resolve = (p) => path.resolve(__dirname, "../", p).replace("\\", "/")

module.exports = {
	vue: resolve("src/platforms/web/entry-runtime-with-compiler"),
	web: resolve("src/platforms/web"),
	core: resolve("src/core"),
}
