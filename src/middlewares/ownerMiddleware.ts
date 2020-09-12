import { Context } from "telegraf";

const { OWNER_ID } = process.env;
const OWNER = parseInt(OWNER_ID || '');

export const ownerMiddleware = async (ctx: Context, next: () => void) => {
    if (ctx.from && ctx.from.id === OWNER) {
        await next();
    }

    return;
}