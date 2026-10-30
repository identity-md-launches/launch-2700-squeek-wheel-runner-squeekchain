// Shared namespace for the classic (non-module) scripts, so the site also
// works when index.html is opened straight from disk.
interface Window {
  SWR: Record<string, any>;
}
