// client/src/pages/Home.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Mic, 
  Search, 
  FileText, 
  Send, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  Target,
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import logoName from "@/img/PGL logo name.png";
import logoIcon from "@/img/Podcast Guest Launch Logo.png";
import peopleConversing from "@/img/people conversing.png";
import { useRef, useState, useEffect } from "react";

// Import testimonial images
import testimonial1 from "@/PGL Assets/Client Case Studies/Website (1000x800)/1.png";
import testimonial2 from "@/PGL Assets/Client Case Studies/Website (1000x800)/2.png";
import testimonial3 from "@/PGL Assets/Client Case Studies/Website (1000x800)/3.png";
import testimonial4 from "@/PGL Assets/Client Case Studies/Website (1000x800)/4.png";
import testimonial5 from "@/PGL Assets/Client Case Studies/Website (1000x800)/5.png";
import testimonial6 from "@/PGL Assets/Client Case Studies/Website (1000x800)/6.png";

export default function Home() {
  const testimonialRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const testimonialImages = [
    testimonial1,
    testimonial2,
    testimonial3,
    testimonial4,
    testimonial5,
    testimonial6
  ];

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialRef.current) {
      const scrollAmount = 400;
      const currentScroll = testimonialRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      testimonialRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const checkScrollButtons = () => {
    if (testimonialRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = testimonialRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Check scroll buttons on mount and resize
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logoName} alt="Podcast Guest Launch" className="h-10" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10">
          <img src={logoIcon} alt="" className="h-96 w-96" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Land High-Impact Podcast Interviews — Without Cold Outreach
            </h1>
            <p className="text-lg md:text-xl mb-10 text-indigo-100 max-w-2xl mx-auto">
              Our AI-powered platform finds your perfect shows, vets them for quality, 
              creates a professional media kit, and sends personalized pitches for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Free Trial
                </Button>
              </Link>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
                <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg">
                  See How It Works
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-indigo-200">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Simple 3-Step Process */}
      <section className="py-16 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              It's Really This Simple
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tell Us Your Story</h3>
              <p className="text-gray-600">Share your expertise and what makes you unique</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Approve Podcasts</h3>
              <p className="text-gray-600">We find shows, you pick which ones to pitch</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Famous</h3>
              <p className="text-gray-600">Show up, shine, and grow your influence</p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg shadow-lg">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600">500+</div>
              <div className="text-sm text-gray-600 mt-1">Podcasts Booked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">85%</div>
              <div className="text-sm text-gray-600 mt-1">Acceptance Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">20hrs</div>
              <div className="text-sm text-gray-600 mt-1">Saved Per Week</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">4.9★</div>
              <div className="text-sm text-gray-600 mt-1">Client Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Get Booked
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stop spending hours searching for shows and crafting pitches. 
              We handle the entire process so you can focus on being a great guest.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Your Perfect Shows</h3>
              <p className="text-gray-600 mb-4">
                We match you with podcasts whose audience fits your niche — no endless searching required.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  AI-powered matching algorithm
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Verified show metrics & reach
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Topic & audience alignment
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Media Kit That Sells You</h3>
              <p className="text-gray-600 mb-4">
                Our system builds a beautiful media kit from your bio and social presence so hosts instantly see your value.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Professional one-pager design
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Key talking points & expertise
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Social proof & credentials
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Hands-Off Outreach</h3>
              <p className="text-gray-600 mb-4">
                Custom AI-crafted pitches sent from your email — so you look personal, not spammy.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Personalized for each show
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Follow-up sequences included
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Response tracking & analytics
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img src={peopleConversing} alt="" className="w-full h-full object-cover object-center" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From profile to podcast booking in 4 simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Tell Us About You</h3>
                  <p className="text-gray-600">
                    Share your goals, niche, and topics you love to speak on. Our onboarding 
                    process takes less than 10 minutes and helps us understand your unique value.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">We Find & Vet Shows</h3>
                  <p className="text-gray-600">
                    Using Podscan, Listen Notes, and our AI filters, we identify podcasts that 
                    match your expertise and audience. Every show is vetted for quality and relevance.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">You Approve</h3>
                  <p className="text-gray-600">
                    Review our curated list of podcast matches. You have full control over which 
                    shows to pitch. Approve with one click or request different options.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">We Pitch & Book</h3>
                  <p className="text-gray-600">
                    Custom pitches are sent on your behalf. We handle follow-ups, scheduling, 
                    and booking confirmations. You just show up prepared to deliver value.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Results from Our Clients
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join hundreds of thought leaders, authors, and entrepreneurs who are 
              growing their influence through strategic podcast appearances
            </p>
          </div>

          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={() => scrollTestimonials('left')}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg transition-all ${
                canScrollLeft 
                  ? 'opacity-100 hover:scale-110 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>

            <button
              onClick={() => scrollTestimonials('right')}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg transition-all ${
                canScrollRight 
                  ? 'opacity-100 hover:scale-110 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>

            {/* Testimonial Carousel */}
            <div 
              ref={testimonialRef}
              onScroll={checkScrollButtons}
              className="overflow-x-auto scrollbar-hide scroll-smooth"
            >
              <div className="flex gap-6 px-12">
                {testimonialImages.map((image, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 w-[500px] h-[400px] relative group"
                  >
                    <img 
                      src={image} 
                      alt={`Client testimonial ${index + 1}`}
                      className="w-full h-full object-contain rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonialImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (testimonialRef.current) {
                      const scrollPosition = index * 530; // 500px width + 30px gap
                      testimonialRef.current.scrollTo({
                        left: scrollPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="w-2 h-2 rounded-full bg-gray-300 hover:bg-indigo-600 transition-colors"
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Professional Growth
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature designed to maximize your podcast booking success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <Target className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Smart Targeting</h3>
                <p className="text-sm text-gray-600">
                  AI analyzes show topics, guest history, and audience demographics
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Users className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Campaign Management</h3>
                <p className="text-sm text-gray-600">
                  Run multiple outreach campaigns for different topics or audiences
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <TrendingUp className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Performance Tracking</h3>
                <p className="text-sm text-gray-600">
                  Monitor open rates, responses, and booking conversion metrics
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Automated Follow-ups</h3>
                <p className="text-sm text-gray-600">
                  Strategic follow-up sequences that respect host boundaries
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Email Integration</h3>
                <p className="text-sm text-gray-600">
                  Sends from your email address for authentic communication
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Sparkles className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">AI Personalization</h3>
                <p className="text-sm text-gray-600">
                  Each pitch references specific episodes and show themes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Be the Guest Every Host Wants
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Start landing podcast interviews in less than 7 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-indigo-200">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={logoName} alt="Podcast Guest Launch" className="h-10 brightness-0 invert" />
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            © 2024 PodcastGuestLaunch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}