// @ts-expect-error: ES模块和CommonJS模块互操作性问题
import { TEMPLATES } from "./templates.js";

export const defaultHTML = TEMPLATES.vanilla.html;
