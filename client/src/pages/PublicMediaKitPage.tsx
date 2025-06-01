// client/src/pages/PublicMediaKitPage.tsx
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter"; // To get the :slug from the URL
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// --- ADDED MISSING IMPORTS FOR CARD COMPONENTS ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// --- END ADDED IMPORTS ---
import {
  Link2, Mail, Phone, MapPin, Twitter, Linkedin, Instagram, Facebook, Youtube, ExternalLink, AlertTriangle, Mic, Sparkles, CheckCircle, ListChecks, Star,
  User, // Added User icon
  ArrowRight, // Added ArrowRight icon
} from "lucide-react";
import NotFound from "./not-found"; // Assuming you have a 404 component
import { Link as RouterLink } from "wouter"; // Added for CTA button

// Interface for the data expected from GET /public/media-kit/{slug}
interface PublicMediaKitData {
  campaign_id: string;
  person_id: number;
  is_prospect_kit?: boolean;
  title?: string | null;
  slug?: string | null;
  is_public?: boolean | null;
  theme_preference?: string | null;
  headline?: string | null;
  introduction?: string | null;
  full_bio_content?: string | null;
  summary_bio_content?: string | null;
  short_bio_content?: string | null;
  talking_points?: Array<{ topic: string; outcome?: string; description: string }> | null;
  key_achievements?: Array<{ value: string }> | null;
  previous_appearances?: Array<{ podcast_name: string; episode_title?: string; link?: string }> | null;
  social_media_stats?: Record<string, { followers?: number; url?: string; handle?: string }> | null;
  headshot_image_urls?: Array<{ url: string }> | null;
  logo_image_url?: string | null;
  call_to_action_text?: string | null;
  contact_information_for_booking?: string | null;
  client_full_name?: string | null;
  client_email?: string | null;
  client_website?: string | null;
  client_linkedin_profile_url?: string | null;
  client_twitter_profile_url?: string | null;
}

const getInitials = (name?: string | null) => {
  if (!name) return "P";
  const parts = name.split(" ");
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name[0].toUpperCase();
};

export default function PublicMediaKitPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: mediaKit, isLoading, error, isError } = useQuery<PublicMediaKitData | null>({
    queryKey: ["publicMediaKit", slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await apiRequest("GET", `/public/media-kit/${slug}`);
      if (response.status === 404) {
        throw new Error("Media kit not found or not public.");
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch media kit." }));
        throw new Error(errorData.detail || "Failed to fetch media kit.");
      }
      const data = await response.json();
      if (!data.is_public) {
          throw new Error("This media kit is not public.");
      }
      return data;
    },
    enabled: !!slug,
    retry: (failureCount, err: any) => err.message !== "Media kit not found or not public." && err.message !== "This media kit is not public." && failureCount < 2,
  });

  useEffect(() => {
    if (mediaKit?.title) {
      document.title = `${mediaKit.title} | Podcast Guest Media Kit`;
    } else if (slug && !isLoading && !isError) { // Added !isError
        document.title = `Media Kit | ${slug}`;
    } else if (isError) {
        document.title = "Media Kit Not Found";
    }
  }, [mediaKit, slug, isLoading, isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 animate-pulse">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6 md:p-10">
          <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1 space-y-6">
              <Skeleton className="h-40 w-40 rounded-full mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-1/3 mt-6" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !mediaKit) {
    return <NotFound />;
  }

  const primaryHeadshot = mediaKit.headshot_image_urls?.[0]?.url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden">
        <header className="p-8 md:p-12 bg-primary text-primary-foreground text-center">
          {mediaKit.logo_image_url && (
            <img src={mediaKit.logo_image_url} alt={`${mediaKit.client_full_name || 'Client'} Logo`} className="h-16 mx-auto mb-4 rounded" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{mediaKit.title || mediaKit.client_full_name || "Media Kit"}</h1>
          {mediaKit.headline && <p className="text-lg md:text-xl text-primary-foreground/80">{mediaKit.headline}</p>}
        </header>

        <div className="p-6 md:p-10 grid md:grid-cols-3 gap-8">
          <aside className="md:col-span-1 space-y-6">
            {primaryHeadshot ? (
              <img src={primaryHeadshot} alt={mediaKit.client_full_name || "Headshot"} className="rounded-full w-40 h-40 md:w-48 md:h-48 object-cover mx-auto shadow-lg border-4 border-white" />
            ) : (
              <Avatar className="h-40 w-40 md:h-48 md:w-48 text-5xl mx-auto shadow-lg border-4 border-white">
                <AvatarFallback>{getInitials(mediaKit.client_full_name)}</AvatarFallback>
              </Avatar>
            )}
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800">{mediaKit.client_full_name || "Guest Speaker"}</h2>
            </div>

            {mediaKit.social_media_stats && Object.keys(mediaKit.social_media_stats).length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Social Presence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {Object.entries(mediaKit.social_media_stats).map(([platform, stats]) => stats.url && (
                    <a key={platform} href={stats.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-gray-700 hover:text-primary transition-colors group">
                      {platform === 'twitter' && <Twitter className="h-4 w-4 mr-2 text-sky-500 group-hover:text-sky-600" />}
                      {platform === 'linkedin' && <Linkedin className="h-4 w-4 mr-2 text-blue-600 group-hover:text-blue-700" />}
                      {platform === 'instagram' && <Instagram className="h-4 w-4 mr-2 text-pink-500 group-hover:text-pink-600" />}
                      {platform === 'facebook' && <Facebook className="h-4 w-4 mr-2 text-blue-700 group-hover:text-blue-800" />}
                      {platform === 'youtube' && <Youtube className="h-4 w-4 mr-2 text-red-600 group-hover:text-red-700" />}
                      <span className="capitalize">{platform}</span>
                      {stats.followers != null && <span className="ml-auto text-xs text-gray-500">{stats.followers.toLocaleString()} followers</span>}
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {mediaKit.contact_information_for_booking && (
                 <Card>
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Book This Guest</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <p className="text-sm text-gray-700">{mediaKit.contact_information_for_booking}</p>
                        {mediaKit.client_email && <p className="text-sm text-gray-700 mt-1"><Mail className="inline h-4 w-4 mr-1 text-gray-500"/> {mediaKit.client_email}</p>}
                    </CardContent>
                </Card>
            )}
          </aside>

          <div className="md:col-span-2 space-y-8">
            {mediaKit.introduction && (
              <section>
                <p className="text-lg text-gray-700 leading-relaxed">{mediaKit.introduction}</p>
              </section>
            )}

            {mediaKit.full_bio_content && (
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center"><User className="h-5 w-5 mr-2 text-primary"/>About {mediaKit.client_full_name || "the Guest"}</h3>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: mediaKit.full_bio_content.replace(/\n/g, '<br />') }} />
              </section>
            )}

            {mediaKit.talking_points && mediaKit.talking_points.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Mic className="h-5 w-5 mr-2 text-primary"/>Potential Talking Points</h3>
                <div className="space-y-4">
                  {mediaKit.talking_points.map((point, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-slate-50/70 shadow-sm">
                      <h4 className="font-semibold text-gray-700">{point.topic}</h4>
                      {point.outcome && <p className="text-xs text-primary mt-0.5">Outcome: {point.outcome}</p>}
                      <p className="text-sm text-gray-600 mt-1 leading-normal">{point.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mediaKit.key_achievements && mediaKit.key_achievements.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center"><Star className="h-5 w-5 mr-2 text-primary"/>Key Achievements</h3>
                <ul className="list-none space-y-1 text-gray-600 pl-0">
                  {mediaKit.key_achievements.map((ach, index) => (
                    <li key={index} className="text-sm flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0"/>
                        <span>{ach.value}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {mediaKit.previous_appearances && mediaKit.previous_appearances.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary"/>Previous Appearances</h3>
                <div className="space-y-3">
                  {mediaKit.previous_appearances.map((app, index) => (
                    <div key={index} className="text-sm p-3 border rounded-md bg-gray-50/50">
                      <span className="font-medium text-gray-700 block">{app.podcast_name}</span>
                      {app.episode_title && <span className="text-gray-600 block text-xs italic">"{app.episode_title}"</span>}
                      {app.link && <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs inline-flex items-center mt-1">Listen <ExternalLink className="inline h-3 w-3 ml-1"/></a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mediaKit.call_to_action_text && (
              <section className="mt-10 text-center p-6 bg-primary/10 rounded-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">{mediaKit.call_to_action_text}</h3>
                {mediaKit.contact_information_for_booking && !mediaKit.contact_information_for_booking.startsWith("http") &&
                    <p className="text-gray-700">{mediaKit.contact_information_for_booking}</p>
                }
                {mediaKit.contact_information_for_booking && mediaKit.contact_information_for_booking.startsWith("http") &&
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <a href={mediaKit.contact_information_for_booking} target="_blank" rel="noopener noreferrer">
                            Book Now <ArrowRight className="ml-2 h-4 w-4"/>
                        </a>
                    </Button>
                }
              </section>
            )}
          </div>
        </div>

        {/* --- CTA for Prospect Kits --- */}
        {mediaKit.person_id && mediaKit.campaign_id && (
          <section className="px-6 md:px-10 py-8 bg-gradient-to-r from-primary to-blue-600 text-white text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl font-bold mb-3">Unlock Your Full Potential!</h2>
            <p className="mb-6 max-w-2xl mx-auto text-base">
              This is a preview of your Media Kit! Sign up now to save your progress, unlock full editing, add GDoc content, get social stats, and supercharge your podcast outreach.
            </p>
            <RouterLink href={`/signup?prospect_person_id=${mediaKit.person_id}&prospect_campaign_id=${mediaKit.campaign_id}`}>
              <Button size="lg" variant="secondary" className="bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold text-lg px-8 py-3 shadow-lg transition-transform hover:scale-105">
                Sign Up & Activate Full Features <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </RouterLink>
          </section>
        )}

        <footer className="text-center py-6 border-t border-gray-200 mt-0">
          {/* mt-0 because the CTA section above it will provide spacing */}
          <p className="text-xs text-gray-500">Media Kit powered by PGL System</p>
          {mediaKit.client_website && (
            <p className="text-xs text-gray-500 mt-1">
              Visit <a href={mediaKit.client_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{mediaKit.client_full_name || "Client"}'s Website</a>
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}