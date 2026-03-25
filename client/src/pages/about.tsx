import React from "react";
import { Link } from "wouter";
import { InfoIcon, ShieldIcon, UsersIcon, HeartIcon, LandmarkIcon, BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-6">
          <InfoIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">About Act Up</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A cutting-edge civic engagement platform transforming citizen interaction with legislative processes through intelligent technology and user-centric design.
        </p>
      </section>

      {/* Our Mission Section */}
      <section className="mb-16 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-center">Our Mission</h2>
          <Separator className="mb-6" />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-48 h-48 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                <ShieldIcon className="h-24 w-24 text-blue-600" />
              </div>
            </div>
            <div className="md:w-2/3">
              <p className="text-lg text-gray-700 mb-4">
                At Act Up, we're not here to change the country — we're here so the country won't change us. 
                Our mission is to provide citizens with the tools, information, and community needed to preserve 
                their values and identity in the face of changing political landscapes.
              </p>
              <p className="text-lg text-gray-700">
                We believe that effective civic engagement begins with standing firm in your principles 
                while creating a space for others to do the same. Through education, technology, and 
                community, we empower individuals to engage with the legislative process in a way that 
                maintains personal integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <HeartIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Integrity</h3>
              <p className="text-gray-600">
                We believe in preserving your values and principles throughout civic engagement, never 
                compromising on core beliefs for political expediency.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <LandmarkIcon className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Civic Education</h3>
              <p className="text-gray-600">
                We're committed to demystifying the legislative process through accessible, 
                fact-based information that empowers informed citizen action.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <p className="text-gray-600">
                We foster a supportive environment where like-minded citizens can connect, share 
                strategies, and amplify their collective voice.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Approach</h2>
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <BookOpenIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold">Value-Centered Engagement</h3>
          </div>
          <p className="mb-6 text-gray-700">
            Unlike traditional civic platforms focused solely on changing policy, Act Up emphasizes preserving personal 
            and community values through the engagement process. We believe that meaningful change happens when 
            citizens participate from a place of conviction rather than compromise.
          </p>

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-lg border border-amber-200 mb-6">
            <p className="text-amber-800 italic font-medium">
              "I'm not doing this to change the country. I'm doing it so the country won't change me."
            </p>
            <p className="text-sm text-amber-600 mt-2">
              This perspective guides everything we do, reminding us that civic engagement is as much about 
              preserving what we value as it is about advocating for change.
            </p>
          </div>

          <p className="text-gray-700">
            Through our platform, we provide comprehensive tracking of Texas legislative data, AI-powered bill 
            analysis, centralized Points of Order tracking, and community-driven discussions that help citizens 
            navigate the complex landscape of state legislation while maintaining their integrity.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
        <p className="text-lg text-gray-600 mb-8">
          Ready to engage with Texas legislation in a way that preserves your values? Join Act Up today 
          and become part of a community committed to principled civic action.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Sign Up Now
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg">
              Explore Platform
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}