export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_KEY,
      // domain: "https://your-issuer-url.clerk.accounts.dev/",
      applicationID: "convex",
    },
  ],
};
