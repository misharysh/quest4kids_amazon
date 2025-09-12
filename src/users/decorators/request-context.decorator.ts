import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const RequestContext = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
    
        return {
            traceId: request.traceId,
            correlationId: request.correlationId,
        };
    },
);