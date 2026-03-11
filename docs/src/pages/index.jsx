import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header
      style={{
        padding: '4rem 0',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
      }}
    >
      <div className="container">
        <img
          src="/citrineos-core/img/logo.png"
          alt="CitrineOS"
          style={{ height: 80, marginBottom: '1rem' }}
        />
        <h1 style={{ fontSize: '3rem', fontWeight: 700 }}>{siteConfig.title}</h1>
        <p style={{ fontSize: '1.3rem', opacity: 0.85 }}>{siteConfig.tagline}</p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            className="button button--primary button--lg"
            to="/docs/guides/getting-started/getting-started"
          >
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/api/">
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    title: 'OCPP 2.0.1 Native',
    description:
      'Full implementation of the Open Charge Point Protocol 2.0.1 with OCPP 1.6 backward compatibility across all modules.',
  },
  {
    title: 'Modular Architecture',
    description:
      'Independent modules for Certificates, Configuration, EVDriver, Monitoring, Reporting, SmartCharging, Transactions and more.',
  },
  {
    title: 'Production Ready',
    description:
      'Multi-tenant support, RabbitMQ message brokering, Redis caching, OIDC auth, and Fastify HTTP layer out of the box.',
  },
];

export default function Home() {
  return (
    <Layout description="Open Source OCPP 2.0.1 Charge Point Management System">
      <HomepageHeader />
      <main>
        <section style={{ padding: '4rem 0' }}>
          <div className="container">
            <div className="row">
              {features.map(({ title, description }) => (
                <div key={title} className={clsx('col col--4')} style={{ padding: '0 1.5rem' }}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
