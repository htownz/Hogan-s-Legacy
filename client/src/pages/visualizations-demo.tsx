// @ts-nocheck
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedImpactChart from "@/components/visualizations/animated-impact-chart";
import AnimatedPassageGauge from "@/components/visualizations/animated-passage-gauge";
import AnimatedSupportTrend from "@/components/visualizations/animated-support-trend";
import { useState } from "react";
import { Link } from "wouter";
import { 
  InfoIcon, 
  ArrowRight, 
  LineChart, 
  Gauge, 
  TrendingUp, 
  Users, 
  BarChart4, 
  ChevronRight,
  Share2,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function VisualizationsDemoPage() {
  // Sample data for our visualizations
  const [billData] = useState({
    title: "TX-HB1234: Education Funding Reform Act",
    impactData: {
      personal: "medium" as const,
      family: "high" as const,
      community: "very-high" as const,
      statewide: "high" as const
    },
    passageProbability: 65,
    oddsDescription: "3 to 2 in favor",
    supportTrend: [
      { date: "2023-01-01", value: 42, label: "Jan" },
      { date: "2023-02-01", value: 45, label: "Feb" },
      { date: "2023-03-01", value: 51, label: "Mar" },
      { date: "2023-04-01", value: 49, label: "Apr" },
      { date: "2023-05-01", value: 55, label: "May" },
      { date: "2023-06-01", value: 62, label: "Jun" }
    ],
    oppositionTrend: [
      { date: "2023-01-01", value: 38, label: "Jan" },
      { date: "2023-02-01", value: 42, label: "Feb" },
      { date: "2023-03-01", value: 38, label: "Mar" },
      { date: "2023-04-01", value: 40, label: "Apr" },
      { date: "2023-05-01", value: 35, label: "May" },
      { date: "2023-06-01", value: 30, label: "Jun" }
    ]
  });

  // Sample data for secondary bill
  const [secondaryBillData] = useState({
    title: "TX-SB789: Transportation Infrastructure Bill",
    impactData: {
      personal: "high" as const,
      family: "medium" as const,
      community: "high" as const,
      statewide: "very-high" as const
    },
    passageProbability: 42,
    oddsDescription: "4 to 6 against",
    supportTrend: [
      { date: "2023-01-01", value: 35, label: "Jan" },
      { date: "2023-02-01", value: 38, label: "Feb" },
      { date: "2023-03-01", value: 43, label: "Mar" },
      { date: "2023-04-01", value: 45, label: "Apr" },
      { date: "2023-05-01", value: 41, label: "May" },
      { date: "2023-06-01", value: 42, label: "Jun" }
    ],
    oppositionTrend: [
      { date: "2023-01-01", value: 45, label: "Jan" },
      { date: "2023-02-01", value: 47, label: "Feb" },
      { date: "2023-03-01", value: 44, label: "Mar" },
      { date: "2023-04-01", value: 42, label: "Apr" },
      { date: "2023-05-01", value: 46, label: "May" },
      { date: "2023-06-01", value: 50, label: "Jun" }
    ]
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 10
      }
    }
  };

  const backgroundGradient = "bg-gradient-to-br from-primary/90 via-primary to-accent";
  
  return (
    <MainLayout>
      {/* Hero section with vibrant background */}
      <section className={`${backgroundGradient} text-white py-16 px-4 sm:px-6`}>
        <div className="container mx-auto">
          <motion.div 
            className="max-w-4xl mx-auto text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Visualize Democracy in Action
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Real-time, data-driven visualizations to empower civic engagement and track your impact
            </motion.p>
            <motion.div 
              className="flex justify-center gap-4 pt-4 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-primary-700 gap-2 font-semibold">
                  Back to Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/legislation">
                <Button size="lg" className="bg-white text-primary gap-2 hover:bg-white/90 font-semibold">
                  View All Legislation
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Statistics banner */}
      <section className="bg-gray-100 border-y border-gray-200 py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex flex-col items-center text-center"
              variants={itemVariants}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Gauge className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-primary">65%</h3>
              <p className="text-gray-600">Average Passage Rate</p>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center text-center"
              variants={itemVariants}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-primary">17,328</h3>
              <p className="text-gray-600">Super-Spreaders</p>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center text-center"
              variants={itemVariants}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-primary">25%</h3>
              <p className="text-gray-600">Tipping Point Progress</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto py-12 px-4 sm:px-6">
        <motion.div 
          className="mb-12 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-primary mb-4">Interactive Legislative Insights</h2>
          <p className="text-lg text-gray-600">
            Our advanced visualizations transform complex legislative data into actionable insights,
            helping you understand impact, track progress, and make informed decisions.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="space-y-8">
            <Card className="bg-white shadow-md overflow-hidden border-t-4 border-accent hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/10">
                    <BarChart4 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Personal Impact Analysis</CardTitle>
                    <CardDescription>
                      See how legislation affects you and your community
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <AnimatedImpactChart
                  billTitle={billData.title}
                  impacts={billData.impactData}
                  className="mb-4"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-sm text-gray-700 flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-accent" />
                    <span>
                      This visualization shows how legislation affects individuals, families, 
                      communities, and the state as a whole, with animated indicators that
                      highlight the most significant areas of impact.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md overflow-hidden border-t-4 border-accent hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/10">
                    <LineChart className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Community Support Trends</CardTitle>
                    <CardDescription>
                      Track changing support patterns over time
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <AnimatedSupportTrend
                  billTitle={billData.title}
                  supportData={billData.supportTrend}
                  oppositionData={billData.oppositionTrend}
                  className="mb-4"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-sm text-gray-700 flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-accent" />
                    <span>
                      This visualization illustrates how community support and opposition for 
                      legislation changes over time, with animated trend lines and data points
                      to highlight significant shifts in public opinion.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-white shadow-md overflow-hidden border-t-4 border-accent hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/10">
                    <Gauge className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Passage Probability Gauge</CardTitle>
                    <CardDescription>
                      See the likelihood of bill passage with betting odds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <AnimatedPassageGauge
                  billTitle={billData.title}
                  passageProbability={billData.passageProbability}
                  oddsDescription={billData.oddsDescription}
                  className="mb-4"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-sm text-gray-700 flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-accent" />
                    <span>
                      This visualization displays the calculated probability of a bill passing
                      into law, with an animated gauge and betting-style odds to provide
                      context on the likelihood of success.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md overflow-hidden border-t-4 border-accent hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/10">
                    <Share2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Comparative Analysis</CardTitle>
                    <CardDescription>
                      Compare passage probabilities across legislation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <AnimatedPassageGauge
                  billTitle={secondaryBillData.title}
                  passageProbability={secondaryBillData.passageProbability}
                  oddsDescription={secondaryBillData.oddsDescription}
                  className="mb-4"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-sm text-gray-700 flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-accent" />
                    <span>
                      Comparing multiple bills side-by-side helps users understand the relative
                      chances of different legislation passing, providing context for advocacy
                      and civic engagement priorities.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className={`${backgroundGradient} py-8 px-6 text-white text-center`}>
            <h2 className="text-2xl font-bold mb-2">Powered by Data, Driven by People</h2>
            <p className="text-lg opacity-90">
              How these visualizations revolutionize civic engagement
            </p>
          </div>
          
          <div className="bg-white p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div 
                className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-lg mb-2">Intuitive Understanding</h3>
                <p className="text-sm text-gray-700">
                  Animated visuals help users quickly grasp complex legislative data without
                  requiring technical knowledge or extensive reading.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-lg mb-2">Emotional Connection</h3>
                <p className="text-sm text-gray-700">
                  Motion graphics create an emotional response that helps users connect with
                  data and feel more invested in legislative outcomes.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <BarChart4 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-lg mb-2">Better Decision Making</h3>
                <p className="text-sm text-gray-700">
                  Clear, visually engaging data helps citizens make more informed decisions
                  about where to focus their civic engagement efforts.
                </p>
              </motion.div>
            </div>
            
            <div className="mt-8 text-center">
              <Button size="lg" className="gap-2 font-semibold">
                Join the Movement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}