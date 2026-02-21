import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <Card className="max-w-md w-full overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
        <CardContent className="p-12 text-center">
          <div className="font-serif text-8xl text-gold/20 mb-4">404</div>
          <h1 className="text-2xl font-light text-charcoal mb-2">
            Page Not Found
          </h1>
          <p className="text-warm-gray mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="bg-charcoal hover:bg-charcoal-light text-cream">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-charcoal/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
