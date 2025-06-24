import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Check, Globe, Twitter, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";
import { Button } from './ui/button';

// --- Interfaces (Should align with backend schemas) ---
interface Media {
  name: string | null;
  image_url?: string | null;
  website?: string | null;
  host_names?: string[] | null;
  category?: string | null;
  quality_score?: number | null;
  quality_score_audience?: number | null;
  quality_score_recency?: number | null;
  quality_score_frequency?: number | null;
  podcast_twitter_url?: string | null;
  podcast_linkedin_url?: string | null;
  podcast_instagram_url?: string | null;
  podcast_facebook_url?: string | null;
  podcast_youtube_url?: string | null;
  podcast_tiktok_url?: string | null;
}

interface MatchSuggestion {
  match_id: number;
  media_id: number;
  media_name?: string; // This is a fallback - make it optional
  vetting_reasoning?: string | null;
  vetting_score?: number | null;
  matched_keywords?: string[] | null;
  media?: Media; // The enriched media object
}

interface MatchIntelligenceCardProps {
  match: MatchSuggestion;
  onApprove: (matchId: number) => void;
  onReject: (matchId: number) => void;
  isActionPending: boolean;
}


export const MatchIntelligenceCard = ({ match, onApprove, onReject, isActionPending }: MatchIntelligenceCardProps) => {
  const media = match.media;
  if (!media) {
    // Fallback: Show basic card with available information instead of error
    return (
      <div className="match-card bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-lg">{match.media_name || `Media ID: ${match.media_id}`}</h3>
          <p className="text-sm text-yellow-600">⚠️ Detailed media information is being loaded...</p>
        </div>
        <div className="p-4">
          {match.vetting_score !== null && match.vetting_score !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <strong className="text-blue-800">PGL Match Score: {Math.round(match.vetting_score)}/100</strong>
            </div>
          )}
          {match.vetting_reasoning && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-4">
              <strong className="text-purple-800">AI Assessment:</strong>
              <p className="text-xs text-purple-900 italic mt-1">"{match.vetting_reasoning}"</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t flex gap-3">
          <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => onApprove(match.match_id)}
              disabled={isActionPending}
          >
            <ThumbsUp className="h-4 w-4 mr-2"/>
            Approve
          </Button>
          <Button 
              className="flex-1" 
              variant="destructive"
              onClick={() => onReject(match.match_id)}
              disabled={isActionPending}
          >
            <ThumbsDown className="h-4 w-4 mr-2"/>
            Reject
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="match-card bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-start gap-4">
        <a 
          href={media.website || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:opacity-90 transition-opacity cursor-pointer"
        >
          <img 
            src={media.image_url || '/default-podcast.png'} 
            alt={media.name || 'Podcast Cover'} 
            className="w-20 h-20 rounded-md object-cover border"
          />
        </a>
        <div className="podcast-info flex-1">
          <a 
            href={media.website || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <h3 className="font-bold text-lg">{media.name}</h3>
          </a>
          <p className="text-sm text-gray-600">Host: {media.host_names?.join(', ') || 'N/A'}</p>
          <p className="text-sm text-gray-500">Category: {media.category || 'N/A'}</p>
          
          {/* Social Media Icons */}
          <div className="flex gap-2 mt-2">
            {media.website && (
              <a href={media.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
                <Globe className="h-4 w-4" />
              </a>
            )}
            {media.podcast_twitter_url && (
              <a href={media.podcast_twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {media.podcast_linkedin_url && (
              <a href={media.podcast_linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {media.podcast_instagram_url && (
              <a href={media.podcast_instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {media.podcast_facebook_url && (
              <a href={media.podcast_facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {media.podcast_youtube_url && (
              <a href={media.podcast_youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-600">
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="match-intelligence p-4 space-y-4">
        <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">Match Intelligence</h4>
        
        <div className="intelligence-item p-3 bg-blue-50 border border-blue-200 rounded-md">
          <strong className="flex items-center text-blue-800">
            <Check className="h-4 w-4 mr-2 text-blue-600"/> PGL Match Score: {match.vetting_score !== null && match.vetting_score !== undefined ? `${Math.round(match.vetting_score)}/100` : 'N/A'}
          </strong>
        </div>

        <div className="intelligence-item p-3 bg-purple-50 border border-purple-200 rounded-md">
          <strong className="flex items-center text-purple-800">
             <Check className="h-4 w-4 mr-2 text-purple-600"/> AI-Powered Fit Assessment
          </strong>
          <p className="reasoning text-xs text-purple-900 italic mt-1 pl-6">"{match.vetting_reasoning || 'This podcast is a good fit based on content alignment.'}"</p>
        </div>

      </div>

      <div className="approval-actions p-4 bg-gray-50 border-t flex gap-3">
        <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => onApprove(match.match_id)}
            disabled={isActionPending}
        >
          <ThumbsUp className="h-4 w-4 mr-2"/>
          Approve
        </Button>
        <Button 
            className="flex-1" 
            variant="destructive"
            onClick={() => onReject(match.match_id)}
            disabled={isActionPending}
        >
          <ThumbsDown className="h-4 w-4 mr-2"/>
          Reject
        </Button>
      </div>
    </div>
  );
}; 