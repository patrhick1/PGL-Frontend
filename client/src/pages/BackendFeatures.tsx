import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Search, 
  Mail, 
  BarChart3, 
  Workflow, 
  Users, 
  Mic, 
  Target,
  Zap,
  FileText,
  Globe,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Cpu,
  MessageSquare,
  Bot,
  Settings,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";

interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  apis: string[];
  icon: any;
}

const workflowStages: WorkflowStage[] = [
  {
    id: "onboarding",
    title: "Client & Campaign Onboarding",
    description: "Add clients and set up campaigns with AI-generated bios and angles",
    status: "completed",
    apis: ["POST /people/", "POST /campaigns/", "POST /campaigns/{id}/generate-angles-bio"],
    icon: Users
  },
  {
    id: "discovery",
    title: "Podcast Discovery & Matching",
    description: "AI-powered podcast discovery using ListenNotes and Podscan with intelligent matching",
    status: "in-progress",
    apis: ["POST /match-suggestions/campaigns/{id}/discover", "GET /media/", "POST /tasks/run/enrichment_pipeline"],
    icon: Search
  },
  {
    id: "enrichment",
    title: "Media Enrichment & Analysis",
    description: "Background enrichment with social links, host details, and quality scoring",
    status: "in-progress",
    apis: ["POST /tasks/run/enrichment_pipeline", "POST /tasks/run/fetch_podcast_episodes"],
    icon: Database
  },
  {
    id: "transcription",
    title: "Episode Transcription & AI Analysis",
    description: "AI transcription and summarization of podcast episodes for better targeting",
    status: "pending",
    apis: ["POST /tasks/run/transcribe_podcast", "GET /episodes/"],
    icon: FileText
  },
  {
    id: "pitch",
    title: "AI Pitch Generation & Review",
    description: "Generate personalized pitches with AI and team review workflow",
    status: "pending",
    apis: ["POST /pitches/generate", "PATCH /pitches/generations/{id}/approve", "POST /pitches/{id}/send"],
    icon: Brain
  },
  {
    id: "tracking",
    title: "Response Tracking & Placement",
    description: "Webhook-based response tracking with Instantly.ai and Attio CRM integration",
    status: "pending",
    apis: ["POST /webhooks/instantly-email-sent", "POST /webhooks/instantly-reply-received", "POST /placements/"],
    icon: Target
  }
];

const systemFeatures = [
  {
    category: "AI & Automation",
    icon: Bot,
    features: [
      "Bio & Angles Generation with GPT-4",
      "Personalized Pitch Creation",
      "Episode Transcription & Summarization",
      "Quality Score Calculation",
      "Intelligent Podcast Matching"
    ]
  },
  {
    category: "Data Sources",
    icon: Globe,
    features: [
      "ListenNotes API Integration",
      "Podscan Database Access",
      "Apify Web Scraping",
      "RSS Feed Processing",
      "Social Media Link Discovery"
    ]
  },
  {
    category: "CRM Integration",
    icon: MessageSquare,
    features: [
      "Instantly.ai Email Automation",
      "Attio CRM Synchronization",
      "Webhook Response Processing",
      "Real-time Status Updates",
      "Lead Management"
    ]
  },
  {
    category: "Analytics & Reporting",
    icon: BarChart3,
    features: [
      "AI Usage Cost Tracking",
      "Campaign Performance Metrics",
      "Google Sheets Integration",
      "Weekly Status Reports",
      "ROI Analytics"
    ]
  }
];

const backgroundTasks = [
  { name: "Episode Sync", status: "running", progress: 75, description: "Fetching latest episodes from RSS feeds" },
  { name: "Media Enrichment", status: "queued", progress: 0, description: "Enriching podcast metadata with social links" },
  { name: "Transcription Pipeline", status: "running", progress: 45, description: "AI transcription of flagged episodes" },
  { name: "Quality Scoring", status: "completed", progress: 100, description: "Calculating podcast quality scores" }
];

export default function BackendFeatures() {
  const [selectedStage, setSelectedStage] = useState("onboarding");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="h-4 w-4 text-green-600" />;
      case "queued": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          PGL Backend Integration
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive podcast outreach automation system with AI-powered discovery, 
          personalized pitch generation, and intelligent placement tracking
        </p>
      </div>

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow">Workflow Overview</TabsTrigger>
          <TabsTrigger value="features">System Features</TabsTrigger>
          <TabsTrigger value="tasks">Background Tasks</TabsTrigger>
          <TabsTrigger value="apis">API Endpoints</TabsTrigger>
        </TabsList>

        {/* Workflow Overview */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-6 w-6 text-purple-600" />
                End-to-End Podcast Outreach Workflow
              </CardTitle>
              <CardDescription>
                Complete automation from client onboarding to successful podcast placements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflowStages.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <Card 
                      key={stage.id} 
                      className={`cursor-pointer transition-all ${
                        selectedStage === stage.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedStage(stage.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Icon className="h-8 w-8 text-purple-600" />
                          <Badge className={getStatusColor(stage.status)}>
                            {stage.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{stage.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                          {stage.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">Key APIs:</p>
                          {stage.apis.slice(0, 2).map((api, i) => (
                            <code key={i} className="text-xs bg-gray-100 px-2 py-1 rounded block">
                              {api}
                            </code>
                          ))}
                          {stage.apis.length > 2 && (
                            <p className="text-xs text-gray-400">+{stage.apis.length - 2} more</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Selected Stage Details */}
              {selectedStage && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>
                      {workflowStages.find(s => s.id === selectedStage)?.title} - Detailed APIs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workflowStages.find(s => s.id === selectedStage)?.apis.map((api, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <code className="text-sm font-mono">{api}</code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Features */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemFeatures.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-6 w-6 text-purple-600" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Integration Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-600" />
                Integration Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">AI-Powered</h3>
                  <p className="text-sm text-gray-600">GPT-4 integration for intelligent content generation and analysis</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Workflow className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Fully Automated</h3>
                  <p className="text-sm text-gray-600">Background processes handle discovery, enrichment, and tracking</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Scalable</h3>
                  <p className="text-sm text-gray-600">PostgreSQL backend with robust API architecture</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Background Tasks */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-6 w-6 text-blue-600" />
                Background Task Monitor
              </CardTitle>
              <CardDescription>
                Real-time status of automated background processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backgroundTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    {getTaskStatusIcon(task.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{task.name}</h4>
                        <span className="text-sm text-gray-500">{task.progress}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Trigger Episode Sync
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Start Transcription
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Run Enrichment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Endpoints */}
        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-gray-600" />
                Available API Endpoints
              </CardTitle>
              <CardDescription>
                Complete FastAPI backend with comprehensive podcast outreach capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Authentication */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Authentication & Authorization
                  </h3>
                  <div className="grid gap-2">
                    <code className="text-sm bg-blue-50 border border-blue-200 px-3 py-2 rounded">POST /token - Login and get session</code>
                    <code className="text-sm bg-blue-50 border border-blue-200 px-3 py-2 rounded">GET /auth/me - Get current user info</code>
                  </div>
                </div>

                {/* Campaign Management */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Campaign Management
                  </h3>
                  <div className="grid gap-2">
                    <code className="text-sm bg-green-50 border border-green-200 px-3 py-2 rounded">GET /campaigns/ - List all campaigns</code>
                    <code className="text-sm bg-green-50 border border-green-200 px-3 py-2 rounded">POST /campaigns/ - Create new campaign</code>
                    <code className="text-sm bg-green-50 border border-green-200 px-3 py-2 rounded">POST /campaigns/{id}/generate-angles-bio - AI generation</code>
                  </div>
                </div>

                {/* Media & Discovery */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Media & Discovery
                  </h3>
                  <div className="grid gap-2">
                    <code className="text-sm bg-purple-50 border border-purple-200 px-3 py-2 rounded">GET /media/ - List podcast database</code>
                    <code className="text-sm bg-purple-50 border border-purple-200 px-3 py-2 rounded">POST /match-suggestions/campaigns/{id}/discover - AI discovery</code>
                    <code className="text-sm bg-purple-50 border border-purple-200 px-3 py-2 rounded">PATCH /match-suggestions/{id}/approve - Approve matches</code>
                  </div>
                </div>

                {/* Pitch Generation */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Pitch Generation
                  </h3>
                  <div className="grid gap-2">
                    <code className="text-sm bg-yellow-50 border border-yellow-200 px-3 py-2 rounded">POST /pitches/generate - Generate AI pitches</code>
                    <code className="text-sm bg-yellow-50 border border-yellow-200 px-3 py-2 rounded">PATCH /pitches/generations/{id}/approve - Approve pitches</code>
                    <code className="text-sm bg-yellow-50 border border-yellow-200 px-3 py-2 rounded">POST /pitches/{id}/send - Send via Instantly.ai</code>
                  </div>
                </div>

                {/* Background Tasks */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Background Tasks & Monitoring
                  </h3>
                  <div className="grid gap-2">
                    <code className="text-sm bg-gray-50 border border-gray-200 px-3 py-2 rounded">GET /tasks/ - List running tasks</code>
                    <code className="text-sm bg-gray-50 border border-gray-200 px-3 py-2 rounded">POST /tasks/run/enrichment_pipeline - Trigger enrichment</code>
                    <code className="text-sm bg-gray-50 border border-gray-200 px-3 py-2 rounded">POST /tasks/run/transcribe_podcast - AI transcription</code>
                    <code className="text-sm bg-gray-50 border border-gray-200 px-3 py-2 rounded">GET /ai-usage/ - Monitor AI costs</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Ready to Connect Your PGL Backend?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your frontend is now designed to showcase and integrate with all these powerful backend features. 
              Connect your FastAPI server to unlock the full potential of automated podcast outreach!
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Connect Backend Server
              </Button>
              <Button variant="outline">
                View Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}