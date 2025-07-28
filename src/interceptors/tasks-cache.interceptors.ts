import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { RedisCacheService } from 'src/redis/redis-cache.service';

@Injectable()
export class TasksCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redisCacheService: RedisCacheService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id || 'anonymous';
    const filters = req.query || {};
    const key = `tasks:${userId}:${JSON.stringify(filters)}`;
    
    return from(this.redisCacheService.get(key)).pipe(
      switchMap((cached) => {
        if (cached) {
          console.log(`[CACHE HIT] Returning cached data for key: ${key}`);
          return of(JSON.parse(cached));
        }

        console.log(`[CACHE MISS] No cache found for key: ${key}, fetching from DB...`);
        return next.handle().pipe(
          tap(async (data) => {
            await this.redisCacheService.set(key, JSON.stringify(data), 10);
            console.log(`[CACHE SET] Cache stored for key: ${key} with TTL 10s`);
          }),
        );
      }),
    );
  }
}