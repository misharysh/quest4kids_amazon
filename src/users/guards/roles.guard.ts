import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { Role } from "../role.enum";
import { ROLE_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate
{
    constructor(private readonly reflector: Reflector) {};
    
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRole = this.reflector.getAllAndOverride<Role>(
            ROLE_KEY, [context.getHandler(), context.getClass()]
        ); 

        if(!requiredRole) return true;

        const {user} = context.switchToHttp().getRequest();

        return requiredRole === user?.role;
    }
}