export function identityGraph(
  creator: {
    name: string;
    bio?: string;
    profile_image?: string;
    instagram_url?: string;
    youtube_url?: string;
  },
  origin: string,
  route: string,
  title: string,
  description: string,
): { '@context': string; '@graph': object[] };
