import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Next.js 16 renames `middleware.ts` → `proxy.ts`. Clerk's middleware is
 * filename-agnostic — it's just a request handler exported as the default
 * function for Next to pick up.
 *
 * Almost everything on Plixfy is public — games, profiles, comments, the
 * activity feed. We only protect explicit write surfaces (sign-in-required
 * server actions, the webhook, and the user dashboard).
 */
const isProtectedRoute = createRouteMatcher([
  '/api/me(.*)',
  '/profile/me(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals + all static files unless explicitly visited.
    '/((?!_next|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|woff2?|ttf|otf|map|txt|xml|webmanifest)).*)',
    // Always run for API + tRPC routes.
    '/(api|trpc)(.*)',
  ],
};
