const path = require("path")
const flow = require("rollup-plugin-flow-no-whitespace")
// vue使用的映射插件，一直有问题
// const alias = require("rollup-plugin-alias")
// 这是我使用的映射插件
const alias = require("@rollup/plugin-alias")
const uglify = require("rollup-plugin-uglify-es")

// 映射对象
const aliases = require("./alias")
import resolves from "@rollup/plugin-node-resolve"

const version = process.env.VERSION || require("../package.json").version
// 返回文件地址
// eg: resolve('web/entry-runtime-with-compiler.js') => 'src/platforms/web/entry-runtime-with-compiler.js'
const resolve = (p) => {
	const base = p.split("/")[0]
	if (aliases[base]) {
		return path.resolve(aliases[base], p.slice(base.length + 1))
	} else {
		return path.resolve(__dirname, "../", p)
	}
}

const banner =
	"/*!\n" +
	` * Vue.js v${version}\n` +
	` * (c) 2014-${new Date().getFullYear()} Evan You\n` +
	" * Released under the MIT License.\n" +
	" */"

// 不同build的配置 目前只有web
const builds = {
	"web-full-dev": {
		entry: resolve("web/entry-runtime-with-compiler.js"),
		dest: resolve("dist/vue.js"),
		format: "umd",
		env: "development",
		alias: { he: "./entity-decoder" },
		banner,
	},
}

// 获取 rollup 配置
function genConfig(name) {
	const opts = builds[name]

	const entries = Object.keys(aliases).map((key) => {
		return {
			find: key,
			replacement: aliases[key],
		}
	})

	const config = {
		input: opts.entry,
		plugins: [
			flow(),
			alias({
				entries,
			}),
			resolves(),
		],
		output: {
			file: opts.dest,
			format: opts.format,
			banner: opts.banner,
			name: "Vue",
		},
	}

	return config
}

module.exports = genConfig(process.env.TARGET)
