// Sends www.rtlawservices.com to rtlawservices.com, keeping the path and query,
// so search engines and bookmarks use one address.
const redirect = {
  fetch(request) {
    const url = new URL(request.url);
    url.hostname = "rtlawservices.com";
    return Response.redirect(url.toString(), 301);
  },
};

export default redirect;
