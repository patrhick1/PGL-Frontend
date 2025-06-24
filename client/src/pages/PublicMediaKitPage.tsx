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
  media_kit_id: string;
  campaign_id: string;
  person_id: number;
  client_role?: string | null; // e.g., "client", "prospect"
  title?: string | null; // Main title of the media kit
  slug?: string | null;
  is_public?: boolean | null;
  theme_preference?: string | null; // e.g., "modern", "classic"
  
  tagline?: string | null; // Short tagline under the name in header
  headline?: string | null; // Larger headline text
  introduction?: string | null; // Introduction text, might be used if full_bio is not detailed
  
  full_bio_content?: string | null; // Can be markdown/HTML
  summary_bio_content?: string | null; // Shorter bio
  short_bio_content?: string | null; // Very short bio, possibly for social media
  bio_source?: 'gdoc' | 'llm_generated' | 'manual' | string | null;

  talking_points?: Array<{
    title: string; // Changed from 'topic'
    description?: string;
    outcome?: string; // Kept for potential future use
  }> | null;
  
  sample_questions?: string[] | null; // Array of question strings

  key_achievements?: string[] | null; // Array of achievement strings

  previous_appearances?: Array<{
    url?: string | null;
    date?: string | null;
    type?: 'previous_appearance' | 'speaking_clip' | string | null; // e.g., podcast, webinar, conference talk
    title?: string | null; // e.g., "The Student Success Podcast"
    outlet?: string | null; // Name of the podcast, show, or event series
    description?: string | null; // Optional: Episode title or talk summary
  }> | null;

  social_media_stats?: {
    last_fetched_at?: string | null;
    linkedin_followers_count?: number | null;
    twitter_followers_count?: number | null;
    // Add other platforms as needed
    // Example structure from provided data:
    // [platform_name]?: { followers?: number; url?: string; handle?: string };
  } | null;
  
  testimonials_section?: string | null; // Can be markdown/HTML for a full section

  headshot_image_urls?: Array<{ url: string; alt_text?: string }> | null; // url is primary (legacy)
  headshot_image_url?: string | null; // New single URL format
  logo_image_url?: string | null; // Could be client's company or personal logo

  call_to_action_text?: string | null; // Custom text for the main CTA button
  contact_information_for_booking?: string | null; // JSON string with contact details
  
  // Client-specific information (often from the Person model)
  client_full_name?: string | null;
  client_email?: string | null;
  client_website?: string | null;
  client_linkedin_profile_url?: string | null;
  client_twitter_profile_url?: string | null;
  client_instagram_profile_url?: string | null;
  client_tiktok_profile_url?: string | null;
  
  // New fields from the provided JSON
  custom_sections?: Array<{
    title: string;
    content: any; // Can be an object or array depending on the section
  }> | null;
  
  person_social_links?: Array<{  // <-- ADDED THIS FIELD
    platform: string; 
    handle?: string | null;
    url?: string | null;
  }> | null;
  
  keywords?: string[] | null;
  angles_source?: string | null;
  created_at: string;
  updated_at: string;
  campaign_name?: string | null;

  // Simplified at_a_glance specific structure if preferred over custom_sections
  // This is an alternative to parsing custom_sections if "At a Glance Stats" is always present and structured
  at_a_glance_stats_custom?: {
    keynoteEngagements?: string | null;
    yearsOfExperience?: string | null;
    emailSubscribers?: string | null;
    // Add any other common "at a glance" stats
  } | null;
}

const getInitials = (name?: string | null) => {
  if (!name) return "P";
  const parts = name.split(" ");
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name[0].toUpperCase();
};

// Helper function to convert markdown-style bold to HTML strong tags
const formatMarkdownBold = (text?: string | null): string => {
  if (!text) return "";
  // Handle **bold**
  let formattedText = text.replace(/\\*\\*(.*?)\\*\\*/g, "<strong>$1</strong>");
  // Handle *italic* (if needed, though the example focuses on bold)
  // formattedText = formattedText.replace(/\\*(.*?)\\*/g, "<em>$1</em>");
  return formattedText;
};

// Helper function to extract the main bio from full_bio_content
const getMainBio = (fullBio?: string | null): string => {
  if (!fullBio) return "";
  // Assuming the main bio is the part before "**Summary Bio:**" or "**Short Bio:**"
  // Or, if these markers are not present, use the whole content.
  const summaryMarker = "\\n\\n**Summary Bio:**";
  const shortMarker = "\\n\\n**Short Bio:**";
  
  let mainBio = fullBio;
  const summaryIndex = fullBio.indexOf(summaryMarker);
  const shortIndex = fullBio.indexOf(shortMarker);

  if (summaryIndex !== -1) {
    mainBio = fullBio.substring(0, summaryIndex);
  } else if (shortIndex !== -1) {
    mainBio = fullBio.substring(0, shortIndex);
  }
  
  // Remove the "**Full Bio:**" prefix if present
  if (mainBio.startsWith("**Full Bio:**")) {
    mainBio = mainBio.substring("**Full Bio:**".length).trim();
  }
  return formatMarkdownBold(mainBio);
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
    } else if (slug && !isLoading && !isError) {
        document.title = `Media Kit | ${slug}`;
    } else if (isError) {
        document.title = "Media Kit Not Found";
    }
  }, [mediaKit, slug, isLoading, isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 animate-pulse">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-6 md:p-10">
          <Skeleton className="h-60 w-full" />
          <div className="pt-10 grid md:grid-cols-2 gap-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-20 w-full mt-8" />
          <Skeleton className="h-32 w-full mt-8" />
        </div>
      </div>
    );
  }

  if (isError || !mediaKit) {
    return <NotFound />;
  }

  // Handle multiple possible headshot URL structures
  const primaryHeadshot = (mediaKit as any).headshot_image_url || // New backend format
                          mediaKit.headshot_image_urls?.[0]?.url || // Array format
                          (mediaKit as any).image_urls?.headshot_url; // Object format
  
  // Debug logging to check what image data we're getting
  console.log('🖼️ Media Kit Image Debug:', {
    headshot_image_url: (mediaKit as any).headshot_image_url,
    headshot_image_urls: mediaKit.headshot_image_urls,
    image_urls: (mediaKit as any).image_urls,
    primaryHeadshot,
    logo_image_url: mediaKit.logo_image_url
  });
  // Use tagline from mediaKit if available, otherwise fallback to a generic or empty string
  const tagline = mediaKit.tagline || mediaKit.headline || "Podcast Guest"; // Fallback for tagline

  // Extracting At-a-Glance stats from custom_sections
  const atAGlanceSection = mediaKit.custom_sections?.find(section => section.title === "At a Glance Stats");
  const atAGlanceStats = atAGlanceSection?.content as PublicMediaKitData['at_a_glance_stats_custom'] | undefined;

  // Parsing contact_information_for_booking
  let bookingInfo: { booking_email?: string; website?: string; phone?: string; preferred_contact_for_hosts?: string; } = {};
  if (mediaKit.contact_information_for_booking) {
    try {
      bookingInfo = JSON.parse(mediaKit.contact_information_for_booking);
    } catch (e) {
      console.error("Failed to parse contact_information_for_booking:", e);
      // Fallback or default behavior if parsing fails
      if (typeof mediaKit.contact_information_for_booking === 'string' && mediaKit.contact_information_for_booking.startsWith('mailto:')) {
        bookingInfo.booking_email = mediaKit.contact_information_for_booking.substring('mailto:'.length);
      } else if (typeof mediaKit.contact_information_for_booking === 'string' && mediaKit.contact_information_for_booking.startsWith('http')) {
        bookingInfo.website = mediaKit.contact_information_for_booking;
      }
    }
  }
  
  const mainBioHtml = getMainBio(mediaKit.full_bio_content);

  const socialLinks = mediaKit.person_social_links?.map(link => {
    let IconComponent;
    const platformLower = link.platform.toLowerCase();
    
    if (platformLower.includes('linkedin')) IconComponent = Linkedin;
    else if (platformLower.includes('twitter') || platformLower.includes('x.com')) IconComponent = Twitter;
    else if (platformLower.includes('instagram')) IconComponent = Instagram;
    else if (platformLower.includes('facebook')) IconComponent = Facebook;
    else if (platformLower.includes('youtube')) IconComponent = Youtube;
    // Add more platform checks and icons as needed

    const targetUrl = link.url || link.handle;

    if (IconComponent && targetUrl) {
      return {
        platform: link.platform,
        url: targetUrl,
        Icon: IconComponent,
      };
    }
    return null;
  }).filter(Boolean) as Array<{ platform: string; url: string; Icon: React.ElementType }> || [];

  return (
    <div className="min-h-screen bg-slate-200 font-sans">
      <header 
        className="relative bg-slate-800 text-white py-16 md:py-24 bg-cover bg-center shadow-xl"
        style={{ backgroundImage: mediaKit.theme_preference === 'dark_banner_only' ? 'none' : "url('https://images.unsplash.com/photo-1507646871303-366937386fba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
      >
        {mediaKit.theme_preference !== 'dark_banner_only' && <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>}
        
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center text-center md:text-left gap-8 md:gap-10">
          <div className="flex-shrink-0">
            {primaryHeadshot ? (
              <img 
                src={primaryHeadshot} 
                alt={mediaKit.client_full_name || "Headshot"} 
                className="w-40 h-40 md:w-52 md:h-52 rounded-full object-cover border-4 border-slate-300 shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <Avatar className="w-40 h-40 md:w-52 md:h-52 border-4 border-slate-300 shadow-2xl">
                <AvatarFallback className="bg-slate-600 text-white text-4xl md:text-6xl font-bold">
                  {getInitials(mediaKit.client_full_name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex-grow">
            {mediaKit.client_full_name && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white filter drop-shadow-lg">
                {mediaKit.client_full_name}
              </h1>
            )}
            {tagline && (
              <p className="mt-3 text-xl sm:text-2xl text-slate-200 filter drop-shadow-md" dangerouslySetInnerHTML={{ __html: formatMarkdownBold(tagline) }} />
            )}
            {socialLinks.length > 0 && (
              <div className="mt-6 flex justify-center md:justify-start space-x-5">
                {socialLinks.map(({Icon, url, platform}) => (
                  <a 
                    key={platform} 
                    href={url!} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-slate-300 hover:text-white transform hover:scale-110 transition-transform duration-200"
                    aria-label={`Link to ${platform}`}
                  >
                    <Icon className="h-7 w-7" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-white -mt-12 md:-mt-20 rounded-t-xl shadow-2xl">
        <div className="space-y-12 md:space-y-16 p-4 md:p-6">
          {mainBioHtml && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-5 tracking-tight">About {mediaKit.client_full_name && mediaKit.client_full_name.split(' ')[0]}</h2>
              <div 
                className="prose prose-lg prose-slate max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: mainBioHtml.replace(/\\n/g, '<br />') }} 
              />
            </section>
          )}

          {(atAGlanceStats || (mediaKit.key_achievements && mediaKit.key_achievements.length > 0)) && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight text-center">At-a-Glance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {atAGlanceStats?.keynoteEngagements && (
                  <div className="bg-slate-50 hover:bg-slate-100 p-6 rounded-xl shadow-lg border border-slate-200 transition-all duration-300">
                    <p className="text-5xl font-extrabold text-primary filter drop-shadow-sm">{atAGlanceStats.keynoteEngagements}</p>
                    <p className="text-md text-slate-600 mt-2">Keynote Engagements</p>
                  </div>
                )}
                {atAGlanceStats?.yearsOfExperience && (
                  <div className="bg-slate-50 hover:bg-slate-100 p-6 rounded-xl shadow-lg border border-slate-200 transition-all duration-300">
                    <p className="text-5xl font-extrabold text-primary filter drop-shadow-sm">{atAGlanceStats.yearsOfExperience}</p>
                    <p className="text-md text-slate-600 mt-2">Years of Experience</p>
                  </div>
                )}
                {atAGlanceStats?.emailSubscribers && (
                  <div className="bg-slate-50 hover:bg-slate-100 p-6 rounded-xl shadow-lg border border-slate-200 transition-all duration-300">
                    <p className="text-5xl font-extrabold text-primary filter drop-shadow-sm">{atAGlanceStats.emailSubscribers}</p>
                    <p className="text-md text-slate-600 mt-2">Email Subscribers</p>
                  </div>
                )}
              </div>
              {mediaKit.key_achievements && mediaKit.key_achievements.length > 0 && (
                 <div className="mt-8 bg-slate-50 p-6 rounded-xl shadow-lg border border-slate-200">
                   <h3 className="text-2xl font-semibold text-slate-700 mb-3 text-center">Key Achievements</h3>
                   <ul className="list-disc list-inside text-slate-600 space-y-2 marker:text-primary">
                      {mediaKit.key_achievements.map((achievement, index) => (
                          <li key={index} className="ml-2">{achievement}</li>
                      ))}
                   </ul>
                 </div>
              )}
            </section>
          )}
          
          {/* Social Media Stats Section */}
          {(mediaKit.social_media_stats?.linkedin_followers_count || mediaKit.social_media_stats?.twitter_followers_count) && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Social Snapshot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {mediaKit.social_media_stats?.linkedin_followers_count && (
                  <Card className="bg-slate-50 hover:bg-slate-100 p-5 rounded-xl shadow-lg border border-slate-200 transition-all duration-300 flex items-center space-x-4">
                    <Linkedin className="h-10 w-10 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-3xl font-extrabold text-slate-700">
                        {mediaKit.social_media_stats.linkedin_followers_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">LinkedIn Followers</p>
                    </div>
                  </Card>
                )}
                {mediaKit.social_media_stats?.twitter_followers_count && (
                  <Card className="bg-slate-50 hover:bg-slate-100 p-5 rounded-xl shadow-lg border border-slate-200 transition-all duration-300 flex items-center space-x-4">
                    <Twitter className="h-10 w-10 text-sky-500 flex-shrink-0" />
                    <div>
                      <p className="text-3xl font-extrabold text-slate-700">
                        {mediaKit.social_media_stats.twitter_followers_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">Twitter Followers</p>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          )}
          
          {mediaKit.previous_appearances && mediaKit.previous_appearances.length > 0 && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Previous Appearances</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {mediaKit.previous_appearances.map((app, index) => (
                  <Card key={index} className="hover:shadow-xl transition-shadow duration-300 border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-xl text-slate-700">{app.title || app.outlet || "Appearance"}</CardTitle>
                      {app.outlet && app.title !== app.outlet && <CardDescription className="text-sm text-slate-500">{app.outlet}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      {app.description && <p className="text-sm text-slate-600 mb-3">{app.description}</p>}
                      {app.url && (
                        <Button variant="outline" asChild className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            {app.type === 'speaking_clip' ? "Watch Clip" : "Listen/View"} <ExternalLink className="ml-2 h-4 w-4"/>
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {mediaKit.talking_points && mediaKit.talking_points.length > 0 && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Talking Points</h2>
              <div className="space-y-4">
                {mediaKit.talking_points.map((point, index) => (
                  <Card key={index} className="bg-slate-50 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: formatMarkdownBold(point.title) }} />
                    </CardHeader>
                    {point.description && (
                        <CardContent>
                            <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: formatMarkdownBold(point.description) }} />
                        </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {mediaKit.sample_questions && mediaKit.sample_questions.length > 0 && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight flex items-center">
                <Mic className="h-8 w-8 mr-3 text-primary"/>Sample Questions
              </h2>
              <div className="columns-1 md:columns-2 gap-x-8">
                <ul className="list-none space-y-3 pl-0 text-slate-700">
                  {mediaKit.sample_questions.map((question, index) => (
                    <li key={index} className="mb-2 p-3 bg-slate-50 rounded-md border border-slate-200 flex items-start">
                      <CheckCircle className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-1" />
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {mediaKit.testimonials_section && (
            <section className="py-4">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Testimonials</h2>
              <div 
                className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 md:p-8 rounded-xl shadow-xl prose prose-lg prose-slate max-w-none leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: formatMarkdownBold(mediaKit.testimonials_section).replace(/\\n\\*\\s/g, '</ul><ul class="list-disc list-inside mt-2">').replace(/\\*\\s/g, '<li class="mb-1">') }}
              />
            </section>
          )}
          
          {(bookingInfo.booking_email || bookingInfo.website || mediaKit.call_to_action_text) && (
            <section className="text-center py-10 md:py-12 bg-slate-800 rounded-xl my-8 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 px-4">
                {mediaKit.call_to_action_text || `Interested in Booking ${mediaKit.client_full_name && mediaKit.client_full_name.split(' ')[0] || "This Guest"}?`}
              </h2>
              {bookingInfo.preferred_contact_for_hosts && (
                <p className="text-slate-300 mb-8 max-w-lg mx-auto px-4">{bookingInfo.preferred_contact_for_hosts}</p>
              )}
              <Button 
                size="lg" 
                className="bg-white hover:bg-slate-200 text-slate-800 font-semibold px-12 py-4 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                asChild={!!(bookingInfo.website || bookingInfo.booking_email)}
              >
                {bookingInfo.website ? (
                  <a href={bookingInfo.website.startsWith('http') ? bookingInfo.website : `https://${bookingInfo.website}`} target="_blank" rel="noopener noreferrer">
                    Visit Website <ExternalLink className="ml-2 h-5 w-5"/>
                  </a>
                ) : bookingInfo.booking_email ? (
                  <a href={`mailto:${bookingInfo.booking_email}?subject=Podcast Booking Inquiry for ${mediaKit.client_full_name || "Guest"}`}>
                    Send Email <Mail className="ml-2 h-5 w-5"/>
                  </a>
                ) : (
                  <span>{mediaKit.call_to_action_text || `Book ${mediaKit.client_full_name || "Guest"}`}</span>
                )}
              </Button>
            </section>
          )}

          {mediaKit.client_role === 'prospect' && ( 
            <section className="px-6 md:px-10 py-10 bg-primary/10 border-t-4 border-primary text-center mt-12 rounded-xl shadow-lg">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-3 text-slate-800">Activate Your Full Media Kit</h2>
              <p className="mb-6 max-w-xl mx-auto text-md text-slate-600">
                This is a preview of your media kit. Sign up to save your progress, unlock full editing capabilities, add GDoc content, get automated social stats, and much more!
              </p>
              <RouterLink href={`/signup?prospect_person_id=${mediaKit.person_id}&prospect_campaign_id=${mediaKit.campaign_id}`}>
                <Button size="default" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 shadow-md transition-transform hover:scale-105">
                  Sign Up & Unlock Features <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </RouterLink>
            </section>
          )}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-10 mt-0 border-t border-slate-700">
        <p className="text-sm">&copy; {new Date().getFullYear()} {mediaKit.client_full_name || "Your Name"}. All Rights Reserved.</p>
        {mediaKit.logo_image_url && (
            <img src={mediaKit.logo_image_url} alt={`${mediaKit.client_full_name || "Client"} Logo`} className="h-10 mx-auto my-4 opacity-80"/>
        )}
        <p className="text-xs mt-2">Media Kit powered by PGL System</p>
      </footer>
    </div>
  );
}