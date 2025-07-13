import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSessionStore } from '../store/session';

interface ArticleCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  readTime: string;
  date: string;
  image?: string;
}

const Education: React.FC = () => {
  const sessionStore = useSessionStore();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Redirect to login if not authenticated - DISABLED to prevent race condition
  // AuthReadyGuard will handle authentication check properly
  // React.useEffect(() => {
  //   if (!user && !isLoading) {
  //     navigate("/login");
  //   }
  // }, [user, isLoading, navigate]);
  
  // Sample categories
  const categories: ArticleCategory[] = [
    { id: "1", name: "Technical Analysis", icon: "ri-line-chart-line", count: 12 },
    { id: "2", name: "Fundamental Analysis", icon: "ri-funds-box-line", count: 8 },
    { id: "3", name: "Trading Psychology", icon: "ri-psychotherapy-line", count: 6 },
    { id: "4", name: "Risk Management", icon: "ri-shield-check-line", count: 9 },
    { id: "5", name: "Trading Strategies", icon: "ri-strategy-line", count: 15 },
    { id: "6", name: "Market Structure", icon: "ri-building-line", count: 7 },
  ];
  
  // Sample articles
  const articles: Article[] = [
    {
      id: "1",
      title: "Understanding Moving Averages",
      description: "Learn how to use moving averages to identify trends and potential reversals in the market.",
      category: "Technical Analysis",
      difficulty: "beginner",
      readTime: "5 min",
      date: "May 15, 2023",
    },
    {
      id: "2",
      title: "RSI Indicator Explained",
      description: "Master the Relative Strength Index (RSI) to identify overbought and oversold conditions.",
      category: "Technical Analysis",
      difficulty: "beginner",
      readTime: "7 min",
      date: "May 12, 2023",
    },
    {
      id: "3",
      title: "MACD Trading Strategy",
      description: "A comprehensive guide to using the Moving Average Convergence Divergence (MACD) indicator.",
      category: "Trading Strategies",
      difficulty: "intermediate",
      readTime: "10 min",
      date: "May 10, 2023",
    },
    {
      id: "4",
      title: "Position Sizing and Risk Management",
      description: "Learn how to properly size your positions to manage risk and protect your capital.",
      category: "Risk Management",
      difficulty: "intermediate",
      readTime: "8 min",
      date: "May 8, 2023",
    },
    {
      id: "5",
      title: "The Psychology of FOMO in Trading",
      description: "Understanding and overcoming the Fear Of Missing Out (FOMO) in your trading decisions.",
      category: "Trading Psychology",
      difficulty: "beginner",
      readTime: "6 min",
      date: "May 5, 2023",
    },
    {
      id: "6",
      title: "Advanced Bollinger Bands Strategies",
      description: "Take your trading to the next level with these advanced Bollinger Bands techniques.",
      category: "Trading Strategies",
      difficulty: "advanced",
      readTime: "12 min",
      date: "May 3, 2023",
    },
    {
      id: "7",
      title: "Reading Financial Statements",
      description: "A guide to understanding company financial statements for better investment decisions.",
      category: "Fundamental Analysis",
      difficulty: "intermediate",
      readTime: "15 min",
      date: "May 1, 2023",
    },
    {
      id: "8",
      title: "Market Cycles and Sector Rotation",
      description: "Understanding how different market sectors perform during various economic cycles.",
      category: "Market Structure",
      difficulty: "advanced",
      readTime: "14 min",
      date: "Apr 28, 2023",
    },
  ];
  
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || 
      article.category === categories.find(c => c.id === selectedCategory)?.name;
    
    return matchesSearch && matchesCategory;
  });
  
  const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
    const colors = {
      beginner: "bg-success bg-opacity-10 text-success",
      intermediate: "bg-warning bg-opacity-10 text-warning",
      advanced: "bg-destructive bg-opacity-10 text-destructive",
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };
  
  if (sessionStore.user) {
    return (
      <div className="p-4">
        <div className="min-h-screen flex flex-col">
          <Header />
          
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-800">
              <div className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold font-poppins text-neutral-900 dark:text-white">Educational Wiki</h1>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">Expand your trading knowledge with our comprehensive guides</p>
                </div>
                
                {/* Search and Filter */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <i className="ri-search-line absolute left-3 top-2.5 text-neutral-500"></i>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <Button
                      variant={selectedCategory === null ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      className="whitespace-nowrap"
                    >
                      All Categories
                    </Button>
                    
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="whitespace-nowrap"
                      >
                        <i className={`${category.icon} mr-1`}></i>
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Category Cards */}
                {!selectedCategory && !searchQuery && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {categories.map((category) => (
                      <Card 
                        key={category.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
                                <i className={`${category.icon} text-xl text-primary`}></i>
                              </div>
                              <div>
                                <h3 className="font-medium">{category.name}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{category.count} articles</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <i className="ri-arrow-right-line text-neutral-500"></i>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Articles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow overflow-hidden">
                      {article.image && (
                        <div className="h-40 overflow-hidden">
                          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <CardHeader className={article.image ? "pt-4 pb-2" : "pb-2"}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-primary bg-opacity-10 text-primary">
                            {article.category}
                          </Badge>
                          <DifficultyBadge level={article.difficulty} />
                        </div>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{article.description}</CardDescription>
                      </CardHeader>
                      
                      <CardFooter className="flex justify-between pt-0">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{article.date}</span>
                          <span className="mx-2">•</span>
                          <span>{article.readTime} read</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary">
                          Read More
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {filteredArticles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-20 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mb-4">
                      <i className="ri-file-search-line text-3xl text-neutral-500 dark:text-neutral-400"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Articles Found</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md mb-4">
                      We couldn't find any articles matching your search criteria. Try adjusting your filters or search term.
                    </p>
                    <Button onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </main>
          </div>
          
          <MobileNavigation />
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the educational content.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }
};

export default Education;
