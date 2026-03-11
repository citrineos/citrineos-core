// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CitrineOS',
  tagline: 'Open Source OCPP 2.0.1 Charge Point Management System',
  favicon: 'img/favicon.ico',

  url: 'https://citrineos.github.io',
  baseUrl: '/citrineos-core/',

  organizationName: 'citrineos',
  projectName: 'citrineos-core',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // .md = CommonMark (angle brackets are plain text, not JSX).
  // .mdx = MDX. TypeDoc generates .md so JSDoc like <Base64 encoded(...)>
  // will never cause MDX parse errors.
  markdown: {
    format: 'detect',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/citrineos/citrineos-core/edit/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    // Stub Node.js core modules used by swagger-ui-react deps.
    // Webpack 5 no longer polyfills them automatically.
    function nodePolyfillStubPlugin() {
      return {
        name: 'node-polyfill-stub',
        configureWebpack() {
          return {
            resolve: {
              fallback: {
                path: false,
                fs: false,
                os: false,
                crypto: false,
                stream: false,
                buffer: false,
                url: false,
                util: false,
                http: false,
                https: false,
                net: false,
                tls: false,
                zlib: false,
                assert: false,
                querystring: false,
                events: false,
                child_process: false,
              },
            },
          };
        },
      };
    },
  ],

  themes: ['docusaurus-theme-openapi-docs'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'CitrineOS',
        logo: {
          alt: 'CitrineOS Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'guideSidebar',
            position: 'left',
            label: 'Guides',
          },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'left',
            label: 'API Reference',
          },
          {
            type: 'docSidebar',
            sidebarId: 'restApiSidebar',
            position: 'left',
            label: 'REST API',
          },
          {
            type: 'docSidebar',
            sidebarId: 'websocketApiSidebar',
            position: 'left',
            label: 'WebSocket API',
          },
          {
            href: 'https://github.com/citrineos/citrineos-core',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/docs/guides/getting-started/getting-started' },
              { label: 'API Reference', to: '/docs/api/' },
              { label: 'REST API', to: '/docs/rest-api/' },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/citrineos/citrineos-core',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} CitrineOS Contributors. Built with Docusaurus.`,
      },
      prism: {
        additionalLanguages: ['typescript', 'bash', 'json'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
