// @ts-nocheck
      {/* Super User Roles Tabs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Find Your Path</Badge>
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Discover Your Super User Role</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Every great movement needs different types of change-makers. 
              Find your unique contribution to civic transformation.
            </p>
          </div>

          <Tabs defaultValue="catalyst" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="catalyst" className="text-sm sm:text-base">Catalyst</TabsTrigger>
              <TabsTrigger value="amplifier" className="text-sm sm:text-base">Amplifier</TabsTrigger>
              <TabsTrigger value="convincer" className="text-sm sm:text-base">Convincer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="catalyst">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Information Specialists</h3>
                  <p className="text-neutral-700 mb-6">
                    Knowledge-driven information specialists who research, verify, and share critical insights 
                    that fuel informed action. Catalysts power the movement with facts and analysis.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start bg-blue-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Research and verify information</span>
                        <p className="text-sm text-neutral-600 mt-1">Ensure all shared information is accurate and trustworthy</p>
                      </div>
                    </li>
                    <li className="flex items-start bg-blue-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Translate complex policies</span>
                        <p className="text-sm text-neutral-600 mt-1">Make legislative language accessible to everyone</p>
                      </div>
                    </li>
                    <li className="flex items-start bg-blue-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Build knowledge resources</span>
                        <p className="text-sm text-neutral-600 mt-1">Create guides and references for community education</p>
                      </div>
                    </li>
                  </ul>
                  <Button className="bg-blue-600 hover:bg-blue-700">Become a Catalyst</Button>
                </div>
                <div className="bg-blue-50 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4">Catalyst Impact</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Information Quality</span>
                          <span className="font-medium">97%</span>
                        </div>
                        <Progress value={97} className="h-2 bg-blue-200" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Knowledge Sharing</span>
                          <span className="font-medium">84%</span>
                        </div>
                        <Progress value={84} className="h-2 bg-blue-200" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Issue Analysis</span>
                          <span className="font-medium">92%</span>
                        </div>
                        <Progress value={92} className="h-2 bg-blue-200" />
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-blue-200">
                      <div className="font-medium mb-2">Primary Tools:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">Bill Tracking</Badge>
                        <Badge variant="outline" className="bg-white">Impact Analysis</Badge>
                        <Badge variant="outline" className="bg-white">Resource Library</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="amplifier">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Network className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Network Connectors</h3>
                  <p className="text-neutral-700 mb-6">
                    Network-building connectors who spread information and mobilize communities to 
                    create waves of coordinated civic action. Amplifiers grow the movement exponentially.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start bg-purple-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Expand action networks</span>
                        <p className="text-sm text-neutral-600 mt-1">Bring new members into the civic ecosystem</p>
                      </div>
                    </li>
                    <li className="flex items-start bg-purple-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Coordinate community advocacy</span>
                        <p className="text-sm text-neutral-600 mt-1">Organize groups for maximum collective impact</p>
                      </div>
                    </li>
                    <li className="flex items-start bg-purple-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Lead Action Circles</span>
                        <p className="text-sm text-neutral-600 mt-1">Create focused groups working toward specific goals</p>
                      </div>
                    </li>
                  </ul>
                  <Button className="bg-purple-600 hover:bg-purple-700">Become an Amplifier</Button>
                </div>
                <div className="bg-purple-50 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4">Amplifier Impact</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Network Growth</span>
                          <span className="font-medium">89%</span>
                        </div>
                        <Progress value={89} className="h-2 bg-purple-200" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Community Engagement</span>
                          <span className="font-medium">94%</span>
                        </div>
                        <Progress value={94} className="h-2 bg-purple-200" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coordination Efficiency</span>
                          <span className="font-medium">82%</span>
                        </div>
                        <Progress value={82} className="h-2 bg-purple-200" />
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-purple-200">
                      <div className="font-medium mb-2">Primary Tools:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">Action Circles</Badge>
                        <Badge variant="outline" className="bg-white">Network Dashboard</Badge>
                        <Badge variant="outline" className="bg-white">Community Forum</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="convincer">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="rounded-full bg-red-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Persuasive Storytellers</h3>
                  <p className="text-neutral-700 mb-6">
                    Persuasive storytellers who transform data into compelling narratives
                    that inspire action and drive civic participation. Convincers motivate people to act.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start bg-red-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Craft compelling narratives</span>
                        <p className="text-sm text-neutral-600 mt-1">Create stories that motivate action and participation</p>
                      </div>
                    </li>
                    <li className="flex items-start bg-red-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Persuade through personalization</span>
                        <p className="text-sm text-neutral-600 mt-1">Connect legislative issues to personal experiences</p>
                      </div>
                    </li>
                    <li className="flex items-start bg-red-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Inspire sustained action</span>
                        <p className="text-sm text-neutral-600 mt-1">Keep communities engaged and active over time</p>
                      </div>
                    </li>
                  </ul>
                  <Button className="bg-red-600 hover:bg-red-700">Become a Convincer</Button>
                </div>
                <div className="bg-red-50 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4">Convincer Impact</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Narrative Impact</span>
                          <span className="font-medium">93%</span>
                        </div>
                        <Progress value={93} className="h-2 bg-red-200" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Engagement Conversion</span>
                          <span className="font-medium">86%</span>
                        </div>
                        <Progress value={86} className="h-2 bg-red-200" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Message Reach</span>
                          <span className="font-medium">91%</span>
                        </div>
                        <Progress value={91} className="h-2 bg-red-200" />
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-red-200">
                      <div className="font-medium mb-2">Primary Tools:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">Story Builder</Badge>
                        <Badge variant="outline" className="bg-white">Impact Visuals</Badge>
                        <Badge variant="outline" className="bg-white">Message Testing</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Tipping Point Section with improved visualization */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <Badge className="mb-4">Our Goal</Badge>
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">The 25% Tipping Point</h2>
              <p className="text-lg text-neutral-700 mb-6">
                Research shows that when just 25% of a population actively adopts a new social standard, 
                it creates an unstoppable momentum toward systemic change.
              </p>
              <p className="text-neutral-600 mb-6">
                At Act Up, we're building a civic virus of transparency and accountability that spreads 
                exponentially through our Super User network, reshaping how citizens expect their 
                government to behave.
              </p>
              
              {/* Impact stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-primary/5 border-none">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-primary">8.2%</div>
                    <div className="text-sm text-neutral-600">Current Progress</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-none">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-primary">17,328</div>
                    <div className="text-sm text-neutral-600">Active Users</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-none">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-primary">4.3M</div>
                    <div className="text-sm text-neutral-600">Citizens Reached</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-none">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-primary">2.4x</div>
                    <div className="text-sm text-neutral-600">Growth Rate</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="pb-2 border-b">
                  <CardTitle>Movement Growth Visualization</CardTitle>
                  <CardDescription>Tracking progress to our 25% tipping point goal</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Tipping Point Visualization */}
                  <div className="relative h-64">
                    {/* Background grid */}
                    <div className="absolute inset-0">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 0 0 L 40 0 40 40 0 40 Z" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                    
                    {/* 25% Tipping point line */}
                    <div className="absolute top-0 left-[25%] h-full w-0.5 bg-orange-500 z-10">
                      <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium text-sm">
                        25% Tipping Point
                      </div>
                    </div>
                    
                    {/* Progress curve */}
                    <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Area under curve */}
                      <path d="M0,100 C10,95 15,90 25,80 S40,65 50,50 S70,25 90,10 L100,10 L100,100 Z" 
                        fill="rgba(59, 130, 246, 0.1)" />
                      
                      {/* Curve line */}
                      <path d="M0,100 C10,95 15,90 25,80 S40,65 50,50 S70,25 90,10" 
                        fill="none" stroke="#3b82f6" strokeWidth="2" />
                      
                      {/* Current position dot */}
                      <circle cx="8.2" cy="95" r="2" fill="#3b82f6" />
                    </svg>
                    
                    {/* Current progress marker */}
                    <div className="absolute top-[95%] left-[8.2%] transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                      <div className="absolute -mt-8 -ml-6 bg-white shadow px-2 py-1 rounded text-xs font-medium">
                        We are here
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-600">Overall Progress</span>
                      <span className="text-sm font-medium text-primary">8.2%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="h-full bg-primary rounded-full" style={{width: '8.2%'}}></div>
                      <div className="absolute top-0 left-[25%] h-full w-0.5 bg-orange-500">
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-[10px] text-orange-600 font-medium">
                          Goal
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 pb-4 flex justify-center">
                  <Link href={user ? "/dashboard" : "/register"}>
                    <Button className="w-full">
                      {user ? "View Your Impact" : "Join the Movement"} 
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>