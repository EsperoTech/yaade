export default {
  title: "Yaade",
  description: "The official Yaade docs.",
  themeConfig: {
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
          { text: "Users & Groups", link: "/users-groups" },
          { text: "Environments", link: "/environments" },
          { text: "Response Scripts", link: "/response-scripts" },
          { text: "Backups", link: "/backups" },
        ],
      },
    ],
    footer: {
      message: '<a href="https://espero.tech/impressum.html">Imprint</a>',
      copyright: 'Copyright © 2022-present EsperoTech GmbH & Co. KG'
    },
  },
};