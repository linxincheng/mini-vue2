import Vue from "core/index"
import { patch } from "./patch"
Vue.prototype.__patch__ = patch

export default Vue
