// Shared by the build output and React so the same person has one stable identity.
export function identityGraph(creator, origin, route, title, description) {
  const absolute = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : undefined;
    } catch {
      return undefined;
    }
  };
  const personId = `${origin}/#person`;
  const websiteId = `${origin}/#website`;
  const url = `${origin}${route}`;
  const profile = route === '/' || route === '/about';
  const person = {
    '@type': 'Person',
    '@id': personId,
    name: creator.name,
    alternateName: ['itskarishma', 'Its Karishma', '@itskarishma.chauhan'],
    url: `${origin}/`,
    description: creator.bio || description,
    jobTitle: 'Beauty, Fashion & Lifestyle Content Creator',
    image: absolute(creator.profile_image),
    sameAs: [
      ...new Set([creator.instagram_url, creator.youtube_url].map(absolute).filter(Boolean)),
    ],
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${origin}/`,
        name: 'Its Karishma',
        alternateName: ['itskarishma', creator.name],
        inLanguage: 'en-IN',
        publisher: { '@id': personId },
      },
      {
        '@type': profile
          ? 'ProfilePage'
          : ['/portfolio', '/shop', '/blog'].includes(route)
            ? 'CollectionPage'
            : 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'en-IN',
        isPartOf: { '@id': websiteId },
        about: { '@id': personId },
        ...(profile ? { mainEntity: { '@id': personId } } : {}),
      },
    ],
  };
}
