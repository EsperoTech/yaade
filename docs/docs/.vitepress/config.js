export default {
  title: "Yaade",
  description: "The official Yaade docs.",
  themeConfig: {
    logo: "/yaade-icon.png",
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is Yaade?", link: "/what-is-yaade" },
          { text: "Getting Started", link: "/getting-started" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Collections & Requests", link: "/collections-requests" },
          { text: "Users & Groups", link: "/users-groups" },
          { text: "Environments", link: "/environments" },
          { text: "Authentication", link: "/authentication" },
          { text: "Scripts", link: "/scripts" },
          { text: "Files", link: "/files" },
          { text: "Backups", link: "/backups" },
          { text: "Certificates", link: "/certificates" },
          { text: "Tokens", link: "/access-tokens" },
          { text: "MCP", link: "/mcp" },
        ],
      },
    ],
    footer: {
      message: '<a href="https://espero.tech/impressum.html">Imprint</a>',
      copyright: 'Copyright © 2022-present EsperoTech GmbH & Co. KG'
    },
  },
};
