// One canonical origin: OAuth origins, cookies and hreflang all name the
// bare domain, so www only forwards. Path and query survive the hop.
export default {
  fetch(req: Request): Response {
    const url = new URL(req.url)
    url.hostname = 'example.com'
    return Response.redirect(url.toString(), 301)
  },
}
