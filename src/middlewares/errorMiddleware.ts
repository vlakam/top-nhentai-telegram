import { Context } from "telegraf";
import logger from "../helpers/logger";

export const errorMiddleware = async (ctx: Context, next: () => void) => {
    try {
        await next();
    } catch (e) {
        logger.info(e);
    }
}