import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ArrowLeft, Clock, Wrench } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  feature?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title, 
  description, 
  feature 
}) => {
  const [location, navigate] = useLocation();
  
  const defaultTitle = title || `${feature || 'Feature'} Coming Soon`;
  const defaultDescription = description || 
    `We're working hard to bring you this feature. It will be available in a future update.`;

  return (
    <div className='p-4'>
      <div className="container mx-auto py-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Clock className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{defaultTitle}</h1>
            <p className="text-muted-foreground text-lg">{defaultDescription}</p>
          </div>
          
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Wrench className="h-5 w-5" />
                Under Development
              </CardTitle>
              <CardDescription>
                This feature is currently being developed and will be available soon.
                Check back in future updates!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Current Path: <code className="bg-background px-2 py-1 rounded">{location}</code>
              </p>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon; 