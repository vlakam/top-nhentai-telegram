import { Context } from "telegraf";

export const errorMiddleware = async (ctx: Context, next: () => void) => {
    try {
        await next();
    } catch (e) {
        console.log(e);
    }
}