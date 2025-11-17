// Re-export the actual public landing page so the root route loads the
// production experience instead of the default Next.js placeholder.
export { default } from "./(public)/page";

// Ensure the home page runs dynamically at request time so builds do not try
// to connect to the database when prerendering.
export const dynamic = "force-dynamic";
