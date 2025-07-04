import { useState, useRef, useEffect } from "react";
import { X, Plus, Check, Edit2, AlertCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface KeywordEditorProps {
  keywords: string[];
  onUpdate: (keywords: string[]) => void | Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
  maxKeywords?: number;
  minKeywords?: number;
  maxLength?: number;
  title?: string;
  description?: string;
  className?: string;
  showGeneratedBadge?: boolean;
}

export function KeywordEditor({
  keywords: initialKeywords,
  onUpdate,
  isLoading = false,
  readOnly = false,
  maxKeywords = 20,
  minKeywords = 3,
  maxLength = 30,
  title = "Campaign Keywords",
  description = "Keywords help us find the most relevant podcasts for your campaign. Add specific terms related to your expertise, industry, and topics.",
  className,
  showGeneratedBadge = false,
}: KeywordEditorProps) {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [isEditing, setIsEditing] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setKeywords(initialKeywords);
  }, [initialKeywords]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    
    if (!trimmed) return;
    
    if (trimmed.length > maxLength) {
      toast({
        title: "Keyword too long",
        description: `Keywords must be ${maxLength} characters or less.`,
        variant: "destructive",
      });
      return;
    }
    
    if (keywords.includes(trimmed)) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword already exists.",
        variant: "destructive",
      });
      return;
    }
    
    if (keywords.length >= maxKeywords) {
      toast({
        title: "Maximum keywords reached",
        description: `You can have up to ${maxKeywords} keywords.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedKeywords = [...keywords, trimmed];
    setKeywords(updatedKeywords);
    setNewKeyword("");
  };

  const handleRemoveKeyword = (index: number) => {
    if (keywords.length <= minKeywords) {
      toast({
        title: "Minimum keywords required",
        description: `You must have at least ${minKeywords} keywords.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(updatedKeywords);
  };

  const handleEditKeyword = (index: number) => {
    setEditingIndex(index);
    setEditingValue(keywords[index]);
  };

  const handleUpdateKeyword = () => {
    if (editingIndex === null) return;
    
    const trimmed = editingValue.trim().toLowerCase();
    
    if (!trimmed) {
      handleRemoveKeyword(editingIndex);
      setEditingIndex(null);
      setEditingValue("");
      return;
    }
    
    if (trimmed.length > maxLength) {
      toast({
        title: "Keyword too long",
        description: `Keywords must be ${maxLength} characters or less.`,
        variant: "destructive",
      });
      return;
    }
    
    if (keywords.includes(trimmed) && keywords[editingIndex] !== trimmed) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword already exists.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedKeywords = [...keywords];
    updatedKeywords[editingIndex] = trimmed;
    setKeywords(updatedKeywords);
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleSave = async () => {
    if (keywords.length < minKeywords) {
      toast({
        title: "Not enough keywords",
        description: `Please add at least ${minKeywords} keywords.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onUpdate(keywords);
      setIsEditing(false);
      toast({
        title: "Keywords updated",
        description: "Your campaign keywords have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update keywords",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setKeywords(initialKeywords);
    setIsEditing(false);
    setNewKeyword("");
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editingIndex !== null) {
        handleUpdateKeyword();
      } else {
        handleAddKeyword();
      }
    } else if (e.key === "Escape") {
      if (editingIndex !== null) {
        setEditingIndex(null);
        setEditingValue("");
      } else {
        setNewKeyword("");
      }
    }
  };

  if (readOnly || !isEditing) {
    return (
      <Card className={cn("border-l-4 border-l-primary", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {title}
                {showGeneratedBadge && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Keywords
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {keywords.length > 0 ? (
              keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {keyword}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No keywords added yet.</p>
            )}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} • 
            Used for podcast discovery and matching
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <div key={index} className="group">
              {editingIndex === index ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={editInputRef}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleUpdateKeyword}
                    className="h-7 w-32 text-sm"
                  />
                </div>
              ) : (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-secondary/80 transition-colors group"
                  onClick={() => handleEditKeyword(index)}
                >
                  <span>{keyword}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveKeyword(index);
                    }}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${keyword}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          ))}
          
          {keywords.length < maxKeywords && (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add keyword..."
                className="h-7 w-32 text-sm"
                maxLength={maxLength}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className="h-7 w-7 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{keywords.length}/{maxKeywords} keywords</span>
            {keywords.length < minKeywords && (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Add at least {minKeywords - keywords.length} more
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading || keywords.length < minKeywords}
            >
              {isLoading ? "Saving..." : "Save Keywords"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}