import { useEffect, useRef, useState } from "react";

interface TweetEmbedProps {
  tweetUrl: string;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTweet: (tweetId: string, element: HTMLElement, options?: object) => Promise<HTMLElement>;
      };
    };
  }
}

// Extract tweet ID from various Twitter/X URL formats
const extractTweetId = (url: string): string | null => {
  // Match patterns like:
  // https://twitter.com/user/status/123456789
  // https://x.com/user/status/123456789
  // https://twitter.com/user/status/123456789?s=20
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
};

export const TweetEmbed = ({ tweetUrl }: TweetEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId || !containerRef.current) {
      setError(true);
      setLoading(false);
      return;
    }

    const loadTwitterScript = () => {
      return new Promise<void>((resolve) => {
        if (window.twttr) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const embedTweet = async () => {
      try {
        await loadTwitterScript();
        
        if (window.twttr && containerRef.current) {
          // Clear container
          containerRef.current.innerHTML = "";
          
          const element = await window.twttr.widgets.createTweet(
            tweetId,
            containerRef.current,
            {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              dnt: true,
              align: "center",
            }
          );
          
          if (!element) {
            setError(true);
          }
        }
      } catch (err) {
        console.error("Error embedding tweet:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    embedTweet();
  }, [tweetUrl]);

  if (error) {
    return (
      <div className="my-6 p-4 bg-secondary/30 rounded-lg border border-border">
        <a 
          href={tweetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Ver tweet en X
        </a>
      </div>
    );
  }

  return (
    <div className="my-6" ref={containerRef}>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-pulse bg-secondary/50 rounded-xl w-full max-w-[550px] h-[200px]" />
        </div>
      )}
    </div>
  );
};

// Check if a line is a tweet URL
export const isTweetUrl = (text: string): boolean => {
  const trimmed = text.trim();
  return /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(trimmed);
};
